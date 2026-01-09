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

    const weekKor = ['일', '월', '화', '수', '목', '금', '토'];

    function pad(n) {
        return String(n).padStart(2, '0');
    }

    function toYMD(v){
        if (!v) return '';
        if (typeof v === 'string') {

            if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

            if (v.length >= 10) return v.slice(0, 10);
            return v;
        }

        if (v instanceof Date) {
            return `${v.getFullYear()}-${pad(v.getMonth()+1)}-${pad(v.getDate())}`;
        }
        return String(v);
    }

    function minToLabel(min) {

        if (min == null || min === '') return '';

        const total = Number(min);
        if (!Number.isFinite(total)) return '';
        if (total < 0) return '';
        if (total === 0) return '0분';

        if (total < 60) return `${total}분`;

        const h = Math.floor(total / 60);
        const m = total % 60;

        if (m === 0) return `${h}시간`;
        return `${h}시간 ${m}분`;
    }

    async function loadMonth(year, month) {
        const res = await fetch(`/api/attendance/book?year=${year}&month=${month}`);
        if (!res.ok) return [];
        return await res.json();
    }

    // 월간 출근부 렌더링
    async function render() {
        const year = cur.getFullYear();
        const month = cur.getMonth() + 1;

        // 상단
        ymEl.textContent = `${year}-${month}`;

        const records = await loadMonth(year, month);
        const map = {};
        records.forEach(r => {
            const key = toYMD(r.date ?? r.workDate);
            if (key) map[key] = r;
        });

        const lastDay = new Date(year, month, 0).getDate();
        tbody.innerHTML = '';

        for (let d = 1; d <= lastDay; d++) {
            const date = new Date(year, month - 1, d);
            const key = `${year}-${pad(month)}-${pad(d)}`;
            const rec = map[key] || {};

            const dow = weekKor[date.getDay()];

            let rowClass = '';

            if(dow === '토') rowClass = 'sat-row';
            if(dow === '일') rowClass = 'sun-row';

            const type = rec.type ?? '';
            const normType = String(type).replace(/\s+/g, '');

            const isLeave = ['연차', '휴가', '병가'].includes(normType);

            const leaveRowClass = isLeave ? 'leave-row' : '';

            const otVal = rec.otMin ?? rec.overtimeMin ?? rec.overtimeMinutes ?? rec.overtime_minutes ?? 0;
            const workVal = rec.workMin ?? rec.workMinutes ?? rec.work_minutes ?? 0;

            const hasInOut = Boolean(rec.checkIn) || Boolean(rec.checkOut);

            const otLabel   = (isLeave || !hasInOut) ? '' : minToLabel(otVal);
            const workLabel = (isLeave || !hasInOut) ? '' : minToLabel(workVal);

            const typeClass = (type === '지각') ? 'type-late' : '';

            const tr = document.createElement('tr');

            tr.className = [rowClass, leaveRowClass].filter(Boolean).join(' ');

            tr.innerHTML = `
                <td>${d} (${dow})</td>
                <td class="${type ? typeClass : ''}">${type}</td>
                <td>${rec.checkIn ?? ''}</td>
                <td>${rec.checkOut ?? ''}</td>
                <td>${otLabel}</td>
                <td>${workLabel}</td>
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
