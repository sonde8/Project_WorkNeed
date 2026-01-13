/**
 * 파일 관리(기존 그대로)
 * onchange="handleFileSelection(this)"에서 접근 가능하도록 전역으로 둡니다.
 */
let accumulatedFiles = new DataTransfer();

/**
 * [파일 선택] input에서 선택된 파일들을 누적 저장하고,
 * 화면(fileListContainer)에 목록을 렌더링합니다.
 */
function handleFileSelection(input) {
    const container = document.getElementById('fileListContainer');
    const files = input.files;

    if (files.length > 0) {
        const placeholder = container.querySelector('.placeholder');
        if (placeholder) placeholder.remove();

        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            accumulatedFiles.items.add(file);

            const fileItem = document.createElement('div');
            fileItem.className = 'selected-file-item';
            fileItem.style = "display:flex; justify-content:space-between; align-items:center; background:#f8f9fa; padding:5px 10px; margin-bottom:5px; border-radius:4px; border:1px solid #eee;";
            fileItem.innerHTML = `
                <span style="font-size:var(--font-size-13);">${file.name}</span>
                <button type="button" onclick="removeFileFromList(this, '${file.name}')"
                        style="background:none; border:none; color:red; cursor:pointer; font-size:1.1rem;">&times;</button>
            `;
            container.appendChild(fileItem);
        }

        input.files = accumulatedFiles.files;
    }
}

/**
 * [파일 제거] 누적 저장된 파일들 중 fileName을 제거하고
 * input.files와 화면 목록을 동기화합니다.
 */
function removeFileFromList(btnElement, fileName) {
    const newFiles = new DataTransfer();
    const files = accumulatedFiles.files;

    for (let i = 0; i < files.length; i++) {
        if (files[i].name !== fileName) {
            newFiles.items.add(files[i]);
        }
    }

    accumulatedFiles = newFiles;

    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.files = accumulatedFiles.files;

    btnElement.parentElement.remove();

    if (accumulatedFiles.files.length === 0) {
        const container = document.getElementById('fileListContainer');
        if (container) {
            container.innerHTML = '<p class="placeholder" style="color:#999; font-size:0.9rem;">선택된 파일이 없습니다.</p>';
        }
    }
}

document.addEventListener("DOMContentLoaded", () => {

    /* ==================================================
     * CREATE PAGE (결재선 구성: 4칸 고정)
     * 필요한 DOM:
     *  - buttons: btnAddReview / btnAddAgreement / btnAddFinal / btnAddReference / btnReset
     *  - boxes  : reviewBox / agreementBox / finalBox / referenceBox
     *  - hidden : hiddenContainer
     * 체크박스(.candCheck)는 value=userId, data-name/dept/rank 를 갖습니다.
     * ================================================== */
    const hiddenContainer = document.getElementById("hiddenContainer");

    const btnAddReview = document.getElementById("btnAddReview");
    const btnAddAgreement = document.getElementById("btnAddAgreement");
    const btnAddFinal = document.getElementById("btnAddFinal");
    const btnAddReference = document.getElementById("btnAddReference");
    const btnReset = document.getElementById("btnReset");

    const reviewBox = document.getElementById("reviewBox");
    const agreementBox = document.getElementById("agreementBox");
    const finalBox = document.getElementById("finalBox");
    const referenceBox = document.getElementById("referenceBox");

    const isCreatePage =
        hiddenContainer &&
        btnAddReview && btnAddAgreement && btnAddFinal && btnAddReference && btnReset &&
        reviewBox && agreementBox && finalBox && referenceBox;

    if (isCreatePage) {

        // ===== 상태(진짜 데이터) =====
        // lineItems: 검토/합의/최종결재 (순차 흐름 참여)
        // refItems : 참조(흐름 밖)
        const lineItems = []; // {userId, name, dept, rank, orderNum}  orderNum: 1(검토) 2(합의) 3(최종결재)
        const refItems = [];  // {userId, name, dept, rank}
        // ✅ 최종 결재자(3단계)가 없으면 상신/재상신 막기
        const form = hiddenContainer.closest("form");
        if (form) {
            form.addEventListener("submit", (e) => {
                const hasFinalApprover = lineItems.some(item => item.orderNum === 3);

                if (!hasFinalApprover) {
                    e.preventDefault();
                    alert("결재(최종) 결재자를 선택해야 상신할 수 있습니다.");
                }
            });
        }

        /**
         * [후보 선택 가져오기]
         * 후보 목록(.candCheck) 중 체크된 요소만 배열로 가져옵니다.
         */
        function getCheckedCandidates() {
            return Array.from(document.querySelectorAll(".candCheck:checked"));
        }

        /**
         * [중복 방지]
         * 결재선(lineItems) / 참조(refItems) 전체에서 동일 userId가 이미 추가됐는지 검사합니다.
         */
        function alreadyPicked(userId) {
            const inLine = lineItems.some(item => String(item.userId) === String(userId));
            const inRef = refItems.some(item => String(item.userId) === String(userId));
            return inLine || inRef;
        }

        /**
         * [검토/합의/최종결재 추가]
         * 체크된 유저들을 orderNum(1/2/3) 단계로 lineItems에 담고,
         * 화면/hidden을 다시 그립니다.
         * - 최종결재(orderNum=3)는 1명만 허용
         */
        function addCheckedToStage(orderNum) {
            const checks = getCheckedCandidates();
            if (checks.length === 0) {
                alert("유저를 체크하십시오.");
                return;
            }

            if (orderNum === 3) {
                const hasFinal = lineItems.some(item => item.orderNum === 3);
                if (hasFinal) {
                    alert("최종결재자는 1명만 지정할 수 있습니다.");
                    checks.forEach(chk => chk.checked = false);
                    return;
                }
                if (checks.length > 1) {
                    alert("최종결재자는 1명만 선택하십시오.");
                    return;
                }
            }

            checks.forEach(chk => {
                const userId = chk.value;
                const name = chk.dataset.name || "";
                const dept = chk.dataset.dept || "";
                const rank = chk.dataset.rank || "";

                if (!alreadyPicked(userId)) {
                    lineItems.push({ userId, name, dept, rank, orderNum });
                }
                chk.checked = false;
            });

            render();
        }

        /**
         * [참조 추가]
         * 체크된 유저들을 refItems에 담고,
         * 화면/hidden을 다시 그립니다.
         */
        function addCheckedToReference() {
            const checks = getCheckedCandidates();
            if (checks.length === 0) {
                alert("유저를 체크하십시오.");
                return;
            }

            checks.forEach(chk => {
                const userId = chk.value;
                const name = chk.dataset.name || "";
                const dept = chk.dataset.dept || "";
                const rank = chk.dataset.rank || "";

                if (!alreadyPicked(userId)) {
                    refItems.push({ userId, name, dept, rank });
                }
                chk.checked = false;
            });

            render();
        }

        /**
         * [결재선 삭제]
         * lineItems에서 (userId + orderNum)이 일치하는 항목 1개를 제거합니다.
         */
        function removeLine(userId, orderNum) {
            const idx = lineItems.findIndex(item =>
                String(item.userId) === String(userId) && item.orderNum === Number(orderNum)
            );
            if (idx > -1) lineItems.splice(idx, 1);
            render();
        }

        /**
         * [참조 삭제]
         * refItems에서 userId가 일치하는 항목 1개를 제거합니다.
         */
        function removeRef(userId) {
            const idx = refItems.findIndex(item => String(item.userId) === String(userId));
            if (idx > -1) refItems.splice(idx, 1);
            render();
        }

        /**
         * [칸 렌더링]
         * 특정 박스(box)에 items를 목록 형태로 그려줍니다.
         * 비어있으면 "지정된 인원이 없습니다."를 표시합니다.
         */
        function fillBox(box, items, label) {
            box.innerHTML = "";

            if (!items || items.length === 0) {
                const empty = document.createElement("div");
                empty.className = "lane-empty";
                empty.textContent = "지정된 인원이 없습니다.";
                box.appendChild(empty);
                return;
            }

            items.forEach(item => {
                const row = document.createElement("div");
                row.className = "line-item";
                row.innerHTML = `
                    <span class="name">${item.name}</span>
                    <span class="meta">(${item.dept || '-'}${item.rank ? ' / ' + item.rank : ''})</span>
                    <button type="button" class="btn tiny danger"
                            data-kind="${label}" data-id="${item.userId}">
                        삭제
                    </button>
                `;
                box.appendChild(row);
            });
        }

        /**
         * [hidden input 동기화]
         * submit 시 컨트롤러가 받을 수 있게 hiddenContainer를 매번 새로 구성합니다.
         * - 결재선: approverIds / orderNums (같은 인덱스 쌍)
         * - 참조  : referenceIds
         */
        function renderHidden() {
            hiddenContainer.innerHTML = "";

            lineItems.forEach(item => {
                const a = document.createElement("input");
                a.type = "hidden";
                a.name = "approverIds";
                a.value = item.userId;

                const o = document.createElement("input");
                o.type = "hidden";
                o.name = "orderNums";
                o.value = item.orderNum;

                hiddenContainer.appendChild(a);
                hiddenContainer.appendChild(o);
            });

            refItems.forEach(item => {
                const r = document.createElement("input");
                r.type = "hidden";
                r.name = "referenceIds";
                r.value = item.userId;

                hiddenContainer.appendChild(r);
            });
        }

        /**
         * [삭제 버튼 이벤트 연결]
         * 렌더링할 때마다 DOM이 새로 만들어지므로,
         * 현재 화면에 있는 삭제 버튼들에 click 이벤트를 다시 연결합니다.
         */
        function renderDeleteEvents() {
            document.querySelectorAll("button[data-kind][data-id]").forEach(btn => {
                btn.addEventListener("click", () => {
                    const kind = btn.dataset.kind;
                    const userId = btn.dataset.id;

                    if (kind === "참조") {
                        removeRef(userId);
                        return;
                    }
                    const orderNum = (kind === "검토") ? 1 : (kind === "합의") ? 2 : 3;
                    removeLine(userId, orderNum);
                });
            });
        }

        /**
         * [전체 렌더]
         * 현재 상태(lineItems/refItems)를 기준으로
         *  - 4칸(검토/합의/최종결재/참조) 화면 갱신
         *  - hidden input 갱신
         *  - 삭제 이벤트 재연결
         */
        function render() {
            const reviewItems = lineItems.filter(item => item.orderNum === 1);
            const agreementItems = lineItems.filter(item => item.orderNum === 2);
            const finalItems = lineItems.filter(item => item.orderNum === 3);

            fillBox(reviewBox, reviewItems, "검토");
            fillBox(agreementBox, agreementItems, "합의");
            fillBox(finalBox, finalItems, "최종결재");
            fillBox(referenceBox, refItems, "참조");

            renderHidden();
            renderDeleteEvents();
        }

        // 버튼 이벤트
        btnAddReview.addEventListener("click", () => addCheckedToStage(1));
        btnAddAgreement.addEventListener("click", () => addCheckedToStage(2));
        btnAddFinal.addEventListener("click", () => addCheckedToStage(3));
        btnAddReference.addEventListener("click", addCheckedToReference);

        // 전체 초기화
        btnReset.addEventListener("click", () => {
            if (!confirm("결재선 구성을 전체 초기화하시겠습니까?")) return;
            lineItems.length = 0;
            refItems.length = 0;
            render();
        });

        // 초기 렌더
        render();
    }

    /* ==================================================
     * DETAIL PAGE (문서 상세) - 거절 토글 (기존 그대로)
     * ================================================== */
    const rejectForm = document.getElementById("rejectForm");

    if (rejectForm) {
        // HTML에 작성된 id="btnToggleReject"와 똑같이 맞춰줍니다.
        const toggleBtn = document.getElementById("btnRejectToggle");
        const cancelBtn = document.getElementById("btnCancelReject");

        // 1. 컨펌 메시지 로직 (기존 유지)
        document.querySelectorAll("[data-confirm]").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const msg = btn.dataset.confirm;
                if (msg && !confirm(msg)) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
        });

        // 2. 초기 상태 숨김
        rejectForm.style.display = "none";

        // 3. 반려 버튼 토글 로직
        if (toggleBtn) {
            toggleBtn.addEventListener("click", () => {
                const isHidden = (rejectForm.style.display === "none");
                rejectForm.style.display = isHidden ? "block" : "none";

                if (isHidden) {
                    const ta = rejectForm.querySelector("textarea[name='comment']");
                    if (ta) ta.focus();
                }
            });
        }

        // 4. 취소 버튼 로직
        if (cancelBtn) {
            cancelBtn.addEventListener("click", () => {
                rejectForm.style.display = "none";
                const ta = rejectForm.querySelector("textarea[name='comment']");
                if (ta) ta.value = "";
            });
        }
    }
const selectedUserIds = new Set();

function renderPicked() {
  const pickedList = document.getElementById('pickedList');
  const hiddenWrap = document.getElementById('pickedHiddenInputs');

  pickedList.innerHTML = '';
  hiddenWrap.innerHTML = '';

  selectedUserIds.forEach(id => {
    const u = ALL_USERS.find(x => String(x.userId) === String(id));
    if (!u) return;

    const row = document.createElement('div');
    row.className = 'row';
    row.innerHTML = `
      <div class="meta">
        <div class="name">${u.username}</div>
        <div class="sub">${u.deptName} · ${u.rankName}</div>
      </div>
      <button type="button" class="btn btn-small btnRemove" data-user-id="${u.userId}">삭제</button>
    `;
    pickedList.appendChild(row);

    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = 'selectedUserIds';
    input.value = u.userId;
    hiddenWrap.appendChild(input);
  });

  syncPickButtons();
}

function syncPickButtons() {
  document.querySelectorAll('[data-user-id]').forEach(row => {
    const userId = row.getAttribute('data-user-id');
    const btn = row.querySelector('.btnPick');
    if (!btn) return;

    const picked = selectedUserIds.has(String(userId));
    btn.disabled = picked;
    btn.textContent = picked ? '선택됨' : '선택';
  });
}

function pickUser(userId) {
  selectedUserIds.add(String(userId));
  renderPicked();
}

function removeUser(userId) {
  selectedUserIds.delete(String(userId));
  renderPicked();
}

/* 부서 토글 */
document.addEventListener('click', (e) => {
  const head = e.target.closest('.dept-head');
  if (head) {
    const body = head.parentElement.querySelector('.dept-body');
    const isOpen = body.style.display !== 'none';
    body.style.display = isOpen ? 'none' : 'block';
  }

  const pickBtn = e.target.closest('.btnPick');
  if (pickBtn) {
    const row = pickBtn.closest('[data-user-id]');
    pickUser(row.getAttribute('data-user-id'));
  }

  const removeBtn = e.target.closest('.btnRemove');
  if (removeBtn) {
    removeUser(removeBtn.getAttribute('data-user-id'));
  }

  const deptAll = e.target.closest('.deptSelectAll');
  if (deptAll) {
    const deptId = deptAll.getAttribute('data-dept-id');
    const rows = document.querySelectorAll(`.dept-head[data-dept-id="${deptId}"]`)
    if (rows.length) {
      const body = rows[0].parentElement.querySelector('.dept-body');
      body.querySelectorAll('[data-user-id]').forEach(r => {
        pickUser(r.getAttribute('data-user-id'));
      });
    }
  }
});

/* 팀 전체 선택 */
document.getElementById('btnSelectAll').addEventListener('click', () => {
  ALL_USERS.forEach(u => selectedUserIds.add(String(u.userId)));
  renderPicked();
});

/* 검색 */
function renderSearchResults(list) {
  const wrap = document.getElementById('searchResultList');
  document.getElementById('searchCount').textContent = list.length;

  wrap.innerHTML = '';
  list.forEach(u => {
    const row = document.createElement('div');
    row.className = 'row';
    row.setAttribute('data-user-id', u.userId);
    row.innerHTML = `
      <div class="meta">
        <div class="name">${u.username}</div>
        <div class="sub">${u.deptName} · ${u.rankName}</div>
      </div>
      <button type="button" class="btn btn-small btnPick">선택</button>
    `;
    wrap.appendChild(row);
  });

  syncPickButtons();
}

document.getElementById('btnSearch').addEventListener('click', () => {
  const q = document.getElementById('userSearchInput').value.trim().toLowerCase();
  if (!q) { renderSearchResults([]); return; }

  const filtered = ALL_USERS.filter(u =>
    String(u.username).toLowerCase().includes(q) ||
    String(u.deptName).toLowerCase().includes(q) ||
    String(u.rankName).toLowerCase().includes(q)
  );

  renderSearchResults(filtered);
});