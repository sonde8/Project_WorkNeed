

document.addEventListener("click", (e) => {

    // edit 클릭
    const editBtn = e.target.closest(".comment-edit-btn");
    if (editBtn) {
        const item = editBtn.closest(".comment-item");

        item.querySelector(".comment-view").style.display = "none";
        item.querySelector(".comment-edit-form").style.display = "block";
        item.querySelector(".comment-edit-textarea").focus();
        return;
    }

    // edit 취소 클릭
    const cancelBtn = e.target.closest(".comment-cancel-btn");
    if (cancelBtn) {
        const item = cancelBtn.closest(".comment-item");

        item.querySelector(".comment-edit-form").style.display = "none";
        item.querySelector(".comment-view").style.display = "block";
        return;
    }
});