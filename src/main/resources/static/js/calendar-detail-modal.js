(function () {

    /* ================= DOM ================= */
    const overlay = document.getElementById("calendarDetailModalOverlay");

    const titleEl = document.getElementById("detailTitle");
    const descEl = document.getElementById("detailDescription");
    const dateEl = document.getElementById("detailDate");

    const goScheduleBtn = document.getElementById("detailGoScheduleBtn");
    const editBtn = document.getElementById("detailEditBtn");
    const deleteBtn = document.getElementById("detailDeleteBtn");
    const closeBtn = document.getElementById("detailCloseBtn");

    if (
        !overlay || !titleEl || !dateEl ||
        !editBtn || !deleteBtn || !closeBtn || !goScheduleBtn
    ) {
        console.error("[calendar-detail-modal] required DOM missing");
        return;
    }

    /* ================= State ================= */
    let currentDetail = null;

    /* ================= Auth / Permission ================= */
    function isAdminUser() {
        if (window.IS_ADMIN === true || window.isAdmin === true) return true;

        const role = (window.USER_ROLE || window.role || "")
            .toString()
            .toUpperCase();

        return role.includes("ADMIN") || role.includes("MANAGER");
    }

    function isCompanyType(type) {
        return (type || "").toString().toUpperCase() === "COMPANY";
    }

    function getSource(dto) {
        return (dto?.source || "CALENDAR").toString().toUpperCase();
    }

    function isScheduleSource(dto) {
        return getSource(dto) === "SCHEDULE";
    }

    function canEditOrDelete(dto) {
        // 업무 스케줄은 캘린더에서 편집/삭제 불가
        if (isScheduleSource(dto)) return false;

        // PERSONAL 일정은 허용
        if (!isCompanyType(dto.type)) return true;

        // COMPANY 일정은 관리자만
        return isAdminUser();
    }

    /* ================= Utils ================= */
    function formatDate(startAt, endAt) {
        const start = new Date(startAt);
        const end = new Date(endAt);

        const pad = (n) => String(n).padStart(2, "0");

        const s =
            `${start.getFullYear()}-${pad(start.getMonth() + 1)}-${pad(start.getDate())} ` +
            `${pad(start.getHours())}:${pad(start.getMinutes())}`;

        const e =
            `${end.getFullYear()}-${pad(end.getMonth() + 1)}-${pad(end.getDate())} ` +
            `${pad(end.getHours())}:${pad(end.getMinutes())}`;

        return `${s} ~ ${e}`;
    }

    // 접근성: aria-hidden 전에 focus 해제
    function releaseFocus() {
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
    }

    function openModal() {
        overlay.classList.remove("hidden");
        overlay.setAttribute("aria-hidden", "false");
    }

    function closeModal() {
        releaseFocus();
        overlay.classList.add("hidden");
        overlay.setAttribute("aria-hidden", "true");
        currentDetail = null;
    }

    function applyPermissionUI(dto) {
        const allowed = canEditOrDelete(dto);
        editBtn.style.display = allowed ? "inline-flex" : "none";
        deleteBtn.style.display = allowed ? "inline-flex" : "none";
    }

    function applyScheduleLinkUI(dto) {
        // 업무 스케줄일 때만 버튼 노출
        goScheduleBtn.style.display = isScheduleSource(dto)
            ? "inline-flex"
            : "none";
    }

    /* ================= External Open ================= */
    window.openCalendarDetailModal = function (dto) {
        if (!dto) return;

        currentDetail = dto;

        titleEl.textContent = dto.title || "";
        descEl.textContent = dto.description || "-";
        dateEl.textContent = formatDate(dto.start, dto.end);

        applyPermissionUI(dto);
        applyScheduleLinkUI(dto);

        openModal();
    };

    /* ================= Events ================= */
    // 업무 상세 페이지로 이동
    goScheduleBtn.addEventListener("click", () => {
        if (!currentDetail || !isScheduleSource(currentDetail)) return;

        const scheduleId = currentDetail.id; // schedule_id AS id
        if (!scheduleId) {
            alert("업무 정보를 찾을 수 없습니다.");
            return;
        }

        window.location.href = `/schedule/task?scheduleId=${scheduleId}`;
    });

    editBtn.addEventListener("click", () => {
        if (!currentDetail) return;

        if (!canEditOrDelete(currentDetail)) {
            alert(
                isScheduleSource(currentDetail)
                    ? "업무 일정은 캘린더에서 수정할 수 없습니다."
                    : "회사 일정은 관리자만 수정할 수 있습니다."
            );
            return;
        }

        const dto = { ...currentDetail };
        closeModal();
        window.openCalendarCreateModal?.(dto);
    });

    deleteBtn.addEventListener("click", async () => {
        if (!currentDetail) return;

        if (!canEditOrDelete(currentDetail)) {
            alert(
                isScheduleSource(currentDetail)
                    ? "업무 일정은 캘린더에서 삭제할 수 없습니다."
                    : "회사 일정은 관리자만 삭제할 수 있습니다."
            );
            return;
        }

        if (!confirm("정말 이 일정을 삭제하시겠습니까?")) return;

        try {
            const res = await fetch(
                `/api/calendar/${currentDetail.calendarId}`,
                { method: "DELETE" }
            );

            if (!res.ok) {
                alert("삭제에 실패했습니다.");
                return;
            }

            closeModal();
            window.loadCalendarEvents?.();

        } catch (err) {
            console.error(err);
            alert("삭제 중 오류가 발생했습니다.");
        }
    });

    closeBtn.addEventListener("click", closeModal);

    // ESC 키로 상세 모달 닫기
    document.addEventListener("keydown", (e) => {
        // 모달이 hidden이 아닐 때(열려 있을 때)만 작동
        if (e.key === "Escape" && !overlay.classList.contains("hidden")) {
            closeModal();
        }
    });

    // 배경 클릭 시 상세 모달 닫기
    overlay.addEventListener("click", (e) => {
        if (e.target === overlay) {
            closeModal();
        }
    });
})();
