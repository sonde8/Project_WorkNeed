'use strict';

// 1. HTML 요소 참조
var messageForm = document.querySelector('#messageForm');
var messageInput = document.querySelector('#message');
var messageArea = document.querySelector('#messageLog'); // chatroom.html의 ul id와 맞춤
var connectingElement = document.querySelector('.connecting');

var stompClient = null;
var isSending = false;

// 채팅방 내에 날짜 출력을 위해 전역 변수로 선언하여 마지막 출력된 날짜 기억
let lastDisplayDate = null;

var currentUserId = window.currentUserId;

if (!currentUserId) {
    console.error("로그인이 필요합니다.");
    // 로그인 페이지로 튕구는 로직 등을 추가할 수 있습니다.
}

// 2. 현재 채팅방 ID 추출 (URL 경로 /chat/room/{roomId} 에서 가져오기)
const pathArray = window.location.pathname.split('/');
const roomId = window.roomId || pathArray[pathArray.length - 1];

/**
 * 스크롤 하단 이동 함수
 */
function scrollToBottom() {
    if (messageArea) {
        messageArea.scrollTop = messageArea.scrollHeight;
    }
}

function connect() {
    console.log("웹 소켓 연결 성공:", currentUserId);
    // SockJS 연결 (SpringConfig 설정 엔드포인트)
    var socket = new SockJS('/ws-stomp');
    stompClient = Stomp.over(socket);

    stompClient.connect({}, onConnected, onError);
}

function onConnected() {
    // 0. 실시간 알림 구독 (내 아이디 전용 채널)
    // 방에 들어가 있든 아니든, 나에게 오는 모든 메시지/초대 신호를 수신합니다.
    stompClient.subscribe('/sub/user/' + currentUserId + '/rooms', function (payload) {
        const messageData = JSON.parse(payload.body);
        console.log("개인 채널 알림 수신 성공:", messageData)
        console.log("실시간 목록 업데이트 신호 수신:", messageData);

        // 이 함수 하나로 "새 방 초대"와 "기존 방 메시지 갱신"을 모두 처리합니다.
        refreshRoomList(messageData);
    });

    // 1. 현재 대화방 메시지 구독 (특정 방 안에서만 메시지를 실시간으로 볼 때)
    if (roomId && !isNaN(roomId)) {
        stompClient.subscribe('/sub/chat/room/' + roomId, onMessageReceived);

        // 2. [실시간 읽음] 현재 방의 읽음 이벤트 구독
        stompClient.subscribe('/sub/chat/room/' + roomId + '/read', function (payload) {
            const readInfo = JSON.parse(payload.body);
            console.log("읽은 사람 ID:", readInfo.senderId);
            if (String(readInfo.senderId) !== String(currentUserId)) {
                decrementUnreadCounts();
            }
        });

        // 입장 시 내가 이 메시지들을 읽었다는 신호를 서버에 보냄
        sendReadEvent(roomId, currentUserId);
    }

    setTimeout(scrollToBottom, 100);
    if (connectingElement) {
        connectingElement.classList.add('hidden');
    }
}

/*
* 채팅방 내 날짜를 표시하기 위한 함수
*/
function createDateDivider(dateString) {
    const dateElement = document.createElement('li');
    dateElement.className = 'system-msg date-divider'   // 기존 system-msg 클래스 활용

    const container = document.createElement('div');
    container.className = 'system-inner';

    // 날짜 형식 변환
    container.textContent = formatKoreanDate(dateString);

    dateElement.appendChild(container);
    return dateElement
}

// 날짜 포맷 도우미 함수
/**
 * 서버에서 받은 날짜 문자열을 KST 기준 시간(오전/오후)으로 변환하는 함수
 */
function getKstDisplayTime(dateString) {
    if (!dateString) return "";

    // [핵심] T를 공백으로 바꾸고 밀리초 부분을 제거하여
    // 브라우저가 타임존(UTC)으로 오해해 9시간을 더하는 것을 방지합니다.
    const cleanDate = dateString.replace('T', ' ').split('.')[0];
    const d = new Date(cleanDate);

    const hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? '오후' : '오전';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;

    return `${ampm} ${formattedHours}:${formattedMinutes}`;
}

// 실시간 안 읽은 숫자 업데이트
function updateUnreadBadge(roomId, isInCurrentRoom) {
    // 현재 방에 들어간 상태면 숫자가 올라가면 안 됨
    if (isInCurrentRoom) return;

    const badge = document.getElementById('unread-badge-' + roomId);
    if (badge) {
        let currentCount = parseInt(badge.textContent) || 0;
        badge.textContent = currentCount + 1;
        badge.classList.remove('hidden');
    }
}

/**
 * 실시간 채팅방 목록 관리 함수
 * 새로운 방 초대 시 목록 추가 + 기존 방 메시지 수신 시 미리보기 갱신 및 상단 이동
 * 실시간 시간대 반영
 */
function getRelativeTime() {
    const now = new Date();
    const hours = now.getHours();
    const minutes = now.getMinutes();
    const ampm = hours >= 12 ? '오후' : '오전';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;
    return `${ampm} ${formattedHours}:${formattedMinutes}`;
}

function refreshRoomList(data) {
    const roomListContainer = document.getElementById('room-list');
    if (!roomListContainer) return;

    const targetRoomId = data.roomId;
    const roomElement = document.getElementById('room-' + targetRoomId);

    const type = data.messageType ? data.messageType.trim().toUpperCase() : 'TALK';
    let previewText = data.content || "새로운 대화가 있습니다.";
    if (type === 'IMAGE') previewText = "사진을 보냈습니다.";
    else if (type === 'FILE') previewText = "파일을 보냈습니다.";
    const currentTime = getRelativeTime();

    if (roomElement) {
        // 1. 기존 방 업데이트
        const previewElement = roomElement.querySelector('.preview');
        const timeElement = roomElement.querySelector('.last-time');
        const badgeElement = document.getElementById('unread-badge-' + targetRoomId);

        if (previewElement) previewElement.textContent = previewText;
        if (timeElement) timeElement.textContent = currentTime;

        // [배지 업데이트 핵심]
        if (badgeElement) {
            // 내가 지금 이 방에 들어가 있는 상태가 아닐 때만 숫자 상승
            if (String(targetRoomId) !== String(window.roomId)) {
                let currentCount = parseInt(badgeElement.textContent) || 0;
                badgeElement.textContent = currentCount + 1;
                badgeElement.classList.remove('hidden');
            } else {
                // 현재 방이면 읽음 처리 (DB 업데이트 호출)
                fetch(`/chat/room/${targetRoomId}/read`, { method: 'POST' });
                badgeElement.textContent = '0';
                badgeElement.classList.add('hidden');
            }
        }
        roomListContainer.prepend(roomElement);
    } else {
        // 2. 목록에 없는 새 방일 때: 새로 생성 (배지 포함)
        const currentTime = getRelativeTime(); // 현재 시간 변수 활용
        const userCountHtml = (data.roomType === 'GROUP' && data.userCount > 0)
            ? `<span class="user-count">${data.userCount}</span>` : '';

        const roomHtml = `
        <div id="room-${data.roomId}" class="room-card" data-room-id="${data.roomId}">
            <a href="/chat/room/${data.roomId}">
                <div class="profile-img"><img src="/images/profile300.svg"></div>
                <div class="room-text">
                    <div class="name-row">
                        <span class="name">${data.roomName || '새 채팅방'}</span>
                        ${userCountHtml}
                        <span class="last-time">${currentTime}</span> </div>
                    <div class="preview-row" style="display: flex; justify-content: space-between; align-items: center;">
                        <span class="preview">${previewText}</span>
                        <span id="unread-badge-${data.roomId}" class="unread-badge">1</span>
                    </div>
                </div>
            </a>
        </div>
    `;
        roomListContainer.insertAdjacentHTML('afterbegin', roomHtml);
    }
}


/**
 * 실시간 숫자 차감 로직
 */
function decrementUnreadCounts() {
    const unreadElements = document.querySelectorAll('.unread-count');
    unreadElements.forEach(el => {
        let currentCount = parseInt(el.textContent);
        if (!isNaN(currentCount) && currentCount > 0) {
            let newCount = currentCount - 1;
            if (newCount > 0) {
                el.textContent = newCount; // 숫자가 남았으면 갱신
            } else {
                el.remove(); // 0이 되면 화면에서 삭제
            }
        }
    });
}

/**
 * 메세지 전송 로직
 */
function sendMessage(event) {
    if (event) {
        event.preventDefault(); // 함수 시작 시 즉시 기본 동작 방지
        event.stopPropagation(); // 이벤트 전파 방지
    }

    if (isSending) return;  // 중복 전송 방지 (잠금 상태 확인)

    var messageContent = messageInput.value.trim();

    if (messageContent && stompClient) {
        isSending = true;   // 잠금 설정
        // 백엔드 MessageDTO의 필드명인 roomId와 일치시켜야 함
        var chatMessage = {
            roomId: roomId,
            senderId: currentUserId,
            content: messageContent,
            messageType: 'TALK'
        };

        stompClient.send("/pub/chat/sendMessage", {}, JSON.stringify(chatMessage));
        messageInput.value = '';    // 입력창 비우기
        messageInput.focus()        // 포커스 유지

        // 전송 완료 후 잠금 해제 (연타 방지를 위해 200ms로 약간 상향 조정)
        setTimeout(function() {
            isSending = false;
        }, 200)
        console.log("메시지 전송:", chatMessage);
    }
}

/**
 * 메시지를 수신했을 때 실행되는 함수
 */
function onMessageReceived(payload) {
    var message = JSON.parse(payload.body);
    const isCurrentRoom = (String(message.roomId) === String(window.roomId));
    var msgType = message.messageType ? message.messageType.trim().toUpperCase() : 'TEXT';

    if (String(message.roomId) === String(roomId)) {
        var rawDate = message.createdAt || "";
        var messageDate = rawDate.substring(0, 10);
        if (messageDate && window.lastDisplayDate !== messageDate) {
            const dateDivider = createDateDivider(rawDate);
            messageArea.appendChild(dateDivider);
            window.lastDisplayDate = messageDate;
        }

        var isMe = (String(message.senderId) === String(currentUserId));
        if (!isMe) {
            // 서버에 읽음 신호 전송
            sendReadEvent(message.roomId, currentUserId);
            fetch(`/chat/room/${message.roomId}/read`, { method: 'POST' })
                .then(() => console.log("DB 읽음 처리 성공"))
                .catch(err => console.error("읽음 처리 API 오류:", err));

            // 읽었울 때 사이드바 목록의 배지를 0으로 만들고 숨김
            const badgeElement = document.getElementById('unread-badge-' + message.roomId);
            if (badgeElement) {
                badgeElement.textContent = '0';
                badgeElement.classList.add('hidden');
            }
            message.unreadCount = 0;
        }

        var messageElement = document.createElement('li');
        messageElement.setAttribute('data-msg-id', message.messageId); // ID 저장
        if ((msgType === 'ENTER' || msgType === "LEAVE") && String(message.senderId) === String(currentUserId) && !message.content.includes("초대")) {
            return;
        }

        if (msgType === 'ENTER' || msgType === 'LEAVE') {
            messageElement.className = 'system-msg';
            var container = document.createElement('div');
            container.className = 'system-inner';
            container.textContent = message.content;
            messageElement.appendChild(container);
        } else {
            messageElement.className = isMe ? 'my-msg' : 'other-msg';
            var msgUnit = document.createElement('div');
            msgUnit.className = 'msg-unit';
            if(!isMe) {
                var userNameElement = document.createElement('span');
                userNameElement.className = 'sender';
                userNameElement.textContent = message.senderName;
                msgUnit.appendChild(userNameElement);
            }
            var bubbleRow = document.createElement('div');
            bubbleRow.className = 'bubble-row';
            var bubble = document.createElement('div');
            bubble.className = 'bubble';

            if (msgType === 'IMAGE') {
                var img = document.createElement('img');
                img.src = message.content;
                img.style.maxWidth = '250px';
                img.style.borderRadius = '8px';
                img.style.display = 'block';
                img.onclick = function () {openImageModal(this.src)};
                bubble.appendChild(img);
            } else if (msgType === 'FILE') {
                var fileLink = document.createElement('a');
                fileLink.href = message.content;
                fileLink.download = "";
                fileLink.className = 'file-link';
                var fileName = message.content.split('/').pop();
                if(fileName.includes('_')) fileName = fileName.substring(fileName.indexOf('_') + 1);
                fileLink.textContent = "📎 " + fileName;
                bubble.appendChild(fileLink);
            } else {
                var textPara = document.createElement('p');
                textPara.textContent = message.content;
                bubble.appendChild(textPara);
            }

            var msgInfo = document.createElement('div');
            msgInfo.className = 'msg-info';
            if (message.unreadCount > 0) {
                var unreadElement = document.createElement('span');
                unreadElement.className = 'unread-count';
                unreadElement.textContent = message.unreadCount;
                msgInfo.appendChild(unreadElement);
            }
            var timeElement = document.createElement('span');
            timeElement.className = 'msg-time';
            timeElement.textContent = getKstDisplayTime(message.createdAt);
            msgInfo.appendChild(timeElement);

            bubbleRow.appendChild(bubble);
            bubbleRow.appendChild(msgInfo);
            msgUnit.appendChild(bubbleRow);
            messageElement.appendChild(msgUnit);

            const sidebar = document.getElementById('mediaSidebar');
            if (sidebar && sidebar.classList.contains('active')) {
                if (msgType === 'IMAGE' || msgType === 'FILE') updateSidebarMedia();
            }
        }
        messageArea.appendChild(messageElement);
        scrollToBottom();
    }
}


// 서버에 읽음 이벤트를 보내는 함수
function sendReadEvent(roomId, userId) {
    if (stompClient && stompClient.connected) {
        stompClient.send("/pub/chat/read", {}, JSON.stringify({
            roomId: roomId,
            senderId: userId
        }))
    }
}

// 엔터키 전송 로직
if (messageInput) {
    messageInput.addEventListener('keydown', function(event) {
        if (event.isComposing) return;
        if (event.key === 'Enter') {
            if (!event.shiftKey) {
                event.preventDefault(); // 줄바꿈 방지 및 Form Submit 방지 (중요)
                sendMessage(event);     // 전송 함수 호출
            }
        }
    });
}

function onError(error) {
    console.error('STOMP Error: ' + error);
    if (connectingElement) {
        connectingElement.textContent = '연결이 원활하지 않습니다.';
        connectingElement.style.color = 'red';
    }
}

// form submit 이벤트가 있다면 그것도 preventDefault가 확실해야 합니다.
if (messageForm) {
    messageForm.addEventListener('submit', function(event) {
        event.preventDefault();
        sendMessage(event);
    }, true);
}

// 전송 아이콘 클릭 이벤트
var sendButton = document.querySelector('.send-btn');
if (sendButton) {
    sendButton.addEventListener('click', function(event) {
        event.preventDefault();
        sendMessage(event);
    });
}

// 페이지 로드 시 실행
window.onload = function() {
    if (typeof currentUserId !== 'undefined' && currentUserId !== null) {
        connect();
    } else {
        console.error("currentUserId가 정의되지 않았습니다.");
    }

    if (window.roomId) {
        const currentBadge = document.getElementById('unread-badge-' + window.roomId);
        if (currentBadge) {
            currentBadge.textContent = '0';
            currentBadge.classList.add('hidden');
        }
    }
};

// 파일 전송 로직
function handleFileUpload(input, type) {
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("roomId", roomId);

    fetch('/api/chat/files/upload', {
        method: 'POST',
        body: formData
    })
        .then(response => {
            if (!response.ok) throw new Error("업로드 실패");
            return response.json();
        })
        .then(fileLogDTO => {
            console.log("서버에서 받은 파일 정보:", fileLogDTO)
            sendFileMessage(fileLogDTO, type);
            input.value = ""; // 입력창 초기화
        })
        .catch(error => {
            console.error("Error:", error);
            alert("파일 업로드 중 오류가 발생했습니다.");
        });
}

function sendFileMessage(fileLog, type) {
    const messageDTO = {
        roomId: roomId,
        senderId: currentUserId,
        content: fileLog.filePath, // 이미지나 파일의 접근 경로
        messageType: type,         // 'IMAGE' 또는 'FILE'
        fileLogId: fileLog.fileLogId // 백엔드에서 매핑할 ID
    };

    console.log("최종 전송할 메세지 객체:", messageDTO);
    stompClient.send("/pub/chat/sendMessage", {}, JSON.stringify(messageDTO));
}

// 이미지, 파일 보관함 사이드바 토글 함수
function toggleChatSidebar() {
    const sidebar = document.getElementById('mediaSidebar');
    sidebar.classList.toggle('active');

    if (sidebar.classList.contains('active')) {
        updateSidebarMedia();
    }
}

// 채팅방 나가기 함수
function leaveRoom() {
    if (confirm("채팅방을 나가시겠습니까? 나간 후에는 대화 내용을 볼 수 없습니다.")) {
        fetch(`/chat/room/${roomId}/leave`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        })
            .then(response => {
                if (response.ok) {
                    // 목록에서 즉시 제거
                    const roomElement = document.getElementById('room-' + roomId);
                    if (roomElement) roomElement.remove();

                    alert("채팅방에서 나갔습니다.");
                    location.href = "/chat/rooms"; // 방 목록 페이지로 이동
                }
            })
            .catch(error => console.error("Error:", error));
    }
}

// 미디어 모아보기 데이터 갱신
function updateSidebarMedia() {
    const imageContainer = document.getElementById('sidebarImageList');
    const fileContainer = document.getElementById('sidebarFileList');

    imageContainer.innerHTML = '';
    fileContainer.innerHTML = '';

    // 1. 이미지 수집
    const allImages = document.querySelectorAll('#messageLog img');
    allImages.forEach(img => {
        const copyImg = document.createElement('img');
        copyImg.src = img.src;
        copyImg.onclick = () => openImageModal(img.src);
        imageContainer.appendChild(copyImg)
    });

    // 2. 파일 수집
    const allFiles = document.querySelectorAll('#messageLog .file-link');
    allFiles.forEach(file => {
        const fileItem = document.createElement('a');
        fileItem.href = file.href;
        fileItem.className = 'sidebar-file-item';
        fileItem.download = "";
        fileItem.innerHTML = `📎 <span>${file.textContent.replace('📎 ', '')}</span>`;
        fileContainer.appendChild(fileItem)
    });

    if (allImages.length === 0) imageContainer.innerHTML = '<p style="color:#aaa; font-size:1.1rem;">사진이 없습니다.</p>';
    if (allFiles.length === 0) fileContainer.innerHTML = '<p style="color:#aaa; font-size:1.1rem;">파일이 없습니다.</p>';
}

// 전역 단축키 제어 (ESC 키)
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' || event.code === 'Escape') {
        const createRoomModal = document.getElementById('createRoomModal');
        if (createRoomModal && window.getComputedStyle(createRoomModal).display !== 'none') {
            closeCreateRoomModal();
            return;
        }

        const mediaSidebar = document.getElementById('mediaSidebar');
        if (mediaSidebar && mediaSidebar.classList.contains('active')) {
            toggleChatSidebar();
            return;
        }
    }
});

// 검색창 입력 이벤트 (디바운싱 적용 - 너무 자주 요청보내지 않도록 설정)
let searchTimeout = null;
const searchInput = document.querySelector('.search-container input');

if (searchInput) {
    searchInput.addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        const keyword = e.target.value.trim();

        searchTimeout = setTimeout(() => {
            fetch(`/chat/api/search?keyword=${encodeURIComponent(keyword)}`)
                .then(res => {
                    // 서버 응답이 정상이 아닐 경우 에러 처리
                    if (!res.ok) throw new Error("서버 에러 발생");
                    return res.json();
                })
                .then(rooms => {
                    renderRoomList(rooms);
                })
                .catch(error => {
                    console.error("검색 중 오류:", error);
                    renderRoomList([]); // 에러 시 빈 목록으로 초기화하여 forEach 에러 방지
                });
        }, 300);
    });
}

// 검색어를 지웠을 때 전체 목록을 다시 가져오는 함수
function loadMyAllRooms() {
    // 새로고침 없이 목록만 갱신
    fetch('/chat/api/search?keyword=')
        .then(res => res.json())
        .then(rooms => {
            renderRoomList(rooms);
        });
}

// 검색된 목록을 화면에 그리는 함수
function renderRoomList(rooms) {
    const container = document.getElementById('room-list');
    if (!container) return;
    container.innerHTML = '';

    // [중요] rooms가 배열인지 확실히 체크하여 TypeError 방지
    if (!Array.isArray(rooms) || rooms.length === 0) {
        container.innerHTML = '<p class="no-result" style="padding: 20px; text-align: center; color: #999;">검색 결과가 없습니다.</p>';
        return;
    }

    rooms.forEach(r => {
        const activeClass = (String(window.roomId) === String(r.roomId)) ? 'active' : '';
        const displayName = r.roomName ? r.roomName : "대화 상대 없음";
        const preview = r.lastMessageContent ? r.lastMessageContent : '새로운 대화가 없습니다.';

        // 배지 표시 여부 결정
        const badgeClass = (r.unreadCount > 0) ? 'unread-badge' : 'unread-badge hidden';

        const html = `
            <div id="room-${r.roomId}" class="room-card ${activeClass}" data-room-id="${r.roomId}">
                <a href="/chat/room/${r.roomId}">
                    <div class="profile-img">
                        <img src="/images/profile300.svg" alt="사용자">
                    </div>
                    <div class="room-text">
                        <div class="name-row">
                            <span class="name">${displayName}</span>
                            <span class="last-time">${r.lastMessageDisplayTime || ''}</span>
                        </div>
                        <div class="preview-row" style="display: flex; justify-content: space-between; align-items: center;">
                            <span class="preview">${preview}</span>
                            <span id="unread-badge-${r.roomId}" class="${badgeClass}">${r.unreadCount || 0}</span>
                        </div>
                    </div>
                </a>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', html);
    });
}

// 이미지 모달 로직
let currentImageList = []; // 채팅창 내 모든 이미지 경로 저장
let currentImageIndex = 0;

/**
 * 이미지 모달 열기
 * @param {string} clickedSrc - 클릭한 이미지의 주소
 */
function openImageModal(clickedSrc) {
    // 1. 이미지뿐만 아니라 보낸 사람, 시간 정보를 포함하는 unit을 모두 찾음
    const allMsgUnits = document.querySelectorAll('.msg-unit:has(.bubble img)');

    currentImageList = Array.from(allMsgUnits).map(unit => {
        const img = unit.querySelector('.bubble img');
        // 상대방 이름 또는 내 이름(currentUserId 비교로 처리 가능하나 간단히 스크립트에서 추출)
        const sender = unit.querySelector('.sender')?.textContent || "나";
        // 날짜 구분선이 아닌 메시지 옆의 시간 또는 data 속성에 심어둔 전체 날짜
        const date = unit.querySelector('.msg-time')?.textContent || "";

        return { src: img.src, sender: sender, date: date };
    });

    // 2. 인덱스 찾기
    currentImageIndex = currentImageList.findIndex(item => item.src === clickedSrc);

    document.getElementById('imageModal').style.display = 'flex';
    updateFullImage();
}

/**
 * 이미지 업데이트
 */
function updateFullImage() {
    const item = currentImageList[currentImageIndex];

    const fullImg = document.getElementById('fullImage');
    const sender = document.getElementById('modalSenderName');
    const date = document.getElementById('modalSendDate');
    const downloadBtn = document.getElementById('imageDownloadBtn');
    const caption = document.getElementById('imageCaption');

    // 이미지 및 텍스트 반영
    fullImg.src = item.src;
    sender.textContent = item.sender;
    date.textContent = item.date;

    // 다운로드 링크 설정
    downloadBtn.href = item.src;
    const fileName = item.src.split('/').pop();
    // UUID_파일명 형태라면 원본명만 추출
    const originalName = fileName.includes('_') ? fileName.substring(fileName.indexOf('_') + 1) : fileName;
    downloadBtn.setAttribute('download', originalName);

    // 하단 인덱스 표시
    caption.textContent = `${currentImageIndex + 1} / ${currentImageList.length}`;
}

/**
 * 이전/다음 이미지 전환
 */
function changeImage(direction) {
    currentImageIndex += direction;

    // 처음이나 끝에서 순환하게 처리
    if (currentImageIndex < 0) currentImageIndex = currentImageList.length - 1;
    if (currentImageIndex >= currentImageList.length) currentImageIndex = 0;

    updateFullImage();
}

function closeImageModal() {
    document.getElementById('imageModal').style.display = 'none';
}

// 키보드 화살표로 넘기기 추가
document.addEventListener('keydown', function(e) {
    const modal = document.getElementById('imageModal');
    if (modal.style.display === 'flex') {
        if (e.key === 'ArrowLeft') changeImage(-1);
        if (e.key === 'ArrowRight') changeImage(1);
        if (e.key === 'Escape') closeImageModal();
    }
});