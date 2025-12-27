/* =========================================================
 * calendar.js (DTO/Controller MATCHED - STABLE)
 *
 * ✔ API: /api/calendar  (CalendarApiController)
 * ✔ DTO keys: calendarId, createdBy, title, description, start, end, type, color
 * ✔ Month 다일 일정: 날짜 드래그 → 시작/종료 09:00 고정
 * ✔ Week/Day 시간 일정: 30분 단위
 * ✔ 색상 반영(표시/드래그/리사이즈 후 유지)
 * ✔ Today’s Schedule / Weekly Progress Bar / Filter
 * ✔ 등록/수정/삭제/드래그/리사이즈 후 무조건 재로딩(단일 소스)
 *
 * ✅ (추가) SCHEDULE 연동: /api/calendar/schedules
 * ✅ (수정) WORK 필터: type=WORK(테스트용) → source=SCHEDULE 기준
 * ✅ (수정) 업무 일정은 드래그/리사이즈 불가(읽기전용)
 * ========================================================= */

(function () {
    const API_BASE = "/api/calendar";
    const SCHEDULE_API = `${API_BASE}/schedules`; // ✅ 서버에 추가한 일정연동 API

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
        // ✅ 기존 캘린더 일정은 source가 없으니 CALENDAR로 보정
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
        // 2) 캘린더에서 등록한 회사(COMPANY) 일정
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

        // 업무 일정은 type 기반 기본색 (원하면 서버에서 내려주면 그걸 우선하면 됨)
        const type = (dto?.type || "").toString().toUpperCase();
        if (type === "COMPANY") return "#ef4444";
        if (type === "TEAM") return "#22c55e";
        if (type === "PERSONAL") return "#3b82f6";
        return "#3b82f6";
    }

    function getTypeEmoji(dto) {
        const type = (dto?.type || "").toUpperCase();
        const source = getSource(dto); // CALENDAR | SCHEDULE

        // 1️⃣ 칸반에서 온 모든 일정
        if (source === "SCHEDULE") {
            return "👥";
        }

        // 2️⃣ 캘린더에서 등록한 회사 일정
        if (source === "CALENDAR" && type === "COMPANY") {
            return "🏢";
        }

        // 3️⃣ 캘린더에서 등록한 개인 일정
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
        // ✅ 스케줄 연동 API
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
        // 기존 로직 보존: "회사 전체 일정은 시작날만 블록" 등
        // ✅ 단, 업무 스케줄의 COMPANY는 '회사전체 캘린더'와 의미가 다를 수 있으니 "업무 스케줄"은 아래 일반 로직으로 처리
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
                backgroundColor: "#ef4444",
                borderColor: "#ef4444",
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

        // ✅ 업무 스케줄은 읽기 전용(드래그/리사이즈 불가)
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

    function initCalendar() {
        const el = document.getElementById("calendar");
        if (!el) {
            console.error("[calendar.js] #calendar not found");
            return;
        }

        calendar = new FullCalendar.Calendar(el, {
            locale: "ko",
            initialView: "dayGridMonth",

            /* ===== 레이아웃 & 그리드 ===== */
            height: "100%",          // 카드 높이에 맞게 꽉 채움
            expandRows: true,        // 빈 공간 자동 확장
            dayMaxEvents: true,      // 일정 많으면 +more
            fixedWeekCount: false,   // 불필요한 빈 주 제거

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

            /* ===== 날짜/시간 선택 ===== */
            select(info) {
                const viewType = calendar.view.type;

                // Month: 다일 일정 UX (09:00 고정)
                if (viewType === "dayGridMonth") {
                    const startDate = info.start;
                    const endExclusive = info.end;

                    // FullCalendar select의 end는 exclusive라서 하루 빼서 inclusive 처리
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

                // Week/Day: 시간 드래그 그대로 (end null 방지)
                const start = info.start;
                let end = info.end ? new Date(info.end) : null;
                if (!end) end = addMinutes(start, 30);

                // 선택 end가 딱 떨어지는 경우(예: 14:00) 모달 UX상 그대로 써도 OK
                safeOpenCreateModal({
                    start: toDtoDateTime(start),
                    end: toDtoDateTime(end),
                });

                calendar.unselect();
            },

            /* ===== 일정 클릭 ===== */
            eventClick(info) {
                const raw = info?.event?.extendedProps?.raw;
                if (raw) safeOpenDetailModal(raw);
            },

            /* ===== 드래그 이동 ===== */
            eventDrop(info) {
                const raw = info.event.extendedProps?.raw;

                // ✅ 업무 스케줄은 캘린더에서 편집 불가
                if (raw && isScheduleSource(raw)) {
                    alert("업무 일정은 캘린더에서 이동할 수 없습니다.");
                    info.revert();
                    return;
                }

                // 기존 COMPANY 가드 유지
                if (raw?.type === "COMPANY") {
                    alert("회사 전체 일정은 이동할 수 없습니다.");
                    info.revert();
                    return;
                }

                syncEvent(info.event);
            },

            /* ===== 리사이즈 ===== */
            eventResize(info) {
                const raw = info.event.extendedProps?.raw;

                // ✅ 업무 스케줄은 캘린더에서 편집 불가
                if (raw && isScheduleSource(raw)) {
                    alert("업무 일정은 캘린더에서 변경할 수 없습니다.");
                    info.revert();
                    return;
                }

                // 기존 COMPANY 가드 유지
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

        // ✅ 업무 스케줄은 sync 대상 아님
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

        // ✅ 캘린더 + 업무 스케줄을 한 번에 로드해서 합침
        const [calendarData, scheduleData] = await Promise.all([
            apiGetEvents(),
            apiGetScheduleEvents(),
        ]);

        const calArr = Array.isArray(calendarData) ? calendarData : [];
        const schArr = Array.isArray(scheduleData) ? scheduleData : [];

        // ✅ source 보정 (서버가 내려주면 그대로, 없으면 보정)
        const normalizedCalendarDtos = calArr.map((e) => ({ ...e, source: getSource(e) })); // CALENDAR
        const normalizedScheduleDtos = schArr.map((e) => ({ ...e, source: "SCHEDULE" }));  // SCHEDULE

        allEventsCache = [...normalizedCalendarDtos, ...normalizedScheduleDtos];

        calendar.removeAllEvents();

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

        // ✅ PERSONAL(개인 타입) / WORK(스케줄 소스) / TOTAL 유지
        setProgress(".personal", ".personal-text", percent((e) => (e.type || "").toUpperCase() === "PERSONAL"));
        setProgress(".work", ".work-text", percent((e) => getSource(e) === "SCHEDULE"));
        setProgress(".total", ".total-text", percent(() => true));
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
