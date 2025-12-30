document.addEventListener('DOMContentLoaded', () => {

    const yearEl = document.getElementById('leaveYear');
    const prevBtn = document.getElementById('prevYear');
    const nextBtn = document.getElementById('nextYear');

    const totalEl = document.getElementById('totalLeave');
    const usedEl = document.getElementById('usedLeave');
    const remainEl = document.getElementById('remainLeave');
    const carryEl = document.getElementById('carryLeave');

    const tbody = document.getElementById('leaveTbody');
    const checkAll = document.getElementById('leaveCheckAll');

    const approveBtn = document.getElementById('approveLeave');

    if(!yearEl || !prevBtn || !nextBtn || !tbody) return;

    let curYear = new Date().getFullYear();

    // 표시용(1일=8시간=480분)
    const DAY_MIN = 8 * 60;
    function minToDH(min){
        const d = Math.floor(min / DAY_MIN);
        const h = Math.floor((min % DAY_MIN) / 60);
        return `${d}d ${h}h`;
    }

    function loadSummary(year){
        return { totalMin: 0, usedMin: 0, carryMin: 0 };
    }
    function loadRecords(year){
        return [];
    }

    function render(){
        yearEl.textContent = `${curYear}`;

        const sum = loadSummary(curYear);
        const totalMin = sum.totalMin || 0;
        const usedMin  = sum.usedMin  || 0;
        const carryMin = sum.carryMin || 0;
        const remainMin = Math.max(0, totalMin + carryMin - usedMin);

        if(totalEl) totalEl.textContent = minToDH(totalMin);
        if(usedEl) usedEl.textContent = minToDH(usedMin);
        if(carryEl) carryEl.textContent = minToDH(carryMin);
        if(remainEl) remainEl.textContent = minToDH(remainMin);

        const rec = loadRecords(curYear);
        tbody.innerHTML = '';

        if(rec.length === 0){
            const tr = document.createElement('tr');
            tr.innerHTML = `
              <td colspan="7" style="padding: 40px 10px; font-size: 16px;">
                사용 내역이 없습니다.
              </td>
            `;
            tbody.appendChild(tr);
        }else{
            rec.forEach((r) => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                  <td class="colCheck"><input type="checkbox" class="rowCheck"></td>
                  <td>${r.date}</td>
                  <td>${r.type}</td>
                  <td>${r.start || ''}</td>
                  <td>${r.end || ''}</td>
                  <td>${minToDH(r.minutes || 0)}</td>
                  <td>${r.status || ''}</td>
                `;
                tbody.appendChild(tr);
            });
        }

        if(checkAll) checkAll.checked = false;
    }

    prevBtn.addEventListener('click', () => {
        curYear -= 1;
        render();
    });

    nextBtn.addEventListener('click', () => {
        curYear += 1;
        render();
    });

    if(checkAll){
        checkAll.addEventListener('change', () => {
            const checked = checkAll.checked;
            document.querySelectorAll('.rowCheck').forEach(chk => chk.checked = checked);
        });
    }

    if(approveBtn){
        approveBtn.addEventListener('click', () => {
            // TODO: 팀원 전자결재 작성 URL로 바꿔주기
            // 예: /approval/write?type=LEAVE
            location.href = '/approval/write?type=LEAVE';
        });
    }

    render();
});
