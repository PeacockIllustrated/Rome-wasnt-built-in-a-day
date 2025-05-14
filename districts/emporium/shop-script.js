// districts/emporium/shop-script.js

document.addEventListener('DOMContentLoaded', () => {
    console.log("districts/emporium/shop-script.js loaded and DOM ready.");

    // --- Configuration & Initial Data ---
    let currentUserCurrency = 500; // Default if DataManager fails
    let activeThemeId = "default_rome"; // Default if ThemeManager fails
    const themesData = [
        {
            id: "default_rome",
            name: "Imperial Standard",
            description: "The classic look and feel of Rome, majestic and timeless.",
            cost: 0,
            previewImage: "/assets/images/theme-previews/default_rome_preview.png", // OPTION A: Root-relative
            previewColors: ["#A0522D", "#D2B48C", "#FFFFFF", "#800000"]
        },
        {
            id: "colosseum_sand",
            name: "Colosseum Sand",
            description: "Earthy tones inspired by the sands of the grand arena.",
            cost: 100,
            previewImage: "/assets/images/theme-previews/colosseum_sand_preview.png", // OPTION A
            previewColors: ["#DEB887", "#F0E68C", "#3E2723", "#BF360C"]
        },
        {
            id: "senate_marble",
            name: "Senate Marble",
            description: "Cool, elegant whites and greys, fit for senatorial decrees.",
            cost: 150,
            previewImage: "/assets/images/theme-previews/senate_marble_preview.png", // OPTION A
            previewColors: ["#E0E0E0", "#BDBDBD", "#212121", "#4A148C"]
        },
        {
            id: "night_watch",
            name: "Night Watch",
            description: "Darker hues for a city under the stars.",
            cost: 200,
            previewImage: "/assets/images/theme-previews/night_watch_preview.png", // OPTION A
            previewColors: ["#263238", "#455A64", "#CFD8DC", "#FF6F00"]
        }
    ];

    // --- Attempt to use DataManager ---
    if (typeof DataManager !== 'undefined') {
        if (typeof DataManager.getCurrency === 'function') {
            currentUserCurrency = DataManager.getCurrency();
        } else if (typeof DataManager.loadData === 'function') {
            const dmCurrency = DataManager.loadData('romehub_user_currency');
            if (typeof dmCurrency === 'number') currentUserCurrency = dmCurrency;
            else console.warn("DataManager.loadData('romehub_user_currency') did not return a number.");
        } else {
            console.warn("DataManager: getCurrency() or loadData() not found. Using default currency.");
        }

        themesData.forEach(theme => {
            if (typeof DataManager.isThemeOwned === 'function') {
                theme.isOwned = DataManager.isThemeOwned(theme.id);
            } else if (typeof DataManager.loadData === 'function') {
                theme.isOwned = !!DataManager.loadData('romehub_owned_theme_' + theme.id);
            } else {
                console.warn(`DataManager: isThemeOwned() or loadData() not found. Simulating ownership for ${theme.id}.`);
                theme.isOwned = (theme.id === "default_rome");
            }
        });
    } else {
        console.warn("DataManager not found. Using default currency and simulating theme ownership.");
        themesData.forEach(theme => theme.isOwned = (theme.id === "default_rome"));
    }

    // --- Attempt to use ThemeManager ---
    if (typeof ThemeManager !== 'undefined') {
        if (typeof ThemeManager.getActiveThemeId === 'function') {
            activeThemeId = ThemeManager.getActiveThemeId() || "default_rome";
        } else {
            console.warn("ThemeManager: getActiveThemeId() not found. Assuming default theme.");
        }
        themesData.forEach(theme => theme.isActive = (theme.id === activeThemeId));
    } else {
        console.warn("ThemeManager not found. Assuming default theme and simulating active states.");
        themesData.forEach(theme => theme.isActive = (theme.id === "default_rome"));
    }

    // --- Initial Render ---
    renderThemeShop();
    addEventListeners();

    // --- Core Functions ---
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
            const card = document.createElement('div');
            card.className = 'district-summary-card emporium-theme-card';
            card.dataset.themeId = theme.id;

            let unlockButtonHtml = '';
            if (!theme.isOwned) {
                unlockButtonHtml = `<button class="btn btn-primary btn-unlock-theme" data-theme-id="${theme.id}" data-cost="${theme.cost}" ${!canAfford ? 'disabled title="Insufficient Funds"' : ''}>
                                        Unlock ${!canAfford ? '(Low Funds)' : ''}
                                    </button>`;
            }
            let applyButtonHtml = '';
            if (theme.isOwned && !theme.isActive) {
                applyButtonHtml = `<button class="btn btn-secondary btn-apply-theme" data-theme-id="${theme.id}">Apply</button>`;
            }
            let previewButtonHtml = `<button class="btn btn-info btn-preview-theme" data-theme-id="${theme.id}">Preview</button>`;

            // Image path for coin inside card - also make it root-relative for consistency if Option A chosen
            const coinIconPath = "/assets/images/icons/coin.png"; // Or `../../assets/...` if reverting path strategy

            card.innerHTML = `
                <div class="emporium-theme-card-header">
                    <h3 class="emporium-theme-name">${theme.name}</h3>
                    <div class="emporium-theme-preview-swatches">
                        ${theme.previewColors.map(color => `<span class="swatch" style="background-color: ${color};"></span>`).join('')}
                    </div>
                </div>
                <div class="emporium-theme-preview-image-container">
                    <img src="${theme.previewImage}" alt="Preview of ${theme.name}" class="emporium-theme-preview-image"
                         onerror="this.style.display='none'; if(!this.parentElement.querySelector('.preview-unavailable')) { this.parentElement.innerHTML += '<p class=\\'preview-unavailable\\'>Preview N/A</p>'; } console.error('Failed to load image: ${theme.previewImage}');">
                </div>
                <p class="emporium-theme-description">${theme.description}</p>
                <div class="emporium-theme-meta">
                    <div class="emporium-theme-status">
                        <span class="emporium-theme-cost" style="display: ${theme.isOwned ? 'none' : 'inline'};">
                            Cost: ${theme.cost} <img src="${coinIconPath}" alt="Coins" class="currency-icon-small">
                        </span>
                        <span class="emporium-theme-owned-badge" style="display: ${theme.isOwned ? 'inline-block' : 'none'};">OWNED</span>
                        <span class="emporium-theme-active-badge" style="display: ${theme.isActive ? 'inline-block' : 'none'};">ACTIVE</span>
                    </div>
                    <div class="emporium-theme-actions">
                        ${unlockButtonHtml}
                        ${applyButtonHtml}
                        ${previewButtonHtml}
                    </div>
                </div>
            `;
            themeGrid.appendChild(card);
        });
    }

    function addEventListeners() {
        const themeGrid = document.getElementById('emporiumThemeGrid');
        if (themeGrid) themeGrid.addEventListener('click', handleThemeActionClick);

        const filterButtons = document.querySelectorAll('#emporiumShopFilters .filter-btn');
        filterButtons.forEach(button => button.addEventListener('click', handleFilterClick));
    }

    function handleThemeActionClick(event) {
        const button = event.target.closest('button');
        if (!button) return;
        const themeId = button.dataset.themeId;
        if (!themeId) return;

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
        if (currentUserCurrency >= cost) {
            if (typeof DataManager !== 'undefined') {
                let currencyUpdated = false, themeOwnedUpdated = false;
                // Update currency
                if (typeof DataManager.setCurrency === 'function') { DataManager.setCurrency(currentUserCurrency - cost); currencyUpdated = true; }
                else if (typeof DataManager.saveSingleData === 'function') { DataManager.saveSingleData('romehub_user_currency', currentUserCurrency - cost); currencyUpdated = true; }
                // Update theme ownership
                if (typeof DataManager.setThemeAsOwned === 'function') { DataManager.setThemeAsOwned(themeId); themeOwnedUpdated = true; }
                else if (typeof DataManager.saveSingleData === 'function') { DataManager.saveSingleData('romehub_owned_theme_' + themeId, true); themeOwnedUpdated = true; }

                if (currencyUpdated && themeOwnedUpdated) {
                    currentUserCurrency -= cost;
                    const theme = themesData.find(t => t.id === themeId);
                    if (theme) theme.isOwned = true;
                    alert(`Theme "${theme ? theme.name : themeId}" unlocked!`);
                    renderThemeShop();
                } else {
                    alert("Could not save unlock. DataManager methods missing/failed.");
                    console.error("Unlock Error: DataManager methods for currency/theme ownership missing/failed.");
                }
            } else console.error("Unlock Error: DataManager not available.");
        } else alert("Not enough funds.");
    }

    function applyTheme(themeId) {
        if (typeof ThemeManager !== 'undefined' && typeof ThemeManager.applyTheme === 'function') {
            if (ThemeManager.applyTheme(themeId)) { // Assuming applyTheme returns true on success
                activeThemeId = themeId; // Update local cache
                alert(`Theme "${themesData.find(t => t.id === themeId)?.name || themeId}" applied!`);
                renderThemeShop();
            } else alert("Failed to apply theme via ThemeManager.");
        } else console.error("Apply Error: ThemeManager or applyTheme method missing.");
    }

    function previewTheme(themeId) {
        const theme = themesData.find(t => t.id === themeId);
        alert(`Previewing "${theme ? theme.name : themeId}" - Placeholder.`);
    }

    function filterThemesDisplay(filterType) {
        document.querySelectorAll('#emporiumThemeGrid .emporium-theme-card').forEach(card => {
            const theme = themesData.find(t => t.id === card.dataset.themeId);
            if (!theme) { card.style.display = 'none'; return; }
            let showCard = (filterType === 'all') ||
                           (filterType === 'owned' && theme.isOwned) ||
                           (filterType === 'unlockable' && !theme.isOwned);
            card.style.display = showCard ? '' : 'none';
        });
    }
});
