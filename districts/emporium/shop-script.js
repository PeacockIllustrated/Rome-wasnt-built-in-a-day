// districts/emporium/shop-script.js

document.addEventListener('DOMContentLoaded', () => {
    let currentUserPoints = 0;
    let activeThemeId = "default_rome"; // Ensure this matches the ID in ThemeManager
    let allThemesData = []; // Will be populated from ThemeManager

    // --- Corrected DataManager & ThemeManager Integration ---
    function loadInitialData() {
        if (typeof DataManager !== 'undefined') {
            currentUserPoints = DataManager.getUserPoints();
        } else {
            console.warn("DataManager not found. Simulating points.");
            currentUserPoints = 500; // Fallback for simulation
        }

        if (typeof ThemeManager !== 'undefined') {
            allThemesData = ThemeManager.getAllThemes(); // Get themes from ThemeManager
            activeThemeId = ThemeManager.getCurrentThemeId();

            const ownedThemeIds = ThemeManager.getOwnedThemeIds();
            allThemesData.forEach(theme => {
                theme.isOwned = ownedThemeIds.includes(theme.id);
                theme.isActive = (theme.id === activeThemeId);
            });
        } else {
            console.warn("ThemeManager not found. Simulating themes.");
            // Fallback simulation if ThemeManager is missing (for isolated testing)
            allThemesData = [
                { id: "default_rome", name: "Imperial Standard", description: "Classic Rome.", cost: 0, previewImage: "/assets/images/theme-previews/default_rome_preview.png", previewColors: ["#A0522D", "#D2B48C", "#FFFFFF", "#800000"], isOwned: true, isActive: true },
                { id: "colosseum_sand", name: "Colosseum Sand", description: "Earthy arena tones.", cost: 100, previewImage: "/assets/images/theme-previews/colosseum_sand_preview.png", previewColors: ["#DEB887", "#F0E68C", "#3E2723", "#BF360C"], isOwned: false, isActive: false },
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
           themeGrid.innerHTML = ''; // Clear existing content

           if (typeof ThemeManager !== 'undefined') {
                activeThemeId = ThemeManager.getCurrentThemeId();
                const ownedThemeIds = ThemeManager.getOwnedThemeIds();
                allThemesData.forEach(theme => {
                   theme.isOwned = ownedThemeIds.includes(theme.id);
                   theme.isActive = (theme.id === activeThemeId);
                });
           }

           allThemesData.forEach(theme => {
               const canAfford = currentUserPoints >= theme.cost;
               const scrollElement = document.createElement('div');
               scrollElement.className = 'emporium-theme-scroll';
               scrollElement.dataset.themeId = theme.id;
               scrollElement.tabIndex = 0;

               let unlockButtonHtml = !theme.isOwned ? `<button class="btn btn-primary btn-unlock-theme" data-theme-id="${theme.id}" data-cost="${theme.cost}" ${!canAfford ? 'disabled title="Insufficient Points"' : ''}>Unlock ${theme.cost > 0 ? theme.cost + 'pts' : ''} ${!canAfford && theme.cost > 0 ? '(Low)' : ''}</button>` : '';
               let applyButtonHtml = (theme.isOwned && !theme.isActive) ? `<button class="btn btn-secondary btn-apply-theme" data-theme-id="${theme.id}">Apply</button>` : '';
               // previewButtonHtml was removed

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
                                onerror="this.style.display='none'; if(!this.parentElement.querySelector('.preview-unavailable')) { this.parentElement.innerHTML += '<p class=\\'preview-unavailable\\'>Preview N/A</p>'; } console.error('Failed to load image: ${theme.previewImage}');">
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
        // else if (button.classList.contains('btn-preview-theme')) previewThemeAction(themeId);
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

        if (currentUserPoints >= cost) {
            // Deduct points
            DataManager.setUserPoints(currentUserPoints - cost);
            currentUserPoints -= cost; // Update local state

            // Add theme to owned
            if (ThemeManager.addOwnedThemeId(themeId)) {
                // Update the local allThemesData for immediate UI reflection
                const theme = allThemesData.find(t => t.id === themeId);
                if (theme) theme.isOwned = true;
                
                SharedUtils.showToast(`Scroll of "${theme ? theme.name : themeId}" acquired!`, 2500, 'success');
                renderThemeShop(); // Re-render to update button states and currency
            } else {
                // If addOwnedThemeId failed (e.g., already owned, though button should be hidden)
                // Revert points deduction if necessary, or handle as per ThemeManager's return
                DataManager.setUserPoints(currentUserPoints + cost); // Revert
                currentUserPoints += cost;
                SharedUtils.showToast("Failed to record theme ownership.", 3000, 'error');
            }
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

        if (ThemeManager.setCurrentThemeId(themeId)) {
            activeThemeId = themeId; // Update local state
            const theme = allThemesData.find(t => t.id === themeId);
            SharedUtils.showToast(`Style of "${theme ? theme.name : themeId}" now active!`, 2500, 'success');
            renderThemeShop(); // Re-render to update active status and button states
        } else {
            SharedUtils.showToast("Failed to apply style.", 3000, 'error');
        }
    }

    // function previewThemeAction(themeId) {
    //     // Basic preview: show toast. Could be expanded to temporarily apply styles.
    //     const theme = allThemesData.find(t => t.id === themeId);
    //     SharedUtils.showToast(`Previewing: ${theme ? theme.name : themeId}`, 2000, 'info');
    // }

    function filterThemesDisplay(filterType) {
        document.querySelectorAll('#emporiumThemeGrid .emporium-theme-scroll').forEach(scroll => {
            const themeId = scroll.dataset.themeId;
            const theme = allThemesData.find(t => t.id === themeId);
            if (!theme) { scroll.style.display = 'none'; return; }

            let showScroll = false;
            switch (filterType) {
                case 'all':
                    showScroll = true;
                    break;
                case 'owned':
                    showScroll = theme.isOwned;
                    break;
                case 'unlockable':
                    showScroll = !theme.isOwned && theme.cost > 0;
                    break;
                default:
                    showScroll = true;
            }
            scroll.style.display = showScroll ? '' : 'none';
            if (!showScroll) scroll.classList.remove('open');
        });
    }

    // --- Initialize Shop ---
    loadInitialData();
    renderThemeShop();
    addEventListeners();

    // Add specific styling for the small pts icon in the card if not already in CSS
    const styleSheet = document.createElement("style");
    styleSheet.innerText = `
        .currency-icon-small.pts-icon {
            width: 16px;
            height: 16px;
            display: inline-block;
            vertical-align: middle;
            margin-left: var(--space-xs, 4px);
            background-size: contain;
            background-repeat: no-repeat;
            background-image: url('/assets/images/icons/coin.png'); /* Path to your pts icon */
        }
    `;
    document.head.appendChild(styleSheet);

});
