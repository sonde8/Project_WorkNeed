/**
 * 파일 관리를 위한 전역 변수 및 함수
 * HTML의 onchange="handleFileSelection(this)"에서 접근할 수 있도록
 * DOMContentLoaded 이벤트 리스너 밖에 정의합니다.
 */
let accumulatedFiles = new DataTransfer();

// 파일을 선택할 때마다 기존 목록 아래에 추가하는 함수
function handleFileSelection(input) {
    const container = document.getElementById('fileListContainer');
    const files = input.files;

    if (files.length > 0) {
        // 처음 추가 시 안내 문구 삭제
        const placeholder = container.querySelector('.placeholder');
        if (placeholder) placeholder.remove();

        // 선택된 파일들을 하나씩 검사하며 쌓기
        for (let i = 0; i < files.length; i++) {
            const file = files[i];

            // 1. 실제 전송될 목록(accumulatedFiles)에 추가
            accumulatedFiles.items.add(file);

            // 2. 화면에 목록 표시 (삭제 버튼 포함)
            const fileItem = document.createElement('div');
            fileItem.className = 'selected-file-item';
            fileItem.style = "display: flex; justify-content: space-between; align-items: center; background: #f8f9fa; padding: 5px 10px; margin-bottom: 5px; border-radius: 4px; border: 1px solid #eee;";
            fileItem.innerHTML = `
                <span style="font-size: 0.9rem;">${file.name}</span>
                <button type="button" onclick="removeFileFromList(this, '${file.name}')" 
                        style="background:none; border:none; color:red; cursor:pointer; font-size: 1.1rem;">&times;</button>
            `;
            container.appendChild(fileItem);
        }

        // 3. 덮어쓰기 방지의 핵심: input 태그의 파일을 현재까지 쌓인 전체 목록으로 교체
        input.files = accumulatedFiles.files;
    }
}

// 개별 파일 삭제 기능
function removeFileFromList(btnElement, fileName) {
    const newFiles = new DataTransfer();
    const files = accumulatedFiles.files;

    for (let i = 0; i < files.length; i++) {
        if (files[i].name !== fileName) {
            newFiles.items.add(files[i]);
        }
    }

    accumulatedFiles = newFiles;
    // input 태그에 반영
    const fileInput = document.getElementById('fileInput');
    if (fileInput) fileInput.files = accumulatedFiles.files;

    // 화면에서 제거
    btnElement.parentElement.remove();

    // 목록이 비었을 때 안내 텍스트 복구
    if (accumulatedFiles.files.length === 0) {
        document.getElementById('fileListContainer').innerHTML = '<p class="placeholder" style="color: #999; font-size: 0.9rem;">선택된 파일이 없습니다.</p>';
    }
}

document.addEventListener("DOMContentLoaded", () => {

    /* ==================================================
     * CREATE PAGE (결재 문서 작성)
     * 기준 DOM: orderBadge
     * ================================================== */
    const orderBadge = document.getElementById("orderBadge");

    if (orderBadge) {
        // ===== DOM =====
        const preview = document.getElementById("linePreview");
        const hiddenContainer = document.getElementById("hiddenContainer");

        const btnMinus = document.getElementById("btnMinus");
        const btnPlus = document.getElementById("btnPlus");
        const btnAdd = document.getElementById("btnAddToOrder");
        const btnReset = document.getElementById("btnReset");

        // 방어 (create 페이지가 아니면 중단)
        if (!preview || !hiddenContainer || !btnMinus || !btnPlus || !btnAdd || !btnReset) {
            return;
        }

        let currentOrder = 1;
        const lineItems = [];

        function renderCreate() {
            preview.innerHTML = "";

            if (lineItems.length === 0) {
                const empty = document.createElement("div");
                empty.className = "empty";
                empty.textContent = "아직 추가된 결재자가 없습니다.";
                preview.appendChild(empty);
            } else {
                const groups = {};
                lineItems.forEach(x => {
                    if (!groups[x.orderNum]) groups[x.orderNum] = [];
                    groups[x.orderNum].push(x);
                });

                Object.keys(groups)
                    .sort((a, b) => Number(a) - Number(b))
                    .forEach(order => {
                        const box = document.createElement("div");
                        box.className = "order-group";

                        const head = document.createElement("div");
                        head.className = "order-head";
                        head.innerHTML = `<b>${order}차</b> <span class="mini">(${groups[order].length}명)</span>`;
                        box.appendChild(head);

                        groups[order].forEach(x => {
                            const row = document.createElement("div");
                            row.className = "line-item";
                            row.innerHTML = `
                <span class="name">${x.name}</span>
                <span class="meta">(${x.dept || '-'}${x.rank ? ' / ' + x.rank : ''})</span>
                <button type="button"
                        class="btn tiny danger"
                        data-id="${x.userId}"
                        data-order="${x.orderNum}">
                  삭제
                </button>
              `;
                            box.appendChild(row);
                        });

                        preview.appendChild(box);
                    });
            }

            // hidden inputs
            hiddenContainer.innerHTML = "";
            lineItems.forEach(x => {
                const a = document.createElement("input");
                a.type = "hidden";
                a.name = "approverIds";
                a.value = x.userId;

                const o = document.createElement("input");
                o.type = "hidden";
                o.name = "orderNums";
                o.value = x.orderNum;

                hiddenContainer.appendChild(a);
                hiddenContainer.appendChild(o);
            });

            // 삭제
            preview.querySelectorAll("button[data-id]").forEach(btn => {
                btn.addEventListener("click", () => {
                    const id = btn.dataset.id;
                    const order = Number(btn.dataset.order);

                    const idx = lineItems.findIndex(v =>
                        String(v.userId) === String(id) && v.orderNum === order
                    );
                    if (idx > -1) {
                        lineItems.splice(idx, 1);
                        renderCreate();
                    }
                });
            });

            orderBadge.textContent = String(currentOrder);
        }

        // 차수
        btnMinus.addEventListener("click", () => {
            if (currentOrder > 1) currentOrder--;
            renderCreate();
        });

        btnPlus.addEventListener("click", () => {
            currentOrder++;
            renderCreate();
        });

        // 추가
        btnAdd.addEventListener("click", () => {
            const checks = document.querySelectorAll(".candCheck:checked");
            if (checks.length === 0) {
                alert("결재자를 체크하십시오.");
                return;
            }

            checks.forEach(chk => {
                const userId = chk.value;
                const name = chk.dataset.name || "";
                const dept = chk.dataset.dept || "";
                const rank = chk.dataset.rank || "";

                const exists = lineItems.some(x => String(x.userId) === String(userId));
                if (!exists) {
                    lineItems.push({ userId, name, dept, rank, orderNum: currentOrder });
                }
                chk.checked = false;
            });

            renderCreate();
        });

        // 초기화
        btnReset.addEventListener("click", () => {
            if (!confirm("결재선을 전체 초기화하시겠습니까?")) return;
            lineItems.length = 0;
            currentOrder = 1;
            renderCreate();
        });

        renderCreate();
    }

    /* ==================================================
     * DETAIL PAGE (문서 상세)
     * 기준 DOM: rejectForm
     * ================================================== */
    const rejectForm = document.getElementById("rejectForm");

    if (rejectForm) {
        const toggleBtn = document.getElementById("btnToggleReject");
        const cancelBtn = document.getElementById("btnCancelReject");

        // confirm 처리
        document.querySelectorAll("[data-confirm]").forEach(btn => {
            btn.addEventListener("click", (e) => {
                const msg = btn.dataset.confirm;
                if (msg && !confirm(msg)) {
                    e.preventDefault();
                    e.stopPropagation();
                }
            });
        });

        rejectForm.style.display = "none";

        if (toggleBtn) {
            toggleBtn.addEventListener("click", () => {
                const isHidden = rejectForm.style.display === "none";
                rejectForm.style.display = isHidden ? "block" : "none";
                if (isHidden) {
                    const ta = rejectForm.querySelector("textarea[name='comment']");
                    if (ta) ta.focus();
                }
            });
        }

        if (cancelBtn) {
            cancelBtn.addEventListener("click", () => {
                rejectForm.style.display = "none";
                const ta = rejectForm.querySelector("textarea[name='comment']");
                if (ta) ta.value = "";
            });
        }
    }
});