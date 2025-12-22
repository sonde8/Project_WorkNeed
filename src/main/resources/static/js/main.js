document.addEventListener("DOMContentLoaded", () => {

    // 비밀번호 변경 버튼 → 모달 열기
    const openBtn = document.getElementById("openPwModal");
    const modal = document.getElementById("pwModal");

    if (openBtn && modal) {
        openBtn.addEventListener("click", () => {
            modal.style.display = "block";
        });
    }

    // 서버 에러 발생 시 모달 자동 오픈
    if (window.passwordChangeError && modal) {
        modal.style.display = "block";
    }
});
