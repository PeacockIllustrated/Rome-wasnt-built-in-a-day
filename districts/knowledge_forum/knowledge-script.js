// districts/knowledge_forum/knowledge-script.js

document.addEventListener('DOMContentLoaded', () => {
    // =================================================================================
    // SECTION: ELEMENT SELECTORS
    // =================================================================================
    const idkInput = document.getElementById('idkInput');
    const logButton = document.getElementById('logButton');
    const selectAllButton = document.getElementById('selectAllButton');
    const selectedCountDisplay = document.getElementById('selectedCount');
    const reviewedCountDisplay = document.getElementById('reviewedCountDisplay');
    const testKnowledgeButton = document.getElementById('testKnowledgeButton');
    const processSelectedButton = document.getElementById('processSelectedButton');
    const momentsList = document.getElementById('momentsList');
    const noMomentsPlaceholder = document.getElementById('noMomentsPlaceholder');
    const overallLoadingIndicator = document.getElementById('overallLoadingIndicator');

    const userPointsDisplay = document.getElementById('userPoints');
    const userStupidPointsDisplay = document.getElementById('userStupidPoints');
    const goldStarsDisplay = document.getElementById('goldStars');
    const shopUserPointsDisplay = document.getElementById('shopUserPoints');

    const userApiKeyInput = document.getElementById('userApiKeyInput');
    const saveApiKeyButton = document.getElementById('saveApiKeyButton');

    const quizModalOverlay = document.getElementById('quizModalOverlay');
    const quizModalTitle = document.getElementById('quizModalTitle');
    const quizQuestionNumber = document.getElementById('quizQuestionNumber');
    const quizQuestionText = document.getElementById('quizQuestionText');
    const quizOptionsContainer = document.getElementById('quizOptionsContainer');
    const quizFeedbackArea = document.getElementById('quizFeedbackArea');
    const submitQuizAnswerButton = document.getElementById('submitQuizAnswerButton');
    const nextQuizQuestionButton = document.getElementById('nextQuizQuestionButton');
    const finishQuizButton = document.getElementById('finishQuizButton');
    const closeQuizButton = document.getElementById('closeQuizButton');

    const archiveHeader = document.getElementById('archiveHeader');
    const archiveToggleIcon = document.getElementById('archiveToggleIcon');
    const archivedItemsListContainer = document.getElementById('archivedItemsListContainer');
    const archivedMomentsList = document.getElementById('archivedMomentsList');
    const noArchivedPlaceholder = document.getElementById('noArchivedPlaceholder');

    const deepenedHeader = document.getElementById('deepenedHeader');
    const deepenedToggleIcon = document.getElementById('deepenedToggleIcon');
    const deepenedItemsListContainer = document.getElementById('deepenedItemsListContainer');
    const deepenedMomentsList = document.getElementById('deepenedMomentsList');
    const noDeepenedPlaceholder = document.getElementById('noDeepenedPlaceholder');

    const particleCanvas = document.getElementById('particleCanvasKnowledge');
    let ctx, particles = [];

    // =================================================================================
    // SECTION: STATE VARIABLES & CONFIG
    // =================================================================================
    const IDKY_DATA_PREFIX = 'idky_';

    let userPoints = 0;
    let userStupidPoints = 0;
    let userProvidedApiKey = '';

    let loggedMoments = [];
    let archivedKnowledge = [];
    let deeplyUnderstoodKnowledge = [];

    let currentQuizQuestionsData = [];
    let currentQuizQuestionIndex = 0;
    let currentQuizCorrectAnswersCount = 0;
    let selectedQuizOptionElement = null;
    let isDeepDiveQuiz = false;
    let currentDeepDiveQuizMoment = null;

    // =================================================================================
    // SECTION: DATA MANAGEMENT
    // =================================================================================
    function loadKnowledgeForumState() {
        userPoints = DataManager.getUserPoints();
        userStupidPoints = DataManager.loadData(IDKY_DATA_PREFIX + 'stupid_points', 0);
        userProvidedApiKey = DataManager.loadData(IDKY_DATA_PREFIX + 'openai_api_key', '');

        loggedMoments = DataManager.loadData(IDKY_DATA_PREFIX + 'moments', []);
        archivedKnowledge = DataManager.loadData(IDKY_DATA_PREFIX + 'archived_knowledge', []);
        deeplyUnderstoodKnowledge = DataManager.loadData(IDKY_DATA_PREFIX + 'deeply_understood', []);

        // Clean transient properties (important if script was interrupted during processing)
        loggedMoments.forEach(m => { delete m.newlyAdded; delete m.spinnerInterval; delete m.isProcessing; delete m.isRegenerating; });
        archivedKnowledge.forEach(m => { delete m.isDeepDiveProcessing; });
        deeplyUnderstoodKnowledge.forEach(m => { delete m.justClickedForCelebration; });


        if (userApiKeyInput) userApiKeyInput.value = userProvidedApiKey;
    }

    function saveKnowledgeForumState() {
        DataManager.saveData(IDKY_DATA_PREFIX + 'stupid_points', userStupidPoints);
        DataManager.saveData(IDKY_DATA_PREFIX + 'openai_api_key', userProvidedApiKey);

        const cleanMap = (arr, transientProps) => arr.map(item => {
            const { ...rest } = item;
            transientProps.forEach(prop => delete rest[prop]);
            return rest;
        });

        DataManager.saveData(IDKY_DATA_PREFIX + 'moments', cleanMap(loggedMoments, ['newlyAdded', 'spinnerInterval', 'isProcessing', 'isRegenerating']));
        DataManager.saveData(IDKY_DATA_PREFIX + 'archived_knowledge', cleanMap(archivedKnowledge, ['isDeepDiveProcessing']));
        DataManager.saveData(IDKY_DATA_PREFIX + 'deeply_understood', cleanMap(deeplyUnderstoodKnowledge, ['justClickedForCelebration']));
        // UserPoints are saved via DataManager.addPoints / DataManager.setUserPoints
    }

    function awardPointsAndUpdateUI(amount, reason = "") {
        if (DataManager.addPoints(amount, reason)) {
            userPoints = DataManager.getUserPoints();
            triggerPointsFlashOnPage();
            updateCountersAndPointsDisplay();
        }
    }

    // =================================================================================
    // SECTION: HELPER & UTILITY FUNCTIONS
    // =================================================================================
    function triggerPointsFlashOnPage() {
        const display = userPointsDisplay?.parentElement;
        if (display) {
            display.classList.add('points-earned-flash');
            setTimeout(() => { display.classList.remove('points-earned-flash'); }, 500);
        }
    }

    function formatAnswerForRetroDisplay(text) {
        if (!text || typeof text !== 'string') return String(text || ''); // Handle null/undefined gracefully
        const prefix = '    > ';
        let html = text.split('\n').map(line => line.trim() === '' ? '' : prefix + line).join('<br>');
        html = html.replace(/^<br>\s*/, '').replace(/\s*<br>$/, '');
        html = html.replace(/(<br>\s*){2,}/g, '<br>');
        return html;
    }

    function autoSetInitialType(text) {
        const lowerText = text.toLowerCase().trim();
        if (lowerText.endsWith('?')) return 'question';
        const starters = ['what', 'when', 'where', 'who', 'why', 'how', 'is ', 'are ', 'do ', 'does ', 'did ', 'can ', 'could ', 'will ', 'would ', 'should ', 'may ', 'might '];
        return starters.some(s => lowerText.startsWith(s)) ? 'question' : 'statement';
    }

    // =================================================================================
    // SECTION: PARTICLE SYSTEM
    // =================================================================================
    function initializeParticleSystem() { /* ... (same as in previous response) ... */ }
    function createParticle(x, y, color, size, count, spread, speedMultiplier = 1) { /* ... (same) ... */ }
    function updateAndDrawParticles() { /* ... (same) ... */ }
    function triggerParticleBurst(type = 'small', customX, customY) { /* ... (same, ensuring ThemeManager is used for colors) ... */ }
    // --- Full Particle Functions ---
    function initializeParticleSystem() { if (particleCanvas) { ctx = particleCanvas.getContext('2d'); particleCanvas.width = window.innerWidth; particleCanvas.height = window.innerHeight; window.addEventListener('resize', () => { if (particleCanvas && ctx) { particleCanvas.width = window.innerWidth; particleCanvas.height = window.innerHeight; } }); } else { console.warn("Knowledge Forum particle canvas not found."); } }
    function createParticle(x, y, color, size, count, spread, speedMultiplier = 1) { if (!ctx || !particleCanvas) return; for (let i = 0; i < count; i++) { particles.push({ x, y, size: Math.random() * size + 2, color, vx: (Math.random() - 0.5) * spread * speedMultiplier, vy: (Math.random() - 0.5) * spread * speedMultiplier, life: 60 + Math.random() * 30 }); } if (particles.length > 0 && !particles.isAnimatingLoop) { particles.isAnimatingLoop = true; requestAnimationFrame(() => { updateAndDrawParticles(); particles.isAnimatingLoop = false; });} }
    function updateAndDrawParticles() { if (!ctx || !particleCanvas) return; ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height); let stillAnimating = false; for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life--; if (p.life <= 0) { particles.splice(i, 1); continue; } ctx.fillStyle = p.color; ctx.globalAlpha = p.life / 90; ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size); stillAnimating = true; } ctx.globalAlpha = 1; if (stillAnimating) { requestAnimationFrame(updateAndDrawParticles); } else { particles.isAnimatingLoop = false; } }
    function triggerParticleBurst(type = 'small', customX, customY) { if (!ctx || !particleCanvas) return; const cX = customX !== undefined ? customX : window.innerWidth / 2; const cY = customY !== undefined ? customY : window.innerHeight / 3; let clr, sz, cnt, sprd, spd; const currentThemeId = ThemeManager.getCurrentThemeId(); const allThemes = ThemeManager.getAllThemes(); const themeVarsToUse = allThemes[currentThemeId]?.cssVariables || allThemes.default.cssVariables; if (type === 'perfectQuiz') { clr = themeVarsToUse['--theme-secondary-accent']; sz = 8; cnt = 100; sprd = 8; spd = 1.5; } else if (type === 'correctAnswer') { clr = themeVarsToUse['--theme-primary-accent']; sz = 6; cnt = 50; sprd = 5; spd = 1; } else if (type === 'dumbAnswer') { clr = themeVarsToUse['--theme-highlight-accent']; sz = 5; cnt = 30; sprd = 4; spd = 0.8; } else if (type === 'masteredItem') { clr = themeVarsToUse['--theme-secondary-accent']; sz = 7; cnt = 40; sprd = 6; spd = 1.2; } else { clr = themeVarsToUse['--theme-primary-accent']; sz = 4; cnt = 20; sprd = 3; spd = 0.7; } createParticle(cX, cY, clr, sz, cnt, sprd, spd); if (particles.length > 0 && !particles.isAnimatingLoop) { particles.isAnimatingLoop = true; requestAnimationFrame(() => { updateAndDrawParticles(); particles.isAnimatingLoop = false; }); } }

    // =================================================================================
    // SECTION: UI RENDERING & UPDATES
    // =================================================================================
    function updateCountersAndPointsDisplay() { /* ... (same as in previous response) ... */ }
    // --- Full updateCountersAndPointsDisplay ---
    function updateCountersAndPointsDisplay() { if (userPointsDisplay) userPointsDisplay.textContent = userPoints; if (userStupidPointsDisplay) userStupidPointsDisplay.textContent = userStupidPoints; if (goldStarsDisplay) goldStarsDisplay.textContent = deeplyUnderstoodKnowledge.length; if (shopUserPointsDisplay) shopUserPointsDisplay.textContent = userPoints; const reviewedMoments = loggedMoments.filter(m => m.userMarkedReviewed); const reviewedCount = reviewedMoments.length; const reviewedWithAnswersCount = reviewedMoments.filter(m => m.userMarkedReviewed && m.answer).length; if (reviewedCountDisplay) reviewedCountDisplay.textContent = `(${reviewedCount}/${loggedMoments.length} Reviewed)`; if (testKnowledgeButton) testKnowledgeButton.disabled = reviewedWithAnswersCount < 1; const selectedCount = loggedMoments.filter(m => m.selectedForBatch).length; if (selectedCountDisplay) selectedCountDisplay.textContent = `${selectedCount} SEL`; if (processSelectedButton) processSelectedButton.disabled = selectedCount === 0; const listControlsBar = document.querySelector('.list-controls-bar'); const batchProcessButtonContainer = document.querySelector('.batch-process-button-container'); if (loggedMoments.length > 0) { if (selectAllButton) selectAllButton.textContent = (selectedCount === loggedMoments.length && selectedCount > 0) ? "DESEL. ALL" : "SEL. ALL"; if (listControlsBar) listControlsBar.style.display = 'flex'; if (batchProcessButtonContainer) batchProcessButtonContainer.style.display = 'block'; } else { if (selectAllButton) selectAllButton.textContent = "SEL. ALL"; if (listControlsBar) listControlsBar.style.display = 'none'; if (batchProcessButtonContainer) batchProcessButtonContainer.style.display = 'none'; } }


    function renderMoments() { /* ... (Copy from original, then refactor saveMoments->saveKnowledgeForumState, showToast->SharedUtils.showToast) ... */ }
    function renderArchivedKnowledge() { /* ... (Copy from original, then refactor) ... */ }
    function renderDeeplyUnderstoodKnowledge() { /* ... (Copy from original, then refactor) ... */ }

    function renderAllLists() {
        renderMoments();
        renderArchivedKnowledge();
        renderDeeplyUnderstoodKnowledge();
        updateCountersAndPointsDisplay(); // Call after all lists are rendered
    }

    // --- Full renderMoments (Refactored) ---
    function renderMoments() { if (!momentsList) return; momentsList.innerHTML = ''; if (noMomentsPlaceholder) noMomentsPlaceholder.style.display = loggedMoments.length > 0 ? 'none' : 'block'; loggedMoments.forEach((moment) => { const listItem = document.createElement('li'); listItem.className = `moment-card type-${moment.type}`; listItem.id = `moment-item-${moment.timestamp}`; if (moment.newlyAdded === true) { listItem.classList.add('newly-added'); setTimeout(() => { const el = document.getElementById(`moment-item-${moment.timestamp}`); if (el) el.classList.remove('newly-added'); moment.newlyAdded = false; /* Don't save here, it's transient */ }, 2000); } if (moment.type === 'statement' && moment.aiVerdict) { listItem.classList.add(`verdict-${moment.aiVerdict}`);} if (moment.userMarkedReviewed) { listItem.classList.add('user-reviewed');} let statusText = '', statusClass = 'status-pending'; if (moment.type === 'question') { statusText = 'QSTN'; statusClass = 'status-question'; } else if (moment.type === 'statement') { if (moment.aiVerdict === 'correct') { statusText = 'OK'; statusClass = 'status-correct'; } else if (moment.aiVerdict === 'incorrect') { statusText = 'X'; statusClass = 'status-incorrect'; } else if (moment.aiVerdict === 'unclear') { statusText = '???'; statusClass = 'status-unclear'; } else { statusText = 'STMT'; } } const processingHTML = '<span class="spinner-char"></span> PROCESSING...'; const defaultAnswerText = (moment.type === 'statement' && !moment.aiVerdict && !moment.isProcessing && !moment.isRegenerating) ? 'NEEDS VALIDATION.' : 'NO AI INSIGHT YET.'; const displayAnswerHTML = moment.answer ? formatAnswerForRetroDisplay(moment.answer) : defaultAnswerText; const answerContentHTML = moment.isProcessing || moment.isRegenerating ? processingHTML : displayAnswerHTML; const reviewIconClass = moment.userMarkedReviewed ? 'fa-check-circle' : 'fa-book-open'; listItem.innerHTML = `<div class="moment-header"><div class="moment-checkbox-container"><input type="checkbox" data-timestamp="${moment.timestamp}" ${moment.selectedForBatch ? 'checked' : ''}></div><div class="moment-text-container" data-timestamp="${moment.timestamp}"><div class="moment-main-text"><span class="moment-text">${moment.text}</span><span class="moment-timestamp">${new Date(moment.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} <span class="status-indicator ${statusClass}">${statusText}</span></span></div><i class="fas fa-caret-down expand-icon ${moment.isAnswerExpanded ? 'expanded' : ''}"></i></div><div class="moment-actions"><button class="action-button review-button ${moment.userMarkedReviewed ? 'reviewed-true' : ''}" data-timestamp="${moment.timestamp}" title="${moment.userMarkedReviewed ? 'Mark Unreviewed' : 'Mark Reviewed'}"><i class="fas ${reviewIconClass}"></i></button></div></div><div class="moment-answer-wrapper ${moment.isAnswerExpanded ? 'expanded' : ''}"><div class="moment-answer-content" id="answer-content-${moment.timestamp}">${answerContentHTML}</div>${moment.answer && !moment.isProcessing && !moment.isRegenerating ? `<div class="regenerate-answer-button-container"><button class="regenerate-answer-button action-button" data-timestamp="${moment.timestamp}" ${moment.hasBeenRegenerated ? 'disabled' : ''}><i class="fas fa-redo"></i> ${moment.hasBeenRegenerated ? "REGEN'D" : 'REGEN (1)'}</button></div>` : ''}</div>`; momentsList.appendChild(listItem); if (moment.isProcessing || moment.isRegenerating) { const answerContentDiv = listItem.querySelector(`#answer-content-${moment.timestamp}`); if (answerContentDiv) { const spinnerCharElement = answerContentDiv.querySelector('.spinner-char'); if (spinnerCharElement && !moment.spinnerInterval) { let spinnerChars = ["|", "/", "-", "\\"]; let charIndex = 0; moment.spinnerInterval = setInterval(() => { spinnerCharElement.textContent = spinnerChars[charIndex++ % spinnerChars.length]; }, 150); } } } else if (moment.spinnerInterval) { clearInterval(moment.spinnerInterval); moment.spinnerInterval = null; } }); document.querySelectorAll('.moment-checkbox-container input[type="checkbox"]').forEach(cb => cb.addEventListener('change', handleCheckboxChange)); document.querySelectorAll('.moment-text-container').forEach(tc => tc.addEventListener('click', handleTextContainerClick)); document.querySelectorAll('.review-button').forEach(btn => btn.addEventListener('click', handleReviewButtonClick)); document.querySelectorAll('.regenerate-answer-button').forEach(btn => btn.addEventListener('click', handleRegenerateButtonClick)); updateCountersAndPointsDisplay(); }
    // --- Full renderArchivedKnowledge (Refactored) ---
    function renderArchivedKnowledge() { if (!archivedMomentsList || !noArchivedPlaceholder) return; archivedMomentsList.innerHTML = ''; if (archivedKnowledge.length === 0) { noArchivedPlaceholder.style.display = 'block'; updateCountersAndPointsDisplay(); return; } noArchivedPlaceholder.style.display = 'none'; archivedKnowledge.forEach((moment) => { const listItem = document.createElement('li'); listItem.className = 'moment-card archived-moment-card'; listItem.classList.add(`type-${moment.type}`); if (moment.type === 'statement' && moment.aiVerdict) { listItem.classList.add(`verdict-${moment.aiVerdict}`); } if (moment.isRevisedForDeepTest) { listItem.classList.add('archive-revised'); } let statusText = '', statusClass = 'status-pending'; if (moment.type === 'question') { statusText = 'QSTN'; statusClass = 'status-question'; } else if (moment.type === 'statement') { if (moment.aiVerdict === 'correct') { statusText = 'OK'; statusClass = 'status-correct'; } else if (moment.aiVerdict === 'incorrect') { statusText = 'X'; statusClass = 'status-incorrect'; } else if (moment.aiVerdict === 'unclear') { statusText = '???'; statusClass = 'status-unclear'; } else { statusText = 'STMT'; } } const originalAnswerHTML = moment.answer ? formatAnswerForRetroDisplay(moment.answer) : 'Archived without answer data.'; const deepDiveAnswerHTML = moment.deepDiveAnswer ? formatAnswerForRetroDisplay(moment.deepDiveAnswer) : ''; const reviseIconClass = moment.isRevisedForDeepTest ? 'fa-check-square' : 'fa-book-reader'; const canTakeDeepDiveTest = moment.isRevisedForDeepTest && moment.deepDiveAnswer; listItem.innerHTML = `<div class="moment-header"><div class="moment-text-container" data-timestamp="${moment.timestamp}"><div class="moment-main-text"><span class="moment-text">${moment.text}</span><span class="moment-timestamp">ARCHIVED: ${new Date(moment.archivedTimestamp || moment.timestamp).toLocaleDateString()} <span class="status-indicator ${statusClass}">${statusText}</span></span></div><i class="fas fa-caret-down expand-icon ${moment.isAnswerExpanded ? 'expanded' : ''}"></i></div><div class="moment-actions"><button class="action-button deep-dive-button" data-timestamp="${moment.timestamp}" title="Deepen Understanding"><i class="fas fa-brain"></i></button><button class="action-button archive-revise-button ${moment.isRevisedForDeepTest ? 'archive-revised-true' : ''}" data-timestamp="${moment.timestamp}" title="${moment.isRevisedForDeepTest ? 'Mark Unrevised' : 'Mark Revised for Deep Test'}"><i class="fas ${reviseIconClass}"></i></button><button class="action-button archive-deep-dive-test-button" data-timestamp="${moment.timestamp}" title="Take Deep Dive Test" ${!canTakeDeepDiveTest ? 'disabled' : ''}><i class="fas fa-vial"></i> Test</button></div></div><div class="moment-answer-wrapper ${moment.isAnswerExpanded ? 'expanded' : ''}"><div class="moment-answer-content"><strong>Original Insight:</strong><br>${originalAnswerHTML}</div>${moment.deepDiveAnswer || moment.isDeepDiveProcessing ? `<div class="deep-dive-answer-container"><div class="moment-answer-content" id="deep-dive-answer-${moment.timestamp}">${moment.isDeepDiveProcessing ? '<span class="spinner-char"></span> DEEPENING...' : deepDiveAnswerHTML}</div></div>` : ''}</div>`; archivedMomentsList.appendChild(listItem); listItem.querySelector('.moment-text-container').addEventListener('click', () => { const archivedMoment = archivedKnowledge.find(am => am.timestamp === moment.timestamp); if (archivedMoment) { archivedMoment.isAnswerExpanded = !archivedMoment.isAnswerExpanded; saveKnowledgeForumState(); renderArchivedKnowledge(); } }); listItem.querySelector('.deep-dive-button').addEventListener('click', (e) => { e.stopPropagation(); handleDeepDiveClick(moment.timestamp); }); listItem.querySelector('.archive-revise-button').addEventListener('click', (e) => { e.stopPropagation(); toggleArchiveRevisedStatus(moment.timestamp); }); listItem.querySelector('.archive-deep-dive-test-button').addEventListener('click', (e) => { e.stopPropagation(); if (canTakeDeepDiveTest) startDeepDiveQuiz(moment); }); }); updateCountersAndPointsDisplay(); }
    // --- Full renderDeeplyUnderstoodKnowledge (Refactored) ---
    function renderDeeplyUnderstoodKnowledge() { if (!deepenedMomentsList || !noDeepenedPlaceholder) return; deepenedMomentsList.innerHTML = ''; noDeepenedPlaceholder.style.display = deeplyUnderstoodKnowledge.length === 0 ? 'block' : 'none'; deeplyUnderstoodKnowledge.forEach((moment) => { const listItem = document.createElement('li'); listItem.className = 'moment-card deepened-moment-card'; listItem.dataset.timestamp = moment.timestamp; const originalAnswerHTML = moment.answer ? formatAnswerForRetroDisplay(moment.answer) : ''; const deepDiveAnswerHTML = moment.deepDiveAnswer ? formatAnswerForRetroDisplay(moment.deepDiveAnswer) : ''; listItem.innerHTML = `<div class="moment-header"><div class="moment-text-container" data-timestamp="${moment.timestamp}"><div class="moment-main-text"><span class="moment-text">${moment.text}</span><span class="moment-timestamp">MASTERED: ${new Date(moment.deeplyUnderstoodTimestamp || Date.now()).toLocaleDateString()}</span></div><i class="fas fa-caret-down expand-icon ${moment.isAnswerExpanded ? 'expanded' : ''}"></i></div></div><div class="moment-answer-wrapper ${moment.isAnswerExpanded ? 'expanded' : ''}">${moment.answer ? `<div class="moment-answer-content"><strong>Original Insight:</strong><br>${originalAnswerHTML}</div>` : ''}${moment.deepDiveAnswer ? `<div class="deep-dive-answer-container"><div class="moment-answer-content"><strong>Deep Dive:</strong><br>${deepDiveAnswerHTML}</div></div>` : ''}</div>`; deepenedMomentsList.appendChild(listItem); listItem.querySelector('.moment-text-container').addEventListener('click', () => { const deepMoment = deeplyUnderstoodKnowledge.find(dm => dm.timestamp === moment.timestamp); if (deepMoment) { deepMoment.isAnswerExpanded = !deepMoment.isAnswerExpanded; deepMoment.justClickedForCelebration = true; saveKnowledgeForumState(); renderDeeplyUnderstoodKnowledge(); } }); }); deeplyUnderstoodKnowledge.forEach(moment => { if (moment.justClickedForCelebration) { const cardElement = deepenedMomentsList.querySelector(`.deepened-moment-card[data-timestamp="${moment.timestamp}"]`); if (cardElement) { cardElement.classList.add('mastered-celebrate-pop'); const rect = cardElement.getBoundingClientRect(); triggerParticleBurst('masteredItem', rect.left + rect.width / 2, rect.top + rect.height / 2); SharedUtils.showToast("MASTERED! WELL DONE!", 1500, 'success'); setTimeout(() => { cardElement.classList.remove('mastered-celebrate-pop'); }, 500); } delete moment.justClickedForCelebration; } }); updateCountersAndPointsDisplay(); }


    // =================================================================================
    // SECTION: EVENT HANDLERS & CORE ACTIONS
    // =================================================================================
    function handleCheckboxChange(event) { /* ... (Copy from original, then refactor saveMoments->saveKnowledgeForumState) ... */ }
    function handleTextContainerClick(event) { /* ... (Copy from original, then refactor fetchSingleAIAnswer call if needed) ... */ }
    function handleReviewButtonClick(event) { /* ... (Copy from original, then refactor toggleUserReviewedStatus) ... */ }
    function handleRegenerateButtonClick(event) { /* ... (Copy from original, then refactor regenerateAIAnswer) ... */ }
    function toggleAnswerExpansion(timestamp) { /* ... (Copy from original, then refactor saveMoments->saveKnowledgeForumState, renderMoments->renderAllLists) ... */ }
    function toggleUserReviewedStatus(timestamp) { /* ... (Copy from original, then refactor saveMoments->saveKnowledgeForumState, showToast, renderMoments->renderAllLists) ... */ }
    function toggleArchiveRevisedStatus(timestamp) { /* ... (Copy, refactor saveMoments->saveKnowledgeForumState, showToast, renderArchivedKnowledge->renderAllLists) ... */ }
    async function handleDeepDiveClick(timestamp) { /* ... (Copy, refactor renderArchivedKnowledge->renderAllLists, fetchAIAnswerLogic, showToast, saveMoments->saveKnowledgeForumState) ... */ }

    // --- Full Event Handlers (Refactored) ---
    function handleCheckboxChange(event) { const ts = parseInt(event.target.dataset.timestamp); const mom = loggedMoments.find(m => m.timestamp === ts); if (mom) { mom.selectedForBatch = event.target.checked; saveKnowledgeForumState(); updateCountersAndPointsDisplay(); /* No full re-render needed, just counter */ renderMoments(); /* Re-render moments to show checkbox state if not visually obvious */ } }
    function toggleAnswerExpansion(timestamp) { const m = loggedMoments.find(mo => mo.timestamp === timestamp); if (m) { m.isAnswerExpanded = !m.isAnswerExpanded; saveKnowledgeForumState(); renderMoments(); } }
    function handleTextContainerClick(event) { const ts = parseInt(event.currentTarget.dataset.timestamp); const mom = loggedMoments.find(m => m.timestamp === ts); if (mom) { if (!mom.answer && !mom.isProcessing && !mom.isRegenerating) { const liEl = document.getElementById(`moment-item-${ts}`); fetchSingleAIAnswer(mom, liEl, true); } else { toggleAnswerExpansion(ts); } } }
    function handleReviewButtonClick(event) { event.stopPropagation(); const ts = parseInt(event.currentTarget.dataset.timestamp); toggleUserReviewedStatus(ts); }
    function handleRegenerateButtonClick(event) { event.stopPropagation(); const ts = parseInt(event.currentTarget.dataset.timestamp); const mom = loggedMoments.find(m => m.timestamp === ts); const liEl = document.getElementById(`moment-item-${ts}`); if (mom && liEl && !mom.hasBeenRegenerated) { regenerateAIAnswer(mom, liEl); } }
    function toggleUserReviewedStatus(timestamp) { const m = loggedMoments.find(mo => mo.timestamp === timestamp); if (m) { m.userMarkedReviewed = !m.userMarkedReviewed; SharedUtils.showToast(m.userMarkedReviewed ? "REVIEWED!" : "UNREVIEWED.", 1500, 'info'); saveKnowledgeForumState(); renderMoments(); } }
    function toggleArchiveRevisedStatus(timestamp) { const moment = archivedKnowledge.find(m => m.timestamp === timestamp); if (moment) { moment.isRevisedForDeepTest = !moment.isRevisedForDeepTest; SharedUtils.showToast(moment.isRevisedForDeepTest ? "REVISED FOR DEEPER TEST!" : "Marked Unrevised.", 2000, 'info'); saveKnowledgeForumState(); renderArchivedKnowledge(); } }
    async function handleDeepDiveClick(timestamp) { const moment = archivedKnowledge.find(m => m.timestamp === timestamp); if (!moment || moment.isDeepDiveProcessing) return; moment.isDeepDiveProcessing = true; moment.isAnswerExpanded = true; renderArchivedKnowledge(); try { const deepDiveText = await fetchAIAnswerLogic(null, false, false, null, true, moment); moment.deepDiveAnswer = deepDiveText; SharedUtils.showToast("Knowledge Deepened!", 2000, 'success'); } catch (e) { console.error("Error fetching deep dive:", e); moment.deepDiveAnswer = `DEEP DIVE ERROR: ${e.message}`; SharedUtils.showToast("Deep Dive Failed.", 2000, 'error');} finally { moment.isDeepDiveProcessing = false; saveKnowledgeForumState(); renderArchivedKnowledge(); } }


    // Log Button Listener
    if (logButton && idkInput) {
        logButton.addEventListener('click', () => { /* ... (Copy, refactor saveMoments->saveKnowledgeForumState, showToast, renderMoments->renderAllLists) ... */ });
    }
    // --- Full Log Button Listener (Refactored) ---
    if (logButton && idkInput) { logButton.addEventListener('click', () => { const text = idkInput.value.trim(); if (text) { const initialType = autoSetInitialType(text); loggedMoments.unshift({ text: text, timestamp: Date.now(), type: initialType, aiVerdict: null, userMarkedReviewed: false, answer: null, isAnswerExpanded: false, hasBeenRegenerated: false, selectedForBatch: false, isProcessing: false, isRegenerating: false, newlyAdded: true, spinnerInterval: null, deepDiveAnswer: null, isRevisedForDeepTest: false, isDeepDiveProcessing: false, isDeeplyUnderstood: false }); idkInput.value = ''; SharedUtils.showToast("MOMENT LOGGED!", 1500, 'success'); saveKnowledgeForumState(); renderAllLists(); } else { SharedUtils.showToast("INPUT TEXT REQUIRED.", 1500, 'error'); } }); }

    // Select All Button Listener
    if (selectAllButton) {
        selectAllButton.addEventListener('click', () => { /* ... (Copy, refactor saveMoments->saveKnowledgeForumState, showToast, renderMoments->renderAllLists) ... */ });
    }
    // --- Full Select All Listener (Refactored) ---
    if (selectAllButton) { selectAllButton.addEventListener('click', () => { if (loggedMoments.length === 0) { SharedUtils.showToast("NO MOMENTS TO SELECT.", 1500, 'info'); return; } const allSelected = loggedMoments.every(m => m.selectedForBatch); const targetState = !allSelected; loggedMoments.forEach(m => m.selectedForBatch = targetState); saveKnowledgeForumState(); renderMoments(); /* Just re-render moments for checkbox updates */ updateCountersAndPointsDisplay(); }); }


    // =================================================================================
    // SECTION: AI INTEGRATION & LOGIC
    // =================================================================================
    const AI_MCQ_PROMPT_SYSTEM = `...`; // Copy original
    const AI_DEEPEN_UNDERSTANDING_PROMPT_SYSTEM = `...`; // Copy original
    const AI_DEEP_DIVE_MCQ_PROMPT_SYSTEM = `...`; // Copy original
    const AI_STATEMENT_SYSTEM_PROMPT = `...`; // Copy original
    const AI_REGENERATE_SYSTEM_PROMPT = `...`; // Copy original
    // --- Full AI Prompts ---
    const AI_MCQ_PROMPT_SYSTEM = `You are a quiz question generator. Based on the user's original logged text and an AI explanation, create a single, concise question to test comprehension of this information. Then provide ONE correct answer, ONE plausible but incorrect distractor, AND ONE silly, obviously wrong, or humorous "dumb answer" distractor. Format your entire response *strictly* as:\nQ: [Your Question Here]\nC: [The Correct Answer Here]\nD1: [Plausible Distractor 1 Here]\nDUMB: [The Silly/Dumb Distractor Here]\nDo not add any other text or conversational pleasantries.`;
    const AI_DEEPEN_UNDERSTANDING_PROMPT_SYSTEM = `The user previously logged: "[USER_LOG_TEXT]" and received this explanation: "[ORIGINAL_AI_ANSWER]". They now want to deepen their understanding. Provide a concise explanation that includes 3 new distinct pieces of information, facts, or related concepts that expand on the original topic. Keep the retro interface style and output in plain text.`;
    const AI_DEEP_DIVE_MCQ_PROMPT_SYSTEM = `You are an advanced quiz question generator. The user has received an initial explanation and a "deep dive" explanation for a topic. Original Log: "[USER_LOG_TEXT]" Initial Explanation: "[ORIGINAL_AI_ANSWER]" Deep Dive Explanation: "[DEEP_DIVE_AI_ANSWER]" Your task is to generate a challenging multiple-choice question based *primarily* on a *specific new piece of information* from the "Deep Dive Explanation". The target new information is the [TARGET_INFO_FOCUS] new detail/fact mentioned in the Deep Dive Explanation. Provide ONE correct answer and TWO plausible but incorrect distractor answers. Format your entire response *strictly* as:\nQ: [Your Challenging Question Here, focused on the [TARGET_INFO_FOCUS] new detail from the Deep Dive Explanation]\nC: [The Correct Answer Here]\nD1: [Plausible Distractor 1 Here]\nD2: [Plausible Distractor 2 Here]\nDo not add any other text or conversational pleasantries.`;
    const AI_STATEMENT_SYSTEM_PROMPT = `You are a factual validation assistant for statements related to general knowledge, science, history, and technology. If a statement is verifiably true, prefix your explanation with [CORRECT]. If it's verifiably false, prefix with [INCORRECT]. If its truth is debatable, nuanced, subjective, or requires significant context not provided, prefix with [UNCLEAR]. After the prefix, provide a very brief, direct explanation (1-2 sentences) in a retro computer interface style. Example: "[CORRECT] The Earth is an oblate spheroid." or "[INCORRECT] The sun revolves around the Earth. The Earth revolves around the sun." or "[UNCLEAR] Pineapple on pizza is delicious. This is a matter of subjective taste." Output in plain text suitable for a retro computer interface.`;
    const AI_REGENERATE_SYSTEM_PROMPT = `You are a helpful assistant. The user wants a new or rephrased answer to their previous query. Provide a concise, clear, and slightly different explanation or answer than what might have been given before. Keep the tone suitable for a retro computer interface. Output in plain text.`;


    async function fetchAIAnswerLogic(moment, isRegeneration = false, isQuizQuestionGen = false, quizMomentContext = null, isDeepDiveGen = false, deepDiveContext = null, isDeepDiveMCQGen = false, deepDiveQuestionNumber = 1) { /* ... (Copy, refactor showToast->SharedUtils.showToast) ... */ }
    async function fetchSingleAIAnswer(moment, listItemElement, expandAfterFetch = false) { /* ... (Copy, refactor saveMoments->saveKnowledgeForumState, renderMoments->renderAllLists) ... */ }
    async function regenerateAIAnswer(moment, listItemElement) { /* ... (Copy, refactor saveMoments->saveKnowledgeForumState, showToast, renderMoments->renderAllLists) ... */ }
    // Process Selected Button Listener
    if (processSelectedButton) {
        processSelectedButton.addEventListener('click', async () => { /* ... (Copy, refactor saveMoments->saveKnowledgeForumState, showToast, renderMoments->renderAllLists) ... */ });
    }

    // --- Full AI Logic (Refactored) ---
    async function fetchAIAnswerLogic(moment, isRegeneration = false, isQuizQuestionGen = false, quizMomentContext = null, isDeepDiveGen = false, deepDiveContext = null, isDeepDiveMCQGen = false, deepDiveQuestionNumber = 1) { const apiKeyToUse = userProvidedApiKey; if (!apiKeyToUse) { SharedUtils.showToast("NO API KEY SET. PLEASE ENTER ONE.", 3000, 'error'); console.error('OpenAI API Key is missing!'); throw new Error('OpenAI API Key is missing!');} let systemPrompt = "You are a helpful assistant. Your output should be suitable for a retro computer interface."; let userQuery = ""; let modelToUse = 'gpt-3.5-turbo'; let maxTokens = 200; const focusHints = ["first", "second", "third"]; if (isDeepDiveMCQGen && deepDiveContext) { let targetInfoFocus = focusHints[deepDiveQuestionNumber - 1] || "a distinct"; systemPrompt = AI_DEEP_DIVE_MCQ_PROMPT_SYSTEM.replace("[USER_LOG_TEXT]", deepDiveContext.text || '').replace("[ORIGINAL_AI_ANSWER]", deepDiveContext.answer || '').replace("[DEEP_DIVE_AI_ANSWER]", deepDiveContext.deepDiveAnswer || '').replace(/\[TARGET_INFO_FOCUS\]/g, targetInfoFocus); userQuery = `Generate challenging MCQ question #${deepDiveQuestionNumber} for this topic, focusing on the ${targetInfoFocus} new aspect.`; maxTokens = 180; } else if (isDeepDiveGen && deepDiveContext) { systemPrompt = AI_DEEPEN_UNDERSTANDING_PROMPT_SYSTEM.replace("[USER_LOG_TEXT]", deepDiveContext.text).replace("[ORIGINAL_AI_ANSWER]", deepDiveContext.answer || "(N/A)"); userQuery = "Provide deeper explanation."; maxTokens = 250; } else if (isQuizQuestionGen && quizMomentContext) { systemPrompt = AI_MCQ_PROMPT_SYSTEM; userQuery = `User's log: "${quizMomentContext.text}"\nAI's explanation: "${quizMomentContext.answer || '(N/A)'}"\nGenerate MCQ.`; maxTokens = 160; } else if (moment) { if (isRegeneration) { systemPrompt = AI_REGENERATE_SYSTEM_PROMPT; userQuery = `Original: "${moment.text}"`;} else if (moment.type === 'question') { userQuery = `Explain: "${moment.text}"`;} else if (moment.type === 'statement') { systemPrompt = AI_STATEMENT_SYSTEM_PROMPT; userQuery = `Validate: "${moment.text}"`;} else { userQuery = moment.text;} } else { throw new Error("Invalid parameters for AI logic."); } const requestBodyToOpenAI = {model: modelToUse, messages: [{ "role": "system", "content": systemPrompt }, { "role": "user", "content": userQuery }], max_tokens: maxTokens, temperature: isQuizQuestionGen || isDeepDiveMCQGen ? 0.75 : (isRegeneration ? 0.6 : (isDeepDiveGen ? 0.5 : 0.4))}; const response = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKeyToUse}`}, body: JSON.stringify(requestBodyToOpenAI)}); if (!response.ok) { const eD = await response.json().catch(() => ({error: {message: "Unknown API error"}})); console.error("OpenAI API Error:", eD); SharedUtils.showToast(`API Error: ${eD.error?.message || 'Unknown'}`, 4000, 'error'); throw new Error(`API Error (${response.status}): ${eD.error?.message || 'Unknown'}`);} const data = await response.json(); let rawAnswerText = data.choices[0]?.message?.content.trim() || "NO RESPONSE."; if (moment && !isQuizQuestionGen && !isDeepDiveGen && !isDeepDiveMCQGen && moment.type === 'statement' && !isRegeneration) { if (rawAnswerText.startsWith('[CORRECT]')) { moment.aiVerdict = 'correct'; rawAnswerText = rawAnswerText.substring(9).trim(); } else if (rawAnswerText.startsWith('[INCORRECT]')) { moment.aiVerdict = 'incorrect'; rawAnswerText = rawAnswerText.substring(11).trim(); } else if (rawAnswerText.startsWith('[UNCLEAR]')) { moment.aiVerdict = 'unclear'; rawAnswerText = rawAnswerText.substring(9).trim(); } else { moment.aiVerdict = 'unclear'; /* Default to unclear if no prefix */ }} return rawAnswerText; }
    async function fetchSingleAIAnswer(moment, listItemElement, expandAfterFetch = false) { if (moment.isProcessing || moment.isRegenerating) return; moment.isProcessing = true; if (expandAfterFetch) moment.isAnswerExpanded = false; renderMoments(); try { const aT = await fetchAIAnswerLogic(moment); moment.answer = aT; if (expandAfterFetch) moment.isAnswerExpanded = true; } catch (e) { moment.answer = `ERROR: ${e.message}`; if (expandAfterFetch) moment.isAnswerExpanded = true;  SharedUtils.showToast("Failed to get AI insight.", 2000, 'error');} finally { moment.isProcessing = false; saveKnowledgeForumState(); renderMoments();}}
    async function regenerateAIAnswer(moment, listItemElement) { if (moment.hasBeenRegenerated || moment.isProcessing || moment.isRegenerating) return; moment.isRegenerating = true; moment.isAnswerExpanded = true; renderMoments(); try { const aT = await fetchAIAnswerLogic(moment, true); moment.answer = aT; moment.hasBeenRegenerated = true; SharedUtils.showToast("RESPONSE REGENERATED!", 2000, 'success'); } catch (e) { moment.answer = `REGEN ERROR: ${e.message}`; SharedUtils.showToast("Regeneration Failed.", 2000, 'error');} finally { moment.isRegenerating = false; saveKnowledgeForumState(); renderMoments();}}
    if (processSelectedButton) { processSelectedButton.addEventListener('click', async () => { const itemsToProcess = loggedMoments.filter(m => m.selectedForBatch && !m.isProcessing && !m.isRegenerating); if (itemsToProcess.length === 0) { SharedUtils.showToast("NO ITEMS SELECTED FOR BATCH PROCESSING.", 2000, 'info'); return; } if (overallLoadingIndicator) { overallLoadingIndicator.textContent = `PROCESSING 0/${itemsToProcess.length}...`; overallLoadingIndicator.style.display = 'block'; } processSelectedButton.disabled = true; let processedCount = 0; for (const moment of itemsToProcess) { moment.isProcessing = true; renderMoments(); try { const answerText = await fetchAIAnswerLogic(moment); moment.answer = answerText; moment.isAnswerExpanded = true; } catch (e) { moment.answer = `ERROR: ${e.message}`; moment.isAnswerExpanded = true; } finally { moment.isProcessing = false; moment.selectedForBatch = false; processedCount++; if (overallLoadingIndicator) overallLoadingIndicator.textContent = `PROCESSING ${processedCount}/${itemsToProcess.length}...`; saveKnowledgeForumState(); renderMoments(); } } if (overallLoadingIndicator) overallLoadingIndicator.textContent = `BATCH COMPLETE! ${processedCount} ITEMS.`; SharedUtils.showToast(`BATCH OK: ${processedCount} PROCESSED!`, 2500, 'success'); setTimeout(() => { if (overallLoadingIndicator) overallLoadingIndicator.style.display = 'none'; }, 3000); processSelectedButton.disabled = false; updateCountersAndPointsDisplay(); }); }


    // =================================================================================
    // SECTION: QUIZ LOGIC
    // =================================================================================
    function startDeepDiveQuiz(archivedMoment) { /* ... (Copy, refactor showToast, saveMoments->saveKnowledgeForumState, renderAllLists, point awards) ... */ }
    async function startQuiz(isForArchivedItem = false, specificArchivedMoment = null) { /* ... (Copy, refactor) ... */ }
    function displayMCQQuestion() { /* ... (Copy) ... */ }
    function selectQuizOption(optionDiv, optionText) { /* ... (Copy) ... */ }
    // Submit Quiz Answer Listener
    if(submitQuizAnswerButton) submitQuizAnswerButton.addEventListener('click', () => { /* ... (Copy, refactor) ... */ });
    // Next/Finish/Close Quiz Button Listeners
    if(nextQuizQuestionButton) nextQuizQuestionButton.addEventListener('click', () => { /* ... (Copy) ... */ });
    if(finishQuizButton) finishQuizButton.addEventListener('click', finishMCQQuiz);
    if(closeQuizButton) closeQuizButton.addEventListener('click', () => { /* ... (Copy) ... */ });
    function finishMCQQuiz() { /* ... (Copy, refactor) ... */ }

    // --- Full Quiz Logic (Refactored) ---
    function startDeepDiveQuiz(archivedMoment) { if (!archivedMoment || !archivedMoment.isRevisedForDeepTest || !archivedMoment.deepDiveAnswer) { console.error("Cannot start deep dive quiz for this item.", archivedMoment); SharedUtils.showToast("ERROR: Deep dive test prerequisites not met.", 2500, 'error'); return; } startQuiz(true, archivedMoment); }
    async function startQuiz(isForArchivedItem = false, specificArchivedMoment = null) { isDeepDiveQuiz = isForArchivedItem; currentDeepDiveQuizMoment = isForArchivedItem ? specificArchivedMoment : null; const itemsForQuizSource = isForArchivedItem && specificArchivedMoment ? [specificArchivedMoment] : loggedMoments.filter(m => m.userMarkedReviewed && m.answer); if (itemsForQuizSource.length === 0 || (isForArchivedItem && !specificArchivedMoment)) { SharedUtils.showToast(isForArchivedItem ? "Error starting deep dive test." : "NO REVIEWED ITEMS WITH ANSWERS TO TEST!", 2500, 'info'); return; } currentQuizQuestionsData = []; const prepButton = isForArchivedItem && specificArchivedMoment ? document.querySelector(`.archive-deep-dive-test-button[data-timestamp="${specificArchivedMoment.timestamp}"]`) : testKnowledgeButton; if (prepButton) { prepButton.disabled = true; prepButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> PREPARING...'; } if (isForArchivedItem && specificArchivedMoment) { for (let i = 0; i < 3; i++) { try { const mcqText = await fetchAIAnswerLogic(null, false, false, null, false, specificArchivedMoment, true, i + 1); const qMatch = mcqText.match(/Q:\s*([\s\S]*?)\nC:/i); const cMatch = mcqText.match(/C:\s*([\s\S]*?)\nD1:/i); const d1Match = mcqText.match(/D1:\s*([\s\S]*?)\nD2:/i); const d2Match = mcqText.match(/D2:\s*([\s\S]*?)$/i); if (qMatch && cMatch && d1Match && d2Match) { let opts = [cMatch[1].trim(), d1Match[1].trim(), d2Match[1].trim()]; opts.sort(() => 0.5 - Math.random()); currentQuizQuestionsData.push({ question: qMatch[1].trim(), options: opts, correctAnswerText: cMatch[1].trim(), originalMomentTimestamp: specificArchivedMoment.timestamp, isDumb: false }); } else { console.warn(`Deep Dive MCQ PARSE FAIL (Q${i+1}):`, mcqText); } } catch (e) { console.error(`Error gen deep dive MCQ (Q${i+1}):`, e); SharedUtils.showToast("Error generating deep dive question.", 2000, 'error');} } } else { const shuffled = itemsForQuizSource.sort(() => 0.5 - Math.random()); const itemsForThisQuiz = shuffled.slice(0, Math.min(itemsForQuizSource.length, 3)); for (const item of itemsForThisQuiz) { try { const mcqText = await fetchAIAnswerLogic(null, false, true, item); const qMatch = mcqText.match(/Q:\s*([\s\S]*?)\nC:/i); const cMatch = mcqText.match(/C:\s*([\s\S]*?)\nD1:/i); const d1Match = mcqText.match(/D1:\s*([\s\S]*?)\nDUMB:/i); const dumbMatch = mcqText.match(/DUMB:\s*([\s\S]*?)$/i); if (qMatch && cMatch && d1Match && dumbMatch) { let options = [cMatch[1].trim(), d1Match[1].trim(), dumbMatch[1].trim()]; let dumbAnswerText = dumbMatch[1].trim(); options.sort(() => 0.5 - Math.random()); currentQuizQuestionsData.push({ question: qMatch[1].trim(), options, correctAnswerText: cMatch[1].trim(), originalMomentTimestamp: item.timestamp, dumbAnswerText: dumbAnswerText }); } else { console.warn("Regular MCQ PARSE FAIL (DUMB):", mcqText); } } catch (e) { console.error("Error gen quiz MCQ:", e); SharedUtils.showToast("Error generating quiz question.", 2000, 'error'); } } } currentQuizQuestionsData = currentQuizQuestionsData.filter(q => q && q.question && q.options && q.correctAnswerText); if (prepButton) { prepButton.disabled = false; prepButton.innerHTML = isForArchivedItem ? '<i class="fas fa-vial"></i> Test' : 'Test Knowledge!';} if (currentQuizQuestionsData.length > 0) { currentQuizQuestionIndex = 0; currentQuizCorrectAnswersCount = 0; if(quizModalTitle) quizModalTitle.textContent = isForArchivedItem && specificArchivedMoment ? `DEEP DIVE: ${specificArchivedMoment.text.substring(0,20)}...` : "KNOWLEDGE TEST!"; displayMCQQuestion(); if(quizModalOverlay) quizModalOverlay.classList.add('show'); if(closeQuizButton) closeQuizButton.style.display = 'none'; if(finishQuizButton) finishQuizButton.style.display = 'none'; } else { SharedUtils.showToast("COULDN'T PREPARE QUIZ QUESTIONS. TRY AGAIN.", 2500, 'error'); } }
    if(testKnowledgeButton) testKnowledgeButton.addEventListener('click', () => startQuiz(false, null));
    function displayMCQQuestion() { if(!quizModalOverlay) return; if (currentQuizQuestionIndex < currentQuizQuestionsData.length) { const qD = currentQuizQuestionsData[currentQuizQuestionIndex]; if(quizQuestionNumber) quizQuestionNumber.textContent = `QUESTION ${currentQuizQuestionIndex + 1} OF ${currentQuizQuestionsData.length}`; if(quizQuestionText) quizQuestionText.textContent = qD.question; if(quizOptionsContainer) quizOptionsContainer.innerHTML = ''; qD.options.forEach(oT => { const oD = document.createElement('div'); oD.classList.add('quiz-option'); oD.textContent = oT; oD.addEventListener('click', () => selectQuizOption(oD, oT)); if(quizOptionsContainer) quizOptionsContainer.appendChild(oD); }); if(quizFeedbackArea) {quizFeedbackArea.textContent = 'CHOOSE AN OPTION.'; quizFeedbackArea.className = 'quiz-feedback-area';} if(submitQuizAnswerButton) {submitQuizAnswerButton.style.display = 'inline-block'; submitQuizAnswerButton.disabled = true;} if(nextQuizQuestionButton) nextQuizQuestionButton.style.display = 'none'; if(finishQuizButton) finishQuizButton.style.display = 'none'; selectedQuizOptionElement = null; } else { finishMCQQuiz(); }}
    function selectQuizOption(optionDiv, optionText) { if (submitQuizAnswerButton && submitQuizAnswerButton.style.display === 'none') return; if (selectedQuizOptionElement) { selectedQuizOptionElement.classList.remove('selected'); } optionDiv.classList.add('selected'); selectedQuizOptionElement = optionDiv; if(submitQuizAnswerButton) submitQuizAnswerButton.disabled = false; }
    if(submitQuizAnswerButton) submitQuizAnswerButton.addEventListener('click', () => { if (!selectedQuizOptionElement) return; const userAnswerText = selectedQuizOptionElement.textContent; const qData = currentQuizQuestionsData[currentQuizQuestionIndex]; const isCorrect = userAnswerText === qData.correctAnswerText; const isDumbSelection = !isDeepDiveQuiz && qData.dumbAnswerText && userAnswerText === qData.dumbAnswerText; const pointsForThisQuestion = isDeepDiveQuiz ? 3 : 2; if (isDumbSelection) { userStupidPoints++; if(quizFeedbackArea) {quizFeedbackArea.textContent = "FOOL. +1 SILLY POINT! 👎"; quizFeedbackArea.className = 'quiz-feedback-area incorrect';} selectedQuizOptionElement.classList.add('incorrect'); SharedUtils.showToast("OH DEAR... +1 SILLY POINT!", 2000, 'info'); triggerParticleBurst('dumbAnswer'); if(quizOptionsContainer) quizOptionsContainer.querySelectorAll('.quiz-option').forEach(opt => { if (opt.textContent === qData.correctAnswerText) { opt.classList.add('correct'); }}); } else if (isCorrect) { if(quizFeedbackArea) {quizFeedbackArea.textContent = `CORRECT! +${pointsForThisQuestion} PTS!`; quizFeedbackArea.className = 'quiz-feedback-area correct';} selectedQuizOptionElement.classList.add('correct'); currentQuizCorrectAnswersCount++; awardPointsAndUpdateUI(pointsForThisQuestion, "Quiz Correct"); triggerParticleBurst('correctAnswer'); if (!isDeepDiveQuiz) { const momentToArchiveIndex = loggedMoments.findIndex(m => m.timestamp === qData.originalMomentTimestamp); if (momentToArchiveIndex > -1) { const momentToArchive = loggedMoments.splice(momentToArchiveIndex, 1)[0]; const cardElement = document.getElementById(`moment-item-${qData.originalMomentTimestamp}`); if(cardElement) cardElement.classList.add('archiving'); setTimeout(() => { momentToArchive.isArchived = true; momentToArchive.archivedTimestamp = Date.now(); momentToArchive.isAnswerExpanded = false; archivedKnowledge.unshift(momentToArchive); saveKnowledgeForumState(); renderAllLists(); }, 500);} else { saveKnowledgeForumState(); updateCountersAndPointsDisplay(); } } else { saveKnowledgeForumState(); updateCountersAndPointsDisplay(); } } else { if(quizFeedbackArea) {quizFeedbackArea.textContent = `INCORRECT. Correct was: ${qData.correctAnswerText}`; quizFeedbackArea.className = 'quiz-feedback-area incorrect';} selectedQuizOptionElement.classList.add('incorrect'); if(quizOptionsContainer) quizOptionsContainer.querySelectorAll('.quiz-option').forEach(opt => { if (opt.textContent === qData.correctAnswerText) { opt.classList.add('correct'); }}); } if(quizOptionsContainer) quizOptionsContainer.querySelectorAll('.quiz-option').forEach(opt => { opt.style.pointerEvents = 'none'; }); if(submitQuizAnswerButton) submitQuizAnswerButton.style.display = 'none'; if (currentQuizQuestionIndex < currentQuizQuestionsData.length - 1) { if(nextQuizQuestionButton) nextQuizQuestionButton.style.display = 'inline-block'; } else { if(finishQuizButton) finishQuizButton.style.display = 'inline-block'; } });
    if(nextQuizQuestionButton) nextQuizQuestionButton.addEventListener('click', () => { currentQuizQuestionIndex++; displayMCQQuestion(); });
    if(finishQuizButton) finishQuizButton.addEventListener('click', finishMCQQuiz);
    if(closeQuizButton) closeQuizButton.addEventListener('click', () => { if(quizModalOverlay) quizModalOverlay.classList.remove('show'); });
    function finishMCQQuiz() { let quizResultText = `QUIZ FINISHED! YOU GOT ${currentQuizCorrectAnswersCount} OF ${currentQuizQuestionsData.length} CORRECT.`; const perfectScoreBonus = isDeepDiveQuiz ? 7 : 5; let earnedPerfectBonus = false; if (currentQuizQuestionsData.length > 0 && currentQuizCorrectAnswersCount === currentQuizQuestionsData.length) { awardPointsAndUpdateUI(perfectScoreBonus, "Perfect Quiz Bonus"); earnedPerfectBonus = true; triggerParticleBurst('perfectQuiz'); quizResultText += `\nPERFECT SCORE! +${perfectScoreBonus} <i class="fas fa-coins points-icon"></i> BONUS!`; if (isDeepDiveQuiz && currentDeepDiveQuizMoment) { const momentToMasterIndex = archivedKnowledge.findIndex(m => m.timestamp === currentDeepDiveQuizMoment.timestamp); if (momentToMasterIndex > -1) { const momentToMaster = archivedKnowledge.splice(momentToMasterIndex, 1)[0]; momentToMaster.isDeeplyUnderstood = true; momentToMaster.deeplyUnderstoodTimestamp = Date.now(); momentToMaster.isAnswerExpanded = false; deeplyUnderstoodKnowledge.unshift(momentToMaster); SharedUtils.showToast(`"${momentToMaster.text.substring(0,20)}..." FULLY MASTERED & MOVED!`, 2500, 'success');}}} saveKnowledgeForumState(); renderAllLists(); if(quizFeedbackArea) quizFeedbackArea.innerHTML = quizResultText.replace(/\n/g, '<br>'); SharedUtils.showToast(earnedPerfectBonus ? `PERFECT QUIZ! +${perfectScoreBonus} BONUS PTS!` : `QUIZ DONE. ${currentQuizCorrectAnswersCount}/${currentQuizQuestionsData.length}.`, 3000, earnedPerfectBonus ? 'success' : 'info'); if(submitQuizAnswerButton) submitQuizAnswerButton.style.display = 'none'; if(nextQuizQuestionButton) nextQuizQuestionButton.style.display = 'none'; if(finishQuizButton) finishQuizButton.style.display = 'none'; if(closeQuizButton) closeQuizButton.style.display = 'inline-block'; currentDeepDiveQuizMoment = null; }


    // =================================================================================
    // SECTION: INITIALIZATION
    // =================================================================================
    function initializeKnowledgeForum() {
        console.log("Initializing Knowledge Forum...");
        loadKnowledgeForumState();
        ThemeManager.applyTheme(ThemeManager.getCurrentThemeId());
        initializeParticleSystem();

        renderAllLists(); // Includes updateCountersAndPointsDisplay

        // API Key Button Setup
        if (saveApiKeyButton && userApiKeyInput) {
            saveApiKeyButton.addEventListener('click', () => {
                const newKey = userApiKeyInput.value.trim();
                if (newKey && (newKey.startsWith('sk-') || newKey.startsWith('sk-proj-'))) {
                    userProvidedApiKey = newKey;
                    SharedUtils.showToast("API KEY SAVED!", 2000, 'success');
                } else if (newKey === "") {
                    userProvidedApiKey = ""; // Clear the key
                    SharedUtils.showToast("API KEY CLEARED.", 2000, 'info');
                } else {
                    SharedUtils.showToast("INVALID API KEY FORMAT.", 2000, 'error');
                }
                saveKnowledgeForumState(); // Save API key change
            });
        }
        // Accordion Listeners
        if (archiveHeader && archivedItemsListContainer && archiveToggleIcon) { archiveHeader.addEventListener('click', () => { archivedItemsListContainer.classList.toggle('expanded'); archiveToggleIcon.classList.toggle('expanded'); });}
        if (deepenedHeader && deepenedItemsListContainer && deepenedToggleIcon) { deepenedHeader.addEventListener('click', () => { deepenedItemsListContainer.classList.toggle('expanded'); deepenedToggleIcon.classList.toggle('expanded'); });}

        console.log("Knowledge Forum Initialized (Fully Refactored for Rome Hub).");
    }

    initializeKnowledgeForum();
});
