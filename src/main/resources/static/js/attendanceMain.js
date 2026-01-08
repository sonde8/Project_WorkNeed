
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
        el.textContent = `<${year} -${month}>      ${week} 주차`;
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

    // 근태 현황, 잔여연차, 연간 근무
    (async function(){

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth() + 1;

        // 월 근태현황
        const r1 = await fetch(`/api/attendance/month-summary?year=${year}&month=${month}`);
        if(r1.ok){
            renderMonthAttend(await r1.json());
        }

        // 잔여연차
        const r2 = await fetch(`/api/leave/summary?year=${year}`);
        if (r2.ok) {
            const leave = await r2.json();
            console.log('leave summary:', leave);

            const parseLeave = (v) => {

                if (v == null) return { days: 0 };

                if (typeof v === 'number') return { days: v };

                if (typeof v === 'string') {

                    const dMatch = v.match(/(\d+(?:\.\d+)?)\s*(d|일)/i);
                    const hMatch = v.match(/(\d+(?:\.\d+)?)\s*(h|시간)/i);

                    if (dMatch || hMatch) {
                        const d = dMatch ? parseFloat(dMatch[1]) : 0;
                        const h = hMatch ? parseFloat(hMatch[1]) : 0;

                        return { days: d + (h / 8) };
                    }

                    const n = parseFloat(v.replace(/[^\d.]/g, ''));
                    return { days: Number.isFinite(n) ? n : 0 };
                }

                return { days: 0 };
            };

            const totalRaw = leave.totalDays ?? leave.total ?? leave.totalLeave ?? 0;
            const usedRaw  = leave.usedDays  ?? leave.used  ?? leave.usedLeave  ?? 0;

            const total = parseLeave(totalRaw).days;
            const used  = parseLeave(usedRaw).days;

            renderLeave({ total, used });
        }


        // 연간근무
        const r3 = await fetch(`/api/attendance/year-summary?year=${year}`);
        if(r3.ok){
            renderYearWork(await r3.json());
        }
    })();


    // 평일 수 계산
    function monthWeekdaysCount(year, month){

        const first = new Date(year, month - 1, 1);
        const last = new Date(year, month, 0);
        let cnt = 0;

        for(let d = new Date(first); d <= last; d.setDate(d.getDate() + 1)){

            const day = d.getDay();

            if(day !== 0 && day !== 6) cnt++;
        }
        return cnt;
    }

    // 근태 현황 점
    function setAttendDot(lateCount){

        const dot = document.getElementById('attBadge');

        if(!dot) return;

        dot.classList.remove('badge-ok', 'badge-warn', 'badge-danger');

        if(lateCount >= 3){

            dot.classList.add('badge-danger');
            dot.title = '경고';

        } else if(lateCount === 2){

            dot.classList.add('badge-warn');
            dot.title = '주의';

        } else {
            dot.classList.add('badge-ok');
            dot.title = '정상';
        }
    }

    // 근태 현황
    function renderMonthAttend(data){

        const year = data.year;
        const month = data.month;

        const weekdays = monthWeekdaysCount(year, month);

        const workDays = data.workDays ?? 0;
        const lateCount = data.lateCount ?? 0;
        const earlyCount = data.earlyCount ?? 0;

        const elWorkDays = document.getElementById('attWorkDays');
        const elWeekdays = document.getElementById('attWeekdays');
        const elLate = document.getElementById('attLate');
        const elEarly = document.getElementById('attEarly');

        if(elWorkDays) elWorkDays.textContent = workDays;
        if(elWeekdays) elWeekdays.textContent = weekdays;
        if(elLate) elLate.textContent = lateCount;
        if(elEarly) elEarly.textContent = earlyCount;

        setAttendDot(lateCount);
    }

    // 잔여 연차
    function renderLeave(data){

        const total = Number(data.total ?? 0);
        const used = Number(data.used ?? 0);

        const remain = Math.max(0, total - used);
        const rate = total > 0 ? Math.min(100, Math.max(0, (remain / total) * 100)) : 0;

        const toDayHour = (daysFloat) => {
            const d = Math.floor(daysFloat);
            let h = Math.round((daysFloat - d) * 8);

            if (h >= 8) return `${d + 1}일`;
            if (d === 0 && h > 0) return `${h}시간`;
            if (h === 0) return `${d}일`;

            return `${d}일 ${h}시간`;
        };

        const elTotal = document.getElementById('leaveTotal');
        const elUsed = document.getElementById('leaveUsed');
        const elRemain = document.getElementById('leaveRemain');
        const elRateText = document.getElementById('leaveRateText');
        const elRateBar = document.getElementById('leaveRateBar');

        if(elTotal)  elTotal.textContent  = toDayHour(total);
        if(elUsed)   elUsed.textContent   = toDayHour(used);
        if(elRemain) elRemain.textContent = toDayHour(remain);

        if(elRateText) elRateText.textContent = `${Math.round(rate)}%`;
        if(elRateBar)  elRateBar.style.width = `${rate}%`;
    }

    // 연간 근무
    function renderYearWork(data){

        const elWork = document.getElementById('yearWork');
        const elOt = document.getElementById('yearOtt');     // HTML id 그대로 yearOtt
        const elHoliday = document.getElementById('yearHoliday');

        if(elWork) elWork.textContent = data.workHours ?? 0;
        if(elOt) elOt.textContent = data.otHours ?? 0;
        if(elHoliday) elHoliday.textContent = data.holidayHours ?? 0;
    }



});


