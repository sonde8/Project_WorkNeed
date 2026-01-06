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
