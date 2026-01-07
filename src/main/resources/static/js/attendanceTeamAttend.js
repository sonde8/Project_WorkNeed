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

    function weekCell(w){
        if(!w) w = { normal:'0h 0m', overtime:'0h 0m', holiday:'0h 0m', late:0 };
        return `
      <div>정상: ${w.normal}</div>
      <div>연장: ${w.overtime}</div>
      <div>휴일: ${w.holiday}</div>
      <div>지각: ${w.late}</div>
    `;
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
        <td>${row.monthTotal ?? '0h 0m'}</td>
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