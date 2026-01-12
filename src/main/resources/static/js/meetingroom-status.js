const initialData = getInitialDateTime();

var selectedDate = initialData.date;
var selectedTime = initialData.time;
var roomDataCache = [];

document.addEventListener("DOMContentLoaded", () => {
    initFilters();
    loadMeetingRoomStatus();
});

function initFilters() {
    // 현재 시간을 30분 단위로 올림 처리하여 "HH:MM" 반환하는 내부 함수
    const getRoundedMinTime = () => {
        const now = new Date();
        let h = now.getHours();
        let m = now.getMinutes();

        // 현재 분이 0이면 0, 1~30이면 30, 31~59면 다음시간 00분
        if (m > 30) {
            h += 1;
            m = 0;
        } else if (m > 0) {
            m = 30;
        }

        // 시간 포맷팅만 수행 (날짜/시간 제한 로직은 외부에서 처리)
        return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    };

    // 1. 날짜 설정 (flatpickr)
    flatpickr("#statusDatePicker", {
        dateFormat: "Y-m-d",
        defaultDate: selectedDate,

        // 17:30 이후라면 initialData.date가 '내일'이므로 오늘 선택이 자동으로 막힘
        minDate: initialData.date,

        onChange: function (selectedDates, dateStr) {
            selectedDate = dateStr;

            // 날짜 변경 시 시간 Picker의 minTime 재계산
            const timeInput = document.getElementById("statusTimePicker");
            if (timeInput && timeInput._flatpickr) {
                const todayStr = new Date().toISOString().slice(0, 10);
                const isToday = (dateStr === todayStr);

                // 오늘이면 "현재 시간(올림 처리됨)"과 "09:00" 중 늦은 시간 적용
                // 내일(또는 그 이후)이면 무조건 "09:00" 부터
                let minTimeLimit = "09:00";
                if (isToday) {
                    const roundedNow = getRoundedMinTime();
                    minTimeLimit = (roundedNow > "09:00") ? roundedNow : "09:00";
                }

                timeInput._flatpickr.set("minTime", minTimeLimit);

                // 만약 현재 선택된 시간이 minTime보다 빠르면 minTime으로 강제 조정
                // (예: 내일 9시로 보다가 오늘 14시로 바꿨는데, 현재 시간이 15시면 15시로 밀어줌)
                if (timeInput._flatpickr.selectedDates[0]) {
                    const currentVal = timeInput.value;
                    if (currentVal < minTimeLimit) {
                        timeInput._flatpickr.setDate(minTimeLimit, false);
                        selectedTime = minTimeLimit;
                    }
                }
            }
            loadMeetingRoomStatus();
        }
    });

    // 초기 실행 시 오늘 날짜인지 확인하여 minTime 계산
    const todayStrInit = new Date().toISOString().slice(0, 10);
    const isTodayInit = (selectedDate === todayStrInit);
    const roundedNowInit = getRoundedMinTime();

    // 만약 오늘 날짜이고 현재 시간이 09:00를 넘었다면 현재 시간부터, 아니면 09:00부터
    const initialMinTime = (isTodayInit && roundedNowInit > "09:00") ? roundedNowInit : "09:00";

    // 2. 시간 설정 (flatpickr)
    flatpickr("#statusTimePicker", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        minuteIncrement: 30,
        minTime: initialMinTime,
        maxTime: "17:30",
        defaultDate: selectedTime,
        onChange: function (selectedDates, timeStr) {
            selectedTime = timeStr;
            renderRoomCards(roomDataCache);
        }
    });

    // 박스 클릭 시 달력/시계 열기
    document.querySelectorAll(".picker-wrapper").forEach(wrapper => {
        wrapper.addEventListener("click", () => {
            const input = wrapper.querySelector("input");
            if (input && input._flatpickr) input._flatpickr.open();
        });
    });
}

function loadMeetingRoomStatus() {
    fetch(`/api/meeting-rooms/status?date=${selectedDate}`)
        .then(res => res.json())
        .then(rooms => {
            roomDataCache = rooms;
            renderRoomCards(rooms);
        })
        .catch(err => console.error("조회 실패", err));
}

function renderRoomCards(rooms) {
    const container = document.getElementById("meeting-room-list");
    container.innerHTML = "";

    const userIdInput = document.getElementById("currentUserId");
    const currentUserId = userIdInput ? Number(userIdInput.value) : null;

    const targetStartStr = selectedTime;
    const targetEndStr = addMinutesStr(selectedTime, 30);
    const baseDate = selectedDate;

    rooms.forEach(room => {
        const reservations = room.reservations || [];
        const matched = reservations.find(r => {
            const rStart = new Date(r.startAt);
            const rEnd = new Date(r.endAt);
            const checkStart = new Date(`${baseDate}T${targetStartStr}:00`);
            const checkEnd = new Date(`${baseDate}T${targetEndStr}:00`);
            return rStart < checkEnd && rEnd > checkStart;
        });

        const isReserved = !!matched;

        // 클래스 설정 (내 예약이면 배경색 변경 등을 위해 클래스 유지)
        let cardClass = "room-card";
        if (isReserved) {
            if (matched.reserverId === currentUserId) {
                cardClass += " my-booking";
            } else {
                cardClass += " disabled";
            }
        }

        const card = document.createElement("div");
        card.className = cardClass;

        /* 이미지 영역 */
        const imgBox = document.createElement("div");
        imgBox.className = "room-img-box";
        const imgSrc = room.imagePath ? room.imagePath : '/images/default_room.svg';
        imgBox.innerHTML = `<img src="${imgSrc}" alt="${room.roomName}">`;

        /* 정보 영역 */
        const info = document.createElement("div");
        info.className = "room-info";

        let statusText = `${targetStartStr} ~ ${targetEndStr}`;

        info.innerHTML = `
            <div class="room-name">${room.roomName}</div>
            <div class="room-time">${statusText}</div>
        `;

        /* 버튼 영역 */
        const action = document.createElement("div");
        action.className = "room-action";

        if (isReserved) {
            // 내 예약이면 [취소 버튼] 버튼
            if (matched.reserverId === currentUserId) {
                const cancelBtn = document.createElement("button");
                cancelBtn.className = "btn-cancel";
                cancelBtn.textContent = "예약취소";
                cancelBtn.onclick = (e) => {
                    e.stopPropagation();
                    cancelReservation(matched.reservationId);
                };
                action.appendChild(cancelBtn);
            }
            // 남의 예약이면 버튼 아예 안 보임
        } else {
            // 예약 가능하면 [예약하기] 버튼
            const btn = document.createElement("button");
            btn.className = "btn-reserve";
            btn.textContent = "예약하기";
            btn.onclick = (e) => {
                e.stopPropagation();
                openModalWithInfo(room.roomId, room.roomName);
            };
            action.appendChild(btn);
        }

        card.appendChild(imgBox);
        card.appendChild(info);
        card.appendChild(action);
        container.appendChild(card);
    });
}

// 예약 취소 요청
function cancelReservation(reservationId) {
    if (!confirm("예약을 취소하시겠습니까?")) return;

    fetch(`/api/meeting-rooms/reservations/${reservationId}`, {
        method: "DELETE"
    })
        .then(res => {
            if (res.ok) {
                alert("취소되었습니다.");
                loadMeetingRoomStatus();
            } else {
                alert("취소 실패");
            }
        })
        .catch(err => console.error(err));
}

function openModalWithInfo(roomId, roomName) {
    // 1. 모달을 먼저 엽니다 (이때 모달 내부 로직으로 기본 날짜/시간이 세팅됨)
    if (typeof openReservationModal === "function") {
        openReservationModal(roomId);
    }

    // 2. 현황판에서 선택한 날짜/시간으로 덮어씁니다.
    // 두 번째 인자로 true를 줘야 모달 내부의 '시간 제한 로직'이 이 날짜에 맞춰 갱신됩니다.
    const dateInput = document.getElementById("reserveDate");
    if (dateInput && dateInput._flatpickr) {
        dateInput._flatpickr.setDate(selectedDate, true); // true: onChange 이벤트 발생시킴
    }

    const startInput = document.getElementById("startTime");
    if (startInput && startInput._flatpickr) {
        // 시작 시간을 넣으면 종료 시간(+30분)은 모달 로직에 의해 자동으로 계산되어 들어갑니다.
        startInput._flatpickr.setDate(selectedTime, true);
    }

}
// 초기 날짜와 시간을 계산하는 함수
function getInitialDateTime() {
    const now = new Date();
    let h = now.getHours();
    let m = now.getMinutes();

    // 1. 분 단위 올림 처리 (30분 단위)
    if (m > 30) {
        h += 1;
        m = 0;
    } else if (m > 0) {
        m = 30;
    }

    // 2. 업무 종료 시간(17:30) 체크 로직
    // 17:30 이후이거나 18시 이상이면 -> "내일 09:00"로 설정
    if (h > 17 || (h === 17 && m > 30)) {
        now.setDate(now.getDate() + 1); // 날짜 하루 추가
        h = 9;
        m = 0;
    }
    // 업무 시작 전(09:00 이전)이면 -> "오늘 09:00"로 설정
    else if (h < 9) {
        h = 9;
        m = 0;
    }

    // 날짜 포맷팅 (YYYY-MM-DD)
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, "0");
    const dd = String(now.getDate()).padStart(2, "0");
    const dateStr = `${yyyy}-${mm}-${dd}`;

    // 시간 포맷팅 (HH:MM)
    const timeStr = `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;

    return { date: dateStr, time: timeStr };
}

// 시간 더하기 함수
function addMinutesStr(timeStr, addMins) {
    const [h, m] = timeStr.split(":").map(Number);
    const total = h * 60 + m + addMins;
    const nh = String(Math.floor(total / 60)).padStart(2, "0");
    const nm = String(total % 60).padStart(2, "0");
    return `${nh}:${nm}`;
}

// 모달 닫기 로직
document.addEventListener("DOMContentLoaded", () => {
    const reservationModal = document.getElementById("reservationModal");

    // 1. 모달 닫기 함수 정의
    function closeReservationModal() {
        if (reservationModal) {
            // 현재 class="modal hidden" 구조를 사용 중이므로 hidden 클래스 추가
            reservationModal.classList.add("hidden");

            // 만약 CSS로 display를 조절한다면 아래 코드도 병행
            // reservationModal.style.display = "none";
        }
    }

    // 2. 모달 바깥 배경 클릭 시 닫기
    window.addEventListener("click", (e) => {
        // 클릭한 대상(e.target)이 모달 컨텐츠가 아닌 '바깥 배경(reservationModal)'일 때만 닫기
        if (e.target === reservationModal) {
            closeReservationModal();
        }
    });

    // 3. ESC 키 클릭 시 닫기
    window.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
            // 모달이 현재 보이는 상태인지 확인 후 닫기
            if (!reservationModal.classList.contains("hidden")) {
                closeReservationModal();
            }
        }
    });

    // (참고) 기존 취소 버튼도 이 함수를 사용하도록 연결
    const closeBtn = document.getElementById("closeModalBtn");
    if (closeBtn) {
        closeBtn.addEventListener("click", closeReservationModal);
    }
});