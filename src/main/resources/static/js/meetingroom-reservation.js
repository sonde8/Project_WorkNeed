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
   시간 제한 계산 (운영시간 09-18시 및 업무시간 교집합)
====================== */
function updateTimeLimitsByDate(schStart, schEnd, selectedDate) {
    const getLocalDateStr = (d) => {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const selStr = getLocalDateStr(selectedDate);
    const startStr = getLocalDateStr(schStart);
    const endStr = getLocalDateStr(schEnd);

    // 회의실 기본 운영 시간 (09:00 ~ 18:00)
    let finalMin = new Date(selectedDate).setHours(9, 0, 0, 0);
    let finalMax = new Date(selectedDate).setHours(18, 0, 0, 0);

    // 1. 업무 시작일인 경우 시간 하한선 상향
    if (selStr === startStr) {
        const adjustedStart = roundUpTo30Min(new Date(schStart)).getTime();
        finalMin = Math.max(finalMin, adjustedStart);
    }

    // 2. 업무 종료일인 경우 시간 상한선 하향
    if (selStr === endStr) {
        const adjustedEnd = roundDownTo30Min(new Date(schEnd)).getTime();
        finalMax = Math.min(finalMax, adjustedEnd);
    }

    // [예외 처리] 이용 가능한 시간이 30분 미만인 경우 (예: 시작이 18:00 이후거나 종료가 09:00 이전)
    if (finalMin >= finalMax || finalMin >= new Date(selectedDate).setHours(18, 0, 0, 0) || finalMax <= new Date(selectedDate).setHours(9, 0, 0, 0)) {
        alert("선택한 날짜의 업무 시간 내에 회의실 이용 가능 시간(09:00~18:00)이 없습니다.");
        startPicker.clear();
        endPicker.clear();
        return;
    }

    const minTimeStr = formatTime(new Date(finalMin));
    const maxTimeStr = formatTime(new Date(finalMax));

    // 시작 시간 피커: 17:30을 넘지 못하게 고정
    startPicker.set("minTime", minTimeStr);
    startPicker.set("maxTime", "17:30");

    // 종료 시간 피커: 업무 마감 또는 18:00 중 빠른 시간
    endPicker.set("maxTime", maxTimeStr);

    // 값 강제 보정
    startPicker.setDate(minTimeStr, true);
    onStartTimeChange(null, minTimeStr);
}

/* ======================
   업무 선택 시 처리 함수
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

            datePicker.set("minDate", rawStart);
            datePicker.set("maxDate", rawEnd);

            let defaultDate = new Date(rawStart);
            const adjustedStartCheck = roundUpTo30Min(new Date(rawStart));
            if (adjustedStartCheck.getHours() >= 18 || (adjustedStartCheck.getHours() === 17 && adjustedStartCheck.getMinutes() > 30)) {
                defaultDate.setDate(defaultDate.getDate() + 1);
                // 만약 다음날이 업무 종료일을 벗어나면 다시 시작일로 고정 (예약 불가 알림용)
                if (defaultDate > rawEnd) defaultDate = new Date(rawStart);
            }

            datePicker.setDate(defaultDate);
            updateTimeLimitsByDate(rawStart, rawEnd, defaultDate);

            datePicker.set("onChange", (selectedDates) => {
                if (selectedDates.length > 0) {
                    updateTimeLimitsByDate(rawStart, rawEnd, selectedDates[0]);
                }
            });
        })
        .catch(err => console.error(err));
}

function resetDateTimePicker() {
    const dateInput = document.getElementById("reserveDate")._flatpickr;
    if (dateInput) {
        dateInput.set("minDate", "today");
        dateInput.set("maxDate", null);
        dateInput.set("onChange", null);
    }
    startPicker.set("minTime", "09:00");
    startPicker.set("maxTime", "17:30");
    endPicker.set("minTime", "09:30");
    endPicker.set("maxTime", "18:00");
}

/* ======================
   flatpickr 초기화
====================== */
function initPickers() {
    flatpickr("#reserveDate", { dateFormat: "Y-m-d", minDate: "today", defaultDate: new Date() });

    startPicker = flatpickr("#startTime", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        minuteIncrement: 30,
        allowInput: true,
        minTime: "09:00",
        maxTime: "17:30",
        onChange: onStartTimeChange,
        onClose: function(selectedDates, timeStr, instance) {
            const date = instance.latestSelectedDateObj;
            if (date) instance.setDate(roundUpTo30Min(date), true);
        }
    });

    endPicker = flatpickr("#endTime", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        minuteIncrement: 30,
        allowInput: true,
        minTime: "09:30",
        maxTime: "18:00",
        onClose: function(selectedDates, timeStr, instance) {
            const date = instance.latestSelectedDateObj;
            if (date) instance.setDate(roundDownTo30Min(date), true);
        }
    });
}

/* ======================
   예약 요청 제출
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

    if(!roomId || !dateVal || !startTime || !endTime || startTime === endTime) {
        alert("유효한 회의 시간을 선택해주세요.");
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
                throw new Error(errorMsg || "예약 중 오류 발생");
            }
            alert("예약이 완료되었습니다.");
            closeReservationModal();
            location.reload();
        })
        .catch(err => alert(err.message))
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
        .catch(err => console.error(err));
}

function loadScheduleSelect() {
    fetch("/api/calendar/schedules")
        .then(res => res.json())
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