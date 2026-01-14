document.addEventListener('DOMContentLoaded', () => {
    const tbody = document.getElementById('teamAttendTbody');
    const titleEl = document.getElementById('monthTitle');
    const prevBtn = document.getElementById('prevMonth');
    const nextBtn = document.getElementById('nextMonth');

    if(!tbody || !titleEl) return;

    // 지금 날짜
    const now  = new Date();

    let y = now.getFullYear();
    let m = now.getMonth() +1;

    function renderTitle(){
        titleEl.textContent = `${y}-${m}`;
    }

    function toMiniHM(v){
        if (v == null || v === '') return '-';

        let totalMin;

        if (typeof v === 'number') {
            totalMin = v;
        } else {
            const s = String(v).trim();

            if (s.includes('시간') || s.includes('분')) {
                const h = (s.match(/(\d+)\s*시간/)?.[1] ?? '0') * 1;
                const m = (s.match(/(\d+)\s*분/)?.[1] ?? '0') * 1;
                totalMin = h * 60 + m;
            } else {
                const h = (s.match(/(\d+)\s*h/i)?.[1] ?? '0') * 1;
                const m = (s.match(/(\d+)\s*m/i)?.[1] ?? '0') * 1;
                totalMin = h * 60 + m;
            }
        }

        if (!Number.isFinite(totalMin) || totalMin <= 0) return '-';

        const h = Math.floor(totalMin / 60);
        const m = totalMin % 60;

        if (h === 0) return `${m}분`;
        if (m === 0) return `${h}시간`;
        return `${h}시간 ${m}분`;
    }

    function weekCell(w){
        if(!w) w = { normal:'0h 0m', overtime:'0h 0m', holiday:'0h 0m', late:0 };

        const lines = [];

        const normal = toMiniHM(w.normal);
        if (normal !== '-') {
            lines.push(`<div>정상: ${normal}</div>`);
        }

        const overtime = toMiniHM(w.overtime);
        if (overtime !== '-') {
            lines.push(`<div>연장: ${overtime}</div>`);
        }

        const holiday = toMiniHM(w.holiday);
        if (holiday !== '-') {
            lines.push(`<div>휴일: ${holiday}</div>`);
        }

        if (w.late > 0) {
            const lateClass = (w.late >= 3) ? 'late-red'
                : (w.late === 2) ? 'late-yellow'
                    : 'late-green'

            lines.push(`<div class="late ${lateClass}">지각: ${w.late}</div>`);
        }

        if (lines.length === 0) {
            return `<div class="empty">-</div>`;
        }

        return lines.join('');
    }


    async function load(){
        const res = await fetch(`/api/attendance/attendTeam?year=${y}&month=${m}`);
        if(!res.ok){
            tbody.innerHTML = '';
            return;
        }

        const list = await res.json();

        tbody.innerHTML = list.map(row => `
      <tr>
        <td>${row.nameWithRank ?? ''}</td>
        <td>${toMiniHM(row.monthTotal ?? '0h 0m')}</td>
        <td class="weekCell">${weekCell(row.w1)}</td>
        <td class="weekCell">${weekCell(row.w2)}</td>
        <td class="weekCell">${weekCell(row.w3)}</td>
        <td class="weekCell">${weekCell(row.w4)}</td>
        <td class="weekCell">${weekCell(row.w5)}</td>
      </tr>
    `).join('');
    }

    // 이전 달
    prevBtn?.addEventListener('click', () => {
        m--;
        if(m === 0){ m = 12; y--; }
        renderTitle();
        load();
    });

    // 다음 달
    nextBtn?.addEventListener('click', () => {
        m++;
        if(m === 13){ m = 1; y++; }
        renderTitle();
        load();
    });

    renderTitle();

    load();
});