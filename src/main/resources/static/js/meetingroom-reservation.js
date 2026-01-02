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
    // 모달 닫기 버튼
    document.getElementById("closeModalBtn")
        .addEventListener("click", closeReservationModal);

    // 예약 폼 제출
    document.getElementById("reservationForm")
        .addEventListener("submit", submitReservation);
}

/* ======================
   flatpickr 초기화
====================== */
function initPickers() {
    // 날짜 선택
    flatpickr("#reserveDate", {
        dateFormat: "Y-m-d",
        minDate: "today",
        defaultDate: new Date()
    });

    // 시작 시간 (30분 단위)
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

    // 종료 시간 (30분 단위)
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
    loadScheduleSelect(); // ★ 내 업무 리스트 가져오기
    document.getElementById("reservationModal").classList.remove("hidden");
}

function closeReservationModal() {
    document.getElementById("reservationModal").classList.add("hidden");
}

/* ======================
   회의실 목록 불러오기
====================== */
function loadRoomSelect() {
    // 오늘 날짜 기준 현황을 가져오되, 여기선 단순 목록용으로만 활용
    // (만약 회의실 목록만 주는 별도 API가 있다면 그걸 쓰는 게 더 좋음)
    const today = new Date().toISOString().slice(0, 10);

    fetch(`/api/meeting-rooms/status?date=${today}`)
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
        })
        .catch(err => console.error("회의실 목록 로드 실패:", err));
}

/* ======================
   내 업무 목록 불러오기 (수정됨)
====================== */
function loadScheduleSelect() {
    // ★ 캘린더 작업 때 만들어둔 "내 업무 조회" API 재사용
    fetch("/api/calendar/schedules")
        .then(res => {
            if (!res.ok) throw new Error("업무 목록을 불러오지 못했습니다.");
            return res.json();
        })
        .then(schedules => {
            const select = document.getElementById("scheduleSelect");

            // 초기화
            select.innerHTML = '<option value="">(선택 안함 - 단순 회의)</option>';

            schedules.forEach(sch => {
                const opt = document.createElement("option");
                // CalendarEventDTO의 id는 schedule_id임
                opt.value = sch.id;
                // 예: [TASK] 기획서 작성
                opt.textContent = `[${sch.eventType || '업무'}] ${sch.title}`;
                select.appendChild(opt);
            });
        })
        .catch(err => console.error(err));
}

/* ======================
   시작 → 종료 시간 자동 조정
====================== */
function onStartTimeChange(selectedDates, timeStr) {
    if (!timeStr) return;

    const [h, m] = timeStr.split(":").map(Number);
    // 시작 시간보다 최소 30분 뒤여야 함
    const minEnd = addMinutes(h, m, 30);

    endPicker.set("minTime", minEnd);

    const currentEnd = document.getElementById("endTime").value;
    // 현재 선택된 종료 시간이 시작 시간보다 빠르면 초기화
    if (currentEnd && currentEnd <= timeStr) {
        endPicker.setDate(minEnd, false);
    }
}

function addMinutes(h, m, add) {
    let total = h * 60 + m + add;
    const nh = String(Math.floor(total / 60)).padStart(2, "0");
    const nm = String(total % 60).padStart(2, "0");
    return `${nh}:${nm}`;
}

/* ======================
   예약 요청 제출
====================== */
function submitReservation(e) {
    e.preventDefault();
    const form = e.target;

    // 1. 필수값 체크
    const roomId = form.roomId.value;
    const dateVal = form.date.value;
    const startTime = form.startTime.value;
    const endTime = form.endTime.value;

    if(!roomId || !dateVal || !startTime || !endTime) {
        alert("회의실, 날짜, 시간은 필수입니다.");
        return;
    }

    // 2. scheduleId 처리 (값이 없으면 null)
    const scheduleIdVal = form.scheduleId.value;
    const scheduleId = scheduleIdVal ? Number(scheduleIdVal) : null;

    // 3. Payload 생성
    const payload = {
        roomId: Number(roomId),
        scheduleId: scheduleId,

        // ★ reserverId는 보내지 않음 (Controller가 세션에서 처리)

        title: form.title.value,
        description: form.description.value || null,

        // LocalDateTime 형식 (YYYY-MM-DDTHH:mm:00)
        startAt: `${dateVal}T${startTime}:00`,
        endAt: `${dateVal}T${endTime}:00`
    };

    // 4. 전송
    fetch("/api/meeting-rooms/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then(res => {
            if (!res.ok) {
                // 서버에서 에러 메시지를 줄 경우 처리
                return res.text().then(text => { throw new Error(text || "예약에 실패했습니다."); });
            }
            alert("예약되었습니다.");
            closeReservationModal();
            location.reload(); // 현황판 갱신
        })
        .catch(err => {
            console.error(err);
            alert(err.message); // "이미 예약된 시간입니다" 등
        });
}

/* ======================
   폼 초기화
====================== */
function resetReservationForm() {
    const form = document.getElementById("reservationForm");
    form.reset();

    // 플랫피커 초기화
    startPicker.clear();
    endPicker.clear();
    startPicker.setDate("09:00", false);
    endPicker.setDate("09:30", false);

    // 날짜는 오늘로 재설정
    const dateInput = document.getElementById("reserveDate");
    if(dateInput && dateInput._flatpickr) {
        dateInput._flatpickr.setDate(new Date());
    }
}