var selectedDate = getToday();
var selectedTime = getCurrentTimeSlot();
var roomDataCache = [];

document.addEventListener("DOMContentLoaded", () => {
    initFilters();
    loadMeetingRoomStatus();
});

function initFilters() {
    // 날짜
    flatpickr("#statusDatePicker", {
        dateFormat: "Y-m-d",
        defaultDate: selectedDate,
        onChange: function (selectedDates, dateStr) {
            selectedDate = dateStr;
            loadMeetingRoomStatus();
        }
    });

    // 시간 (09:00 ~ 17:30)
    flatpickr("#statusTimePicker", {
        enableTime: true,
        noCalendar: true,
        dateFormat: "H:i",
        time_24hr: true,
        minuteIncrement: 30,
        minTime: "09:00",
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
            // 내 예약이면 [취소 버튼]
            if (matched.reserverId === currentUserId) {
                const cancelBtn = document.createElement("button");
                cancelBtn.className = "btn-cancel";
                cancelBtn.textContent = "예약취소"; // 버튼 텍스트 빨간색 유지
                cancelBtn.onclick = (e) => {
                    e.stopPropagation();
                    cancelReservation(matched.reservationId);
                };
                action.appendChild(cancelBtn);
            }
            // 남의 예약이면 버튼 아예 안 보임
        } else {
            // 예약 가능하면 [예약하기 버튼]
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
    if (typeof openReservationModal === "function") {
        openReservationModal(roomId);
    }

    // 날짜/시간 자동 세팅
    const dateInput = document.getElementById("reserveDate");
    if (dateInput && dateInput._flatpickr) dateInput._flatpickr.setDate(selectedDate);

    const startInput = document.getElementById("startTime");
    if (startInput && startInput._flatpickr) startInput._flatpickr.setDate(selectedTime);

    const endInput = document.getElementById("endTime");
    if (endInput && endInput._flatpickr) endInput._flatpickr.setDate(addMinutesStr(selectedTime, 30));
}

function getToday() { return new Date().toISOString().slice(0, 10); }

function getCurrentTimeSlot() {
    const now = new Date();
    let h = now.getHours();
    let m = now.getMinutes();
    if (h < 9) { h = 9; m = 0; }
    else if (h >= 18) { h = 17; m = 30; }
    else { m = m < 30 ? 0 : 30; }
    return `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}`;
}

function addMinutesStr(timeStr, addMins) {
    const [h, m] = timeStr.split(":").map(Number);
    const total = h * 60 + m + addMins;
    const nh = String(Math.floor(total / 60)).padStart(2, "0");
    const nm = String(total % 60).padStart(2, "0");
    return `${nh}:${nm}`;
}