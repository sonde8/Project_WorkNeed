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

    const scheduleSelect = document.getElementById("scheduleSelect");
    if (scheduleSelect) {
        scheduleSelect.addEventListener("change", () => {
            resetSubmitButton();
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

    if (!roomId || !dateVal || !startTime || !endTime || startTime >= endTime) {
        if (submitBtn) {
            submitBtn.disabled = true;
            submitBtn.innerText = (startTime && endTime && startTime >= endTime)
                ? "시간 오류" : "시간 선택 필요";
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
   시간 제한 계산 및 자동 보정 (업무 선택 시)
====================== */
function updateTimeLimitsByDate(schStart, schEnd, selectedDate) {
    const getLocalDateStr = (d) => {
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };

    const now = new Date();
    const selStr = getLocalDateStr(selectedDate);
    const startStr = getLocalDateStr(schStart);
    const endStr = getLocalDateStr(schEnd);
    const todayStr = getLocalDateStr(now);

    // [핵심] 기본 예약 시작은 09:00, 종료는 최소 09:30 (09:00 종료 불가)
    let finalMin = new Date(selectedDate).setHours(9, 0, 0, 0);
    let finalMax = new Date(selectedDate).setHours(18, 0, 0, 0);

    // 업무 시작일에 따른 제한
    if (selStr === startStr) {
        const adjustedStart = roundUpTo30Min(new Date(schStart)).getTime();
        finalMin = Math.max(finalMin, adjustedStart);
    }

    // 업무 종료일에 따른 제한
    if (selStr === endStr) {
        const adjustedEnd = roundDownTo30Min(new Date(schEnd)).getTime();
        finalMax = Math.min(finalMax, adjustedEnd);
    }

    // 오늘 날짜인 경우 현재 시간 이후로 제한
    if (selStr === todayStr) {
        const currentLimit = roundUpTo30Min(new Date(now)).getTime();
        finalMin = Math.max(finalMin, currentLimit);
    }

    // 날짜 유효성 체크
    if (new Date(selStr).getTime() < new Date(todayStr).getTime()) {
        alert("이미 지난 날짜는 예약할 수 없습니다.");
        document.getElementById("reserveDate")._flatpickr.clear();
        return;
    }

    if (finalMin >= finalMax) {
        alert("해당 날짜는 예약 가능한 시간이 지났거나 업무 종료 시각 이후입니다.");
        document.getElementById("reserveDate")._flatpickr.clear();
        return;
    }

    const minTimeStr = formatTime(new Date(finalMin));
    const maxTimeStr = formatTime(new Date(finalMax));

    // [수정] 종료 시간의 절대 최소값은 09:30으로 강제 (시작이 09:00일 때)
    let absoluteMinEnd = "09:30";
    const currentStartVal = document.getElementById("startTime").value;

    // 시작 시간이 선택되어 있다면 그보다 30분 뒤가 최소 종료 시간
    if (currentStartVal) {
        const [h, m] = currentStartVal.split(":").map(Number);
        let total = h * 60 + m + 30;
        absoluteMinEnd = `${String(Math.floor(total / 60)).padStart(2, "0")}:${String(total % 60).padStart(2, "0")}`;
    }

    // 피커 제한 설정
    startPicker.set("minTime", minTimeStr);
    startPicker.set("maxTime", formatTime(new Date(new Date(finalMax).getTime() - 30 * 60000)));

    endPicker.set("minTime", absoluteMinEnd); // 종료는 무조건 시작 +30분 또는 09:30부터
    endPicker.set("maxTime", maxTimeStr);

    /* --- 하단 자동 보정 로직 --- */

    // 1. 시작 시각 보정
    const currentStartTime = document.getElementById("startTime").value;
    if (!currentStartTime || currentStartTime < minTimeStr || currentStartTime >= maxTimeStr) {
        startPicker.setDate(minTimeStr, true);
    }

    // 2. 종료 시각 보정 (무조건 시작 시각보다 30분 뒤로 우선 설정)
    const updatedStart = document.getElementById("startTime").value;
    const [uh, um] = updatedStart.split(":").map(Number);
    let uTotal = uh * 60 + um + 30;
    const nextEnd = `${String(Math.floor(uTotal / 60)).padStart(2, "0")}:${String(uTotal % 60).padStart(2, "0")}`;

    const currentEndTime = document.getElementById("endTime").value;
    if (!currentEndTime || currentEndTime <= updatedStart || currentEndTime > maxTimeStr) {
        endPicker.setDate(nextEnd, true);
    }

    checkTimeOverlap();
}

/* ======================
   업무 선택 시 처리 함수
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
            const now = new Date();

            datePicker.set("minDate", rawStart);
            datePicker.set("maxDate", rawEnd);

            let defaultDate = new Date(rawStart);
            if (defaultDate < now) {
                defaultDate = new Date(now);
            }

            if (defaultDate > rawEnd) {
                alert("해당 업무는 이미 종료되었습니다.");
                resetReservationForm();
                return;
            }

            datePicker.setDate(defaultDate);
            updateTimeLimitsByDate(rawStart, rawEnd, defaultDate);

            datePicker.set("onChange", (selectedDates) => {
                resetSubmitButton();
                if (selectedDates.length > 0) {
                    updateTimeLimitsByDate(rawStart, rawEnd, selectedDates[0]);
                }
            });
        })
        .catch(err => console.error("업무 상세 로드 실패:", err));
}

function resetDateTimePicker() {
    const dateInput = document.getElementById("reserveDate")._flatpickr;
    if (dateInput) {
        dateInput.set("minDate", "today");
        dateInput.set("maxDate", null);
        dateInput.set("onChange", function() {
            resetSubmitButton();
            checkTimeOverlap();
        });
    }
    updateGeneralTimeLimits(false);
}

/* ======================
   업무 미선택 시 기본 제한 (9:30 최소 종료 반영)
====================== */
function updateGeneralTimeLimits(isToday) {
    let minStart = "09:00";
    if (isToday) {
        minStart = formatTime(roundUpTo30Min(new Date()));
    }

    // 시작은 09:00부터 가능하지만
    startPicker.set("minTime", minStart);
    startPicker.set("maxTime", "17:30");

    // 종료는 아무리 빨라도 09:30부터 가능 (시작 09:00 + 30분)
    const [h, m] = minStart.split(":").map(Number);
    let minEndTotal = Math.max(9 * 60 + 30, h * 60 + m + 30);
    const minEndStr = `${String(Math.floor(minEndTotal / 60)).padStart(2, "0")}:${String(minEndTotal % 60).padStart(2, "0")}`;

    endPicker.set("minTime", minEndStr);
    endPicker.set("maxTime", "18:00");

    // 초기값 세팅
    if (!document.getElementById("startTime").value) {
        startPicker.setDate(minStart, false);
        endPicker.setDate(minEndStr, false);
    }
}

/* ======================
   시간 연동 핵심 로직 (시작 <-> 종료)
====================== */
function onStartTimeChange(selectedDates, timeStr) {
    if (!timeStr) return;
    const [h, m] = timeStr.split(":").map(Number);
    let total = h * 60 + m + 30;
    const nh = String(Math.floor(total / 60)).padStart(2, "0");
    const nm = String(total % 60).padStart(2, "0");
    const minEnd = `${nh}:${nm}`;

    endPicker.set("minTime", minEnd);
    if (document.getElementById("endTime").value <= timeStr) {
        endPicker.setDate(minEnd, true);
    }
    checkTimeOverlap();
}

/**
 * 종료 시간 변경 시 시작 시간을 자동으로 보정 (업무 제한 준수)
 */
function onEndTimeChange(selectedDates, timeStr) {
    if (!timeStr) return;

    const startTimeInput = document.getElementById("startTime");
    const currentStartTime = startTimeInput.value;
    const absoluteMinTime = startPicker.config.minTime || "09:00";

    if (currentStartTime && currentStartTime >= timeStr) {
        const [h, m] = timeStr.split(":").map(Number);
        let total = h * 60 + m - 30;

        const [minH, minM] = absoluteMinTime.split(":").map(Number);
        const minTotal = minH * 60 + minM;

        if (total < minTotal) total = minTotal;

        const nh = String(Math.floor(total / 60)).padStart(2, "0");
        const nm = String(total % 60).padStart(2, "0");
        const newStart = `${nh}:${nm}`;

        if (newStart < timeStr) {
            startPicker.setDate(newStart, false);
        } else {
            startPicker.setDate(absoluteMinTime, false);
        }
    }
    checkTimeOverlap();
}

/* ======================
   flatpickr 초기화
====================== */
function initPickers() {
    flatpickr("#reserveDate", {
        dateFormat: "Y-m-d",
        minDate: "today",
        defaultDate: new Date(),
        onChange: (selectedDates) => {
            resetSubmitButton();
            const scheduleId = document.getElementById("scheduleSelect").value;
            if (!scheduleId) {
                const now = new Date();
                const todayStr = now.getFullYear() + '-' + String(now.getMonth() + 1).padStart(2, '0') + '-' + String(now.getDate()).padStart(2, '0');
                const selStr = flatpickr.formatDate(selectedDates[0], "Y-m-d");
                updateGeneralTimeLimits(selStr === todayStr);
            }
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
            resetSubmitButton();
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
        onChange: (selectedDates, timeStr) => {
            resetSubmitButton();
            onEndTimeChange(selectedDates, timeStr);
        },
        onClose: function(selectedDates, timeStr, instance) {
            const date = instance.latestSelectedDateObj;
            if (date) instance.setDate(roundDownTo30Min(date), true);
            checkTimeOverlap();
        }
    });
}

function submitReservation(e) {
    e.preventDefault();
    if (isSubmitting) return;

    const form = e.target;
    const submitBtn = form.querySelector('button[type="submit"]');

    const roomId = form.roomId.value;
    const dateVal = form.date.value;
    const startTime = form.startTime.value;
    const endTime = form.endTime.value;

    if (!roomId || !dateVal || !startTime || !endTime || startTime >= endTime) {
        alert("유효한 시간을 선택해주세요.");
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
            checkTimeOverlap();
        });
}

function openReservationModal(targetRoomId = null) {
    resetReservationForm();
    loadRoomSelect(targetRoomId);
    loadScheduleSelect();
    document.getElementById("reservationModal").classList.remove("hidden");
    resetSubmitButton();
    setTimeout(() => {
        const startVal = document.getElementById("startTime").value;
        if (startVal) onStartTimeChange(null, startVal);
        checkTimeOverlap();
    }, 500);
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
            const now = new Date();

            schedules.forEach(sch => {
                const opt = document.createElement("option");
                opt.value = sch.id;
                const isDone = (sch.status === 'DONE');
                let isExpired = false;

                if (sch.end) {
                    const endAt = new Date(sch.end);
                    isExpired = (endAt.getTime() < now.getTime());
                } else {
                    isExpired = true;
                }

                if (isDone || isExpired) {
                    opt.disabled = true;
                    opt.style.color = "#bbb";
                    let reason = isDone ? "완료됨" : "기간 만료";
                    opt.textContent = `[선택불가] ${sch.title} (${reason})`;
                } else {
                    opt.textContent = `[${sch.eventType || '업무'}] ${sch.title}`;
                    opt.disabled = false;
                    opt.style.color = "";
                }
                select.appendChild(opt);
            });
        })
        .catch(err => console.error("업무 목록 로드 실패:", err));
}

function resetReservationForm() {
    const form = document.getElementById("reservationForm");
    if (form) form.reset();
    resetDateTimePicker();
}