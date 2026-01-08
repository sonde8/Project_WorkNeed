document.addEventListener("DOMContentLoaded", () => {

    const trigger = document.getElementById("profileTrigger"); // 헤더 이미지
    const modal = document.getElementById("profileModal");     // 모달
    const modalImg = document.getElementById("modalImgTrigger"); // 모달 내 이미지
    const changeBtn = document.getElementById("changeProfileBtn"); // 변경 버튼
    const fileInput = document.getElementById("hiddenFileSelect"); // 숨겨진 인풋

    // 1. 모달 열기/닫기 (기존 로직)
    trigger.addEventListener("click", (e) => {
        if (e.target.closest('.profile-modal-content')) return;
        e.stopPropagation();
        modal.classList.toggle("modal-show");
    });

    // 2. 이미지 클릭 or 변경 버튼 클릭 시 -> 파일 선택창 띄우기
    const openFileSelector = (e) => {
        e.stopPropagation();
        fileInput.click();
    };


    if (modalImg) modalImg.addEventListener("click", openFileSelector);
    if (changeBtn) changeBtn.addEventListener("click", openFileSelector);


    fileInput.addEventListener("change", async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("profileFile", file);

        try {
            const response = await fetch("/user/uploadProfile", {
                method: "POST",
                body: formData
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(errorText || "업로드 실패");
            }

            // 1. 서버에서 반환한 S3 URL 텍스트 받기
            const newImageUrl = await response.text();
            // 2. 캐시 방지 처리 (URL 뒤에 랜덤값 추가)
            const cacheBusterUrl = newImageUrl + "?t=" + new Date().getTime();

            // 3. 화면상의 이미지 요소들을 모두 찾아 src 교체
            const profileElements = document.querySelectorAll(
                "#profileTrigger img, #modalImgTrigger img, .profileImg img, .user-profile-img"
            );

            if (profileElements.length > 0) {
                profileElements.forEach(img => {
                    img.src = cacheBusterUrl; // 이미지 소스 교체
                });
                console.log("화면 모든 프로필 이미지 즉시 갱신 완료:", cacheBusterUrl);
            } else {
                console.warn("업데이트할 이미지 요소를 찾지 못했습니다.");
            }
        } catch (error) {
            console.error("Error:", error);
            alert(error.message);
        } finally {
            // 파일 입력창 초기화 (같은 파일을 다시 선택할 수 있도록)
            fileInput.value = "";
        }
    });

    // 외부 클릭 시 닫기
    document.addEventListener("click", (e) => {
        if (!trigger.contains(e.target)) modal.classList.remove("modal-show");
    });
});