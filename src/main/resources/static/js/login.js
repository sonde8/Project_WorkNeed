document.addEventListener("DOMContentLoaded", () => {

    /* 1. URL 파라미터 알림 (기존 로직 유지) */
    const params = new URLSearchParams(window.location.search);
    if (params.get("signup") === "success") alert("회원가입이 완료되었습니다.");
    if (params.get("password") === "changed") alert("비밀번호가 변경되었습니다. 다시 로그인해주세요.");
    if (window.needApproval === true) alert("관리자 인증 후 로그인이 가능합니다.");

    /* 2. 관리자 로그인 안내 (기존 로직 유지) */
    window.adminLoginNotice = function () {
        alert("관리자는 별도의 관리자 로그인 페이지를 이용해주세요.");
        return false;
    };

    /* 3. 섹션 전환 함수 (핵심 기능) */
    window.showSection = function(sectionId) {
        document.querySelectorAll('.auth-section').forEach(section => {
            section.style.display = 'none';
        });
        const target = document.getElementById(sectionId);
        if (target) target.style.display = 'block';

        // 전환 시 결과 박스 초기화 (기존 로직 반영)
        document.querySelectorAll(".result-box").forEach(box => {
            box.style.display = "none";
            box.innerHTML = "";
        });
        document.querySelectorAll("input").forEach(i => {
            if(i.type !== 'hidden') i.value = "";
        });
    };

    /* 4. 아이디 찾기 */
    const idBtn = document.querySelector("#findIdSection .modal-btn");
    const idResultBox = document.getElementById("idResult");

    idBtn.addEventListener("click", () => {
        //  userID로 매칭
        const name = document.getElementById("findIdName").value.trim();
        const email = document.getElementById("findIdEmail").value.trim();

        if (!name || !email) return alert("이름과 이메일을 입력해주세요.");

        idBtn.disabled = true;
        idBtn.innerText = "조회 중...";

        fetch("/api/mail/find-id", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ userName: name, email: email })
        })
        .then(async res => {
            const text = await res.text();
            idResultBox.style.display = "block";
            idResultBox.style.color = res.ok ? "#16a34a" : "#ef4444";
            idResultBox.innerHTML = res.ok ? `아이디: <b>${text}</b>` : "정보가 일치하지 않습니다.";
        })
        .finally(() => {
            idBtn.disabled = false;
            idBtn.innerText = "아이디 찾기";
        });
    });

    /* 5. 비밀번호 찾기 */
    const pwBtn = document.querySelector("#findPwSection .modal-btn");
    const pwResultBox = document.getElementById("pwResult");

    pwBtn.addEventListener("click", (e) => {
        e.preventDefault();
        const id = document.getElementById("findPwId").value.trim();
        const email = document.getElementById("findPwEmail").value.trim();

        if (!id || !email) return alert("아이디와 이메일을 입력해주세요.");

        pwBtn.disabled = true;
        pwBtn.innerText = "메일 발송 중...";

        fetch("/api/mail/find-pw", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({ loginId: id, email: email })
        })
        .then(async res => {
            const msg = await res.text();
            pwResultBox.style.display = "block";
            pwResultBox.style.color = res.ok ? "#16a34a" : "#ef4444";
            pwResultBox.innerHTML = msg;
        })
        .finally(() => {
            pwBtn.disabled = false;
            pwBtn.innerText = "비밀번호 찾기";
        });
    });

    /* 6. 비밀번호 보기 눈 아이콘  */
    document.querySelectorAll(".toggle-password").forEach(icon => {
        icon.addEventListener("click", () => {
            const targetId = icon.getAttribute("data-target");
            const input = document.getElementById(targetId);
            if (!input) return;

            if (input.type === "password") {
                input.type = "text";
                icon.classList.remove("fa-eye");
                icon.classList.add("fa-eye-slash");
            } else {
                input.type = "password";
                icon.classList.remove("fa-eye-slash");
                icon.classList.add("fa-eye");
            }
        });
    });
});