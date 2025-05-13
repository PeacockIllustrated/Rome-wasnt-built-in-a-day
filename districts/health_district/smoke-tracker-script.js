// districts/health_district/smoke-tracker-script.js

document.addEventListener('DOMContentLoaded', () => {
    // =================================================================================
    // SECTION: ELEMENT SELECTORS
    // =================================================================================
    const particleCanvas = document.getElementById('particleCanvasSmokeTracker');
    const userPointsDisplay = document.getElementById('userPoints');
    const smokeFreeStreakDisplay = document.getElementById('smokeFreeStreak');
    const streakDisplayElement = document.getElementById('streakDisplay');
    const healthMilestonesDisplay = document.getElementById('healthMilestones');
    const shopUserPointsDisplay = document.getElementById('shopUserPoints');

    const logCigaretteButton = document.getElementById('logCigaretteButton');
    const todayCigaretteCountDisplay = document.getElementById('todayCigaretteCount');
    const cigaretteLimitDisplay = document.getElementById('cigaretteLimitDisplay');
    const setLimitInput = document.getElementById('setLimitInput');
    const saveLimitButton = document.getElementById('saveLimitButton');

    const startVapeTimerButton = document.getElementById('startVapeTimerButton');
    const stopVapeTimerButton = document.getElementById('stopVapeTimerButton');
    const vapeTimerDisplay = document.getElementById('vapeTimerDisplay');
    const setVapeSessionLimitInput = document.getElementById('setVapeSessionLimitInput');
    const saveVapeSessionLimitButton = document.getElementById('saveVapeSessionLimitButton');

    const todayTotalVapeTimeDisplay = document.getElementById('todayTotalVapeTimeDisplay');
    const dailyVapeTimeLimitDisplay = document.getElementById('dailyVapeTimeLimitDisplay');
    const setDailyVapeTimeLimitInput = document.getElementById('setDailyVapeTimeLimitInput');
    const saveDailyVapeTimeLimitButton = document.getElementById('saveDailyVapeTimeLimitButton');

    const smokeLogList = document.getElementById('smokeLogList');
    const noLogsPlaceholder = document.getElementById('noLogsPlaceholder');

    const reasonModalOverlay = document.getElementById('reasonModalOverlay');
    const reasonInput = document.getElementById('reasonInput');
    const reasonLogTimestampInput = document.getElementById('reasonLogTimestamp');
    const saveReasonButton = document.getElementById('saveReasonButton');
    const cancelReasonButton = document.getElementById('cancelReasonButton');

    const dailyProgressChartContainer = document.getElementById('dailyProgressChartContainer');
    const endOfDayTestButton = document.getElementById('endOfDayTestButton');

    const toggleCalendarButton = document.getElementById('toggleCalendarButton');
    const calendarLogContainer = document.getElementById('calendarLogContainer');
    const calendarGridContainer = document.getElementById('calendarGridContainer');
    const calendarMonthYearDisplay = document.getElementById('calendarMonthYear');
    const prevMonthButton = document.getElementById('prevMonthButton');
    const nextMonthButton = document.getElementById('nextMonthButton');

    // =================================================================================
    // SECTION: STATE VARIABLES
    // =================================================================================
    let userPoints = 0;
    let smokeFreeStreak = 0, healthMilestones = 0;
    let dailyCigaretteLimit = 5, vapeSessionDurationLimit = 30, dailyTotalVapeTimeLimit = 300;
    let smokeLog = [];
    let lastLogDate = '', todayCigaretteCount = 0, todayTotalVapeTime = 0, lastDayStreakIncremented = '';

    let isVapeTimerRunning = false, vapeTimerStartTime = null, vapeTimerIntervalId = null;
    let vapeTimerTargetEndTime = null, vapeTimerMode = 'up';

    let particleCtx = null, particles = [], isAnimatingParticles = false, vapeParticleIntervalId = null;
    let cigaretteLogConfirmationStep = 0;

    const SMOKE_DATA_PREFIX = 'smoketrack_';

    // =================================================================================
    // SECTION: HELPER FUNCTIONS (Utilizing SharedUtils where appropriate)
    // =================================================================================
    function formatTimerDisplay(totalSeconds) {
        if (isNaN(totalSeconds) || totalSeconds < 0) { return "00:00"; }
        const m = Math.floor(totalSeconds / 60);
        const s = Math.floor(totalSeconds % 60);
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    function parseMMSS(timeString) {
        if (!timeString || typeof timeString !== 'string') { return null; }
        const parts = timeString.split(':');
        if (parts.length !== 2) { return null; }
        const m = parseInt(parts[0], 10);
        const s = parseInt(parts[1], 10);
        if (isNaN(m) || isNaN(s) || m < 0 || s < 0 || s >= 60) { return null; }
        return (m * 60) + s;
    }

    function triggerPointsFlashOnPage() {
        const display = document.querySelector('#userPoints')?.parentElement;
        if (display) {
            display.classList.add('points-earned-flash');
            setTimeout(() => { display.classList.remove('points-earned-flash'); }, 500);
        }
    }

    function awardPoints(amount, reason = "") {
        if (DataManager.addPoints(amount, reason)) {
            userPoints = DataManager.getUserPoints();
            triggerPointsFlashOnPage();
            updateHeaderDisplays(); // Also updates shopUserPointsDisplay
        }
    }

    // =================================================================================
    // SECTION: PARTICLE SYSTEM (Local to this script)
    // =================================================================================
    function initializeParticleCanvas() {
        if (particleCanvas) {
            particleCtx = particleCanvas.getContext('2d');
            particleCanvas.width = window.innerWidth;
            particleCanvas.height = window.innerHeight;
            window.addEventListener('resize', () => {
                if (particleCanvas && particleCtx) {
                    particleCanvas.width = window.innerWidth;
                    particleCanvas.height = window.innerHeight;
                }
            });
        } else { console.warn("Smoke Tracker particle canvas not found."); }
    }

    function createGenericParticle(x, y, options) {
        if (!particleCtx || !particleCanvas) return;
        const defaults = { color: '#FFFFFF', size: Math.random() * 5 + 2, count: 1, spread: 3, speedX: (Math.random() - 0.5) * (options.spread || 3), speedY: (Math.random() * -1.5 - 0.5) * (options.speedMultiplier || 1), life: 60 + Math.random() * 40, gravity: 0.01, alphaDecay: 0.98, alpha: 1, initialSpread: (options.initialSpread || 0) };
        const pOptions = { ...defaults, ...options };
        for (let i = 0; i < pOptions.count; i++) {
            particles.push({ x: x + (Math.random() - 0.5) * pOptions.initialSpread, y: y + (Math.random() - 0.5) * pOptions.initialSpread, size: pOptions.size, color: pOptions.color, vx: pOptions.speedX, vy: pOptions.speedY, life: pOptions.life, alpha: pOptions.alpha, gravity: pOptions.gravity, alphaDecay: pOptions.alphaDecay });
        }
        if (particles.length > 0 && !isAnimatingParticles) {
            isAnimatingParticles = true;
            requestAnimationFrame(updateAndDrawParticles);
        }
    }

    function updateAndDrawParticles() {
        if (!particleCtx || !particleCanvas) { isAnimatingParticles = false; return; }
        particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height);
        let stillAnimating = false;
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.alpha *= p.alphaDecay; p.life--;
            if (p.life <= 0 || p.alpha <= 0.01) {
                particles.splice(i, 1); continue;
            }
            particleCtx.fillStyle = p.color; particleCtx.globalAlpha = p.alpha;
            particleCtx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
            stillAnimating = true;
        }
        particleCtx.globalAlpha = 1;
        if (stillAnimating) { requestAnimationFrame(updateAndDrawParticles); }
        else { isAnimatingParticles = false; }
    }

    function triggerCigarettePuff() {
        if (!logCigaretteButton || !particleCtx) return;
        const rect = logCigaretteButton.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2; const centerY = rect.top + rect.height / 2;
        const greyColors = ['#AAAAAA', '#BBBBBB', '#CCCCCC', '#DDDDDD'];
        for (let i = 0; i < 30; i++) {
            const angle = Math.random() * Math.PI * 2;
            const emitX = centerX + Math.cos(angle) * (rect.width / 2);
            const emitY = centerY + Math.sin(angle) * (rect.height / 2);
            const speedMagnitude = 0.5 + Math.random() * 1;
            const vx = Math.cos(angle) * speedMagnitude * (0.5 + Math.random() * 0.5);
            const vy = Math.sin(angle) * speedMagnitude * (0.5 + Math.random() * 0.5) - (0.2 + Math.random() * 0.3);
            createGenericParticle(emitX, emitY, { color: greyColors[Math.floor(Math.random() * greyColors.length)], size: Math.random() * 5 + 3, speedX: vx, speedY: vy, gravity: -0.015, life: 40 + Math.random() * 30, alphaDecay: 0.96, initialSpread: 2 });
        }
    }

    function startVapeParticleStream() {
        if (!startVapeTimerButton || vapeParticleIntervalId || !particleCtx) return;
        const rect = startVapeTimerButton.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2; const centerY = rect.top + rect.height / 2;
        vapeParticleIntervalId = setInterval(() => {
            if (!isVapeTimerRunning) { stopVapeParticleStream(); return; }
            const angle = Math.random() * Math.PI * 2;
            const emitX = centerX + Math.cos(angle) * (rect.width / 2);
            const emitY = centerY + Math.sin(angle) * (rect.height / 2);
            const speedMagnitude = 0.2 + Math.random() * 0.3;
            const vx = Math.cos(angle) * speedMagnitude;
            const vy = Math.sin(angle) * speedMagnitude - (0.1 + Math.random() * 0.2);
            createGenericParticle(emitX, emitY, { color: '#F0F0F0', size: Math.random() * 3 + 2, count: 1, speedX: vx, speedY: vy, gravity: -0.025, life: 70 + Math.random() * 40, alphaDecay: 0.99, initialSpread: 1 });
        }, 200);
    }

    function stopVapeParticleStream() {
        if (vapeParticleIntervalId) { clearInterval(vapeParticleIntervalId); vapeParticleIntervalId = null; }
    }

    // =================================================================================
    // SECTION: LOG COMPACTION LOGIC
    // =================================================================================
    const COMPACTION_TIME_WINDOW_MS = 5 * 60 * 1000;
    const MAX_LOG_ENTRIES_AFTER_COMPACTION = 50;
    function compactSmokeLog() {
        if (smokeLog.length < 2) return;
        const newCompactedLog = [];
        let lastPushedEntry = null;
        smokeLog.forEach(currentEntry => { // Iterate forwards for easier logic
            if (lastPushedEntry &&
                currentEntry.type === 'cigarette' &&
                lastPushedEntry.type === 'cigarette' &&
                (currentEntry.timestamp - lastPushedEntry.lastTimestampInGroup) <= COMPACTION_TIME_WINDOW_MS &&
                (currentEntry.reason || '') === (lastPushedEntry.reason || '')) {
                lastPushedEntry.count = (lastPushedEntry.count || 1) + 1;
                lastPushedEntry.lastTimestampInGroup = currentEntry.timestamp;
            } else {
                const entryToPush = { ...currentEntry };
                if (entryToPush.type === 'cigarette' && !entryToPush.count) { // Ensure count if new
                    entryToPush.count = 1;
                    entryToPush.lastTimestampInGroup = entryToPush.timestamp;
                }
                newCompactedLog.push(entryToPush);
                lastPushedEntry = newCompactedLog[newCompactedLog.length - 1];
            }
        });
        smokeLog = newCompactedLog;
        if (smokeLog.length > MAX_LOG_ENTRIES_AFTER_COMPACTION) {
            smokeLog = smokeLog.slice(smokeLog.length - MAX_LOG_ENTRIES_AFTER_COMPACTION); // Keep most recent
        }
    }

    // =================================================================================
    // SECTION: STATE MANAGEMENT (Using DataManager)
    // =================================================================================
    function loadState() {
        userPoints = DataManager.getUserPoints();
        smokeFreeStreak = DataManager.loadData(SMOKE_DATA_PREFIX + 'streak', 0);
        healthMilestones = DataManager.loadData(SMOKE_DATA_PREFIX + 'milestones', 0);
        dailyCigaretteLimit = DataManager.loadData(SMOKE_DATA_PREFIX + 'cig_limit', 5);
        vapeSessionDurationLimit = DataManager.loadData(SMOKE_DATA_PREFIX + 'vape_session_limit', 30);
        dailyTotalVapeTimeLimit = DataManager.loadData(SMOKE_DATA_PREFIX + 'vape_daily_limit', 300);
        smokeLog = DataManager.loadData(SMOKE_DATA_PREFIX + 'log_v2', []);
        lastLogDate = DataManager.loadData(SMOKE_DATA_PREFIX + 'last_log_date', '');
        todayCigaretteCount = DataManager.loadData(SMOKE_DATA_PREFIX + 'today_cig', 0);
        todayTotalVapeTime = DataManager.loadData(SMOKE_DATA_PREFIX + 'today_vape_time', 0);
        lastDayStreakIncremented = DataManager.loadData(SMOKE_DATA_PREFIX + 'last_streak_date', '');

        if (setLimitInput) setLimitInput.value = dailyCigaretteLimit;
        if (setDailyVapeTimeLimitInput) setDailyVapeTimeLimitInput.value = Math.floor(dailyTotalVapeTimeLimit / 60);
        if (setVapeSessionLimitInput) setVapeSessionLimitInput.value = formatTimerDisplay(vapeSessionDurationLimit);
        compactSmokeLog(); // Compact after loading existing log
    }

    function saveState() {
        DataManager.saveData(SMOKE_DATA_PREFIX + 'streak', smokeFreeStreak);
        DataManager.saveData(SMOKE_DATA_PREFIX + 'milestones', healthMilestones);
        DataManager.saveData(SMOKE_DATA_PREFIX + 'cig_limit', dailyCigaretteLimit);
        DataManager.saveData(SMOKE_DATA_PREFIX + 'vape_session_limit', vapeSessionDurationLimit);
        DataManager.saveData(SMOKE_DATA_PREFIX + 'vape_daily_limit', dailyTotalVapeTimeLimit);
        DataManager.saveData(SMOKE_DATA_PREFIX + 'log_v2', smokeLog);
        DataManager.saveData(SMOKE_DATA_PREFIX + 'last_log_date', lastLogDate);
        DataManager.saveData(SMOKE_DATA_PREFIX + 'today_cig', todayCigaretteCount);
        DataManager.saveData(SMOKE_DATA_PREFIX + 'today_vape_time', todayTotalVapeTime);
        DataManager.saveData(SMOKE_DATA_PREFIX + 'last_streak_date', lastDayStreakIncremented);
        // Global user points are saved via DataManager.addPoints/setUserPoints
    }

    // =================================================================================
    // SECTION: CORE SMOKE TRACKER LOGIC
    // =================================================================================
    function checkDateAndResetCounts() {
        const currentDate = SharedUtils.getCurrentDateString();
        if (currentDate !== lastLogDate && lastLogDate !== '') {
            const cigsUnderLimit = dailyCigaretteLimit > 0 ? todayCigaretteCount <= dailyCigaretteLimit : true;
            const vapeUnderLimit = dailyTotalVapeTimeLimit > 0 ? todayTotalVapeTime <= dailyTotalVapeTimeLimit : true;
            const yesterdayWasUnderLimit = cigsUnderLimit && vapeUnderLimit;

            if (yesterdayWasUnderLimit) {
                if (currentDate !== lastDayStreakIncremented) {
                    smokeFreeStreak++;
                    lastDayStreakIncremented = currentDate;
                    SharedUtils.showToast(`Streak Extended! ${smokeFreeStreak} Days!`, 2500, 'success');
                    awardPoints(5, `Streak: ${smokeFreeStreak} Days`);
                    if ([1, 3, 7, 14, 30, 60, 90, 180, 365].includes(smokeFreeStreak)) { // Added more milestones
                        healthMilestones++;
                        awardPoints(Math.max(10, smokeFreeStreak * 2), `Milestone: ${smokeFreeStreak}-Day Streak!`);
                        SharedUtils.showToast(`MILESTONE! ${smokeFreeStreak}-Day Streak Achieved!`, 3000, 'success');
                    }
                }
            } else {
                if (smokeFreeStreak > 0) SharedUtils.showToast("Streak Reset. Keep trying!", 3000, 'info');
                smokeFreeStreak = 0;
            }
            todayCigaretteCount = 0;
            todayTotalVapeTime = 0;
        }
        lastLogDate = currentDate;
        saveState(); // Save changes from daily processing
    }

    function resetCigaretteButton() {
        if (!logCigaretteButton) return;
        cigaretteLogConfirmationStep = 0;
        logCigaretteButton.innerHTML = '<i class="fas fa-smoking"></i> LOG CIGARETTE';
        logCigaretteButton.style.backgroundColor = '';
    }

    function actuallyLogCigarette() {
        todayCigaretteCount++;
        const newLogEntry = { type: 'cigarette', timestamp: Date.now(), reason: '', count: 1, lastTimestampInGroup: Date.now() };
        smokeLog.unshift(newLogEntry);
        compactSmokeLog();
        triggerCigarettePuff();
        SharedUtils.showToast("Cigarette logged.", 2000, 'info');
        checkAndWarnLimits();
        updateDisplaysOnLog(); // This will saveState and update all UI
        resetCigaretteButton();
    }

    function handleLogCigaretteClick() {
        if (!logCigaretteButton) return;
        checkDateAndResetCounts();

        if (cigaretteLogConfirmationStep === 0) {
            logCigaretteButton.innerHTML = '<i class="fas fa-question-circle"></i> ARE YOU SURE?';
            cigaretteLogConfirmationStep = 1;
        } else if (cigaretteLogConfirmationStep === 1) {
            const willGoOverLimit = dailyCigaretteLimit > 0 && (todayCigaretteCount + 1) > dailyCigaretteLimit;
            if (willGoOverLimit) {
                logCigaretteButton.innerHTML = '<i class="fas fa-exclamation-triangle"></i> SURE SURE? (Over Limit!)';
                logCigaretteButton.style.backgroundColor = 'var(--theme-highlight-accent)';
                cigaretteLogConfirmationStep = 2;
            } else {
                actuallyLogCigarette();
            }
        } else if (cigaretteLogConfirmationStep === 2) {
            actuallyLogCigarette();
        }
    }

    function startVapeTimer() {
        if (isVapeTimerRunning || !startVapeTimerButton || !stopVapeTimerButton || !vapeTimerDisplay) return;
        checkDateAndResetCounts();
        isVapeTimerRunning = true;
        vapeTimerStartTime = Date.now();
        startVapeTimerButton.style.display = 'none';
        stopVapeTimerButton.style.display = 'inline-block';
        vapeTimerDisplay.classList.remove('warning', 'counting-down');

        if (vapeSessionDurationLimit > 0) {
            vapeTimerMode = 'down';
            vapeTimerTargetEndTime = vapeTimerStartTime + vapeSessionDurationLimit * 1000;
            vapeTimerDisplay.textContent = formatTimerDisplay(vapeSessionDurationLimit);
            vapeTimerDisplay.classList.add('counting-down');
            SharedUtils.showToast(`Vape timer counting down from ${formatTimerDisplay(vapeSessionDurationLimit)}!`, 2000, 'info');
        } else {
            vapeTimerMode = 'up';
            vapeTimerTargetEndTime = null;
            vapeTimerDisplay.textContent = formatTimerDisplay(0);
            SharedUtils.showToast("Vape timer counting up!", 2000, 'info');
        }
        startVapeParticleStream();
        vapeTimerIntervalId = setInterval(updateVapeTimerDisplay, 1000);
    }

    function updateVapeTimerDisplay() {
        if (!isVapeTimerRunning || !vapeTimerDisplay) return;
        if (vapeTimerMode === 'down' && vapeTimerTargetEndTime) {
            const remainingMillis = vapeTimerTargetEndTime - Date.now();
            if (remainingMillis <= 0) {
                vapeTimerDisplay.textContent = "00:00";
                SharedUtils.showToast("Vape session limit reached!", 3000, 'warning');
                vapeTimerDisplay.classList.add('warning');
                stopVapeTimer(true); // autoStopped
            } else {
                vapeTimerDisplay.textContent = formatTimerDisplay(Math.ceil(remainingMillis / 1000));
            }
        } else if (vapeTimerMode === 'up' && vapeTimerStartTime) {
            vapeTimerDisplay.textContent = formatTimerDisplay(Math.floor((Date.now() - vapeTimerStartTime) / 1000));
        }
    }

    function stopVapeTimer(autoStopped = false) {
        if (!isVapeTimerRunning) return;
        clearInterval(vapeTimerIntervalId);
        isVapeTimerRunning = false;
        const endTime = Date.now();
        let durationSeconds;

        if (vapeTimerMode === 'down') {
            durationSeconds = autoStopped ? vapeSessionDurationLimit : Math.min(vapeSessionDurationLimit, Math.max(1, Math.round((endTime - vapeTimerStartTime) / 1000)));
        } else {
            durationSeconds = Math.max(1, Math.round((endTime - vapeTimerStartTime) / 1000));
        }

        todayTotalVapeTime += durationSeconds;
        const newLogEntry = { type: 'vape', timestamp: endTime, duration: durationSeconds, reason: '' };
        smokeLog.unshift(newLogEntry);
        compactSmokeLog();

        if (startVapeTimerButton) startVapeTimerButton.style.display = 'inline-block';
        if (stopVapeTimerButton) stopVapeTimerButton.style.display = 'none';
        if (vapeTimerDisplay) {
            vapeTimerDisplay.textContent = formatTimerDisplay(0);
            vapeTimerDisplay.classList.remove('warning', 'counting-down');
        }
        stopVapeParticleStream();
        if (!autoStopped) SharedUtils.showToast(`Vape session logged: ${SharedUtils.formatTime(durationSeconds)}`, 2000, 'info');
        checkAndWarnLimits();
        updateDisplaysOnLog();
    }

    function checkAndWarnLimits() {
        const cigOver = dailyCigaretteLimit > 0 && todayCigaretteCount > dailyCigaretteLimit;
        const vapeOver = dailyTotalVapeTimeLimit > 0 && todayTotalVapeTime > dailyTotalVapeTimeLimit;
        if (cigOver) SharedUtils.showToast(`Warning: Cigarette limit (${dailyCigaretteLimit}) exceeded!`, 3000, 'warning');
        if (vapeOver) SharedUtils.showToast(`Warning: Daily vape time limit (${SharedUtils.formatTime(dailyTotalVapeTimeLimit)}) exceeded!`, 3000, 'warning');
    }

    // =================================================================================
    // SECTION: UI UPDATE FUNCTIONS
    // =================================================================================
    function updateHeaderDisplays() {
        if (userPointsDisplay) userPointsDisplay.textContent = userPoints;
        if (smokeFreeStreakDisplay) smokeFreeStreakDisplay.textContent = smokeFreeStreak;
        if (streakDisplayElement) streakDisplayElement.textContent = `${smokeFreeStreak} Days`;
        if (healthMilestonesDisplay) healthMilestonesDisplay.textContent = healthMilestones;
        if (shopUserPointsDisplay) shopUserPointsDisplay.textContent = userPoints;
    }

    function updateStatusDisplay() {
        if (todayCigaretteCountDisplay) todayCigaretteCountDisplay.textContent = todayCigaretteCount;
        if (cigaretteLimitDisplay) cigaretteLimitDisplay.textContent = dailyCigaretteLimit > 0 ? dailyCigaretteLimit : 'Off';
        const cigStatusParent = todayCigaretteCountDisplay?.parentElement?.parentElement;
        if (cigStatusParent) cigStatusParent.classList.toggle('over-limit', dailyCigaretteLimit > 0 && todayCigaretteCount > dailyCigaretteLimit);

        if (todayTotalVapeTimeDisplay) todayTotalVapeTimeDisplay.textContent = SharedUtils.formatTime(todayTotalVapeTime);
        if (dailyVapeTimeLimitDisplay) dailyVapeTimeLimitDisplay.textContent = dailyTotalVapeTimeLimit > 0 ? SharedUtils.formatTime(dailyTotalVapeTimeLimit) : 'Off';
        const vapeStatusParent = todayTotalVapeTimeDisplay?.parentElement?.parentElement;
        if (vapeStatusParent) vapeStatusParent.classList.toggle('over-limit', dailyTotalVapeTimeLimit > 0 && todayTotalVapeTime > dailyTotalVapeTimeLimit);

        if (startVapeTimerButton) startVapeTimerButton.style.display = isVapeTimerRunning ? 'none' : 'inline-block';
        if (stopVapeTimerButton) stopVapeTimerButton.style.display = isVapeTimerRunning ? 'inline-block' : 'none';
        if (vapeTimerDisplay && !isVapeTimerRunning) {
            vapeTimerDisplay.textContent = formatTimerDisplay(0);
            vapeTimerDisplay.classList.remove('warning', 'counting-down');
        }
        if (cigaretteLogConfirmationStep !== 0 && logCigaretteButton) {
            const currentDate = SharedUtils.getCurrentDateString();
            if (lastLogDate !== '' && lastLogDate !== currentDate) resetCigaretteButton();
        }
    }

    function renderSmokeLog() {
        if (!smokeLogList) return;
        smokeLogList.innerHTML = '';
        const logsToRender = smokeLog.slice(0, 30);
        if (noLogsPlaceholder) noLogsPlaceholder.style.display = logsToRender.length === 0 ? 'block' : 'none';
        if (logsToRender.length === 0) return;

        logsToRender.forEach(log => {
            const li = document.createElement('li'); li.className = 'moment-card';
            const ts = (log.type === 'cigarette' && log.count > 1 && log.lastTimestampInGroup) ? log.lastTimestampInGroup : log.timestamp;
            const time = new Date(ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const date = new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
            let icon = '', color = '', text = '', details = '';
            let reasonIcon = log.reason ? 'fas fa-comment-dots has-reason' : 'far fa-comment-dots';
            let reasonTitle = log.reason ? 'Edit Reason' : 'Add Reason';

            if (log.type === 'cigarette') {
                icon = 'fas fa-smoking'; color = 'var(--theme-highlight-accent)'; text = `Cigarette${log.count > 1 ? ` (x${log.count})` : ''}`;
            } else if (log.type === 'vape') {
                icon = 'fas fa-vial'; color = 'var(--theme-primary-accent)'; text = 'Vape Session'; details = log.duration ? `(${SharedUtils.formatTime(log.duration)})` : '';
            }
            li.innerHTML = `
                <div class="log-item-content">
                    <div class="log-item-details"><i class="${icon}" style="color: ${color};"></i><span>${text} ${details}</span></div>
                    <div class="log-item-reason-icon-container">
                        <span class="log-item-time">${date} @ ${time}</span>
                        <i class="add-reason-icon ${reasonIcon}" data-timestamp="${log.timestamp}" title="${reasonTitle}"></i>
                    </div>
                </div>`;
            smokeLogList.appendChild(li);
        });
    }

    function renderDailyProgressChart() {
        if (!dailyProgressChartContainer) return;
        dailyProgressChartContainer.innerHTML = '';
        const BAR_MAX_HEIGHT_PX = 100;
        let dailyData = []; let maxCigs = 0;
        for (let i = 6; i >= 0; i--) {
            const d = new Date(); d.setDate(d.getDate() - i);
            const ds = SharedUtils.getDateStringFromTimestamp(d.getTime());
            const dayLabel = d.toLocaleDateString(undefined, { weekday: 'short' }).substring(0,2);
            let cigs = 0;
            smokeLog.forEach(log => { if (log.type === 'cigarette' && SharedUtils.getDateStringFromTimestamp(log.timestamp) === ds) cigs += (log.count || 1); });
            dailyData.push({ date: ds, dayLabel, cigarettes: cigs });
            if (cigs > maxCigs) maxCigs = cigs;
        }
        const scaleMax = Math.max(dailyCigaretteLimit > 0 ? dailyCigaretteLimit : 5, maxCigs, 5);
        dailyData.forEach(data => {
            const col = document.createElement('div'); col.className = 'chart-day-column';
            const wrap = document.createElement('div'); wrap.className = 'chart-bar-wrapper';
            const val = document.createElement('div'); val.className = 'chart-bar-value'; val.textContent = data.cigarettes;
            const bar = document.createElement('div'); bar.className = 'chart-bar cigarette-bar';
            bar.style.height = `${Math.min(Math.max((scaleMax > 0 ? (data.cigarettes / scaleMax) * BAR_MAX_HEIGHT_PX : 0), 0), BAR_MAX_HEIGHT_PX)}px`;
            bar.title = `${data.cigarettes} cigs on ${data.date}`;
            const lbl = document.createElement('div'); lbl.className = 'chart-day-label'; lbl.textContent = data.dayLabel;
            wrap.append(val, bar); col.append(wrap, lbl); dailyProgressChartContainer.append(col);
        });
    }

    function updateDisplaysOnLog() {
        updateHeaderDisplays();
        updateStatusDisplay();
        renderSmokeLog();
        renderDailyProgressChart();
        saveState(); // Central place to save after any log action
        if (calendarLogContainer && calendarLogContainer.classList.contains('show') &&
            typeof CalendarModule !== 'undefined' && CalendarModule.getCalendarCurrentDateForRefresh &&
            typeof generateCalendarExternal === 'function') {
            const calDateDetails = CalendarModule.getCalendarCurrentDateForRefresh();
            generateCalendarExternal(calDateDetails.month, calDateDetails.year);
        }
    }

    // =================================================================================
    // SECTION: REASON MODAL LOGIC
    // =================================================================================
    function handleOpenReasonModal(timestamp) {
        const logEntry = smokeLog.find(log => log.timestamp === timestamp);
        if (!logEntry || !reasonModalOverlay || !reasonInput || !reasonLogTimestampInput) return;
        reasonInput.value = logEntry.reason || '';
        reasonLogTimestampInput.value = timestamp;
        reasonModalOverlay.classList.add('show');
        reasonInput.focus();
    }
    function handleCloseReasonModal() {
        if (reasonModalOverlay) reasonModalOverlay.classList.remove('show');
        if (reasonInput) reasonInput.value = '';
        if (reasonLogTimestampInput) reasonLogTimestampInput.value = '';
    }
    function handleSaveReason() {
        if (!reasonLogTimestampInput || !reasonInput) return;
        const timestamp = parseInt(reasonLogTimestampInput.value);
        const newReason = reasonInput.value.trim();
        if (isNaN(timestamp)) return;
        const logEntry = smokeLog.find(log => log.timestamp === timestamp);
        if (logEntry) {
            logEntry.reason = newReason;
            compactSmokeLog(); // Re-compact if reasons affect compaction (they do in current logic)
            SharedUtils.showToast(newReason ? "Reason Saved!" : "Reason Cleared.", 2000, 'info');
            updateDisplaysOnLog(); // This saves and re-renders log
        }
        handleCloseReasonModal();
    }

    // =================================================================================
    // SECTION: CALENDAR INTEGRATION SETUP
    // =================================================================================
    function setupCalendarIntegration() {
        if (typeof initializeCalendarLogic === 'function') {
            initializeCalendarLogic({
                getSmokeLog: () => smokeLog,
                getDailyCigaretteLimit: () => dailyCigaretteLimit,
                getDailyTotalVapeTimeLimit: () => dailyTotalVapeTimeLimit,
                elements: { calendarLogContainer, calendarGridContainer, calendarMonthYearDisplay, toggleCalendarButton },
                helpers: {
                    getDateStringFromTimestamp: SharedUtils.getDateStringFromTimestamp,
                    formatTime: SharedUtils.formatTime,
                    getCurrentDateString: SharedUtils.getCurrentDateString
                }
            });
            if (toggleCalendarButton && typeof handleToggleCalendar === 'function') toggleCalendarButton.addEventListener('click', handleToggleCalendar);
            if (prevMonthButton && typeof handlePrevMonth === 'function') prevMonthButton.addEventListener('click', handlePrevMonth);
            if (nextMonthButton && typeof handleNextMonth === 'function') nextMonthButton.addEventListener('click', handleNextMonth);
            console.log("Calendar integration setup complete for Smoke Tracker.");
        } else {
            console.warn("Calendar logic not available.");
            if(toggleCalendarButton) { toggleCalendarButton.disabled = true; toggleCalendarButton.innerHTML = '<i class="fas fa-ban"></i> CAL N/A'; }
        }
    }

    // =================================================================================
    // SECTION: EVENT LISTENERS
    // =================================================================================
    if (logCigaretteButton) logCigaretteButton.addEventListener('click', handleLogCigaretteClick);
    if (startVapeTimerButton) startVapeTimerButton.addEventListener('click', startVapeTimer);
    if (stopVapeTimerButton) stopVapeTimerButton.addEventListener('click', () => stopVapeTimer(false));

    if (saveLimitButton && setLimitInput) {
        saveLimitButton.addEventListener('click', () => {
            const newLimit = parseInt(setLimitInput.value);
            if (!isNaN(newLimit) && newLimit >= 0) {
                dailyCigaretteLimit = newLimit;
                SharedUtils.showToast(`Cigarette limit set to ${dailyCigaretteLimit > 0 ? dailyCigaretteLimit : 'Off'}.`, 2000, 'info');
                updateDisplaysOnLog(); // Updates UI and saves state
            } else {
                SharedUtils.showToast("Invalid limit value.", 2000, 'error');
                setLimitInput.value = dailyCigaretteLimit; // Reset to old value
            }
        });
    }
    if (saveVapeSessionLimitButton && setVapeSessionLimitInput) {
        saveVapeSessionLimitButton.addEventListener('click', () => {
            const parsedSeconds = parseMMSS(setVapeSessionLimitInput.value);
            if (parsedSeconds !== null && parsedSeconds >= 0) {
                vapeSessionDurationLimit = parsedSeconds;
                saveState(); // Save this specific setting
                SharedUtils.showToast(`Vape session limit: ${formatTimerDisplay(vapeSessionDurationLimit)} ${parsedSeconds === 0 ? '(Count Up)' : ''}.`, 2000, 'info');
                setVapeSessionLimitInput.value = formatTimerDisplay(vapeSessionDurationLimit);
            } else {
                SharedUtils.showToast("Invalid session limit (MM:SS).", 2000, 'error');
                setVapeSessionLimitInput.value = formatTimerDisplay(vapeSessionDurationLimit);
            }
        });
    }
    if (saveDailyVapeTimeLimitButton && setDailyVapeTimeLimitInput) {
        saveDailyVapeTimeLimitButton.addEventListener('click', () => {
            const newLimitMinutes = parseInt(setDailyVapeTimeLimitInput.value);
            if (!isNaN(newLimitMinutes) && newLimitMinutes >= 0) {
                dailyTotalVapeTimeLimit = newLimitMinutes * 60;
                SharedUtils.showToast(`Daily vape time limit: ${newLimitMinutes > 0 ? newLimitMinutes + ' mins' : 'Off'}.`, 2000, 'info');
                updateDisplaysOnLog(); // Updates UI and saves state
            } else {
                SharedUtils.showToast("Invalid daily vape limit (minutes).", 2000, 'error');
                setDailyVapeTimeLimitInput.value = Math.floor(dailyTotalVapeTimeLimit / 60);
            }
        });
    }

    if (smokeLogList) smokeLogList.addEventListener('click', (e) => { if (e.target.closest('.add-reason-icon')) handleOpenReasonModal(parseInt(e.target.closest('.add-reason-icon').dataset.timestamp)); });
    if (saveReasonButton) saveReasonButton.addEventListener('click', handleSaveReason);
    if (cancelReasonButton) cancelReasonButton.addEventListener('click', handleCloseReasonModal);
    if (reasonModalOverlay) reasonModalOverlay.addEventListener('click', (e) => { if (e.target === reasonModalOverlay) handleCloseReasonModal(); });
    document.addEventListener('click', (e) => { if (logCigaretteButton && !logCigaretteButton.contains(e.target) && cigaretteLogConfirmationStep !== 0) resetCigaretteButton(); });

    if (endOfDayTestButton) {
        endOfDayTestButton.addEventListener('click', () => {
            SharedUtils.showToast("Simulating End Of Day...", 2000, 'info');
            const tempYesterday = new Date(); tempYesterday.setDate(tempYesterday.getDate() - 1);
            lastLogDate = SharedUtils.getDateStringFromTimestamp(tempYesterday.getTime());
            // todayCigaretteCount & todayTotalVapeTime implicitly become "yesterday's" counts
            checkDateAndResetCounts(); // This processes "yesterday" and resets for "today"
            updateDisplaysOnLog();
            SharedUtils.showToast("E.O.D. simulation complete.", 3000, 'success');
        });
    }

    // =================================================================================
    // SECTION: INITIALIZATION
    // =================================================================================
    function initializeSmokeTracker() {
        console.log("Initializing Smoke Tracker...");
        loadState();
        ThemeManager.applyTheme(ThemeManager.getCurrentThemeId());
        initializeParticleCanvas();
        checkDateAndResetCounts(); // Process daily logic on load

        updateHeaderDisplays();
        updateStatusDisplay();
        renderSmokeLog();
        renderDailyProgressChart();
        resetCigaretteButton();

        setupCalendarIntegration();
        console.log("Smoke Tracker Initialized (Fully Refactored for Rome Hub).");
    }

    initializeSmokeTracker();
});
