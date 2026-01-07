document.addEventListener("DOMContentLoaded", () => {

    const pwForm = document.getElementById("pwChangeForm");
    const el = document.getElementById("todayStart");
        if (!el) return;

         const d = new Date();
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const dd = String(d.getDate()).padStart(2, "0");

            el.textContent = `${yyyy}. ${mm}. ${dd}`;

 if (pwForm) {
     pwForm.addEventListener("submit", (e) => {
         const newPw = document.getElementById("newPassword").value;
         const confirmPw = document.getElementById("confirmPassword").value;

         // 8자리 이상, 영문, 숫자, 특수문자 조합 정규식
         const pwRegex =
                   /^(?=.*[A-Za-z])(?=.*\d)(?=.*[$!%*#?&])[A-Za-z\d$!%*#?&]{8,}$/;

         if (!pwRegex.test(newPw)) {
             e.preventDefault(); // 폼 제출 중단
             alert("비밀번호는 영어, 숫자, 특수문자(@ 제외) 포함 8자 이상이어야 합니다.");
             return;
         }

         if (newPw !== confirmPw) {
             e.preventDefault();
             alert("새 비밀번호와 확인 비밀번호가 일치하지 않습니다.");
             return;
         }
     });
    }

    // 비밀번호 변경 모달 제어
    const openBtn = document.getElementById("openPwModal");
    const modal = document.getElementById("pwModal");
    const tempNotice = document.getElementById("tempPwNotice");

    // 1. [수동 열기] 버튼 클릭 시 모달 열기
    if (openBtn && modal) {
        openBtn.addEventListener("click", () => {
            // 사용자가 직접 버튼을 눌렀을 때는 "임시비밀번호 안내문구"를 숨깁니다.
            if (tempNotice) tempNotice.style.display = "none";
            modal.style.display = "block";
        });
    }

    // 2. [자동 열기] 임시 비밀번호 로그인 시 (서버에서 신호를 줬을 때)
    if (window.needsPasswordChange === true && modal) {
        if (!window.__pwAlertShown) {
            window.__pwAlertShown = true;
            alert("안전한 비밀번호로 변경이 필요합니다.");
        }
        if (tempNotice) tempNotice.style.display = "block";
        modal.style.display = "block";
    }

    // 3. 에러 발생 시 자동 열기 (비밀번호 변경 실패 시)
    if (window.passwordChangeError === true && modal) {
        modal.style.display = "block";
    }
});

// 모달 닫기 함수 (전역 스코프 유지)
function closePwModal() {
    const modal = document.getElementById("pwModal");
    if (modal) {
        modal.style.display = "none";
    }
}
