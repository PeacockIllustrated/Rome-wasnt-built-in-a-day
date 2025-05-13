// districts/health_district/calendar-logic.js

// Module-like structure to keep variables local
const CalendarModule = (() => {

    // --- State and References ---
    let calendarCurrentDate = new Date();
    // References to data/elements from the main script
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
        helpers: { // These will be populated by smoke-tracker-script.js
            getDateStringFromTimestamp: (ts) => new Date(ts).toISOString().split('T')[0], // Default fallback
            formatTime: (s) => `${s}s`, // Default fallback
            getCurrentDateString: () => new Date().toISOString().split('T')[0] // Default fallback
        }
    };

    // --- Private Helper Functions ---
    function aggregateDailyDataForMonthInternal(targetMonth, targetYear) {
        const dailyData = {};
        const firstDayOfMonth = new Date(targetYear, targetMonth, 1).getTime();
        const firstDayOfNextMonth = new Date(targetYear, targetMonth + 1, 1).getTime();
        const log = refs.getSmokeLog();

        log.forEach(logEntry => {
            if (logEntry.timestamp >= firstDayOfMonth && logEntry.timestamp < firstDayOfNextMonth) {
                // USE THE PASSED HELPER FUNCTION
                const dateStr = refs.helpers.getDateStringFromTimestamp(logEntry.timestamp);
                if (!dailyData[dateStr]) {
                    dailyData[dateStr] = { cigarettes: 0, vapeTime: 0 };
                }
                if (logEntry.type === 'cigarette') {
                    dailyData[dateStr].cigarettes += (logEntry.count || 1);
                } else if (logEntry.type === 'vape' && logEntry.duration) {
                    dailyData[dateStr].vapeTime += logEntry.duration;
                }
            }
        });
        return dailyData;
    }

    function styleCalendarDayInternal(dayCell, dateString, dailyAggregatedData) {
        dayCell.classList.remove('calendar-day-success', 'calendar-day-overlimit', 'calendar-day-nodata', 'today');
        const data = dailyAggregatedData[dateString];
        // USE THE PASSED HELPER FUNCTION
        const todayDateString = refs.helpers.getCurrentDateString();
        const cigLimit = refs.getDailyCigaretteLimit();
        const vapeLimit = refs.getDailyTotalVapeTimeLimit();

        if (dateString === todayDateString) {
            dayCell.classList.add('today');
        }

        if (data) {
            const cigsOver = cigLimit > 0 && data.cigarettes > cigLimit;
            const vapeOver = vapeLimit > 0 && data.vapeTime > vapeLimit;

            if (cigsOver || vapeOver) {
                dayCell.classList.add('calendar-day-overlimit');
                // USE THE PASSED HELPER FUNCTION
                dayCell.title = `Over Limit! Cigs: ${data.cigarettes}/${cigLimit > 0 ? cigLimit : '∞'}, Vape: ${refs.helpers.formatTime(data.vapeTime)}/${vapeLimit > 0 ? refs.helpers.formatTime(vapeLimit) : '∞'}`;
            } else {
                dayCell.classList.add('calendar-day-success');
                // USE THE PASSED HELPER FUNCTION
                dayCell.title = `Success! Cigs: ${data.cigarettes}/${cigLimit > 0 ? cigLimit : '∞'}, Vape: ${refs.helpers.formatTime(data.vapeTime)}/${vapeLimit > 0 ? refs.helpers.formatTime(vapeLimit) : '∞'}`;
            }
        } else {
            dayCell.classList.add('calendar-day-nodata');
            dayCell.title = dateString;
        }
    }

    // --- Public Functions (Exposed) ---
    function initializeCalendarLogic(config) {
        if (config.getSmokeLog) refs.getSmokeLog = config.getSmokeLog;
        if (config.getDailyCigaretteLimit) refs.getDailyCigaretteLimit = config.getDailyCigaretteLimit;
        if (config.getDailyTotalVapeTimeLimit) refs.getDailyTotalVapeTimeLimit = config.getDailyTotalVapeTimeLimit;
        if (config.elements) refs.elements = { ...refs.elements, ...config.elements };
        
        // IMPORTANT: Correctly assign helper functions from config
        if (config.helpers) {
            if (config.helpers.getDateStringFromTimestamp) refs.helpers.getDateStringFromTimestamp = config.helpers.getDateStringFromTimestamp;
            if (config.helpers.formatTime) refs.helpers.formatTime = config.helpers.formatTime;
            if (config.helpers.getCurrentDateString) refs.helpers.getCurrentDateString = config.helpers.getCurrentDateString;
        }
        console.log("Calendar logic initialized with refs:", refs);
    }

    // ... (generateCalendarExternal, handleToggleCalendar, handlePrevMonth, handleNextMonth - keep these as they were)
    // Ensure generateCalendarExternal uses refs.helpers correctly if it wasn't already.
    function generateCalendarExternal(month, year) {
        const { calendarGridContainer, calendarMonthYearDisplay } = refs.elements;
        if (!calendarGridContainer || !calendarMonthYearDisplay) {
            console.error("Calendar grid or display element not found in refs!");
            return;
        }

        calendarGridContainer.innerHTML = '';
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const dayNames = ["S", "M", "T", "W", "T", "F", "S"];

        calendarMonthYearDisplay.textContent = `${monthNames[month]} ${year}`;

        const firstDayOfMonth = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        const aggregatedData = aggregateDailyDataForMonthInternal(month, year);

        const table = document.createElement('table');
        table.className = 'calendar-grid';
        const thead = table.createTHead();
        const headerRow = thead.insertRow();
        dayNames.forEach(dayName => {
            const th = document.createElement('th');
            th.textContent = dayName;
            headerRow.appendChild(th);
        });

        const tbody = table.createTBody();
        let date = 1;
        for (let i = 0; i < 6; i++) { // Max 6 rows for a month
            const row = tbody.insertRow();
            let rowHasActualDay = false;
            for (let j = 0; j < 7; j++) {
                const cell = row.insertCell();
                cell.classList.add('calendar-day');
                if (i === 0 && j < firstDayOfMonth) {
                    cell.classList.add('other-month');
                } else if (date > daysInMonth) {
                    cell.classList.add('other-month');
                } else {
                    rowHasActualDay = true;
                    const daySpan = document.createElement('span');
                    daySpan.className = 'calendar-day-number';
                    daySpan.textContent = date;
                    cell.appendChild(daySpan);
                    // USE THE PASSED HELPER FUNCTION
                    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
                    cell.dataset.date = dateString;
                    styleCalendarDayInternal(cell, dateString, aggregatedData);
                    date++;
                }
            }
            if (date > daysInMonth && !rowHasActualDay && i > 3) { // Remove completely empty trailing rows
                 tbody.removeChild(row);
                 break; 
            }
             if (date > daysInMonth && rowHasActualDay && i === 5) { // if it's the 6th row and we've filled days but are now in other-month
                // Check if all cells are 'other-month' from this point
                const cellsInRow = Array.from(row.cells);
                if (cellsInRow.every(c => c.classList.contains('other-month'))) {
                    // This check might be redundant if rowHasActualDay is false, but good for safety
                }
            }
             if (date > daysInMonth && !rowHasActualDay) break; // Break if no more actual days can be in this row
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
        handleNextMonth
    };
})();

// Make functions globally available for smoke-tracker-script.js
const initializeCalendarLogic = CalendarModule.initializeCalendarLogic;
const generateCalendarExternal = CalendarModule.generateCalendarExternal;
const handleToggleCalendar = CalendarModule.handleToggleCalendar;
const handlePrevMonth = CalendarModule.handlePrevMonth;
const handleNextMonth = CalendarModule.handleNextMonth;
