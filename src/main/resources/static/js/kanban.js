
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

    // ===== Type 선택 (값만 세팅) =====
    if (typeGroup && typeInput) {
        syncActiveFromHidden();

        typeGroup.addEventListener("click", (e) => {
            const btn = e.target.closest(".scope-btn");
            if (!btn) return;

            const value = btn.dataset.value;
            if (!value) return;

            typeInput.value = value;
            setActive(typeGroup, ".scope-btn", btn);

            // 여기서 모달 전환x
            // TEAM 전환은 "확인(submit) 후 scheduleId 받은 다음"에 처리
        });
    }



// ===== Submit: 확인 버튼 =====
if (taskForm) {
    taskForm.addEventListener("submit", async (e) => {
        const type = typeInput?.value || "PERSONAL";

        // TEAM이 아니면 기존 동작 유지(그냥 서버로 submit)
        if (type !== "TEAM") {
            closeTaskModal();
            return;
        }

        // TEAM이면 여기서부터 AJAX로 전환
        e.preventDefault();

        try {
            const fd = new FormData(taskForm);

            const res = await fetch("/schedule/createAjax", {
                method: "POST",
                body: fd
            });

            if (!res.ok) throw new Error("일정 생성 실패");
            const data = await res.json();
            const scheduleId = data.scheduleId;

            // scheduleId를 teamModal에 저장 (teamModal에 hidden input 필요)
            const scheduleInput = document.getElementById("teamScheduleId");
            if (scheduleInput) scheduleInput.value = scheduleId;

            closeTaskModal();
            openTeamModal();


            const users = await loadActiveUsers();
            renderUsers(users);


        } catch (err) {
            console.error(err);
            alert(err.message || "처리 중 오류가 발생했습니다.");
        }
    });
}

// ===== TEAM Invite Modal Submit =====
    const teamInviteForm = document.getElementById("teamInviteForm");

    async function loadActiveUsers() {
        const scheduleId = document.getElementById("teamScheduleId").value;

        const res = await fetch(`/schedule/active-users?scheduleId=${scheduleId}`);
        if (!res.ok) throw new Error("팀원 목록 조회 실패");

        return await res.json();
    }

    function renderUsers(users) {
        const box = document.getElementById("teamUserList");
        box.innerHTML = "";

        if (!users || users.length === 0) {
            box.innerHTML = `<div style="padding:12px;">표시할 팀원이 없습니다.</div>`;
            return;
        }

        users.forEach(u => {
            const row = document.createElement("label");
            row.className = "invite-row";
            row.innerHTML = `
              <div class="meta">
                <div class="name">${u.userName} <span class="sub">(${u.rankName || ""})</span></div>
                <div class="sub">${u.deptName || ""} · ${u.userEmail || ""}</div>
              </div>
              <input type="checkbox" name="userIds" value="${u.userId}">
            `;
            box.appendChild(row);
        });

        function updateInviteCount() {
            const countEl = document.getElementById("inviteCount");
            if (!countEl) return;

            const checkedCount = document.querySelectorAll(
                '#teamUserList input[name="userIds"]:checked'
            ).length;


            countEl.textContent = `[ ${checkedCount}명 ]`;
        }
        // 최초 0명 표시
        updateInviteCount();

        // 체크박스 변경 이벤트(이벤트 위임 방식)
        const teamUserList = document.getElementById("teamUserList");
        teamUserList?.addEventListener("change", (e) => {
            if (e.target && e.target.matches('input[name="userIds"]')) {
                updateInviteCount();
            }
        });
    }

    teamInviteForm?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const scheduleId = document.getElementById("teamScheduleId")?.value;
        if (!scheduleId) {
            alert("scheduleId가 없습니다.");
            return;
        }

        const userIds = [...document.querySelectorAll('#teamUserList input[name="userIds"]:checked')]
            .map(el => el.value);

        const params = new URLSearchParams();
        params.append("scheduleId", scheduleId);
        userIds.forEach(id => params.append("userIds", id));

        const res = await fetch("/schedule/inviteAjax", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params.toString()
        });

        if (!res.ok) {
            const txt = await res.text();
            console.error("inviteAjax failed:", res.status, txt);
            alert("팀 초대 저장 실패");
            return;
        }

        closeTeamModal();
        window.location.href = "/schedule/kanban";
    });
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