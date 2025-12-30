let startPicker;
let endPicker;

document.addEventListener("DOMContentLoaded", () => {
    initPickers();
    bindEvents();
});

/* ======================
   이벤트 바인딩
====================== */
function bindEvents() {
    document.getElementById("closeModalBtn")
        .addEventListener("click", closeReservationModal);

    document.getElementById("reservationForm")
        .addEventListener("submit", submitReservation);
}

/* ======================
   flatpickr 초기화
====================== */
function initPickers() {
    flatpickr("#reserveDate", {
        dateFormat: "Y-m-d",
        minDate: "today"
    });

    startPicker = flatpickr("#startTime", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        minuteIncrement: 30,
        minTime: "09:00",
        maxTime: "17:30",
        defaultHour: 9,
        defaultMinute: 0,
        onChange: onStartTimeChange
    });

    endPicker = flatpickr("#endTime", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        minuteIncrement: 30,
        minTime: "09:30",
        maxTime: "18:00",
        defaultHour: 9,
        defaultMinute: 30
    });
}

/* ======================
   모달 제어
====================== */
function openReservationModal() {
    resetReservationForm();
    loadRoomSelect();
    loadScheduleSelect(); // <--- [추가] 모달 열 때 내 업무 리스트 가져오기
    document.getElementById("reservationModal").classList.remove("hidden");
}

function closeReservationModal() {
    document.getElementById("reservationModal").classList.add("hidden");
}

/* ======================
   회의실 목록
====================== */
function loadRoomSelect() {
    fetch(`/api/meeting-rooms/status?date=${getToday()}`)
        .then(res => res.json())
        .then(rooms => {
            const select = document.getElementById("roomSelect");
            select.innerHTML = "";

            rooms.forEach(room => {
                const opt = document.createElement("option");
                opt.value = room.roomId;
                opt.textContent = room.roomName;
                select.appendChild(opt);
            });
        });
}
/* ======================
   내 업무 목록 불러오기
====================== */
function loadScheduleSelect() {
    // 백엔드 컨트롤러에 만든 API 호출
    fetch("/api/schedules/my-active")
        .then(res => {
            if (!res.ok) throw new Error("업무 목록을 불러오지 못했습니다.");
            return res.json();
        })
        .then(schedules => {
            const select = document.getElementById("scheduleSelect");

            // 기존 옵션 초기화 (기본 '선택 안 함' 옵션은 유지)
            select.innerHTML = '<option value="">업무 선택 안 함</option>';

            schedules.forEach(sch => {
                const opt = document.createElement("option");
                opt.value = sch.scheduleId;
                // 예: [TEAM] 기획 회의 (사용자가 알아보기 쉽게 타입 표시)
                opt.textContent = `[${sch.type}] ${sch.title}`;
                select.appendChild(opt);
            });
        })
        .catch(err => console.error(err));
}
/* ======================
   시작 → 종료 시간 제한
====================== */
function onStartTimeChange(selectedDates, timeStr) {
    if (!timeStr) return;

    const [h, m] = timeStr.split(":").map(Number);
    const minEnd = addMinutes(h, m, 30);

    endPicker.set("minTime", minEnd);

    const currentEnd = document.getElementById("endTime").value;
    if (currentEnd && currentEnd < minEnd) {
        endPicker.clear();
    }
}

function addMinutes(h, m, add) {
    const total = h * 60 + m + add;
    const nh = String(Math.floor(total / 60)).padStart(2, "0");
    const nm = String(total % 60).padStart(2, "0");
    return `${nh}:${nm}`;
}

/* ======================
   예약 요청
====================== */
function submitReservation(e) {
    e.preventDefault();
    const form = e.target;

    // 선택된 scheduleId 값 가져오기 (비어있으면 null)
    const scheduleIdVal = form.scheduleId.value;

    const payload = {
        roomId: Number(form.roomId.value),

        // 업무 ID 추가 (값이 있을 때만 숫자로 변환, 없으면 null)
        scheduleId: scheduleIdVal ? Number(scheduleIdVal) : null,

        reserverId: 1, // TODO: 실제 로그인 유저 ID로 변경 필요
        title: form.title.value,
        description: form.description.value || null,
        startAt: `${form.date.value}T${form.startTime.value}:00`,
        endAt: `${form.date.value}T${form.endTime.value}:00`
    };

    fetch("/api/meeting-rooms/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then(res => {
            if (!res.ok) throw new Error("이미 예약된 시간입니다.");
            closeReservationModal();
            location.reload();
        })
        .catch(err => alert(err.message));
}

/* ======================
   초기화
====================== */
function resetReservationForm() {
    const form = document.getElementById("reservationForm");
    form.reset();

    startPicker.clear();
    endPicker.clear();

    // 시작 시간 항상 09:00 기준
    startPicker.setDate("09:00", false);
    startPicker.clear();

    endPicker.setDate("09:30", false);
    endPicker.clear();
}

/* ======================
   Utils
====================== */
function getToday() {
    return new Date().toISOString().slice(0, 10);
}
