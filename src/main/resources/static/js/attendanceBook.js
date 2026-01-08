document.addEventListener('DOMContentLoaded', () => {

    /* ===============================
       DOM 요소
    =============================== */
    const tbody = document.getElementById('bookTbody');
    const ymEl = document.getElementById('bookYm');
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');

    const modal = document.getElementById('attendanceRequestModal');
    const openBtn = document.getElementById('openRequestBtn');
    const closeBtn = document.getElementById('closeModal');

    const dateInput = document.getElementById('reqWorkDate');
    const submitBtn = document.getElementById('submitRequest');



    if (!tbody || !ymEl || !prevBtn || !nextBtn || !dateInput) return;

    /* ===============================
       날짜 제약 (오늘 기준 최근 1년)
    =============================== */
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    const todayStr = `${yyyy}-${mm}-${dd}`;

    const lastYear = new Date(today);
    lastYear.setFullYear(today.getFullYear() - 1);
    const ly = lastYear.getFullYear();
    const lm = String(lastYear.getMonth() + 1).padStart(2, '0');
    const ld = String(lastYear.getDate()).padStart(2, '0');
    const lastYearStr = `${ly}-${lm}-${ld}`;

    dateInput.min = lastYearStr;
    dateInput.max = todayStr;
    dateInput.value = todayStr;

    /* ===============================
       출근부 기본 설정
    =============================== */
    let cur = new Date();
    cur.setDate(1);

    const weekKor = ['일', '월', '화', '수', '목', '금', '토'];

    function pad(n) {
        return String(n).padStart(2, '0');
    }

    function toYMD(v) {
        if (!v) return '';
        if (typeof v === 'string') return v.slice(0, 10);
        if (v instanceof Date) {
            return `${v.getFullYear()}-${pad(v.getMonth()+1)}-${pad(v.getDate())}`;
        }
        return '';
    }

    function minToLabel(min) {
        const total = Number(min);
        if (!Number.isFinite(total) || total <= 0) return '';
        if (total < 60) return `${total}분`;
        const h = Math.floor(total / 60);
        const m = total % 60;
        return m === 0 ? `${h}시간` : `${h}시간 ${m}분`;
    }

    async function loadMonth(year, month) {
        const res = await fetch(`/api/attendance/book?year=${year}&month=${month}`);
        if (!res.ok) return [];
        return await res.json();
    }

    /* ===============================
       출근부 렌더링
    =============================== */
    async function render() {
        const year = cur.getFullYear();
        const month = cur.getMonth() + 1;
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
            if (dow === '토') rowClass = 'sat-row';
            if (dow === '일') rowClass = 'sun-row';

            const type = rec.type ?? '';
            const isLeave = ['연차', '휴가', '병가'].includes(type.replace(/\s+/g, ''));

            const otLabel = isLeave ? '' : minToLabel(rec.otMin ?? 0);
            const workLabel = isLeave ? '' : minToLabel(rec.workMin ?? 0);

            const tr = document.createElement('tr');
            tr.className = [rowClass, isLeave ? 'leave-row' : ''].join(' ').trim();

            tr.innerHTML = `
                <td>${d} (${dow})</td>
                <td>${type}</td>
                <td>${rec.checkIn ?? ''}</td>
                <td>${rec.checkOut ?? ''}</td>
                <td>${otLabel}</td>
                <td>${workLabel}</td>
            `;
            tbody.appendChild(tr);
        }
    }

    /* ===============================
       월 이동
    =============================== */
    prevBtn.onclick = () => {
        cur.setMonth(cur.getMonth() - 1);
        cur.setDate(1);
        render();
    };

    nextBtn.onclick = () => {
        cur.setMonth(cur.getMonth() + 1);
        cur.setDate(1);
        render();
    };

    /* ===============================
       모달 제어 (hidden 방식)
    =============================== */
    openBtn.onclick = () => modal.hidden = false;
    closeBtn.onclick = () => modal.hidden = true;

    modal.addEventListener('click', (e) => {
        if (e.target === modal) modal.hidden = true;
    });

    /* ===============================
       근태 수정 요청 등록
    =============================== */
    submitBtn.onclick = () => {

         const title = document.getElementById('reqTitle').value.trim();
         const workDate = dateInput.value;
         const reason = document.getElementById('reqReason').value.trim();

       // 필수 입력 체크
           if (!title) {
               alert('제목을 입력하세요.');
               return;
           }

           if (!workDate) {
               alert('날짜를 선택하세요.');
               return;
           }

           if (!reason) {
               alert('사유를 입력하세요.');
               return;
           }

           //
           if (workDate < lastYearStr || workDate > todayStr) {
               alert('날짜는 최근 1년 이내만 선택할 수 있습니다.');
               return;
           }

        fetch('/attendance/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title, workDate, reason })
        })
        .then(res => {
            if (!res.ok) throw new Error();
            alert('요청 성공! 관리자 승인을 기다려주세요.');
            modal.hidden = true;
            location.reload();
        })
        .catch(() => alert('요청 실패. 내용을 확인하세요.'));
    };
    render();
});
