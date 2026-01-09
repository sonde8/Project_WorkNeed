document.addEventListener('DOMContentLoaded', () => {

    /* ===============================
       DOM 요소
    =============================== */
    const tbody = document.getElementById('bookTbody');
    const ymEl = document.getElementById('bookYm');
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');

    // 모달 관련 요소
    const modal = document.getElementById('attendanceRequestModal');
    const openBtn = document.getElementById('openRequestBtn');
    const closeBtn = document.getElementById('closeModal');

    // 입력 필드 요소
    const typeSelect = document.getElementById('reqType');      // 유형 선택 (Select)
    const dateInput = document.getElementById('reqWorkDate');   // 수정할 날짜
    const startTimeInput = document.getElementById('reqStartTime'); // 시작 시간
    const endTimeInput = document.getElementById('reqEndTime');     // 종료 시간
    const reasonInput = document.getElementById('reqReason');   // 사유
    const submitBtn = document.getElementById('submitRequest'); // 등록 버튼

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
       출근부 기본 설정 및 유틸 함수
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
       모달 제어 (Leave 스타일 반영)
    =============================== */
    openBtn.onclick = () => modal.hidden = false;

    const hideModal = () => { modal.hidden = true; };
    if (closeBtn) closeBtn.onclick = hideModal;

    // 배경 클릭 시 닫기
    modal.addEventListener('click', (e) => {
        if (e.target === modal || e.target.id === 'closeModalBack') hideModal();
    });

    /* ===============================
       근태 수정 요청 등록 (로직 강화)
    =============================== */
    submitBtn.onclick = () => {
        const type = typeSelect ? typeSelect.value : '기본';
        const workDate = dateInput.value;
        const startTime = startTimeInput.value;
        const endTime = endTimeInput.value;
        const reason = reasonInput.value.trim();

        // 1. 필수 입력 체크
        if (!workDate || !startTime || !endTime || !reason) {
            alert('모든 항목을 입력해주세요.');
            return;
        }

        // 2. 날짜 제약 체크
        if (workDate < lastYearStr || workDate > todayStr) {
            alert('날짜는 최근 1년 이내만 선택할 수 있습니다.');
            return;
        }



        // 3. 시간 선후 관계 체크
        if (startTime >= endTime) {
            alert('종료 시간은 시작 시간보다 늦어야 합니다.');
            return;
        }

        // 4. 야간 시간 제한 (22:00 ~ 07:00 차단)
        const startHour = parseInt(startTime.split(':')[0], 10);
        const endHour = parseInt(endTime.split(':')[0], 10);

        if ((startHour >= 22 || startHour < 7) || (endHour >= 22 || endHour < 7)) {
            alert('22:00부터 07:00 사이의 시간은 선택할 수 없습니다.');
            return;
        }

        // 서버 전송 데이터 구성
      const payload = {
          type: type,
          workDate: workDate,
          startTime: startTime,
          endTime: endTime,
          reason: reason
      };

        fetch('/api/attendance/request', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        .then(res => {
            if (!res.ok) throw new Error();
            alert('요청 성공! 관리자 승인을 기다려주세요.');
            hideModal();
            location.reload();
        })
        .catch(() => alert('요청 실패. 내용을 확인하세요.'));
    };

    render();
});