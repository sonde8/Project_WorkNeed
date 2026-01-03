let isDragging = false;

document.addEventListener("DOMContentLoaded", () => {

    /*  Elements */
    const addTaskBtns = document.querySelectorAll(".kanban-addTask");
    const statusInput = document.getElementById("status");

    const backdrop = document.getElementById("modal-backdrop");

    const taskModal = document.getElementById("taskModal");
    const taskPanel = document.getElementById("taskModal-panel");
    const taskForm = document.getElementById("taskForm");
    const cancelBtn = document.getElementById("cancelBtn");

    const teamModal = document.getElementById("teamModal");
    const teamPanel = document.getElementById("teamModal-panel");
    const teamInviteForm = document.getElementById("teamInviteForm");

    const eventTypeGroup = document.getElementById("eventTypeGroup");
    const eventTypeInput = document.getElementById("eventType");

    const typeGroup = document.getElementById("typeGroup");
    const typeInput = document.getElementById("type");

    /* ======================================================
     * Helpers
     * ====================================================== */
    function lockScroll(lock) {
        document.body.style.overflow = lock ? "hidden" : "";
    }

    function isAnyModalOpen() {
        return (taskModal && !taskModal.hidden) || (teamModal && !teamModal.hidden);
    }

    function openBackdrop() {
        if (backdrop) backdrop.hidden = false;
    }

    function closeBackdropIfNoModal() {
        if (backdrop && !isAnyModalOpen()) backdrop.hidden = true;
    }

    function openTaskModal() {
        openBackdrop();
        taskModal.hidden = false;
        lockScroll(true);
        syncActiveFromHidden();
    }

    function closeTaskModal() {
        taskModal.hidden = true;
        closeBackdropIfNoModal();
        if (!isAnyModalOpen()) lockScroll(false);
    }

    function openTeamModal() {
        openBackdrop();
        teamModal.hidden = false;
        lockScroll(true);
    }

    function closeTeamModal() {
        teamModal.hidden = true;
        closeBackdropIfNoModal();
        if (!isAnyModalOpen()) lockScroll(false);
    }

    function closeAllModals() {
        closeTaskModal();
        closeTeamModal();
    }

    function setActive(groupEl, selector, activeBtn) {
        groupEl.querySelectorAll(selector).forEach(b => b.classList.remove("is-active"));
        activeBtn.classList.add("is-active");
    }

    function syncActiveFromHidden() {
        if (eventTypeGroup && eventTypeInput) {
            const v = eventTypeInput.value || "PROJECT";
            const btn = eventTypeGroup.querySelector(`.eventBtn[data-value="${v}"]`);
            if (btn) setActive(eventTypeGroup, ".eventBtn", btn);
        }

        if (typeGroup && typeInput) {
            const v = typeInput.value || "PERSONAL";
            const btn = typeGroup.querySelector(`.scope-btn[data-value="${v}"]`);
            if (btn) setActive(typeGroup, ".scope-btn", btn);
        }
    }

    /* ======================================================
     * Add Task
     * ====================================================== */
    addTaskBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const column = btn.closest(".kanban-todo, .kanban-doing, .kanban-done");
            if (column.classList.contains("kanban-todo")) statusInput.value = "TODO";
            if (column.classList.contains("kanban-doing")) statusInput.value = "DOING";
            if (column.classList.contains("kanban-done")) statusInput.value = "DONE";
            openTaskModal();
        });
    });

    /* Modal Close */
    backdrop?.addEventListener("click", closeAllModals);

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && isAnyModalOpen()) closeAllModals();
    });

    taskPanel?.querySelector(".x-btn")?.addEventListener("click", closeTaskModal);
    teamPanel?.querySelector(".x-btn")?.addEventListener("click", closeTeamModal);
    cancelBtn?.addEventListener("click", closeTaskModal);

    taskPanel?.addEventListener("click", e => e.stopPropagation());
    teamPanel?.addEventListener("click", e => e.stopPropagation());

    /* EventType / Type 선택 */
    eventTypeGroup?.addEventListener("click", e => {
        const btn = e.target.closest(".eventBtn");
        if (!btn) return;
        eventTypeInput.value = btn.dataset.value;
        setActive(eventTypeGroup, ".eventBtn", btn);
    });

    typeGroup?.addEventListener("click", e => {
        const btn = e.target.closest(".scope-btn");
        if (!btn) return;
        typeInput.value = btn.dataset.value;
        setActive(typeGroup, ".scope-btn", btn);
    });

    /* Task 생성 */
    taskForm?.addEventListener("submit", async (e) => {
        const type = typeInput?.value || "PERSONAL";
        if (type !== "TEAM") {
            closeTaskModal();
            return;
        }

        e.preventDefault();

        const fd = new FormData(taskForm);
        const res = await fetch("/schedule/createAjax", { method: "POST", body: fd });
        if (!res.ok) return alert("일정 생성 실패");

        const { scheduleId } = await res.json();
        document.getElementById("teamScheduleId").value = scheduleId;

        closeTaskModal();
        openTeamModal();

        const users = await fetch(`/schedule/active-users?scheduleId=${scheduleId}`).then(r => r.json());
        renderUsers(users);
    });

    /* ======================================================
     * TEAM Invite
     * ====================================================== */
    function renderUsers(users) {
        const box = document.getElementById("teamUserList");
        const countEl = document.getElementById("inviteCount");
        if (!box) return;

        box.innerHTML = "";

        if (!users || users.length === 0) {
            box.innerHTML = `<div style="padding:12px;">표시할 팀원이 없습니다.</div>`;
            if (countEl) countEl.textContent = `[ 0명 ]`;
            return;
        }

        users.forEach(u => {
            const label = document.createElement("label");
            label.className = "invite-row";
            label.innerHTML = `
            <div class="meta">
              <div class="name">${u.userName} <span class="sub">(${u.rankName || ""})</span></div>
              <div class="sub">${u.deptName || ""} · ${u.userEmail || ""}</div>
            </div>
            <input type="checkbox" name="userIds" value="${u.userId}">
            `;
            box.appendChild(label);
        });

        function updateInviteCount() {
            if (!countEl) return;
            const checkedCount = box.querySelectorAll('input[name="userIds"]:checked').length;
            countEl.textContent = `[ ${checkedCount}명 ]`;
        }
        // 초기 0명
        updateInviteCount();

        if (!box.dataset.inviteCountBound) {
            box.addEventListener("change", (e) => {
                if (e.target && e.target.matches('input[name="userIds"]')) {
                    updateInviteCount();
                }
            });
            box.dataset.inviteCountBound = "1";
        }

    }

    teamInviteForm?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const scheduleId = document.getElementById("teamScheduleId").value;
        const userIds = [...document.querySelectorAll('input[name="userIds"]:checked')]
            .map(el => el.value);

        const params = new URLSearchParams({ scheduleId });
        userIds.forEach(id => params.append("userIds", id));

        await fetch("/schedule/inviteAjax", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: params.toString()
        });

        closeTeamModal();
        location.href = "/schedule/kanban";
    });

    /* ======================================================
     * 클릭 → 상세페이지
     * ====================================================== */
    document.querySelectorAll(".kanban-card").forEach(card => {
        card.addEventListener("click", (e) => {
            if (isDragging) return;
            if (e.target.closest(".done-check")) return;
            if (e.target.closest("input, label, button, a, textarea, select")) return;

            location.href = `/schedule/task?scheduleId=${card.dataset.id}`;
        });
    });

    /* ======================================================
     * Done delete
     * ====================================================== */

    function updateDoneDeleteUI() {
        const checked = document.querySelectorAll(".kanban-done .done-select:checked").length;
        const countEl = document.getElementById("doneSelectedCount");
        const btn = document.querySelector(".kanban-done .done-delete-btn");

        if (countEl) countEl.textContent = `[${checked}]`;
        if (btn) btn.disabled = checked === 0;
    }

    document.addEventListener("change", (e) => {
        if (e.target.matches(".kanban-done .done-select")) {
            updateDoneDeleteUI();
        }
    });

    // 초기 0
    updateDoneDeleteUI();

    document.addEventListener("click", async (e) => {
        const btn = e.target.closest(".kanban-done .done-delete-btn");
        if (!btn) return;

        const ids = [...document.querySelectorAll(".kanban-done .done-select:checked")]
            .map(chk => chk.closest(".kanban-card")?.dataset?.id)
            .filter(Boolean);

        if (ids.length === 0) return;

        if (!confirm(`선택한 ${ids.length}개를 삭제 하시겠습니까?`)) return;

        try {
            const res = await fetch("/schedule/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ scheduleIds: ids })
            });

            const data = await res.json();
            if (!res.ok || data.ok !== true) {
                throw new Error(data.message || "삭제 실패");
            }

            // 성공한 id만 화면에서 제거
            (data.deletedIds || ids).forEach(id => {
                document.querySelector(`.kanban-card[data-id="${id}"]`)?.remove();
            });

            updateDoneDeleteUI();

        } catch (err) {
            console.error(err);
            alert(err.message || "삭제 중 오류가 발생했습니다.");
        }
    });

    /* ======================================================
     * Drag & Drop
     * ====================================================== */
    document.querySelectorAll(".kanban-cards").forEach(list => {
        new Sortable(list, {
            group: "kanban",
            animation: 300,

            onStart() {
                isDragging = true;
            },

            onMove(evt) {
                if (evt.from.dataset.status === "DONE" && evt.to.dataset.status !== "DONE") {
                    return false;
                }
                return true;
            },

            async onEnd(evt) {
                setTimeout(() => isDragging = false, 0);

                if (evt.from.dataset.status === evt.to.dataset.status) return;

                const params = new URLSearchParams({
                    scheduleId: evt.item.dataset.id,
                    status: evt.to.dataset.status
                });

                const res = await fetch("/schedule/status", {
                    method: "POST",
                    headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: params.toString()
                });

                if (!res.ok) {
                    evt.from.insertBefore(evt.item, evt.from.children[evt.oldIndex] || null);
                }
            }
        });
    });

});
