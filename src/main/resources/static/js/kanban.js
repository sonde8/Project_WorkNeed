let isDragging = false;

document.addEventListener("DOMContentLoaded", () => {

    /* Elements */
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

    const startInput = document.getElementById("startAt");
    const endInput   = document.getElementById("endAt");

    /* ======================================================
     * [추가] 조직도 관련 상태 변수
     * ====================================================== */
    let selectedUsers = new Set(); // 선택된 사용자 ID를 중복 없이 저장
    let allUserData = [];          // 서버에서 가져온 전체 유저 데이터를 보관

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
        initTaskPickersOnce();
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
    * Flatpickr
    * ====================================================== */
    let startPicker, endPicker;

    function initTaskPickersOnce() {
        if (startPicker || endPicker) return;
        if (typeof flatpickr !== "function") return;
        if (!startInput || !endInput) return;

        const STEP_MIN = 30;

        startPicker = flatpickr(startInput, {
            disableMobile: true,
            enableTime: true,
            time_24hr: true,
            minuteIncrement: STEP_MIN,
            dateFormat: "Y-m-d\\TH:i",
            altInput: true,
            altFormat: "Y-m-d H:i",
            allowInput: false,
            onChange(selectedDates) {
                if (!selectedDates.length) return;
                const start = selectedDates[0];
                endPicker.set("minDate", start);
                const end = endPicker.selectedDates?.[0];
                if (end && end < start) {endPicker.setDate(start, true);}
            }
        });

        endPicker = flatpickr(endInput, {
            disableMobile: true,
            enableTime: true,
            time_24hr: true,
            minuteIncrement: STEP_MIN,
            dateFormat: "Y-m-d\\TH:i",
            altInput: true,
            altFormat: "Y-m-d H:i",
            allowInput: false,
            onChange(selectedDates) {
                if (!selectedDates.length) return;
                const end = selectedDates[0];
                const start = startPicker.selectedDates?.[0];
                if (start && end < start) {endPicker.setDate(start, true); }
            }
        });
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

        selectedUsers.clear();
        loadOrganizationTree(scheduleId);
    });

    /* ======================================================
     * [수정] 조직도 기반 TEAM Invite 로직
     * ====================================================== */

    async function loadOrganizationTree(scheduleId) {
        try {
            const users = await fetch(`/schedule/active-users?scheduleId=${scheduleId}`).then(r => r.json());
            allUserData = users;
            renderDeptTree(users);
            updateSelectedUI();
        } catch (err) {
            console.error("조직도 로딩 실패:", err);
        }
    }

    function renderDeptTree(users) {
        const container = document.getElementById("deptTreeContainer");
        if (!container) return;
        container.innerHTML = "";

        const deptMap = {};
        users.forEach(u => {
            if (!deptMap[u.deptName]) deptMap[u.deptName] = [];
            deptMap[u.deptName].push(u);
        });

        const treeUl = document.createElement("ul");
        treeUl.className = "dept-tree";

        for (const deptName in deptMap) {
            const deptLi = document.createElement("li");

            deptLi.innerHTML = `
                <div class="dept-header" style="display:flex; justify-content:space-between; align-items:center; cursor:pointer; padding:8px 0;">
                    <div class="dept-title-area" style="font-weight:bold;">
                        <span class="arrow">▶</span> ${deptName}
                    </div>
                    <button type="button" class="dept-select-all" data-dept="${deptName}" 
                            style="font-size:11px; padding:2px 6px; cursor:pointer; background:#eee; border:1px solid #ccc; border-radius:3px;">
                        전체 선택
                    </button>
                </div>
            `;

            const userUl = document.createElement("ul");
            userUl.className = "user-list hidden";
            userUl.style.paddingLeft = "20px";

            deptMap[deptName].forEach(user => {
                const userLi = document.createElement("li");
                userLi.className = "user-item";
                userLi.style.cursor = "pointer";
                userLi.style.padding = "5px";
                userLi.innerHTML = `<span>${user.userName} (${user.rankName || '사원'})</span>`;

                userLi.onclick = (e) => {
                    e.stopPropagation();
                    toggleUserSelection(user);
                };
                userUl.appendChild(userLi);
            });

            const deptHeader = deptLi.querySelector(".dept-header");
            deptHeader.onclick = (e) => {
                if (e.target.classList.contains('dept-select-all')) return;

                const arrow = deptLi.querySelector(".arrow");
                const isHidden = userUl.classList.toggle("hidden");
                arrow.textContent = isHidden ? "▶" : "▼";
            };

            const selectAllBtn = deptLi.querySelector(".dept-select-all");
            selectAllBtn.onclick = (e) => {
                e.stopPropagation();
                const targetDept = selectAllBtn.getAttribute('data-dept');
                const deptMembers = deptMap[targetDept];

                const allSelected = deptMembers.every(m => selectedUsers.has(m.userId));

                deptMembers.forEach(member => {
                    if (allSelected) {
                        selectedUsers.delete(member.userId);
                    } else {
                        selectedUsers.add(member.userId);
                    }
                });
                updateSelectedUI();
            };

            deptLi.appendChild(userUl);
            treeUl.appendChild(deptLi);
        }
        container.appendChild(treeUl);
    }

    /**
     * [이식 및 수정] 이름 검색 필터링 및 부서 자동 열기
     * [설명] 검색어가 포함된 유저가 한 명이라도 있는 부서를 자동으로 펼치고 표시합니다.
     */
    function filterUsers(keyword) {
        const trimmedKeyword = keyword.trim().toLowerCase();
        const userLists = document.querySelectorAll('.user-list');
        const userItems = document.querySelectorAll('.user-item');

        // 1. 검색어가 비어있는 경우: 모든 부서를 닫고 유저를 모두 표시
        if (trimmedKeyword === "") {
            userLists.forEach(list => {
                list.classList.add('hidden');
                const arrow = list.parentElement.querySelector('.arrow');
                if (arrow) arrow.innerText = '▶';
                list.parentElement.style.display = 'block';
            });
            userItems.forEach(item => {
                item.style.display = 'flex';
            });
            return;
        }

        // 2. 검색어가 있는 경우: 일치하는 유저 표시 및 부서 자동 열기
        userLists.forEach(list => {
            let hasVisibleUser = false;
            const itemsInGroup = list.querySelectorAll('.user-item');

            itemsInGroup.forEach(item => {
                const nameText = item.innerText.toLowerCase();

                if (nameText.includes(trimmedKeyword)) {
                    item.style.display = 'flex';
                    hasVisibleUser = true;
                } else {
                    item.style.display = 'none';
                }
            });

            const arrow = list.parentElement.querySelector('.arrow');

            if (hasVisibleUser) {
                list.classList.remove('hidden');
                if (arrow) arrow.innerText = '▼';
                list.parentElement.style.display = 'block';
            } else {
                list.classList.add('hidden');
                if (arrow) arrow.innerText = '▶';
                list.parentElement.style.display = 'none';
            }
        });
    }

    function toggleUserSelection(user) {
        if (selectedUsers.has(user.userId)) {
            selectedUsers.delete(user.userId);
        } else {
            selectedUsers.add(user.userId);
        }
        updateSelectedUI();
    }

    function updateSelectedUI() {
        const listContainer = document.getElementById("selectedUserList");
        const countEl = document.getElementById("selectedUsersCount");
        if (!listContainer || !countEl) return;

        listContainer.innerHTML = "";

        const selectedList = allUserData.filter(u => selectedUsers.has(u.userId));
        countEl.textContent = `선택된 대상 (${selectedList.length})`;

        if (selectedList.length === 0) {
            listContainer.innerHTML = '<p class="placeholder-text">대상을 선택해주세요.</p>';
            return;
        }

        selectedList.forEach(u => {
            const item = document.createElement("div");
            item.className = "selected-user-item";
            item.style.cssText = "display:flex; justify-content:space-between; align-items:center; background:#fff; padding:8px; margin-bottom:5px; border:1px solid #ddd; border-radius:4px;";
            item.innerHTML = `
                <div class="selected-info">
                    <strong>${u.userName}</strong> <span style="font-size:11px; color:#888; margin-left:5px;">${u.deptName}</span>
                </div>
                <button type="button" class="remove-btn" style="border:none; background:none; color:#ff5b5b; cursor:pointer; font-size:18px;">&times;</button>
            `;
            item.querySelector(".remove-btn").onclick = () => {
                selectedUsers.delete(u.userId);
                updateSelectedUI();
            };
            listContainer.appendChild(item);
        });
    }

    // [수정] 단순 리스트 필터링이 아닌 filterUsers 함수 호출로 변경
    const userSearchInput = document.getElementById("userSearchInput");
    userSearchInput?.addEventListener("input", (e) => {
        filterUsers(e.target.value);
    });

    teamInviteForm?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const scheduleId = document.getElementById("teamScheduleId").value;
        const userIds = Array.from(selectedUsers);

        if (userIds.length === 0) {
            alert("초대할 팀원을 한 명 이상 선택해주세요.");
            return;
        }

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
    function ensureDoneSelectCheckbox(cardEl, isDone) {
        if (!cardEl) return;

        let label = cardEl.querySelector("label.done-check");
        if (isDone) {
            if (!label) {
                label = document.createElement("label");
                label.className = "done-check";
                const chk = document.createElement("input");
                chk.type = "checkbox";
                chk.className = "done-select";
                label.addEventListener("click", (e) => e.stopPropagation());
                chk.addEventListener("click", (e) => e.stopPropagation());
                label.appendChild(chk);
                cardEl.insertBefore(label, cardEl.firstChild);
            } else {
                const chk = label.querySelector("input.done-select");
                if (chk) chk.checked = false;
            }
            return;
        }
        if (label) label.remove();
    }

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
                    ensureDoneSelectCheckbox(evt.item, evt.from.dataset.status === "DONE");
                    updateDoneDeleteUI();
                    return;
                }

                ensureDoneSelectCheckbox(evt.item, evt.to.dataset.status === "DONE");
                updateDoneDeleteUI();
            }
        });
    });

});