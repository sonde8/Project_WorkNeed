function approve(btn) {
    const requestId = btn.dataset.id;

    if (!confirm("승인하시겠습니까?")) return;

    fetch("/admin/attendance/approve", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "requestId=" + requestId
    })
    .then(res => res.text())
    .then(result => {
        if (result === "success") {
            alert("승인 완료");
            location.reload();
        } else {
            alert("처리 실패");
        }
    });
}

function reject(btn) {
    const requestId = btn.dataset.id;
    const reason = prompt("반려 사유를 입력하세요");

    if (!reason) return;

    fetch("/admin/attendance/reject", {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded"
        },
        body: "requestId=" + requestId + "&reason=" + encodeURIComponent(reason)
    })
    .then(res => res.text())
    .then(result => {
        if (result === "success") {
            alert("반려 처리 완료");
            location.reload();
        } else {
            alert("처리 실패");
        }
    });
}
