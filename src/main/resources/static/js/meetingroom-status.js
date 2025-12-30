let selectedDate = getToday();

document.addEventListener("DOMContentLoaded", () => {
    initStatusDatePicker();
    renderTimeHeader();
    loadMeetingRoomStatus();

    document.getElementById("openReservationBtn")
        .addEventListener("click", openReservationModal);
});

/* =====================
   날짜 선택
===================== */
function initStatusDatePicker() {
    flatpickr("#statusDatePicker", {
        dateFormat: "Y-m-d",
        defaultDate: selectedDate,
        onChange: function (selectedDates, dateStr) {
            selectedDate = dateStr;
            loadMeetingRoomStatus();
        }
    });
}

/* =====================
   시간 헤더 렌더링
   - 30분 단위
   - 정각만 표시
===================== */
function renderTimeHeader() {
    const scale = document.querySelector(".time-scale");
    if (!scale) return;

    scale.innerHTML = "";

    // 09:00 ~ 18:00 → 30분 단위 = 18칸
    for (let i = 0; i < 18; i++) {
        const span = document.createElement("span");
        span.className = "time-cell";

        if (i % 2 === 0) {
            const hour = 9 + (i / 2);
            span.textContent = String(hour).padStart(2, "0");
        } else {
            span.textContent = "";
        }

        scale.appendChild(span);
    }
}

/* =====================
   회의실 현황 조회
===================== */
function loadMeetingRoomStatus() {
    fetch(`/api/meeting-rooms/status?date=${selectedDate}`)
        .then(res => res.json())
        .then(renderMeetingRoomStatus)
        .catch(err => console.error("회의실 현황 조회 실패", err));
}

/* =====================
   회의실 현황 렌더링
===================== */
function renderMeetingRoomStatus(rooms) {
    const container = document.getElementById("meeting-room-status");
    container.innerHTML = "";

    rooms.forEach(room => {
        const row = document.createElement("div");
        row.className = "room-row";

        const title = document.createElement("div");
        title.className = "room-title";
        title.textContent = room.roomName;

        const timeline = document.createElement("div");
        timeline.className = "timeline";

        const reservations = room.reservations || [];

        // 09:00 ~ 18:00 → 30분 단위 = 18칸
        for (let i = 0; i < 18; i++) {
            const slotStart = new Date(`${selectedDate}T09:00:00`);
            slotStart.setMinutes(slotStart.getMinutes() + i * 30);

            const slotEnd = new Date(slotStart.getTime() + 30 * 60 * 1000);

            const slot = document.createElement("div");
            slot.className = "time-slot";

            const matched = reservations.find(r => {
                const rs = new Date(r.startAt);
                const re = new Date(r.endAt);
                return rs < slotEnd && re > slotStart;
            });

            if (matched) {
                slot.classList.add("reserved");

                slot.dataset.tooltip =
                    `${room.roomName}\n` +
                    `${formatTime(matched.startAt)} ~ ${formatTime(matched.endAt)}`;
            }


            timeline.appendChild(slot);
        }

        row.appendChild(title);
        row.appendChild(timeline);
        container.appendChild(row);
    });
}

/* =====================
   Utils
===================== */
function formatTime(iso) {
    const d = new Date(iso);
    const h = String(d.getHours()).padStart(2, "0");
    const m = String(d.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
}

function getToday() {
    return new Date().toISOString().slice(0, 10);
}
