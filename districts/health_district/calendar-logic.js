// districts/health_district/calendar-logic.js

const CalendarModule = (() => {
    let calendarCurrentDate = new Date();
    let refs = {
        getSmokeLog: () => [],
        getDailyCigaretteLimit: () => 0,
        getDailyTotalVapeTimeLimit: () => 0,
        elements: {
            calendarLogContainer: null,
            calendarGridContainer: null,
            calendarMonthYearDisplay: null,
            toggleCalendarButton: null
        },
        helpers: { // Default fallbacks, will be overridden by smoke-tracker-script.js
            getDateStringFromTimestamp: (ts) => new Date(ts).toISOString().split('T')[0],
            formatTime: (s) => `${s}s`,
            getCurrentDateString: () => new Date().toISOString().split('T')[0]
        }
    };

    function aggregateDailyDataForMonthInternal(targetMonth, targetYear) {
        const dailyData = {};
        const firstDayOfMonth = new Date(targetYear, targetMonth, 1).getTime();
        // Correctly get the first day of the *next* month for upper bound
        const firstDayOfNextMonth = new Date(targetYear, targetMonth + 1, 1).getTime();
        const log = refs.getSmokeLog();

        log.forEach(logEntry => {
            // Ensure logEntry.timestamp is a number
            const entryTimestamp = Number(logEntry.timestamp);
            if (isNaN(entryTimestamp)) return;

            if (entryTimestamp >= firstDayOfMonth && entryTimestamp < firstDayOfNextMonth) {
                const dateStr = refs.helpers.getDateStringFromTimestamp(entryTimestamp);
                if (!dailyData[dateStr]) {
                    dailyData[dateStr] = { cigarettes: 0, vapeTime: 0 };
                }
                if (logEntry.type === 'cigarette') {
                    dailyData[dateStr].cigarettes += (Number(logEntry.count) || 1);
                } else if (logEntry.type === 'vape' && logEntry.duration) {
                    dailyData[dateStr].vapeTime += Number(logEntry.duration);
                }
            }
        });
        return dailyData;
    }

    function styleCalendarDayInternal(dayCell, dateString, dailyAggregatedData) {
        dayCell.classList.remove('calendar-day-success', 'calendar-day-overlimit', 'calendar-day-nodata', 'today');
        const data = dailyAggregatedData[dateString];
        const todayDateString = refs.helpers.getCurrentDateString();
        const cigLimit = refs.getDailyCigaretteLimit();
        const vapeLimit = refs.getDailyTotalVapeTimeLimit();

        if (dateString === todayDateString) {
            dayCell.classList.add('today');
        }

        if (data && (data.cigarettes > 0 || data.vapeTime > 0)) { // Only style if there's actual data
            const cigsOver = cigLimit > 0 && data.cigarettes > cigLimit;
            const vapeOver = vapeLimit > 0 && data.vapeTime > vapeLimit;
            const cigDisplay = `${data.cigarettes}/${cigLimit > 0 ? cigLimit : '∞'}`;
            const vapeDisplay = `${refs.helpers.formatTime(data.vapeTime)}/${vapeLimit > 0 ? refs.helpers.formatTime(vapeLimit) : '∞'}`;

            if (cigsOver || vapeOver) {
                dayCell.classList.add('calendar-day-overlimit');
                dayCell.title = `Over Limit! Cigs: ${cigDisplay}, Vape: ${vapeDisplay}`;
            } else {
                dayCell.classList.add('calendar-day-success');
                dayCell.title = `Success! Cigs: ${cigDisplay}, Vape: ${vapeDisplay}`;
            }
        } else {
            dayCell.classList.add('calendar-day-nodata');
            dayCell.title = dateString; // Default title for no data days
        }
    }

    function initializeCalendarLogic(config) {
        if (config.getSmokeLog) refs.getSmokeLog = config.getSmokeLog;
        if (config.getDailyCigaretteLimit) refs.getDailyCigaretteLimit = config.getDailyCigaretteLimit;
        if (config.getDailyTotalVapeTimeLimit) refs.getDailyTotalVapeTimeLimit = config.getDailyTotalVapeTimeLimit;
        if (config.elements) refs.elements = { ...refs.elements, ...config.elements };
        if (config.helpers) { // Correctly assign provided helper functions
            refs.helpers.getDateStringFromTimestamp = config.helpers.getDateStringFromTimestamp || refs.helpers.getDateStringFromTimestamp;
            refs.helpers.formatTime = config.helpers.formatTime || refs.helpers.formatTime;
            refs.helpers.getCurrentDateString = config.helpers.getCurrentDateString || refs.helpers.getCurrentDateString;
        }
        console.log("Calendar logic initialized with refs for helpers.");
    }

    function generateCalendarExternal(month, year) {
        const { calendarGridContainer, calendarMonthYearDisplay } = refs.elements;
        if (!calendarGridContainer || !calendarMonthYearDisplay) {
            console.error("Calendar UI elements not found in refs for generateCalendarExternal.");
            return;
        }

        calendarGridContainer.innerHTML = '';
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const dayNames = ["S", "M", "T", "W", "T", "F", "S"];
        calendarMonthYearDisplay.textContent = `${monthNames[month]} ${year}`;

        const firstDayOfMonthIndex = new Date(year, month, 1).getDay(); // 0 for Sunday, 1 for Monday, ...
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const aggregatedData = aggregateDailyDataForMonthInternal(month, year);

        const table = document.createElement('table');
        table.className = 'calendar-grid';
        const thead = table.createTHead();
        const headerRow = thead.insertRow();
        dayNames.forEach(dayName => {
            const th = document.createElement('th'); th.textContent = dayName; headerRow.appendChild(th);
        });

        const tbody = table.createTBody();
        let dateCounter = 1;
        for (let i = 0; i < 6; i++) { // Max 6 rows needed for any month
            const row = tbody.insertRow();
            let actualDaysInRow = false;
            for (let j = 0; j < 7; j++) { // 7 days a week
                const cell = row.insertCell();
                cell.classList.add('calendar-day');
                if (i === 0 && j < firstDayOfMonthIndex) {
                    cell.classList.add('other-month'); // Cell for previous month's day
                } else if (dateCounter > daysInMonth) {
                    cell.classList.add('other-month'); // Cell for next month's day
                } else {
                    actualDaysInRow = true;
                    const daySpan = document.createElement('span');
                    daySpan.className = 'calendar-day-number';
                    daySpan.textContent = dateCounter;
                    cell.appendChild(daySpan);
                    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(dateCounter).padStart(2, '0')}`;
                    cell.dataset.date = dateString;
                    styleCalendarDayInternal(cell, dateString, aggregatedData);
                    dateCounter++;
                }
            }
            if (dateCounter > daysInMonth && !actualDaysInRow && i >=4) { // If we've passed all days and this row is empty
                tbody.removeChild(row); // Remove fully empty trailing rows (typically the 5th or 6th)
                break;
            }
            if (dateCounter > daysInMonth && i === 5 && !actualDaysInRow) {
                 // This condition means the 6th row was entirely for 'other-month' days and can be removed
                 // This is covered by the above, but added for clarity if needed
            }
        }
        calendarGridContainer.appendChild(table);
    }

    function handleToggleCalendar() {
        const { calendarLogContainer, toggleCalendarButton } = refs.elements;
        if (!calendarLogContainer || !toggleCalendarButton) return;
        const isVisible = calendarLogContainer.classList.toggle('show');
        if (isVisible) {
            generateCalendarExternal(calendarCurrentDate.getMonth(), calendarCurrentDate.getFullYear());
            toggleCalendarButton.innerHTML = '<i class="fas fa-calendar-times"></i> HIDE CALENDAR';
        } else {
            toggleCalendarButton.innerHTML = '<i class="fas fa-calendar-alt"></i> VIEW CALENDAR LOG';
        }
    }

    function handlePrevMonth() {
        calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() - 1);
        generateCalendarExternal(calendarCurrentDate.getMonth(), calendarCurrentDate.getFullYear());
    }

    function handleNextMonth() {
        calendarCurrentDate.setMonth(calendarCurrentDate.getMonth() + 1);
        generateCalendarExternal(calendarCurrentDate.getMonth(), calendarCurrentDate.getFullYear());
    }

    return {
        initializeCalendarLogic,
        generateCalendarExternal,
        handleToggleCalendar,
        handlePrevMonth,
        handleNextMonth,
        getCalendarCurrentDateForRefresh: () => ({ // For smoke-tracker to refresh current view
            month: calendarCurrentDate.getMonth(),
            year: calendarCurrentDate.getFullYear()
        })
    };
})();

// Make functions globally available for smoke-tracker-script.js
const initializeCalendarLogic = CalendarModule.initializeCalendarLogic;
const generateCalendarExternal = CalendarModule.generateCalendarExternal;
const handleToggleCalendar = CalendarModule.handleToggleCalendar;
const handlePrevMonth = CalendarModule.handlePrevMonth;
const handleNextMonth = CalendarModule.handleNextMonth;
// CalendarModule.getCalendarCurrentDateForRefresh is accessed via CalendarModule object if needed elsewhere.
