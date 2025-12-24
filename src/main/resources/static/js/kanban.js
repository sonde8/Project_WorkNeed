
document.addEventListener("DOMContentLoaded", () => {

    const addTaskBtns = document.querySelectorAll(".kanban-addTask");

    const statusInput = document.getElementById("status");

    const backdrop = document.getElementById("modal-backdrop");

    const taskModal = document.getElementById("taskModal");
    const taskPanel = document.getElementById("taskModal-panel");
    const taskForm = document.getElementById("taskForm");
    const cancelBtn = document.getElementById("cancelBtn");

    const teamModal = document.getElementById("teamModal");
    const teamPanel = document.getElementById("teamModal-panel");

    // Task modal controls
    const eventTypeGroup = document.getElementById("eventTypeGroup");
    const eventTypeInput = document.getElementById("eventType");

    const typeGroup = document.getElementById("typeGroup");
    const typeInput = document.getElementById("type");

    const fileInput = document.getElementById("file");
    const fileName = document.getElementById("fileName");
    // invite modal controls

    // ===== Helpers =====
    function lockScroll(lock) {
        document.body.style.overflow = lock ? "hidden" : "";
    }

    function isAnyModalOpen() {
        return (taskModal && !taskModal.hidden) || (teamModal && !teamModal.hidden);
    }

    function openBackdrop() {
        if (!backdrop) return;
        backdrop.hidden = false;
    }

    function closeBackdropIfNoModal() {
        if (!backdrop) return;
        if (!isAnyModalOpen()) backdrop.hidden = true;
    }

    function openTaskModal() {
        if (!taskModal) return;
        openBackdrop();
        taskModal.hidden = false;
        lockScroll(true);

        syncActiveFromHidden();
    }

    function closeTaskModal() {
        if (!taskModal) return;
        taskModal.hidden = true;
        closeBackdropIfNoModal();
        if (!isAnyModalOpen()) lockScroll(false);
    }

    function openTeamModal() {
        if (!teamModal) return;
        openBackdrop();
        teamModal.hidden = false;
        lockScroll(true);
    }

    function closeTeamModal() {
        if (!teamModal) return;
        teamModal.hidden = true;
        closeBackdropIfNoModal();
        if (!isAnyModalOpen()) lockScroll(false);
    }

    function closeAllModals() {
        closeTaskModal();
        closeTeamModal();
    }

    // 클릭한 버튼만 활성화 클래스 부여
    function setActive(groupEl, btnSelector, activeBtn) {
        if (!groupEl) return;
        const buttons = groupEl.querySelectorAll(btnSelector);
        buttons.forEach((b) => b.classList.remove("is-active"));
        activeBtn.classList.add("is-active");
    }

    // hidden input 값 기준으로 활성화 상태 맞추기 (페이지 로드/모달 오픈 시)
    function syncActiveFromHidden() {
        // eventType
        if (eventTypeGroup && eventTypeInput) {
            const v = eventTypeInput.value || "PROJECT";
            const btn = eventTypeGroup.querySelector(`.eventBtn[data-value="${v}"]`);
            if (btn) setActive(eventTypeGroup, ".eventBtn", btn);
        }

        // type
        if (typeGroup && typeInput) {
            const v = typeInput.value || "PERSONAL";
            const btn = typeGroup.querySelector(`.scope-btn[data-value="${v}"]`);
            if (btn) setActive(typeGroup, ".scope-btn", btn);
        }
    }

    // ===== Open: Add Task =====
    addTaskBtns.forEach((btn) => {
        btn.addEventListener("click", () => {

            const column = btn.closest(".kanban-todo, .kanban-doing, .kanban-done");

            // 2컬럼에 따라 status 값 세팅
            if (column.classList.contains("kanban-todo")) {
                statusInput.value = "TODO";
            } else if (column.classList.contains("kanban-doing")) {
                statusInput.value = "DOING";
            } else if (column.classList.contains("kanban-done")) {
                statusInput.value = "DONE";
            }

            //모달 열기
            openTaskModal();
        });
    });

    // ===== Close: Backdrop / ESC =====
    backdrop?.addEventListener("click", () => {
        // 어떤 모달이 열려 있든 다 닫기
        closeAllModals();
    });

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && isAnyModalOpen()) {
            closeAllModals();
        }
    });

    // ===== Close: X buttons (각 모달의 x-btn 처리) =====
    // taskModal의 X
    taskPanel?.querySelector(".x-btn")?.addEventListener("click", closeTaskModal);
    // teamModal의 X
    teamPanel?.querySelector(".x-btn")?.addEventListener("click", closeTeamModal);

    // ===== Close: Cancel =====
    cancelBtn?.addEventListener("click", closeTaskModal);

    // 패널 클릭 시 backdrop 닫힘 방지
    taskPanel?.addEventListener("click", (e) => e.stopPropagation());
    teamPanel?.addEventListener("click", (e) => e.stopPropagation());

    // ===== EventType 선택 =====
    if (eventTypeGroup && eventTypeInput) {
        // 모달 열기 전에도 기본값 표시 일관성 유지
        syncActiveFromHidden();

        eventTypeGroup.addEventListener("click", (e) => {
            const btn = e.target.closest(".eventBtn");
            if (!btn) return;

            const value = btn.dataset.value;
            if (!value) return;

            eventTypeInput.value = value;
            setActive(eventTypeGroup, ".eventBtn", btn);
        });
    }

    // ===== Type 선택 + TEAM이면 Invite Team 모달로 전환 =====
    if (typeGroup && typeInput) {
        syncActiveFromHidden();

        typeGroup.addEventListener("click", (e) => {
            const btn = e.target.closest(".scope-btn");
            if (!btn) return;

            const value = btn.dataset.value;
            if (!value) return;

            typeInput.value = value;
            setActive(typeGroup, ".scope-btn", btn);

            // TEAM이면 Invite Team 모달로 전환
            if (value === "TEAM") {
                closeTaskModal();
                openTeamModal();
            }
        });
    }

    // ===== File name =====
    if (fileInput && fileName) {
        fileInput.addEventListener("change", () => {
            fileName.textContent = fileInput.files?.[0]?.name || "";
        });
    }

    // ===== Submit: 확인 버튼 =====
    // - 폼 submit은 서버로 전송되어 저장됨
    // - 저장 후 컨트롤러가 kanban 페이지로 redirect/render 하면 카드에 반영됨
    if (taskForm) {
        taskForm.addEventListener("submit", (e) => {
            // 기본 HTML required 검증은 브라우저가 처리
            // 추가 검증이 필요하면 여기에서 e.preventDefault() 후 검사

            // UX상: 서버로 이동(페이지 리로드) 전 모달 닫기
            // (리다이렉트/렌더링이면 사실상 의미는 적지만 요청사항 반영)
            closeTaskModal();
        });
    }
});

//// 상세페이지 이동////
document.querySelectorAll(".kanban-card").forEach(card => {
    card.addEventListener("click", () => {
        const scheduleId = card.dataset.id;
        if (!scheduleId) return;

        window.location.href = `/schedule/task?scheduleId=${scheduleId}`;
    });
});

//// 카드 드래그 상태변경////
document.addEventListener("DOMContentLoaded", () => {

    let isDragging = false;
    const lists = document.querySelectorAll(".kanban-cards");

    lists.forEach((list) => {
        new Sortable(list, {
            group: "kanban",
            animation: 150,
            ghostClass: "drag-ghost",
            chosenClass: "drag-chosen",
            dragClass: "drag-dragging",

            onStart: () => {
                isDragging = true;
            },

            onEnd: async (evt) => {
                const scheduleId = evt.item.dataset.id;
                const newStatus = evt.to.dataset.status;
                const oldStatus = evt.from.dataset.status;

                // 같은 컬럼이면 서버 호출 x
                if (newStatus === oldStatus) return;

                // 롤백
                const oldIndex = evt.oldIndex;

                try {
                    const params = new URLSearchParams();
                    params.append("scheduleId", scheduleId);
                    params.append("status", newStatus);

                    const res = await fetch("/schedule/status", {
                        method: "POST",
                        headers: { "Content-Type": "application/x-www-form-urlencoded" },
                        body: params.toString()
                    });

                    if (!res.ok) throw new Error("status update failed");

                    console.log("saved", { scheduleId, newStatus });

                } catch (e) {
                    console.error(e);

                    // 실패하면 롤백 - 원래 컬럼(evt.from)으로 되돌리기
                    const children = Array.from(evt.from.children);
                    if (oldIndex >= children.length) {
                        evt.from.appendChild(evt.item);
                    } else {
                        evt.from.insertBefore(evt.item, children[oldIndex]);
                    }

                }
            }

        });
    });

});