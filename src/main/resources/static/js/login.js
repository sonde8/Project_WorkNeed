document.addEventListener("DOMContentLoaded", () => {

    /* ===============================
       1. URL 파라미터 알림
    =============================== */
    const params = new URLSearchParams(window.location.search);

    if (params.get("signup") === "success") {
        alert("회원가입이 완료되었습니다.");
    }

    if (params.get("password") === "changed") {
        alert("비밀번호가 변경되었습니다. 다시 로그인해주세요.");
    }

    if (window.needApproval === true) {
        alert("관리자 인증 후 로그인이 가능합니다.");
    }

    /* ===============================
       2. 관리자 로그인 안내
    =============================== */
    window.adminLoginNotice = function () {
        alert("관리자는 별도의 관리자 로그인 페이지를 이용해주세요.");
        return false;
    };

    /* ===============================
       3. 아이디 / 비밀번호 찾기 모달 열기
    =============================== */
    const modal = document.getElementById("findAccountModal");
    const openLinks = document.querySelectorAll('a[href="#findAccountModal"]');

    openLinks.forEach(link => {
        link.addEventListener("click", (e) => {
            e.preventDefault();
            modal.style.display = "flex";

            // 클릭한 링크에 따라 탭 결정
            if (link.innerText.includes("비밀번호")) {
                switchTab(1);
            } else {
                switchTab(0);
            }
        });
    });

    /* ===============================
       4. 탭 전환
    =============================== */
    const tabs = modal.querySelectorAll(".modal-tabs span");
    const areas = modal.querySelectorAll(".modal-area");

    function switchTab(index) {
        tabs.forEach((tab, i) => {
            tab.classList.toggle("active", i === index);
        });

        areas.forEach((area, i) => {
            area.style.display = (i === index) ? "block" : "none";
        });

        // 결과 초기화
        modal.querySelectorAll(".result-box").forEach(box => {
            box.style.display = "none";
            box.innerHTML = "";
        });
    }

    tabs.forEach((tab, index) => {
        tab.addEventListener("click", () => switchTab(index));
    });

    /* ===============================
       5. 모달 외부 클릭 시 닫기
    =============================== */
    modal.addEventListener("click", (e) => {
        if (e.target === modal) {
            modal.style.display = "none";

            modal.querySelectorAll("input").forEach(i => i.value = "");
            modal.querySelectorAll(".result-box").forEach(b => {
                b.style.display = "none";
                b.innerHTML = "";
            });
        }
    });

    /* ===============================
       6. 아이디 찾기 (Fetch)
    =============================== */
    const modalBtns = modal.querySelectorAll(".modal-btn");

    const nameInput = modal.querySelectorAll(".modal-input")[0];
    const emailInput = modal.querySelectorAll(".modal-input")[1];
    const idResultBox = modal.querySelectorAll(".result-box")[0];

    modalBtns[0].addEventListener("click", () => {
        const name = nameInput.value.trim();
        const email = emailInput.value.trim();

        if (!name || !email) {
            alert("이름과 이메일을 모두 입력해주세요.");
            return;
        }

        modalBtns[0].disabled = true;
        modalBtns[0].innerText = "찾는 중...";

        const params = new URLSearchParams();
        params.append("userName", name);
        params.append("email", email);

        fetch("/api/mail/find-id", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params
        })
        .then(async res => {
            const text = await res.text();
            idResultBox.style.display = "block";

            if (res.ok) {
                idResultBox.innerHTML = `회원님의 아이디는 <b>${text}</b> 입니다.`;
            } else {
                idResultBox.innerHTML = text;
            }
        })
        .catch(() => alert("서버 통신 오류"))
        .finally(() => {
            modalBtns[0].disabled = false;
            modalBtns[0].innerText = "아이디 찾기";
        });
    });

    /* ===============================
       7. 비밀번호 찾기 (Fetch)
    =============================== */
    const pwIdInput = modal.querySelectorAll(".modal-input")[2];
    const pwEmailInput = modal.querySelectorAll(".modal-input")[3];
    const pwResultBox = modal.querySelectorAll(".result-box")[1];

    modalBtns[1].addEventListener("click", () => {
        const id = pwIdInput.value.trim();
        const email = pwEmailInput.value.trim();

        if (!id || !email) {
            alert("아이디와 이메일을 모두 입력해주세요.");
            return;
        }

        modalBtns[1].disabled = true;
        modalBtns[1].innerText = "발송 중...";

        const params = new URLSearchParams();
        params.append("loginId", id);
        params.append("email", email);

        fetch("/api/mail/find-pw", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params
        })
        .then(async res => {
            const msg = await res.text();
            pwResultBox.style.display = "block";
            pwResultBox.innerHTML = msg;
        })
        .catch(() => alert("서버 통신 오류"))
        .finally(() => {
            modalBtns[1].disabled = false;
            modalBtns[1].innerText = "비밀번호 찾기";
        });
    });

});

    /* ===============================
       8. 비밀번호 보기 (눈 아이콘)
    =============================== */
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

