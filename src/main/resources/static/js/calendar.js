(function () {
    const API_BASE = "/api/calendar";
    const SCHEDULE_API = `${API_BASE}/schedules`; // 서버에 추가한 일정연동 API

    // createdBy가 DB NOT NULL이면 반드시 필요할 수 있음.
    // 1) 서버가 세션으로 세팅한다면 이 값은 무시될 수 있고,
    // 2) 서버가 반드시 요구한다면 아래 기본값이 안전장치가 됨.
    const DEFAULT_CREATED_BY =
        (window.USER_ID ?? window.createdBy ?? window.LOGIN_USER_ID ?? 1);

    let calendar = null;
    let allEventsCache = [];
    let currentFilter = "ALL";
    let currentViewType = "dayGridMonth"; // 현재 뷰 상태 추적
    let currentViewStart = null;          // 현재 뷰 시작일
    let currentViewEnd = null;            // 현재 뷰 종료일


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
        // 기존 캘린더 일정은 source가 없으니 CALENDAR로 보정
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
        //    - 업무는 DB가 다르므로 커스텀 색상(dto.color)보다 타입별 지정 색상이 우선됨
        // =========================================================
        if (source === "SCHEDULE") {
            if (type === "PERSONAL") {
                return "#3b82f6"; // 업무-개인 (기본 파랑)
            }
            if (type === "TEAM") {
                return "#22c55e"; // 업무-팀 (초록)
            }
            if (type === "COMPANY") {
                return "#ef4444"; // 업무-회사 (빨강)
            }
            // 예외(타입 없는 경우) 처리: 업무 기본색(여기선 파랑으로 둠)
            return "#3b82f6";
        }

        // =========================================================
        // 2. [CALENDAR] 캘린더 일정 (내장 기능)
        // =========================================================

        // 2-1. 관리자가 등록한 회사 전체 일정 (보라색 고정)
        if (type === "COMPANY") {
            return "#8b5cf6";
        }

        // 2-2. 내 개인 일정
        // 사용자가 등록/수정 시 직접 지정한 색상(dto.color)이 있으면 최우선
        if (dto?.color) {
            return dto.color;
        }

        // 지정 안 했으면 기본 파랑
        return "#3b82f6";
    }

    function getCategoryInfo(dto) {
        const type = (dto?.type || "").toUpperCase();
        const source = getSource(dto);

        // 1. [SCHEDULE] 업무 연동 (타입별 색상 매칭)
        if (source === "SCHEDULE") {
            if (type === "COMPANY") {
                // 업무-회사: 빨강 계열
                return { text: "업무(전사)", bg: "#fee2e2", color: "#b91c1c" };
            }
            if (type === "TEAM") {
                // 업무-팀: 초록 계열
                return { text: "업무(팀)", bg: "#dcfce7", color: "#15803d" };
            }
            // 업무-개인: 파랑 계열 (텍스트로 '업무'임을 명시)
            return { text: "업무(개인)", bg: "#dbeafe", color: "#1d4ed8" };
        }

        // 2. [CALENDAR] 내장 캘린더
        // 회사 (관리자 공지 등): 보라 계열
        if (type === "COMPANY") {
            return { text: "사내공지", bg: "#f3e8ff", color: "#7e22ce" };
        }

        // 개인 (기본): 파랑 계열
        return { text: "개인", bg: "#eff6ff", color: "#1e40af" };
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
            // 서버 아직 미구현이면 캘린더 기능은 그대로 동작해야 해서 [] 반환
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

        // 기간 계산
        const diffTime = end ? (end.getTime() - start.getTime()) : 0;
        const diffDays = diffTime / (1000 * 3600 * 24);

        // 1. 회사(COMPANY) 일정은 무조건 종일
        // 2. 날짜가 달라지면(1/8~1/10) 종일로 처리
        let forceAllDay = (type === "COMPANY" && !isSchedule);
        if (end && start.getDate() !== end.getDate()) {
            forceAllDay = true;
        }

        /* ================= 공통 색상 가져오기 (이 부분이 핵심 수정!) ================= */
        // 기존에는 forceAllDay 내부에서 색상을 따로 계산해서 파란색으로 덮어씌워졌습니다.
        // 이제는 위에서 만든 getEventColor 함수를 무조건 따르도록 합니다.
        const color = getEventColor(dto);

        /* ================= 종일 일정 (상단 바) ================= */
        if (forceAllDay) {
            const s = new Date(start); s.setHours(0,0,0,0);
            let e = end ? new Date(end) : new Date(s);

            if (end) {
                e = new Date(e.getFullYear(), e.getMonth(), e.getDate() + 1, 0, 0, 0);
            } else {
                e.setDate(e.getDate() + 1);
            }

            return {
                id: String(id),
                title: dto.title || "(제목 없음)",
                start: s,
                end: e,
                allDay: true,
                // [수정] 여기서 하드코딩된 색상 대신 getEventColor(dto)를 사용합니다.
                backgroundColor: color,
                borderColor: "transparent",
                textColor: "#ffffff",
                editable: !isSchedule,
                extendedProps: { raw: dto },
            };
        }

        /* ================= 시간 일정 (Time Grid) ================= */
        const fixedEnd = end ? new Date(end) : addMinutes(start, 30);
        const editable = !isSchedule;

        return {
            id: String(id),
            title: dto.title || "(제목 없음)",
            start,
            end: fixedEnd,
            allDay: false,
            // 여기는 이미 잘 되어 있었습니다.
            backgroundColor: color,
            borderColor: "white",
            textColor: "#ffffff",
            editable,
            extendedProps: { raw: dto },
        };
    }
    /* ================= Daily List Modal Logic ================= */

    /* ================= Daily List Modal Logic (이모지 제거됨) ================= */

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
            return s < nextDate && ed > baseDate;
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
                // [삭제됨] const emoji = getTypeEmoji(e);
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

    // 1. 화면 모드 전환 (Month <-> Week/Day) [수정: Month 전환 시 즉시 변경]
    function toggleSplitView(viewType) {
        currentViewType = viewType;
        const container = document.querySelector('.calendar-right-container');
        const calendarSection = document.getElementById('calendarViewSection'); // ID 확인 필요 (HTML에 id="calendarViewSection" 있는지) 혹은 클래스로 선택
        const workSection = document.getElementById('workListSection');
        const rangeLabel = document.getElementById('workListRangeLabel');

        // 만약 ID가 없다면 클래스로 선택 (안전장치)
        const targetCalSection = calendarSection || document.querySelector('.calendar-view-section');

        if (viewType === 'dayGridMonth') {
            /* [CASE 1: Month 뷰] -> 애니메이션 없이 즉시(Instant) 전환
            */

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
            /* [CASE 2: Week/Day 뷰] -> 부드럽게(0.4s) 전환
            */

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

    // 2. 하단 업무 리스트 렌더링 (디자인 회색 통일)
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

                // 디자인 통일: 위아래 모두 w-date 스타일 적용
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
                let badgeClass = 'personal';
                let badgeText = '개인';
                const cat = getCategoryInfo(e);

                if (cat.text.includes('전사') || cat.text.includes('공지')) {
                    badgeClass = 'company'; badgeText = '전사';
                } else if (cat.text.includes('팀')) {
                    badgeClass = 'team'; badgeText = '팀';
                }

                li.innerHTML = `
                    <div class="work-time-box"> 
                        ${dateHtml}
                    </div>
                    <div class="work-info-box">
                        <span class="w-badge ${badgeClass}">${badgeText}</span>
                        <span class="w-title">${e.title || '(제목 없음)'}</span>
                    </div>
                `;

                li.onclick = () => safeOpenDetailModal(e);
                ul.appendChild(li);
            });
        }
    }
    /* ================= Calendar Init (Modified) ================= */

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

            slotEventOverlap: false, // false: 일정이 겹치면 너비를 나눠서 나란히 표시 (가독성 UP)
            slotMinWidth: 100,       // 일정이 너무 찌그러지지 않게 최소 너비 보장 (선택사항)
            eventBorderColor: '#fff',

            // [공휴일 설정 유지]
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

            // [뷰 변경 감지 - 핵심 수정 부분]
            datesSet: function(info) {
                // 1. 현재 뷰 정보 저장
                currentViewType = info.view.type;
                currentViewStart = info.start;
                currentViewEnd = info.end;

                // 2. 레이아웃 전환 (Month vs Split)
                toggleSplitView(currentViewType);

                // 3. 데이터 재렌더링
                // (loadCalendarEvents 내부에서 currentViewType을 보고 캘린더/리스트에 분배함)
                if (allEventsCache.length > 0) {
                    renderCalendarEventsOnly(); // 캘린더 이벤트 갱신
                    renderWorkScheduleList();   // 하단 리스트 갱신
                }
            },

            // [기존 이벤트 핸들러 유지]
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
                if (calendar.view.type === "dayGridMonth") {
                    const diffTime = info.end.getTime() - info.start.getTime();
                    const diffDays = diffTime / (1000 * 60 * 60 * 24);
                    if (diffDays > 1) {
                        const endDateInclusive = new Date(info.end);
                        endDateInclusive.setDate(endDateInclusive.getDate() - 1);
                        safeOpenCreateModal({
                            start: toDtoDateTime(info.start),
                            end: toDtoDateTime(info.end),
                        });
                    } else {
                        openDailyListModal(info.start);
                    }
                    calendar.unselect();
                    return;
                }
                // 주간/일간 뷰
                const start = info.start;
                let end = info.end ? new Date(info.end) : null;
                if (!end) end = addMinutes(start, 30);
                safeOpenCreateModal({ start: toDtoDateTime(start), end: toDtoDateTime(end) });
                calendar.unselect();
            },

            eventClick(info) {
                if (info.event.url) {
                    info.jsEvent.preventDefault();
                    return;
                }
                const raw = info.event.extendedProps?.raw;
                if (raw) {
                    // Month뷰에서는 리스트 모달, Week/Day에서는 바로 상세 모달이 UX상 자연스러움
                    // 하지만 통일성을 위해 일단 Daily List로 유지하거나 바로 Detail로 가도 됨.
                    // 기존 로직 유지:
                    const targetDate = info.event.start;
                    openDailyListModal(targetDate);
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

    // (참고용) 읽기 전용 체크
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

    /* ================= Sync (drag/resize) ================= */

    async function syncEvent(fcEvent) {
        const raw = fcEvent?.extendedProps?.raw;

        // 업무 스케줄은 sync 대상 아님
        if (raw && isScheduleSource(raw)) return;

        if (!raw?.calendarId) return;

        const start = fcEvent.start;
        const end = fcEvent.end ? fcEvent.end : addMinutes(start, 30);

        // DTO/Controller 계약에 맞춘 payload
        const payload = {
            // calendarId는 컨트롤러에서 path로 세팅하지만, 서버 구현에 따라 body도 같이 받는 경우가 있어 넣어도 무해
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

        // 즉시 상세/수정 모달 값도 일치하도록 raw 갱신
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

    /* ================= Load ================= */

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
        renderCalendarEventsOnly(); // FullCalendar 안에 이벤트 넣기
        renderWorkScheduleList();   // (Week/Day일 경우) 하단 리스트 넣기
        renderTodayList();          // 좌측 오늘 일정
        renderWeekPreview();        // 좌측 프리뷰
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

    /* ================= Today List (수정됨) ================= */

    /* ================= Today List (이모지 제거됨) ================= */

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

                // [삭제됨] const emoji = getTypeEmoji(e);
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
            /* 업무는 '마감일'이 중요하므로 endDate 기준 판단 */
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
            /* 개인 일정은 '시작일' 기준으로 이번 주에 있는지 판단 */
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
