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
        // 캘린더 일정은 dto.color 우선
        if (dto?.color) return dto.color;

        // 업무 일정은 type 기반 기본색
        const type = (dto?.type || "").toString().toUpperCase();
        if (type === "COMPANY") return "#ef4444";
        if (type === "TEAM") return "#22c55e";
        if (type === "PERSONAL") return "#3b82f6";
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

    /* ================= Calendar Init ================= */

    /* calendar.js 내부의 initCalendar 함수 전체 교체 */

    function initCalendar() {
        const el = document.getElementById("calendar");
        if (!el) {
            console.error("[calendar.js] #calendar not found");
            return;
        }

        calendar = new FullCalendar.Calendar(el, {
            locale: "ko",
            initialView: "dayGridMonth",

            // ==========================================
            // [Google Calendar 연동 설정]
            // ==========================================
            googleCalendarApiKey: 'AIzaSyBM_oNQ8dkUcn_lK-EmAn2iwXgVGz_cp_s',

            eventSources: [
                {
                    googleCalendarId: 'ko.south_korea#holiday@group.v.calendar.google.com',
                    className: 'korean-holiday',
                    color: '#ef4444',     // 기본 빨간색 (법정 공휴일용)
                    textColor: '#ffffff',
                    editable: false,
                    display: 'block'
                }
            ],

            // 3. 이벤트 데이터 변환 (공휴일 vs 기념일 구분 처리)
            eventDataTransform: function(eventDef) {
                // 구글 캘린더에서 온 이벤트인지 확인 (url이나 source ID로 식별)
                if (eventDef.url || (eventDef.source && eventDef.source.googleCalendarId)) {

                    // 빨간 날이 아닌 기념일 키워드 목록
                    const notRedDays = [
                        "어버이날", "스승의날", "제헌절", "국군의 날",
                        "식목일", "발렌타인", "화이트", "할로윈", "빼빼로",
                        "동지", "초복", "중복", "말복", "입춘", "소한", "대한",
                        "칠석", "단오", "근로자의 날"
                    ];

                    const title = eventDef.title || "";

                    // 제목에 해당 키워드가 포함되어 있으면 색상 변경
                    if (notRedDays.some(keyword => title.includes(keyword))) {
                        eventDef.color = '#10b981';       // 초록색 (기념일)
                        eventDef.borderColor = '#10b981';

                        // 만약 캘린더에서 아예 숨기고 싶다면 아래 주석 해제
                        // return false;
                    }
                }
                return eventDef;
            },
            // ==========================================

            /* ===== 레이아웃 & 그리드 설정 (기존 유지) ===== */
            height: "100%",
            expandRows: true,
            dayMaxEvents: true,
            fixedWeekCount: false,

            selectable: true,
            selectMirror: true,
            editable: true,
            allDaySlot: false,

            slotDuration: "00:30:00",
            snapDuration: "00:30:00",
            slotLabelInterval: "00:30",

            headerToolbar: {
                left: "prev,next today",
                center: "title",
                right: "dayGridMonth,timeGridWeek,timeGridDay",
            },

            /* ===== 날짜/시간 선택 (기존 유지) ===== */
            select(info) {
                const viewType = calendar.view.type;

                // Month: 다일 일정 UX (09:00 고정)
                if (viewType === "dayGridMonth") {
                    const startDate = info.start;
                    const endExclusive = info.end;

                    const endInclusive = new Date(endExclusive);
                    endInclusive.setDate(endInclusive.getDate() - 1);

                    const start = new Date(
                        startDate.getFullYear(),
                        startDate.getMonth(),
                        startDate.getDate(),
                        9, 0, 0
                    );

                    const end = new Date(
                        endInclusive.getFullYear(),
                        endInclusive.getMonth(),
                        endInclusive.getDate(),
                        9, 0, 0
                    );

                    safeOpenCreateModal({
                        start: toDtoDateTime(start),
                        end: toDtoDateTime(end),
                    });

                    calendar.unselect();
                    return;
                }

                // Week/Day: 시간 드래그 그대로
                const start = info.start;
                let end = info.end ? new Date(info.end) : null;
                if (!end) end = addMinutes(start, 30);

                safeOpenCreateModal({
                    start: toDtoDateTime(start),
                    end: toDtoDateTime(end),
                });

                calendar.unselect();
            },

            /* ===== 일정 클릭 ===== */
            eventClick(info) {
                // 1. 구글 캘린더(공휴일)인 경우: 링크 이동 막기
                if (info.event.url) {
                    info.jsEvent.preventDefault();
                    return;
                }

                // 2. 내가 등록한(DB) 일정인 경우: 상세 모달 열기
                const raw = info?.event?.extendedProps?.raw;
                if (raw) safeOpenDetailModal(raw);
            },

            /* ===== 드래그 이동 (기존 유지) ===== */
            eventDrop(info) {
                const raw = info.event.extendedProps?.raw;

                if (raw && isScheduleSource(raw)) {
                    alert("업무 일정은 캘린더에서 이동할 수 없습니다.");
                    info.revert();
                    return;
                }

                if (raw?.type === "COMPANY") {
                    alert("회사 전체 일정은 이동할 수 없습니다.");
                    info.revert();
                    return;
                }

                syncEvent(info.event);
            },

            /* ===== 리사이즈 (기존 유지) ===== */
            eventResize(info) {
                const raw = info.event.extendedProps?.raw;

                if (raw && isScheduleSource(raw)) {
                    alert("업무 일정은 캘린더에서 변경할 수 없습니다.");
                    info.revert();
                    return;
                }

                if (raw?.type === "COMPANY") {
                    alert("회사 전체 일정은 변경할 수 없습니다.");
                    info.revert();
                    return;
                }

                syncEvent(info.event);
            },
        });

        calendar.render();
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
        renderWeeklyProgress();
    }

    /* ================= Today List ================= */

    function renderTodayList() {
        const ul = document.getElementById("todayList");
        if (!ul) return;

        ul.innerHTML = "";

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const todayEnd = new Date();
        todayEnd.setHours(23, 59, 59, 999);

        allEventsCache
            .filter((e) => {
                const s = e.start ? new Date(e.start) : null;
                const ed = e.end ? new Date(e.end) : null;
                if (!s) return false;

                const end = ed || addMinutes(s, 30);
                return s <= todayEnd && end >= todayStart;
            })
            .sort((a, b) => new Date(a.start) - new Date(b.start))
            .forEach((e) => {
                const li = document.createElement("li");

                const emoji = getTypeEmoji(e);
                li.textContent = `${emoji} ${e.title || "(제목 없음)"}`;

                li.onclick = () => safeOpenDetailModal(e);
                ul.appendChild(li);
            });
    }

    /* ================= Weekly Progress ================= */

    function renderWeeklyProgress() {
        const now = new Date();

        // 일요일~토요일
        const start = new Date(now);
        start.setHours(0, 0, 0, 0);
        start.setDate(now.getDate() - now.getDay());

        const end = new Date(start);
        end.setHours(23, 59, 59, 999);
        end.setDate(start.getDate() + 6);

        const weekEvents = allEventsCache.filter((e) => {
            if (!e.start) return false;
            const s = new Date(e.start);
            return s >= start && s <= end;
        });

        const percent = (filterFn) => {
            const arr = weekEvents.filter(filterFn);
            if (!arr.length) return 0;

            // 완료 기준: end < now (end 없으면 start+30분으로 가정)
            const done = arr.filter((e) => {
                const s = new Date(e.start);
                const ed = e.end ? new Date(e.end) : addMinutes(s, 30);
                return ed < now;
            }).length;

            return Math.round((done / arr.length) * 100);
        };

        // PERSONAL(개인 타입)
        setProgress(".personal", ".personal-text", percent((e) => (e.type || "").toUpperCase() === "PERSONAL"));

        // WORK(스케줄 소스)
        setProgress(".work", ".work-text", percent((e) => getSource(e) === "SCHEDULE"));

        // TOTAL: 회사 공지(CALENDAR 소스의 COMPANY 타입)는 제외
        setProgress(".total", ".total-text", percent((e) => {
            const isCompanyNotice = getSource(e) === "CALENDAR" && (e.type || "").toUpperCase() === "COMPANY";
            return !isCompanyNotice; // 회사 공지가 아닌 것만 합산 (개인 + 업무스케줄)
        }));
    }

    function setProgress(barSel, textSel, p) {
        const bar = document.querySelector(barSel);
        const text = document.querySelector(textSel);
        if (!bar || !text) return;
        bar.style.width = `${p}%`;
        text.textContent = `${p}%`;
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
