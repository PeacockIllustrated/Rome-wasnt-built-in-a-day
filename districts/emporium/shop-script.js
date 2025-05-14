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
            previewImage: "../../assets/images/theme-previews/default_rome_preview.png",
            previewColors: ["#A0522D", "#D2B48C", "#FFFFFF", "#800000"]
        },
        {
            id: "colosseum_sand",
            name: "Colosseum Sand",
            description: "Earthy tones inspired by the sands of the grand arena.",
            cost: 100,
            previewImage: "../../assets/images/theme-previews/colosseum_sand_preview.png",
            previewColors: ["#DEB887", "#F0E68C", "#3E2723", "#BF360C"]
        },
        {
            id: "senate_marble",
            name: "Senate Marble",
            description: "Cool, elegant whites and greys, fit for senatorial decrees.",
            cost: 150,
            previewImage: "../../assets/images/theme-previews/senate_marble_preview.png",
            previewColors: ["#E0E0E0", "#BDBDBD", "#212121", "#4A148C"]
        },
        {
            id: "night_watch",
            name: "Night Watch",
            description: "Darker hues for a city under the stars.",
            cost: 200,
            previewImage: "../../assets/images/theme-previews/night_watch_preview.png",
            previewColors: ["#263238", "#455A64", "#CFD8DC", "#FF6F00"]
        }
    ];

    // --- Attempt to use DataManager ---
    // YOU MIGHT NEED TO ADJUST THESE METHOD NAMES (e.g., getCurrency, isThemeOwned)
    // TO MATCH YOUR ACTUAL DataManager.js API.
    if (typeof DataManager !== 'undefined') {
        if (typeof DataManager.getCurrency === 'function') {
            currentUserCurrency = DataManager.getCurrency();
            console.log("Successfully fetched currency from DataManager:", currentUserCurrency);
        } else if (typeof DataManager.loadData === 'function') { // Fallback for more generic DataManager
            const dmCurrency = DataManager.loadData('romehub_user_currency'); // Assuming key from handoff
            if (typeof dmCurrency === 'number') {
                currentUserCurrency = dmCurrency;
                console.log("Successfully fetched currency via DataManager.loadData:", currentUserCurrency);
            } else {
                 console.warn("DataManager.loadData('romehub_user_currency') did not return a number. Using default currency.");
            }
        }
        else {
            console.warn("DataManager is defined, but getCurrency() or compatible method not found. Using default currency for shop.");
        }

        themesData.forEach(theme => {
            if (typeof DataManager.isThemeOwned === 'function') {
                theme.isOwned = DataManager.isThemeOwned(theme.id);
            } else if (typeof DataManager.loadData === 'function') { // Fallback for generic DataManager
                theme.isOwned = !!DataManager.loadData('romehub_owned_theme_' + theme.id); // Coerce to boolean
            }
             else {
                console.warn(`DataManager.isThemeOwned() or compatible method not found. Simulating ownership for theme: ${theme.id}`);
                theme.isOwned = (theme.id === "default_rome"); // Fallback: only default is owned
            }
        });
    } else {
        console.warn("DataManager not found. Using default currency and simulating theme ownership.");
        themesData.forEach(theme => {
            theme.isOwned = (theme.id === "default_rome");
        });
    }

    // --- Attempt to use ThemeManager ---
    // YOU MIGHT NEED TO ADJUST THIS METHOD NAME (e.g., getActiveThemeId)
    // TO MATCH YOUR ACTUAL ThemeManager.js API.
    if (typeof ThemeManager !== 'undefined') {
        if (typeof ThemeManager.getActiveThemeId === 'function') {
            activeThemeId = ThemeManager.getActiveThemeId() || "default_rome";
            console.log("Successfully fetched active theme ID from ThemeManager:", activeThemeId);
        } else {
            console.warn("ThemeManager is defined, but getActiveThemeId() not found. Assuming default theme is active.");
        }
        themesData.forEach(theme => theme.isActive = (theme.id === activeThemeId));
    } else {
        console.warn("ThemeManager not found. Assuming default theme is active and simulating active states.");
        themesData.forEach(theme => theme.isActive = (theme.id === "default_rome"));
    }

    // --- Initial Render ---
    renderThemeShop();
    addEventListeners();

    // --- Core Functions ---
    function renderThemeShop() {
        const themeGrid = document.getElementById('emporiumThemeGrid');
        const userCurrencyDisplay = document.getElementById('emporiumUserCurrency');

        if (userCurrencyDisplay) {
            userCurrencyDisplay.textContent = currentUserCurrency;
        } else {
            console.error("Emporium currency display element (#emporiumUserCurrency) not found!");
        }

        if (!themeGrid) {
            console.error("Emporium theme grid (#emporiumThemeGrid) not found!");
            return;
        }

        themeGrid.innerHTML = ''; // Clear existing items

        // Refresh active theme ID before re-rendering, in case it changed via applyTheme
        if (typeof ThemeManager !== 'undefined' && typeof ThemeManager.getActiveThemeId === 'function') {
             activeThemeId = ThemeManager.getActiveThemeId() || "default_rome";
        }
        themesData.forEach(theme => theme.isActive = (theme.id === activeThemeId));


        themesData.forEach(theme => {
            const canAfford = currentUserCurrency >= theme.cost;
            const card = document.createElement('div');
            card.className = 'district-summary-card emporium-theme-card'; // Assuming .district-summary-card from global style
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

            card.innerHTML = `
                <div class="emporium-theme-card-header">
                    <h3 class="emporium-theme-name">${theme.name}</h3>
                    <div class="emporium-theme-preview-swatches">
                        ${theme.previewColors.map(color => `<span class="swatch" style="background-color: ${color};"></span>`).join('')}
                    </div>
                </div>
                <div class="emporium-theme-preview-image-container">
                    <img src="${theme.previewImage}" alt="Preview of ${theme.name}" class="emporium-theme-preview-image" 
                         onerror="this.style.display='none'; this.parentElement.innerHTML += '<p class=\\'preview-unavailable\\'>Preview N/A</p>'; console.error('Failed to load image: ${theme.previewImage}');">
                </div>
                <p class="emporium-theme-description">${theme.description}</p>
                <div class="emporium-theme-meta">
                    <div class="emporium-theme-status">
                        <span class="emporium-theme-cost" style="display: ${theme.isOwned ? 'none' : 'inline'};">
                            Cost: ${theme.cost} <img src="../../assets/images/icons/coin.png" alt="Coins" class="currency-icon-small">
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
        if (themeGrid) {
            themeGrid.addEventListener('click', handleThemeActionClick);
        }

        const filterButtons = document.querySelectorAll('#emporiumShopFilters .filter-btn');
        filterButtons.forEach(button => {
            button.addEventListener('click', handleFilterClick);
        });
    }

    function handleThemeActionClick(event) {
        const button = event.target.closest('button');
        if (!button) return;

        const themeId = button.dataset.themeId;
        if (!themeId) return;

        if (button.classList.contains('btn-unlock-theme')) {
            const cost = parseInt(button.dataset.cost, 10);
            unlockTheme(themeId, cost);
        } else if (button.classList.contains('btn-apply-theme')) {
            applyTheme(themeId);
        } else if (button.classList.contains('btn-preview-theme')) {
            previewTheme(themeId);
        }
    }

    function handleFilterClick(event) {
        const filterButtons = document.querySelectorAll('#emporiumShopFilters .filter-btn');
        filterButtons.forEach(btn => btn.classList.remove('active'));
        event.currentTarget.classList.add('active');
        const filterType = event.currentTarget.dataset.filter;
        filterThemesDisplay(filterType);
    }

    function unlockTheme(themeId, cost) {
        console.log(`Attempting to unlock theme: ${themeId}, Cost: ${cost}`);
        if (currentUserCurrency >= cost) {
            // YOU MIGHT NEED TO ADJUST THESE METHOD NAMES (e.g., setCurrency, setThemeAsOwned, saveData)
            if (typeof DataManager !== 'undefined') {
                let currencyUpdated = false;
                let themeOwnedUpdated = false;

                if (typeof DataManager.setCurrency === 'function') {
                    DataManager.setCurrency(currentUserCurrency - cost);
                    currencyUpdated = true;
                } else if (typeof DataManager.saveSingleData === 'function') { // Fallback for generic DataManager
                     DataManager.saveSingleData('romehub_user_currency', currentUserCurrency - cost);
                     currencyUpdated = true;
                }

                if (typeof DataManager.setThemeAsOwned === 'function') {
                    DataManager.setThemeAsOwned(themeId);
                    themeOwnedUpdated = true;
                } else if (typeof DataManager.saveSingleData === 'function') { // Fallback
                    DataManager.saveSingleData('romehub_owned_theme_' + themeId, true);
                    themeOwnedUpdated = true;
                }

                if (currencyUpdated && themeOwnedUpdated) {
                    // Update local state
                    currentUserCurrency -= cost;
                    const theme = themesData.find(t => t.id === themeId);
                    if (theme) theme.isOwned = true;

                    alert(`Theme "${theme ? theme.name : themeId}" unlocked!`);
                    renderThemeShop(); // Re-render the shop to reflect changes
                } else {
                     alert("Could not save unlock status. DataManager methods missing or failed.");
                     console.error("DataManager methods for setCurrency/setThemeAsOwned or saveSingleData missing/failed.");
                }
            } else {
                alert("DataManager not available. Cannot process unlock.");
                console.error("DataManager not available for unlockTheme.");
            }
        } else {
            alert("Not enough funds to unlock this theme.");
        }
    }

    function applyTheme(themeId) {
        console.log(`Attempting to apply theme: ${themeId}`);
        // YOU MIGHT NEED TO ADJUST THIS METHOD NAME (e.g., applyTheme)
        if (typeof ThemeManager !== 'undefined' && typeof ThemeManager.applyTheme === 'function') {
            const success = ThemeManager.applyTheme(themeId); // applyTheme should handle saving the active state
            if (success) {
                // Update local active state for immediate re-render
                activeThemeId = themeId;
                themesData.forEach(t => t.isActive = (t.id === themeId));
                alert(`Theme "${themesData.find(t=>t.id===themeId)?.name || themeId}" applied!`);
                renderThemeShop(); // Re-render to update "ACTIVE" badge
            } else {
                alert("Failed to apply theme via ThemeManager.");
            }
        } else {
            alert("ThemeManager not available or applyTheme method missing. Cannot apply theme.");
            console.error("ThemeManager or applyTheme method missing for applyTheme.");
        }
    }

    function previewTheme(themeId) {
        const theme = themesData.find(t => t.id === themeId);
        alert(`Previewing "${theme ? theme.name : themeId}" - Placeholder. \n(Actual preview would temporarily change page styles or show a modal.)`);
        // Actual preview implementation is more complex and depends on how you want it to work.
    }

    function filterThemesDisplay(filterType) {
        const allCards = document.querySelectorAll('#emporiumThemeGrid .emporium-theme-card');
        allCards.forEach(card => {
            const themeId = card.dataset.themeId;
            const theme = themesData.find(t => t.id === themeId);
            if (!theme) {
                card.style.display = 'none'; // Hide if data somehow missing
                return;
            }

            let showCard = false;
            switch (filterType) {
                case 'owned':
                    showCard = theme.isOwned;
                    break;
                case 'unlockable':
                    showCard = !theme.isOwned;
                    break;
                case 'all':
                default:
                    showCard = true;
                    break;
            }
            card.style.display = showCard ? '' : 'none'; // Consider using flex/block based on your grid
        });
    }
});
