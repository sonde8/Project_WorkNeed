document.addEventListener("DOMContentLoaded", function () {

    const calendarEl = document.getElementById("calendar");
    if (!calendarEl) {
        console.error("❌ #calendar element not found");
        return;
    }

    /* ===============================
       필터 상태
       ALL | PERSONAL | TEAM | COMPANY
    =============================== */
    let currentFilter = "ALL";

    /* ===============================
       공유 캘린더 토글
    =============================== */
    const shareToggle = document.getElementById("shareToggle");
    const shareList = document.getElementById("shareList");
    const plusIcon = document.querySelector(".sidebar-box-toggle");

    shareToggle.addEventListener("click", () => {
        const isOpen = shareList.style.display === "block";
        shareList.style.display = isOpen ? "none" : "block";
        plusIcon.textContent = isOpen ? "+" : "−";
    });

    /* ===============================
       FullCalendar
    =============================== */
    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: "dayGridMonth",
        locale: "ko",
        height: "100%",
        selectable: true,

        headerToolbar: {
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay"
        },

        /* 일정 로드 */
        events: async function (info, successCallback, failureCallback) {
            try {
                const response = await fetch("/schedule/list");
                if (!response.ok) throw new Error("일정 API 실패");

                const data = await response.json();

                let events = data.map(item => ({
                    id: item.scheduleId,
                    title: item.title,
                    start: item.startAt,
                    end: item.endAt,
                    allDay: item.isAllDay,
                    type: item.type, // PERSONAL | TEAM | COMPANY | RESOURCE
                    backgroundColor: getColorByType(item.type),
                    borderColor: getColorByType(item.type)
                }));

                // 🔥 필터 적용
                if (currentFilter !== "ALL") {
                    events = events.filter(e => e.type === currentFilter);
                }

                successCallback(events);

            } catch (error) {
                console.error("❌ 일정 로드 오류:", error);
                failureCallback(error);
            }
        },

        eventClick: function (info) {
            alert(
                "일정: " + info.event.title +
                "\n시작: " + info.event.start
            );
        }
    });

    calendar.render();

    /* ===============================
       필터 클릭 이벤트
    =============================== */
    document.querySelectorAll("#shareList li").forEach(item => {
        item.addEventListener("click", () => {
            currentFilter = item.dataset.type;
            setActiveFilter(item);
            calendar.refetchEvents();
        });
    });

    document.getElementById("personalBtn").addEventListener("click", () => {
        currentFilter = "PERSONAL";
        setActiveFilter(document.getElementById("personalBtn"));
        calendar.refetchEvents();
    });

    document.getElementById("allCalendarBtn").addEventListener("click", () => {
        currentFilter = "ALL";
        clearActiveFilter();
        calendar.refetchEvents();
    });

    /* ===============================
       유틸 함수
    =============================== */
    function getColorByType(type) {
        switch (type) {
            case "PERSONAL": return "#3B82F6"; // 파랑
            case "TEAM":     return "#10B981"; // 초록
            case "COMPANY":  return "#F59E0B"; // 주황
            case "RESOURCE": return "#EF4444"; // 빨강
            default:         return "#6B7280";
        }
    }

    function setActiveFilter(target) {
        clearActiveFilter();
        target.classList.add("active");
    }

    function clearActiveFilter() {
        document
            .querySelectorAll(".sidebar-btn, .sidebar-calendar-list li")
            .forEach(el => el.classList.remove("active"));
    }
});
