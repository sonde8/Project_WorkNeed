document.addEventListener("DOMContentLoaded", () => {

    const logoutBtn = document.getElementById("logoutBtn");

    if (!logoutBtn) return;

    logoutBtn.addEventListener("click", () => {
        fetch("/logout", {
            method: "POST"
        })
        .then(res => res.json())
        .then(data => {
            if (data.success) {
                alert("로그아웃 되었습니다.");
                location.href = "/main";
            }
        })
        .catch(() => {
            alert("로그아웃 처리 중 오류가 발생했습니다.");
        });
    });

     // 비밀번호 못맞추면 모달창띄움
    /*<![CDATA[*/
    if ([[${passwordChangeError != null}]]) {
        document.getElementById('pwModal').style.display = 'block';
    }
    /*]]>*/



});
