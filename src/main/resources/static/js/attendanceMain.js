
document.addEventListener('DOMContentLoaded', () => {   // html 다 만들어진 후에 실행 보장

    // 오른쪽 날짜
    function MonthWeek(date = new Date()){

        const year = date.getFullYear();
        const month = date.getMonth();
        const day = date.getDate();

        // 시작일
        const firstDayMonth = new Date(year, month, 1);
        const firthDayWeek = firstDayMonth.getDay();
        const firstWeekStart = new Date(year, month, 1 - firthDayWeek);
        const difDay = Math.floor((date - firstWeekStart) / (1000*60*60*24));
        const week = Math.floor(difDay / 7) +1;

        return {
            year,
            month: month +1,
            week
        };
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
        const nextDay = new Date(
            now.getFullYear(),
            now.getMonth(),
            now.getDate() + 1,
            0, 0, 1
        );

        setTimeout(() => {
                renderYearMonthWeek();
                UpdateMonthWeek();
            }, nextDay - now);
    })();





});
