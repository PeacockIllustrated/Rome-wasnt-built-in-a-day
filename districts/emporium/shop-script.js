// districts/emporium/shop-script.js

// Simulating DataManager for user currency for now.
// In a real scenario, you would fetch this from DataManager.
// This would likely be: let currentUserCurrency = DataManager.getCurrency();
let currentUserCurrency = 500; // Example value, replace with actual DataManager call

const themesData = [
    {
        id: "default_rome",
        name: "Imperial Standard",
        description: "The classic look and feel of Rome, majestic and timeless.",
        cost: 0,
        // isOwned and isActive will be set based on DataManager/ThemeManager later
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

document.addEventListener('DOMContentLoaded', () => {
    // --- DataManager and ThemeManager Integration ---
    // This is where you would truly fetch and set data using your actual DataManager and ThemeManager.
    // For now, we'll simulate the initial state.

    // Example of how you might integrate with DataManager:
    if (typeof DataManager !== 'undefined' && DataManager.getSystemSetting) { // Check if DataManager and a method exist
        // Assuming currency is stored in DataManager, e.g., as a system setting or user profile data
        // currentUserCurrency = DataManager.getCurrency ? DataManager.getCurrency() : 500; // Or whatever method you have
        // For testing, we use the hardcoded value above if DataManager isn't ready for this.
    } else {
        console.warn('DataManager not found or getCurrency method missing, using default currency for shop.');
    }

    let activeThemeId = "default_rome"; // Assume default is active initially
    // Example of how you might integrate with ThemeManager:
    if (typeof ThemeManager !== 'undefined' && ThemeManager.getActiveTheme) {
        // activeThemeId = ThemeManager.getActiveTheme() ? ThemeManager.getActiveTheme().id : "default_rome";
    } else {
        console.warn('ThemeManager not found or getActiveTheme method missing, assuming default theme is active.');
    }

    themesData.forEach(theme => {
        // Simulate fetching ownership status from DataManager
        // In a real scenario: theme.isOwned = DataManager.isThemeOwned(theme.id);
        theme.isOwned = (theme.id === "default_rome"); // For now, only default is owned

        theme.isActive = (theme.id === activeThemeId);
    });
    // --- End Integration Placeholder ---

    initializeThemeShopDisplay(themesData, currentUserCurrency);
});

function initializeThemeShopDisplay(themes, currency) {
    const themeGrid = document.getElementById('emporiumThemeGrid'); // Using a more specific ID
    const userCurrencyDisplay = document.getElementById('emporiumUserCurrency'); // Using a more specific ID

    if (userCurrencyDisplay) {
        userCurrencyDisplay.textContent = currency;
    } else {
        console.error("Emporium currency display element not found!");
    }

    if (!themeGrid) {
        console.error("Emporium theme grid not found!");
        return;
    }

    themeGrid.innerHTML = ''; // Clear existing items

    themes.forEach(theme => {
        const canAfford = currency >= theme.cost;
        const card = document.createElement('div');
        // Re-use .district-summary-card if it exists globally and provides a good base
        // Or define .emporium-theme-card styles for more specific control
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

        // Preview button is always available. Logic for preview will be more complex.
        let previewButtonHtml = `<button class="btn btn-info btn-preview-theme" data-theme-id="${theme.id}">Preview</button>`;

        card.innerHTML = `
            <div class="emporium-theme-card-header">
                <h3 class="emporium-theme-name">${theme.name}</h3>
                <div class="emporium-theme-preview-swatches">
                    ${theme.previewColors.map(color => `<span class="swatch" style="background-color: ${color};"></span>`).join('')}
                </div>
            </div>
            <div class="emporium-theme-preview-image-container">
                <img src="${theme.previewImage}" alt="Preview of ${theme.name}" class="emporium-theme-preview-image" onerror="this.style.display='none'; this.parentElement.innerHTML += '<p class=\\'preview-unavailable\\'>Preview N/A</p>';">
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

    addEmporiumButtonEventListeners();
}

function addEmporiumButtonEventListeners() {
    const themeGrid = document.getElementById('emporiumThemeGrid');
    if (!themeGrid) return;

    themeGrid.addEventListener('click', function(event) {
        const target = event.target.closest('button'); // Get the button if a click was on an icon inside it
        if (!target) return;

        const themeId = target.dataset.themeId;

        if (target.classList.contains('btn-unlock-theme')) {
            const cost = parseInt(target.dataset.cost, 10);
            console.log(`Attempting to unlock theme: ${themeId}, Cost: ${cost}`);
            // Actual unlock logic will call DataManager and refresh UI in a later stage
            // For now: alert(`Unlock ${themeId} (Cost: ${cost}) - Placeholder. Refresh to see changes if mocked.`);
            // Mock unlock for immediate testing (REMOVE THIS IN REAL IMPLEMENTATION)
            // if (currentUserCurrency >= cost) {
            //     currentUserCurrency -= cost;
            //     const theme = themesData.find(t => t.id === themeId);
            //     if(theme) theme.isOwned = true;
            //     initializeThemeShopDisplay(themesData, currentUserCurrency); // Refresh display
            // }
        } else if (target.classList.contains('btn-apply-theme')) {
            console.log(`Attempting to apply theme: ${themeId}`);
            // Actual apply logic will call ThemeManager and refresh UI in a later stage
            // For now: alert(`Apply ${themeId} - Placeholder. Refresh to see changes if mocked.`);
            // Mock apply for immediate testing (REMOVE THIS IN REAL IMPLEMENTATION)
            // themesData.forEach(t => t.isActive = (t.id === themeId));
            // initializeThemeShopDisplay(themesData, currentUserCurrency); // Refresh display
        } else if (target.classList.contains('btn-preview-theme')) {
            console.log(`Attempting to preview theme: ${themeId}`);
            // Preview logic will be added in a later stage
            alert(`Preview ${themeId} - Placeholder`);
        }
    });

    // Filter button listeners (basic implementation)
    const filterButtons = document.querySelectorAll('#emporiumShopFilters .filter-btn');
    filterButtons.forEach(button => {
        button.addEventListener('click', function() {
            filterButtons.forEach(btn => btn.classList.remove('active'));
            this.classList.add('active');
            const filterType = this.dataset.filter;
            filterThemes(filterType);
        });
    });
}

function filterThemes(filterType) {
    const allCards = document.querySelectorAll('#emporiumThemeGrid .emporium-theme-card');
    allCards.forEach(card => {
        const themeId = card.dataset.themeId;
        const theme = themesData.find(t => t.id === themeId);
        if (!theme) return;

        let showCard = false;
        switch (filterType) {
            case 'owned':
                if (theme.isOwned) showCard = true;
                break;
            case 'unlockable': // Renamed from 'unlocked' for clarity - means "can be unlocked"
                if (!theme.isOwned) showCard = true;
                break;
            case 'all':
            default:
                showCard = true;
                break;
        }
        card.style.display = showCard ? '' : 'none'; // Or use a class to hide
    });
}


// Make sure DataManager and ThemeManager are loaded before this script,
// or ensure their functions are available globally if accessed directly.
console.log("districts/emporium/shop-script.js loaded");
