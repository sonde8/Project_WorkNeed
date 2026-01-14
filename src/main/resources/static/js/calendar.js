(function () {
    const API_BASE = "/api/calendar";
    const SCHEDULE_API = `${API_BASE}/schedules`;

    const DEFAULT_CREATED_BY =
        (window.USER_ID ?? window.createdBy ?? window.LOGIN_USER_ID ?? 1);

    let calendar = null;
    let allEventsCache = [];
    let currentFilter = "ALL";
    let currentViewType = "dayGridMonth";
    let currentViewStart = null;
    let currentViewEnd = null;


    /* ================= Utils ================= */
    const pad = (n) => String(n).padStart(2, "0");

    function toDtoDateTime(date) {
        const d = new Date(date);
        return (
            `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
            `T${pad(d.getHours())}:${pad(d.getMinutes())}:00`
        );
    }

    function addMinutes(date, mins) {
        const d = new Date(date);
        d.setMinutes(d.getMinutes() + mins);
        return d;
    }

    function getSource(dto) {
        return (dto?.source || "CALENDAR").toString().toUpperCase();
    }

    function isScheduleSource(dto) {
        return getSource(dto) === "SCHEDULE";
    }

    function matchFilter(dto) {
        const type = (dto?.type || "").toString().toUpperCase();
        const source = getSource(dto); // CALENDAR | SCHEDULE

        // 전체
        if (currentFilter === "ALL") return true;

        // 개인: 캘린더에서 등록한 PERSONAL만
        if (currentFilter === "PERSONAL") {
            return source === "CALENDAR" && type === "PERSONAL";
        }

        // 업무:
        // 1) 칸반에서 온 모든 일정
        // 2) 캘린더에서 등록한 회사(COMPANY) 일정 (관리자만 접근가능)
        if (currentFilter === "WORK") {
            return (
                source === "SCHEDULE" ||
                (source === "CALENDAR" && type === "COMPANY")
            );
        }

        return true;
    }

    function safeOpenCreateModal(dtoLike) {
        if (typeof window.openCalendarCreateModal !== "function") {
            console.error("[calendar.js] openCalendarCreateModal not loaded");
            return;
        }
        window.openCalendarCreateModal(dtoLike);
    }

    function safeOpenDetailModal(dto) {
        if (typeof window.openCalendarDetailModal !== "function") {
            console.error("[calendar.js] openCalendarDetailModal not loaded");
            return;
        }
        window.openCalendarDetailModal(dto);
    }

    function normalizeDtoDates(dto) {
        // 서버가 "YYYY-MM-DDTHH:mm" 또는 "YYYY-MM-DDTHH:mm:ss" 등으로 줄 수 있으니 안전하게 처리
        const start = dto?.start ? new Date(dto.start) : null;
        let end = dto?.end ? new Date(dto.end) : null;

        if (start && !end) end = addMinutes(start, 30);

        return { start, end };
    }

    function getEventColor(dto) {
        const type = (dto?.type || "").toString().toUpperCase();
        const source = getSource(dto); // CALENDAR | SCHEDULE

        // =========================================================
        // 1. [SCHEDULE] 업무 일정 (스케줄 연동)
        // =========================================================
        if (source === "SCHEDULE") {
            if (type === "PERSONAL") {
                return "rgba(11, 46, 79, 0.35)"; // 업무-개인
            }
            if (type === "TEAM") {
                return "rgba(11, 46, 79, 0.7)"; // 업무-팀
            }
            if (type === "COMPANY") {
                return "rgba(11, 46, 79, 0.95)"; // 업무-회사
            }
            // 예외(타입 없는 경우) 처리
            return "rgba(11, 46, 79, 0.35)";
        }

        // =========================================================
        // 2. [CALENDAR] 캘린더 일정
        // =========================================================
        // 2-1. 관리자가 등록한 회사 전체 일정
        if (type === "COMPANY") {
            return "rgb(49, 46, 129)";
        }

        // 2-2. 내 개인 일정
        // 사용자가 등록/수정 시 직접 지정한 색상(dto.color)이 있으면 최우선
        if (dto?.color) {
            return dto.color;
        }

        // 지정 안 했으면 기본 파랑
        return "rgb(30, 64, 175)";
    }

    function getCategoryInfo(dto) {
        const type = (dto?.type || "").toUpperCase();
        const source = getSource(dto);

        // 1. [SCHEDULE] 업무 연동
        if (source === "SCHEDULE") {
            if (type === "COMPANY") {
                // 업무-회사: 가장 진한 무게감 (opacity 0.25)
                return { text: "업무(회사)", bg: "rgba(11, 46, 79, 0.25)", color: "rgb(11, 46, 79)" };
            }
            if (type === "TEAM") {
                // 업무-팀: 중간 무게감 (opacity 0.15)
                return { text: "업무(팀)", bg: "rgba(11, 46, 79, 0.15)", color: "rgb(11, 46, 79)" };
            }
            // 업무-개인: 가장 가벼운 무게감 (opacity 0.08)
            return { text: "업무(개인)", bg: "rgba(11, 46, 79, 0.08)", color: "rgb(11, 46, 79)" };
        }

        // 2. [CALENDAR] 내장 캘린더
        if (type === "COMPANY") {
            return { text: "사내공지", bg: "rgba(49, 46, 129, 0.15)", color: "rgb(49, 46, 129)" };
        }

        // 개인 (기본)
        return { text: "개인", bg: "rgba(30, 64, 175, 0.1)", color: "rgb(30, 64, 175)" };
    }

    function getDtoId(dto) {
        // 캘린더: calendarId
        // 스케줄: id (AS id) 또는 scheduleId
        return dto?.calendarId ?? dto?.id ?? dto?.scheduleId ?? null;
    }

    /* ================= API ================= */
    async function apiGetEvents() {
        const res = await fetch(API_BASE);
        if (!res.ok) {
            console.error("[calendar.js] GET failed:", res.status);
            return [];
        }
        return res.json();
    }

    async function apiGetScheduleEvents() {
        // 스케줄 연동 API
        const res = await fetch(SCHEDULE_API);
        if (!res.ok) {
            console.warn("[calendar.js] SCHEDULE GET failed:", res.status);
            return [];
        }
        return res.json();
    }

    async function apiUpdateEvent(id, dtoPayload) {
        const res = await fetch(`${API_BASE}/${id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(dtoPayload),
        });
        if (!res.ok) console.error("[calendar.js] PUT failed:", res.status);
        return res.ok;
    }

    function normalizeEvent(dto) {
        const { start, end } = normalizeDtoDates(dto);
        if (!start) return null;

        const source = getSource(dto);
        const type = (dto?.type || "").toString().toUpperCase();
        const isSchedule = source === "SCHEDULE";
        const id = getDtoId(dto);
        if (!id) return null;

        let forceAllDay = (type === "COMPANY" && !isSchedule);
        if (end && start.toDateString() !== end.toDateString()) {
            forceAllDay = true;
        }

        const color = getEventColor(dto);

        /* ================= 종일 일정 (상단 바) ================= */
        if (forceAllDay) {
            const s = new Date(start);
            s.setHours(0,0,0,0);

            let e = end ? new Date(end) : new Date(s);

            if (e.getHours() > 0 || e.getMinutes() > 0) {
                e.setDate(e.getDate() + 1);
                e.setHours(0,0,0,0);
            } else {
                // 00:00 딱 떨어지는 종료라면 날짜 조정 로직에 맡김
                if (s.getTime() === e.getTime()) {
                    e.setDate(e.getDate() + 1);
                }
            }

            // FullCalendar는 end 날짜가 'exclusive(미포함)'이므로
            // 23일 00:00으로 설정해야 22일까지 색칠됩니다.
            return {
                id: String(id),
                title: dto.title || "(제목 없음)",
                start: s,
                end: e,
                allDay: true, // 강제 상단 고정
                backgroundColor: color,
                borderColor: "transparent",
                textColor: "#ffffff",
                editable: !isSchedule,
                extendedProps: { raw: dto },
            };
        }

        /* ================= 시간 일정 (Time Grid) ================= */
        // 당일 시간 일정만 여기로 옴
        const fixedEnd = end ? new Date(end) : addMinutes(start, 30);
        const editable = !isSchedule;

        return {
            id: String(id),
            title: dto.title || "(제목 없음)",
            start,
            end: fixedEnd,
            allDay: false,
            backgroundColor: color,
            borderColor: "white",
            textColor: "#ffffff",
            editable,
            extendedProps: { raw: dto },
        };
    }

    /* ================= Daily List Modal Logic ================= */
    function openDailyListModal(targetDate) {
        const overlay = document.getElementById("calendarDailyListModalOverlay");
        const titleEl = document.getElementById("dailyListTitle");
        const listUl = document.getElementById("dailyEventList");
        const emptyMsg = document.getElementById("dailyListEmptyMsg");
        const addBtn = document.getElementById("dailyListAddBtn");
        const closeBtn = document.getElementById("closeDailyListBtn");

        if (!overlay) return;

        // 1. 날짜 범위 설정
        const baseDate = new Date(targetDate);
        baseDate.setHours(0, 0, 0, 0);
        const nextDate = new Date(baseDate);
        nextDate.setDate(baseDate.getDate() + 1);

        // 2. 헤더 제목 설정
        titleEl.textContent = `${baseDate.getFullYear()}년 ${baseDate.getMonth() + 1}월 ${baseDate.getDate()}일`;

        // 3. 해당 날짜 일정 필터링
        const dailyEvents = allEventsCache.filter(e => {
            if (!e.start) return false;
            if (typeof matchFilter === "function" && !matchFilter(e)) return false;

            const s = new Date(e.start);
            const ed = e.end ? new Date(e.end) : addMinutes(s, 30);
            return s < nextDate && ed >= baseDate;
        });

        // 4. 리스트 렌더링
        listUl.innerHTML = "";

        if (dailyEvents.length === 0) {
            emptyMsg.classList.remove("hidden");
        } else {
            emptyMsg.classList.add("hidden");

            // 시간순 정렬
            dailyEvents.sort((a, b) => new Date(a.start) - new Date(b.start));

            dailyEvents.forEach(e => {
                const li = document.createElement("li");
                const category = getCategoryInfo(e);

                const sTime = new Date(e.start);
                const eTime = e.end ? new Date(e.end) : addMinutes(sTime, 30);

                const startStr = `${pad(sTime.getHours())}:${pad(sTime.getMinutes())}`;
                const endStr = `${pad(eTime.getHours())}:${pad(eTime.getMinutes())}`;
                const timeRange = `${startStr} ~ ${endStr}`;

                li.innerHTML = `
                <span class="category-badge" style="background-color: ${category.bg}; color: ${category.color};">
                    ${category.text}
                </span>
                <div style="flex:1;">
                    <div style="font-weight:bold; font-size:1rem; color:#333; margin-bottom:2px;">${e.title || "(제목 없음)"}</div>
                    <div style="font-size:0.85rem; color:#666;">${timeRange}</div>
                </div>
                `;

                li.onclick = () => {
                    hideDailyListModal();
                    safeOpenDetailModal(e);
                };
                listUl.appendChild(li);
            });
        }

        const hideDailyListModal = () => {
            const externalAddBtn = document.getElementById("openCalendarCreateModal");
            if (externalAddBtn) {
                externalAddBtn.focus();
            } else if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
            }
            overlay.classList.add("hidden");
            overlay.setAttribute("aria-hidden", "true");
        };

        closeBtn.onclick = () => {
            hideDailyListModal();
        };

        addBtn.onclick = () => {
            const startAt = new Date(baseDate);
            startAt.setHours(9, 0, 0);
            const endAt = new Date(startAt);
            endAt.setMinutes(30);

            hideDailyListModal();

            safeOpenCreateModal({
                start: toDtoDateTime(startAt),
                end: toDtoDateTime(endAt)
            });
        };

        overlay.classList.remove("hidden");
        overlay.setAttribute("aria-hidden", "false");

        const handleEsc = (e) => {
            if (e.key === "Escape" && !overlay.classList.contains("hidden")) {
                hideDailyListModal();
                document.removeEventListener("keydown", handleEsc);
            }
        };
        document.addEventListener("keydown", handleEsc);

        overlay.onclick = (e) => {
            if (e.target === overlay) {
                hideDailyListModal();
                document.removeEventListener("keydown", handleEsc);
            }
        };
    }
    /* ================= Split View Logic (New) ================= */
    // 1. 화면 모드 전환 (Month <-> Week/Day)
    function toggleSplitView(viewType) {
        currentViewType = viewType;
        const container = document.querySelector('.calendar-right-container');
        const calendarSection = document.getElementById('calendarViewSection');
        const workSection = document.getElementById('workListSection');
        const rangeLabel = document.getElementById('workListRangeLabel');

        // 만약 ID가 없다면 클래스로 선택 (안전장치)
        const targetCalSection = calendarSection || document.querySelector('.calendar-view-section');

        if (viewType === 'dayGridMonth') {
            /* MONTH VIEW */
            // 1. 애니메이션 끄기 (no-transition 추가)
            if (targetCalSection) targetCalSection.classList.add('no-transition');
            if (workSection) workSection.classList.add('no-transition');

            // 2. 클래스 즉시 변경 (레이아웃 원복)
            if (container) container.classList.remove('split-mode');
            if (workSection) workSection.classList.add('hidden');

            // 3. 캘린더 크기 즉시 재계산 (딜레이 없음)
            if (calendar) calendar.updateSize();

            // 4. 다음번 애니메이션을 위해 0.05초 뒤에 no-transition 제거
            setTimeout(() => {
                if (targetCalSection) targetCalSection.classList.remove('no-transition');
                if (workSection) workSection.classList.remove('no-transition');
            }, 50);

        } else {
            /* WEEK/DAY VIEW */

            // 애니메이션 켜져 있는지 확인 (혹시 모르니 no-transition 제거)
            if (targetCalSection) targetCalSection.classList.remove('no-transition');
            if (workSection) workSection.classList.remove('no-transition');

            if (container) container.classList.add('split-mode');
            if (workSection) workSection.classList.remove('hidden');

            // 날짜 텍스트 업데이트
            if (currentViewStart && currentViewEnd && rangeLabel) {
                const s = currentViewStart;
                const e = new Date(currentViewEnd);
                e.setDate(e.getDate() - 1);

                const sStr = `${s.getMonth()+1}.${s.getDate()}`;
                const eStr = `${e.getMonth()+1}.${e.getDate()}`;

                if (viewType === 'timeGridDay') {
                    rangeLabel.textContent = `(${sStr})`;
                } else {
                    rangeLabel.textContent = `(${sStr} ~ ${eStr})`;
                }
            }

            // 애니메이션(0.4s)이 끝난 직후 크기 재계산
            setTimeout(() => {
                if (calendar) calendar.updateSize();
            }, 420);
        }
    }

    // 2. 하단 업무 리스트 렌더링
    function renderWorkScheduleList() {
        const ul = document.getElementById('workScheduleList');
        const emptyMsg = document.getElementById('workListEmptyMsg');

        if (currentViewType === 'dayGridMonth' || !ul) return;

        ul.innerHTML = "";

        // 1) 필터링
        const workEvents = allEventsCache.filter(e => {
            if (currentFilter === 'PERSONAL') return false;
            const isWork = isScheduleSource(e) || (e.type === 'COMPANY');
            if (!isWork) return false;

            const s = new Date(e.start);
            const ed = e.end ? new Date(e.end) : addMinutes(s, 30);
            return s < currentViewEnd && ed > currentViewStart;
        });

        // 2) 정렬
        workEvents.sort((a, b) => new Date(a.start) - new Date(b.start));

        // 3) 렌더링
        if (workEvents.length === 0) {
            if (emptyMsg) emptyMsg.classList.remove('hidden');
        } else {
            if (emptyMsg) emptyMsg.classList.add('hidden');

            const days = ['일','월','화','수','목','금','토'];

            workEvents.forEach(e => {
                const li = document.createElement('li');
                li.className = 'work-item';

                const startObj = new Date(e.start);
                const endObj = e.end ? new Date(e.end) : addMinutes(startObj, 30);

                const sMonth = startObj.getMonth() + 1;
                const sDate = startObj.getDate();
                const sDay = days[startObj.getDay()];
                const sTime = `${pad(startObj.getHours())}:${pad(startObj.getMinutes())}`;

                const eMonth = endObj.getMonth() + 1;
                const eDate = endObj.getDate();
                const eDay = days[endObj.getDay()];
                const eTime = `${pad(endObj.getHours())}:${pad(endObj.getMinutes())}`;

                let dateHtml = "";

                // A. 당일 일정 (1.5(월) / 12:00 ~ 14:00)
                if (sMonth === eMonth && sDate === eDate) {
                    dateHtml = `
                        <span class="w-date">${sMonth}.${sDate}(${sDay})</span>
                        <span class="w-date">${sTime} ~ ${eTime}</span>
                    `;
                }
                // B. 다일 일정 (1.5(월) 12:00 ~ / 1.7(수) 14:00)
                else {
                    dateHtml = `
                        <span class="w-date">${sMonth}.${sDate}(${sDay}) ${sTime} ~</span>
                        <span class="w-date">${eMonth}.${eDate}(${eDay}) ${eTime}</span>
                    `;
                }

                // 뱃지 설정
                const cat = getCategoryInfo(e);

                li.innerHTML = `
                    <div class="work-time-box"> 
                        ${dateHtml}
                    </div>
                    <div class="work-info-box">
                        <span class="w-badge" style="background-color: ${cat.bg}; color: ${cat.color};">
                            ${cat.text}
                        </span>
                        <span class="w-title">${e.title || '(제목 없음)'}</span>
                    </div>
                `;

                li.onclick = () => safeOpenDetailModal(e);
                ul.appendChild(li);

                li.onclick = () => safeOpenDetailModal(e);
                ul.appendChild(li);
            });
        }
    }
    function initCalendar() {
        const el = document.getElementById("calendar");
        if (!el) {
            console.error("[calendar.js] #calendar not found");
            return;
        }

        calendar = new FullCalendar.Calendar(el, {
            locale: "ko",
            initialView: "dayGridMonth",
            googleCalendarApiKey: window.GOOGLE_CALENDAR_API_KEY,

            height: '100%',
            expandRows: true,
            dayMaxEvents: true,
            fixedWeekCount: false,
            eventDisplay: 'block',

            slotEventOverlap: false,
            slotMinWidth: 100,
            eventBorderColor: '#fff',

            // [공휴일 설정]
            eventSources: [
                {
                    googleCalendarId: 'ko.south_korea#holiday@group.v.calendar.google.com',
                    className: 'korean-holiday',
                    color: 'transparent',
                    textColor: '#ef4444',
                    editable: false,
                    display: 'block'
                }
            ],
            eventDataTransform: function(eventDef) {
                if (eventDef.url || (eventDef.source && eventDef.source.googleCalendarId)) {
                    const notRedDays = ["어버이날", "스승의날", "제헌절", "국군의 날", "식목일", "발렌타인", "화이트", "할로윈", "빼빼로", "동지", "초복", "중복", "말복", "입춘", "소한", "대한", "칠석", "단오", "근로자의 날"];
                    const title = eventDef.title || "";
                    eventDef.className = "holiday-event";
                    if (notRedDays.some(keyword => title.includes(keyword))) {
                        eventDef.textColor = '#10b981';
                    }
                }
                return eventDef;
            },

            // [뷰 변경 감지]
            datesSet: function(info) {
                currentViewType = info.view.type;
                currentViewStart = info.start;
                currentViewEnd = info.end;

                toggleSplitView(currentViewType);

                if (allEventsCache.length > 0) {
                    renderCalendarEventsOnly();
                    renderWorkScheduleList();
                }
            },

            moreLinkClick: function(info) {
                openDailyListModal(info.date);
                return "void";
            },
            dayCellDidMount: function(info) {
                if (info.date.getDay() === 0) {
                    const numberEl = info.el.querySelector('.fc-daygrid-day-number');
                    if (numberEl) numberEl.style.color = '#e03131';
                }
            },
            selectable: true,
            selectMirror: true,
            editable: true,
            allDaySlot: true,

            headerToolbar: {
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
            },

            select(info) {

                const startStr = toDtoDateTime(info.start);
                const endStr = info.end
                    ? toDtoDateTime(info.end)
                    : toDtoDateTime(addMinutes(info.start, 30));

                // 1. 월간 뷰(Month)일 때
                if (calendar.view.type === "dayGridMonth") {
                    const diffTime = info.end.getTime() - info.start.getTime();
                    const diffDays = diffTime / (1000 * 60 * 60 * 24);

                    // 1일 초과 드래그 (다일 일정) -> 등록 모달 띄우기
                    if (diffDays > 1) {
                        safeOpenCreateModal({
                            start: startStr,
                            end: endStr,
                        });
                    } else {
                        // 1일 클릭 (단일 일정) -> 상세 리스트 모달 띄우기
                        openDailyListModal(info.start);
                    }
                    calendar.unselect();
                    return;
                }

                // 2. 주간/일간 뷰(Week/Day)일 때 -> 바로 등록 모달
                safeOpenCreateModal({
                    start: startStr,
                    end: endStr
                });
                calendar.unselect();
            },

            eventClick(info) {
                if (info.event.url) {
                    info.jsEvent.preventDefault();
                    return;
                }
                const raw = info.event.extendedProps?.raw;
                if (raw) {
                    safeOpenDetailModal(raw);
                }
            },

            eventDrop(info) {
                const raw = info.event.extendedProps?.raw;
                if (checkReadOnly(raw)) { info.revert(); return; }
                syncEvent(info.event);
            },

            eventResize(info) {
                const raw = info.event.extendedProps?.raw;
                if (checkReadOnly(raw)) { info.revert(); return; }
                syncEvent(info.event);
            },
        });

        calendar.render();
    }

    // 읽기 전용 체크
    function checkReadOnly(raw) {
        if (raw && isScheduleSource(raw)) {
            alert("업무 일정은 캘린더에서 변경할 수 없습니다.");
            return true;
        }
        if (raw?.type === "COMPANY") {
            alert("회사 전체 일정은 변경할 수 없습니다.");
            return true;
        }
        return false;
    }

    async function syncEvent(fcEvent) {
        const raw = fcEvent?.extendedProps?.raw;
        if (raw && isScheduleSource(raw)) return;
        if (!raw?.calendarId) return;

        const start = fcEvent.start;
        const end = fcEvent.end ? fcEvent.end : addMinutes(start, 30);

        const payload = {
            calendarId: raw.calendarId,
            createdBy: raw.createdBy ?? DEFAULT_CREATED_BY,
            title: fcEvent.title ?? raw.title ?? "",
            description: raw.description ?? "",
            start: toDtoDateTime(start),
            end: toDtoDateTime(end),
            type: raw.type ?? "PERSONAL",
            color: raw.color ?? fcEvent.backgroundColor ?? "#3b82f6",
        };

        const ok = await apiUpdateEvent(raw.calendarId, payload);

        if (ok) {
            raw.title = payload.title;
            raw.start = payload.start;
            raw.end = payload.end;
            raw.type = payload.type;
            raw.color = payload.color;
            raw.createdBy = payload.createdBy;
        }
        await loadCalendarEvents();
    }

    /* ================= Load & Render (Modified) ================= */
    // 1. 서버에서 데이터 가져오기 (Entry Point)
    async function loadCalendarEvents() {
        if (!calendar) return;

        // 캘린더 + 업무 스케줄 로드
        const [calendarData, scheduleData] = await Promise.all([
            apiGetEvents(),
            apiGetScheduleEvents(),
        ]);

        const calArr = Array.isArray(calendarData) ? calendarData : [];
        const schArr = Array.isArray(scheduleData) ? scheduleData : [];

        // source 보정
        const normalizedCalendarDtos = calArr.map((e) => ({ ...e, source: getSource(e) }));
        const normalizedScheduleDtos = schArr.map((e) => ({ ...e, source: "SCHEDULE" }));

        // 캐시 업데이트
        allEventsCache = [...normalizedCalendarDtos, ...normalizedScheduleDtos];

        // 뷰 렌더링 실행
        renderCalendarEventsOnly();
        renderWorkScheduleList();
        renderTodayList();
        renderWeekPreview();
    }

    // 2. FullCalendar 내부 이벤트 렌더링 전용
    function renderCalendarEventsOnly() {
        if (!calendar) return;

        // 기존 이벤트 제거 (구글 공휴일 등 외부 소스 제외)
        const currentEvents = calendar.getEvents();
        currentEvents.forEach(ev => {
            if (ev.extendedProps && ev.extendedProps.raw) {
                ev.remove();
            }
        });

        // 캘린더에 표시할 이벤트 필터링
        const eventsToShow = allEventsCache.filter(e => {
            // [공통 필터] 삭제된 일정 등 기본 체크가 필요하다면 여기서 수행

            // [View 타입에 따른 분기]
            if (currentViewType === 'dayGridMonth') {
                // Month 뷰: 기존 필터(All/Work/Personal)를 따름
                return matchFilter(e);
            } else {
                // Week/Day 뷰:
                // 캘린더 영역에는 '개인' 일정만 표시 (업무는 하단 리스트로 빠짐)

                // 만약 사용자가 필터에서 'WORK'(업무만 보기)를 찍었다면? -> 캘린더는 비어야 함
                if (currentFilter === 'WORK') return false;

                // 그 외(ALL, PERSONAL)의 경우:
                // 업무 일정(SCHEDULE 소스이거나 type=COMPANY)은 캘린더에서 숨김
                const isWork = isScheduleSource(e) || (e.type === 'COMPANY');
                if (isWork) return false;

                // 순수 개인 일정만 통과
                return true;
            }
        });

        // FullCalendar 형식으로 변환 후 추가
        eventsToShow
            .map(normalizeEvent)
            .filter(Boolean)
            .forEach((ev) => calendar.addEvent(ev));
    }

    /* ================= Today List ================= */
    function renderTodayList() {
        const ul = document.getElementById("todayList");
        const emptyMsg = document.getElementById("todayEmptyMsg");

        const headerTitle = document.getElementById("today-title");
        if (headerTitle) {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, "0");
            const day = String(now.getDate()).padStart(2, "0");
            const dateStr = `${year}.${month}.${day}`;
            const existingSuffix = headerTitle.querySelector(".today-date-suffix");
            const suffixHtml = ` <span class="today-date-suffix" style="font-size:0.8em; color:#888; font-weight:normal;">(${dateStr})</span>`;

            if (existingSuffix) {
                existingSuffix.innerHTML = `(${dateStr})`;
            } else {
                headerTitle.innerHTML += suffixHtml;
            }
        }

        if (!ul) return;

        ul.innerHTML = "";

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        const todayEvents = allEventsCache
            .filter((e) => {
                const s = e.start ? new Date(e.start) : null;
                const ed = e.end ? new Date(e.end) : null;
                if (!s) return false;

                const end = ed || addMinutes(s, 30);
                return s <= todayEnd && end >= todayStart;
            })
            .sort((a, b) => new Date(a.start) - new Date(b.start));

        if (todayEvents.length === 0) {
            if (emptyMsg) emptyMsg.classList.remove("hidden");
        } else {
            if (emptyMsg) emptyMsg.classList.add("hidden");

            todayEvents.forEach((e) => {
                const li = document.createElement("li");
                const category = getCategoryInfo(e);

                li.innerHTML = `
                <span class="category-badge" style="background-color: ${category.bg}; color: ${category.color};">
                    ${category.text}
                </span>
                
                <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                    ${e.title || "(제목 없음)"}
                </span>
            `;

                li.onclick = () => safeOpenDetailModal(e);
                ul.appendChild(li);
            });
        }
    }

    /* ================= Week Preview (Mon-Sun) ================= */
    function renderWeekPreview() {
        const now = new Date();
        const todayStr = toDtoDateTime(now).split('T')[0]; // "YYYY-MM-DD"

        // 1. 이번 주 월요일 ~ 일요일 구하기
        const currentDay = now.getDay(); // 0(일) ~ 6(토)
        // 일요일(0)이면 7로 취급하여 지난 월요일을 찾음
        const distToMon = currentDay === 0 ? 6 : currentDay - 1;

        const monday = new Date(now);
        monday.setDate(now.getDate() - distToMon);
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        // 2. 카운트 변수 초기화
        let workDueToday = 0;
        let workDueWeek = 0;
        let personalWeek = 0;

        // 3. 전체 일정 순회하며 집계
        allEventsCache.forEach(e => {
            if (!e.start) return;

            const source = getSource(e); // 'SCHEDULE' or 'CALENDAR'
            const type = (e.type || "").toUpperCase();

            const startDate = new Date(e.start);
            // end가 없으면 start + 30분으로 간주
            const endDate = e.end ? new Date(e.end) : addMinutes(startDate, 30);

            // 날짜 비교용 문자열 (YYYY-MM-DD)
            const endDateStr = toDtoDateTime(endDate).split('T')[0];

            /* --- [업무] 로직: 스케줄 소스 --- */
            if (source === 'SCHEDULE') {
                // 1) 오늘 마감: 마감일이 오늘 날짜와 같음 (시간 무관, 날짜만 비교)
                if (endDateStr === todayStr) {
                    workDueToday++;
                }

                // 2) 이번 주 마감: 마감일이 월~일 사이에 포함됨
                if (endDate >= monday && endDate <= sunday) {
                    workDueWeek++;
                }
            }

            /* --- [개인] 로직: 캘린더 소스 & PERSONAL 타입 --- */
            else if (source === 'CALENDAR' && type === 'PERSONAL') {
                // 이번 주 일정: 시작일이 월~일 사이에 있거나, 기간이 겹치는 경우
                // 간단하게 '시작일'이 이번 주 안에 있는 것으로 카운트
                if (startDate >= monday && startDate <= sunday) {
                    personalWeek++;
                }
            }
        });

        // 4. UI 업데이트
        // 업무
        updateText("#workDueTodayCount", `${workDueToday}건`);
        updateText("#workDueWeekCount", `${workDueWeek}건`);

        // 오늘 마감 있으면 경고 아이콘 표시
        const warningIcon = document.getElementById("workDueWarning");
        if (warningIcon) {
            if (workDueToday > 0) warningIcon.classList.remove("hidden");
            else warningIcon.classList.add("hidden");
        }

        // 개인
        updateText("#personalWeekCount", `${personalWeek}건`);
    }

    function updateText(selector, text) {
        const el = document.querySelector(selector);
        if (el) el.textContent = text;
    }

    /* ================= UI Bind ================= */
    function bindUI() {
        if (bindUI._bound) return;
        bindUI._bound = true;

        // 일정 등록 버튼
        const addBtn =
            document.getElementById("openCalendarCreateModal") ||
            document.querySelector(".schedule-add-btn");

        addBtn?.addEventListener("click", () => safeOpenCreateModal({}));

        // 필터
        document.querySelectorAll("input[name='scheduleFilter']").forEach((r) => {
            r.addEventListener("change", () => {
                currentFilter = r.value; // ALL / PERSONAL / WORK
                loadCalendarEvents();
            });
        });
    }

    /* ================= Init ================= */
    document.addEventListener("DOMContentLoaded", () => {
        initCalendar();
        bindUI();
        loadCalendarEvents();

        // 모달/디테일에서 재호출용
        window.loadCalendarEvents = loadCalendarEvents;
    });
})();
