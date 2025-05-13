// smoke-tracker-script.js (Complete: Core + Compaction + Calendar Hooks)

document.addEventListener('DOMContentLoaded', () => {
    // =================================================================================
    // SECTION: CONSTANTS & STATE VARIABLES
    // =================================================================================
    const localStorageKeySuffix = '_v27_theme_shop';

    // --- Element Selectors ---
    const particleCanvas = document.getElementById('particleCanvas');
    const userPointsDisplay = document.getElementById('userPoints');
    const smokeFreeStreakDisplay = document.getElementById('smokeFreeStreak');
    const streakDisplay = document.getElementById('streakDisplay'); // For the text display of streak
    const healthMilestonesDisplay = document.getElementById('healthMilestones');
    const shopUserPointsDisplay = document.getElementById('shopUserPoints'); // For toolbar link
    const toastNotification = document.getElementById('toastNotification');
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
    const dailyProgressChartContainer = document.getElementById('dailyProgressChartContainer'); // For chart
    const endOfDayTestButton = document.getElementById('endOfDayTestButton'); // For testing

    // --- Calendar UI Selectors ---
    const toggleCalendarButton = document.getElementById('toggleCalendarButton');
    const calendarLogContainer = document.getElementById('calendarLogContainer');
    const calendarGridContainer = document.getElementById('calendarGridContainer');
    const calendarMonthYearDisplay = document.getElementById('calendarMonthYear');
    const prevMonthButton = document.getElementById('prevMonthButton');
    const nextMonthButton = document.getElementById('nextMonthButton');

    // --- State Variables ---
    let userPoints = 0, smokeFreeStreak = 0, healthMilestones = 0;
    let dailyCigaretteLimit = 5, vapeSessionDurationLimit = 30, dailyTotalVapeTimeLimit = 300;
    let smokeLog = [], lastLogDate = '', todayCigaretteCount = 0, todayTotalVapeTime = 0, lastDayStreakIncremented = '';
    let isVapeTimerRunning = false, vapeTimerStartTime = null, vapeTimerIntervalId = null;
    let vapeTimerTargetEndTime = null, vapeTimerMode = 'up';
    let ownedThemes = ['default'], currentTheme = 'default';
    let particleCtx = null, particles = [], isAnimatingParticles = false, vapeParticleIntervalId = null;
    let cigaretteLogConfirmationStep = 0;

    // =================================================================================
    // SECTION: THEME DATA OBJECT
    // =================================================================================
    const themes = { // Ensure this matches your other files
        default: { name: "Default Retro", cost: 0, owned: true, cssVariables: { '--theme-primary-dark': '#264653', '--theme-primary-accent': '#2A9D8F', '--theme-secondary-accent': '#E9C46A', '--theme-tertiary-accent': '#F4A261', '--theme-highlight-accent': '#E76F51', '--theme-light-bg': '#EAEAEA', '--theme-card-bg': '#FFFFFF', '--theme-text-on-dark': '#EAEAEA', '--theme-page-bg': 'rgb(174, 217, 211)' } },
        oceanDepths: { name: "Ocean Depths", cost: 1, cssVariables: { '--theme-primary-dark': '#03045E', '--theme-primary-accent': '#0077B6', '--theme-secondary-accent': '#00B4D8', '--theme-tertiary-accent': '#90E0EF', '--theme-highlight-accent': '#CAF0F8', '--theme-light-bg': '#E0FBFC', '--theme-card-bg': '#FFFFFF', '--theme-text-on-dark': '#CAF0F8', '--theme-page-bg': '#ADE8F4' } },
        volcanoRush: { name: "Volcano Rush", cost: 1, cssVariables: { '--theme-primary-dark': '#2B0000', '--theme-primary-accent': '#6A0000', '--theme-secondary-accent': '#FF4500', '--theme-tertiary-accent': '#FF8C00', '--theme-highlight-accent': '#AE2012', '--theme-light-bg': '#FFF2E6', '--theme-card-bg': '#FFFFFF', '--theme-text-on-dark': '#FFDAB9', '--theme-page-bg': '#FFCDB2' } },
        techOrangeBlue: { name: "Tech Orange & Blue", cost: 1, cssVariables: { '--theme-primary-dark': '#004C97', '--theme-primary-accent': '#4A7DB5', '--theme-secondary-accent': '#FF6600', '--theme-tertiary-accent': '#C0C0C0', '--theme-highlight-accent': '#FF7700', '--theme-light-bg': '#F0F0F0', '--theme-card-bg': '#FFFFFF', '--theme-text-on-dark': '#F0F0F0', '--theme-page-bg': '#E8E8E8' } },
        forestGreens: { name: "Forest Greens", cost: 1, cssVariables: { '--theme-primary-dark': '#1A2B12', '--theme-primary-accent': '#335128', '--theme-secondary-accent': '#526F35', '--theme-tertiary-accent': '#8A9A5B', '--theme-highlight-accent': '#E0E7A3', '--theme-light-bg': '#F0F5E0', '--theme-card-bg': '#FFFFFF', '--theme-text-on-dark': '#E0E7A3', '--theme-page-bg': '#D8E0C0' } }
    };

    // =================================================================================
    // SECTION: HELPER FUNCTIONS
    // =================================================================================
    function formatTime(totalSeconds) { if (isNaN(totalSeconds) || totalSeconds < 0) { return "0m 0s"; } const m = Math.floor(totalSeconds / 60); const s = Math.floor(totalSeconds % 60); return `${m}m ${s}s`; }
    function formatTimerDisplay(totalSeconds) { if (isNaN(totalSeconds) || totalSeconds < 0) { return "00:00"; } const m = Math.floor(totalSeconds / 60); const s = Math.floor(totalSeconds % 60); return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`; }
    function parseMMSS(timeString) { if (!timeString || typeof timeString !== 'string') { return null; } const p = timeString.split(':'); if (p.length !== 2) { return null; } const m = parseInt(p[0], 10); const s = parseInt(p[1], 10); if (isNaN(m) || isNaN(s) || m < 0 || s < 0 || s >= 60) { return null; } return (m * 60) + s; }
    function showToast(message, duration = 2500) { if (toastNotification) { toastNotification.textContent = message; toastNotification.classList.add('show'); setTimeout(() => { toastNotification.classList.remove('show'); }, duration); } else { console.log("Toast:", message); } }
    function triggerPointsFlash() { const d = document.querySelector('.header-stats-bar .points-display:first-child'); if (d) { d.classList.add('points-earned-flash'); } setTimeout(() => { if (d) { d.classList.remove('points-earned-flash'); } }, 500); }
    function addPoints(amount, reason = "") { if (amount > 0) { userPoints += amount; showToast(`+${amount} PTS! ${reason}`.trim(), amount > 5 ? 3000 : 2500); triggerPointsFlash(); updateHeaderDisplays(); saveState(); } }
    function getCurrentDateString() { const t = new Date(); const y = t.getFullYear(); const m = String(t.getMonth() + 1).padStart(2, '0'); const d = String(t.getDate()).padStart(2, '0'); return `${y}-${m}-${d}`; }
    function getDateStringFromTimestamp(timestamp) { const date = new Date(timestamp); const y = date.getFullYear(); const m = String(date.getMonth() + 1).padStart(2, '0'); const d = String(date.getDate()).padStart(2, '0'); return `${y}-${m}-${d}`; }

    // =================================================================================
    // SECTION: PARTICLE SYSTEM
    // =================================================================================
    function initializeParticleCanvas() { if (particleCanvas) { particleCtx = particleCanvas.getContext('2d'); particleCanvas.width = window.innerWidth; particleCanvas.height = window.innerHeight; window.addEventListener('resize', () => { if (particleCanvas && particleCtx) { particleCanvas.width = window.innerWidth; particleCanvas.height = window.innerHeight; } }); } else { console.warn("Particle canvas not found."); } }
    function createGenericParticle(x, y, options) { if (!particleCtx) { return; } const defaults = { color: '#FFFFFF', size: Math.random() * 5 + 2, count: 1, spread: 3, speedX: (Math.random() - 0.5) * options.spread, speedY: (Math.random() * -1.5 - 0.5) * (options.speedMultiplier || 1), life: 60 + Math.random() * 40, gravity: 0.01, alphaDecay: 0.98 }; const pOptions = { ...defaults, ...options }; for (let i = 0; i < pOptions.count; i++) { particles.push({ x: x + (Math.random() - 0.5) * (pOptions.initialSpread || 0), y: y + (Math.random() - 0.5) * (pOptions.initialSpread || 0), size: pOptions.size, color: pOptions.color, vx: pOptions.speedX, vy: pOptions.speedY, life: pOptions.life, alpha: 1, gravity: pOptions.gravity, alphaDecay: pOptions.alphaDecay }); } if (particles.length > 0 && !isAnimatingParticles) { isAnimatingParticles = true; requestAnimationFrame(updateAndDrawParticles); } }
    function updateAndDrawParticles() { if (!particleCtx || !particleCanvas) { isAnimatingParticles = false; return; } particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height); let stillAnimating = false; for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.alpha *= p.alphaDecay; p.life--; if (p.life <= 0 || p.alpha <= 0.01) { particles.splice(i, 1); continue; } particleCtx.fillStyle = p.color; particleCtx.globalAlpha = p.alpha; particleCtx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size); stillAnimating = true; } particleCtx.globalAlpha = 1; if (stillAnimating) { requestAnimationFrame(updateAndDrawParticles); } else { isAnimatingParticles = false; } }
    function triggerCigarettePuff() { if (!logCigaretteButton || !particleCtx) { return; } const rect = logCigaretteButton.getBoundingClientRect(); const centerX = rect.left + rect.width / 2; const centerY = rect.top + rect.height / 2; const greyColors = ['#AAAAAA', '#BBBBBB', '#CCCCCC', '#DDDDDD']; const numParticles = 30; for (let i = 0; i < numParticles; i++) { const angle = Math.random() * Math.PI * 2; const radiusX = rect.width / 2; const radiusY = rect.height / 2; const emitX = centerX + Math.cos(angle) * radiusX; const emitY = centerY + Math.sin(angle) * radiusY; const speedMagnitude = 0.5 + Math.random() * 1; const vx = Math.cos(angle) * speedMagnitude * (0.5 + Math.random() * 0.5); const vy = Math.sin(angle) * speedMagnitude * (0.5 + Math.random() * 0.5) - (0.2 + Math.random() * 0.3); createGenericParticle(emitX, emitY, { color: greyColors[Math.floor(Math.random() * greyColors.length)], size: Math.random() * 5 + 3, speedX: vx, speedY: vy, gravity: -0.015, life: 40 + Math.random() * 30, alphaDecay: 0.96, initialSpread: 2 }); } }
    function startVapeParticleStream() { if (!startVapeTimerButton || vapeParticleIntervalId || !particleCtx) { return; } const rect = startVapeTimerButton.getBoundingClientRect(); const centerX = rect.left + rect.width / 2; const centerY = rect.top + rect.height / 2; vapeParticleIntervalId = setInterval(() => { if (!isVapeTimerRunning) { stopVapeParticleStream(); return; } const angle = Math.random() * Math.PI * 2; const radiusX = rect.width / 2; const radiusY = rect.height / 2; const emitX = centerX + Math.cos(angle) * radiusX; const emitY = centerY + Math.sin(angle) * radiusY; const speedMagnitude = 0.2 + Math.random() * 0.3; const vx = Math.cos(angle) * speedMagnitude; const vy = Math.sin(angle) * speedMagnitude - (0.1 + Math.random() * 0.2); createGenericParticle(emitX, emitY, { color: '#F0F0F0', size: Math.random() * 3 + 2, count: 1, speedX: vx, speedY: vy, gravity: -0.025, life: 70 + Math.random() * 40, alphaDecay: 0.99, initialSpread: 1 }); }, 200); }
    function stopVapeParticleStream() { if (vapeParticleIntervalId) { clearInterval(vapeParticleIntervalId); vapeParticleIntervalId = null; } }

    // =================================================================================
    // SECTION: LOG COMPACTION LOGIC
    // =================================================================================
    const COMPACTION_TIME_WINDOW_MS = 5 * 60 * 1000; // 5 minutes for compaction window
    const MAX_LOG_ENTRIES_AFTER_COMPACTION = 50; // Keep a reasonable number of distinct log entries

    function compactSmokeLog() {
        if (smokeLog.length < 2) return; // Nothing to compact
        const newCompactedLog = [];
        let lastPushedEntry = null;

        for (let i = 0; i < smokeLog.length; i++) {
            const currentEntry = smokeLog[i];
            if (lastPushedEntry &&
                currentEntry.type === 'cigarette' &&
                lastPushedEntry.type === 'cigarette' &&
                (currentEntry.timestamp - lastPushedEntry.lastTimestampInGroup) <= COMPACTION_TIME_WINDOW_MS &&
                (currentEntry.reason || '') === (lastPushedEntry.reason || '')) {
                lastPushedEntry.count = (lastPushedEntry.count || 1) + 1;
                lastPushedEntry.lastTimestampInGroup = currentEntry.timestamp;
            } else {
                const entryToPush = { ...currentEntry };
                if (entryToPush.type === 'cigarette') {
                    entryToPush.count = 1;
                    entryToPush.lastTimestampInGroup = entryToPush.timestamp;
                }
                newCompactedLog.push(entryToPush);
                lastPushedEntry = newCompactedLog[newCompactedLog.length - 1];
            }
        }
        smokeLog = newCompactedLog;
        if (smokeLog.length > MAX_LOG_ENTRIES_AFTER_COMPACTION) {
            smokeLog = smokeLog.slice(0, MAX_LOG_ENTRIES_AFTER_COMPACTION);
        }
    }

    // =================================================================================
    // SECTION: LOCAL STORAGE & STATE MANAGEMENT
    // =================================================================================
    function loadState() {
        userPoints = parseInt(localStorage.getItem('idk_user_points_val' + localStorageKeySuffix)) || 0;
        smokeFreeStreak = parseInt(localStorage.getItem('smoketrack_streak' + localStorageKeySuffix)) || 0;
        healthMilestones = parseInt(localStorage.getItem('smoketrack_milestones' + localStorageKeySuffix)) || 0;
        dailyCigaretteLimit = parseInt(localStorage.getItem('smoketrack_cig_limit' + localStorageKeySuffix)) || 5;
        vapeSessionDurationLimit = parseInt(localStorage.getItem('smoketrack_vape_session_limit' + localStorageKeySuffix)) || 30;
        dailyTotalVapeTimeLimit = parseInt(localStorage.getItem('smoketrack_vape_daily_limit' + localStorageKeySuffix)) || 300;
        smokeLog = JSON.parse(localStorage.getItem('smoketrack_log_v2' + localStorageKeySuffix)) || [];
        lastLogDate = localStorage.getItem('smoketrack_last_log_date' + localStorageKeySuffix) || '';
        todayCigaretteCount = parseInt(localStorage.getItem('smoketrack_today_cig' + localStorageKeySuffix)) || 0;
        todayTotalVapeTime = parseInt(localStorage.getItem('smoketrack_today_vape_time' + localStorageKeySuffix)) || 0;
        lastDayStreakIncremented = localStorage.getItem('smoketrack_last_streak_date' + localStorageKeySuffix) || '';
        ownedThemes = JSON.parse(localStorage.getItem('idk_owned_themes' + localStorageKeySuffix)) || ['default'];
        currentTheme = localStorage.getItem('idk_current_theme' + localStorageKeySuffix) || 'default';

        if (setLimitInput) { setLimitInput.value = dailyCigaretteLimit; }
        if (setDailyVapeTimeLimitInput) { setDailyVapeTimeLimitInput.value = Math.floor(dailyTotalVapeTimeLimit / 60); }
        if (setVapeSessionLimitInput) { setVapeSessionLimitInput.value = formatTimerDisplay(vapeSessionDurationLimit); }

        compactSmokeLog(); // Compact logs after loading
    }
    function saveState() {
        localStorage.setItem('idk_user_points_val' + localStorageKeySuffix, userPoints.toString());
        localStorage.setItem('smoketrack_streak' + localStorageKeySuffix, smokeFreeStreak.toString());
        localStorage.setItem('smoketrack_milestones' + localStorageKeySuffix, healthMilestones.toString());
        localStorage.setItem('smoketrack_cig_limit' + localStorageKeySuffix, dailyCigaretteLimit.toString());
        localStorage.setItem('smoketrack_vape_session_limit' + localStorageKeySuffix, vapeSessionDurationLimit.toString());
        localStorage.setItem('smoketrack_vape_daily_limit' + localStorageKeySuffix, dailyTotalVapeTimeLimit.toString());
        localStorage.setItem('smoketrack_log_v2' + localStorageKeySuffix, JSON.stringify(smokeLog)); // Save potentially compacted log
        localStorage.setItem('smoketrack_last_log_date' + localStorageKeySuffix, lastLogDate);
        localStorage.setItem('smoketrack_today_cig' + localStorageKeySuffix, todayCigaretteCount.toString());
        localStorage.setItem('smoketrack_today_vape_time' + localStorageKeySuffix, todayTotalVapeTime.toString());
        localStorage.setItem('smoketrack_last_streak_date' + localStorageKeySuffix, lastDayStreakIncremented);
        localStorage.setItem('idk_owned_themes' + localStorageKeySuffix, JSON.stringify(ownedThemes));
        localStorage.setItem('idk_current_theme' + localStorageKeySuffix, currentTheme);
    }

    // =================================================================================
    // SECTION: THEME APPLICATION
    // =================================================================================
    function applyThemeOnPage(themeId) {
        const themeToApply = themes[themeId] || themes.default;
        currentTheme = themeId;
        if (themeToApply && themeToApply.cssVariables) {
            const themeVars = themeToApply.cssVariables;
            for (const [key, value] of Object.entries(themeVars)) { document.documentElement.style.setProperty(key, value); }
            document.documentElement.style.setProperty('--theme-text-main', themeVars['--theme-primary-dark']);
            document.documentElement.style.setProperty('--theme-border-main', themeVars['--theme-primary-dark']);
        } else {
            console.warn(`Theme ID "${themeId}" not found. Applying default.`);
            applyThemeOnPage('default'); return; // Recursive call to apply default
        }
        // No saveState here, assuming theme is set via shop and loaded via loadState
    }

    // =================================================================================
    // SECTION: CORE SMOKE TRACKER LOGIC
    // =================================================================================
    function checkDateAndResetCounts() {
        const currentDate = getCurrentDateString();
        if (currentDate !== lastLogDate && lastLogDate !== '') {
            const yesterdayCigsUnder = todayCigaretteCount <= dailyCigaretteLimit;
            const yesterdayVapeUnder = todayTotalVapeTime <= dailyTotalVapeTimeLimit;
            const yesterdayWasUnderLimit = yesterdayCigsUnder && yesterdayVapeUnder;

            if (yesterdayWasUnderLimit) {
                if (currentDate !== lastDayStreakIncremented) {
                    smokeFreeStreak++; lastDayStreakIncremented = currentDate;
                    showToast(`Streak Extended! ${smokeFreeStreak} Days!`); addPoints(5, `Streak: ${smokeFreeStreak} Days`);
                    if ([1, 3, 7, 14, 30, 60, 90].includes(smokeFreeStreak)) {
                        healthMilestones++; addPoints(Math.max(10, smokeFreeStreak * 2), `Milestone: ${smokeFreeStreak}-Day Streak!`);
                        showToast(`MILESTONE! ${smokeFreeStreak}-Day Streak Achieved!`);
                    }
                }
            } else {
                if (smokeFreeStreak > 0) { showToast("Streak Reset. Keep trying!", 3000); }
                smokeFreeStreak = 0; lastDayStreakIncremented = '';
            }
            todayCigaretteCount = 0; todayTotalVapeTime = 0;
        }
        lastLogDate = currentDate; // Always update last log date
        // Save state implicitly via addPoints or explicitly if no points awarded
        saveState();
    }

    function resetCigaretteButton() {
        if (!logCigaretteButton) return;
        cigaretteLogConfirmationStep = 0;
        logCigaretteButton.innerHTML = '<i class="fas fa-smoking"></i> LOG CIGARETTE';
        logCigaretteButton.style.backgroundColor = ''; // Reset style
    }

    function actuallyLogCigarette() {
        if (!logCigaretteButton) return;
        todayCigaretteCount++;
        const logEntry = { type: 'cigarette', timestamp: Date.now(), reason: '' };
        smokeLog.unshift(logEntry); // Add to beginning
        compactSmokeLog(); // Compact *after* adding
        triggerCigarettePuff();
        showToast("Cigarette logged.");
        checkAndWarnLimits();
        updateStatusDisplay();
        renderSmokeLog();
        renderDailyProgressChart(); // Update chart
        saveState();
        resetCigaretteButton();
    }

    function handleLogCigaretteClick() {
        if (!logCigaretteButton) return;
        checkDateAndResetCounts();
        if (cigaretteLogConfirmationStep === 0) {
            logCigaretteButton.innerHTML = '<i class="fas fa-question-circle"></i> ARE YOU SURE?';
            cigaretteLogConfirmationStep = 1;
        } else if (cigaretteLogConfirmationStep === 1) {
            const willGoOverLimit = (todayCigaretteCount + 1) > dailyCigaretteLimit;
            if (willGoOverLimit && dailyCigaretteLimit > 0) {
                logCigaretteButton.innerHTML = '<i class="fas fa-exclamation-triangle"></i> SURE SURE? (Over Limit!)';
                logCigaretteButton.style.backgroundColor = 'var(--theme-highlight-accent)';
                cigaretteLogConfirmationStep = 2;
            } else { actuallyLogCigarette(); }
        } else if (cigaretteLogConfirmationStep === 2) { actuallyLogCigarette(); }
    }

    function startVapeTimer() {
        if (isVapeTimerRunning) { return; } checkDateAndResetCounts(); isVapeTimerRunning = true; vapeTimerStartTime = Date.now();
        startVapeTimerButton.disabled = true; stopVapeTimerButton.disabled = false; stopVapeTimerButton.style.display = 'inline-block'; vapeTimerDisplay.classList.remove('warning', 'counting-down');
        if (vapeSessionDurationLimit > 0) {
            vapeTimerMode = 'down'; vapeTimerTargetEndTime = vapeTimerStartTime + vapeSessionDurationLimit * 1000; vapeTimerDisplay.textContent = formatTimerDisplay(vapeSessionDurationLimit); vapeTimerDisplay.classList.add('counting-down'); showToast(`Vape timer started (Counting down from ${formatTimerDisplay(vapeSessionDurationLimit)})!`);
        } else { vapeTimerMode = 'up'; vapeTimerTargetEndTime = null; vapeTimerDisplay.textContent = formatTimerDisplay(0); showToast("Vape timer started (Counting up)!"); }
        startVapeParticleStream();
        vapeTimerIntervalId = setInterval(() => { if (vapeTimerMode === 'down') { const rM = vapeTimerTargetEndTime - Date.now(); if (rM <= 0) { vapeTimerDisplay.textContent = "00:00"; showToast("Vape session limit reached!", 3000); vapeTimerDisplay.classList.add('warning'); stopVapeTimer(true); } else { const rS = Math.ceil(rM / 1000); vapeTimerDisplay.textContent = formatTimerDisplay(rS); } } else { const eM = Date.now() - vapeTimerStartTime; const eS = Math.floor(eM / 1000); vapeTimerDisplay.textContent = formatTimerDisplay(eS); } }, 1000);
    }

    function stopVapeTimer(autoStopped = false) {
        if (!isVapeTimerRunning) { return; } clearInterval(vapeTimerIntervalId); isVapeTimerRunning = false; const endTime = Date.now(); let durationSeconds;
        if (vapeTimerMode === 'down') { if (autoStopped) { durationSeconds = vapeSessionDurationLimit; } else { durationSeconds = Math.max(1, Math.round((endTime - vapeTimerStartTime) / 1000)); durationSeconds = Math.min(durationSeconds, vapeSessionDurationLimit); } } else { durationSeconds = Math.max(1, Math.round((endTime - vapeTimerStartTime) / 1000)); }
        todayTotalVapeTime += durationSeconds;
        const logEntry = { type: 'vape', timestamp: endTime, duration: durationSeconds, reason: '' };
        smokeLog.unshift(logEntry); // Add to beginning
        compactSmokeLog(); // Compact *after* adding
        vapeTimerStartTime = null; vapeTimerTargetEndTime = null; vapeTimerMode = 'up'; startVapeTimerButton.disabled = false; stopVapeTimerButton.disabled = true; stopVapeTimerButton.style.display = 'none'; vapeTimerDisplay.textContent = formatTimerDisplay(0); vapeTimerDisplay.classList.remove('warning', 'counting-down');
        stopVapeParticleStream();
        if (!autoStopped) { showToast(`Vape session logged: ${formatTime(durationSeconds)}`); }
        checkAndWarnLimits(); updateStatusDisplay(); renderSmokeLog(); renderDailyProgressChart(); // Update chart
        saveState();
    }

    function checkAndWarnLimits() {
        const cigOver = todayCigaretteCount > dailyCigaretteLimit && dailyCigaretteLimit > 0;
        const vapeOver = todayTotalVapeTime > dailyTotalVapeTimeLimit && dailyTotalVapeTimeLimit > 0;
        if (cigOver) { showToast(`Warning: Cigarette limit (${dailyCigaretteLimit}) exceeded!`, 3000); }
        if (vapeOver) { showToast(`Warning: Daily vape time limit (${formatTime(dailyTotalVapeTimeLimit)}) exceeded!`, 3000); }
    }

    // =================================================================================
    // SECTION: UI UPDATE FUNCTIONS
    // =================================================================================
    function updateHeaderDisplays() { if (userPointsDisplay) { userPointsDisplay.textContent = userPoints; } if (smokeFreeStreakDisplay) { smokeFreeStreakDisplay.textContent = smokeFreeStreak; } if (streakDisplay) { streakDisplay.textContent = `${smokeFreeStreak} Days`; } if (healthMilestonesDisplay) { healthMilestonesDisplay.textContent = healthMilestones; } if (shopUserPointsDisplay) { shopUserPointsDisplay.textContent = userPoints; } }
    function updateStatusDisplay() {
        if (todayCigaretteCountDisplay) { todayCigaretteCountDisplay.textContent = todayCigaretteCount; } if (cigaretteLimitDisplay) { cigaretteLimitDisplay.textContent = dailyCigaretteLimit > 0 ? dailyCigaretteLimit : 'Off'; }
        if (todayCigaretteCountDisplay && todayCigaretteCountDisplay.parentElement) { todayCigaretteCountDisplay.parentElement.classList.toggle('over-limit', dailyCigaretteLimit > 0 && todayCigaretteCount > dailyCigaretteLimit); }
        if (todayTotalVapeTimeDisplay) { todayTotalVapeTimeDisplay.textContent = formatTime(todayTotalVapeTime); } if (dailyVapeTimeLimitDisplay) { dailyVapeTimeLimitDisplay.textContent = dailyTotalVapeTimeLimit > 0 ? formatTime(dailyTotalVapeTimeLimit) : 'Off'; }
        if (todayTotalVapeTimeDisplay && todayTotalVapeTimeDisplay.parentElement) { todayTotalVapeTimeDisplay.parentElement.classList.toggle('over-limit', dailyTotalVapeTimeLimit > 0 && todayTotalVapeTime > dailyTotalVapeTimeLimit); }
        if (startVapeTimerButton) { startVapeTimerButton.disabled = isVapeTimerRunning; }
        if (stopVapeTimerButton) { stopVapeTimerButton.disabled = !isVapeTimerRunning; stopVapeTimerButton.style.display = isVapeTimerRunning ? 'inline-block' : 'none'; }
        if (vapeTimerDisplay && !isVapeTimerRunning) { vapeTimerDisplay.textContent = formatTimerDisplay(0); vapeTimerDisplay.classList.remove('warning', 'counting-down'); }
        if (cigaretteLogConfirmationStep !== 0 && logCigaretteButton) { const currentDate = getCurrentDateString(); if (lastLogDate !== currentDate) { resetCigaretteButton(); } }
    }

    function renderSmokeLog() {
        if (!smokeLogList) { return; }
        smokeLogList.innerHTML = '';
        const logsToRender = smokeLog.slice(0, 30); // Show recent distinct (compacted or single) entries
        const nlp = document.getElementById('noLogsPlaceholder');
        if (logsToRender.length === 0) { if (nlp) { nlp.style.display = 'block'; } return; }
        else { if (nlp) { nlp.style.display = 'none'; } }

        logsToRender.forEach(log => {
            const listItem = document.createElement('li'); listItem.className = 'moment-card';
            listItem.style.cssText = 'opacity:1; animation:none; padding:8px; margin-bottom:8px;';
            const displayTimestamp = (log.type === 'cigarette' && log.count && log.count > 1 && log.lastTimestampInGroup) ? log.lastTimestampInGroup : log.timestamp;
            const logTime = new Date(displayTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const logDate = new Date(displayTimestamp).toLocaleDateString([], { month: 'short', day: 'numeric' });
            let iconClass = '', iconColor = '', text = '', details = '';
            let reasonIconBaseClass = 'add-reason-icon'; let reasonIconExtraClass = log.reason ? 'fas fa-comment-dots has-reason' : 'far fa-comment-dots';
            let reasonTitle = log.reason ? 'Edit Reason' : 'Add Reason';

            if (log.type === 'cigarette') {
                iconClass = 'fas fa-smoking'; iconColor = 'var(--theme-highlight-accent)'; text = 'Cigarette';
                if (log.count && log.count > 1) { text += ` (x${log.count})`; }
            } else if (log.type === 'vape') {
                iconClass = 'fas fa-vial'; iconColor = 'var(--theme-primary-accent)'; text = 'Vape Session';
                details = log.duration ? `(${formatTime(log.duration)})` : '';
            }
            listItem.innerHTML = `<div class="log-item-content"><div class="log-item-details"><i class="${iconClass}" style="color: ${iconColor}; margin-right: 8px; font-size: 18px;"></i><span>${text} ${details}</span></div><div class="log-item-reason-icon-container"><span class="log-item-time">${logDate} @ ${logTime}</span><i class="${reasonIconBaseClass} ${reasonIconExtraClass}" data-timestamp="${log.timestamp}" title="${reasonTitle}"></i></div></div>`;
            smokeLogList.appendChild(listItem);
        });
    }

    function renderDailyProgressChart() {
        if (!dailyProgressChartContainer) return;
        dailyProgressChartContainer.innerHTML = ''; const BAR_MAX_HEIGHT_PX = 100; let dailyData = []; let maxCigarettesInPeriod = 0;
        for (let i = 6; i >= 0; i--) {
            const targetDate = new Date(); targetDate.setDate(targetDate.getDate() - i); const dateStr = getDateStringFromTimestamp(targetDate.getTime()); const dayShortName = targetDate.toLocaleDateString(undefined, { weekday: 'short' }).substring(0,2); let cigarettesOnDate = 0;
            smokeLog.forEach(log => { if (log.type === 'cigarette' && getDateStringFromTimestamp(log.timestamp) === dateStr) { cigarettesOnDate += (log.count || 1); } });
            dailyData.push({ date: dateStr, dayLabel: dayShortName, cigarettes: cigarettesOnDate }); if (cigarettesOnDate > maxCigarettesInPeriod) { maxCigarettesInPeriod = cigarettesOnDate; }
        }
        const chartScaleMax = Math.max(dailyCigaretteLimit > 0 ? dailyCigaretteLimit : 5, maxCigarettesInPeriod, 5);
        dailyData.forEach(data => {
            const dayColumn = document.createElement('div'); dayColumn.className = 'chart-day-column'; const barWrapper = document.createElement('div'); barWrapper.className = 'chart-bar-wrapper'; const barValue = document.createElement('div'); barValue.className = 'chart-bar-value'; barValue.textContent = data.cigarettes; const bar = document.createElement('div'); bar.className = 'chart-bar cigarette-bar'; let barHeight = (chartScaleMax > 0) ? (data.cigarettes / chartScaleMax) * BAR_MAX_HEIGHT_PX : 0; bar.style.height = `${Math.min(Math.max(barHeight, 0), BAR_MAX_HEIGHT_PX)}px`; bar.setAttribute('title', `${data.cigarettes} cigarettes on ${data.date}`); const dayLabel = document.createElement('div'); dayLabel.className = 'chart-day-label'; dayLabel.textContent = data.dayLabel;
            barWrapper.appendChild(barValue); barWrapper.appendChild(bar); dayColumn.appendChild(barWrapper); dayColumn.appendChild(dayLabel); dailyProgressChartContainer.appendChild(dayColumn);
        });
    }

    // =================================================================================
    // SECTION: REASON MODAL LOGIC
    // =================================================================================
    function handleOpenReasonModal(timestamp) { const logEntry = smokeLog.find(log => log.timestamp === timestamp); if (!logEntry || !reasonModalOverlay) { return; } reasonInput.value = logEntry.reason || ''; reasonLogTimestampInput.value = timestamp; reasonModalOverlay.classList.add('show'); reasonInput.focus(); }
    function handleCloseReasonModal() { if (reasonModalOverlay) { reasonModalOverlay.classList.remove('show'); } reasonInput.value = ''; reasonLogTimestampInput.value = ''; }
    function handleSaveReason() { const timestampToUpdate = parseInt(reasonLogTimestampInput.value); const newReason = reasonInput.value.trim(); if (isNaN(timestampToUpdate)) { return; } const logEntryToUpdate = smokeLog.find(log => log.timestamp === timestampToUpdate); if (logEntryToUpdate) { logEntryToUpdate.reason = newReason; compactSmokeLog(); saveState(); renderSmokeLog(); showToast(newReason ? "Reason Saved!" : "Reason Cleared."); } handleCloseReasonModal(); }

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
                helpers: { getDateStringFromTimestamp, formatTime, getCurrentDateString }
            });
            if (toggleCalendarButton) { toggleCalendarButton.addEventListener('click', () => { if (typeof handleToggleCalendar === 'function') { handleToggleCalendar(); } else { console.error("handleToggleCalendar function not found from calendar-logic.js"); } }); }
            if (prevMonthButton) { prevMonthButton.addEventListener('click', () => { if (typeof handlePrevMonth === 'function') { handlePrevMonth(); } else { console.error("handlePrevMonth function not found from calendar-logic.js"); } }); }
            if (nextMonthButton) { nextMonthButton.addEventListener('click', () => { if (typeof handleNextMonth === 'function') { handleNextMonth(); } else { console.error("handleNextMonth function not found from calendar-logic.js"); } }); }
             console.log("Calendar integration setup complete.");
        } else {
            console.warn("calendar-logic.js might not be loaded or initializeCalendarLogic is not defined.");
            if(toggleCalendarButton) { toggleCalendarButton.disabled = true; toggleCalendarButton.textContent = "Calendar Unavailable"; }
        }
    }

    // =================================================================================
    // SECTION: EVENT LISTENERS (Core + EOD)
    // =================================================================================
    if (logCigaretteButton) { logCigaretteButton.addEventListener('click', handleLogCigaretteClick); }
    if (startVapeTimerButton) { startVapeTimerButton.addEventListener('click', startVapeTimer); }
    if (stopVapeTimerButton) { stopVapeTimerButton.addEventListener('click', () => { stopVapeTimer(false); }); }
    if (saveLimitButton && setLimitInput) { saveLimitButton.addEventListener('click', () => { const newLimit = parseInt(setLimitInput.value); if (!isNaN(newLimit) && newLimit >= 0) { dailyCigaretteLimit = newLimit; updateStatusDisplay(); checkAndWarnLimits(); saveState(); renderDailyProgressChart(); showToast(`Cigarette limit set to ${dailyCigaretteLimit > 0 ? dailyCigaretteLimit : 'Off'}.`); } else { showToast("Invalid limit value."); setLimitInput.value = dailyCigaretteLimit; } }); }
    if (saveVapeSessionLimitButton && setVapeSessionLimitInput) { saveVapeSessionLimitButton.addEventListener('click', () => { const parsedSeconds = parseMMSS(setVapeSessionLimitInput.value); if (parsedSeconds !== null && parsedSeconds >= 0) { vapeSessionDurationLimit = parsedSeconds; saveState(); showToast(`Vape session limit set to ${formatTimerDisplay(vapeSessionDurationLimit)} ${parsedSeconds === 0 ? '(Count Up)' : ''}.`); setVapeSessionLimitInput.value = formatTimerDisplay(vapeSessionDurationLimit); } else { showToast("Invalid session limit format (MM:SS)."); setVapeSessionLimitInput.value = formatTimerDisplay(vapeSessionDurationLimit); } }); }
    if (saveDailyVapeTimeLimitButton && setDailyVapeTimeLimitInput) { saveDailyVapeTimeLimitButton.addEventListener('click', () => { const newLimitMinutes = parseInt(setDailyVapeTimeLimitInput.value); if (!isNaN(newLimitMinutes) && newLimitMinutes >= 0) { dailyTotalVapeTimeLimit = newLimitMinutes * 60; updateStatusDisplay(); checkAndWarnLimits(); saveState(); showToast(`Daily vape time limit set to ${newLimitMinutes > 0 ? newLimitMinutes + ' minutes' : 'Off'}.`); } else { showToast("Invalid limit value (minutes)."); setDailyVapeTimeLimitInput.value = Math.floor(dailyTotalVapeTimeLimit / 60); } }); }
    if (smokeLogList) { smokeLogList.addEventListener('click', (event) => { const targetIcon = event.target.closest('.add-reason-icon'); if (targetIcon) { const timestamp = parseInt(targetIcon.dataset.timestamp); if (!isNaN(timestamp)) { handleOpenReasonModal(timestamp); } } }); }
    if (saveReasonButton) { saveReasonButton.addEventListener('click', handleSaveReason); }
    if (cancelReasonButton) { cancelReasonButton.addEventListener('click', handleCloseReasonModal); }
    if (reasonModalOverlay) { reasonModalOverlay.addEventListener('click', (event) => { if (event.target === reasonModalOverlay) { handleCloseReasonModal(); } }); }
    document.addEventListener('click', (event) => { if (logCigaretteButton && !logCigaretteButton.contains(event.target) && cigaretteLogConfirmationStep !== 0) { resetCigaretteButton(); } });
    if (endOfDayTestButton) { endOfDayTestButton.addEventListener('click', () => { showToast("Simulating End Of Day process...", 2000); let tempYesterday = new Date(); tempYesterday.setDate(tempYesterday.getDate() - 1); lastLogDate = getDateStringFromTimestamp(tempYesterday.getTime()); checkDateAndResetCounts(); updateHeaderDisplays(); updateStatusDisplay(); renderSmokeLog(); renderDailyProgressChart(); showToast("E.O.D. simulation complete. Counts reset for 'today'.", 3000); }); }
    // Calendar listeners are attached in setupCalendarIntegration

    // =================================================================================
    // SECTION: INITIAL SETUP
    // =================================================================================
    loadState();
    initializeParticleCanvas();
    applyThemeOnPage(currentTheme);
    checkDateAndResetCounts();
    updateHeaderDisplays();
    updateStatusDisplay();
    renderSmokeLog();
    renderDailyProgressChart();
    resetCigaretteButton();

    setupCalendarIntegration(); // Setup communication with calendar-logic.js

    console.log("Smoke Tracker Initialized (Core + Compaction + Calendar Hooks).");
}); // End DOMContentLoaded
