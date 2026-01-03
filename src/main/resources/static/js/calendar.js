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

            // 사용자가 직접 지정한 색상이 있다면 최우선 적용
            if (dto?.color) return dto.color;

            const type = (dto?.type || "").toString().toUpperCase();
            const source = getSource(dto);

            // 1. [업무] (스케줄 소스) -> 빨간색 계열 통일
            if (source === "SCHEDULE") {
                return "#ef4444";
            }

            // 2. [회사] (관리자 등록) -> 보라색 계열 통일
            if (type === "COMPANY") {
                return "#8b5cf6";
            }

            // 3. [팀] -> 초록색 (필요시 업무 색상인 #ef4444로 변경 가능)
            if (type === "TEAM") {
                return "#22c55e";
            }

            // 4. [개인] (기본) -> 파란색 계열 통일
            return "#3b82f6";
        }

    function getTypeEmoji(dto) {
        const type = (dto?.type || "").toUpperCase();
        const source = getSource(dto); // CALENDAR | SCHEDULE

        // 1. 칸반에서 온 모든 일정
        if (source === "SCHEDULE") {
            return "👥";
        }

        // 2. 캘린더에서 등록한 회사 일정
        if (source === "CALENDAR" && type === "COMPANY") {
            return "🏢";
        }

        // 3. 캘린더에서 등록한 개인 일정
        if (source === "CALENDAR" && type === "PERSONAL") {
            return "👤";
        }

        return "📌";
    }
    function getCategoryInfo(dto) {
        const type = (dto?.type || "").toUpperCase();
        const source = getSource(dto);

        // 1. 회사 (연한 보라 배경 + 진한 보라 글씨)
        if (source === "CALENDAR" && type === "COMPANY") {
            return { text: "회사", bg: "#f3e8ff", color: "#7e22ce" };
        }

        // 2. 업무 (연한 빨강 배경 + 진한 빨강 글씨)
        if (source === "SCHEDULE") {
            return { text: "업무", bg: "#fee2e2", color: "#b91c1c" };
        }

        // 3. 개인 (연한 파랑 배경 + 진한 파랑 글씨)
        return { text: "개인", bg: "#dbeafe", color: "#1d4ed8" };
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

    /* ================= Normalize for FullCalendar ================= */

    function normalizeEvent(dto) {
        const { start, end } = normalizeDtoDates(dto);
        if (!start) return null;

        const source = getSource(dto);
        const type = (dto?.type || "").toString().toUpperCase();
        const isCompany = type === "COMPANY";
        const isSchedule = source === "SCHEDULE";

        // 공통 ID
        const id = getDtoId(dto);
        if (!id) return null;

        /* ================= COMPANY (캘린더 "회사전체 일정"은 종일 블록 + 편집 불가 유지) ================= */
        // 단, 업무 스케줄의 COMPANY는 '회사전체 캘린더'와 의미가 다를 수 있으니 "업무 스케줄"은 아래 일반 로직으로 처리
        if (!isSchedule && isCompany) {
            const s = new Date(
                start.getFullYear(),
                start.getMonth(),
                start.getDate(),
                0, 0, 0
            );

            let endExclusive;

            if (end) {
                const ed = new Date(end);
                const isMidnight =
                    ed.getHours() === 0 &&
                    ed.getMinutes() === 0 &&
                    ed.getSeconds() === 0;

                endExclusive = isMidnight
                    ? ed
                    : new Date(ed.getFullYear(), ed.getMonth(), ed.getDate() + 1, 0, 0, 0);
            } else {
                endExclusive = new Date(s);
                endExclusive.setDate(endExclusive.getDate() + 1);
            }

            return {
                id: String(id),
                title: dto.title || "(제목 없음)",
                start: s,
                end: endExclusive,
                allDay: true,
                backgroundColor: "#8b5cf6",
                textColor: "#ffffff",
                editable: false,
                startEditable: false,
                durationEditable: false,
                extendedProps: { raw: dto },
            };
        }

        /* ================= PERSONAL / TEAM / COMPANY(업무) ================= */
        const color = getEventColor(dto);
        const fixedEnd = end ? new Date(end) : addMinutes(start, 30);

        // 업무 스케줄은 읽기 전용 (드래그/리사이즈 불가)
        const editable = !isSchedule;

        return {
            id: String(id),
            title: dto.title || "(제목 없음)",
            start,
            end: fixedEnd,
            backgroundColor: color,
            borderColor: color,
            editable,
            startEditable: editable,
            durationEditable: editable,
            extendedProps: { raw: dto },
        };
    }
    /* ================= Daily List Modal Logic (Simple Version) ================= */

    /* ================= Daily List Modal Logic (Time Fix) ================= */

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

                const emoji = getTypeEmoji(e);
                const category = getCategoryInfo(e);

                // [수정됨] 시간 표시 로직 (Start ~ End 모두 표시)
                const sTime = new Date(e.start);
                const eTime = e.end ? new Date(e.end) : addMinutes(sTime, 30); // 끝 시간 없으면 30분 뒤로

                const startStr = `${pad(sTime.getHours())}:${pad(sTime.getMinutes())}`;
                const endStr = `${pad(eTime.getHours())}:${pad(eTime.getMinutes())}`;
                const timeRange = `${startStr} ~ ${endStr}`; // 예: 09:00 ~ 10:00

                li.innerHTML = `
                <span style="font-size:1.4rem; margin-right: 8px;">${emoji}</span>
                
                <span class="category-badge" style="background-color: ${category.bg}; color: ${category.color};">
                    ${category.text}
                </span>
                <div style="flex:1;">
                    <div style="flex:1;">
                        <div style="font-weight:bold; font-size:1rem; color:#333; margin-bottom:2px;">${e.title || "(제목 없음)"}</div>
                        <div style="font-size:0.85rem; color:#666;">${timeRange}</div>
                    </div>
                `;

                li.onclick = () => {
                    overlay.classList.add("hidden");
                    safeOpenDetailModal(e);
                };
                listUl.appendChild(li);
            });
        }

        // 5. 버튼 이벤트
        closeBtn.onclick = () => overlay.classList.add("hidden");

        addBtn.onclick = () => {
            overlay.classList.add("hidden");
            const startAt = new Date(baseDate);
            startAt.setHours(9, 0, 0);
            const endAt = new Date(startAt);
            endAt.setMinutes(30);
            safeOpenCreateModal({
                start: toDtoDateTime(startAt),
                end: toDtoDateTime(endAt)
            });
        };

        overlay.classList.remove("hidden");
    }
    /* ================= Calendar Init ================= */

    function initCalendar() {
        const el = document.getElementById("calendar");
        if (!el) {
            console.error("[calendar.js] #calendar not found");
            return;
        }

        calendar = new FullCalendar.Calendar(el, {
            locale: "ko",
            initialView: "dayGridMonth",
            googleCalendarApiKey: 'AIzaSyBM_oNQ8dkUcn_lK-EmAn2iwXgVGz_cp_s',

            /* ================= 레이아웃 설정 ================= */
            height: '100%',
            expandRows: true,      // 행 높이 균등
            dayMaxEvents: true,    // 자동 +more 처리
            fixedWeekCount: false, // 빈 줄 제거

            /* [중요] 모든 이벤트를 블록(Bar) 형태로 통일 */
            eventDisplay: 'block',

            /* ============================================== */

            // 공휴일
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

            // 공휴일 스타일
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

            // more 링크 클릭 -> 리스트 모달
            moreLinkClick: function(info) {
                openDailyListModal(info.date);
                return "void";
            },

            selectable: true,
            selectMirror: true,
            editable: true,
            allDaySlot: false,

            headerToolbar: {
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
            },

            /* [핵심 수정] 날짜 선택 로직 분기 */
            select(info) {
                // Month 뷰일 때만 적용
                if (calendar.view.type === "dayGridMonth") {

                    const diffTime = info.end.getTime() - info.start.getTime();
                    const diffDays = diffTime / (1000 * 60 * 60 * 24);

                    // 1일 초과 선택(드래그) -> 바로 등록 모달 (다일 일정 등록)
                    if (diffDays > 1) {
                        // 종료일이 exclusive하므로 -1일 처리 안 하고 그대로 둬야
                        // 모달에서 00:00 기준으로 처리하거나, 사용자가 원하는 대로
                        // 여기서 -1일 해서 inclusive로 넘겨도 됨.
                        // FullCalendar 드래그는 종료일이 다음날 00시임.
                        // 보통 등록 모달에서는 종료일 전날까지로 보정해주는게 UX상 좋음.

                        const endDateInclusive = new Date(info.end);
                        endDateInclusive.setDate(endDateInclusive.getDate() - 1);

                        safeOpenCreateModal({
                            start: toDtoDateTime(info.start),
                            end: toDtoDateTime(info.end), // 또는 info.end 그대로
                        });
                    }
                    // 딱 하루 클릭 -> 리스트 모달
                    else {
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

            // 일정 클릭
                eventClick(info) {

                    if (info.event.url) {
                        info.jsEvent.preventDefault();
                        return;
                    }

                    const raw = info.event.extendedProps?.raw;
                    if (raw) {

                        const clickedDate = calendar.getDateFromPixel({
                            x: info.jsEvent.clientX,
                            y: info.jsEvent.clientY
                        });

                        // 클릭 좌표에서 날짜를 못 찾으면(예외 상황) 이벤트 시작일 사용
                        const targetDate = clickedDate || info.event.start;

                        openDailyListModal(targetDate);
                    }
                },

            // 드래그/리사이즈
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

    async function loadCalendarEvents() {
        if (!calendar) return;

        // 캘린더 + 업무 스케줄을 한 번에 로드해서 합침
        const [calendarData, scheduleData] = await Promise.all([
            apiGetEvents(),
            apiGetScheduleEvents(),
        ]);

        const calArr = Array.isArray(calendarData) ? calendarData : [];
        const schArr = Array.isArray(scheduleData) ? scheduleData : [];

        // source 보정 (서버가 내려주면 그대로, 없으면 보정)
        const normalizedCalendarDtos = calArr.map((e) => ({ ...e, source: getSource(e) })); // CALENDAR
        const normalizedScheduleDtos = schArr.map((e) => ({ ...e, source: "SCHEDULE" }));  // SCHEDULE

        allEventsCache = [...normalizedCalendarDtos, ...normalizedScheduleDtos];

        const currentEvents = calendar.getEvents();
        currentEvents.forEach(ev => {
            // extendedProps.raw가 있는 것은 우리가 DB에서 넣어준 이벤트임
            if (ev.extendedProps && ev.extendedProps.raw) {
                ev.remove();
            }
        });

        allEventsCache
            .filter((e) => matchFilter(e))
            .map(normalizeEvent)
            .filter(Boolean)
            .forEach((ev) => calendar.addEvent(ev));

        renderTodayList();
        renderWeekPreview()
    }

    /* ================= Today List (수정됨) ================= */

    function renderTodayList() {
        const ul = document.getElementById("todayList");
        const emptyMsg = document.getElementById("todayEmptyMsg");

        // 1. [날짜 표시 로직] Week Preview와 스타일 100% 동일하게
        const headerTitle = document.getElementById("today-title");
        if (headerTitle) {
            const now = new Date();
            const year = now.getFullYear();
            const month = String(now.getMonth() + 1).padStart(2, "0"); // 01, 02...
            const day = String(now.getDate()).padStart(2, "0");       // 01, 02...

            // 날짜 포맷: 2026.01.02
            const dateStr = `${year}.${month}.${day}`;

            // 중복 추가 방지 (이미 날짜가 있으면 텍스트만 업데이트, 없으면 태그 추가)
            const existingSuffix = headerTitle.querySelector(".today-date-suffix");

            // Week Preview와 동일한 스타일: font-size:0.8em; color:#888; font-weight:normal;
            const suffixHtml = ` <span class="today-date-suffix" style="font-size:0.8em; color:#888; font-weight:normal;">(${dateStr})</span>`;

            if (existingSuffix) {
                existingSuffix.innerHTML = `(${dateStr})`;
            } else {
                headerTitle.innerHTML += suffixHtml;
            }
        }

        if (!ul) return;

        ul.innerHTML = "";

        // 오늘 날짜 범위 설정
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        // 오늘 날짜에 해당하는 일정 필터링
        const todayEvents = allEventsCache
            .filter((e) => {
                const s = e.start ? new Date(e.start) : null;
                const ed = e.end ? new Date(e.end) : null;
                if (!s) return false;

                const end = ed || addMinutes(s, 30);
                return s <= todayEnd && end >= todayStart;
            })
            .sort((a, b) => new Date(a.start) - new Date(b.start));

        // 리스트 렌더링
        if (todayEvents.length === 0) {
            if (emptyMsg) emptyMsg.classList.remove("hidden");
        } else {
            if (emptyMsg) emptyMsg.classList.add("hidden");

            todayEvents.forEach((e) => {
                const li = document.createElement("li");

                const emoji = getTypeEmoji(e);
                const category = getCategoryInfo(e);

                li.innerHTML = `
                <span style="margin-right:4px;">${emoji}</span> 
                
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
