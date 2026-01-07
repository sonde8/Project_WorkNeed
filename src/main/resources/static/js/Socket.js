'use strict';

/**
 * 1. layout.html의 전역 변수(window.currentUserId, window.roomId)를 참조합니다.
 * 2. 모든 페이지에서 실행되므로 채팅방 전용 요소(messageForm 등)는 존재할 때만 작동하도록 null 체크를 강화했습니다.
 * 3. '채팅방 밖'일 때를 위한 커스텀 토스트 알림 기능이 추가되었습니다.
 */

// 1. HTML 요소 참조
var messageForm = document.querySelector('#messageForm');
var messageInput = document.querySelector('#message');
var messageArea = document.querySelector('#messageLog'); // chatroom.html의 ul id와 맞춤
var connectingElement = document.querySelector('.connecting');

var stompClient = null;
var isSending = false;

// 채팅방 내에 날짜 출력을 위해 전역 변수로 선언하여 마지막 출력된 날짜 기억
// layout.html 또는 chatroom.html의 스크립트 블록에서 초기화됨
var currentUserId = window.currentUserId;

if (!currentUserId) {
    console.error("로그인이 필요합니다.");
    // 로그인 페이지로 튕구는 로직 등을 추가할 수 있습니다.
}

// 2. 현재 채팅방 ID 추출 (URL 경로 /chat/room/{roomId} 에서 가져오기 또는 전역 변수 참조)
const pathArray = window.location.pathname.split('/');
const roomId = window.roomId || (pathArray.includes('room') ? pathArray[pathArray.length - 1] : null);

/**
 * 스크롤 하단 이동 함수
 */
function scrollToBottom() {
    if (messageArea) {
        messageArea.scrollTop = messageArea.scrollHeight;
    }
}

function connect() {
    if (!currentUserId) return;
    console.log("웹 소켓 연결 성공:", currentUserId);
    // SockJS 연결 (SpringConfig 설정 엔드포인트)
    var socket = new SockJS('/ws-stomp');
    stompClient = Stomp.over(socket);

    stompClient.connect({}, onConnected, onError);
}

function onConnected() {
    // 0. 실시간 알림 구독 (내 아이디 전용 채널)
    // [전역 알림 핵심] 방에 들어가 있든 아니든, 나에게 오는 모든 메시지/초대 신호를 수신합니다.
    stompClient.subscribe('/sub/user/' + currentUserId + '/rooms', function (payload) {
        const messageData = JSON.parse(payload.body);
        console.log("개인 채널 알림 수신 성공:", messageData)
        console.log("실시간 목록 업데이트 신호 수신:", messageData);

        // [수정된 알림 조건]
        // 1. 내가 현재 '이 메시지가 온 방'에 들어가 있지 않아야 함
        const isCurrentRoom = (window.roomId && String(messageData.roomId) === String(window.roomId));

        // 2. 실제 메시지 내용이 있고, 타입이 채팅 메시지(TALK, IMAGE, FILE)인 경우에만 알림 표시
        // 이를 통해 방 생성 시 발생하는 'undefined' 알림을 방지합니다.
        const hasContent = messageData.content && messageData.content.trim() !== "";
        const isChatMsg = ['TALK', 'IMAGE', 'FILE'].includes(messageData.messageType);

        if (!isCurrentRoom && hasContent && isChatMsg) {
            showToastNotification(messageData);
        }

        // 이 함수 하나로 "새 방 초대"와 "기존 방 메시지 갱신"을 모두 처리합니다. (목록이 있는 페이지에서만 작동)
        if (typeof refreshRoomList === 'function') {
            refreshRoomList(messageData);
        }
    });

    // 1. 현재 대화방 메시지 구독 (특정 방 안에서만 메시지를 실시간으로 볼 때)
    if (window.roomId && !isNaN(window.roomId)) {
        stompClient.subscribe('/sub/chat/room/' + window.roomId, onMessageReceived);

        // 2. [실시간 읽음] 현재 방의 읽음 이벤트 구독
        stompClient.subscribe('/sub/chat/room/' + window.roomId + '/read', function (payload) {
            const readInfo = JSON.parse(payload.body);
            console.log("읽은 사람 ID:", readInfo.senderId);
            if (String(readInfo.senderId) !== String(currentUserId)) {
                decrementUnreadCounts();
            }
        });

        // 입장 시 내가 이 메시지들을 읽었다는 신호를 서버에 보냄
        sendReadEvent(window.roomId, currentUserId);
    }

    // [튕김 방지 로직 통합]
    if (messageArea) {
        // 1. 화면이 보이기 전에 스크롤을 미리 최하단으로 이동
        messageArea.scrollTop = messageArea.scrollHeight;

        // 2. 브라우저가 위치 계산을 마칠 때까지 기다린 후 화면 노출
        requestAnimationFrame(() => {
            messageArea.scrollTop = messageArea.scrollHeight; // 한 번 더 확실히 아래로 보냄

            setTimeout(() => {
                messageArea.classList.add('ready'); // CSS에서 설정한 opacity: 1 적용
            }, 10); // 0.1초의 미세한 지연으로 튕김 현상을 완전히 가림
        });
    }

    // setTimeout(scrollToBottom, 100);
    if (connectingElement) {
        connectingElement.classList.add('hidden');
    }
}

/**
 * 브라우저 상단 커스텀 토스트 알림 함수
 * 웹 알림 허용 팝업 없이 브라우저 내부 UI로 실시간 알림을 구현합니다.
 */
function showToastNotification(data) {
    const oldToast = document.querySelector('.chat-toast');
    if (oldToast) oldToast.remove();

    const toast = document.createElement('div');
    toast.className = 'chat-toast';

    let preview = data.content;
    if (data.messageType === 'IMAGE') preview = "📷 사진을 보냈습니다.";
    else if (data.messageType === 'FILE') preview = "📎 파일을 보냈습니다.";

    // 콤팩트한 카드 구조
    toast.innerHTML = `
        <div class="toast-inner">
            <div class="toast-profile">
                <img src="/images/profile300.svg">
            </div>
            <div class="toast-text-area">
                <div class="toast-user-name">${data.senderName}</div>
                <div class="toast-message">${preview}</div>
            </div>
        </div>
    `;

    // 클릭 시 해당 채팅방 이동
    toast.onclick = () => { location.href = '/chat/room/' + data.roomId; };
    document.body.appendChild(toast);

    // 애니메이션 트리거
    setTimeout(() => toast.classList.add('active'), 100);

    // 자동 삭제 (4.5초)
    setTimeout(() => {
        toast.classList.remove('active');
        setTimeout(() => toast.remove(), 500);
    }, 4500);
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

// 날짜 포맷 도우미 함수 (서버 형식 -> 한국식 날짜)
function formatKoreanDate(dateString) {
    if (!dateString) return "";
    const cleanDate = dateString.replace('T', ' ').split('.')[0];
    const d = new Date(cleanDate);
    const days = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일 ${days[d.getDay()]}`;
}

/**
 * 서버에서 받은 날짜 문자열을 KST 기준 시간(오전/오후)으로 변환하는 함수
 */
function getKstDisplayTime(dateString) {
    if (!dateString) return "";

    // [핵심] T를 공백으로 바꾸고 밀리초 부분을 제거하여 타임존 오해 방지
    const cleanDate = dateString.replace('T', ' ').split('.')[0];
    const d = new Date(cleanDate);

    const hours = d.getHours();
    const minutes = d.getMinutes();
    const ampm = hours >= 12 ? '오후' : '오전';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes < 10 ? '0' + minutes : minutes;

    return `${ampm} ${formattedHours}:${formattedMinutes}`;
}

/**
 * 실시간 채팅방 목록 관리 함수를 위한 현재 시간 생성
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
        </div>`;
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
        var chatMessage = {
            roomId: window.roomId, // window.roomId 참조
            senderId: currentUserId,
            content: messageContent,
            messageType: 'TALK'
        };

        stompClient.send("/pub/chat/sendMessage", {}, JSON.stringify(chatMessage));
        messageInput.value = '';    // 입력창 비우기
        messageInput.focus();       // 포커스 유지

        setTimeout(function() { isSending = false; }, 200);
        console.log("메시지 전송:", chatMessage);
    }
}

/**
 * 메시지를 수신했을 때 실행되는 함수 (방 안에서 말풍선 렌더링)
 */
function onMessageReceived(payload) {
    var message = JSON.parse(payload.body);
    // 현재 보고 있는 방의 메시지가 아니라면 무시 (전역 채널에서 이미 토스트로 처리함)
    if (String(message.roomId) !== String(window.roomId)) return;

    var msgType = message.messageType ? message.messageType.trim().toUpperCase() : 'TEXT';

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

        // 읽었을 때 사이드바 목록의 배지를 0으로 만들고 숨김
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
            img.style.maxWidth = '250px'; img.style.borderRadius = '8px'; img.style.display = 'block';
            img.onclick = function () {openImageModal(this.src)};
            bubble.appendChild(img);
        } else if (msgType === 'FILE') {
            var fileLink = document.createElement('a');
            fileLink.href = message.content; fileLink.download = ""; fileLink.className = 'file-link';
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

// 서버에 읽음 이벤트를 보내는 함수
function sendReadEvent(roomId, userId) {
    if (stompClient && stompClient.connected) {
        stompClient.send("/pub/chat/read", {}, JSON.stringify({
            roomId: roomId,
            senderId: userId
        }))
    }
}

function onError(error) {
    console.error('STOMP Error: ' + error);
    if (connectingElement) {
        connectingElement.textContent = '연결이 원활하지 않습니다.';
        connectingElement.style.color = 'red';
    }
}

/* --- 이벤트 리스너 등록 --- */

if (messageInput) {
    messageInput.addEventListener('keydown', function(event) {
        if (event.isComposing) return;
        if (event.key === 'Enter') {
            if (!event.shiftKey) {
                event.preventDefault();
                sendMessage(event);
            }
        }
    });
}

if (messageForm) {
    messageForm.addEventListener('submit', function(event) {
        event.preventDefault();
        sendMessage(event);
    }, true);
}

var sendButton = document.querySelector('.send-btn');
if (sendButton) {
    sendButton.addEventListener('click', function(event) {
        event.preventDefault();
        sendMessage(event);
    });
}

// 파일 전송 로직
function handleFileUpload(input, type) {
    if (!input.files || !input.files[0]) return;
    const file = input.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("roomId", window.roomId);

    fetch('/api/chat/files/upload', { method: 'POST', body: formData })
        .then(response => { if (!response.ok) throw new Error("업로드 실패"); return response.json(); })
        .then(fileLogDTO => { sendFileMessage(fileLogDTO, type); input.value = ""; })
        .catch(error => { console.error("Error:", error); alert("파일 업로드 중 오류 발생"); });
}

function sendFileMessage(fileLog, type) {
    const messageDTO = {
        roomId: window.roomId, senderId: currentUserId, content: fileLog.filePath,
        messageType: type, fileLogId: fileLog.fileLogId
    };
    stompClient.send("/pub/chat/sendMessage", {}, JSON.stringify(messageDTO));
}

// 채팅방 나가기 함수
function leaveRoom() {
    if (confirm("채팅방을 나가시겠습니까? 나간 후에는 대화 내용을 볼 수 없습니다.")) {
        fetch(`/chat/room/${window.roomId}/leave`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
        })
            .then(response => {
                if (response.ok) {
                    const roomElement = document.getElementById('room-' + window.roomId);
                    if (roomElement) roomElement.remove();
                    alert("채팅방에서 나갔습니다.");
                    location.href = "/chat/rooms";
                }
            })
            .catch(error => console.error("Error:", error));
    }
}

// 보관함 및 미디어 보관함 로직
function toggleChatSidebar() {
    const sidebar = document.getElementById('mediaSidebar');
    if (sidebar) {
        sidebar.classList.toggle('active');
        if (sidebar.classList.contains('active')) updateSidebarMedia();
    }
}

function updateSidebarMedia() {
    const imageContainer = document.getElementById('sidebarImageList');
    const fileContainer = document.getElementById('sidebarFileList');
    if (!imageContainer || !fileContainer) return;

    imageContainer.innerHTML = ''; fileContainer.innerHTML = '';
    const allImages = document.querySelectorAll('#messageLog img');
    allImages.forEach(img => {
        const copyImg = document.createElement('img');
        copyImg.src = img.src; copyImg.onclick = () => openImageModal(img.src);
        imageContainer.appendChild(copyImg);
    });
    const allFiles = document.querySelectorAll('#messageLog .file-link');
    allFiles.forEach(file => {
        const fileItem = document.createElement('a');
        fileItem.href = file.href; fileItem.className = 'sidebar-file-item';
        fileItem.download = ""; fileItem.innerHTML = `📎 <span>${file.textContent.replace('📎 ', '')}</span>`;
        fileContainer.appendChild(fileItem);
    });
}

// 검색 및 목록 렌더링
let searchTimeout = null;
const searchInput = document.querySelector('.search-container input');
if (searchInput) {
    searchInput.addEventListener('input', function(e) {
        clearTimeout(searchTimeout);
        const keyword = e.target.value.trim();
        searchTimeout = setTimeout(() => {
            fetch(`/chat/api/search?keyword=${encodeURIComponent(keyword)}`)
                .then(res => res.json())
                .then(rooms => renderRoomList(rooms))
                .catch(err => renderRoomList([]));
        }, 300);
    });
}

function renderRoomList(rooms) {
    const container = document.getElementById('room-list');
    if (!container) return;
    container.innerHTML = '';
    if (!Array.isArray(rooms) || rooms.length === 0) {
        container.innerHTML = '<p style="padding: 20px; text-align: center; color: #999;">결과 없음</p>';
        return;
    }
    rooms.forEach(r => {
        const activeClass = (String(window.roomId) === String(r.roomId)) ? 'active' : '';
        const badgeClass = (r.unreadCount > 0) ? 'unread-badge' : 'unread-badge hidden';
        const html = `
            <div id="room-${r.roomId}" class="room-card ${activeClass}" data-room-id="${r.roomId}">
                <a href="/chat/room/${r.roomId}">
                    <div class="profile-img"><img src="/images/profile300.svg"></div>
                    <div class="room-text">
                        <div class="name-row"><span class="name">${r.roomName || '방'}</span><span class="last-time">${r.lastMessageDisplayTime || ''}</span></div>
                        <div class="preview-row" style="display: flex; justify-content: space-between;"><span class="preview">${r.lastMessageContent || ''}</span><span id="unread-badge-${r.roomId}" class="${badgeClass}">${r.unreadCount || 0}</span></div>
                    </div>
                </a>
            </div>`;
        container.insertAdjacentHTML('beforeend', html);
    });
}

// 이미지 모달 로직
let currentImageList = [];
let currentImageIndex = 0;

function openImageModal(clickedSrc) {
    const modal = document.getElementById('imageModal');
    if (!modal) return;

    // 모든 이미지 메시지 단위를 가져옵니다.
    const allMsgUnits = document.querySelectorAll('.msg-unit:has(.bubble img)');

    currentImageList = Array.from(allMsgUnits).map(unit => {
        const img = unit.querySelector('.bubble img');
        const sender = unit.querySelector('.sender')?.textContent || "나";
        const time = unit.querySelector('.msg-time')?.textContent || "";

        // 해당 메시지(li)에서 위로 가장 가까운 날짜 구분선(.date-divider) 찾기
        const parentLi = unit.closest('li');
        let dateText = "";
        let prevElement = parentLi.previousElementSibling;

        while (prevElement) {
            if (prevElement.classList.contains('date-divider')) {
                // 시스템 내부 텍스트(예: 2025년 12월 27일 토요일) 추출
                dateText = prevElement.querySelector('.system-inner')?.textContent || "";
                break;
            }
            prevElement = prevElement.previousElementSibling;
        }

        return {
            src: img.src,
            sender: sender,
            // 날짜와 시간을 합쳐서 저장 (예: 2025년 12월 27일 토요일 오후 2:30)
            fullDate: dateText ? `${dateText} ${time}` : time
        };
    });

    currentImageIndex = currentImageList.findIndex(item => item.src === clickedSrc);
    modal.style.display = 'flex';
    updateFullImage();
}

function updateFullImage() {
    const item = currentImageList[currentImageIndex];
    if (!item) return;

    document.getElementById('fullImage').src = item.src;
    document.getElementById('modalSenderName').textContent = item.sender;

    // 날짜가 포함된 fullDate 적용
    document.getElementById('modalSendDate').textContent = item.fullDate;

    const downloadBtn = document.getElementById('imageDownloadBtn');
    downloadBtn.href = item.src;

    const fileName = item.src.split('/').pop();
    downloadBtn.setAttribute('download', fileName.includes('_') ? fileName.substring(fileName.indexOf('_') + 1) : fileName);

    // 만약 HTML에 imageCaption 요소가 없다면 에러가 날 수 있으니 체크 후 삽입
    const caption = document.getElementById('imageCaption');
    if(caption) {
        caption.textContent = `${currentImageIndex + 1} / ${currentImageList.length}`;
    }
}

function changeImage(direction) {
    if (currentImageList.length === 0) return;
    currentImageIndex = (currentImageIndex + direction + currentImageList.length) % currentImageList.length;
    updateFullImage();
}

function closeImageModal() {
    const modal = document.getElementById('imageModal');
    if (modal) modal.style.display = 'none';
}


// 전역 단축키 제어
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') {
        const createRoomModal = document.getElementById('createRoomModal');
        if (createRoomModal && window.getComputedStyle(createRoomModal).display !== 'none') {
            if (typeof closeCreateRoomModal === 'function') closeCreateRoomModal();
        }
        const mediaSidebar = document.getElementById('mediaSidebar');
        if (mediaSidebar && mediaSidebar.classList.contains('active')) toggleChatSidebar();
        closeImageModal();
    }
    const modal = document.getElementById('imageModal');
    if (modal && modal.style.display === 'flex') {
        if (event.key === 'ArrowLeft') changeImage(-1);
        if (event.key === 'ArrowRight') changeImage(1);
    }
});

// 페이지 로드 시 실행 (기존 코드를 아래와 같이 수정하세요)
window.onload = function() {
    // 1. 웹소켓 연결 (기존 로직)
    if (currentUserId) connect();

    // 2. 현재 방 배지 초기화 (기존 로직)
    if (window.roomId) {
        const currentBadge = document.getElementById('unread-badge-' + window.roomId);
        if (currentBadge) {
            currentBadge.textContent = '0';
            currentBadge.classList.add('hidden');
        }
    }

    // 3. URL 파라미터를 통한 채팅방 생성 모달 자동 제어
    const urlParams = new URLSearchParams(window.location.search);
    const inviteIdsStr = urlParams.get('invite');
    const roomNameParam = urlParams.get('roomName'); // 업무(Task) 제목

    if (inviteIdsStr) {
        // 초대할 ID 리스트 추출
        const inviteIds = inviteIdsStr.split(",").map(Number);

        // A. 모달 열기 (별도 파일에 정의된 함수 호출)
        if (typeof openCreateRoomModal === 'function') {
            openCreateRoomModal();
        }

        // B. 전달받은 업무 제목이 있다면 채팅방 이름 입력창에 자동 세팅
        if (roomNameParam) {
            const roomNameInput = document.getElementById('newRoomName');
            if (roomNameInput) {
                // 인코딩되어 넘어온 제목을 다시 텍스트로 변환하여 삽입
                roomNameInput.value = decodeURIComponent(roomNameParam);
            }
        }

        // C. 유저 목록 로드 및 자동 선택
        // /chat/users API 결과가 로드된 후 처리를 위해 fetch를 한 번 더 사용하거나,
        // loadDeptAndUsers() 내부의 렌더링이 끝난 시점을 기다려야 합니다.
        fetch('/chat/users')
            .then(res => res.json())
            .then(users => {
                inviteIds.forEach(id => {
                    const user = users.find(u => Number(u.userId) === Number(id));
                    if (user && typeof selectUser === 'function') {
                        // 기존 selectUser 함수를 사용하여 오른쪽 '선택된 대상'에 추가
                        selectUser(user.userId, user.userName, user.deptname || '기타');
                    }
                });
            })
            .catch(err => console.error("자동 초대 유저 로드 실패:", err));

        // URL의 파라미터를 제거하여 새로고침 시 모달이 다시 뜨지 않게 하고 싶다면 아래 주석 해제
        // const cleanUrl = window.location.origin + window.location.pathname;
        // window.history.replaceState({}, document.title, cleanUrl);
    }
};