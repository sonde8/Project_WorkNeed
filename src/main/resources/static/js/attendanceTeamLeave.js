document.addEventListener('DOMContentLoaded', () => {

    const prevBtn = document.getElementById('yearPrev');
    const nextBtn = document.getElementById('yearNext');
    const yearEl = document.getElementById('teamYearTitle');

    const nameInput = document.getElementById('nameSearch');
    const searchBtn = document.getElementById('searchBtn');

    const tbody = document.getElementById('teamLeaveTbody');

    if(!prevBtn || !nextBtn || !yearEl || !tbody) return;

    // 해당 연도
    let curYear = new Date().getFullYear();

    yearEl.textContent = String(curYear);

    // 당일 근무시간
    const DAY_MN = 8 * 60;

    // 연차 타입
    function leaveTypeLabel(code){

        if(code === 'ANNUAL') return '연차';
        if(code === 'HALF_AM') return '오전 반차';
        if(code === 'HALF_PM') return '오후 반차';

        return code ?? '';
    }

    // 날짜
    function mdDat(s){

        if(!s) return '';

        const pats = String(s).split('-');

        if(pats.length < 3) return s;

        return `${pats[1]}.${pats[2]}`;
    }

    function daLabels(start, end){
        const s = start ?? end;
        const e = end ?? start;

        if (s && e && s !== e) return `${mdDat(s)} ~ ${mdDat(e)}`;
        return mdDat(s);
    }

    // 시간
    function timeBType(code){

        if (code === 'HALF_AM') return { start:'09:00', end:'13:00' };
        if (code === 'HALF_PM') return { start:'14:00', end:'18:00' };

        return { start:'09:00', end:'18:00' };
    }

    function minutesBType(code, daysNum){

        if (code === 'HALF_AM' || code === 'HALF_PM') return 4 * 60;

        return Math.round((Number(daysNum || 0)) * DAY_MN);
    }

    function minTDH(min) {

        const n = Math.max(0, Number(min || 0));
        const h = Math.floor(n / 60);
        const m = n % 60;

        return `${h}시간 ${m}분`;
    }

    // 연차 조회
    async function fetchTeemLeave(year, name){

        const q = new URLSearchParams();

        q.set('year', String(year));

        if (name && name.trim()) q.set('name', name.trim());

        const rs = await fetch(`/api/team/leave?${q.toString()}`);

        if (!rs.ok){

            const msg = await rs.text().catch(()=> '');
            throw new Error(msg || '부서 연차 조회 실패');
        }
        return await rs.json();
    }

    function renderEty(msg){

        tbody.innerHTML = '';

        const tre = document.createElement('tr');

        tre.innerHTML = `<td colspan="7" style="padding:40px 10px; font-size:16px;">${msg}</td>`;

        tbody.appendChild(tre);
    }

    async function render() {

        yearEl.textContent = String(curYear);

        let list;

        try {

            list = await fetchTeemLeave(curYear, nameInput?.value || '');

        } catch (e) {

            console.error(e);
            renderEty('사용 내역을 불러오지 못했습니다.');
            return;
        }

        tbody.innerHTML = '';

        if (!list || list.length === 0) {

            renderEty('사용 내역이 없습니다.');

            return;
        }

        list.forEach((r) => {
            const dateText = daLabels(r.startDate, r.endDate);

            const code = r.leaveType ?? '';
            const typeText = leaveTypeLabel(code);

            const t = timeBType(code);

            const daysNum = Number(r.days ?? 0);
            const minutes = minutesBType(code, daysNum);

            const statusCode = r.status ?? '';
            const statusText = statusLabel(statusCode);

            function statusLabel(code){

                if (code === 'APPROVED') return '승인 완료';
                if (code === 'PENDING')  return '대기 중';
                if (code === 'REJECTED') return '반려';

                return code ?? '';
            }

            const displayName = `${r.userName ?? ''}(${r.rankName ?? ''})`;

            const reasonText = r.reason ?? '';


            const tr = document.createElement('tr');

            tr.innerHTML = `
                <td>${dateText}</td>
                <td>${displayName}</td>
                <td>${typeText}</td>
                <td>${t.start}</td>
                <td>${t.end}</td>
                <td class="reasonCell">${reasonText}</td>
                <td class="status ${String(statusCode).toLowerCase()}">${statusText}</td>
               
            `;

            tbody.appendChild(tr);
        });
    }

    // 년도
    prevBtn.addEventListener('click', () => { curYear--; render(); });
    nextBtn.addEventListener('click', () => { curYear++; render(); });

    // 검색
    searchBtn?.addEventListener('click', (e) => {

        e.preventDefault();

        render();
    });

    nameInput?.addEventListener('keydown', (e) => {

            if (e.key === 'Enter') {

                e.preventDefault();

                render();
            }
    });

    render();

});