// districts/health_district/smoke-tracker-script.js

document.addEventListener('DOMContentLoaded', () => {
    // =================================================================================
    // SECTION: CONSTANTS & STATE VARIABLES
    // =================================================================================
    // localStorageKeySuffix is now handled by DataManager via SharedUtils

    // --- Element Selectors (remain largely the same) ---
    const particleCanvas = document.getElementById('particleCanvasSmokeTracker'); // Updated ID
    const userPointsDisplay = document.getElementById('userPoints');
    const smokeFreeStreakDisplay = document.getElementById('smokeFreeStreak');
    const streakDisplay = document.getElementById('streakDisplay');
    const healthMilestonesDisplay = document.getElementById('healthMilestones');
    const shopUserPointsDisplay = document.getElementById('shopUserPoints');
    // toastNotification will be handled by SharedUtils.showToast

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

    // --- State Variables (loaded via DataManager or local to this script) ---
    let userPoints = 0; // Will be loaded by DataManager.getUserPoints()
    let smokeFreeStreak = 0, healthMilestones = 0;
    let dailyCigaretteLimit = 5, vapeSessionDurationLimit = 30, dailyTotalVapeTimeLimit = 300;
    let smokeLog = [], lastLogDate = '', todayCigaretteCount = 0, todayTotalVapeTime = 0, lastDayStreakIncremented = '';
    
    let isVapeTimerRunning = false, vapeTimerStartTime = null, vapeTimerIntervalId = null;
    let vapeTimerTargetEndTime = null, vapeTimerMode = 'up';
    
    // currentTheme will be loaded by ThemeManager. Theme definitions are in ThemeManager.
    // ownedThemes is also managed by ThemeManager.

    let particleCtx = null, particles = [], isAnimatingParticles = false, vapeParticleIntervalId = null;
    let cigaretteLogConfirmationStep = 0;

    // Data keys specific to smoke tracker for DataManager
    const SMOKE_DATA_PREFIX = 'smoketrack_'; // To namespace keys for this district

    // =================================================================================
    // SECTION: HELPER FUNCTIONS (Some will use SharedUtils)
    // =================================================================================
    // formatTime, getCurrentDateString, getDateStringFromTimestamp are in SharedUtils
    // showToast is in SharedUtils

    function formatTimerDisplay(totalSeconds) { // Stays local if specific formatting needed
        if (isNaN(totalSeconds) || totalSeconds < 0) { return "00:00"; }
        const m = Math.floor(totalSeconds / 60);
        const s = Math.floor(totalSeconds % 60);
        return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
    }

    function parseMMSS(timeString) { // Stays local
        if (!timeString || typeof timeString !== 'string') { return null; }
        const p = timeString.split(':');
        if (p.length !== 2) { return null; }
        const m = parseInt(p[0], 10);
        const s = parseInt(p[1], 10);
        if (isNaN(m) || isNaN(s) || m < 0 || s < 0 || s >= 60) { return null; }
        return (m * 60) + s;
    }

    function triggerPointsFlash() { // Stays local for specific UI element
        const d = document.querySelector('.header-stats-bar .points-display:first-child');
        if (d) { d.classList.add('points-earned-flash'); }
        setTimeout(() => { if (d) { d.classList.remove('points-earned-flash'); } }, 500);
    }

    // addPoints is now primarily DataManager.addPoints, but we might wrap it if we need specific UI updates
    function awardPoints(amount, reason = "") {
        if (DataManager.addPoints(amount, reason)) { // DataManager.addPoints shows its own toast
            userPoints = DataManager.getUserPoints(); // Re-sync local copy
            triggerPointsFlash(); // Local UI effect
            updateHeaderDisplays(); // Update local header
            // saveState(); // DataManager.addPoints already saves userPoints globally
        }
    }

    // =================================================================================
    // SECTION: PARTICLE SYSTEM (Remains mostly local, using its specific canvas)
    // =================================================================================
    function initializeParticleCanvas() {
        if (particleCanvas) { // particleCanvas is already #particleCanvasSmokeTracker
            particleCtx = particleCanvas.getContext('2d');
            particleCanvas.width = window.innerWidth;
            particleCanvas.height = window.innerHeight;
            window.addEventListener('resize', () => {
                if (particleCanvas && particleCtx) {
                    particleCanvas.width = window.innerWidth;
                    particleCanvas.height = window.innerHeight;
                }
            });
        } else {
            console.warn("Smoke Tracker particle canvas not found.");
        }
    }
    // ... (createGenericParticle, updateAndDrawParticles, triggerCigarettePuff, startVapeParticleStream, stopVapeParticleStream - keep these as they were, they use local particleCtx)
    // Ensure createGenericParticle uses local 'particles' array and 'particleCtx'.

    function createGenericParticle(x, y, options) { if (!particleCtx) { return; } const defaults = { color: '#FFFFFF', size: Math.random() * 5 + 2, count: 1, spread: 3, speedX: (Math.random() - 0.5) * options.spread, speedY: (Math.random() * -1.5 - 0.5) * (options.speedMultiplier || 1), life: 60 + Math.random() * 40, gravity: 0.01, alphaDecay: 0.98 }; const pOptions = { ...defaults, ...options }; for (let i = 0; i < pOptions.count; i++) { particles.push({ x: x + (Math.random() - 0.5) * (pOptions.initialSpread || 0), y: y + (Math.random() - 0.5) * (pOptions.initialSpread || 0), size: pOptions.size, color: pOptions.color, vx: pOptions.speedX, vy: pOptions.speedY, life: pOptions.life, alpha: 1, gravity: pOptions.gravity, alphaDecay: pOptions.alphaDecay }); } if (particles.length > 0 && !isAnimatingParticles) { isAnimatingParticles = true; requestAnimationFrame(updateAndDrawParticles); } }
    function updateAndDrawParticles() { if (!particleCtx || !particleCanvas) { isAnimatingParticles = false; return; } particleCtx.clearRect(0, 0, particleCanvas.width, particleCanvas.height); let stillAnimating = false; for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.x += p.vx; p.y += p.vy; p.vy += p.gravity; p.alpha *= p.alphaDecay; p.life--; if (p.life <= 0 || p.alpha <= 0.01) { particles.splice(i, 1); continue; } particleCtx.fillStyle = p.color; particleCtx.globalAlpha = p.alpha; particleCtx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size); stillAnimating = true; } particleCtx.globalAlpha = 1; if (stillAnimating) { requestAnimationFrame(updateAndDrawParticles); } else { isAnimatingParticles = false; } }
    function triggerCigarettePuff() { if (!logCigaretteButton || !particleCtx) { return; } const rect = logCigaretteButton.getBoundingClientRect(); const centerX = rect.left + rect.width / 2; const centerY = rect.top + rect.height / 2; const greyColors = ['#AAAAAA', '#BBBBBB', '#CCCCCC', '#DDDDDD']; const numParticles = 30; for (let i = 0; i < numParticles; i++) { const angle = Math.random() * Math.PI * 2; const radiusX = rect.width / 2; const radiusY = rect.height / 2; const emitX = centerX + Math.cos(angle) * radiusX; const emitY = centerY + Math.sin(angle) * radiusY; const speedMagnitude = 0.5 + Math.random() * 1; const vx = Math.cos(angle) * speedMagnitude * (0.5 + Math.random() * 0.5); const vy = Math.sin(angle) * speedMagnitude * (0.5 + Math.random() * 0.5) - (0.2 + Math.random() * 0.3); createGenericParticle(emitX, emitY, { color: greyColors[Math.floor(Math.random() * greyColors.length)], size: Math.random() * 5 + 3, speedX: vx, speedY: vy, gravity: -0.015, life: 40 + Math.random() * 30, alphaDecay: 0.96, initialSpread: 2 }); } }
    function startVapeParticleStream() { if (!startVapeTimerButton || vapeParticleIntervalId || !particleCtx) { return; } const rect = startVapeTimerButton.getBoundingClientRect(); const centerX = rect.left + rect.width / 2; const centerY = rect.top + rect.height / 2; vapeParticleIntervalId = setInterval(() => { if (!isVapeTimerRunning) { stopVapeParticleStream(); return; } const angle = Math.random() * Math.PI * 2; const radiusX = rect.width / 2; const radiusY = rect.height / 2; const emitX = centerX + Math.cos(angle) * radiusX; const emitY = centerY + Math.sin(angle) * radiusY; const speedMagnitude = 0.2 + Math.random() * 0.3; const vx = Math.cos(angle) * speedMagnitude; const vy = Math.sin(angle) * speedMagnitude - (0.1 + Math.random() * 0.2); createGenericParticle(emitX, emitY, { color: '#F0F0F0', size: Math.random() * 3 + 2, count: 1, speedX: vx, speedY: vy, gravity: -0.025, life: 70 + Math.random() * 40, alphaDecay: 0.99, initialSpread: 1 }); }, 200); }
    function stopVapeParticleStream() { if (vapeParticleIntervalId) { clearInterval(vapeParticleIntervalId); vapeParticleIntervalId = null; } }


    // =================================================================================
    // SECTION: LOG COMPACTION LOGIC (Stays local as it operates on local smokeLog)
    // =================================================================================
    const COMPACTION_TIME_WINDOW_MS = 5 * 60 * 1000;
    const MAX_LOG_ENTRIES_AFTER_COMPACTION = 50;

    function compactSmokeLog() {
        // ... (Keep this function as it was)
        if (smokeLog.length < 2) return; 
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
    // SECTION: STATE MANAGEMENT (Using DataManager)
    // =================================================================================
    function loadState() {
        userPoints = DataManager.getUserPoints(); // Global points
        
        // Smoke tracker specific data
        smokeFreeStreak = DataManager.loadData(SMOKE_DATA_PREFIX + 'streak', 0);
        healthMilestones = DataManager.loadData(SMOKE_DATA_PREFIX + 'milestones', 0);
        dailyCigaretteLimit = DataManager.loadData(SMOKE_DATA_PREFIX + 'cig_limit', 5);
        vapeSessionDurationLimit = DataManager.loadData(SMOKE_DATA_PREFIX + 'vape_session_limit', 30);
        dailyTotalVapeTimeLimit = DataManager.loadData(SMOKE_DATA_PREFIX + 'vape_daily_limit', 300);
        smokeLog = DataManager.loadData(SMOKE_DATA_PREFIX + 'log_v2', []); // v2 for compacted log
        lastLogDate = DataManager.loadData(SMOKE_DATA_PREFIX + 'last_log_date', '');
        todayCigaretteCount = DataManager.loadData(SMOKE_DATA_PREFIX + 'today_cig', 0);
        todayTotalVapeTime = DataManager.loadData(SMOKE_DATA_PREFIX + 'today_vape_time', 0);
        lastDayStreakIncremented = DataManager.loadData(SMOKE_DATA_PREFIX + 'last_streak_date', '');

        // ownedThemes and currentTheme are handled by ThemeManager globally
        // No need to load them explicitly here unless for a very specific override (unlikely)

        if (setLimitInput) { setLimitInput.value = dailyCigaretteLimit; }
        if (setDailyVapeTimeLimitInput) { setDailyVapeTimeLimitInput.value = Math.floor(dailyTotalVapeTimeLimit / 60); }
        if (setVapeSessionLimitInput) { setVapeSessionLimitInput.value = formatTimerDisplay(vapeSessionDurationLimit); }

        compactSmokeLog(); // Compact logs after loading
    }

    function saveState() {
        // UserPoints are saved globally by DataManager.setUserPoints or DataManager.addPoints
        // Theme choices are saved globally by ThemeManager

        // Save Smoke tracker specific data
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
    }

    // =================================================================================
    // SECTION: THEME APPLICATION (Uses ThemeManager)
    // =================================================================================
    // No specific applyThemeOnPage needed here; ThemeManager.applyTheme is global.
    // The current theme is applied on DOMContentLoaded.

    // ... (The rest of smoke-tracker-script.js will be refactored in the next part) ...

    // =================================================================================
    // SECTION: INITIAL SETUP (Modified)
    // =================================================================================
    loadState(); // Load smoke-tracker specific data and global user points
    initializeParticleCanvas();
    
    // Apply the current global theme
    const currentGlobalThemeId = ThemeManager.getCurrentThemeId();
    ThemeManager.applyTheme(currentGlobalThemeId);

    checkDateAndResetCounts(); // This function will need updates to use awardPoints
    updateHeaderDisplays();
    updateStatusDisplay();
    renderSmokeLog();
    renderDailyProgressChart();
    resetCigaretteButton();

    setupCalendarIntegration();

    console.log("Smoke Tracker Initialized (Refactored for Rome Hub).");
}); // End DOMContentLoaded
