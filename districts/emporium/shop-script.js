// districts/emporium/shop-script.js

document.addEventListener('DOMContentLoaded', () => {
    // console.log("districts/emporium/shop-script.js loaded and DOM ready.");

    let currentUserCurrency = 500;
    let activeThemeId = "default_rome";
    const themesData = [ // Ensure your previewImage paths are correct (root-relative or ../../)
        { id: "default_rome", name: "Imperial Standard", description: "The classic look and feel of Rome, majestic and timeless.", cost: 0, previewImage: "/assets/images/theme-previews/default_rome_preview.png", previewColors: ["#A0522D", "#D2B48C", "#FFFFFF", "#800000"] },
        { id: "colosseum_sand", name: "Colosseum Sand", description: "Earthy tones inspired by the sands of the grand arena.", cost: 100, previewImage: "/assets/images/theme-previews/colosseum_sand_preview.png", previewColors: ["#DEB887", "#F0E68C", "#3E2723", "#BF360C"] },
        { id: "senate_marble", name: "Senate Marble", description: "Cool, elegant whites and greys, fit for senatorial decrees.", cost: 150, previewImage: "/assets/images/theme-previews/senate_marble_preview.png", previewColors: ["#E0E0E0", "#BDBDBD", "#212121", "#4A148C"] },
        { id: "night_watch", name: "Night Watch", description: "Darker hues for a city under the stars.", cost: 200, previewImage: "/assets/images/theme-previews/night_watch_preview.png", previewColors: ["#263238", "#455A64", "#CFD8DC", "#FF6F00"] }
    ];

    // --- DataManager & ThemeManager Integration (CRITICAL: ADJUST METHOD NAMES) ---
    if (typeof DataManager !== 'undefined') {
        if (typeof DataManager.getCurrency === 'function') currentUserCurrency = DataManager.getCurrency();
        else if (typeof DataManager.loadData === 'function') {
            const dmCurrency = DataManager.loadData('romehub_user_currency');
            if (typeof dmCurrency === 'number') currentUserCurrency = dmCurrency;
            else console.warn("DM: loadData('romehub_user_currency') !num.");
        } else console.warn("DM: getCurrency/loadData missing.");

        themesData.forEach(theme => {
            if (typeof DataManager.isThemeOwned === 'function') theme.isOwned = DataManager.isThemeOwned(theme.id);
            else if (typeof DataManager.loadData === 'function') theme.isOwned = !!DataManager.loadData('romehub_owned_theme_' + theme.id);
            else { console.warn(`DM: isThemeOwned/loadData missing for ${theme.id}.`); theme.isOwned = (theme.id === "default_rome"); }
        });
    } else { console.warn("DM not found. Simulating."); themesData.forEach(t => t.isOwned = (t.id === "default_rome"));}

    if (typeof ThemeManager !== 'undefined') {
        if (typeof ThemeManager.getActiveThemeId === 'function') activeThemeId = ThemeManager.getActiveThemeId() || "default_rome";
        else console.warn("TM: getActiveThemeId missing.");
        themesData.forEach(theme => theme.isActive = (theme.id === activeThemeId));
    } else { console.warn("TM not found. Simulating."); themesData.forEach(t => t.isActive = (t.id === "default_rome"));}

    renderThemeShop();
    addEventListeners();

    function renderThemeShop() {
        const themeGrid = document.getElementById('emporiumThemeGrid');
        const userCurrencyDisplay = document.getElementById('emporiumUserCurrency');

        if (userCurrencyDisplay) userCurrencyDisplay.textContent = currentUserCurrency;
        else console.error("#emporiumUserCurrency not found!");
        if (!themeGrid) { console.error("#emporiumThemeGrid not found!"); return; }
        themeGrid.innerHTML = '';

        if (typeof ThemeManager !== 'undefined' && typeof ThemeManager.getActiveThemeId === 'function') {
             activeThemeId = ThemeManager.getActiveThemeId() || "default_rome";
        }
        themesData.forEach(theme => theme.isActive = (theme.id === activeThemeId));

        themesData.forEach(theme => {
            const canAfford = currentUserCurrency >= theme.cost;
            const scrollElement = document.createElement('div');
            scrollElement.className = 'emporium-theme-scroll'; // New class for the scroll
            scrollElement.dataset.themeId = theme.id;
            scrollElement.tabIndex = 0; // Make it focusable for keyboard interaction

            let unlockButtonHtml = !theme.isOwned ? `<button class="btn btn-primary btn-unlock-theme" data-theme-id="${theme.id}" data-cost="${theme.cost}" ${!canAfford ? 'disabled title="Insufficient Funds"' : ''}>Unlock ${!canAfford ? '(Low Pts)' : ''}</button>` : '';
            let applyButtonHtml = (theme.isOwned && !theme.isActive) ? `<button class="btn btn-secondary btn-apply-theme" data-theme-id="${theme.id}">Apply</button>` : '';
            let previewButtonHtml = `<button class="btn btn-info btn-preview-theme" data-theme-id="${theme.id}">Preview</button>`; // Always show preview

            scrollElement.innerHTML = `
                <div class="scroll-header">
                    <h3 class="emporium-theme-name">${theme.name}</h3>
                    <div class="emporium-theme-preview-swatches">
                        ${theme.previewColors.map(color => `<span class="swatch" style="background-color: ${color};"></span>`).join('')}
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
                            <span class="emporium-theme-cost" style="display: ${theme.isOwned ? 'none' : 'inline'};">
                                Cost: ${theme.cost} <span class="currency-icon-small pts-icon" title="Points"></span>
                            </span>
                            <span class="emporium-theme-owned-badge" style="display: ${theme.isOwned ? 'inline-block' : 'none'};">Owned</span>
                            <span class="emporium-theme-active-badge" style="display: ${theme.isActive ? 'inline-block' : 'none'};">Active</span>
                        </div>
                        <div class="emporium-theme-actions">
                            ${unlockButtonHtml}
                            ${applyButtonHtml}
                            ${previewButtonHtml}
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
            themeGrid.addEventListener('click', handleScrollClick); // Changed to handle scroll toggle
            themeGrid.addEventListener('keydown', (event) => { // Keyboard accessibility for scrolls
                if (event.key === 'Enter' || event.key === ' ') {
                    if (event.target.classList.contains('emporium-theme-scroll')) {
                        event.preventDefault();
                        toggleScroll(event.target);
                    }
                }
            });
            // Delegate button clicks within the scroll
            themeGrid.addEventListener('click', handleThemeActionClick);
        }


        document.querySelectorAll('#emporiumShopFilters .filter-btn')
            .forEach(button => button.addEventListener('click', handleFilterClick));
    }
    
    function handleScrollClick(event) {
        const scrollElement = event.target.closest('.emporium-theme-scroll');
        if (scrollElement && !event.target.closest('button')) { // Don't toggle if a button inside was clicked
            toggleScroll(scrollElement);
        }
    }

    function toggleScroll(scrollElement) {
        // Close other open scrolls
        document.querySelectorAll('.emporium-theme-scroll.open').forEach(openScroll => {
            if (openScroll !== scrollElement) {
                openScroll.classList.remove('open');
            }
        });
        scrollElement.classList.toggle('open');
    }

    function handleThemeActionClick(event) { // This now handles button clicks inside scrolls
        const button = event.target.closest('button');
        if (!button) return;
        const themeId = button.dataset.themeId;
        if (!themeId) return;

        event.stopPropagation(); // Prevent scroll from closing when button is clicked

        if (button.classList.contains('btn-unlock-theme')) unlockTheme(themeId, parseInt(button.dataset.cost, 10));
        else if (button.classList.contains('btn-apply-theme')) applyTheme(themeId);
        else if (button.classList.contains('btn-preview-theme')) previewTheme(themeId);
    }

    function handleFilterClick(event) {
        document.querySelectorAll('#emporiumShopFilters .filter-btn').forEach(btn => btn.classList.remove('active'));
        event.currentTarget.classList.add('active');
        filterThemesDisplay(event.currentTarget.dataset.filter);
    }

    function unlockTheme(themeId, cost) {
        // CRITICAL: Adjust DataManager method names to match your actual API
        if (currentUserCurrency >= cost) {
            if (typeof DataManager !== 'undefined') {
                let currencyUpdated = false, themeOwnedUpdated = false;
                if (typeof DataManager.setCurrency === 'function') { DataManager.setCurrency(currentUserCurrency - cost); currencyUpdated = true; }
                else if (typeof DataManager.saveSingleData === 'function') { DataManager.saveSingleData('romehub_user_currency', currentUserCurrency - cost); currencyUpdated = true; }

                if (typeof DataManager.setThemeAsOwned === 'function') { DataManager.setThemeAsOwned(themeId); themeOwnedUpdated = true; }
                else if (typeof DataManager.saveSingleData === 'function') { DataManager.saveSingleData('romehub_owned_theme_' + themeId, true); themeOwnedUpdated = true; }

                if (currencyUpdated && themeOwnedUpdated) {
                    currentUserCurrency -= cost;
                    const theme = themesData.find(t => t.id === themeId);
                    if (theme) theme.isOwned = true;
                    alert(`Scroll of "${theme ? theme.name : themeId}" acquired!`);
                    renderThemeShop(); // Re-render
                } else { alert("Could not save unlock. DataManager methods missing/failed."); console.error("Unlock Error: DM methods missing/failed.");}
            } else { console.error("Unlock Error: DM not available."); alert("Error: Cannot connect to Scriptorium records.");}
        } else alert("Not enough points for this scroll.");
    }

    function applyTheme(themeId) {
        // CRITICAL: Adjust ThemeManager method name
        if (typeof ThemeManager !== 'undefined' && typeof ThemeManager.applyTheme === 'function') {
            if (ThemeManager.applyTheme(themeId)) {
                activeThemeId = themeId;
                alert(`Style of "${themesData.find(t => t.id === themeId)?.name || themeId}" now active!`);
                renderThemeShop();
            } else alert("Failed to apply style via ThemeManager.");
        } else { console.error("Apply Error: TM or applyTheme method missing."); alert("Error: Scribe is unavailable to apply style.");}
    }

    function previewTheme(themeId) {
        const theme = themesData.find(t => t.id === themeId);
        alert(`Previewing style of "${theme ? theme.name : themeId}" - Scribe is preparing a vision...`);
    }

    function filterThemesDisplay(filterType) {
        document.querySelectorAll('#emporiumThemeGrid .emporium-theme-scroll').forEach(scroll => {
            const theme = themesData.find(t => t.id === scroll.dataset.themeId);
            if (!theme) { scroll.style.display = 'none'; return; }
            let showScroll = (filterType === 'all') ||
                           (filterType === 'owned' && theme.isOwned) ||
                           (filterType === 'unlockable' && !theme.isOwned);
            scroll.style.display = showScroll ? '' : 'none';
            if (!showScroll) scroll.classList.remove('open'); // Close filtered out scrolls
        });
    }
});
