document.addEventListener("DOMContentLoaded", () => {
    // DOM 로딩 제어는 브라우저 영역
    // DOM HTML 태그들이 전부 만들어진 뒤에 실행된다.

    //url기반 알림전용
    const params = new URLSearchParams(window.location.search);

    if (params.get("signup") === "success") {
        alert("회원가입이 완료되었습니다.");
    }

    if (params.get("password") === "changed") {
        alert("비밀번호가 변경되었습니다. 다시 로그인해주세요.");
    }

    //비밀번호 변경 모달 제어
    const openBtn = document.getElementById("openPwModal");
    const modal = document.getElementById("pwModal");

    if (openBtn && modal) {
        openBtn.addEventListener("click", () => {
            modal.style.display = "block";
        });
    }

    // 서버에서 에러 내려온 경우 (Thymeleaf 렌더링 후)
    if (modal && modal.querySelector("p")) {
        modal.style.display = "block";
    }

    const adminBtn = document.getElementById("adminLoginBtn");

        if (adminBtn) {
            adminBtn.addEventListener("click", (e) => {
                alert("관리자는 별도의 계정으로 로그인합니다.");
            });
        }
});


