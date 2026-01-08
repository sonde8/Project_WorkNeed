var startPicker;
var endPicker;
let isSubmitting = false;

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

    // [수정] 모든 주요 입력값이 바뀔 때 버튼 상태를 즉시 리셋하고 새로 체크합니다.
    const scheduleSelect = document.getElementById("scheduleSelect");
    if (scheduleSelect) {
        scheduleSelect.addEventListener("change", () => {
            resetSubmitButton(); // 버튼 즉시 비활성화
            handleScheduleChange();
        });
    }

    const roomSelect = document.getElementById("roomSelect");
    if (roomSelect) {
        roomSelect.addEventListener("change", () => {
            resetSubmitButton();
            checkTimeOverlap();
        });
    }
}

/**
 * [추가] 체크 결과가 나오기 전까지 버튼을 안전하게 막아두는 함수
 */
function resetSubmitButton() {
    const submitBtn = document.querySelector('#reservationForm button[type="submit"]');
    if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.innerText = "확인 중...";
        submitBtn.style.backgroundColor = "#eee";
        submitBtn.style.color = "#888";
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
   실시간 중복 예약 체크 로직
====================== */
function checkTimeOverlap() {
    const roomId = document.getElementById("roomSelect").value;
    const dateVal = document.getElementById("reserveDate").value;
    const startTime = document.getElementById("startTime").value;
    const endTime = document.getElementById("endTime").value;
    const scheduleId = document.getElementById("scheduleSelect").value;
    const submitBtn = document.querySelector('#reservationForm button[type="submit"]');

    // 필수 값이 하나라도 없으면 버튼을 비활성화 상태로 유지
    if (!roomId || !dateVal || !startTime || !endTime) {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = "시간 선택 필요";
            submitBtn.style.backgroundColor = "#eee";
        }
        return;
    }

    fetch(`/api/meeting-rooms/status?date=${dateVal}`)
        .then(res => res.json())
        .then(rooms => {
            const newStart = new Date(`${dateVal}T${startTime}:00`);
            const newEnd = new Date(`${dateVal}T${endTime}:00`);

            let isOverlap = false;
            let errorMsg = "";

            if (scheduleId) {
                const alreadyReservedTaskInTime = rooms.some(room =>
                        room.reservations && room.reservations.some(res => {
                            if (String(res.scheduleId) !== String(scheduleId)) return false;
                            const exStart = new Date(res.startAt);
                            const exEnd = new Date(res.endAt);
                            return newStart < exEnd && newEnd > exStart;
                        })
                );
                if (alreadyReservedTaskInTime) {
                    isOverlap = true;
                    errorMsg = "중복 예약됨 (업무)";
                }
            }

            if (!isOverlap) {
                const targetRoom = rooms.find(r => String(r.roomId) === String(roomId));
                if (targetRoom && targetRoom.reservations) {
                    const timeOverlap = targetRoom.reservations.some(res => {
                        const exStart = new Date(res.startAt);
                        const exEnd = new Date(res.endAt);
                        return newStart < exEnd && newEnd > exStart;
                    });
                    if (timeOverlap) {
                        isOverlap = true;
                        errorMsg = "예약 불가";
                    }
                }
            }

            if (isOverlap) {
                submitBtn.disabled = true;
                submitBtn.innerText = errorMsg;
                submitBtn.style.backgroundColor = "#f8d7da";
                submitBtn.style.color = "#721c24";
            } else {
                submitBtn.disabled = false;
                submitBtn.innerText = "예약하기";
                submitBtn.style.backgroundColor = "";
                submitBtn.style.color = "";
            }
        })
        .catch(err => {
            console.error("체크 실패:", err);
            resetSubmitButton();
        });
}

/* ======================
   시간 제한 계산
====================== */
function updateTimeLimitsByDate(schStart, schEnd, selectedDate) {
    const getLocalDateStr = (d) => {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const selStr = getLocalDateStr(selectedDate);
    const startStr = getLocalDateStr(schStart);
    const endStr = getLocalDateStr(schEnd);

    let finalMin = new Date(selectedDate).setHours(9, 0, 0, 0);
    let finalMax = new Date(selectedDate).setHours(18, 0, 0, 0);

    if (selStr === startStr) {
        const adjustedStart = roundUpTo30Min(new Date(schStart)).getTime();
        finalMin = Math.max(finalMin, adjustedStart);
    }

    if (selStr === endStr) {
        const adjustedEnd = roundDownTo30Min(new Date(schEnd)).getTime();
        finalMax = Math.min(finalMax, adjustedEnd);
    }

    if (finalMin >= finalMax || finalMin >= new Date(selectedDate).setHours(18, 0, 0, 0) || finalMax <= new Date(selectedDate).setHours(9, 0, 0, 0)) {
        alert("선택한 날짜의 업무 시간 내에 회의실 이용 가능 시간(09:00~18:00)이 없습니다.");
        const datePicker = document.getElementById("reserveDate")._flatpickr;
        datePicker.clear();
        startPicker.clear();
        endPicker.clear();
        resetSubmitButton();
        return;
    }

    const minTimeStr = formatTime(new Date(finalMin));
    const maxTimeStr = formatTime(new Date(finalMax));

    startPicker.set("minTime", minTimeStr);
    startPicker.set("maxTime", "17:30");
    endPicker.set("minTime", minTimeStr);
    endPicker.set("maxTime", maxTimeStr);

    startPicker.setDate(minTimeStr, true);
    onStartTimeChange(null, minTimeStr);
}

/* ======================
   업무 선택 시 처리 함수 (수정)
====================== */
function handleScheduleChange() {
    const scheduleId = document.getElementById("scheduleSelect").value;
    const datePicker = document.getElementById("reserveDate")._flatpickr;

    if (!scheduleId) {
        resetDateTimePicker();
        checkTimeOverlap();
        return;
    }

    fetch(`/schedule/api/detail/${scheduleId}`)
        .then(res => res.json())
        .then(schedule => {
            const rawStart = new Date(schedule.startAt);
            const rawEnd = new Date(schedule.endAt);

            datePicker.set("minDate", rawStart);
            datePicker.set("maxDate", rawEnd);

            let defaultDate = new Date(rawStart);
            const adjustedStartCheck = roundUpTo30Min(new Date(rawStart));
            if (adjustedStartCheck.getHours() >= 18) {
                defaultDate.setDate(defaultDate.getDate() + 1);
                if (defaultDate > rawEnd) defaultDate = new Date(rawStart);
            }

            datePicker.setDate(defaultDate);
            updateTimeLimitsByDate(rawStart, rawEnd, defaultDate);

            // [추가] 날짜 선택기 설정 시 onChange를 재정의하여 즉각 반응하도록 함
            datePicker.set("onChange", (selectedDates) => {
                resetSubmitButton(); // 날짜 바뀌자마자 버튼 막기
                if (selectedDates.length > 0) {
                    updateTimeLimitsByDate(rawStart, rawEnd, selectedDates[0]);
                    checkTimeOverlap();
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
        dateInput.set("onChange", checkTimeOverlap);
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
    flatpickr("#reserveDate", {
        dateFormat: "Y-m-d",
        minDate: "today",
        defaultDate: new Date(),
        onChange: () => {
            resetSubmitButton(); // 날짜 변경 시 즉시 버튼 비활성화
            checkTimeOverlap();
        }
    });

    startPicker = flatpickr("#startTime", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        minuteIncrement: 30,
        minTime: "09:00",
        maxTime: "17:30",
        onChange: (selectedDates, timeStr) => {
            resetSubmitButton(); // 시간 변경 시작 시 버튼 비활성화
            onStartTimeChange(selectedDates, timeStr);
        },
        onClose: function(selectedDates, timeStr, instance) {
            const date = instance.latestSelectedDateObj;
            if (date) instance.setDate(roundUpTo30Min(date), true);
            checkTimeOverlap();
        }
    });

    endPicker = flatpickr("#endTime", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        minuteIncrement: 30,
        minTime: "09:30",
        maxTime: "18:00",
        onChange: () => {
            resetSubmitButton();
            checkTimeOverlap();
        },
        onClose: function(selectedDates, timeStr, instance) {
            const date = instance.latestSelectedDateObj;
            if (date) instance.setDate(roundDownTo30Min(date), true);
            checkTimeOverlap();
        }
    });
}

/* ======================
   예약 요청 제출 및 기타 (생략 없이 유지)
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
    submitBtn.disabled = true;
    submitBtn.innerText = "처리 중...";

    fetch("/api/meeting-rooms/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
    })
        .then(async res => {
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.error || "예약 중 오류 발생");
            }
            alert("예약이 완료되었습니다.");
            closeReservationModal();
            location.reload();
        })
        .catch(err => {
            alert(err.message);
            isSubmitting = false;
            checkTimeOverlap(); // 실패 시 상태 재점검
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
    checkTimeOverlap();
}

function openReservationModal(targetRoomId = null) {
    resetReservationForm();
    loadRoomSelect(targetRoomId);
    loadScheduleSelect();
    document.getElementById("reservationModal").classList.remove("hidden");
    resetSubmitButton();
    setTimeout(checkTimeOverlap, 500);
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
        });
}

function loadScheduleSelect() {
    fetch("/api/calendar/schedules")
        .then(res => res.json())
        .then(schedules => {
            const select = document.getElementById("scheduleSelect");
            select.innerHTML = '<option value="">업무 선택 안 함</option>';
            schedules.forEach(sch => {
                const opt = document.createElement("option");
                opt.value = sch.id;
                opt.textContent = `[${sch.eventType || '업무'}] ${sch.title}`;
                select.appendChild(opt);
            });
        });
}

function resetReservationForm() {
    const form = document.getElementById("reservationForm");
    if (form) form.reset();
    resetDateTimePicker();
}