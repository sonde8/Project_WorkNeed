
let currentDetailPostId = null;

document.addEventListener("DOMContentLoaded", () => {
    loadPosts();
    loadCategories();

    document.getElementById("boardWriteBtn")
        .addEventListener("click", () => {
            resetWriteForm();
            openModal("write")
        });

    document.getElementById("writeSubmitBtn")
        .addEventListener("click", submitPost);

    const delBtn = document.getElementById("detailDeleteBtn");
    if (delBtn) delBtn.addEventListener("click", deletePost);


    document.querySelectorAll(".modal-close").forEach(btn => {
        btn.addEventListener("click", () => closeModal(btn.dataset.close));
    });
});

/*  목록  */
function loadPosts() {
    fetch("/api/board/posts")
        .then(res => res.json())
        .then(list => {
            const ul = document.getElementById("boardList");
            ul.innerHTML = "";

            if (!list || list.length === 0) {
                const empty = document.createElement("li");
                empty.className = "board-empty";
                empty.textContent = "게시글이 없습니다.";
                ul.appendChild(empty);
                return;
            }


            list.forEach(p => {
                const li = document.createElement("li");
                li.className = "board-item";

                const headerText = `[${p.categoryName}] ${p.title}`;
                li.textContent = headerText;

                li.addEventListener("click", () => openDetail(p.postId, headerText));
                ul.appendChild(li);
            });
        });
}

/*  상세  */
function openDetail(postId,headerText) {

    currentDetailPostId = postId;

    fetch(`/api/board/posts/${postId}`)
        .then(res => res.json())
        .then(p => {

            //삭제버튼
            const delBtn = document.getElementById("detailDeleteBtn");
            if (delBtn) {
                const loginId = window.LOGIN_USER_ID;
                const writerId = p.writerId;
                const isOwner = loginId != null && writerId != null && Number(loginId) === Number(writerId);

                delBtn.style.display = (isOwner || window.IS_ADMIN) ? "inline-block" : "none";
            }

            // 제목
            document.getElementById("detailTitle").textContent =
                headerText || (p.categoryName ? `[${p.categoryName}] ${p.title}` : (p.title || ""));

            // 작성자 / 시간 / 내용
            document.getElementById("detailWriter").textContent = p.userName || "";
            document.getElementById("detailDate").textContent =
                p.createAt ? String(p.createAt).replace("T", " ") : "";
            document.getElementById("detailContent").textContent = p.content || "";

            openModal("detail");
        });
}

/*  카테고리  */
function loadCategories() {
    fetch("/api/board/categories")
        .then(res => res.json())
        .then(list => {
            const sel = document.getElementById("writeCategory");
            sel.innerHTML = "";

            list.forEach(c => {
                const opt = document.createElement("option");
                opt.value = c.categoryId;
                opt.textContent = c.categoryName;
                sel.appendChild(opt);
            });
        });
}

/*  초기화 */
function resetWriteForm() {
    document.getElementById("writeTitle").value = "";
    document.getElementById("writeContent").value = "";
}

/*  작성  */
function submitPost() {
    const data = {
        categoryId: document.getElementById("writeCategory").value,
        title: document.getElementById("writeTitle").value,
        content: document.getElementById("writeContent").value,
    };

    fetch("/api/board/posts", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    }).then(res => {
        if (res.ok) {
            resetWriteForm();
            closeModal("write");
            loadPosts();
        } else {
            alert("등록 실패");
        }
    });
}

/*  삭제 */
function deletePost() {
    if (!currentDetailPostId) return;

    if (!confirm("삭제할까요?")) return;

    fetch(`/api/board/posts/${currentDetailPostId}`, {
        method: "DELETE",
        credentials: "same-origin"
    }).then(res => {
        if (res.status === 204 || res.ok) {
            closeModal("detail");
            loadPosts();
            currentDetailPostId = null;
            return;
        }
        if (res.status === 403) {
            alert("삭제 권한이 없습니다.");
            return;
        }
        alert("삭제 실패");
    });
}


/*  모달  */
function openModal(type) {
    document.getElementById(
        type === "detail" ? "boardDetailModal" : "boardWriteModal"
    ).style.display = "flex";
}

function closeModal(type) {
    document.getElementById(
        type === "detail" ? "boardDetailModal" : "boardWriteModal"
    ).style.display = "none";
}

// 1. ESC 키 누르면 모달이 닫히는 로직
document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
        closeModal("detail");
        closeModal("write");
    }
});

// 2. 배경을 클릭하면 모달이 닫힘
window.addEventListener("click", (e) => {
    const detailModal = document.getElementById("boardDetailModal");
    const writeModal = document.getElementById("boardWriteModal");

    if (e.target === detailModal) {
        closeModal("detail");
    }
    if (e.target === writeModal) {
        closeModal("write");
    }
});