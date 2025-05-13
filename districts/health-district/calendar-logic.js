// calendar-logic.js

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
        helpers: {
            getDateStringFromTimestamp: () => "1970-01-01",
            formatTime: () => "0m 0s",
            getCurrentDateString: () => "1970-01-01"
        }
    };

    // --- Private Helper Functions ---
    function aggregateDailyDataForMonthInternal(targetMonth, targetYear) {
        const dailyData = {};
        const firstDayOfMonth = new Date(targetYear, targetMonth, 1).getTime();
        const firstDayOfNextMonth = new Date(targetYear, targetMonth + 1, 1).getTime();
        const log = refs.getSmokeLog(); // Get current log data

        log.forEach(logEntry => {
            if (logEntry.timestamp >= firstDayOfMonth && logEntry.timestamp < firstDayOfNextMonth) {
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
                 dayCell.title = `Over Limit! Cigs: ${data.cigarettes}/${cigLimit > 0 ? cigLimit : '∞'}, Vape: ${refs.helpers.formatTime(data.vapeTime)}/${vapeLimit > 0 ? refs.helpers.formatTime(vapeLimit) : '∞'}`;
            } else {
                dayCell.classList.add('calendar-day-success');
                dayCell.title = `Success! Cigs: ${data.cigarettes}/${cigLimit > 0 ? cigLimit : '∞'}, Vape: ${refs.helpers.formatTime(data.vapeTime)}/${vapeLimit > 0 ? refs.helpers.formatTime(vapeLimit) : '∞'}`;
            }
        } else {
            dayCell.classList.add('calendar-day-nodata');
             dayCell.title = dateString; // Default title for no data days
        }
    }

    // --- Public Functions (Exposed) ---
    function initializeCalendarLogic(config) {
        // Store references passed from the main script
        if (config.getSmokeLog) refs.getSmokeLog = config.getSmokeLog;
        if (config.getDailyCigaretteLimit) refs.getDailyCigaretteLimit = config.getDailyCigaretteLimit;
        if (config.getDailyTotalVapeTimeLimit) refs.getDailyTotalVapeTimeLimit = config.getDailyTotalVapeTimeLimit;
        if (config.elements) refs.elements = { ...refs.elements, ...config.elements };
        if (config.helpers) refs.helpers = { ...refs.helpers, ...config.helpers };
        console.log("Calendar logic initialized.");
    }

    function generateCalendarExternal(month, year) {
        const { calendarGridContainer, calendarMonthYearDisplay } = refs.elements;
        if (!calendarGridContainer || !calendarMonthYearDisplay) return;

        calendarGridContainer.innerHTML = '';
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]; // Shorter names
        const dayNames = ["S", "M", "T", "W", "T", "F", "S"]; // Single letters

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
        for (let i = 0; i < 6; i++) {
            const row = tbody.insertRow();
            for (let j = 0; j < 7; j++) {
                const cell = row.insertCell();
                cell.classList.add('calendar-day');
                if (i === 0 && j < firstDayOfMonth) {
                    cell.classList.add('other-month');
                } else if (date > daysInMonth) {
                    cell.classList.add('other-month');
                } else {
                    const daySpan = document.createElement('span');
                    daySpan.className = 'calendar-day-number';
                    daySpan.textContent = date;
                    cell.appendChild(daySpan);
                    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(date).padStart(2, '0')}`;
                    cell.dataset.date = dateString;
                    styleCalendarDayInternal(cell, dateString, aggregatedData);
                    date++;
                }
            }
            if (date > daysInMonth) {
                 const cells = Array.from(row.cells);
                 if(cells.every(c => c.classList.contains('other-month'))) {
                     tbody.removeChild(row);
                 }
                break;
            }
        }
        calendarGridContainer.appendChild(table);
    }

    function handleToggleCalendar() {
        const { calendarLogContainer, toggleCalendarButton } = refs.elements;
        if (!calendarLogContainer || !toggleCalendarButton) return;

        const isVisible = calendarLogContainer.classList.toggle('show');
        if (isVisible) {
             // Ensure we have the latest limits when generating
             // (This assumes limits don't change historically, Phase 1 approach)
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

    // Return the functions that need to be called from the outside
    return {
        initializeCalendarLogic,
        generateCalendarExternal, // Might be useful to call externally if data changes
        handleToggleCalendar,
        handlePrevMonth,
        handleNextMonth
    };

})();

// Assign functions to global scope so smoke-tracker-script can find them
// (A more robust module system could be used later if the project grows)
const initializeCalendarLogic = CalendarModule.initializeCalendarLogic;
const generateCalendarExternal = CalendarModule.generateCalendarExternal;
const handleToggleCalendar = CalendarModule.handleToggleCalendar;
const handlePrevMonth = CalendarModule.handlePrevMonth;
const handleNextMonth = CalendarModule.handleNextMonth;
