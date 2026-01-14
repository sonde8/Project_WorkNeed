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

// 시스템 기준 예약 가능한 가장 빠른 날짜/시간 계산
function getInitialDateTime() {
    const now = new Date();
    let h = now.getHours();
    let m = now.getMinutes();
    const isLate = (h > 17 || (h === 17 && m > 30));
    const dateObj = new Date(now);
    dateObj.setHours(0, 0, 0, 0);

    if (isLate) {
        dateObj.setDate(dateObj.getDate() + 1);
        h = 9;
        m = 0;
    } else if (h < 9) {
        h = 9;
        m = 0;
    } else {
        if (m > 30) {
            h += 1;
            m = 0;
        } else if (m > 0) {
            m = 30;
        }
    }

    // 문자열 포맷팅 (YYYY-MM-DD)
    const yyyy = dateObj.getFullYear();
    const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
    const dd = String(dateObj.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    // 시간 문자열 (HH:MM)
    const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

    return { dateStr, timeStr, dateObj };
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
   날짜별 시간 제한 계산 (업무 시작/종료 시간 + 현재 시간 제한)
====================== */
function updateTimeLimitsWithSchedule(dateStr, schedule) {
    // 1. 기본 운영 시간 (09:00 ~ 18:00)
    let minTimeLimit = "09:00";
    let maxTimeLimit = "18:00";

    // 2. [시스템 제한] '오늘'인 경우 현재 시간 이전 선택 불가
    // getInitialDateTime을 사용하여 17:30 이후면 내일로 처리
    const initData = getInitialDateTime();
    const todayStr = new Date().toISOString().slice(0, 10);

    if (dateStr === todayStr) {
        // 오늘이면 "현재 시간(30분 올림)"과 "09:00" 중 늦은 시간 적용
        minTimeLimit = (initData.timeStr > "09:00") ? initData.timeStr : "09:00";
    }

    // 3. [업무 스케줄 제한] 업무 시작일/종료일에 따른 제한 적용
    if (schedule) {
        // A. 업무 시작일 체크
        if (schedule.startAt) {
            const taskStart = new Date(schedule.startAt);
            const taskStartDateStr = taskStart.toISOString().slice(0, 10);

            if (dateStr === taskStartDateStr) {
                const h = String(taskStart.getHours()).padStart(2, "0");
                const m = String(taskStart.getMinutes()).padStart(2, "0");
                const taskStartTime = `${h}:${m}`;

                // 업무 시작 시간이 기본 제한보다 늦으면 덮어씌움
                // 예: 업무가 14:00 시작이면 오전 예약 불가
                if (taskStartTime > minTimeLimit) {
                    minTimeLimit = taskStartTime;
                }
            }
        }

        // B. 업무 종료일 체크 (종료 시간 제한 로직 추가)
        if (schedule.endAt) {
            const taskEnd = new Date(schedule.endAt);
            const taskEndDateStr = taskEnd.toISOString().slice(0, 10);

            if (dateStr === taskEndDateStr) {
                const h = String(taskEnd.getHours()).padStart(2, "0");
                const m = String(taskEnd.getMinutes()).padStart(2, "0");
                const taskEndTime = `${h}:${m}`;

                // 업무 종료 시간이 18:00보다 빠르면 그 시간으로 제한
                // 예: 업무가 13:30 종료면 14:00 예약 불가
                if (taskEndTime < maxTimeLimit) {
                    maxTimeLimit = taskEndTime;
                }
            }
        }
    }

    // 4. Start Picker (시작 시간) 설정
    // 시작 시간의 최대값 = (종료 제한 시간 - 30분)
    const [maxH, maxM] = maxTimeLimit.split(":").map(Number);
    let startMaxTotal = maxH * 60 + maxM - 30;

    // 계산된 값이 09:00보다 작으면 최소값으로 보정
    if (startMaxTotal < 9 * 60) startMaxTotal = 9 * 60;

    const smH = String(Math.floor(startMaxTotal / 60)).padStart(2, "0");
    const smM = String(startMaxTotal % 60).padStart(2, "0");
    const startMaxTime = `${smH}:${smM}`;

    startPicker.set("minTime", minTimeLimit);
    startPicker.set("maxTime", startMaxTime);

    // 5. End Picker (종료 시간) 설정
    // 종료 시간의 최소값 = (시작 제한 시간 + 30분)
    const [minH, minM] = minTimeLimit.split(":").map(Number);
    let endMinTotal = minH * 60 + minM + 30;
    const emH = String(Math.floor(endMinTotal / 60)).padStart(2, "0");
    const emM = String(endMinTotal % 60).padStart(2, "0");
    const endMinTime = `${emH}:${emM}`;

    endPicker.set("minTime", endMinTime);
    endPicker.set("maxTime", maxTimeLimit);

    // 6. 값이 범위 밖이면 리셋 (자동 보정)
    const currentStart = document.getElementById("startTime").value;
    const currentEnd = document.getElementById("endTime").value;

    if (currentStart && (currentStart < minTimeLimit || currentStart > startMaxTime)) {
        startPicker.setDate(minTimeLimit, true); // 범위 밖이면 최소 시작시간으로
    }
    if (currentEnd && currentEnd > maxTimeLimit) {
        endPicker.setDate(maxTimeLimit, true); // 범위 밖이면 최대 종료시간으로
    }
}

/* ======================
   업무(스케줄) 선택 시 처리 로직
====================== */
function handleScheduleChange() {
    const scheduleId = document.getElementById("scheduleSelect").value;
    const datePicker = document.getElementById("reserveDate")._flatpickr;

    // 업무 선택 취소 시 리셋
    if (!scheduleId) {
        resetDateTimePicker();
        checkTimeOverlap();
        return;
    }

    fetch(`/schedule/api/detail/${scheduleId}`)
        .then(res => res.json())
        .then(schedule => {
            // 1. 업무 시작일/종료일 (시간 제거하고 날짜만 비교)
            const taskStart = new Date(schedule.startAt);
            taskStart.setHours(0,0,0,0);

            const taskEnd = new Date(schedule.endAt);
            taskEnd.setHours(0,0,0,0);

            // 2. 시스템상 예약 가능한 최소 날짜 (지금 23시면 -> 내일 날짜 객체)
            const initData = getInitialDateTime();
            const sysMinDate = initData.dateObj;

            // 3. 실제 예약 가능 시작일 = (업무시작일 vs 시스템최소일) 중 늦은 날짜
            // 예: 업무가 11일 시작, 시스템은 12일부터 가능 -> effectiveMinDate는 12일
            let effectiveMinDate = (taskStart > sysMinDate) ? taskStart : sysMinDate;

            // 4. 유효성 검사
            if (effectiveMinDate > taskEnd) {
                alert("예약 가능한 기간이 지났습니다.");
                document.getElementById("scheduleSelect").value = "";
                resetDateTimePicker();
                return;
            }

            // 5. 달력 제한 설정
            datePicker.set("minDate", effectiveMinDate);
            datePicker.set("maxDate", taskEnd);

            // 6. Date 객체를 로컬 날짜 문자열(YYYY-MM-DD)로 정확히 변환 (UTC로 변환 제어)
            const yyyy = effectiveMinDate.getFullYear();
            const mm = String(effectiveMinDate.getMonth() + 1).padStart(2, "0");
            const dd = String(effectiveMinDate.getDate()).padStart(2, "0");
            const effectiveDateStr = `${yyyy}-${mm}-${dd}`;

            // 7. 계산된 날짜로 강제 세팅 (이벤트 트리거 false)
            // 값을 먼저 넣고, 아래에서 시간 제한을 적용함
            datePicker.setDate(effectiveDateStr, false);

            // 8. 날짜 변경 이벤트 재정의
            datePicker.set("onChange", function(selectedDates, dateStr) {
                resetSubmitButton();
                updateTimeLimitsWithSchedule(dateStr, schedule);
                checkTimeOverlap();
            });

            // 9. 현재 세팅된 날짜에 대해 시간 제한 즉시 적용
            updateTimeLimitsWithSchedule(effectiveDateStr, schedule);
            checkTimeOverlap();
        })
        .catch(err => console.error("업무 상세 로드 실패:", err));
}

function resetDateTimePicker() {
    const dateInput = document.getElementById("reserveDate")._flatpickr;

    if (dateInput) {
        // 무조건 "today"가 아니라, 시스템 기준 유효 날짜(밤 11시면 내일)를 가져옴
        const initData = getInitialDateTime();

        // 1. MinDate를 시스템 기준 날짜로 재설정 (오늘 밤이면 내일로 막힘)
        dateInput.set("minDate", initData.dateStr);
        dateInput.set("maxDate", null); // 업무 기간 제한 해제

        // 2. 값도 시스템 기준 날짜로 초기화
        dateInput.setDate(initData.dateStr, true);

        // 3. 이벤트 핸들러 복구
        dateInput.set("onChange", function(selectedDates, dateStr) {
            resetSubmitButton();
            updateGeneralTimeLimits(dateStr);
            checkTimeOverlap();
        });
    }
}

/* ======================
   업무 미선택 시 기본 제한
====================== */
function updateGeneralTimeLimits(dateStr) {
    // dateStr이 없으면(초기화 등) 계산된 날짜 사용
    const initData = getInitialDateTime();
    const targetDate = dateStr || initData.dateStr;
    const todayStr = new Date().toISOString().slice(0, 10);

    const isToday = (targetDate === todayStr);

    let minStart = "09:00";

    if (isToday) {
        // 오늘이라면: 현재 시간(올림 처리됨)과 09:00 중 늦은 시간 사용
        // 예: 지금 10:12 -> 10:30, 지금 08:00 -> 09:00
        const roundedNow = initData.timeStr;
        minStart = (roundedNow > "09:00") ? roundedNow : "09:00";
    }

    // Start Picker 제한 설정
    if (startPicker) {
        startPicker.set("minTime", minStart);
        startPicker.set("maxTime", "17:30");

        // 현재 선택된 값이 범위보다 이전이면 강제 조정
        const currentStart = document.getElementById("startTime").value;
        if (currentStart && currentStart < minStart) {
            startPicker.setDate(minStart, true);
        }
    }

    // End Picker 제한 (기본값 설정)
    if (endPicker) {
        endPicker.set("minTime", "09:30");
        endPicker.set("maxTime", "18:00");
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

/* ======================
   종료 시간 변경 시 시작 시간을 자동으로 보정 (업무 제한 준수)
====================== */
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
    const initData = getInitialDateTime(); // { dateStr, timeStr, dateObj }

    // 1. 날짜 Picker
    flatpickr("#reserveDate", {
        dateFormat: "Y-m-d",
        minDate: initData.dateStr, // 17:30 넘으면 자동으로 '내일'이 minDate가 됨 (오늘 선택 불가)
        defaultDate: initData.dateStr,
        onChange: (selectedDates, dateStr) => {
            resetSubmitButton();
            const scheduleId = document.getElementById("scheduleSelect").value;
            // 업무 선택 안 했을 때만 일반 시간 제한 적용
            if (!scheduleId) {
                updateGeneralTimeLimits(dateStr);
            }
            checkTimeOverlap();
        }
    });

    // 2. 시작 시간 Picker
    startPicker = flatpickr("#startTime", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        minuteIncrement: 30,
        minTime: "09:00",
        maxTime: "17:30",
        defaultDate: initData.timeStr, // 계산된 시간(09:00 or 현재올림)
        onChange: (selectedDates, timeStr) => {
            resetSubmitButton();
            if (timeStr) {
                // 시작 시간 변경 시, 종료 시간 = 시작 + 30분 자동 세팅
                const nextEnd = addMinutesStr(timeStr, 30);
                endPicker.set("minTime", nextEnd);
                endPicker.setDate(nextEnd, true);
            }
            checkTimeOverlap();
        },
        onClose: function(selectedDates, timeStr, instance) {
            // 포커스 아웃 시 30분 단위 보정 (기존 로직 유지 원할 시)
            const date = instance.latestSelectedDateObj;
            if (date) instance.setDate(roundUpTo30Min(date), true);
            checkTimeOverlap();
        }
    });

    // 3. 종료 시간 Picker
    endPicker = flatpickr("#endTime", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        minuteIncrement: 30,
        minTime: "09:30",
        maxTime: "18:00",
        defaultDate: addMinutesStr(initData.timeStr, 30),
        onChange: (selectedDates, timeStr) => {
            resetSubmitButton();
            // 종료 시간 변경 시 시작 시간 역보정 로직 호출
            onEndTimeChange(selectedDates, timeStr);
            checkTimeOverlap();
        },
        onClose: function(selectedDates, timeStr, instance) {
            const date = instance.latestSelectedDateObj;
            if (date) instance.setDate(roundDownTo30Min(date), true);
            checkTimeOverlap();
        }
    });

    // 초기 실행 시 시간 제한 적용
    updateGeneralTimeLimits(initData.dateStr);
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
    const modal = document.getElementById("reservationModal");
    if (!modal) return;

    modal.classList.remove("hidden");
    resetReservationForm(); // 폼 초기화

    // 모달 열 때마다 현재 시간 기준 재계산 (17:30 넘었으면 내일 날짜로)
    const initData = getInitialDateTime();

    const dateInput = document.getElementById("reserveDate");
    const startInput = document.getElementById("startTime");
    const endInput = document.getElementById("endTime");

    // 날짜 다시 세팅
    if (dateInput && dateInput._flatpickr) {
        dateInput._flatpickr.set("minDate", initData.dateStr); // 오늘이 지났으면 minDate를 내일로 변경
        dateInput._flatpickr.setDate(initData.dateStr, false);
        updateGeneralTimeLimits(initData.dateStr);
    }

    // 시간 다시 세팅
    if (startInput && startInput._flatpickr) {
        startInput._flatpickr.setDate(initData.timeStr, true); // onChange 트리거 -> EndTime 자동 계산
    } else if (endInput && endInput._flatpickr) {
        // startInput이 없거나 에러일 경우를 대비해 수동 세팅
        endInput._flatpickr.setDate(addMinutesStr(initData.timeStr, 30), false);
    }

    loadRoomSelect(targetRoomId);
    loadScheduleSelect();

    // UI 렌더링 후 중복 체크 실행
    setTimeout(() => {
        checkTimeOverlap();
    }, 100);
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

/* ======================
   업무 목록 로드
====================== */
function loadScheduleSelect() {
    fetch("/api/calendar/schedules")
        .then(res => res.json())
        .then(schedules => {
            const select = document.getElementById("scheduleSelect");
            select.innerHTML = '<option value="">업무 선택 안 함</option>';

            // 1. 현재 예약 가능한 가장 빠른 시간 (기준점)
            const initData = getInitialDateTime();
            const minReservableStr = `${initData.dateStr}T${initData.timeStr}:00`;
            const minReservableDate = new Date(minReservableStr);

            schedules.forEach(sch => {
                const opt = document.createElement("option");
                opt.value = sch.id;

                const isDone = (sch.status === 'DONE');
                let isExpired = false;
                let isZeroDuration = false;

                // 시작 시간과 종료 시간이 같은지 체크 (0분 업무)
                if (sch.start && sch.end) {
                    const sTime = new Date(sch.start).getTime();
                    const eTime = new Date(sch.end).getTime();

                    if (sTime === eTime) {
                        isZeroDuration = true;
                    }
                }

                // 기간 만료 체크
                if (sch.end) {
                    const endAt = new Date(sch.end);
                    if (endAt < minReservableDate) {
                        isExpired = true;
                    }
                } else {
                    isExpired = true;
                }

                // 비활성화 조건 통합 (완료됨 OR 만료됨 OR 0분 업무)
                if (isDone || isExpired || isZeroDuration) {
                    opt.disabled = true;
                    opt.style.color = "#bbb";

                    let reason = "";
                    if (isDone) reason = "완료됨";
                    else if (isZeroDuration) reason = "시간 없음";
                    else reason = "기간 만료";

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