// js/theme-manager.js

const ThemeManager = (() => {
    const themes = {
        default: { name: "Default Retro", cost: 0, owned: true, description: "The classic look and feel.", cssVariables: { '--theme-primary-dark': '#264653', '--theme-primary-accent': '#2A9D8F', '--theme-secondary-accent': '#E9C46A', '--theme-tertiary-accent': '#F4A261', '--theme-highlight-accent': '#E76F51', '--theme-light-bg': '#EAEAEA', '--theme-card-bg': '#FFFFFF', '--theme-text-on-dark': '#EAEAEA', '--theme-page-bg': 'rgb(174, 217, 211)' } },
        oceanDepths: { name: "Ocean Depths", cost: 1, description: "Dive into cool blue tranquility.", cssVariables: { '--theme-primary-dark': '#03045E', '--theme-primary-accent': '#0077B6', '--theme-secondary-accent': '#00B4D8', '--theme-tertiary-accent': '#90E0EF', '--theme-highlight-accent': '#CAF0F8', '--theme-light-bg': '#E0FBFC', '--theme-card-bg': '#FFFFFF', '--theme-text-on-dark': '#CAF0F8', '--theme-page-bg': '#ADE8F4' } },
        volcanoRush: { name: "Volcano Rush", cost: 1, description: "Fiery reds and oranges.", cssVariables: { '--theme-primary-dark': '#2B0000', '--theme-primary-accent': '#6A0000', '--theme-secondary-accent': '#FF4500', '--theme-tertiary-accent': '#FF8C00', '--theme-highlight-accent': '#AE2012', '--theme-light-bg': '#FFF2E6', '--theme-card-bg': '#FFFFFF', '--theme-text-on-dark': '#FFDAB9', '--theme-page-bg': '#FFCDB2' } },
        techOrangeBlue: { name: "Tech Orange & Blue", cost: 1, description: "A modern tech-inspired palette.", cssVariables: { '--theme-primary-dark': '#004C97', '--theme-primary-accent': '#4A7DB5', '--theme-secondary-accent': '#FF6600', '--theme-tertiary-accent': '#C0C0C0', '--theme-highlight-accent': '#FF7700', '--theme-light-bg': '#F0F0F0', '--theme-card-bg': '#FFFFFF', '--theme-text-on-dark': '#F0F0F0', '--theme-page-bg': '#E8E8E8' } },
        forestGreens: { name: "Forest Greens", cost: 1, description: "Earthy and calming greens.", cssVariables: { '--theme-primary-dark': '#1A2B12', '--theme-primary-accent': '#335128', '--theme-secondary-accent': '#526F35', '--theme-tertiary-accent': '#8A9A5B', '--theme-highlight-accent': '#E0E7A3', '--theme-light-bg': '#F0F5E0', '--theme-card-bg': '#FFFFFF', '--theme-text-on-dark': '#E0E7A3', '--theme-page-bg': '#D8E0C0' } }
    };

    function applyTheme(themeId) {
        const themeToApply = themes[themeId] || themes.default;
        if (themeToApply && themeToApply.cssVariables) {
            const themeVars = themeToApply.cssVariables;
            for (const [key, value] of Object.entries(themeVars)) {
                document.documentElement.style.setProperty(key, value);
            }
            // These two are derived, standardizing their names
            document.documentElement.style.setProperty('--theme-text-main', themeVars['--theme-primary-dark']);
            document.documentElement.style.setProperty('--theme-border-main', themeVars['--theme-primary-dark']);
            console.log(`Applied theme: ${themeToApply.name}`);
        } else {
            console.warn(`Theme ID "${themeId}" not found. Applying default theme.`);
            if (themes.default && themes.default.cssVariables) { // Ensure default exists
                 const defaultVars = themes.default.cssVariables;
                 for (const [key, value] of Object.entries(defaultVars)) { document.documentElement.style.setProperty(key, value); }
                 document.documentElement.style.setProperty('--theme-text-main', defaultVars['--theme-primary-dark']);
                 document.documentElement.style.setProperty('--theme-border-main', defaultVars['--theme-primary-dark']);
            }
        }
    }

    function getCurrentThemeId() {
        return DataManager.loadData('current_theme', 'default');
    }

    function setCurrentThemeId(themeId) {
        if (themes[themeId]) {
            DataManager.saveData('current_theme', themeId);
            applyTheme(themeId);
        } else {
            SharedUtils.showToast(`Attempted to set invalid theme: ${themeId}`, 3000, 'error');
        }
    }

    function getOwnedThemeIds() {
        return DataManager.loadData('owned_themes', ['default']);
    }

    function addOwnedThemeId(themeId) {
        if (themes[themeId]) {
            let owned = getOwnedThemeIds();
            if (!owned.includes(themeId)) {
                owned.push(themeId);
                DataManager.saveData('owned_themes', owned);
                SharedUtils.showToast(`Theme "${themes[themeId].name}" acquired!`, 2500, 'success');
                return true;
            }
        }
        return false;
    }

    function getAllThemes() {
        // Return a copy to prevent external modification
        return JSON.parse(JSON.stringify(themes));
    }

    return {
        applyTheme,
        getCurrentThemeId,
        setCurrentThemeId,
        getOwnedThemeIds,
        addOwnedThemeId,
        getAllThemes
    };
})();
