function changeAdminStatus(targetId, currentStatus) {
    const nextStatus = (currentStatus === 'ACTIVE') ? 'SUSPENDED' : 'ACTIVE';
    const msg = nextStatus === 'SUSPENDED'
        ? "해당 관리자를 정지하시겠습니까?"
        : "정지를 해제하시겠습니까?";

    if (!confirm(msg)) return;

    fetch('/admin/manage/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
            targetId: targetId,
            status: nextStatus
        })
    })
    .then(res => res.text())
    .then(result => {
        if (result === "success") {
            location.reload();
        } else if (result === "self_error") {
            alert("본인 계정은 정지할 수 없습니다.");
        } else {
            alert("오류가 발생했습니다.");
        }
    });
}