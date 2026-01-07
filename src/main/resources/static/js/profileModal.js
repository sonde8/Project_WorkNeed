document.addEventListener("DOMContentLoaded", () => {
    const trigger = document.getElementById("profileTrigger");
    const modal = document.getElementById("profileModal");

    console.log("트리거 요소:", trigger); // null이 나오는지 확인용
    console.log("모달 요소:", modal);     // null이 나오는지 확인용

    if (!trigger || !modal) {
        console.error("요소를 찾을 수 없어 모달 로직을 중단합니다.");
        return;
    }

    trigger.addEventListener("click", (e) => {
        e.stopPropagation();
        console.log("프로필 클릭됨!"); // 클릭이 먹히는지 확인용
        modal.classList.toggle("active");
    });

    document.addEventListener("click", (e) => {
        if (!modal.contains(e.target) && !trigger.contains(e.target)) {
            modal.classList.remove("active");
        }
    });
});