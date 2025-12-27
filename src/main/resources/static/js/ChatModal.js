/**
 * 채팅방 생성 모달 관련 스크립트
 */

// 선택된 유저 정보를 저장할 Set (객체를 저장하기 위해 관리 로직 최적화)
let selectedUsers = [];

// 1. 모달 열기
function openCreateRoomModal() {
    const modal = document.getElementById('createRoomModal');
    if (modal) {
        modal.style.setProperty("display", "flex", "important");
        modal.style.zIndex = "9999";
        loadDeptAndUsers(); // 서버에서 부서 및 유저 정보 조회
    }
}

// 2. 모달 닫기 및 초기화
function closeCreateRoomModal() {
    const modal = document.getElementById('createRoomModal');
    if (modal) {
        modal.style.display = 'none';
        // 입력 필드 및 선택 목록 초기화
        document.getElementById('newRoomName').value = '';
        selectedUsers = [];
        renderSelectedUsers();
    }
}

// 3. 서버에서 부서별 유저 데이터 가져오기 (AJAX)
function loadDeptAndUsers() {
    fetch('/chat/users') // 컨트롤러에 만든 API 주소
        .then(response => response.json())
        .then(data => {
            renderDeptTree(data);
        })
        .catch(error => console.error('유저 목록 로드 실패:', error));
}

// 4. 조직도 그리기 (부서 클릭 시 열리는 구조)
function renderDeptTree(users) {
    console.log("로그인한 유저 ID:", currentUserId);
    const deptTree = document.getElementById('deptTree');
    deptTree.innerHTML = ''; // 초기화

    // 부서명으로 그룹화 (부서명이 없는 경우 기타 처리)
    const groupedData = users.reduce((acc, user) => {
        const dept = user.deptname || '기타';
        if (!acc[dept]) acc[dept] = [];
        acc[dept].push(user);
        return acc;
    }, {});

    Object.keys(groupedData).forEach((deptName, index) => {
        const deptId = `dept-${index}`;
        const li = document.createElement('li');

        // BIGINT 타입 대응을 위해 Number()를 사용하여 본인 제외 리스트 생성
        const filteredUsers = groupedData[deptName].filter(user => {
            return Number(user.userId) !== Number(currentUserId);
        });

        // 만약 본인을 제외하고 해당 부서에 아무도 없다면 부서 자체를 표시하지 않는 코드
        if (filteredUsers.length === 0) return;

        li.innerHTML = `
            <div class="dept-item" onclick="toggleDept('${deptId}')">
                <span class="arrow" id="arrow-${deptId}">▶</span> ${deptName}
            </div>
            <ul id="${deptId}" class="user-list hidden">
                ${filteredUsers.map(user => {
            // 수정 이미 선택된 유저인지 확인하여 클래스 부여
            const isSelected = selectedUsers.some(u => u.id === user.userId);
            return `
                    <li class="user-item ${isSelected ? 'selected-disabled' : ''}" 
                        id="user-item-${user.userId}"
                        onclick="selectUser(${user.userId}, '${user.userName}', '${deptName}')">
                        <div class="user-info-row">
                            <span class="user-icon">👤</span>
                            <div class="user-text">
                                <span class="u-name">${user.userName}</span>
                                <span class="u-dept">${user.positionName || ''}</span>
                            </div>
                        </div>
                    </li>
                `}).join('')}
            </ul>
        `;
        deptTree.appendChild(li);
    });
}

// 5. 부서 토글 로직
function toggleDept(deptId) {
    const list = document.getElementById(deptId);
    const arrow = document.getElementById(`arrow-${deptId}`);

    if (list) {
        const isHidden = list.classList.toggle('hidden');
        arrow.innerText = isHidden ? '▶' : '▼';
    }
}

// 6. 유저 선택 (오른쪽 패널로 추가)
function selectUser(userId, userName, deptName) {
    // 본인은 제외하고 싶다면 여기서 currentUserId와 비교 로직 추가 가능
    if (selectedUsers.some(u => u.id === userId)) return;

    selectedUsers.push({ id: userId, name: userName, dept: deptName });

    // 왼쪽 리스트에서 해당 유저 비활성화 클래스 추가
    const userItem = document.getElementById(`user-item-${userId}`);
    if (userItem) userItem.classList.add('selected-disabled');
    renderSelectedUsers();
}

// 7. 선택된 유저 삭제
function removeUser(userId) {
    selectedUsers = selectedUsers.filter(u => u.id !== userId);

    // 왼쪽 리스트에서 해당 유저 비활성화 클래스 제거
    const userItem = document.getElementById(`user-item-${userId}`);
    if (userItem) userItem.classList.remove('selected-disabled');

    renderSelectedUsers();
}

// 8. 오른쪽 패널(선택된 대상) UI 업데이트
function renderSelectedUsers() {
    const container = document.getElementById('selectedUserList');
    const countLabel = document.getElementById('selectedUsersCount');

    countLabel.innerText = `선택된 대상 (${selectedUsers.length})`;

    if (selectedUsers.length === 0) {
        container.innerHTML = '<p class="placeholder-text">대상을 선택해주세요.</p>';
        return;
    }

    container.innerHTML = selectedUsers.map(user => `
        <div class="selected-user-item">
            <div class="selected-info">
                <span class="s-name">${user.name}</span>
                <span class="s-dept">${user.dept}</span>
            </div>
            <button type="button" class="remove-btn" onclick="removeUser(${user.id})">&times;</button>
        </div>
    `).join('');
}

// 9. 이름 검색 필터링
function filterUsers(keyword) {
    const trimmedKeyword = keyword.trim().toLowerCase();
    const userLists = document.querySelectorAll('.user-list');
    const userItems = document.querySelectorAll('.user-item');

    // 9-1. 검색어가 비어있는 경우: 모든 부서를 닫고 초기화
    if (trimmedKeyword === "") {
        userLists.forEach(list => {
            list.classList.add('hidden'); // 모든 리스트 숨김
            const arrow = document.getElementById(`arrow-${list.id}`);
            if (arrow) arrow.innerText = '▶';
        });
        userItems.forEach(item => {
            item.style.display = 'flex'; // 모든 유저 숨김
        });
        return;
    }

    // 9-2. 검색어가 있는 경우: 일치하는 유저 표시 및 부서 자동 열기
    userLists.forEach(list => {
        let hasVisibleUser = false;
        const itemsInGroup = list.querySelectorAll('.user-item');

        itemsInGroup.forEach(item => {
            const name = item.querySelector('.u-name').innerText.toLowerCase();
            if (name.includes(trimmedKeyword)) {
                item.style.display = 'flex';
                hasVisibleUser = true;
            } else {
                item.style.display = 'none';
            }
        });

        const arrow = document.getElementById(`arrow-${list.id}`);
        if (hasVisibleUser) {
            list.classList.remove('hidden'); // 결과가 있는 부서 열기
            if (arrow) arrow.innerText = '▼';
        } else {
            list.classList.add('hidden'); // 결과 없는 부서 닫기
            if (arrow) arrow.innerText = '▶';
        }
    });
}

// 10. 최종 전송
function submitCreateRoom() {
    const roomName = document.getElementById('newRoomName').value;

    if (selectedUsers.length === 0) {
        alert("최소 한 명 이상의 대상을 선택해주세요.");
        return;
    }

    const form = document.createElement('form');
    form.method = 'POST';
    form.action = '/chat/room';

    const nameInput = document.createElement('input');
    nameInput.type = 'hidden';
    nameInput.name = 'roomName';
    nameInput.value = roomName;
    form.appendChild(nameInput);

    selectedUsers.forEach(user => {
        const idInput = document.createElement('input');
        idInput.type = 'hidden';
        idInput.name = 'inviteUserIds';
        idInput.value = user.id;
        form.appendChild(idInput);
    });

    document.body.appendChild(form);
    form.submit();
}

// 11. 모달 배경 클릭 시 닫기 로직 추가
document.addEventListener('DOMContentLoaded', function() {
    const createRoomModal = document.getElementById('createRoomModal');
    if (createRoomModal) {
        createRoomModal.addEventListener('click', function(e) {
            // 클릭한 대상(e.target)이 모달 컨텐츠가 아닌 투명/반투명 배경(this)일 때만 실행
            if (e.target === this) {
                closeCreateRoomModal();
            }
        });
    }
});