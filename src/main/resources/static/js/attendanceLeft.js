    function AtdLeft(){

        const root = document.querySelector('.att-left') ||
                             document.querySelector('[data-att-rows]');
        if(!root) return;

        // 왼쪽 엘리먼트
        const clockEl      = root.querySelector('[data-clock]');
        const checkInEl    = root.querySelector('[data-checkin]');
        const checkOutEl   = root.querySelector('[data-checkout]');
        const monthTotalEl = root.querySelector('[data-monthtotal]');

        const checkInBtn   = root.querySelector('[data-action="checkin"]');
        const checkOutBtn  = root.querySelector('[data-action="checkout"]');

        const stateBtn     = root.querySelector('[data-action="toggle-menu"]');
        const stateTextEl  = root.querySelector('[data-state-text]');
        const stateModal   = root.querySelector('[data-state-modal]');

        if (!checkInBtn || !checkOutBtn || !checkInEl || !checkOutEl) return;

        // 현재 시간
        function nowTimeString(){
            const now = new Date();
            const hh = String(now.getHours()).padStart(2, '0');
            const mm = String(now.getMinutes()).padStart(2, '0');
            const ss = String(now.getSeconds()).padStart(2, '0');
            return `${hh} : ${mm} : ${ss}`;
        }

        // 시간 업데이트
        function updateClock(){
            clockEl.textContent = nowTimeString();
        }

        if(clockEl){
            updateClock();
            setInterval(updateClock, 1000);
        }

        function setButtons(summary){
            const hasIn = !!summary.todayCheckIn;
            const hasOut = !!summary.todayCheckOut;

            checkInBtn.disabled = hasIn;
            checkInBtn.textContent = hasIn ? '출근' : '출근하기';

            if(!hasIn){
                checkOutBtn.disabled = true;
                checkOutBtn.textContent = '퇴근';
            } else if(hasOut){
                checkOutBtn.disabled = true;
                checkOutBtn.textContent = '퇴근';
            } else {
                checkOutBtn.disabled = false;
                checkOutBtn.textContent = '퇴근 하기';
            }
        }

        async function loadSummary() {
            const res = await fetch('/api/attendance/summary');
            if (!res.ok) return;
            const s = await res.json();

            checkInEl.textContent = s.todayCheckIn ?? '미등록';
            checkOutEl.textContent = s.todayCheckOut ?? '미등록';

            if(monthTotalEl) monthTotalEl.textContent = s.monthTotal ?? '0h 0m';
            if(stateTextEl)  stateTextEl.textContent  = s.todayStatusText ?? '업무 상태 변경하기';

            setButtons(s);

            window.dispatchEvent(new CustomEvent('attendance:summary', { detail: s }));
        }

        loadSummary().catch(console.error);

        // 22:00 ~ 07:00 출근 버튼 차단
        function blockCheckIn(){
            const nD = new Date();
            const nH = nD.getHours();

            return (nH >= 22 || nH < 7);
        }

        // 자동 퇴근 후 알림
        async function autoChekNotice() {
            const res = await fetch('/api/attendance/auto');
            if (!res.ok) return;

            const data = await res.json();
            if (data.show) {
                alert('어제 자동퇴근 처리됐으니 출근부를 확인해주세요');

                await fetch('/api/attendance/auto/notice', { method: 'POST' });
            }
        }

        // 출근
        checkInBtn.addEventListener('click', async () => {

            if(blockCheckIn()){
                alert( '07:00 이후에 눌러주세요 ');
                return;
            }

            const res = await fetch('/api/attendance/checkin', { method:'POST' });

            if(!res.ok){
                const msg = await res.text().catch(()=> '');
                alert(msg || '출근 저장 실패');
                return;
            }

            await autoChekNotice();

            await loadSummary();
        });

        // 퇴근
        checkOutBtn.addEventListener('click', async () => {
            const res = await fetch('/api/attendance/checkout', { method:'POST' });
            if(!res.ok){ alert('퇴근 저장 실패'); return; }
            await loadSummary();
        });

        // 모달
        function openModal(){ stateModal.hidden = false; }
        function closeModal(){ stateModal.hidden = true; }

        stateBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            stateModal.hidden ? openModal() : closeModal();
        });

        root.addEventListener('click', (e) => {
            const act = e.target?.dataset?.action;

            if(act === 'set-state'){
                stateTextEl.textContent = e.target.dataset.state;
                closeModal();
                return;
            }

            if(act === 'close-state-modal'){
                if (!stateModal.hidden) closeModal();
                return;
            }
        });

        if (!window.__atdLeftKeyBound) {
            window.__atdLeftKeyBound = true;

            document.addEventListener('keydown', (e) => {
                if (e.key !== 'Escape') return;
                const modal = document.querySelector('.att-left [data-state-modal]');
                if (modal) modal.hidden = true;
            });
        }
    }

    //
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', AtdLeft);
    } else {
        AtdLeft();
    }

