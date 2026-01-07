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


   fileInput.addEventListener("change", (e) => {
       const file = e.target.files[0];
       if (file) {
           // 사진이 선택되면 바로 폼을 서버로 보냅니다!
           const form = document.getElementById("profileUploadForm");
           form.submit();
       }
   });

    // 외부 클릭 시 닫기
    document.addEventListener("click", (e) => {
        if (!trigger.contains(e.target)) modal.classList.remove("modal-show");
    });
});