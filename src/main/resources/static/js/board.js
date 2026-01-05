document.addEventListener("DOMContentLoaded", () => {
    loadPosts();
    loadCategories();

    document.getElementById("boardWriteBtn")
        .addEventListener("click", () => openModal("write"));

    document.getElementById("writeSubmitBtn")
        .addEventListener("click", submitPost);

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
    fetch(`/api/board/posts/${postId}`)
        .then(res => res.json())
        .then(p => {
            // 제목: 목록과 동일한 포맷 사용
            document.getElementById("detailTitle").textContent =
                headerText || (p.categoryName ? `[${p.categoryName}] ${p.title}` : p.title);

            // 작성자 / 시간 / 내용
            document.getElementById("detailWriter").textContent = p.userName || "-";
            document.getElementById("detailDate").textContent =
                p.createAt ? String(p.createAt).replace("T", " ") : "-";
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

/*  작성  */
function submitPost() {
    const data = {
        categoryId: document.getElementById("writeCategory").value,
        title: document.getElementById("writeTitle").value,
        content: document.getElementById("writeContent").value,
    };

    fetch("/api/board/posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
    }).then(res => {
        if (res.ok) {
            closeModal("write");
            loadPosts();
        } else {
            alert("등록 실패");
        }
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