document.addEventListener("DOMContentLoaded", () => {
    const calendarEl = document.getElementById('miniCalendar');
    const tooltipEl = document.getElementById('miniCalendarTooltip');

    if (calendarEl && tooltipEl) {
        initMiniCalendar(calendarEl, tooltipEl);
    }
});

var miniCalendarInstance = null;
window.__MINI_CALENDAR_RAW_DATA = [];


function initMiniCalendar(calendarEl, tooltipEl) {
    const MINI_NOT_RED_DAYS = ["어버이날", "스승의날", "제헌절", "국군의 날", "식목일", "발렌타인", "화이트", "할로윈", "빼빼로", "동지", "초복", "중복", "말복", "입춘", "소한", "대한", "칠석", "단오", "근로자의 날"];

    miniCalendarInstance = new FullCalendar.Calendar(calendarEl, {
        googleCalendarApiKey: window.GOOGLE_CALENDAR_API_KEY,
        locale: 'ko',
        initialView: 'dayGridMonth',
        height: '100%',
        expandRows: true,
        views: {
            dayGridTwoWeek: {
                type: 'dayGrid',
                duration: { weeks: 2 }, // 2주 기간 설정
                dayMaxEvents: false     // 모든 이벤트 표시 (필요시 true로 변경)
            }
        },
        windowResize: function(arg) {
            adjustCalendarView(miniCalendarInstance, calendarEl);
        },

        fixedWeekCount: false,
        showNonCurrentDates: true,
        handleWindowResize: true,

        headerToolbar: {
            left: 'prev',
            center: 'title',
            right: 'next'
        },
        titleFormat: function(date) {
            return `${date.date.year}년 ${date.date.month + 1}월`;
        },

        dayMaxEvents: false,

        // [설정 1] 공휴일 소스
        eventSources: [
            {
                googleCalendarId: 'ko.south_korea#holiday@group.v.calendar.google.com',
                id: 'holiday-source',
                className: 'holiday-source',
                display: 'background',
                color: 'transparent',
                editable: false
            }
        ],

        dayCellContent: function(info) {
            return { html: String(info.date.getDate()) };
        },

        // [설정 2] 점(Dot) 렌더링 로직
        eventContent: function(arg) {
            // 공휴일인지 확인
            const isHolidaySource = arg.event.source && arg.event.source.id === 'holiday-source';
            const hasHolidayClass = arg.event.classNames.includes('holiday-source');

            // 공휴일이면 빈 값 반환
            if (isHolidaySource || hasHolidayClass) {
                return { html: '' };
            }

            // 일반 일정은 점 그리기
            const color = arg.event.backgroundColor || '#3b82f6';
            return {
                html: `<div class="mini-custom-dot" style="background-color: ${color};"></div>`
            };
        },

        // [설정 3] 날짜 색상 변경 로직
        eventDidMount: function(info) {
            const sourceId = info.event.source ? info.event.source.id : '';
            const hasClass = info.event.classNames.includes('holiday-source');

            // 공휴일 데이터인 경우에만 날짜 색상 변경 시도
            if (sourceId === 'holiday-source' || hasClass) {
                const dateStr = toDateString(info.event.start);
                const dateCell = calendarEl.querySelector(`.fc-daygrid-day[data-date="${dateStr}"]`);

                if (dateCell) {
                    const numberEl = dateCell.querySelector('.fc-daygrid-day-number');
                    const title = info.event.title || "";

                    // 함수 내부 변수(MINI_NOT_RED_DAYS) 사용
                    const isObservance = MINI_NOT_RED_DAYS.some(keyword => title.includes(keyword));

                    if (numberEl) {
                        numberEl.classList.remove('holiday-text', 'observance-text');

                        if (isObservance) {
                            numberEl.classList.add('observance-text'); // 초록색
                        } else {
                            numberEl.classList.add('holiday-text');    // 빨간색
                        }
                    }

                    // 툴팁 데이터
                    const existingName = dateCell.getAttribute('data-holiday-name') || '';
                    if (!existingName.includes(title)) {
                        dateCell.setAttribute('data-holiday-name', existingName ? existingName + ', ' + title : title);
                    }

                    const holidayColor = isObservance ? '#10b981' : '#e03131';
                    const currentStoredColor = dateCell.getAttribute('data-holiday-color');
                    // 빨간날 우선
                    if (currentStoredColor !== '#e03131') {
                        dateCell.setAttribute('data-holiday-color', holidayColor);
                    }
                }
            }
        },

        dateClick: function() { location.href = '/calendar'; },
        eventClick: function(info) {
            info.jsEvent.preventDefault();
            location.href = '/calendar';
        },

        // 툴팁 로직
        dayCellDidMount: function(info) {
            const cellEl = info.el;
            const date = info.date;

            cellEl.addEventListener('mouseenter', () => {
                const targetDateStr = toDateString(date);

                const myEvents = (window.__MINI_CALENDAR_RAW_DATA || [])
                    .filter(e => e.start === targetDateStr)
                    .sort((a, b) => a.originStart - b.originStart);

                const holidayName = cellEl.getAttribute('data-holiday-name');
                const holidayColor = cellEl.getAttribute('data-holiday-color') || '#e03131';

                if (myEvents.length === 0 && !holidayName) return;

                let html = `<div class="tooltip-date">${targetDateStr}</div>
                            <div class="tooltip-list">`;

                if (holidayName) {
                    html += `<div class="tooltip-item">
                                <span class="tooltip-dot" style="background-color: ${holidayColor};"></span>
                                <span style="color:${holidayColor}; font-weight:bold;">${holidayName}</span>
                             </div>`;
                }

                myEvents.forEach(evt => {
                    html += `<div class="tooltip-item">
                                <span class="tooltip-dot" style="background-color: ${evt.color};"></span>
                                <span style="flex:1; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">
                                    ${evt.title}
                                </span>
                             </div>`;
                });
                html += `</div>`;

                tooltipEl.innerHTML = html;
                tooltipEl.style.display = 'block';
            });

            cellEl.addEventListener('mousemove', (e) => {
                if (tooltipEl.style.display === 'block') {
                    tooltipEl.style.left = (e.clientX + 10) + 'px';
                    tooltipEl.style.top = (e.clientY + 10) + 'px';
                }
            });

            cellEl.addEventListener('mouseleave', () => {
                tooltipEl.style.display = 'none';
            });
        }
    });

    miniCalendarInstance.render();
    adjustCalendarView(miniCalendarInstance, calendarEl);
    loadMiniCalendarEvents(miniCalendarInstance);
}
// 높이에 따라 2주 뷰를 전환하는 함수
function adjustCalendarView(calendar, element) {
    // 달력 컨테이너의 현재 높이 가져오기
    const height = element.clientHeight;

    // 기준 높이 설정 (예: 300px보다 작으면 2주 보기로 전환)
    // 이 값은 실제 화면 보시면서 조정하시면 됩니다.
    const THRESHOLD_HEIGHT = 380;

    const currentView = calendar.view.type;

    if (height < THRESHOLD_HEIGHT) {
        if (currentView !== 'dayGridTwoWeek') {
            calendar.changeView('dayGridTwoWeek');
            // 2주 보기일 때는 오늘 날짜가 포함된 주가 나오도록 이동
            calendar.today();
        }
    } else {
        if (currentView !== 'dayGridMonth') {
            calendar.changeView('dayGridMonth');
        }
    }
}

// --- 데이터 로드 ---
async function loadMiniCalendarEvents(calendar) {
    const API_BASE = "/api/calendar";
    const SCHEDULE_API = `${API_BASE}/schedules`;

    try {
        const [calendarData, scheduleData] = await Promise.all([
            fetch(API_BASE).then(res => res.ok ? res.json() : []),
            fetch(SCHEDULE_API).then(res => res.ok ? res.json() : [])
        ]);

        let rawEvents = [];
        if (Array.isArray(calendarData)) calendarData.forEach(dto => rawEvents.push(createMiniEventObj(dto, "CALENDAR")));
        if (Array.isArray(scheduleData)) scheduleData.forEach(dto => rawEvents.push(createMiniEventObj(dto, "SCHEDULE")));

        const expandedEvents = expandEventsToDaily(rawEvents);
        window.__MINI_CALENDAR_RAW_DATA = expandedEvents;

        const representativeEvents = getRepresentativeEvents(expandedEvents);

        const currentSources = calendar.getEventSources();
        currentSources.forEach(src => {
            if (src.id !== 'holiday-source' && (!src.internalEventSource?.meta?.googleCalendarId)) {
                src.remove();
            }
        });

        calendar.addEventSource(representativeEvents);

    } catch (e) {
        console.error("미니 캘린더 로딩 실패:", e);
    }
}

// --- 헬퍼 함수 ---
function getRepresentativeEvents(events) {
    const dailyMap = new Map();
    events.forEach(ev => {
        const dateKey = ev.start;
        if (!dailyMap.has(dateKey)) {
            dailyMap.set(dateKey, ev);
        } else {
            const current = dailyMap.get(dateKey);
            if (ev.originStart < current.originStart) {
                dailyMap.set(dateKey, ev);
            }
        }
    });
    return Array.from(dailyMap.values()).map(ev => ({
        ...ev,
        backgroundColor: ev.color,
        borderColor: 'transparent'
    }));
}

function createMiniEventObj(dto, source) {
    return {
        title: dto.title,
        start: dto.start,
        end: dto.end,
        color: getMiniEventColor(dto, source),
        originStart: new Date(dto.start).getTime()
    };
}

function expandEventsToDaily(events) {
    const result = [];
    events.forEach(ev => {
        if (!ev.start) return;
        const start = new Date(ev.start);
        const end = ev.end ? new Date(ev.end) : new Date(start);
        start.setHours(0,0,0,0);
        if (ev.end) {
            const tempEnd = new Date(ev.end);
            if (tempEnd.getHours() === 0 && tempEnd.getMinutes() === 0) {
                end.setDate(end.getDate() - 1);
            }
        }
        end.setHours(0,0,0,0);

        const current = new Date(start);
        while (current <= end) {
            result.push({
                title: ev.title,
                start: toDateString(current),
                allDay: true,
                color: ev.color,
                originStart: ev.originStart
            });
            current.setDate(current.getDate() + 1);
        }
    });
    return result;
}

function toDateString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

function getMiniEventColor(dto, source) {
    const type = (dto.type || "").toString().toUpperCase();

    // 이 부분을 사진의 로직과 동일하게 변경
    if (source === "SCHEDULE") {
        if (type === "PERSONAL") {
            return "rgba(11, 46, 79, 0.35)"; // 업무-개인
        }
        if (type === "TEAM") {
            return "rgba(11, 46, 79, 0.7)";  // 업무-팀
        }
        if (type === "COMPANY") {
            return "rgba(11, 46, 79, 0.95)"; // 업무-회사
        }
        // 예외 처리
        return "rgba(11, 46, 79, 0.35)";
    }

    if (type === "COMPANY") return "rgb(49, 46, 129)";
    if (dto.color) return dto.color;
    return "rgb(30, 64, 175)";
}