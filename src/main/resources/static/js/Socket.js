'use strict';

// 1. HTML 요소 참조 (설계서 기반 ID 매칭)
var messageForm = document.querySelector('#messageForm');
var messageInput = document.querySelector('#message');
var messageArea = document.querySelector('#messageLog'); // chatroom.html의 ul id와 맞춤
var connectingElement = document.querySelector('.connecting');

var stompClient = null;
var isSending = false;

// 나중에 로그인 기능 완성되면 삭제하거나 교체하기
var currentUserId = window.currentUserId;

if (!currentUserId) {
    console.error("로그인이 필요합니다.");
     // 로그인 페이지로 튕구는 로직 등을 추가할 수 있습니다.
}


// 2. 현재 채팅방 ID 추출 (URL 경로 /chat/room/{roomId} 에서 가져오기)
const pathArray = window.location.pathname.split('/');
const roomId = pathArray[pathArray.length - 1];

/**
 * 스크롤 하단 이동 함수
 */
function scrollToBottom() {
    if (messageArea) {
        messageArea.scrollTop = messageArea.scrollHeight;
    }
}


function connect() {
    // SockJS 연결 (SpringConfig 설정 엔드포인트)
    var socket = new SockJS('/ws-stomp');
    stompClient = Stomp.over(socket);

    stompClient.connect({}, onConnected, onError);
}


function onConnected() {
    // 구독 설정 (서버가 쏘는 경로)
    stompClient.subscribe('/sub/chat/room/' + roomId, onMessageReceived);

    // 추가 읽음 확인 이벤트
    stompClient.subscribe('/sub/chat/room/' + roomId + '/read', function (payload) {
        const readInfo = JSON.parse(payload.body);

        // 누군가 읽었다는 신호가 오면 화면의 모든 unread-count를 찾아 지움
        // 1:1 채팅에서는 읽는 순간 숫자가 사라짐
        const unreadElements = document.querySelectorAll('.unread-count');
        unreadElements.forEach(el => {
            el.remove();
        })
        console.log("읽음 이벤트 수신: 숫자를 갱신합니다.")
    })

    // 추가 연결 성공 시 기존 history가 있다면 하단으로 스크롤 이동
    setTimeout(scrollToBottom, 100);

    if (connectingElement) {
        connectingElement.classList.add('hidden');
    }
    console.log("Connected to room: " + roomId);
}


function sendMessage(event) {
    var messageContent = messageInput.value.trim();
    if (event) event.preventDefault(); // 이벤트 전파 방지
    if (isSending) return;  // 중복 전송 방지

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

        // 전송 완료 후 잠금 해제 (연타 방지를 위해 100ms 지연)
        setTimeout(function() {
            isSending = false;
        }, 100)
        console.log("메시지 전송:", chatMessage);
    }
    event.preventDefault();
}


/**
 * 메시지를 수신했을 때 실행되는 함수
 */
function onMessageReceived(payload) {
    var message = JSON.parse(payload.body);
    var messageElement = document.createElement('li');

    console.log("수신 데이터 타입 확인: [" + message.messageType + "]");
    console.log("수신 데이터 전체: ", message);

    // [데이터 보정] DB에서 가져온 타입에 공백이 있거나 소문자일 경우를 대비해 처리
    var msgType = message.messageType ? message.messageType.trim().toUpperCase() : 'TEXT';

    // 메세지 타입이 시스템 메세지이고, 송신자가 현재 유저와 같다면 화면에 띄우지 않고 종료
    // 단, '초대' 메시지는 방을 만든 나에게도 보여야 하므로 필터링에서 제외합니다.
    if ((msgType === 'ENTER' || msgType === "LEAVE") &&
        String(message.senderId) === String(currentUserId) &&
        !message.content.includes("초대")) {
        return;
    }


    // 1. 메시지 타입에 따른 렌더링 (시스템 메시지)
    if (msgType === 'ENTER' || msgType === 'LEAVE') {
        messageElement.className = 'system-msg';
        var container = document.createElement('div');

        container.className = 'system-inner';
        container.textContent = message.content;
        messageElement.appendChild(container);
    }
    // 2. 일반 대화 메시지
    else {
        var isMe = (String(message.senderId) === String(currentUserId));
        messageElement.className = isMe ? 'my-msg' : 'other-msg';

        var msgUnit = document.createElement('div');
        msgUnit.className = 'msg-unit';

        // 상대방 이름 표시
        if(!isMe) {
            var userNameElement = document.createElement('span');
            userNameElement.className = 'sender';
            userNameElement.textContent = message.senderName;
            msgUnit.appendChild(userNameElement);
        }

        var bubbleRow = document.createElement('div');
        bubbleRow.className = 'bubble-row';

        // 말풍선 생성 (이미지, 파일 관련 수정)
        var bubble = document.createElement('div');
        bubble.className = 'bubble';

        if (msgType === 'IMAGE') {
            // 이미지 렌더링
            var img = document.createElement('img');
            img.src = message.content;
            img.style.maxWidth = '250px';
            img.style.borderRadius = '8px';
            img.style.display = 'block';
            img.onclick = function () {window.open(this.src)}; // 클릭 시 원본 보기
            img.onerror = function () {console.error("이미지 경로 오류:" + this.src);};
            bubble.appendChild(img)
        }
        else if (msgType === 'FILE') {
            var fileLink = document.createElement('a');
            fileLink.href = message.content;
            fileLink.download = "";
            fileLink.className = 'file-link';
            fileLink.style.textDecoration = 'underline';
            fileLink.style.color = isMe ? '#000' : '#333'

            // 파일명만 추출 (UUID_파일명 -> 파일명)
            var fullPath = message.content
            var fileName = fullPath.split('/').pop()    // 마지막 / 뒤의 파일명 가져오기
            if(fileName.includes('_')) fileName = fileName.substring(fileName.indexOf('_') + 1);

            fileLink.textContent = "📎 " + fileName;
            bubble.appendChild(fileLink)
        }
        else {
            // 일반 텍스트
            var textPara = document.createElement('p');
            textPara.textContent = message.content;
            textPara.style.margin = '0';
            textPara.style.display = 'inline';
            bubble.appendChild(textPara);
        }

        // [수정 포인트] 숫자와 시간을 담는 정보 영역 생성
        var msgInfo = document.createElement('div');
        msgInfo.className = 'msg-info';

        // 안 읽은 숫자 (0보다 클 때만 생성)
        if (message.unreadCount > 0) {
            var unreadElement = document.createElement('span');
            unreadElement.className = 'unread-count';
            unreadElement.textContent = message.unreadCount;
            msgInfo.appendChild(unreadElement);
        }

        // 시간 표시
        var timeElement = document.createElement('span');
        timeElement.className = 'msg-time';
        timeElement.textContent = message.displayTime || "";
        msgInfo.appendChild(timeElement);

        // 조립: bubbleRow 안에 bubble과 msgInfo를 넣음
        bubbleRow.appendChild(bubble);
        bubbleRow.appendChild(msgInfo);

        msgUnit.appendChild(bubbleRow);
        messageElement.appendChild(msgUnit);

        // 메세지를 수신했을 때, 내가 보낸 게 아니고 상대방이 보낸 것이라면
        // 내가 이 메세지를 읽었다는 신호를 서버에 바로 보내주는 로직
        if (!isMe) {
            sendReadEvent(message.roomId, currentUserId)
        }

        // 사이드바가 열린 상태에서 메세지를 수신 했을 때 실시간으로 사이드바에 이미지, 파일이 추가되게 하는 코드
        // 1. 메시지를 messageLog에 추가
        var messageLog = document.getElementById('messageLog');
        messageLog.appendChild(messageElement);
        messageLog.scrollTop = messageLog.scrollHeight; // 스크롤 하단 이동

        // 2. 실시간 사이드바 업데이트 로직
        // 현재 사이드바가 화면에 보이고 있는 상태(active 클래스 보유)인지 확인
        const sidebar = document.getElementById('mediaSidebar');
        if (sidebar && sidebar.classList.contains('active')) {
            // 이미지나 파일 타입일 때만 업데이트하면 더 효율적입니다.
            if (msgType === 'IMAGE' || msgType === 'FILE') {
                updateSidebarMedia();
            }
        }
    }


    // 왼쪽 채팅방 목록에 미리보기 실시간 업데이트 로직
    var roomListElement = document.querySelector(`.room-card[data-room-id="${message.roomId}"]`);

    if (roomListElement) {
        var previewElement = roomListElement.querySelector(`.preview`);
        if (previewElement) {
            // 마지막 메세지 내용을 보여줌
            if (msgType === 'IMAGE') {
                previewElement.textContent = "사진을 보냈습니다.";
            } else if (msgType === 'FILE') {
                previewElement.textContent = '파일을 보냈습니다.'
            } else {
                previewElement.textContent = message.content;
            }

            // 새로운 메세지가 온 채팅방을 위로 올리는 코드
            var parentList = roomListElement.parentNode;
            parentList.prepend(roomListElement);
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


// 엔터키 전송 로직
if (messageInput) {
    messageInput.addEventListener('keydown', function(event) {
        // 한글 입력 중 (조합 중) 일 때는 함수를 실행하지 않음 (중복 방지 핵심)
        if (event.isComposing) return;

        if (event.key === 'Enter') {
            if (!event.shiftKey) {
                event.preventDefault(); // 줄바꿈 방지 및 중복 전송 방지
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
    // HTML의 script 태그에서 선언한 currentUserId가 있는지 확인 후 연결
    if (typeof currentUserId !== 'undefined') {
        connect();
    } else {
        console.error("currentUserId가 정의되지 않았습니다.");
    }
};


// 파일 전송 로직
function handleFileUpload(input, type) {
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    const formData = new FormData();
    formData.append("file", file);
    formData.append("roomId", roomId);

    // 로딩 표시 등을 여기에 추가하면 좋습니다.

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
            // 업로드 성공 시 소켓을 통해 메시지 전송
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

    // 기존 Socket.js에 있는 stompClient 전송 로직 호출
    stompClient.send("/pub/chat/sendMessage", {}, JSON.stringify(messageDTO));
}


// 이미지, 파일 보관함 사이드바 토글 함수
function toggleChatSidebar() {
    const sidebar = document.getElementById('mediaSidebar');
    sidebar.classList.toggle('active');

    // 사이드바가 열릴 때 데이터 갱신
    if (sidebar.classList.contains('active')) {
        updateSidebarMedia();
    }
}

// 미디어 모아보기 데이터 갱신
function updateSidebarMedia() {
    const imageContainer = document.getElementById('sidebarImageList');
    const fileContainer = document.getElementById('sidebarFileList');

    // 초기화
    imageContainer.innerHTML = '';
    fileContainer.innerHTML = '';

    // 1. 이미지 수집
    const allImages = document.querySelectorAll('#messageLog img');
    allImages.forEach(img => {
        const copyImg = document.createElement('img');
        copyImg.src = img.src;
        copyImg.onclick = () => window.open(img.src);   // 추후 이미지 뷰어 모달 구현 시 연결
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

    // 데이터가 없을 때 처리
    if (allImages.length === 0) imageContainer.innerHTML = '<p style="color:#aaa; font-size:1.1rem;">사진이 없습니다.</p>';
    if (allFiles.length === 0) fileContainer.innerHTML = '<p style="color:#aaa; font-size:1.1rem;">파일이 없습니다.</p>';
}

// 전역 단축키 제어 (ESC 키)
// 모달과 사이드바 닫기 통합 관리
document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape' || event.code === 'Escape') {
        // 1. 채팅방 생성 모달 닫기
        const createRoomModal = document.getElementById('createRoomModal');
        // display 속성이 flex거나 block 인 경우 (열려있는 상태) 체크
        if (createRoomModal && window.getComputedStyle(createRoomModal).display !== 'none') {
            closeCreateRoomModal(); // chatModal.js에 있는 함수 호출
            return; // 하나 닫았으면 중복 방지를 위해 리턴
        }

        // 2. 미디어 사이드바(서랍) 닫기
        const mediaSidebar = document.getElementById('mediaSidebar');
        // 사이드바가 active 클래스를 가지고 있는 경우 체크
        if (mediaSidebar && mediaSidebar.classList.contains('active')) {
            toggleChatSidebar(); // Socket.js 또는 chatroom 내의 함수 호출
            return;
        }
    }
});