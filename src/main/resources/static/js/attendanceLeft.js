    document.addEventListener('DOMContentLoaded', () => {

        // 오늘 날짜 키
        function todayKey(){
            const da = new Date();
            const yyyy = da.getFullYear();
            const mm = String(da.getMonth() + 1).padStart(2, '0');
            const dd = String(da.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        }

        // 현재 시간 문자열
        function nowTimeString(){
            const now = new Date();
            const hh = String(now.getHours()).padStart(2, '0');
            const mm = String(now.getMinutes()).padStart(2, '0');
            const ss = String(now.getSeconds()).padStart(2, '0');
            return `${hh} : ${mm} : ${ss}`;
        }

        // 출근부 저장용
        function loadRecords(){
            try{
                return JSON.parse(localStorage.getItem('attendance.records')) || {};
            } catch (e) {
                return {};
            }
        }

        function saveRecords(obj){
            localStorage.setItem('attendance.records', JSON.stringify(obj));
        }

        function toHHMM(full){
            return full.replaceAll(' ', '').slice(0, 5);
        }

        // HH:MM -> minutes
        function toMin(hhmm){
            const [h, m] = hhmm.split(':').map(Number);
            return h * 60 + m;
        }

        function calcWork(inHHMM, outHHMM){
            const inMin = toMin(inHHMM);
            const outMin = toMin(outHHMM);

            const workMin = Math.max(0, diff - lunch);

            const otBase = toMin("18:00");
            const otMin = Math.max(0, outMin - Math.max(otBase, inMin));

            return { workMin, otMin };
        }


        // 왼쪽 엘리먼트
        const clockEl = document.getElementById('clock');
        const checkInEl = document.getElementById('checkIn');
        const checkOutEl = document.getElementById('checkOut');
        const monthTotalEl = document.getElementById('monthTotal');

        const checkInBtn = document.getElementById('checkInBtn');
        const checkOutBtn = document.getElementById('checkOutBtn');

        const stateBtn = document.getElementById('stateBtn');
        const stateWrap = document.getElementById('stateWrap');
        const stateTextEl = document.getElementById('stateText');


        if (!clockEl || !checkInBtn || !checkOutBtn || !stateBtn || !stateWrap || !stateTextEl) return;

        // 시계
        function updateClock(){
            clockEl.textContent = nowTimeString();
        }
        updateClock();
        setInterval(updateClock, 1000);

        // UI 초기화
        function resetUI() {
            if (checkInEl) checkInEl.textContent = '미등록';
            if (checkOutEl) checkOutEl.textContent = '미등록';
            if (monthTotalEl) monthTotalEl.textContent = '미등록';
            stateTextEl.textContent = '업무 상태 변경하기';

            checkInBtn.disabled = false;
            checkInBtn.textContent = '출 근 하 기';

            checkOutBtn.disabled = true;
            checkOutBtn.textContent = '퇴 근 하 기';
        }

        // 하루 저장 제거 (DB 붙이면 여기 제거/교체)
        function clearToday(){
            localStorage.removeItem('attendanceDate');
            localStorage.removeItem('checkInTime');
            localStorage.removeItem('checkOutTime');
            localStorage.removeItem('workStatus');
        }

        function ensureTodayStorage() {
            const savedDate = localStorage.getItem('attendanceDate');
            const today = todayKey();

            if (savedDate !== today) {
                clearToday();
                resetUI();
                localStorage.setItem('attendanceDate', today);
            }
        }

        function setStatus(status){
            stateTextEl.textContent = status;
            localStorage.setItem('workStatus', status);
        }

        function setCheckInTime(t){
            if(checkInEl) checkInEl.textContent = t;
            localStorage.setItem('checkInTime', t);
            localStorage.setItem('attendanceDate', todayKey());
        }

        function setCheckOutTime(t){
            if(checkOutEl) checkOutEl.textContent = t;
            localStorage.setItem('checkOutTime', t);
            localStorage.setItem('attendanceDate', todayKey());
        }

        function buttonByState(){
            const inTime = localStorage.getItem('checkInTime');
            const outTime = localStorage.getItem('checkOutTime');

            if(inTime){
                checkInBtn.disabled = true;
                checkInBtn.textContent = '출 근 완 료';
            } else {
                checkInBtn.disabled = false;
                checkInBtn.textContent = '출 근 하 기';
            }

            if(!inTime){
                checkOutBtn.disabled = true;
                checkOutBtn.textContent = '퇴 근';
            } else if(outTime){
                checkOutBtn.disabled = true;
                checkOutBtn.textContent = '퇴 근 완 료';
            } else {
                checkOutBtn.disabled = false;
                checkOutBtn.textContent = '퇴 근 하 기';
            }
        }

        // 복원
        (function restore(){
            ensureTodayStorage();

            const savedDate = localStorage.getItem('attendanceDate');
            if(savedDate !== todayKey()) return;

            const saveStatus = localStorage.getItem('workStatus');
            const saveIn = localStorage.getItem('checkInTime');
            const saveOut = localStorage.getItem('checkOutTime');

            stateTextEl.textContent = saveStatus ? saveStatus : '업무 상태 변경하기';
            if(saveIn && checkInEl) checkInEl.textContent = saveIn;
            if(saveOut && checkOutEl) checkOutEl.textContent = saveOut;

            buttonByState();
        })();

        // 자정 리셋
        function MidnightReset() {
            const now = new Date();
            const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1);
            const ms = midnight.getTime() - now.getTime();

            setTimeout(() => {
                clearToday();
                resetUI();
                localStorage.setItem('attendanceDate', todayKey());
                buttonByState();
                MidnightReset();
            }, ms);
        }
        MidnightReset();

        // 출근
        checkInBtn.addEventListener('click', () => {
            ensureTodayStorage();
            if(localStorage.getItem('checkInTime')) return;

            const nt = nowTimeString();
            setCheckInTime(nt);
            setStatus('출근');
            buttonByState();

            // 월간
            const records = loadRecords();
            records[key] = records[key] || {};
            records[key].type = records[key].type || '정상';
            records[key].checkIn = hhmm;

            saveRecords(records);
        });

        // 퇴근
        checkOutBtn.addEventListener('click', () => {
            ensureTodayStorage();
            if(!localStorage.getItem('checkInTime')) return;
            if(localStorage.getItem('checkOutTime')) return;

            const nt = nowTimeString();
            setCheckOutTime(nt);
            setStatus('퇴근');
            buttonByState();

            // 월간
            const key = todayKey();
            const hhmm = toHHMM(nt);

            const records = loadRecords();
            records[key] = records[key] || {};
            records[key].type = records[key].type || '정상';
            records[key].checkOut = hhmm;

            if(!records[key].checkIn){
                const inFull = localStorage.getItem('checkInTime');
                if(inFull) records[key].checkIn = toHHMM(inFull);
            }

            if(records[key].checkIn && records[key].checkOut){
                const {workMin, otMin} = calcWork(records[key].checkIn, records[key].checkOut);
                records[key].workMin = workMin;
                records[key].otMin = otMin;
            }

            saveRecords(records);
        });

        // 상태 메뉴
        function toggleStateMenu(){
            stateWrap.classList.toggle('open');
        }
        function closeStateMenu(){
            stateWrap.classList.remove('open');
        }

        stateBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleStateMenu();
        });

        document.querySelectorAll('.state-item').forEach((item) => {
            item.addEventListener('click', (e) => {
                e.stopPropagation();
                const newState = item.dataset.state;
                setStatus(newState);
                closeStateMenu();
            });
        });

        document.addEventListener('click', closeStateMenu);
        document.addEventListener('keydown', (e) => {
            if(e.key === 'Escape') closeStateMenu();
        });

    });
