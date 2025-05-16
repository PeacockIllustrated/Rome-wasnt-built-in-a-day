// districts/emporium/shop-script.js

document.addEventListener('DOMContentLoaded', () => {
    let currentUserPoints = 0;
    let activeThemeId = "default_rome";
    let allThemesData = [];

    function initializeShop() {
        if (typeof ThemeManager !== 'undefined') {
            // Apply the currently active theme to the Emporium page itself
            ThemeManager.applyTheme(ThemeManager.getCurrentThemeId());
        } else {
            console.warn("ThemeManager not found during shop initialization.");
        }
        loadInitialData(); // Load points, theme data, and statuses
        renderThemeShop();
        addEventListeners();

        // The dynamic style injection for .currency-icon-small.pts-icon
        // is good here or can be moved to _emporium.css if --pts-icon-url is reliably set.
        // Let's keep it in CSS for better separation. It's already in _emporium.css.
    }


    function loadInitialData() {
        if (typeof DataManager !== 'undefined') {
            currentUserPoints = DataManager.getUserPoints();
        } else {
            console.warn("DataManager not found. Simulating points.");
            currentUserPoints = 500;
        }

        if (typeof ThemeManager !== 'undefined') {
            allThemesData = ThemeManager.getAllThemes();
            activeThemeId = ThemeManager.getCurrentThemeId(); // Get current active theme
            const ownedThemeIds = ThemeManager.getOwnedThemeIds(); // Get all owned themes

            allThemesData.forEach(theme => {
                theme.isOwned = ownedThemeIds.includes(theme.id);
                theme.isActive = (theme.id === activeThemeId);
            });
        } else {
            console.warn("ThemeManager not found. Simulating themes.");
            allThemesData = [
                { id: "default_rome", name: "Imperial Standard", description: "Classic Rome.", cost: 0, previewImage: "../../assets/images/theme-previews/default_rome_preview.png", previewColors: ["#A0522D", "#D2B48C", "#FFFFFF", "#800000"], isOwned: true, isActive: true },
                { id: "colosseum_sand", name: "Colosseum Sand", description: "Earthy arena tones.", cost: 100, previewImage: "../../assets/images/theme-previews/colosseum_sand_preview.png", previewColors: ["#DEB887", "#F0E68C", "#3E2723", "#BF360C"], isOwned: false, isActive: false },
            ];
            activeThemeId = "default_rome";
        }
    }

    function renderThemeShop() {
        const themeGrid = document.getElementById('emporiumThemeGrid');
        const userCurrencyDisplay = document.getElementById('emporiumUserCurrency');

        if (userCurrencyDisplay) userCurrencyDisplay.textContent = currentUserPoints;
        else console.error("#emporiumUserCurrency not found!");
        if (!themeGrid) { console.error("#emporiumThemeGrid not found!"); return; }
        
        themeGrid.innerHTML = ''; // Clear existing content before re-rendering

        // Crucial: Re-fetch active and owned status from ThemeManager before each render
        if (typeof ThemeManager !== 'undefined') {
            activeThemeId = ThemeManager.getCurrentThemeId();
            const ownedThemeIds = ThemeManager.getOwnedThemeIds();
            allThemesData.forEach(theme => { // Update the status on our local copy
                theme.isOwned = ownedThemeIds.includes(theme.id);
                theme.isActive = (theme.id === activeThemeId);
            });
        }


        if (allThemesData.length === 0) {
            themeGrid.innerHTML = '<p>No themes available in the Scriptorium at this moment.</p>';
            return;
        }

        allThemesData.forEach(theme => {
            const canAfford = currentUserPoints >= theme.cost;
            const scrollElement = document.createElement('div');
            scrollElement.className = 'emporium-theme-scroll';
            scrollElement.dataset.themeId = theme.id;
            scrollElement.tabIndex = 0;

            let unlockButtonHtml = '';
            if (!theme.isOwned && theme.cost > 0) { // Only show unlock if not owned AND has a cost
                unlockButtonHtml = `<button class="btn btn-primary btn-unlock-theme" data-theme-id="${theme.id}" data-cost="${theme.cost}" ${!canAfford ? 'disabled title="Insufficient Points"' : ''}>Unlock ${theme.cost}pts ${!canAfford ? '(Low)' : ''}</button>`;
            } else if (!theme.isOwned && theme.cost === 0) { // For free themes that are not default_rome
                 unlockButtonHtml = `<button class="btn btn-primary btn-unlock-theme" data-theme-id="${theme.id}" data-cost="0">Acquire</button>`;
            }


            let applyButtonHtml = (theme.isOwned && !theme.isActive) ? `<button class="btn btn-secondary btn-apply-theme" data-theme-id="${theme.id}">Apply</button>` : '';

            scrollElement.innerHTML = `
                <div class="scroll-header">
                    <h3 class="emporium-theme-name">${theme.name}</h3>
                    <div class="emporium-theme-preview-swatches">
                        ${(theme.previewColors || []).map(color => `<span class="swatch" style="background-color: ${color};"></span>`).join('')}
                    </div>
                </div>
                <div class="scroll-content">
                    <div class="emporium-theme-preview-image-container">
                        <img src="${theme.previewImage}" alt="Preview of ${theme.name}" class="emporium-theme-preview-image"
                             onerror="this.style.display='none'; if(!this.parentElement.querySelector('.preview-unavailable')) { const p=document.createElement('p'); p.className='preview-unavailable'; p.textContent='Preview N/A'; this.parentElement.appendChild(p); } console.error('Failed to load image: ${theme.previewImage} for theme ${theme.id}');">
                    </div>
                    <p class="emporium-theme-description">${theme.description}</p>
                    <div class="emporium-theme-meta">
                        <div class="emporium-theme-status">
                            <span class="emporium-theme-cost" style="display: ${theme.isOwned || theme.cost === 0 ? 'none' : 'inline'};">
                                Cost: ${theme.cost} <span class="currency-icon-small pts-icon" title="Points"></span>
                            </span>
                            <span class="emporium-theme-owned-badge" style="display: ${theme.isOwned ? 'inline-block' : 'none'};">Owned</span>
                            <span class="emporium-theme-active-badge" style="display: ${theme.isActive ? 'inline-block' : 'none'};">Active</span>
                        </div>
                        <div class="emporium-theme-actions">
                            ${unlockButtonHtml}
                            ${applyButtonHtml}
                        </div>
                    </div>
                </div>
            `;
            themeGrid.appendChild(scrollElement);
        });
    }

    function addEventListeners() {
        const themeGrid = document.getElementById('emporiumThemeGrid');
        if (themeGrid) {
            themeGrid.addEventListener('click', handleScrollClick);
            themeGrid.addEventListener('keydown', (event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                    if (event.target.classList.contains('emporium-theme-scroll')) {
                        event.preventDefault();
                        toggleScroll(event.target);
                    }
                }
            });
            themeGrid.addEventListener('click', handleThemeActionClick);
        }

        document.querySelectorAll('#emporiumShopFilters .filter-btn')
            .forEach(button => button.addEventListener('click', handleFilterClick));
    }

    function handleScrollClick(event) {
        const scrollElement = event.target.closest('.emporium-theme-scroll');
        if (scrollElement && !event.target.closest('button')) {
            toggleScroll(scrollElement);
        }
    }

    function toggleScroll(scrollElement) {
        document.querySelectorAll('.emporium-theme-scroll.open').forEach(openScroll => {
            if (openScroll !== scrollElement) {
                openScroll.classList.remove('open');
            }
        });
        scrollElement.classList.toggle('open');
    }

    function handleThemeActionClick(event) {
        const button = event.target.closest('button');
        if (!button) return;
        const themeId = button.dataset.themeId;
        if (!themeId) return;

        event.stopPropagation();

        if (button.classList.contains('btn-unlock-theme')) {
            unlockThemeAction(themeId, parseInt(button.dataset.cost, 10));
        } else if (button.classList.contains('btn-apply-theme')) {
            applyThemeAction(themeId);
        }
    }

    function handleFilterClick(event) {
        document.querySelectorAll('#emporiumShopFilters .filter-btn').forEach(btn => btn.classList.remove('active'));
        event.currentTarget.classList.add('active');
        filterThemesDisplay(event.currentTarget.dataset.filter);
    }

    function unlockThemeAction(themeId, cost) {
        if (typeof DataManager === 'undefined' || typeof ThemeManager === 'undefined') {
            console.error("Unlock Error: DataManager or ThemeManager not available.");
            SharedUtils.showToast("Error: Cannot connect to Scriptorium records.", 3000, 'error');
            return;
        }
        
        const themeToUnlock = ThemeManager.getThemeById(themeId);
        if (!themeToUnlock) {
            SharedUtils.showToast("Error: Theme data not found.", 3000, 'error');
            return;
        }
        // Ensure cost is from the definitive theme object, not just button dataset
        const actualCost = themeToUnlock.cost; 


        if (currentUserPoints >= actualCost) {
            DataManager.setUserPoints(currentUserPoints - actualCost);
            currentUserPoints -= actualCost;

            if (ThemeManager.addOwnedThemeId(themeId)) {
                SharedUtils.showToast(`Scroll of "${themeToUnlock.name}" acquired!`, 2500, 'success');
                // No need to manually update allThemesData.isOwned, renderThemeShop will re-fetch.
            } else {
                // Revert points if adding owned theme failed (e.g. already owned, though UI should prevent)
                DataManager.setUserPoints(currentUserPoints + actualCost);
                currentUserPoints += actualCost;
                SharedUtils.showToast("Failed to record theme ownership or already owned.", 3000, 'error');
            }
            renderThemeShop(); // Re-render to update button states and currency
        } else {
            SharedUtils.showToast("Not enough points for this scroll.", 2500, 'warning');
        }
    }

    function applyThemeAction(themeId) {
        if (typeof ThemeManager === 'undefined') {
            console.error("Apply Error: ThemeManager not available.");
            SharedUtils.showToast("Error: Scribe is unavailable to apply style.", 3000, 'error');
            return;
        }
        
        const themeToApply = ThemeManager.getThemeById(themeId);
        if (!themeToApply) {
             SharedUtils.showToast("Error: Theme data not found for applying.", 3000, 'error');
            return;
        }

        if (ThemeManager.setCurrentThemeId(themeId)) { // This also calls applyTheme internally
            // activeThemeId will be updated on next renderThemeShop call
            SharedUtils.showToast(`Style of "${themeToApply.name}" now active!`, 2500, 'success');
        } else {
            SharedUtils.showToast("Failed to apply style.", 3000, 'error');
        }
        renderThemeShop(); // Re-render to update active status and button states
    }

    function filterThemesDisplay(filterType) {
        // Re-fetch current statuses before filtering
        const currentActiveThemeId = ThemeManager.getCurrentThemeId();
        const ownedThemeIds = ThemeManager.getOwnedThemeIds();

        document.querySelectorAll('#emporiumThemeGrid .emporium-theme-scroll').forEach(scroll => {
            const themeId = scroll.dataset.themeId;
            const themeIsOwned = ownedThemeIds.includes(themeId);
            const themeCost = parseInt(allThemesData.find(t => t.id === themeId)?.cost || 0);


            let showScroll = false;
            switch (filterType) {
                case 'all':
                    showScroll = true;
                    break;
                case 'owned':
                    showScroll = themeIsOwned;
                    break;
                case 'unlockable':
                    showScroll = !themeIsOwned && themeCost > 0; // Only show if not owned and has a cost > 0
                    break;
                default:
                    showScroll = true;
            }
            scroll.style.display = showScroll ? '' : 'none';
            if (!showScroll) scroll.classList.remove('open');
        });
    }

    // --- Initialize Shop ---
    initializeShop();
});
