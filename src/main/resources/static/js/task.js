
// comment
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

// etc-edit
document.addEventListener("DOMContentLoaded", () => {
    const blocks = Array.from(document.querySelectorAll(".etc-block"));

    const closeAll = () => {
        blocks.forEach((b) => b.classList.remove("is-editing"));
    };

    const normalizeOriginal = (val) => {
        // data-original이 없거나 "null"로 들어오는 케이스 방어
        if (val == null || val === "null" || val === "undefined") return "";
        return val;
    };

    // 이벤트 위임: etc-block 영역에서 발생하는 클릭/submit을 한 번에 처리
    document.addEventListener("click", (e) => {
        const editBtn = e.target.closest(".btn-etc-edit");
        const cancelBtn = e.target.closest(".btn-etc-cancel");

        // Edit 클릭
        if (editBtn) {
            const block = editBtn.closest(".etc-block");
            if (!block) return;

            // 한 번에 하나만 열기
            closeAll();
            block.classList.add("is-editing");

            // input 포커스
            const input = block.querySelector(".etc-edit input[type='text']");
            if (input) {
                input.focus();
            }
            return;
        }

        // Cancel 클릭
        if (cancelBtn) {
            const block = cancelBtn.closest(".etc-block");
            if (!block) return;

            const input = block.querySelector(".etc-edit input[type='text']");
            if (input) {
                const original = normalizeOriginal(input.dataset.original);
                input.value = original;
            }
            block.classList.remove("is-editing");
            return;
        }
    });

    // Delete confirm: delete form submit 가로채기
    document.addEventListener("submit", (e) => {
        const deleteForm = e.target.closest(".etc-delete-form");
        if (!deleteForm) return; // delete폼만 처리

        const ok = confirm("정말 삭제하시겠습니까?");
        if (!ok) e.preventDefault();
    });
});





//send message modal
document.addEventListener("DOMContentLoaded", () => {

    const modal = document.getElementById("sendMessageModal");
    if (!modal) return;

    const modalPanel = document.getElementById("sendMessageModal-panel");
    const ownerBox = modal.querySelector(".owner");
    const memberBox = modal.querySelector(".member");

    const closeBtn = modal.querySelector(".x-btn");
    const startChatBtn = modal.querySelector("#btn-start-chat");

    // 모달 열기/닫기
    function openModal(scheduleId) {
        modal.classList.add("is-open");
        modal.dataset.scheduleId = scheduleId || "";

        // 초기 상태(로딩)
        if (ownerBox) ownerBox.innerHTML = `<div class="loading">불러오는 중...</div>`;
        if (memberBox) memberBox.innerHTML = ``;
        if (startChatBtn) startChatBtn.disabled = true;
    }

    function closeModal() {
        modal.classList.remove("is-open");

        // 내용 초기화
        if (ownerBox) ownerBox.innerHTML = "";
        if (memberBox) memberBox.innerHTML = "";
        if (startChatBtn) {
            startChatBtn.disabled = true;
            startChatBtn.dataset.ownerId = "";
            startChatBtn.dataset.memberIds = "";
        }
        modal.dataset.scheduleId = "";
    }

    closeBtn?.addEventListener("click", closeModal);

    // ESC 키로 모달 닫기
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && modal.classList.contains("is-open")) {
            closeModal();
        }
    });

    // 배경 클릭 시 닫기 (이벤트 전파 방지 적용)
    modal.addEventListener("mousedown", (e) => {
        // e.target이 modal 본체가 아닌 '배경'일 때만 닫기
        if (e.target === modal) {
            closeModal();
        }
    });

    //렌더링 함수(Owner / Members)
    function renderOwner(owner) {
        if (!ownerBox) return;

        ownerBox.innerHTML = `
      <div class="owner-row">
        <span class="badge badge-owner"></span>
        <!--임시 이미지-->
        <span class="owner-img"><img src="/images/person300.svg"> </span>
        <span class="name">${owner.userName ?? ""}</span>
        <span class="dept">${owner.deptName ? `[${owner.deptName}]` : ""}</span>
      </div>
    `;
    }

    function renderMembers(members) {
        if (!memberBox) return;

        if (!members || members.length === 0) {
            memberBox.innerHTML = `<div class="member-empty">참여 멤버가 없습니다.</div>`;
            return;
        }

        const items = members
            .map(m => {
                const name = m.userName ?? "";
                const dept = m.deptName ? `[${m.deptName}]` : "";
                return `<li class="member-item" data-user-id="${m.userId}">${name} ${dept}</li>`;
            })
            .join("");

        memberBox.innerHTML = `
          <div class="member-title"></div>
          <ul class="member-list">${items}</ul>
        `;
    }

    // API 호출
    async function fetchParticipants(scheduleId) {
        const res = await fetch(`/schedule/${scheduleId}/participants`, {
            method: "GET",
            headers: { "Accept": "application/json" },
        });

        if (!res.ok) {
            throw new Error(`participants API failed: ${res.status}`);
        }
        return res.json();
        }

    // 5) 사람 아이콘 버튼 클릭 → 모달 오픈 + 데이터 로드 + 렌더
    document.addEventListener("click", async (e) => {
        const btn = e.target.closest(".btn-send-message-modal");
        if (!btn) return;

        const scheduleId = btn.dataset.scheduleId;
        if (!scheduleId) return;

        openModal(scheduleId);

        try {
            const data = await fetchParticipants(scheduleId);

            renderOwner(data.owner);
            renderMembers(data.members);

            // Start Chat 버튼 활성화 + payload 저장
            if (startChatBtn) {
                startChatBtn.disabled = false;
                startChatBtn.dataset.ownerId = data.owner?.userId ?? "";
                startChatBtn.dataset.memberIds = (data.members ?? [])
                    .map(m => m.userId)
                    .join(",");
            }
        } catch (err) {
            console.error(err);
            if (ownerBox) ownerBox.innerHTML = `<div class="error">참여자 정보를 불러오지 못했습니다.</div>`;
            if (memberBox) memberBox.innerHTML = ``;
        }
    });

    // 6) Start Chat 클릭 → “방 생성”에 보낼 payload 준비
    startChatBtn?.addEventListener("click", () => {
        const ownerId = startChatBtn.dataset.ownerId; // 소유자 ID
        const memberIds = startChatBtn.dataset.memberIds ? startChatBtn.dataset.memberIds.split(",") : [];
        // 방 제목을 넘겨받기 위한 변수 선언
        const titleElement = document.querySelector("#detail .title");
        const taskTitle = titleElement ? titleElement.innerText.trim() : "새 채팅방";

        // 1. 모든 관련 인원을 합침
        const allParticipants = [ownerId, ...memberIds].filter(Boolean);

        // 2. 중요: '나(현재 로그인 유저)'를 제외한 인원만 추출
        // ※ currentUserId가 선언되어 있어야 합니다 (예: 전역변수나 jsp에서 할당)
        const inviteList = allParticipants.filter(id => Number(id) !== Number(currentUserId));

        // 3. 중복 제거 후 채팅 페이지로 이동 (파라미터 전달)
        const uniqueInvites = [...new Set(inviteList)];
        window.location.href = `/chat/rooms?invite=${uniqueInvites.join(",")}&roomName=${encodeURIComponent(taskTitle)}`;
    });

});



document.addEventListener("DOMContentLoaded", () => {


    let scheduleProgressChart = null;

    // 공통
    function escapeHtml(str) {
        return String(str)
            .replaceAll("&", "&amp;")
            .replaceAll("<", "&lt;")
            .replaceAll(">", "&gt;")
            .replaceAll('"', "&quot;")
            .replaceAll("'", "&#039;");
    }

    // Modal1: member performance
    const perfModal = document.getElementById("memberPerformanceModal");
    if (!perfModal) return;

    const listBox = perfModal.querySelector("#performanceList");
    const closeBtn = perfModal.querySelector(".x-btn");

    function openPerformanceModal(scheduleId) {
        perfModal.classList.add("is-open");
        perfModal.dataset.scheduleId = scheduleId || "";
        if (listBox) listBox.innerHTML = `<div class="loading">불러오는 중...</div>`;
        loadPerformanceData(scheduleId);
    }

    function closePerformanceModal() {
        perfModal.classList.remove("is-open");
        if (listBox) listBox.innerHTML = "";
        perfModal.dataset.scheduleId = "";
    }

    closeBtn?.addEventListener("click", closePerformanceModal);

    // ESC 키로 모달 닫기
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && perfModal.classList.contains("is-open")) {
            closePerformanceModal();
        }
    });

    // 배경 클릭 시 닫기 (이벤트 전파 방지 적용)
    perfModal.addEventListener("mousedown", (e) => {
        // e.target이 modal 본체가 아닌 '배경'일 때만 닫기
        if (e.target === perfModal) {
            closePerformanceModal();
        }
    });

    document.addEventListener("click", (e) => {
        const btn = e.target.closest(".btn-member-performance-modal");
        if (!btn) return;
        const scheduleId = document.body.dataset.scheduleId;
        openPerformanceModal(scheduleId);
    });

    //차트 함수
    function renderScheduleProgressChart(rate) {
        const canvas = document.getElementById("scheduleProgressChart");
        const textEl = document.getElementById("scheduleProgressText");
        if (!canvas) return;

        const value = Math.max(0, Math.min(100, Number(rate) || 0));
        if (textEl) textEl.textContent = `${value}%`;

        if (scheduleProgressChart) scheduleProgressChart.destroy();

        const ctx = canvas.getContext("2d");
        scheduleProgressChart = new Chart(ctx, {
            type: "doughnut",
            data: {
                datasets: [{
                    data: [value, 100 - value],
                    backgroundColor: ["#0B2E4F", "#6B7280"],
                    borderWidth: 0
                }]
            },
            options: {
                cutout: "0%",
                responsive: false,
                plugins: {
                    legend: { display: false },
                    tooltip: { enabled: false }
                }
            }
        });
    }

    async function loadPerformanceData(scheduleId) {
        if (!scheduleId) {
            if (listBox) listBox.innerHTML = `<div class="error">scheduleId가 없습니다.</div>`;
            return;
        }

        try {
            const res = await fetch(`/api/schedules/${scheduleId}/members/performance`, {
                method: "GET",
                headers: { Accept: "application/json" },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            renderPerformanceList(data);
        } catch (err) {
            console.error("데이터 로드 실패:", err);
            if (listBox) listBox.innerHTML = `<div class="error">데이터를 불러오지 못했습니다.</div>`;
        }
    }

    function renderPerformanceList(data) {
        const members = Array.isArray(data?.members) ? data.members : [];

        const scheduleRate = Number(data?.scheduleProgressRate ?? 0);

        const rateBox = document.getElementById("scheduleProgressRateText");
        if (rateBox) {
            rateBox.textContent = `현재 진행률 ${scheduleRate}%`;
        }

        renderScheduleProgressChart(scheduleRate);


        if (!members.length) {
            listBox.innerHTML = `<div class="empty">참여자가 없습니다.</div>`;
            return;
        }

        listBox.innerHTML = members
            .map((m) => {
                const userId = m.userId ?? "";
                const name = m.userName ?? "-";
                const dept = m.deptName ?? "-";
                const rank = m.rankName ?? "-"
                const img = m.userProfileImage ? m.userProfileImage : "/images/person300.svg";

                const pending = Number(m.pendingCount ?? 0);
                const done = Number(m.doneCount ?? 0);
                const rate = Number(m.progressRate ?? 0);


                return `
                  <div class="performance-row"
                             data-user-id="${userId}"
                             data-user-name="${escapeHtml(name)}"
                             data-user-dept="${escapeHtml(dept)}"
                             data-user-rank="${escapeHtml(rank)}"
                             data-user-img="${img}">
                    <div class="performance-grid">
                      <div class="member-cell">
                        <img class="member-avatar" src="${img}" alt="" />
                        <div class="member-text">
                          <div class="member-name">${escapeHtml(name)}</div>
                          <div class="member-meta">[${escapeHtml(dept)} ${escapeHtml(rank)}]</div>
                        </div>
                      </div>
                      <div class="cell">${pending}</div>
                      <div class="cell">${done}</div>
                      <div class="cell">${rate}%</div>
                    </div>
                  </div>
                `;
            })
            .join("");
    }


    // Modal1 row click -> Modal2 open
    listBox?.addEventListener("click", (e) => {
        const row = e.target.closest(".performance-row");
        if (!row) return;

        const scheduleId = perfModal.dataset.scheduleId || document.body.dataset.scheduleId;

        openMemberTasksModal(scheduleId,
            row.dataset.userId,
            row.dataset.userName,
            row.dataset.userImg,
            row.dataset.userDept,
            row.dataset.userRank);
    });


    // Modal2: member tasks
    const memberTasksModal = document.getElementById("memberTasksModal");

    const pendingCountText  = document.getElementById("pendingCountText");
    const doneCountText  = document.getElementById("doneCountText");

    const todoTaskList = document.getElementById("todoTaskList");
    const doingTaskList = document.getElementById("doingTaskList");
    const doneTaskList = document.getElementById("doneTaskList");

    const memberTasksCloseBtn = memberTasksModal?.querySelector(".x-btn");

    function openMemberTasksModal(scheduleId, userId, userName, img, dept, rank) {

        memberTasksModal.classList.add("is-open");
        memberTasksModal.dataset.scheduleId = scheduleId || "";
        memberTasksModal.dataset.userId = userId || "";

        const avatarEl = document.getElementById("memberAvatar");
        const nameEl = document.getElementById("memberName");
        const metaEl = document.getElementById("memberMeta");

        if (avatarEl) avatarEl.src = img || "/img/default-avatar.png";
        if (nameEl) nameEl.textContent = userName || "member";
        if (metaEl) metaEl.textContent = (dept || rank) ? `[${dept || ""} ${rank || ""}]` : "";


        if (doingTaskList) doingTaskList.innerHTML = `<div class="loading">불러오는 중...</div>`;
        if (todoTaskList) todoTaskList.innerHTML = "";
        if (doneTaskList) doneTaskList.innerHTML = "";

        if (pendingCountText) pendingCountText.textContent = "00";
        if (doneCountText) doneCountText.textContent = "00";

        loadMember2Tasks(scheduleId, userId);

        initMemberTasksDragAndDrop();
    }

    function closeMemberTasksModal() {
        if (!memberTasksModal) return;
        memberTasksModal.classList.remove("is-open");
        memberTasksModal.dataset.scheduleId = "";
        memberTasksModal.dataset.userId = "";

        if (doingTaskList) doingTaskList.innerHTML ="";
        if (todoTaskList) todoTaskList.innerHTML = "";
        if (doneTaskList) doneTaskList.innerHTML = "";
    }

    memberTasksCloseBtn?.addEventListener("click", closeMemberTasksModal);

    // ESC 키로 모달 닫기
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && memberTasksModal.classList.contains("is-open")) {
            closeMemberTasksModal();
        }
    });

    // 배경 클릭 시 닫기 (이벤트 전파 방지 적용)
    memberTasksModal.addEventListener("mousedown", (e) => {
        // e.target이 modal 본체가 아닌 '배경'일 때만 닫기
        if (e.target === memberTasksModal) {
            closeMemberTasksModal();
        }
    });

    function renderTaskItem(t) {
        const taskId = t.taskId ?? "";
        const desc = t.taskDescription ?? "-";
        const status = t.personalStatus ?? "TODO";

        return `
        <div class="task-item" data-task-id="${taskId}" data-status="${status}">
          <span class="task-text">${escapeHtml(desc)}</span>
        </div>
      `;
    }


    async function loadMember2Tasks(scheduleId, userId) {
        if (!scheduleId || !userId) {
            if (doingTaskList) doingTaskList.innerHTML = `<div class="error">scheduleId/userId가 없습니다.</div>`;
            return;
        }

        try {
            const res = await fetch(`/api/schedules/${scheduleId}/members/${userId}/tasks`, {
                method: "GET",
                headers: { Accept: "application/json" },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);

            const data = await res.json();

            const pendingCount = Number(data?.pendingCount ?? 0);
            const doneCount = Number(data?.doneCount ?? 0);

            if (pendingCountText) pendingCountText.textContent = String(pendingCount).padStart(2, "0");
            if (doneCountText) doneCountText.textContent = String(doneCount).padStart(2, "0");

            const todoTasks = Array.isArray(data?.todoTasks) ? data.todoTasks : [];
            const doingTasks = Array.isArray(data?.doingTasks) ? data.doingTasks : [];
            const doneTasks  = Array.isArray(data?.doneTasks)  ? data.doneTasks  : [];

            if (todoTaskList) {
                todoTaskList.innerHTML = todoTasks.length
                    ? todoTasks.map(renderTaskItem).join("")
                    : `<div class="empty">TODO Task가 없습니다.</div>`;
            }

            if (doingTaskList) {
                doingTaskList.innerHTML = doingTasks.length
                    ? doingTasks.map(renderTaskItem).join("")
                    : `<div class="empty">DOING Task가 없습니다.</div>`;
            }

            if (doneTaskList) {
                doneTaskList.innerHTML = doneTasks.length
                    ? doneTasks.map(renderTaskItem).join("")
                    : `<div class="empty">DONE Task가 없습니다.</div>`;
            }


        } catch (err) {
            console.error("모달2 데이터 로드 실패:", err);
            if (doingTaskList) doingTaskList.innerHTML = `<div class="error">데이터를 불러오지 못했습니다.</div>`;
            if (todoTaskList) todoTaskList.innerHTML = "";
        }
    }


    let modal2SortableInitialized = false;

    function initMemberTasksDragAndDrop() {
        if (modal2SortableInitialized) return;

        ["todoTaskList", "doingTaskList", "doneTaskList"].forEach((id) => {
            const el = document.getElementById(id);
            if (!el) return;

            new Sortable(el, {
                group: "memberTasks",
                animation: 300,
                draggable: ".task-item",
                filter: ".tasks-section-title",
                ghostClass: "drag-ghost",

                onMove: (evt) => {
                    // DONE에서 다시 끌어오는 것 방지(옵션)
                    if (evt.from.dataset.status === "DONE") return false;
                    return true;
                },

                onEnd: async (evt) => {
                    const item = evt.item;
                    const fromStatus = evt.from.dataset.status;
                    const toStatus = evt.to.dataset.status;

                    if (!item || fromStatus === toStatus) return;


                    const taskId = item.dataset.taskId;
                    const scheduleId = memberTasksModal.dataset.scheduleId;
                    const userId = memberTasksModal.dataset.userId;

                    try {
                        const res = await fetch(
                            `/api/schedules/${scheduleId}/members/${userId}/tasks/${taskId}/status`,
                            {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({ personalStatus: toStatus }),
                            }
                        );
                        if (!res.ok) throw new Error(`HTTP ${res.status}`);

                        await loadMember2Tasks(scheduleId, userId);
                        if (typeof loadPerformanceData === "function") {
                            loadPerformanceData(scheduleId);
                        }

                    } catch (err) {
                        console.error(err);
                        // 실패 시 롤백
                        evt.from.insertBefore(item, evt.from.children[evt.oldIndex] || null);
                        alert("실패했습니다.");
                    }
                },
            });
        });

        modal2SortableInitialized = true;
    }



    // task 추가
    const taskAddTrigger = document.getElementById("taskAddTrigger");
    const taskAddForm = document.getElementById("memberTaskAddForm");
    const taskAddInput = document.getElementById("memberTaskDescInput");
    const taskAddCancel = document.getElementById("taskAddCancel");

    // + Add 클릭 → input 열기
    taskAddTrigger?.addEventListener("click", () => {
        taskAddTrigger.classList.add("hidden");
        taskAddForm.classList.remove("hidden");
        taskAddInput.focus();
    });

    taskAddCancel?.addEventListener("click", closeTaskAdd);

    function closeTaskAdd() {
        taskAddForm.classList.add("hidden");
        taskAddTrigger.classList.remove("hidden");
        taskAddInput.value = "";
    }

    const addForm = document.getElementById("memberTaskAddForm");
    const descInput = document.getElementById("memberTaskDescInput");

    addForm?.addEventListener("submit", async (e) => {
        e.preventDefault();

        const scheduleId = memberTasksModal.dataset.scheduleId;
        const userId = memberTasksModal.dataset.userId;
        const desc = taskAddInput.value.trim();
        if (!desc) return;

        try {
            const res = await fetch(`/api/schedules/${scheduleId}/members/${userId}/tasks`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ taskDescription: desc }),
            });
            if (!res.ok) throw new Error();

            await loadMember2Tasks(scheduleId, userId);
            if (typeof loadPerformanceData === "function") {
                loadPerformanceData(scheduleId);
            }

            closeTaskAdd();

        } catch (err) {
            alert("Task 추가 실패");
        }
    });

    const scheduleId = document.body.dataset.scheduleId;
    if (scheduleId) {
        loadPerformanceData(scheduleId);
    }
});

/**
 *  업무 페이지 파일 업로드 및 렌더링 로직
 */

// 1. 파일 업로드 핸들러
// 1. 파일 업로드 핸들러
async function handleTaskFileUpload(input) {
    if (!input.files || !input.files[0]) return;

    const file = input.files[0];
    const scheduleId = document.body.dataset.scheduleId;

    if (!scheduleId) {
        alert("업무 정보가 없습니다.");
        return;
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("scheduleId", scheduleId);

    try {
        const response = await fetch('/api/task/files/upload', {
            method: 'POST',
            body: formData
        });

        if (!response.ok) throw new Error("업로드 실패");

        const data = await response.json(); // 서버에서 준 ScheduleFileDTO 객체
        console.log("업무 파일 업로드 성공 데이터:", data);

        // ★ 핵심: 서버 응답 데이터를 그대로 전달
        renderTaskFileItem(data);

        input.value = ""; // 파일 선택창 초기화

    } catch (error) {
        console.error("Error:", error);
        alert("파일 업로드 중 오류가 발생했습니다.");
    }
}

// 2. 파일 목록 아이템 렌더링 함수
// task.js 내 renderTaskFileItem 함수 수정
function renderTaskFileItem(fileLog) {
    const container = document.getElementById('taskFileList');
    if (!container) return;

    const id = fileLog.fileId;
    const name = fileLog.originalName;

    const fileItem = document.createElement('div');
    fileItem.className = 'file-item';

    // 📎 아이콘과 span 사이 여백 없이 바짝 붙임
    fileItem.innerHTML = `<a href="/api/task/files/download/${id}" class="file-link"><span>${name}</span></a>`;

    // 최신 파일을 목록 맨 위로 추가
    container.prepend(fileItem);

    // 스크롤을 맨 위로 올려서 방금 올린 파일을 보게 함
    container.scrollTop = 0;

    // '등록된 파일이 없습니다' 문구와 '기본 URL' 링크가 있다면 확실히 제거
    const noUrlMsg = container.closest('.file-view').querySelector('.no-url');
    if (noUrlMsg) noUrlMsg.remove();

    const oldUrlLink = container.closest('.file-view').querySelector('.etc-url');
    if (oldUrlLink) oldUrlLink.remove();
}