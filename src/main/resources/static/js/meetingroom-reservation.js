var startPicker;
var endPicker;
let isSubmitting = false; // 중복 제출 방지 플래그

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

    const scheduleSelect = document.getElementById("scheduleSelect");
    if (scheduleSelect) {
        scheduleSelect.addEventListener("change", handleScheduleChange);
    }
}

/* ======================
   30분 단위 보정 유틸리티
====================== */
// 시작 시간용: 업무 시작보다 뒤에 있는 가장 가까운 30분 단위 (올림)
function roundUpTo30Min(date) {
    const minutes = date.getMinutes();
    const newDate = new Date(date);
    if (minutes > 0 && minutes <= 30) {
        newDate.setMinutes(30);
    } else if (minutes > 30) {
        newDate.setHours(newDate.getHours() + 1);
        newDate.setMinutes(0);
    }
    newDate.setSeconds(0);
    return newDate;
}

// 종료 시간용: 업무 종료보다 앞에 있는 가장 가까운 30분 단위 (내림)
function roundDownTo30Min(date) {
    const minutes = date.getMinutes();
    const newDate = new Date(date);
    if (minutes < 30) {
        newDate.setMinutes(0);
    } else {
        newDate.setMinutes(30);
    }
    newDate.setSeconds(0);
    return newDate;
}

function formatTime(date) {
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/* ======================
   업무 선택 시 처리 함수 (alert 제거 및 18:00 제한 반영)
====================== */
function handleScheduleChange(e) {
    const scheduleId = e.target.value;
    const datePicker = document.getElementById("reserveDate")._flatpickr;

    if (!scheduleId) {
        resetDateTimePicker();
        return;
    }

    fetch(`/schedule/api/detail/${scheduleId}`)
        .then(res => {
            if (!res.ok) throw new Error("업무 정보를 가져올 수 없습니다.");
            return res.json();
        })
        .then(schedule => {
            const rawStart = new Date(schedule.startAt);
            const rawEnd = new Date(schedule.endAt);

            // 1. 업무 시간 보정 (시작은 올림, 종료는 내림)
            let adjustedStart = roundUpTo30Min(rawStart);
            let adjustedEnd = roundDownTo30Min(rawEnd);

            // 2. 회의실 운영 시간(09:00 ~ 18:00) 기준 예외 처리
            if (adjustedStart.getHours() < 9) {
                adjustedStart.setHours(9, 0, 0);
            }
            if (adjustedEnd.getHours() >= 18) {
                adjustedEnd.setHours(18, 0, 0);
            }

            // 날짜 피커 제한 및 자동 설정
            datePicker.set("minDate", rawStart);
            datePicker.set("maxDate", rawEnd);
            datePicker.setDate(rawStart);

            const minTimeStr = formatTime(adjustedStart);
            const maxTimeStr = formatTime(adjustedEnd);

            // 시작 시간 피커 제한
            startPicker.set("minTime", minTimeStr);
            startPicker.set("maxTime", "17:30");

            // 종료 시간 피커 제한 (최대 18:00)
            endPicker.set("maxTime", maxTimeStr);

            // 피커 값 자동 업데이트 (알림창 없이 즉시 반영)
            startPicker.setDate(minTimeStr);
            onStartTimeChange(null, minTimeStr);
        })
        .catch(err => {
            console.error(err);
        });
}

/* ======================
   초기화 및 제출 (기능 유지)
====================== */
function resetDateTimePicker() {
    const dateInput = document.getElementById("reserveDate")._flatpickr;
    if (dateInput) {
        dateInput.set("minDate", "today");
        dateInput.set("maxDate", null);
    }
    startPicker.set("minTime", "09:00");
    startPicker.set("maxTime", "17:30");
    endPicker.set("minTime", "09:30");
    endPicker.set("maxTime", "18:00");
}

function initPickers() {
    flatpickr("#reserveDate", { dateFormat: "Y-m-d", minDate: "today", defaultDate: new Date() });

    startPicker = flatpickr("#startTime", {
        enableTime: true, noCalendar: true, dateFormat: "H:i", time_24hr: true,
        minuteIncrement: 30, minTime: "09:00", maxTime: "17:30",
        onChange: onStartTimeChange
    });

    endPicker = flatpickr("#endTime", {
        enableTime: true, noCalendar: true, dateFormat: "H:i", time_24hr: true,
        minuteIncrement: 30, minTime: "09:30", maxTime: "18:00"
    });
}

/* ======================
   예약 요청 제출 (에러 메시지 처리 개선)
====================== */
function submitReservation(e) {
    e.preventDefault();

    if (isSubmitting) return;

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');

    const roomId = form.roomId.value;
    const dateVal = form.date.value;
    const startTime = form.startTime.value;
    const endTime = form.endTime.value;

    if(!roomId || !dateVal || !startTime || !endTime) {
        // 필수 입력 경고는 유지하되 간단하게 표시
        alert("회의실과 시간을 선택해주세요.");
        return;
    }

    const payload = {
        roomId: Number(roomId),
        scheduleId: form.scheduleId.value ? Number(form.scheduleId.value) : null,
        startAt: `${dateVal}T${startTime}:00`,
        endAt: `${dateVal}T${endTime}:00`
    };

    isSubmitting = true;
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = "처리 중...";
    }

    fetch("/api/meeting-rooms/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then(async res => {
            if (!res.ok) {
                const errorMsg = await res.text();
                // 서버에서 보낸 에러가 중복 예약 관련일 경우 예쁘게 필터링
                if (errorMsg.includes("이미") || errorMsg.includes("중복")) {
                    throw new Error("이미 예약된 회의실이 있습니다.");
                }
                throw new Error(errorMsg || "예약 처리 중 오류가 발생했습니다.");
            }
            alert("예약이 완료되었습니다.");
            closeReservationModal();

            if (typeof loadMeetingRoomStatus === 'function') {
                loadMeetingRoomStatus();
            } else {
                location.reload();
            }
        })
        .catch(err => {
            // [수정] "이미 예약된 회의실이 있습니다." 형태의 경고창으로 표시
            console.error("Reservation Error:", err.message);
            alert(err.message);
        })
        .finally(() => {
            isSubmitting = false;
            if (submitBtn) {
                submitBtn.disabled = false;
                submitBtn.innerText = "예약하기";
            }
        });
}
function onStartTimeChange(selectedDates, timeStr) {
    if (!timeStr) return;
    const [h, m] = timeStr.split(":").map(Number);
    let total = h * 60 + m + 30;
    const nh = String(Math.floor(total / 60)).padStart(2, "0");
    const nm = String(total % 60).padStart(2, "0");
    const minEnd = `${nh}:${nm}`;

    endPicker.set("minTime", minEnd);
    if (document.getElementById("endTime").value <= timeStr) {
        endPicker.setDate(minEnd, false);
    }
}

function openReservationModal(targetRoomId = null) {
    resetReservationForm();
    loadRoomSelect(targetRoomId);
    loadScheduleSelect();
    document.getElementById("reservationModal").classList.remove("hidden");
}

function closeReservationModal() {
    document.getElementById("reservationModal").classList.add("hidden");
}

function loadRoomSelect(targetRoomId) {
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
            if (targetRoomId) select.value = targetRoomId;
        })
        .catch(err => console.error("회의실 목록 로드 실패:", err));
}

function loadScheduleSelect() {
    fetch("/api/calendar/schedules")
        .then(res => {
            if (!res.ok) throw new Error("업무 목록을 불러오지 못했습니다.");
            return res.json();
        })
        .then(schedules => {
            const select = document.getElementById("scheduleSelect");
            select.innerHTML = '<option value="">(*업무 선택 안함*)</option>';
            schedules.forEach(sch => {
                const opt = document.createElement("option");
                opt.value = sch.id;
                opt.textContent = `[${sch.eventType || '업무'}] ${sch.title}`;
                select.appendChild(opt);
            });
        })
        .catch(err => console.error(err));
}

function resetReservationForm() {
    const form = document.getElementById("reservationForm");
    if (form) form.reset();
    resetDateTimePicker();
}










