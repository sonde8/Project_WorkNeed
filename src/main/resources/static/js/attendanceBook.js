document.addEventListener('DOMContentLoaded', () => {

    const tbody = document.getElementById('bookTbody');
    const ymEl = document.getElementById('bookYm');
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');

    const modal = document.getElementById('attendanceRequestModal');
    const openBtn = document.getElementById('openRequestBtn');
    const closeBtn = document.getElementById('closeModal');

    if (!tbody || !ymEl || !prevBtn || !nextBtn) return;

    // 현재 월
    let cur = new Date();
    cur.setDate(1);

    // records 불러오기
    function loadRecords() {
        try {
            return JSON.parse(localStorage.getItem('attendance.records')) || {};
        } catch (e) {
            return {};
        }
    }

    const weekKor = ['일', '월', '화', '수', '목', '금', '토'];

    function pad(n) {
        return String(n).padStart(2, '0');
    }

    function ymd(y, m, d) {
        return `${y}-${pad(m)}-${pad(d)}`;
    }

    function minToLabel(min) {
        if (min == null || min === '') return '';
        const h = Math.floor(min / 60);
        const m = min % 60;
        return `${h}시간 ${m}분`;
    }

    // 월간 출근부 렌더링
    function render() {
        const year = cur.getFullYear();
        const month = cur.getMonth() + 1;

        // 상단
        ymEl.textContent = `${year}-${month}`;

        const records = loadRecords();
        const lastDay = new Date(year, month, 0).getDate();

        tbody.innerHTML = '';

        for (let d = 1; d <= lastDay; d++) {
            const date = new Date(year, month - 1, d);
            const key = ymd(year, month, d);
            const rec = records[key] || {};

            const dow = weekKor[date.getDay()];

            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${d} (${dow})</td>
                <td>${rec.type ?? ''}</td>
                <td>${rec.checkIn ?? ''}</td>
                <td>${rec.checkOut ?? ''}</td>
                <td>${minToLabel(rec.otMin)}</td>
                <td>${minToLabel(rec.workMin)}</td>
            `;
            tbody.appendChild(tr);
        }
    }

    // ◀ 이전 달
    prevBtn.addEventListener('click', () => {
        cur.setMonth(cur.getMonth() - 1);   // 연도 자동 처리
        cur.setDate(1);
        render();
    });

    // ▶ 다음 달
    nextBtn.addEventListener('click', () => {
        cur.setMonth(cur.getMonth() + 1);   // 12월 → 1월 자동 처리
        cur.setDate(1);
        render();
    });

    openBtn.onclick = () => modal.style.display = 'block';
    closeBtn.onclick = () => modal.style.display = 'none';

    // 모달 바깥쪽 클릭 시 닫기
    window.onclick = (event) => {
        if (event.target == modal) modal.style.display = 'none';
    };

    // 2. 등록 버튼 클릭 시 서버로 요청 전송
    document.getElementById('submitRequest').onclick = function() {
        // 폼 데이터 수집
        const requestData = {
            title: document.getElementById('reqTitle').value,
            workDate: document.getElementById('reqStartDate').value,
            fromTime: document.getElementById('reqStartTime').value,
            toTime: document.getElementById('reqEndTime').value,
            reason: document.getElementById('reqReason').value
        };

        // 서버의 AttendanceRequestService 호출 (JSON 전송)
        fetch('/attendance/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestData)
        })
        .then(response => {
            if (response.ok) {
                alert("요청 성공! 관리자 승인을 기다려주세요.");
                modal.style.display = 'none';
                location.reload(); // 성공 시 새로고침
            } else {
                alert("요청 실패. 내용을 다시 확인해주세요.");
            }
        })
        .catch(error => console.error('Error:', error));
    };



    // 최초 렌더링
    render();
});
