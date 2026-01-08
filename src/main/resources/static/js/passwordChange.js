document.addEventListener("DOMContentLoaded", () => {
    const pwForm = document.getElementById("pwForm");
    const newPwInput = document.getElementById("newPassword");
    const confirmPwInput = document.getElementById("confirmPassword");
    const pwMsg = document.getElementById("passwordMatchMsg");

    function checkPasswordMatch() {
        const newPw = newPwInput.value;
        const confirmPw = confirmPwInput.value;
        if (!newPw || !confirmPw) { pwMsg.textContent = ""; return; }

        if (newPw === confirmPw) {
            pwMsg.textContent = " ✅ 비밀번호가 일치합니다.";
            pwMsg.style.color = "#2ecc71";
        } else {
            pwMsg.textContent = " ❌ 비밀번호가 일치하지 않습니다.";
            pwMsg.style.color = "#e74c3c";
        }
    }

    if (newPwInput && confirmPwInput) {
        newPwInput.addEventListener("input", checkPasswordMatch);
        confirmPwInput.addEventListener("input", checkPasswordMatch);
    }

    if (pwForm) {
        pwForm.addEventListener("submit", (e) => {
            const currentPw = document.getElementsByName("currentPassword")[0].value;
            const newPw = newPwInput.value; // 기존 오타 수정
            const confirmPw = confirmPwInput.value;

            const pwRegex = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[$!%*#?&])[A-Za-z\d$!%*#?&]{8,}$/;

            // 1. 형식 체크
            if (!pwRegex.test(newPw)) {
                e.preventDefault();
                alert("비밀번호는 영문, 숫자, 특수문자 포함 8자 이상이어야 합니다.");
                return;
            }
            // 2. 일치 체크
            if (newPw !== confirmPw) {
                e.preventDefault();
                alert("새 비밀번호가 일치하지 않습니다.");
                return;
            }
            // 3. 이전 비번과 동일 체크 (JS에서 1차 차단)
            if (currentPw === newPw) {
                e.preventDefault();
                alert("현재 비밀번호와 동일한 비밀번호로 변경할 수 없습니다.");
                return;
            }
        });
    }
});