document.addEventListener("DOMContentLoaded", () => {

    // =========================
    // 상태
    // =========================
    let currentOrder = 1;
    const lineItems = []; // [{userId, name, dept, rank, orderNum}]

    // =========================
    // DOM
    // =========================
    const orderBadge = document.getElementById("orderBadge");
    const preview = document.getElementById("linePreview");
    const hiddenContainer = document.getElementById("hiddenContainer");

    const btnAdd = document.getElementById("btnAddToCurrent");
    const btnPrev = document.getElementById("btnPrevOrder");
    const btnNext = document.getElementById("btnNextOrder");
    const btnClear = document.getElementById("btnClear");

    // 모달
    const btnOpenSubmitModal = document.getElementById("btnOpenSubmitModal");
    const submitModal = document.getElementById("submitModal");
    const modalLineSummary = document.getElementById("modalLineSummary");

    const approverBox = document.getElementById("approverBox");

    // ✅ 필수 요소 체크
    if (
        !orderBadge || !preview || !hiddenContainer ||
        !btnAdd || !btnPrev || !btnNext || !btnClear ||
        !btnOpenSubmitModal || !submitModal || !modalLineSummary
    ) {
        console.log("DOM missing:", {
            orderBadge, preview, hiddenContainer,
            btnAdd, btnPrev, btnNext, btnClear,
            btnOpenSubmitModal, submitModal, modalLineSummary
        });
        return;
    }

    // =========================
    // 유틸: 모달 열기/닫기
    // =========================
    function openModal() {
        submitModal.classList.add("is-open");
        submitModal.setAttribute("aria-hidden", "false");
    }

    function closeModal() {
        submitModal.classList.remove("is-open");
        submitModal.setAttribute("aria-hidden", "true");
    }

    // =========================
    // 렌더링: 차수별 박스 + hidden 동기화
    // =========================
    function render() {
        // 현재 차수 배지
        orderBadge.textContent = String(currentOrder);

        // preview 초기화
        preview.innerHTML = "";

        // orderNum별 그룹
        const groups = new Map(); // key: orderNum, value: items[]
        lineItems.forEach((x) => {
            if (!groups.has(x.orderNum)) groups.set(x.orderNum, []);
            groups.get(x.orderNum).push(x);
        });

        // 차수 오름차순
        const orderNums = Array.from(groups.keys()).sort((a, b) => a - b);

        // 차수 박스 렌더
        orderNums.forEach((ord) => {
            const box = document.createElement("div");
            box.className = "order-box";

            const header = document.createElement("div");
            header.className = "order-header";
            if (ord === currentOrder) header.classList.add("active-order");
            header.innerHTML = `<b>${ord}차</b> <span class="count">(${groups.get(ord).length}명)</span>`;
            box.appendChild(header);

            const list = document.createElement("div");
            list.className = "order-list";

            groups.get(ord).forEach((x) => {
                const row = document.createElement("div");
                row.className = "item";

                // 삭제용 idx (userId는 전체에서 유일하다고 가정)
                const idx = lineItems.findIndex(v => v.userId === x.userId);

                row.innerHTML = `
          <div class="left">
            <span class="name">${x.name}</span>
            <span class="meta">(${x.dept} / ${x.rank})</span>
          </div>
          <button type="button" class="btnRemove" data-idx="${idx}">삭제</button>
        `;
                list.appendChild(row);
            });

            box.appendChild(list);
            preview.appendChild(box);
        });

        // hidden inputs 재생성
        hiddenContainer.innerHTML = "";
        lineItems.forEach((x) => {
            const i1 = document.createElement("input");
            i1.type = "hidden";
            i1.name = "approverIds";
            i1.value = x.userId;

            const i2 = document.createElement("input");
            i2.type = "hidden";
            i2.name = "orderNums";
            i2.value = String(x.orderNum);

            hiddenContainer.appendChild(i1);
            hiddenContainer.appendChild(i2);
        });
    }

    // =========================
    // 유틸: 모달 요약 만들기
    // =========================
    function buildSummaryHTML() {
        const groups = new Map();
        lineItems.forEach(x => {
            if (!groups.has(x.orderNum)) groups.set(x.orderNum, []);
            groups.get(x.orderNum).push(x);
        });

        const orderNums = Array.from(groups.keys()).sort((a, b) => a - b);
        if (orderNums.length === 0) {
            return "<div class='empty'>결재선이 비어 있습니다.</div>";
        }

        let html = "";
        orderNums.forEach(ord => {
            const names = groups.get(ord).map(v => v.name).join(", ");
            html += `<div class="sum-row"><b>${ord}차</b><span>${names}</span></div>`;
        });
        return html;
    }

    // =========================
    // 추가: 현재 차수에 체크된 후보 넣기
    // =========================
    btnAdd.addEventListener("click", () => {
        const checked = document.querySelectorAll(".candChk:checked");
        if (checked.length === 0) {
            alert("추가할 결재자를 선택하십시오.");
            return;
        }

        checked.forEach(chk => {
            const userId = chk.value;

            // 중복 방지(이미 다른 차수에 들어가 있으면 스킵)
            const exists = lineItems.some(x => x.userId === userId);
            if (exists) {
                chk.checked = false;
                return;
            }

            lineItems.push({
                userId,
                name: chk.dataset.name || "",
                dept: chk.dataset.dept || "",
                rank: chk.dataset.rank || "",
                orderNum: currentOrder
            });

            chk.checked = false;
        });

        render();
    });

    // =========================
    // 차수 이동: 이전(-)
    // =========================
    btnPrev.addEventListener("click", () => {
        if (currentOrder <= 1) return;
        currentOrder--;
        render();
    });

    // =========================
    // 차수 이동/생성: 다음(+)
    // - 다음 차수가 있으면 이동
    // - 없으면 현재 차수에 최소 1명 있을 때만 생성
    // =========================
    btnNext.addEventListener("click", () => {
        const hasNext = lineItems.some(x => x.orderNum === currentOrder + 1);
        if (hasNext) {
            currentOrder++;
            render();
            return;
        }

        const hasCurrent = lineItems.some(x => x.orderNum === currentOrder);
        if (!hasCurrent) {
            alert("현재 차수에 결재자를 먼저 추가하십시오.");
            return;
        }

        currentOrder++;
        render();
    });

    // =========================
    // 삭제: 미리보기에서 삭제 버튼 클릭
    // =========================
    preview.addEventListener("click", (e) => {
        if (!e.target.classList.contains("btnRemove")) return;

        const idx = Number(e.target.dataset.idx);
        if (Number.isNaN(idx)) return;

        lineItems.splice(idx, 1);

        // 현재 차수에 아무도 없고, 더 높은 차수도 없다면 currentOrder 내려줌
        while (currentOrder > 1 && !lineItems.some(x => x.orderNum === currentOrder)) {
            const hasHigher = lineItems.some(x => x.orderNum > currentOrder);
            if (hasHigher) break;
            currentOrder--;
        }

        render();
    });

    // =========================
    // 전체 초기화
    // =========================
    btnClear.addEventListener("click", () => {
        lineItems.length = 0;
        currentOrder = 1;
        render();
    });

    // =========================
    // 제출 버튼(모달 오픈)
    // =========================
    btnOpenSubmitModal.addEventListener("click", () => {
        // 결재선이 없으면 모달 대신 안내 + 이동
        if (lineItems.length === 0) {
            alert("결재선을 먼저 구성하십시오.");
            if (approverBox) {
                approverBox.scrollIntoView({ behavior: "smooth", block: "start" });
                approverBox.classList.add("highlight");
                setTimeout(() => approverBox.classList.remove("highlight"), 1200);
            }
            return;
        }

        // 혹시 hidden 동기화가 안 된 상황 방지
        render();

        // 요약 프리뷰
        modalLineSummary.innerHTML = buildSummaryHTML();

        openModal();
    });

    // 모달 닫기(배경/닫기/취소)
    submitModal.addEventListener("click", (e) => {
        const close = e.target.getAttribute("data-close");
        if (close === "1") closeModal();
    });

    // ESC 닫기
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && submitModal.classList.contains("is-open")) {
            closeModal();
        }
    });

    // 최초 렌더
    render();
});
