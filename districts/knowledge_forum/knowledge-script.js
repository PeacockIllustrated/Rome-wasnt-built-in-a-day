// script.js (for index.html)
document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors for index.html ---
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
    const toastNotification = document.getElementById('toastNotification');
    const userPointsDisplay = document.getElementById('userPoints');
    const stupidPointsDisplay = document.getElementById('userStupidPoints');
    const goldStarsDisplay = document.getElementById('goldStars');

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

    const particleCanvas = document.getElementById('particleCanvas');
    let ctx, particles = [];
    if (particleCanvas) {
        ctx = particleCanvas.getContext('2d');
        particleCanvas.width = window.innerWidth;
        particleCanvas.height = window.innerHeight;
        window.addEventListener('resize', () => {
            if (particleCanvas) {
                particleCanvas.width = window.innerWidth;
                particleCanvas.height = window.innerHeight;
            }
        });
    }

    const shopToolbar = document.getElementById('shopToolbar');
    const shopToolbarHeader = document.getElementById('shopToolbarHeader');
    const shopAccordionContent = document.getElementById('shopAccordionContent');
    const shopUserPointsDisplay = document.getElementById('shopUserPoints'); // In shop toolbar

    // --- State Variables & Config ---
    const localStorageKeySuffix = '_v27_theme_shop'; // Consistent key
    const themes = { // MUST BE COMPLETE AND MATCH shop-script.js
        default: { name: "Default Retro", cost: 0, owned: true, description: "The classic look and feel.", cssVariables: { '--theme-primary-dark': '#264653', '--theme-primary-accent': '#2A9D8F', '--theme-secondary-accent': '#E9C46A', '--theme-tertiary-accent': '#F4A261', '--theme-highlight-accent': '#E76F51', '--theme-light-bg': '#EAEAEA', '--theme-card-bg': '#FFFFFF', '--theme-text-on-dark': '#EAEAEA', '--theme-page-bg': 'rgb(174, 217, 211)' } },
        oceanDepths: { name: "Ocean Depths", cost: 1, description: "Dive into cool blue tranquility.", cssVariables: { '--theme-primary-dark': '#03045E', '--theme-primary-accent': '#0077B6', '--theme-secondary-accent': '#00B4D8', '--theme-tertiary-accent': '#90E0EF', '--theme-highlight-accent': '#CAF0F8', '--theme-light-bg': '#E0FBFC', '--theme-card-bg': '#FFFFFF', '--theme-text-on-dark': '#CAF0F8', '--theme-page-bg': '#ADE8F4' } },
        volcanoRush: { name: "Volcano Rush", cost: 1, description: "Fiery reds and oranges.", cssVariables: { '--theme-primary-dark': '#2B0000', '--theme-primary-accent': '#6A0000', '--theme-secondary-accent': '#FF4500', '--theme-tertiary-accent': '#FF8C00', '--theme-highlight-accent': '#AE2012', '--theme-light-bg': '#FFF2E6', '--theme-card-bg': '#FFFFFF', '--theme-text-on-dark': '#FFDAB9', '--theme-page-bg': '#FFCDB2' } },
        techOrangeBlue: { name: "Tech Orange & Blue", cost: 1, description: "A modern tech-inspired palette.", cssVariables: { '--theme-primary-dark': '#004C97', '--theme-primary-accent': '#4A7DB5', '--theme-secondary-accent': '#FF6600', '--theme-tertiary-accent': '#C0C0C0', '--theme-highlight-accent': '#FF7700', '--theme-light-bg': '#F0F0F0', '--theme-card-bg': '#FFFFFF', '--theme-text-on-dark': '#F0F0F0', '--theme-page-bg': '#E8E8E8' } },
        forestGreens: { name: "Forest Greens", cost: 1, description: "Earthy and calming greens.", cssVariables: { '--theme-primary-dark': '#1A2B12', '--theme-primary-accent': '#335128', '--theme-secondary-accent': '#526F35', '--theme-tertiary-accent': '#8A9A5B', '--theme-highlight-accent': '#E0E7A3', '--theme-light-bg': '#F0F5E0', '--theme-card-bg': '#FFFFFF', '--theme-text-on-dark': '#E0E7A3', '--theme-page-bg': '#D8E0C0' } }
    };
    let currentTheme = localStorage.getItem('idk_current_theme' + localStorageKeySuffix) || 'default';
    let userPoints = parseInt(localStorage.getItem('idk_user_points_val' + localStorageKeySuffix)) || 0;
    let userStupidPoints = parseInt(localStorage.getItem('idk_user_stupid_points_val' + localStorageKeySuffix)) || 0;
    let userProvidedApiKey = localStorage.getItem('idk_user_openai_api_key' + localStorageKeySuffix) || '';
    let loggedMoments = JSON.parse(localStorage.getItem('idk_moments' + localStorageKeySuffix)) || [];
    let archivedKnowledge = JSON.parse(localStorage.getItem('idk_archived_knowledge' + localStorageKeySuffix)) || [];
    let deeplyUnderstoodKnowledge = JSON.parse(localStorage.getItem('idk_deeply_understood' + localStorageKeySuffix)) || [];
    let ownedThemes = JSON.parse(localStorage.getItem('idk_owned_themes' + localStorageKeySuffix)) || ['default']; // Default theme is always owned

    let currentQuizQuestionsData = [];
    let currentQuizQuestionIndex = 0;
    let currentQuizCorrectAnswersCount = 0;
    let selectedQuizOptionElement = null;
    let isDeepDiveQuiz = false;
    let currentDeepDiveQuizMoment = null;

    // --- API Key Logic ---
    if (userApiKeyInput) userApiKeyInput.value = userProvidedApiKey;
    if (saveApiKeyButton) {
        saveApiKeyButton.addEventListener('click', () => {
            const newKey = userApiKeyInput.value.trim();
            if (newKey && (newKey.startsWith('sk-') || newKey.startsWith('sk-proj-'))) {
                userProvidedApiKey = newKey;
                localStorage.setItem('idk_user_openai_api_key' + localStorageKeySuffix, userProvidedApiKey);
                showToast("API KEY SAVED!");
            } else if (newKey === "") {
                userProvidedApiKey = "";
                localStorage.removeItem('idk_user_openai_api_key' + localStorageKeySuffix);
                showToast("API KEY CLEARED.");
            } else {
                showToast("INVALID API KEY FORMAT.");
            }
        });
    }

    // --- Particle & Utility Functions ---
    function createParticle(x, y, color, size, count, spread, speedMultiplier = 1) { if (!ctx || !particleCanvas) return; for (let i = 0; i < count; i++) { particles.push({ x, y, size: Math.random() * size + 2, color, vx: (Math.random() - 0.5) * spread * speedMultiplier, vy: (Math.random() - 0.5) * spread * speedMultiplier, life: 60 + Math.random() * 30 }); } }
    function updateAndDrawParticles() { if (!ctx || !particleCanvas) return; ctx.clearRect(0, 0, particleCanvas.width, particleCanvas.height); for (let i = particles.length - 1; i >= 0; i--) { const p = particles[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.05; p.life--; if (p.life <= 0) { particles.splice(i, 1); continue; } ctx.fillStyle = p.color; ctx.globalAlpha = p.life / 90; ctx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size); } ctx.globalAlpha = 1; if (particles.length > 0) { requestAnimationFrame(updateAndDrawParticles); } }
    function triggerParticleBurst(type = 'small', customX, customY) {
        if (!ctx || !particleCanvas) return;
        const cX = customX !== undefined ? customX : window.innerWidth / 2;
        const cY = customY !== undefined ? customY : window.innerHeight / 3;
        let clr, sz, cnt, sprd, spd;
        const themeVarsToUse = themes[currentTheme]?.cssVariables || themes.default.cssVariables;
        if (type === 'perfectQuiz') { clr = themeVarsToUse['--theme-secondary-accent']; sz = 8; cnt = 100; sprd = 8; spd = 1.5; }
        else if (type === 'correctAnswer') { clr = themeVarsToUse['--theme-primary-accent']; sz = 6; cnt = 50; sprd = 5; spd = 1; }
        else if (type === 'dumbAnswer') { clr = themeVarsToUse['--theme-highlight-accent']; sz = 5; cnt = 30; sprd = 4; spd = 0.8; }
        else if (type === 'masteredItem') { clr = themeVarsToUse['--theme-secondary-accent']; sz = 7; cnt = 40; sprd = 6; spd = 1.2; }
        else { clr = themeVarsToUse['--theme-primary-accent']; sz = 4; cnt = 20; sprd = 3; spd = 0.7; } // Default small burst
        createParticle(cX, cY, clr, sz, cnt, sprd, spd);
        if (particles.length > 0 && (!particles.isAnimatingLoop || ['dumbAnswer', 'masteredItem', 'perfectQuiz'].includes(type))) { // Ensure important bursts always trigger animation frame
             particles.isAnimatingLoop = true;
             requestAnimationFrame(() => { updateAndDrawParticles(); particles.isAnimatingLoop = false; });
        }
    }
    function formatAnswerForRetroDisplay(text) { if (!text || typeof text !== 'string') return text; const prefix = '    > '; let html = text.split('\n').map(line => line.trim() === '' ? '' : prefix + line).join('<br>'); html = html.replace(/^<br>\s*/, '').replace(/\s*<br>$/, ''); html = html.replace(/(<br>\s*){2,}/g, '<br>'); return html; }
    function showToast(message, duration = 2500) { if (toastNotification) { toastNotification.textContent = message; toastNotification.classList.add('show'); setTimeout(() => { toastNotification.classList.remove('show'); }, duration); } }
    function autoSetInitialType(text) { const lowerText = text.toLowerCase().trim(); if (lowerText.endsWith('?')) return 'question'; const questionStarters = ['what', 'when', 'where', 'who', 'why', 'how', 'is ', 'are ', 'do ', 'does ', 'did ', 'can ', 'could ', 'will ', 'would ', 'should ', 'may ', 'might ']; for (const starter of questionStarters) { if (lowerText.startsWith(starter)) return 'question'; } return 'statement'; }
    function triggerPointsFlash() { const mainPointsDisplay = document.querySelector('.header-stats-bar .points-display:first-child'); if (mainPointsDisplay) mainPointsDisplay.classList.add('points-earned-flash'); setTimeout(() => { if (mainPointsDisplay) mainPointsDisplay.classList.remove('points-earned-flash'); }, 500); }

    // --- Theme Logic for index.html ---
    function applyThemeOnIndex(themeId) {
        const themeToApply = themes[themeId] || themes.default;
        if (themeToApply && themeToApply.cssVariables) {
            const themeVars = themeToApply.cssVariables;
            for (const [key, value] of Object.entries(themeVars)) { document.documentElement.style.setProperty(key, value); }
            document.documentElement.style.setProperty('--theme-text-main', themeVars['--theme-primary-dark']);
            document.documentElement.style.setProperty('--theme-border-main', themeVars['--theme-primary-dark']);
        } else {
            console.warn(`Theme ID "${themeId}" not found. Applying default explicitly.`);
            if (themes.default && themes.default.cssVariables) {
                 const defaultVars = themes.default.cssVariables;
                 for (const [key, value] of Object.entries(defaultVars)) { document.documentElement.style.setProperty(key, value); }
                 document.documentElement.style.setProperty('--theme-text-main', defaultVars['--theme-primary-dark']);
                 document.documentElement.style.setProperty('--theme-border-main', defaultVars['--theme-primary-dark']);
            }
        }
    }

    // --- UI Update Functions ---
    function updateCountersAndPointsDisplay() {
        const reviewedMoments = loggedMoments.filter(m => m.userMarkedReviewed);
        const reviewedCount = reviewedMoments.length;
        const reviewedWithAnswersCount = reviewedMoments.filter(m => m.answer).length; // Only count reviewed items that *have* an answer for quiz eligibility

        if (reviewedCountDisplay) reviewedCountDisplay.textContent = `(${reviewedCount}/${loggedMoments.length} Reviewed)`;
        if (testKnowledgeButton) testKnowledgeButton.disabled = reviewedWithAnswersCount < 1; // Quiz only if at least 1 reviewed item has an answer

        const selectedCount = loggedMoments.filter(m => m.selectedForBatch).length;
        if (selectedCountDisplay) selectedCountDisplay.textContent = `${selectedCount} SEL`;
        if (processSelectedButton) processSelectedButton.disabled = selectedCount === 0;

        const listControlsBar = document.querySelector('.list-controls-bar');
        const batchProcessButtonContainer = document.querySelector('.batch-process-button-container');

        if (loggedMoments.length > 0) {
            if (selectAllButton) selectAllButton.textContent = (selectedCount === loggedMoments.length && selectedCount > 0) ? "DESEL. ALL" : "SEL. ALL";
            if (listControlsBar) listControlsBar.style.display = 'flex';
            if (batchProcessButtonContainer) batchProcessButtonContainer.style.display = 'block'; // Or 'flex' if it's a flex container
        } else {
            if (selectAllButton) selectAllButton.textContent = "SEL. ALL";
            if (listControlsBar) listControlsBar.style.display = 'none';
            if (batchProcessButtonContainer) batchProcessButtonContainer.style.display = 'none';
        }

        if (userPointsDisplay) userPointsDisplay.textContent = userPoints;
        if (stupidPointsDisplay) stupidPointsDisplay.textContent = userStupidPoints;
        if (goldStarsDisplay) goldStarsDisplay.textContent = deeplyUnderstoodKnowledge.length;
        if (shopUserPointsDisplay) shopUserPointsDisplay.textContent = userPoints; // Update shop toolbar points
    }

    // --- Shop Toolbar Link on index.html ---
    if (shopToolbar && shopToolbarHeader && shopAccordionContent) {
        shopToolbarHeader.addEventListener('click', () => { window.location.href = "shop.html"; });
        shopAccordionContent.innerHTML = `
            <div class="theme-item" style="justify-content: center; padding: 10px; cursor:pointer;" onclick="window.location.href='shop.html'">
                <span class="shop-page-link-button">
                    <i class="fas fa-store"></i> VISIT THEME EMPORIUM
                </span>
            </div>`;
        // Dynamic style for shop-page-link-button is in style.css now for consistency
    }

    // --- Core App Logic (Render, Save, Actions) ---
    function renderMoments() {
         if (!momentsList) return; momentsList.innerHTML = '';
         const anyMoments = loggedMoments.length > 0;
         if (noMomentsPlaceholder) noMomentsPlaceholder.style.display = anyMoments ? 'none' : 'block';

         loggedMoments.forEach((moment) => {
            const listItem = document.createElement('li');
            listItem.className = `moment-card type-${moment.type}`;
            listItem.id = `moment-item-${moment.timestamp}`;
            if (moment.newlyAdded) { listItem.classList.add('newly-added'); setTimeout(() => { const el = document.getElementById(`moment-item-${moment.timestamp}`); if (el) el.classList.remove('newly-added'); moment.newlyAdded = false; }, 2000); }
            if (moment.type === 'statement' && moment.aiVerdict) { listItem.classList.add(`verdict-${moment.aiVerdict}`);}
            if (moment.userMarkedReviewed) { listItem.classList.add('user-reviewed');}

            let statusText = '', statusClass = 'status-pending';
            if (moment.type === 'question') { statusText = 'QSTN'; statusClass = 'status-question'; }
            else if (moment.type === 'statement') {
                if (moment.aiVerdict === 'correct') { statusText = 'OK'; statusClass = 'status-correct'; }
                else if (moment.aiVerdict === 'incorrect') { statusText = 'X'; statusClass = 'status-incorrect'; }
                else if (moment.aiVerdict === 'unclear') { statusText = '???'; statusClass = 'status-unclear'; }
                else { statusText = 'STMT'; } // Default for statement if no verdict yet
            }

            const processingHTML = '<span class="spinner-char"></span> PROCESSING...';
            const defaultAnswerText = (moment.type === 'statement' && !moment.aiVerdict && !moment.isProcessing && !moment.isRegenerating) ? 'NEEDS VALIDATION.' : 'NO AI INSIGHT YET.';
            const displayAnswerHTML = moment.answer ? formatAnswerForRetroDisplay(moment.answer) : defaultAnswerText;
            const answerContentHTML = moment.isProcessing || moment.isRegenerating ? processingHTML : displayAnswerHTML;
            const reviewIconClass = moment.userMarkedReviewed ? 'fa-check-circle' : 'fa-book-open';

            listItem.innerHTML = `
                <div class="moment-header">
                    <div class="moment-checkbox-container"><input type="checkbox" data-timestamp="${moment.timestamp}" ${moment.selectedForBatch ? 'checked' : ''}></div>
                    <div class="moment-text-container" data-timestamp="${moment.timestamp}">
                        <div class="moment-main-text">
                            <span class="moment-text">${moment.text}</span>
                            <span class="moment-timestamp">${new Date(moment.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} <span class="status-indicator ${statusClass}">${statusText}</span></span>
                        </div>
                        <i class="fas fa-caret-down expand-icon ${moment.isAnswerExpanded ? 'expanded' : ''}"></i>
                    </div>
                    <div class="moment-actions">
                        <button class="action-button review-button ${moment.userMarkedReviewed ? 'reviewed-true' : ''}" data-timestamp="${moment.timestamp}" title="${moment.userMarkedReviewed ? 'Mark Unreviewed' : 'Mark Reviewed'}">
                            <i class="fas ${reviewIconClass}"></i>
                        </button>
                    </div>
                </div>
                <div class="moment-answer-wrapper ${moment.isAnswerExpanded ? 'expanded' : ''}">
                    <div class="moment-answer-content" id="answer-content-${moment.timestamp}">${answerContentHTML}</div>
                    ${moment.answer && !moment.isProcessing && !moment.isRegenerating ? `
                        <div class="regenerate-answer-button-container">
                            <button class="regenerate-answer-button" data-timestamp="${moment.timestamp}" ${moment.hasBeenRegenerated ? 'disabled' : ''}>
                                <i class="fas fa-redo"></i> ${moment.hasBeenRegenerated ? "REGEN'D" : 'REGEN (1)'}
                            </button>
                        </div>` : ''}
                </div>`;
            momentsList.appendChild(listItem);

            if (moment.isProcessing || moment.isRegenerating) {
                const answerContentDiv = listItem.querySelector(`#answer-content-${moment.timestamp}`);
                if (answerContentDiv) {
                    const spinnerCharElement = answerContentDiv.querySelector('.spinner-char');
                    if (spinnerCharElement && !moment.spinnerInterval) {
                        let spinnerChars = ["|", "/", "-", "\\"]; let charIndex = 0;
                        moment.spinnerInterval = setInterval(() => { spinnerCharElement.textContent = spinnerChars[charIndex++ % spinnerChars.length]; }, 150);
                    }
                }
            } else if (moment.spinnerInterval) {
                clearInterval(moment.spinnerInterval);
                moment.spinnerInterval = null;
            }
         });
         // Attach event listeners after rendering all items
         document.querySelectorAll('.moment-checkbox-container input[type="checkbox"]').forEach(cb => cb.addEventListener('change', handleCheckboxChange));
         document.querySelectorAll('.moment-text-container').forEach(tc => tc.addEventListener('click', handleTextContainerClick));
         document.querySelectorAll('.review-button').forEach(btn => btn.addEventListener('click', handleReviewButtonClick));
         document.querySelectorAll('.regenerate-answer-button').forEach(btn => btn.addEventListener('click', handleRegenerateButtonClick));

         updateCountersAndPointsDisplay(); // Update counters after rendering
    }

    function renderArchivedKnowledge() {
        if (!archivedMomentsList || !noArchivedPlaceholder) return;
        archivedMomentsList.innerHTML = '';
        if (archivedKnowledge.length === 0) { noArchivedPlaceholder.style.display = 'block'; return; }
        noArchivedPlaceholder.style.display = 'none';

        archivedKnowledge.forEach((moment) => {
            const listItem = document.createElement('li');
            listItem.className = 'moment-card archived-moment-card';
            listItem.classList.add(`type-${moment.type}`);
            if (moment.type === 'statement' && moment.aiVerdict) { listItem.classList.add(`verdict-${moment.aiVerdict}`); }
            if (moment.isRevisedForDeepTest) { listItem.classList.add('archive-revised'); }

            let statusText = '', statusClass = 'status-pending';
            if (moment.type === 'question') { statusText = 'QSTN'; statusClass = 'status-question'; }
            else if (moment.type === 'statement') {
                if (moment.aiVerdict === 'correct') { statusText = 'OK'; statusClass = 'status-correct'; }
                else if (moment.aiVerdict === 'incorrect') { statusText = 'X'; statusClass = 'status-incorrect'; }
                else if (moment.aiVerdict === 'unclear') { statusText = '???'; statusClass = 'status-unclear'; }
                else { statusText = 'STMT'; }
            }

            const originalAnswerHTML = moment.answer ? formatAnswerForRetroDisplay(moment.answer) : 'Archived without answer data.';
            const deepDiveAnswerHTML = moment.deepDiveAnswer ? formatAnswerForRetroDisplay(moment.deepDiveAnswer) : '';
            const reviseIconClass = moment.isRevisedForDeepTest ? 'fa-check-square' : 'fa-book-reader';
            const canTakeDeepDiveTest = moment.isRevisedForDeepTest && moment.deepDiveAnswer;

            listItem.innerHTML = `
                <div class="moment-header">
                    <div class="moment-text-container" data-timestamp="${moment.timestamp}">
                        <div class="moment-main-text">
                            <span class="moment-text">${moment.text}</span>
                            <span class="moment-timestamp">ARCHIVED: ${new Date(moment.archivedTimestamp || moment.timestamp).toLocaleDateString()} <span class="status-indicator ${statusClass}">${statusText}</span></span>
                        </div>
                        <i class="fas fa-caret-down expand-icon ${moment.isAnswerExpanded ? 'expanded' : ''}"></i>
                    </div>
                    <div class="moment-actions">
                        <button class="action-button deep-dive-button" data-timestamp="${moment.timestamp}" title="Deepen Understanding"><i class="fas fa-brain"></i></button>
                        <button class="action-button archive-revise-button ${moment.isRevisedForDeepTest ? 'archive-revised-true' : ''}" data-timestamp="${moment.timestamp}" title="${moment.isRevisedForDeepTest ? 'Mark Unrevised' : 'Mark Revised for Deep Test'}"><i class="fas ${reviseIconClass}"></i></button>
                        <button class="action-button archive-deep-dive-test-button" data-timestamp="${moment.timestamp}" title="Take Deep Dive Test" ${!canTakeDeepDiveTest ? 'disabled' : ''}><i class="fas fa-vial"></i> Test</button>
                    </div>
                </div>
                <div class="moment-answer-wrapper ${moment.isAnswerExpanded ? 'expanded' : ''}">
                    <div class="moment-answer-content"><strong>Original Insight:</strong><br>${originalAnswerHTML}</div>
                    ${moment.deepDiveAnswer || moment.isDeepDiveProcessing ? `
                        <div class="deep-dive-answer-container">
                            <div class="moment-answer-content" id="deep-dive-answer-${moment.timestamp}">
                                ${moment.isDeepDiveProcessing ? '<span class="spinner-char"></span> DEEPENING...' : deepDiveAnswerHTML}
                            </div>
                        </div>` : ''}
                </div>`;
            archivedMomentsList.appendChild(listItem);

            // Event listeners for archived items
            listItem.querySelector('.moment-text-container').addEventListener('click', () => {
                const archivedMoment = archivedKnowledge.find(am => am.timestamp === moment.timestamp);
                if (archivedMoment) { archivedMoment.isAnswerExpanded = !archivedMoment.isAnswerExpanded; saveMoments(); renderArchivedKnowledge(); }
            });
            listItem.querySelector('.deep-dive-button').addEventListener('click', (e) => { e.stopPropagation(); handleDeepDiveClick(moment.timestamp); });
            listItem.querySelector('.archive-revise-button').addEventListener('click', (e) => { e.stopPropagation(); toggleArchiveRevisedStatus(moment.timestamp); });
            listItem.querySelector('.archive-deep-dive-test-button').addEventListener('click', (e) => { e.stopPropagation(); if (canTakeDeepDiveTest) startDeepDiveQuiz(moment); });
        });
        updateCountersAndPointsDisplay();
    }

    function renderDeeplyUnderstoodKnowledge() {
        if (!deepenedMomentsList || !noDeepenedPlaceholder) return;
        deepenedMomentsList.innerHTML = '';
        noDeepenedPlaceholder.style.display = deeplyUnderstoodKnowledge.length === 0 ? 'block' : 'none';

        deeplyUnderstoodKnowledge.forEach((moment) => {
            const listItem = document.createElement('li');
            listItem.className = 'moment-card deepened-moment-card';
            listItem.dataset.timestamp = moment.timestamp;

            const originalAnswerHTML = moment.answer ? formatAnswerForRetroDisplay(moment.answer) : '';
            const deepDiveAnswerHTML = moment.deepDiveAnswer ? formatAnswerForRetroDisplay(moment.deepDiveAnswer) : '';

            listItem.innerHTML = `
                <div class="moment-header">
                    <div class="moment-text-container" data-timestamp="${moment.timestamp}">
                         <div class="moment-main-text">
                            <span class="moment-text">${moment.text}</span>
                            <span class="moment-timestamp">MASTERED: ${new Date(moment.deeplyUnderstoodTimestamp || Date.now()).toLocaleDateString()}</span>
                        </div>
                        <i class="fas fa-caret-down expand-icon ${moment.isAnswerExpanded ? 'expanded' : ''}"></i>
                    </div>
                </div>
                <div class="moment-answer-wrapper ${moment.isAnswerExpanded ? 'expanded' : ''}">
                    ${moment.answer ? `<div class="moment-answer-content"><strong>Original Insight:</strong><br>${originalAnswerHTML}</div>` : ''}
                    ${moment.deepDiveAnswer ? `<div class="deep-dive-answer-container"><div class="moment-answer-content"><strong>Deep Dive:</strong><br>${deepDiveAnswerHTML}</div></div>` : ''}
                </div>`;
            deepenedMomentsList.appendChild(listItem);

            listItem.querySelector('.moment-text-container').addEventListener('click', () => {
                const deepMoment = deeplyUnderstoodKnowledge.find(dm => dm.timestamp === moment.timestamp);
                if (deepMoment) {
                    deepMoment.isAnswerExpanded = !deepMoment.isAnswerExpanded;
                    deepMoment.justClickedForCelebration = true; // Mark for celebration
                    saveMoments();
                    renderDeeplyUnderstoodKnowledge(); // Re-render to apply effects
                }
            });
        });

        // Post-render celebration effect
        deeplyUnderstoodKnowledge.forEach(moment => {
            if (moment.justClickedForCelebration) {
                const cardElement = deepenedMomentsList.querySelector(`.deepened-moment-card[data-timestamp="${moment.timestamp}"]`);
                if (cardElement) {
                    cardElement.classList.add('mastered-celebrate-pop');
                    const rect = cardElement.getBoundingClientRect();
                    const particleX = rect.left + rect.width / 2;
                    const particleY = rect.top + rect.height / 2;
                    triggerParticleBurst('masteredItem', particleX, particleY);
                    showToast("MASTERED! WELL DONE!", 1500);
                    setTimeout(() => { cardElement.classList.remove('mastered-celebrate-pop'); }, 500);
                }
                delete moment.justClickedForCelebration; // Clean up flag
            }
        });
        updateCountersAndPointsDisplay();
    }

    function handleCheckboxChange(event) { const ts = parseInt(event.target.dataset.timestamp); const mom = loggedMoments.find(m => m.timestamp === ts); if (mom) mom.selectedForBatch = event.target.checked; saveMoments(); updateCountersAndPointsDisplay(); }
    function handleTextContainerClick(event) { const ts = parseInt(event.currentTarget.dataset.timestamp); const mom = loggedMoments.find(m => m.timestamp === ts); if (mom && !mom.answer && !mom.isProcessing && !mom.isRegenerating) { const liEl = document.getElementById(`moment-item-${ts}`); fetchSingleAIAnswer(mom, liEl, true); } else { toggleAnswerExpansion(ts); } }
    function handleReviewButtonClick(event) { const ts = parseInt(event.currentTarget.dataset.timestamp); toggleUserReviewedStatus(ts); event.stopPropagation(); /* Prevent header click */ }
    function handleRegenerateButtonClick(event) { const ts = parseInt(event.currentTarget.dataset.timestamp); const mom = loggedMoments.find(m => m.timestamp === ts); const liEl = document.getElementById(`moment-item-${ts}`); if (mom && liEl && !mom.hasBeenRegenerated) { regenerateAIAnswer(mom, liEl); } event.stopPropagation(); }
    function toggleAnswerExpansion(timestamp) { const m = loggedMoments.find(mo => mo.timestamp === timestamp); if (m) { m.isAnswerExpanded = !m.isAnswerExpanded; saveMoments(); renderMoments(); } }

    function saveMoments() {
        // Clean up transient state properties before saving
        deeplyUnderstoodKnowledge.forEach(m => { if (Object.prototype.hasOwnProperty.call(m, 'justClickedForCelebration')) { delete m.justClickedForCelebration; }});
        loggedMoments.forEach(m => { if (Object.prototype.hasOwnProperty.call(m, 'newlyAdded')) { delete m.newlyAdded; }}); // No need to save newlyAdded

        localStorage.setItem('idk_moments' + localStorageKeySuffix, JSON.stringify(loggedMoments));
        localStorage.setItem('idk_archived_knowledge' + localStorageKeySuffix, JSON.stringify(archivedKnowledge));
        localStorage.setItem('idk_deeply_understood' + localStorageKeySuffix, JSON.stringify(deeplyUnderstoodKnowledge));
        localStorage.setItem('idk_user_points_val' + localStorageKeySuffix, userPoints.toString());
        localStorage.setItem('idk_user_stupid_points_val' + localStorageKeySuffix, userStupidPoints.toString());
        localStorage.setItem('idk_owned_themes' + localStorageKeySuffix, JSON.stringify(ownedThemes));
        localStorage.setItem('idk_current_theme' + localStorageKeySuffix, currentTheme); // Ensure current theme is saved
    }

    function toggleUserReviewedStatus(timestamp) { const m = loggedMoments.find(mo => mo.timestamp === timestamp); if (m) { m.userMarkedReviewed = !m.userMarkedReviewed; showToast(m.userMarkedReviewed ? "REVIEWED!" : "UNREVIEWED."); saveMoments(); renderMoments(); updateCountersAndPointsDisplay(); } }
    function toggleArchiveRevisedStatus(timestamp) { const moment = archivedKnowledge.find(m => m.timestamp === timestamp); if (moment) { moment.isRevisedForDeepTest = !moment.isRevisedForDeepTest; showToast(moment.isRevisedForDeepTest ? "REVISED FOR DEEPER TEST!" : "Marked Unrevised."); saveMoments(); renderArchivedKnowledge(); } }
    async function handleDeepDiveClick(timestamp) {
        const moment = archivedKnowledge.find(m => m.timestamp === timestamp);
        if (!moment || moment.isDeepDiveProcessing) return;
        moment.isDeepDiveProcessing = true; moment.isAnswerExpanded = true; renderArchivedKnowledge();
        try { const deepDiveText = await fetchAIAnswerLogic(null, false, false, null, true, moment); moment.deepDiveAnswer = deepDiveText; showToast("Knowledge Deepened!"); }
        catch (e) { console.error("Error fetching deep dive:", e); moment.deepDiveAnswer = `DEEP DIVE ERROR: ${e.message}`; }
        finally { moment.isDeepDiveProcessing = false; saveMoments(); renderArchivedKnowledge(); }
    }

    if (logButton && idkInput) {
        logButton.addEventListener('click', () => {
            const text = idkInput.value.trim();
            if (text) {
                const initialType = autoSetInitialType(text);
                loggedMoments.unshift({ text: text, timestamp: Date.now(), type: initialType, aiVerdict: null, userMarkedReviewed: false, answer: null, isAnswerExpanded: false, hasBeenRegenerated: false, selectedForBatch: false, isProcessing: false, isRegenerating: false, newlyAdded: true, spinnerInterval: null, deepDiveAnswer: null, isRevisedForDeepTest: false, isDeepDiveProcessing: false, isDeeplyUnderstood: false });
                idkInput.value = ''; showToast("MOMENT LOGGED!");
                saveMoments(); renderMoments(); renderArchivedKnowledge(); renderDeeplyUnderstoodKnowledge(); // Re-render all relevant lists
            } else { showToast("INPUT TEXT REQUIRED."); }
        });
    }

    if (selectAllButton) {
        selectAllButton.addEventListener('click', () => {
            if (loggedMoments.length === 0) { showToast("NO MOMENTS TO SELECT."); return; }
            const allSelected = loggedMoments.every(m => m.selectedForBatch);
            const targetState = !allSelected;
            loggedMoments.forEach(m => m.selectedForBatch = targetState);
            saveMoments(); renderMoments();
        });
    }

    // --- AI Prompts ---
    const AI_MCQ_PROMPT_SYSTEM = `You are a quiz question generator. Based on the user's original logged text and an AI explanation, create a single, concise question to test comprehension of this information. Then provide ONE correct answer, ONE plausible but incorrect distractor, AND ONE silly, obviously wrong, or humorous "dumb answer" distractor. Format your entire response *strictly* as:\nQ: [Your Question Here]\nC: [The Correct Answer Here]\nD1: [Plausible Distractor 1 Here]\nDUMB: [The Silly/Dumb Distractor Here]\nDo not add any other text or conversational pleasantries.`;
    const AI_DEEPEN_UNDERSTANDING_PROMPT_SYSTEM = `The user previously logged: "[USER_LOG_TEXT]" and received this explanation: "[ORIGINAL_AI_ANSWER]". They now want to deepen their understanding. Provide a concise explanation that includes 3 new distinct pieces of information, facts, or related concepts that expand on the original topic. Keep the retro interface style and output in plain text.`;
    const AI_DEEP_DIVE_MCQ_PROMPT_SYSTEM = `You are an advanced quiz question generator. The user has received an initial explanation and a "deep dive" explanation for a topic.
Original Log: "[USER_LOG_TEXT]"
Initial Explanation: "[ORIGINAL_AI_ANSWER]"
Deep Dive Explanation: "[DEEP_DIVE_AI_ANSWER]"
Your task is to generate a challenging multiple-choice question based *primarily* on a *specific new piece of information* from the "Deep Dive Explanation". The target new information is the [TARGET_INFO_FOCUS] new detail/fact mentioned in the Deep Dive Explanation.
Provide ONE correct answer and TWO plausible but incorrect distractor answers. Format your entire response *strictly* as:\nQ: [Your Challenging Question Here, focused on the [TARGET_INFO_FOCUS] new detail from the Deep Dive Explanation]\nC: [The Correct Answer Here]\nD1: [Plausible Distractor 1 Here]\nD2: [Plausible Distractor 2 Here]\nDo not add any other text or conversational pleasantries.`;
    const AI_STATEMENT_SYSTEM_PROMPT = `You are a factual validation assistant for statements related to general knowledge, science, history, and technology. If a statement is verifiably true, prefix your explanation with [CORRECT]. If it's verifiably false, prefix with [INCORRECT]. If its truth is debatable, nuanced, subjective, or requires significant context not provided, prefix with [UNCLEAR]. After the prefix, provide a very brief, direct explanation (1-2 sentences) in a retro computer interface style. Example: "[CORRECT] The Earth is an oblate spheroid." or "[INCORRECT] The sun revolves around the Earth. The Earth revolves around the sun." or "[UNCLEAR] Pineapple on pizza is delicious. This is a matter of subjective taste." Output in plain text suitable for a retro computer interface.`;
    const AI_REGENERATE_SYSTEM_PROMPT = `You are a helpful assistant. The user wants a new or rephrased answer to their previous query. Provide a concise, clear, and slightly different explanation or answer than what might have been given before. Keep the tone suitable for a retro computer interface. Output in plain text.`;

    async function fetchAIAnswerLogic(moment, isRegeneration = false, isQuizQuestionGen = false, quizMomentContext = null, isDeepDiveGen = false, deepDiveContext = null, isDeepDiveMCQGen = false, deepDiveQuestionNumber = 1) {
        const apiKeyToUse = userProvidedApiKey;
        if (!apiKeyToUse) { showToast("NO API KEY SET. PLEASE ENTER ONE.", 3000); console.error('OpenAI API Key is missing!'); throw new Error('OpenAI API Key is missing!');}
        let systemPrompt = "You are a helpful assistant. Your output should be suitable for a retro computer interface.";
        let userQuery = ""; let modelToUse = 'gpt-3.5-turbo'; let maxTokens = 200; const focusHints = ["first", "second", "third"];
        if (isDeepDiveMCQGen && deepDiveContext) { let targetInfoFocus = focusHints[deepDiveQuestionNumber - 1] || "a distinct"; systemPrompt = AI_DEEP_DIVE_MCQ_PROMPT_SYSTEM.replace("[USER_LOG_TEXT]", deepDiveContext.text || '').replace("[ORIGINAL_AI_ANSWER]", deepDiveContext.answer || '').replace("[DEEP_DIVE_AI_ANSWER]", deepDiveContext.deepDiveAnswer || '').replace(/\[TARGET_INFO_FOCUS\]/g, targetInfoFocus); userQuery = `Generate challenging MCQ question #${deepDiveQuestionNumber} for this topic, focusing on the ${targetInfoFocus} new aspect.`; maxTokens = 180;
        } else if (isDeepDiveGen && deepDiveContext) { systemPrompt = AI_DEEPEN_UNDERSTANDING_PROMPT_SYSTEM.replace("[USER_LOG_TEXT]", deepDiveContext.text).replace("[ORIGINAL_AI_ANSWER]", deepDiveContext.answer || "(N/A)"); userQuery = "Provide deeper explanation."; maxTokens = 250;
        } else if (isQuizQuestionGen && quizMomentContext) { systemPrompt = AI_MCQ_PROMPT_SYSTEM; userQuery = `User's log: "${quizMomentContext.text}"\nAI's explanation: "${quizMomentContext.answer || '(N/A)'}"\nGenerate MCQ.`; maxTokens = 160;
        } else if (moment) { if (isRegeneration) { systemPrompt = AI_REGENERATE_SYSTEM_PROMPT; userQuery = `Original: "${moment.text}"`;} else if (moment.type === 'question') { userQuery = `Explain: "${moment.text}"`;} else if (moment.type === 'statement') { systemPrompt = AI_STATEMENT_SYSTEM_PROMPT; userQuery = `Validate: "${moment.text}"`;} else { userQuery = moment.text;}
        } else { throw new Error("Invalid parameters for AI logic."); }
        const requestBodyToOpenAI = {model: modelToUse, messages: [{ "role": "system", "content": systemPrompt }, { "role": "user", "content": userQuery }], max_tokens: maxTokens, temperature: isQuizQuestionGen || isDeepDiveMCQGen ? 0.75 : (isRegeneration ? 0.6 : (isDeepDiveGen ? 0.5 : 0.4))};
        const response = await fetch('https://api.openai.com/v1/chat/completions', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKeyToUse}`}, body: JSON.stringify(requestBodyToOpenAI)});
        if (!response.ok) { const eD = await response.json().catch(() => ({error: {message: "Unknown API error"}})); console.error("OpenAI API Error:", eD); throw new Error(`API Error (${response.status}): ${eD.error?.message || 'Unknown'}`);}
        const data = await response.json(); let rawAnswerText = data.choices[0]?.message?.content.trim() || "NO RESPONSE.";
        if (moment && !isQuizQuestionGen && !isDeepDiveGen && !isDeepDiveMCQGen && moment.type === 'statement' && !isRegeneration) { if (rawAnswerText.startsWith('[CORRECT]')) { moment.aiVerdict = 'correct'; rawAnswerText = rawAnswerText.substring(9).trim(); } else if (rawAnswerText.startsWith('[INCORRECT]')) { moment.aiVerdict = 'incorrect'; rawAnswerText = rawAnswerText.substring(11).trim(); } else if (rawAnswerText.startsWith('[UNCLEAR]')) { moment.aiVerdict = 'unclear'; rawAnswerText = rawAnswerText.substring(9).trim(); } else { moment.aiVerdict = 'unclear'; }}
        return rawAnswerText;
    }
    async function fetchSingleAIAnswer(moment, listItemElement, expandAfterFetch = false) { if (moment.isProcessing || moment.isRegenerating) return; moment.isProcessing = true; if (expandAfterFetch) moment.isAnswerExpanded = false; renderMoments(); try { const aT = await fetchAIAnswerLogic(moment); moment.answer = aT; if (expandAfterFetch) moment.isAnswerExpanded = true; } catch (e) { moment.answer = `ERROR: ${e.message}`; if (expandAfterFetch) moment.isAnswerExpanded = true;  } finally { moment.isProcessing = false; saveMoments(); renderMoments();}}
    async function regenerateAIAnswer(moment, listItemElement) { if (moment.hasBeenRegenerated || moment.isProcessing || moment.isRegenerating) return; moment.isRegenerating = true; moment.isAnswerExpanded = true; renderMoments(); try { const aT = await fetchAIAnswerLogic(moment, true); moment.answer = aT; moment.hasBeenRegenerated = true; showToast("RESPONSE REGENERATED!"); } catch (e) { moment.answer = `REGEN ERROR: ${e.message}`; } finally { moment.isRegenerating = false; saveMoments(); renderMoments();}}
    if (processSelectedButton) {
        processSelectedButton.addEventListener('click', async () => {
            const itemsToProcess = loggedMoments.filter(m => m.selectedForBatch && !m.isProcessing && !m.isRegenerating);
            if (itemsToProcess.length === 0) { showToast("NO ITEMS SELECTED FOR BATCH PROCESSING."); return; }
            if (overallLoadingIndicator) { overallLoadingIndicator.textContent = `PROCESSING 0/${itemsToProcess.length}...`; overallLoadingIndicator.style.display = 'block'; }
            processSelectedButton.disabled = true; let processedCount = 0;
            for (const moment of itemsToProcess) {
                moment.isProcessing = true; renderMoments(); // Re-render to show individual spinner
                try { const answerText = await fetchAIAnswerLogic(moment); moment.answer = answerText; moment.isAnswerExpanded = true; }
                catch (e) { moment.answer = `ERROR: ${e.message}`; moment.isAnswerExpanded = true; }
                finally { moment.isProcessing = false; moment.selectedForBatch = false; processedCount++; if (overallLoadingIndicator) overallLoadingIndicator.textContent = `PROCESSING ${processedCount}/${itemsToProcess.length}...`; saveMoments(); renderMoments(); }
            }
            if (overallLoadingIndicator) overallLoadingIndicator.textContent = `BATCH COMPLETE! ${processedCount} ITEMS.`;
            showToast(`BATCH OK: ${processedCount} PROCESSED!`);
            setTimeout(() => { if (overallLoadingIndicator) overallLoadingIndicator.style.display = 'none'; }, 3000);
            processSelectedButton.disabled = false; updateCountersAndPointsDisplay();
        });
    }

    // --- Quiz Logic ---
    function startDeepDiveQuiz(archivedMoment) {
        if (!archivedMoment || !archivedMoment.isRevisedForDeepTest || !archivedMoment.deepDiveAnswer) {
            console.error("Cannot start deep dive quiz for this item. Conditions not met.", archivedMoment);
            showToast("ERROR: Deep dive test prerequisites not met."); return;
        }
        startQuiz(true, archivedMoment);
    }
    async function startQuiz(isForArchivedItem = false, specificArchivedMoment = null) {
        isDeepDiveQuiz = isForArchivedItem; currentDeepDiveQuizMoment = isForArchivedItem ? specificArchivedMoment : null;
        const itemsForQuizSource = isForArchivedItem ? [specificArchivedMoment] : loggedMoments.filter(m => m.userMarkedReviewed && m.answer);
        if (itemsForQuizSource.length === 0 || (isForArchivedItem && !specificArchivedMoment)) { showToast(isForArchivedItem ? "Error starting deep dive test." : "NO REVIEWED ITEMS WITH ANSWERS TO TEST!"); return; }
        currentQuizQuestionsData = [];
        const prepButton = isForArchivedItem && specificArchivedMoment ? document.querySelector(`.archive-deep-dive-test-button[data-timestamp="${specificArchivedMoment.timestamp}"]`) : testKnowledgeButton;
        if (prepButton) { prepButton.disabled = true; prepButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>'; }

        if (isForArchivedItem && specificArchivedMoment) {
            for (let i = 0; i < 3; i++) { // Generate 3 deep dive questions
                try { const mcqText = await fetchAIAnswerLogic(null, false, false, null, false, specificArchivedMoment, true, i + 1); const qMatch = mcqText.match(/Q:\s*([\s\S]*?)\nC:/i); const cMatch = mcqText.match(/C:\s*([\s\S]*?)\nD1:/i); const d1Match = mcqText.match(/D1:\s*([\s\S]*?)\nD2:/i); const d2Match = mcqText.match(/D2:\s*([\s\S]*?)$/i); if (qMatch && cMatch && d1Match && d2Match) { let opts = [cMatch[1].trim(), d1Match[1].trim(), d2Match[1].trim()]; opts.sort(() => 0.5 - Math.random()); currentQuizQuestionsData.push({ question: qMatch[1].trim(), options: opts, correctAnswerText: cMatch[1].trim(), originalMomentTimestamp: specificArchivedMoment.timestamp, isDumb: false }); } else { console.warn(`Deep Dive MCQ PARSE FAIL (Q${i+1}):`, mcqText); } } catch (e) { console.error(`Error gen deep dive MCQ (Q${i+1}):`, e); }
            }
        } else {
            const shuffled = itemsForQuizSource.sort(() => 0.5 - Math.random());
            const itemsForThisQuiz = shuffled.slice(0, Math.min(itemsForQuizSource.length, 3)); // Max 3 questions
            for (const item of itemsForThisQuiz) {
                try { const mcqText = await fetchAIAnswerLogic(null, false, true, item); const qMatch = mcqText.match(/Q:\s*([\s\S]*?)\nC:/i); const cMatch = mcqText.match(/C:\s*([\s\S]*?)\nD1:/i); const d1Match = mcqText.match(/D1:\s*([\s\S]*?)\nDUMB:/i); const dumbMatch = mcqText.match(/DUMB:\s*([\s\S]*?)$/i); if (qMatch && cMatch && d1Match && dumbMatch) { let options = [cMatch[1].trim(), d1Match[1].trim(), dumbMatch[1].trim()]; let dumbAnswerText = dumbMatch[1].trim(); options.sort(() => 0.5 - Math.random()); currentQuizQuestionsData.push({ question: qMatch[1].trim(), options, correctAnswerText: cMatch[1].trim(), originalMomentTimestamp: item.timestamp, dumbAnswerText: dumbAnswerText }); } else { console.warn("Regular MCQ PARSE FAIL (DUMB):", mcqText); } } catch (e) { console.error("Error gen quiz MCQ:", e); }
            }
        }
        currentQuizQuestionsData = currentQuizQuestionsData.filter(q => q && q.question && q.options && q.correctAnswerText); // Filter out any null/malformed questions
        if (prepButton) { prepButton.disabled = false; prepButton.innerHTML = isForArchivedItem ? '<i class="fas fa-vial"></i> Test' : 'Test Knowledge!';}
        if (currentQuizQuestionsData.length > 0) { currentQuizQuestionIndex = 0; currentQuizCorrectAnswersCount = 0; if(quizModalTitle) quizModalTitle.textContent = isForArchivedItem && specificArchivedMoment ? `DEEP DIVE: ${specificArchivedMoment.text.substring(0,20)}...` : "KNOWLEDGE TEST!"; displayMCQQuestion(); if(quizModalOverlay) quizModalOverlay.classList.add('show'); if(closeQuizButton) closeQuizButton.style.display = 'none'; if(finishQuizButton) finishQuizButton.style.display = 'none'; } else { showToast("COULDN'T PREPARE QUIZ QUESTIONS. TRY AGAIN."); }
    }
    if(testKnowledgeButton) testKnowledgeButton.addEventListener('click', () => startQuiz(false, null));

    function displayMCQQuestion() { if(!quizModalOverlay) return; if (currentQuizQuestionIndex < currentQuizQuestionsData.length) { const qD = currentQuizQuestionsData[currentQuizQuestionIndex]; if(quizQuestionNumber) quizQuestionNumber.textContent = `QUESTION ${currentQuizQuestionIndex + 1} OF ${currentQuizQuestionsData.length}`; if(quizQuestionText) quizQuestionText.textContent = qD.question; if(quizOptionsContainer) quizOptionsContainer.innerHTML = ''; qD.options.forEach(oT => { const oD = document.createElement('div'); oD.classList.add('quiz-option'); oD.textContent = oT; oD.addEventListener('click', () => selectQuizOption(oD, oT)); if(quizOptionsContainer) quizOptionsContainer.appendChild(oD); }); if(quizFeedbackArea) {quizFeedbackArea.textContent = 'CHOOSE AN OPTION.'; quizFeedbackArea.className = 'quiz-feedback-area';} if(submitQuizAnswerButton) {submitQuizAnswerButton.style.display = 'inline-block'; submitQuizAnswerButton.disabled = true;} if(nextQuizQuestionButton) nextQuizQuestionButton.style.display = 'none'; if(finishQuizButton) finishQuizButton.style.display = 'none'; selectedQuizOptionElement = null; } else { finishMCQQuiz(); }}
    function selectQuizOption(optionDiv, optionText) { if (submitQuizAnswerButton && submitQuizAnswerButton.style.display === 'none') return; if (selectedQuizOptionElement) { selectedQuizOptionElement.classList.remove('selected'); } optionDiv.classList.add('selected'); selectedQuizOptionElement = optionDiv; if(submitQuizAnswerButton) submitQuizAnswerButton.disabled = false; }
    if(submitQuizAnswerButton) submitQuizAnswerButton.addEventListener('click', () => {
        if (!selectedQuizOptionElement) return; const userAnswerText = selectedQuizOptionElement.textContent; const qData = currentQuizQuestionsData[currentQuizQuestionIndex]; const isCorrect = userAnswerText === qData.correctAnswerText; const isDumbSelection = !isDeepDiveQuiz && qData.dumbAnswerText && userAnswerText === qData.dumbAnswerText; const pointsForThisQuestion = isDeepDiveQuiz ? 3 : 2;
        if (isDumbSelection) { userStupidPoints++; if(quizFeedbackArea) {quizFeedbackArea.textContent = "FOOL. +1 STUPID POINT! 👎"; quizFeedbackArea.className = 'quiz-feedback-area incorrect';} selectedQuizOptionElement.classList.add('incorrect'); showToast("OH DEAR... +1 STUPID POINT!"); triggerParticleBurst('dumbAnswer'); if(quizOptionsContainer) quizOptionsContainer.querySelectorAll('.quiz-option').forEach(opt => { if (opt.textContent === qData.correctAnswerText) { opt.classList.add('correct'); }});
        } else if (isCorrect) { if(quizFeedbackArea) {quizFeedbackArea.textContent = `CORRECT! +${pointsForThisQuestion} PTS!`; quizFeedbackArea.className = 'quiz-feedback-area correct';} selectedQuizOptionElement.classList.add('correct'); currentQuizCorrectAnswersCount++; userPoints += pointsForThisQuestion; triggerPointsFlash(); triggerParticleBurst('correctAnswer'); showToast(`CORRECT! +${pointsForThisQuestion} PTS!`);
            if (!isDeepDiveQuiz) { const momentToArchiveIndex = loggedMoments.findIndex(m => m.timestamp === qData.originalMomentTimestamp); if (momentToArchiveIndex > -1) { const momentToArchive = loggedMoments.splice(momentToArchiveIndex, 1)[0]; const cardElement = document.getElementById(`moment-item-${qData.originalMomentTimestamp}`); if(cardElement) cardElement.classList.add('archiving'); setTimeout(() => { momentToArchive.isArchived = true; momentToArchive.archivedTimestamp = Date.now(); momentToArchive.isAnswerExpanded = false; archivedKnowledge.unshift(momentToArchive); saveMoments(); renderMoments(); renderArchivedKnowledge(); renderDeeplyUnderstoodKnowledge(); }, 500);} else { saveMoments(); updateCountersAndPointsDisplay(); }
            } else { saveMoments(); updateCountersAndPointsDisplay(); }
        } else { if(quizFeedbackArea) {quizFeedbackArea.textContent = `INCORRECT. Correct was: ${qData.correctAnswerText}`; quizFeedbackArea.className = 'quiz-feedback-area incorrect';} selectedQuizOptionElement.classList.add('incorrect'); if(quizOptionsContainer) quizOptionsContainer.querySelectorAll('.quiz-option').forEach(opt => { if (opt.textContent === qData.correctAnswerText) { opt.classList.add('correct'); }}); }
        if(quizOptionsContainer) quizOptionsContainer.querySelectorAll('.quiz-option').forEach(opt => { opt.style.pointerEvents = 'none'; }); if(submitQuizAnswerButton) submitQuizAnswerButton.style.display = 'none';
        if (currentQuizQuestionIndex < currentQuizQuestionsData.length - 1) { if(nextQuizQuestionButton) nextQuizQuestionButton.style.display = 'inline-block'; } else { if(finishQuizButton) finishQuizButton.style.display = 'inline-block'; }
    });
    if(nextQuizQuestionButton) nextQuizQuestionButton.addEventListener('click', () => { currentQuizQuestionIndex++; displayMCQQuestion(); });
    if(finishQuizButton) finishQuizButton.addEventListener('click', finishMCQQuiz);
    if(closeQuizButton) closeQuizButton.addEventListener('click', () => { if(quizModalOverlay) quizModalOverlay.classList.remove('show'); });
    function finishMCQQuiz() {
        let quizResultText = `QUIZ FINISHED! YOU GOT ${currentQuizCorrectAnswersCount} OF ${currentQuizQuestionsData.length} CORRECT.`; const perfectScoreBonus = isDeepDiveQuiz ? 7 : 5; let earnedPerfectBonus = false;
        if (currentQuizQuestionsData.length > 0 && currentQuizCorrectAnswersCount === currentQuizQuestionsData.length) { userPoints += perfectScoreBonus; earnedPerfectBonus = true; triggerPointsFlash(); triggerParticleBurst('perfectQuiz'); quizResultText += `\nPERFECT SCORE! +${perfectScoreBonus} <i class="fas fa-coins points-icon"></i> BONUS!`;
            if (isDeepDiveQuiz && currentDeepDiveQuizMoment) { const momentToMasterIndex = archivedKnowledge.findIndex(m => m.timestamp === currentDeepDiveQuizMoment.timestamp); if (momentToMasterIndex > -1) { const momentToMaster = archivedKnowledge.splice(momentToMasterIndex, 1)[0]; momentToMaster.isDeeplyUnderstood = true; momentToMaster.deeplyUnderstoodTimestamp = Date.now(); momentToMaster.isAnswerExpanded = false; deeplyUnderstoodKnowledge.unshift(momentToMaster); showToast(`"${momentToMaster.text.substring(0,20)}..." FULLY MASTERED & MOVED!`);}}}
        saveMoments(); renderMoments(); renderArchivedKnowledge(); renderDeeplyUnderstoodKnowledge();
        if(quizFeedbackArea) quizFeedbackArea.innerHTML = quizResultText.replace(/\n/g, '<br>');
        showToast(earnedPerfectBonus ? `PERFECT QUIZ! +${perfectScoreBonus} BONUS PTS!` : `QUIZ DONE. ${currentQuizCorrectAnswersCount}/${currentQuizQuestionsData.length}.`);
        if(submitQuizAnswerButton) submitQuizAnswerButton.style.display = 'none'; if(nextQuizQuestionButton) nextQuizQuestionButton.style.display = 'none'; if(finishQuizButton) finishQuizButton.style.display = 'none'; if(closeQuizButton) closeQuizButton.style.display = 'inline-block';
        currentDeepDiveQuizMoment = null; // Reset after quiz finishes
    }

    // --- Accordion Listeners ---
    if (archiveHeader && archivedItemsListContainer && archiveToggleIcon) {
        archiveHeader.addEventListener('click', () => {
            archivedItemsListContainer.classList.toggle('expanded');
            archiveToggleIcon.classList.toggle('expanded');
        });
    }
    if (deepenedHeader && deepenedItemsListContainer && deepenedToggleIcon) {
        deepenedHeader.addEventListener('click', () => {
            deepenedItemsListContainer.classList.toggle('expanded');
            deepenedToggleIcon.classList.toggle('expanded');
        });
    }

    // --- Initial Page Load Setup ---
    applyThemeOnIndex(currentTheme);
    renderMoments();
    renderArchivedKnowledge();
    renderDeeplyUnderstoodKnowledge();
    updateCountersAndPointsDisplay(); // Call this once after initial renders
    if (shopUserPointsDisplay) shopUserPointsDisplay.textContent = userPoints; // Ensure shop toolbar points are also set
});

