document.addEventListener('DOMContentLoaded', () => {
    const cells = document.querySelectorAll('.payload-cell');

    cells.forEach(cell => {
        const rawJsonEl = cell.querySelector('.raw-json');
        const displayDiv = cell.querySelector('.parsed-display');

        if (!rawJsonEl || !displayDiv) return;

        try {
            const data = JSON.parse(rawJsonEl.textContent);
            
            // 관리자 화면에 보일 상세 내용 구성
            displayDiv.innerHTML = `
                <div style="font-weight: bold; margin-bottom: 5px;">
                    [사유] ${data.reason || '입력된 사유 없음'}
                </div>
                <div style="font-size: 0.85em; color: #666;">
                    변경 시간: ${data.fromTime} ~ ${data.toTime} (${data.workDate})
                </div>
            `;
        } catch (e) {
            // JSON 파싱 에러 시 원본 텍스트 노출
            displayDiv.textContent = rawJsonEl.textContent;
        }
    });
});

/**
 * 2. 승인 처리
 */
function approve(btn) {
    const requestId = btn.dataset.id; // 버튼의 data-id 값 가져오기

    if (!confirm("해당 요청을 승인하시겠습니까?")) return;

    fetch("/admin/attendance/approve", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "requestId=" + encodeURIComponent(requestId)
    })
        .then(async (res) => {
            const text = await res.text(); // ✅ 500이어도 본문 읽음

            if (!res.ok) {
                // ✅ 서버에서 터진 실제 원인 일부가 여기 찍힘
                alert(`서버 오류 ${res.status}\n\n${text}`);
                return;
            }

            if (text.trim() === "success") {
                alert("정상적으로 승인되었습니다.");
                location.reload();
            } else {
                alert("승인 실패: " + text);
            }
        })
        .catch(err => alert("네트워크 오류: " + err));
}

/**
 * 3. 반려 처리
 */
function reject(btn) {
    const requestId = btn.dataset.id;
    const reason = prompt("반려 사유를 입력하세요.");

    if (!reason) return; // 취소 누르면 중단

    fetch("/admin/attendance/reject", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: "requestId=" + requestId + "&reason=" + encodeURIComponent(reason)
    })
    .then(res => res.text())
    .then(result => {
        if (result === "success") {
            alert("반려 처리가 완료되었습니다.");
            location.reload();
        } else {
            alert("반려 처리 중 오류가 발생했습니다.");
        }
    })
    .catch(err => console.error("Error:", err));
}