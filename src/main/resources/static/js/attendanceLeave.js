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

        const modal = document.getElementById('leaveModal');
        const form = document.getElementById('leaveForm');
        const cancelBtn = document.getElementById('lvCancel');

        if (!yearEl || !prevBtn || !nextBtn || !tbody) return;

        let curYear = new Date().getFullYear();
        const DAY_MIN = 8 * 60;

        function toISO(d){
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            return `${yyyy}-${mm}-${dd}`;
        }

        function todayISO(){
            const t = new Date();
            t.setHours(0,0,0,0);
            return toISO(t);
        }

        function tomorrowISO(){
            const t = new Date();
            t.setHours(0,0,0,0);
            t.setDate(t.getDate() + 1);
            return toISO(t);
        }

        function minToDH(min){
            min = Number(min ?? 0);
            if (!Number.isFinite(min) || min < 0) min = 0;

            const totalHours = Math.floor(min / 60);
            if (totalHours <= 0) return '-';

            const d = Math.floor(totalHours / 8);
            const h = totalHours % 8;

            if (d === 0) return `${totalHours}시간`;

            if (h === 0) return `${d}일`;

            return `${d}일 ${h}시간`;
        }


        function typeLabel(code){
            if (code === 'ANNUAL') return '연차';
            if (code === 'HALF_AM') return '오전반차';
            if (code === 'HALF_PM') return '오후반차';
            return code ?? '';
        }

        function mdDot(s){
            if(!s) return '';
            const [, mm, dd] = s.split('-');
            return `${mm}.${dd}`;
        }

        function dateLabel(start, end){
            const s = start ?? end;
            const e = end ?? start;
            if (s && e && s !== e) return `${mdDot(s)} ~ ${mdDot(e)}`;
            return mdDot(s);
        }

        function timeByType(code){
            if (code === 'HALF_AM') return { start:'09:00', end:'13:00' };
            if (code === 'HALF_PM') return { start:'14:00', end:'18:00' };
            return { start:'09:00', end:'18:00' };
        }

        function minutesByType(code, daysNum){
            if (code === 'HALF_AM' || code === 'HALF_PM') return 4 * 60;
            return Math.round((daysNum || 0) * DAY_MIN);
        }

        async function fetchSummary(year) {
            const res = await fetch(`/api/leave/summary?year=${year}`);
            if (!res.ok) throw new Error('summary fetch failed');
            return await res.json();
        }

        async function fetchList(year) {
            const res = await fetch(`/api/leave/list?year=${year}`);
            if (!res.ok) throw new Error('list fetch failed');
            return await res.json();
        }

        async function render() {
            yearEl.textContent = `${curYear}`;

            // summary
            try {
                console.log('curYear=', curYear);
                const sum = await fetchSummary(curYear);
                console.log('sum.remainMin=', sum.remainMin, 'sum=', sum);

                const totalMin = Number(sum.totalMin ?? sum.total ?? 0);
                const usedMin = Number(sum.usedMin ?? sum.used ?? 0);
                const carryMin = Number(sum.carryMin ?? sum.carry ?? 0);
                const remainMin = Number(sum.remainMin ?? (totalMin + carryMin - usedMin));

                if (totalEl) totalEl.textContent = minToDH(totalMin);
                if (usedEl) usedEl.textContent = minToDH(usedMin);
                if (carryEl) carryEl.textContent = minToDH(carryMin);
                if (remainEl) remainEl.textContent = minToDH(Math.max(0, remainMin));

            } catch (e) {
                console.error(e);
            }

            // list
            try {
                const rec = await fetchList(curYear);
                tbody.innerHTML = ' ';

                if (!rec || rec.length === 0) {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `<td colspan="7" style="padding:40px 10px; font-size:16px;">사용 내역이 없습니다.</td>`;
                    tbody.appendChild(tr);
                } else {
                    rec.forEach((r) => {

                        const dateText = dateLabel(r.startDate, r.endDate);

                        const code = r.leaveType ?? r.type ?? '';
                        const typeText = typeLabel(code);

                        const t = timeByType(code);

                        let daysNum = Number(r.days);
                        if (code === 'ANNUAL' && (!Number.isFinite(daysNum) || daysNum <= 0)) {
                            daysNum = 1; // 1일 = 8시간
                        }
                        const minutes = minutesByType(code, daysNum);


                        const statusText = r.status ?? r.requestStatus ?? '승인 완료';

                        const tr = document.createElement('tr');
                        tr.innerHTML = `
                            <td class="colCheck"><input type="checkbox" class="rowCheck"></td>
                            <td>${dateText}</td>
                            <td>${typeText}</td>
                            <td>${t.start}</td>
                            <td>${t.end}</td>
                            <td>${minToDH(minutes)}</td>
                            <td class="leaveStatus">${statusText}</td> `;
                        tbody.appendChild(tr);
                    });
                }

                if (checkAll) checkAll.checked = false;

            } catch (e) {
                console.error(e);
                tbody.innerHTML = `<tr><td colspan="7" style="padding:40px 10px; font-size:16px;">사용 내역을 불러오지 못했습니다.</td></tr>`;
            }
        }

        // 주말엔 연차 신청 막기
        function hasWeekend(start, end){
            let dS = new Date(start);
            const dE = new Date(end);

            while(dS <= dE){
                const day = dS.getDay();
                if(day === 0 || day === 6) return true;
                dS.setDate(dS.getDate() +1);
            }

            return false;
        }

        // 연도 버튼
        prevBtn.addEventListener('click', async () => { curYear--; await render(); });
        nextBtn.addEventListener('click', async () => { curYear++; await render(); });

        // 전체 선택
        if (checkAll) checkAll.addEventListener('change', () => {
            const checked = checkAll.checked;
            document.querySelectorAll('.rowCheck').forEach(chk => chk.checked = checked);
        });

        function applyType(){
            const type = document.getElementById('lvType')?.value;
            const s = document.getElementById('lvStart');
            const e = document.getElementById('lvEnd');
            if (!s || !e) return;

            const min = (type === 'HALF_PM') ? todayISO() : tomorrowISO();

            s.min = min;
            e.min = min;

            if (!s.value || s.value < min) s.value = min;
            if (!e.value || e.value < s.value) e.value = s.value;

            if (type === 'HALF_AM' || type === 'HALF_PM') {
                e.value = s.value;
            }
        }


        // 모달 열기
        function openModal() {
            if (!modal) return;
            modal.hidden = false;

            applyType();

            const sel = document.getElementById('lvType');
            const s = document.getElementById('lvStart');
            const e = document.getElementById('lvEnd');

            if (sel && !sel.dataset.bound) {
                sel.addEventListener('change', applyType);
                sel.dataset.bound = '1';
            }

            if (s && e && !s.dataset.bound) {
                s.addEventListener('change', () => {
                    e.min = s.value;
                    if (e.value < s.value) e.value = s.value;

                    const type = sel?.value;
                    if (type === 'HALF_AM' || type === 'HALF_PM') {
                        e.value = s.value;
                    }
                });
                s.dataset.bound = '1';
            }
        }

        function closeModal() {
            if (!modal) return;
            modal.hidden = true;
        }

        if (cancelBtn) cancelBtn.addEventListener('click', closeModal);

        document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

        if (approveBtn) {
            approveBtn.addEventListener('click', async () => {
                try {
                    const y = new Date().getFullYear();
                    const sum = await fetchSummary(y);
                    const remainMin = Number(sum.remainMin ?? 0);

                    if (remainMin <= 0) {
                        alert('사용할 수 있는 연차가 없습니다');
                        return;
                    }

                    openModal();
                } catch (e) {
                    console.error(e);
                    alert('연차 정보를 불러오지 못했습니다');
                }
            });
        }

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();

                const payload = {
                    leaveType: document.getElementById('lvType')?.value,
                    startDate: document.getElementById('lvStart')?.value,
                    endDate: document.getElementById('lvEnd')?.value,
                    reason: document.getElementById('lvReason')?.value || ''
                };

                if (!payload.leaveType || !payload.startDate || !payload.endDate) {
                    alert('내용을 입력해주세요');
                    return;
                }

                payload.reason = payload.reason.trim();
                if (!payload.reason) {
                    alert('사유를 꼭 적어주세요');
                    return;
                }

                if (payload.leaveType === 'HALF_AM' || payload.leaveType === 'HALF_PM') {
                    payload.endDate = payload.startDate;
                }

                if (payload.startDate > payload.endDate) {
                    alert('종료일은 시작일보다 빠를 수 없습니다.');
                    return;
                }

                const today = todayISO();
                if (payload.startDate < today) {
                    alert('이전날짜는 연차를 신청할 수 없습니다');
                    return;
                }
                if (payload.startDate === today || payload.endDate === today) {
                    if (payload.leaveType !== 'HALF_PM') {
                        alert('당일은 오후반차만 신청 가능합니다');
                        return;
                    }
                }

                if (hasWeekend(payload.startDate, payload.endDate)) {
                    alert('주말에는 연차를 사용할 수 없습니다');
                    return;
                }

                const y = Number(payload.startDate.slice(0, 4)) || curYear;

                let sum;
                try {
                    sum = await fetchSummary(y);
                } catch (err) {
                    console.error(err);
                    alert('연차 정보를 불러오지 못했습니다');
                    return;
                }

                const remainMin = Number(sum.remainMin ?? 0);

                const startD = new Date(payload.startDate);
                const endD = new Date(payload.endDate);

                let daysNum = Math.floor((endD - startD) / (1000 * 60 * 60 * 24)) + 1;
                if (!Number.isFinite(daysNum) || daysNum < 1) daysNum = 1;

                const reqMin = minutesByType(payload.leaveType, daysNum);

                if (remainMin <= 0) {
                    alert('사용할 수 있는 연차가 없습니다');
                    return;
                }
                if (reqMin > remainMin) {
                    alert('잔여 연차가 적습니다');
                    return;
                }

                try {
                    const res = await fetch('/api/leave/apply', {
                        method: 'POST',
                        credentials: 'same-origin',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(payload)
                    });

                    if (!res.ok) {
                        const msg = await res.text().catch(() => '');
                        alert(msg || '연차 신청 실패');
                        return;
                    }

                    closeModal();
                    await render();
                    window.dispatchEvent(new CustomEvent('attendance:refresh'));

                } catch (err) {
                    console.error(err);
                    alert('연차 신청 실패');
                }
            });
        }


        render();
    });
