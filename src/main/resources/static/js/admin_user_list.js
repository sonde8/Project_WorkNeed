/* =========================
   공통 모달 제어
========================= */
function openModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'block';
}

function closeModal(id) {
    const modal = document.getElementById(id);
    if (modal) modal.style.display = 'none';
}

/* =========================
   체크박스 전체 선택
========================= */
function toggleAll(source) {
    document.querySelectorAll('input[name="userCheck"]').forEach(cb => {
        cb.checked = source.checked;
    });
}

/* =========================
   유저 정보 수정 모달
========================= */
function openEditModal(userId, deptId, rankId, status) {
    document.getElementById('targetUserId').value = userId;
    document.getElementById('modalDept').value = deptId;
    document.getElementById('modalRank').value = rankId;
    document.getElementById('modalStatus').value = status;
    openModal('editModal');
}

function saveChanges() {
    const data = {
        userId: document.getElementById('targetUserId').value,
        deptId: document.getElementById('modalDept').value,
        rankId: document.getElementById('modalRank').value,
        userStatus: document.getElementById('modalStatus').value
    };

    fetch('/admin/member/edit/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(res => res.text())
    .then(result => {
        if (result === "success") {
            alert('저장되었습니다.');
            location.reload();
        } else {
            alert('오류가 발생했습니다.');
        }
    });
}

/* =========================
   유저 상태 일괄 변경
========================= */
function fnBatchUpdate() {
    const selectedIds = Array.from(
        document.querySelectorAll('input[name="userCheck"]:checked')
    ).map(cb => cb.value);

    if (selectedIds.length === 0) {
        alert("유저를 선택해주세요.");
        return;
    }

    const status = document.getElementById('batchStatus').value;
    const params = new URLSearchParams();
    selectedIds.forEach(id => params.append('userIds', id));
    params.append('status', status);

    fetch('/admin/member/batch-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params
    })
    .then(res => res.text())
    .then(result => {
        if (result === "success") {
            alert('일괄 변경 완료');
            location.reload();
        }
    });
}

/* =========================
   부서 관리
========================= */
function fnAddDept() {
    const name = document.getElementById('newDeptName').value;
    if (!name) return alert("부서명을 입력하세요.");

    fetch('/admin/dept/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ deptName: name })
    })
    .then(res => res.text())
    .then(result => {
        if (result === "success") location.reload();
        else alert("부서 추가 실패");
    });
}

function fnDeleteDept(deptId) {
    if (!confirm("해당 부서를 삭제하시겠습니까?\n소속 인원은 '미배정'으로 이동됩니다.")) return;

    fetch('/admin/dept/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ deptId })
    })
    .then(res => res.text())
    .then(result => {
        if (result === "success") location.reload();
        else if (result === "is_default") alert("기본 부서는 삭제할 수 없습니다.");
        else alert("삭제 실패");
    });
}

/* =========================
   직급 관리
========================= */
function fnAddRank() {
    const name = document.getElementById('newRankName').value;
    if (!name) return alert("직급명을 입력하세요.");

    fetch('/admin/rank/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ rankName: name })
    })
    .then(res => res.text())
    .then(result => {
        if (result === "success") location.reload();
        else alert("직급 추가 실패");
    });
}

function fnDeleteRank(rankId) {
    if (!confirm("해당 직급을 삭제하시겠습니까?\n해당 인원은 '신입'으로 이동됩니다.")) return;

    fetch('/admin/rank/delete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ rankId })
    })
    .then(res => res.text())
    .then(result => {
        if (result === "success") location.reload();
        else if (result === "is_default") alert("기본 직급은 삭제할 수 없습니다.");
        else alert("삭제 실패");
    });
}

/* =========================
   관리자 생성
========================= */
function saveNewAdmin() {
    const adminName = document.getElementById('newAdminName').value.trim();
    const adminEmail = document.getElementById('newAdminEmail').value.trim();
    const adminPassword = document.getElementById('newAdminPassword').value;
    const roleId = document.getElementById('newAdminRoleId').value;

    // 정규식 선언
    const pwRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/; // 이메일 정규식 추가

    // 2. 검증
    if (!adminName || !adminEmail || !adminPassword || !roleId) {
        alert("모든 정보를 입력해주세요.");
        return;
    }

    if (!pwRegex.test(adminPassword)) {
        alert("비밀번호는 영문, 숫자, 특수문자를 포함하여 8자 이상 입력해야 합니다.");
        return;
    }

    if (!emailRegex.test(adminEmail)) {
        alert("올바른 이메일 형식을 입력해주세요.");
        return;
    }

   // 4. 서버 전송
       const data = {
           adminName: adminName,
           adminEmail: adminEmail,
           adminPassword: adminPassword,
           roleId: roleId
       };

       fetch('/admin/member/add-admin', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify(data)
       })
       .then(res => res.text())
       .then(result => {
           if (result === "success") {
               alert("관리자 생성 완료");
               location.reload();
           } else {
               alert("생성 실패: " + result);
           }
       })
       .catch(err => {
           console.error("Error:", err);
           alert("서버 통신 중 오류가 발생했습니다.");
       });
   }

   //비밀번호 눈모양
   function togglePasswordVisibility() {
       const pw = document.getElementById('newAdminPassword');
       const icon = document.getElementById('togglePw');

       if (pw.type === 'password') {
           pw.type = 'text';
           // 눈 감은 모양으로 변경
           icon.classList.remove('fa-eye');
           icon.classList.add('fa-eye-slash');
       } else {
           pw.type = 'password';
           // 눈 뜬 모양으로 변경
           icon.classList.remove('fa-eye-slash');
           icon.classList.add('fa-eye');
       }
   }

   /* =========================
      관리자 상태 변경
   ========================= */
   function changeAdminStatus(targetId, currentStatus) {
       const nextStatus = currentStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
       const msg = nextStatus === 'SUSPENDED'
           ? "해당 관리자를 정지하시겠습니까?"
           : "정지를 해제하시겠습니까?";

       if (!confirm(msg)) return;

       fetch('/admin/manage/status', {
           method: 'POST',
           headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
           body: new URLSearchParams({ targetId, status: nextStatus })
       })
       .then(res => res.text())
       .then(result => {
           if (result === "success") {
               location.reload();
           } else if (result === "self_error") {
               alert("본인 계정은 정지할 수 없습니다.");
           } else {
               alert("오류가 발생했습니다.");
           }
       });
   }

/* =========================
모달 외부 클릭 및 ESC 닫기 추가
========================= */

// 1. 모달 바깥 배경 클릭 시 닫기
window.addEventListener('click', function(event) {
    // 클릭된 요소가 'modal' 클래스를 가진 배경 영역인지 확인
    if (event.target.classList.contains('modal')) {
        closeModal(event.target.id);
    }
});

// 2. ESC 키 입력 시 열려있는 모달 닫기
window.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        // 현재 display가 'block'인 모든 모달을 찾아 닫음
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            if (modal.style.display === 'block') {
                closeModal(modal.id);
            }
        });
    }
});






