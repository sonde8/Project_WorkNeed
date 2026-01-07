
document.addEventListener('DOMContentLoaded', () => {   // html 다 만들어진 후에 실행 보장

    // 오른쪽 날짜
    function MonthWeek(date = new Date()){

        const year = date.getFullYear();
        const month = date.getMonth();

        // 시작일
        const firstDayMonth = new Date(year, month, 1);
        const firthDayWeek = firstDayMonth.getDay();
        const firstWeekStart = new Date(year, month, 1 - firthDayWeek);
        const difDay = Math.floor((date - firstWeekStart) / (1000*60*60*24));
        const week = Math.floor(difDay / 7) +1;

        return { year, month: month +1, week };
    }

    function renderYearMonthWeek(){
        const el = document.getElementById('yearMonth');
        if(!el) return;

        const {year, month, week} = MonthWeek(new Date());
        el.textContent = `<${year} -${month}   >      ${week} 주차`;
    }

    renderYearMonthWeek();

    // 자동 갱신
    (function UpdateMonthWeek(){
        const now = new Date();
        const nextDay = new Date( now.getFullYear(), now.getMonth(), now.getDate() + 1,
                                    0, 0, 1 );

        setTimeout(() => {  renderYearMonthWeek();
                                        UpdateMonthWeek(); }, nextDay - now);
    })();

    function clamp(n, min, max){
        return Math.max(min, Math.min(max, n));
    }

    function applySummary(s){
        if(!s) return;

        const weekTotalEl = document.getElementById('weekTotal');
        const remainWorkEl = document.getElementById('remainWork');
        const remainOtEl = document.getElementById('remainOt');
        const holidayEl = document.getElementById('holidayWork');

        const baseEl = document.getElementById('weekFillBase');
        const otEl = document.getElementById('weekFillOt');
        const holEl = document.getElementById('weekFillHoliday');
        const dotEl = document.getElementById('barDot');
        const trackEl = document.getElementById('barTrack');

        if(weekTotalEl){ weekTotalEl.textContent = s.weekTotal ?? '0h 0m';}
        if(remainWorkEl) remainWorkEl.textContent = s.remainWork ?? '52h 0m';
        if(remainOtEl) remainOtEl.textContent = s.remainOt ?? '18h 0m';
        if(holidayEl) holidayEl.textContent = s.holidayTotal ?? '0h 0m';

        const weekMin = Number(s.weekWorkMin ?? 0);
        const holidayMin = Number(s.holidayWorkMin ?? 0);

        const maxMin = 70 * 60;
        const base52 = 52 * 60;

        // 전체
        const totalPct = clamp((weekMin / maxMin) * 100, 0, 100);

        // 52시간 초과
        const otMin = Math.max(0, weekMin - base52);
        const otPct = clamp((otMin / maxMin) * 100, 0, 100);

        function pctToWidth(pct){
            if (pct <= 0) return '0';
            return `max(6px, ${pct}%)`;
        }

        // 휴일 근무
        const holPct = clamp((holidayMin / maxMin) * 100, 0, totalPct);

        if(baseEl) baseEl.style.width = pctToWidth(totalPct);
        if(otEl) otEl.style.width = `${otPct}%`;
        if(holEl) holEl.style.width = `${holPct}%`;

        if(dotEl) dotEl.style.left = `${totalPct}%`;

    }

    window.addEventListener('attendance:summary', (e) => {
        applySummary(e.detail);
    });


    (async function(){
        const res = await fetch('/api/attendance/summary');
        if(!res.ok) return;
        const s = await res.json();
        applySummary(s);
    })();

});


