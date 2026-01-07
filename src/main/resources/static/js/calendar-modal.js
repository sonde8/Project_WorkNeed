(function () {
    const API_BASE = "/api/calendar";

    const DEFAULT_CREATED_BY =
        window.USER_ID ?? window.createdBy ?? window.LOGIN_USER_ID ?? 1;

    /* ================= DOM ================= */

    const overlay = document.getElementById("calendarCreateModalOverlay");
    const form = document.getElementById("calendarCreateForm");

    const calendarIdInput = document.getElementById("calendarId");
    const titleInput = document.getElementById("calendarTitle");
    const startInput = document.getElementById("calendarStartAt");
    const endInput = document.getElementById("calendarEndAt");
    const descInput = document.getElementById("calendarDescription");

    const hiddenTypeInput = document.getElementById("calendarType");

    const selectedColorInput = document.getElementById("selectedColorInput");
    const realColorPicker = document.getElementById("realColorPicker");
    const customColorBtn = document.getElementById("customColorBtn");

    const submitBtn = document.getElementById("calendarSubmitBtn");
    const closeBtn = document.getElementById("closeCalendarCreateModal");
    const cancelBtn = document.getElementById("cancelCalendarCreateModal");

    if (!overlay || !form || !titleInput || !startInput || !endInput || !descInput) {
        console.error("[calendar-modal] required DOM missing");
        return;
    }

    /* ================= State ================= */

    let isEditMode = false;
    let selectedColor = (selectedColorInput?.value || "#3b82f6").toLowerCase();
    let selectedType = (hiddenTypeInput?.value || "PERSONAL");

    let startPicker = null;
    let endPicker = null;

    /* ================= Auth / Permission ================= */

    function isAdminUser() {
        if (window.IS_ADMIN === true || window.isAdmin === true) return true;

        const role = (window.USER_ROLE || window.role || "").toString().toUpperCase();
        if (role.includes("ADMIN") || role.includes("MANAGER")) return true;

        return false;
    }

    function isCompanyType(type) {
        return (type || "").toString().toUpperCase() === "COMPANY";
    }

    /* ================= Utils ================= */

    function toDtoDateTimeFromPicker(value) {
        if (!value) return "";
        const v = String(value).trim();
        return v.includes("T")
            ? `${v.slice(0, 16)}:00`
            : v.replace(" ", "T") + ":00";
    }

    function releaseFocus() {
        if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
        }
    }

    function openModal() {
        overlay.classList.remove("hidden");
        overlay.setAttribute("aria-hidden", "false");
        setTimeout(() => titleInput.focus(), 0);
    }

    function setSelectedColorUI(color) {
        // 1. 색상값 정제 (소문자 변환)
        const c = (color || "#3b82f6").toLowerCase();
        selectedColor = c;

        // 2. input 값 업데이트 (hidden input + 실제 컬러피커)
        if (selectedColorInput) selectedColorInput.value = c;
        if (realColorPicker) realColorPicker.value = c;

        // 3. 모든 버튼의 active 상태 초기화
        document.querySelectorAll(".color-option").forEach(el => {
            el.classList.remove("active");
            el.classList.remove("is-custom");
        });

        // 4. 선택된 색상이 '프리셋(고정 색상)' 중에 있는지 확인
        const matched = document.querySelector(`.color-option[data-color="${c}"]`);

        if (matched) {
            // 프리셋 색상인 경우
            matched.classList.add("active");

            // 커스텀 버튼의 배경색을 지워서 다시 '무지개(CSS)'가 보이게 복구
            if (customColorBtn) {
                customColorBtn.style.background = "";
            }
        } else {
            // 커스텀 색상인 경우 (무지개에서 선택)
            if (customColorBtn) {
                customColorBtn.classList.add("active");
                customColorBtn.classList.add("is-custom");

                // 무지개 위에 선택한 색상을 덮어씌움
                customColorBtn.style.background = c;
            }
        }
    }

    function resetForm() {
        form.reset();

        if (calendarIdInput) calendarIdInput.value = "";
        isEditMode = false;
        if (submitBtn) submitBtn.textContent = "등록";

        selectedType = "PERSONAL";
        if (hiddenTypeInput) hiddenTypeInput.value = selectedType;
        if (selectedColorInput) selectedColorInput.value = "#3b82f6";
        if (realColorPicker) realColorPicker.value = "#ffffff";

        if (customColorBtn) {
            customColorBtn.style.background = "";
            customColorBtn.classList.remove("active");
            customColorBtn.classList.remove("is-custom");
        }

        setSelectedColorUI("#3b82f6");

        startPicker?.clear();
        if (endPicker) {
            endPicker.clear();
            endPicker.set("minDate", null);
        }
    }

    function closeModal() {
        releaseFocus();

        overlay.classList.add("hidden");
        overlay.setAttribute("aria-hidden", "true");
        resetForm();
    }

    function readTypeFromUI() {
        const radio =
            document.querySelector("input[name='calendarTypeRadio']:checked") ||
            document.querySelector("input[name='scheduleType']:checked") ||
            document.querySelector("input[name='calendarType']:checked");

        return radio?.value || hiddenTypeInput?.value || selectedType || "PERSONAL";
    }

    function readColorFromUI() {
        const v = selectedColorInput?.value;
        if (v) return String(v).toLowerCase();

        const active = document.querySelector("[data-color].active");
        return (active?.getAttribute("data-color") || selectedColor || "#3b82f6").toLowerCase();
    }

    function bindColorUIOnce() {
        if (bindColorUIOnce._bound) return;
        bindColorUIOnce._bound = true;

        // 1. 프리셋 버튼 클릭 이벤트
        document.querySelectorAll(".color-option[data-color]").forEach((el) => {
            el.addEventListener("click", (e) => {
                e.preventDefault(); // 혹시 모를 버블링 방지
                const c = el.getAttribute("data-color");
                if (c) setSelectedColorUI(c);
            });
        });

        // 2. 커스텀 컬러 픽커 변경 이벤트 (input)
        if (realColorPicker) {
            realColorPicker.addEventListener("input", (e) => {
                const c = e.target.value;
                if (c) setSelectedColorUI(c);
            });

            if (customColorBtn) {
                customColorBtn.addEventListener("click", () => {
                    realColorPicker.click();
                });
            }
        }
    }

    /* ================= Flatpickr ================= */

    if (typeof flatpickr === "function") {
        startPicker = flatpickr(startInput, {
            enableTime: true,
            time_24hr: true,
            minuteIncrement: 30,
            dateFormat: "Y-m-d H:i",
            onChange: function (selectedDates) {
                if (!selectedDates.length || !endPicker) return;

                const startDate = selectedDates[0];
                endPicker.set("minDate", startDate);

                const endDate = endPicker.selectedDates[0];
                if (endDate && endDate < startDate) {
                    endPicker.setDate(
                        new Date(startDate.getTime() + 30 * 60000),
                        true
                    );
                }
            }
        });

        endPicker = flatpickr(endInput, {
            enableTime: true,
            time_24hr: true,
            minuteIncrement: 30,
            dateFormat: "Y-m-d H:i",
        });
    }

    bindColorUIOnce();

    /* ================= Submit ================= */

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        const title = titleInput.value.trim();
        const start = toDtoDateTimeFromPicker(startInput.value);
        const end = toDtoDateTimeFromPicker(endInput.value);

        if (!title || !start || !end) {
            alert("제목, 시작, 종료는 필수입니다.");
            return;
        }
        if (new Date(end) < new Date(start)) {
            alert("종료 시간이 시작 시간보다 빠를 수 없습니다.");
            return;
        }

        const type = readTypeFromUI();

        if (isCompanyType(type) && !isAdminUser()) {
            alert("회사 일정은 관리자만 등록/수정할 수 있습니다.");
            return;
        }

        const payload = {
            createdBy: DEFAULT_CREATED_BY,
            title,
            description: descInput.value.trim(),
            start,
            end,
            type,
            color: readColorFromUI(),
        };

        try {
            const id = calendarIdInput?.value;
            const url = isEditMode ? `${API_BASE}/${id}` : API_BASE;

            const res = await fetch(url, {
                method: isEditMode ? "PUT" : "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                alert("저장에 실패했습니다. 서버 로그를 확인하세요.");
                return;
            }

            closeModal();
            window.loadCalendarEvents?.();

        } catch (err) {
            console.error(err);
            alert("저장 중 오류가 발생했습니다.");
        }
    });

    /* ================= External Open ================= */

    window.openCalendarCreateModal = function (dto = {}) {
        resetForm();

        if (dto.calendarId) {
            const dtoType = (dto.type || dto.calendarType || "").toString().toUpperCase();

            if (dtoType === "COMPANY" && !isAdminUser()) {
                alert("회사 일정은 관리자만 수정할 수 있습니다.");
                return;
            }

            isEditMode = true;
            if (calendarIdInput) calendarIdInput.value = dto.calendarId;
            if (submitBtn) submitBtn.textContent = "수정";

            titleInput.value = dto.title || "";
            descInput.value = dto.description || "";

            const s = dto.start ? new Date(dto.start) : null;
            const e = dto.end ? new Date(dto.end) : null;

            if (s) {
                startPicker?.setDate(s, false);
                endPicker?.set("minDate", s);
            }
            if (e) endPicker?.setDate(e, false);

            selectedType = dtoType || "PERSONAL";
            if (hiddenTypeInput) hiddenTypeInput.value = selectedType;

            const c = (dto.color || dto.scheduleColor || dto.eventColor || "#3b82f6");
            setSelectedColorUI(c);

            openModal();
            return;
        }

        if (dto.start && dto.end) {
            const s = new Date(dto.start);
            const e = new Date(dto.end);

            startPicker?.setDate(s, false);
            endPicker?.set("minDate", s);
            endPicker?.setDate(e, false);

            openModal();
            return;
        }

        const now = new Date();
        const s = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0);
        const e = new Date(s.getTime() + 30 * 60000);

        startPicker?.setDate(s, false);
        endPicker?.set("minDate", s);
        endPicker?.setDate(e, false);

        openModal();
    };

    /* ================= Close ================= */

    closeBtn?.addEventListener("click", closeModal);
    cancelBtn?.addEventListener("click", closeModal);
    // ESC 키로 등록 모달 닫기
    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape" && !overlay.classList.contains("hidden")) {
            closeModal();
        }
    });

    // 배경 클릭 시 등록 모달 닫기
    overlay.addEventListener("click", (e) => {
        // 클릭된 대상이 하얀색 폼 박스가 아니라 바깥 배경(overlay)일 때만 닫기
        if (e.target === overlay) {
            closeModal();
        }
    });

})();
