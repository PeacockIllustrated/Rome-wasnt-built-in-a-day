// js/theme-manager.js

const ThemeManager = (() => {
    const themes = {
        default_rome: {
            id: "default_rome",
            name: "Imperial Standard",
            cost: 0,
            description: "The classic look and feel of Rome, majestic and timeless.",
            previewImage: "../../assets/images/theme-previews/default_rome_preview.png", // Corrected Path
            previewColors: ["#A0522D", "#D2B48C", "#FFFFFF", "#800000"],
            cssVariables: {
                '--rome-font-family': "'VT323', monospace",
                '--rome-primary-color': '#795548',
                '--rome-text-color': '#3a2e20',
                '--rome-background-color': '#fdf6e8',
                '--rome-card-background': '#fffaf0',
                '--rome-border-color': '#ddcba7',
                '--rome-accent-color': '#B71C1C',
                '--rome-accent-text-color': '#FFFFFF',
                '--theme-primary-dark': '#5D4037',
                '--theme-primary-accent': '#B71C1C',
                '--theme-secondary-accent': '#FFAB00',
                '--theme-tertiary-accent': '#D2B48C',
                '--theme-highlight-accent': '#800000',
                '--theme-light-bg': '#F5EFE6',
                '--theme-card-bg': '#FFF8E1',
                '--theme-text-on-dark': '#FFF8E1',
                '--theme-page-bg': '#FDF6E3',
            }
        },
        colosseum_sand: {
            id: "colosseum_sand",
            name: "Colosseum Sand",
            cost: 100,
            description: "Earthy tones inspired by the sands of the grand arena.",
            previewImage: "../../assets/images/theme-previews/colosseum_sand_preview.png", // Corrected Path
            previewColors: ["#DEB887", "#F0E68C", "#3E2723", "#BF360C"],
            cssVariables: {
                '--rome-font-family': "'VT323', monospace",
                '--rome-primary-color': '#BCAAA4',
                '--rome-text-color': '#4E342E',
                '--rome-background-color': '#EFEBE9',
                '--rome-card-background': '#FFFFFF',
                '--rome-border-color': '#A1887F',
                '--rome-accent-color': '#BF360C',
                '--rome-accent-text-color': '#FFFFFF',
                '--theme-primary-dark': '#3E2723',
                '--theme-primary-accent': '#BF360C',
                '--theme-secondary-accent': '#FFAB00',
                '--theme-tertiary-accent': '#DEB887',
                '--theme-highlight-accent': '#D84315',
                '--theme-light-bg': '#F5F5F5',
                '--theme-card-bg': '#FFFFFF',
                '--theme-text-on-dark': '#FFFFFF',
                '--theme-page-bg': '#EFEBE9'
            }
        },
        senate_marble: {
            id: "senate_marble",
            name: "Senate Marble",
            cost: 150,
            description: "Cool, elegant whites and greys, fit for senatorial decrees.",
            previewImage: "../../assets/images/theme-previews/senate_marble_preview.png", // Corrected Path
            previewColors: ["#E0E0E0", "#BDBDBD", "#212121", "#4A148C"],
            cssVariables: {
                '--rome-font-family': "'VT323', monospace",
                '--rome-primary-color': '#607D8B',
                '--rome-text-color': '#263238',
                '--rome-background-color': '#ECEFF1',
                '--rome-card-background': '#FFFFFF',
                '--rome-border-color': '#B0BEC5',
                '--rome-accent-color': '#4A148C',
                '--rome-accent-text-color': '#FFFFFF',
                '--theme-primary-dark': '#263238',
                '--theme-primary-accent': '#4A148C',
                '--theme-secondary-accent': '#CFD8DC',
                '--theme-tertiary-accent': '#78909C',
                '--theme-highlight-accent': '#5E35B1',
                '--theme-light-bg': '#FAFAFA',
                '--theme-card-bg': '#FFFFFF',
                '--theme-text-on-dark': '#FFFFFF',
                '--theme-page-bg': '#ECEFF1'
            }
        },
        night_watch: {
            id: "night_watch",
            name: "Night Watch",
            cost: 200,
            description: "Darker hues for a city under the stars.",
            previewImage: "../../assets/images/theme-previews/night_watch_preview.png", // Corrected Path
            previewColors: ["#263238", "#455A64", "#CFD8DC", "#FF6F00"],
            cssVariables: {
                '--rome-font-family': "'VT323', monospace",
                '--rome-primary-color': '#37474F',
                '--rome-text-color': '#CFD8DC',
                '--rome-background-color': '#263238',
                '--rome-card-background': '#37474F',
                '--rome-border-color': '#546E7A',
                '--rome-accent-color': '#FF6F00',
                '--rome-accent-text-color': '#263238',
                '--theme-primary-dark': '#102027',
                '--theme-primary-accent': '#FF6F00',
                '--theme-secondary-accent': '#FFAB40',
                '--theme-tertiary-accent': '#78909C',
                '--theme-highlight-accent': '#DD2C00',
                '--theme-light-bg': '#455A64',
                '--theme-card-bg': '#37474F',
                '--theme-text-on-dark': '#CFD8DC',
                '--theme-page-bg': '#263238'
            }
        }
    };

    function applyTheme(themeId) {
        const themeToApply = themes[themeId] || themes.default_rome;
        if (themeToApply && themeToApply.cssVariables) {
            const themeVars = themeToApply.cssVariables;
            for (const [key, value] of Object.entries(themeVars)) {
                document.documentElement.style.setProperty(key, value);
            }
            document.documentElement.style.setProperty('--theme-text-main', themeVars['--theme-primary-dark'] || themeVars['--rome-text-color']);
            document.documentElement.style.setProperty('--theme-border-main', themeVars['--theme-primary-dark'] || themeVars['--rome-border-color']);
            // console.log(`Applied theme: ${themeToApply.name}`); // Keep for debugging if needed
            return true;
        } else {
            console.warn(`Theme ID "${themeId}" not found. Applying default_rome theme.`);
            if (themes.default_rome && themes.default_rome.cssVariables) {
                 const defaultVars = themes.default_rome.cssVariables;
                 for (const [key, value] of Object.entries(defaultVars)) { document.documentElement.style.setProperty(key, value); }
                 document.documentElement.style.setProperty('--theme-text-main', defaultVars['--theme-primary-dark'] || defaultVars['--rome-text-color']);
                 document.documentElement.style.setProperty('--theme-border-main', defaultVars['--theme-primary-dark'] || defaultVars['--rome-border-color']);
            }
            return false;
        }
    }

    function getCurrentThemeId() {
        return DataManager.loadData('current_theme_rome', 'default_rome');
    }

    function setCurrentThemeId(themeId) {
        if (themes[themeId]) {
            DataManager.saveData('current_theme_rome', themeId);
            applyTheme(themeId);
            return true;
        } else {
            SharedUtils.showToast(`Attempted to set invalid theme: ${themeId}`, 3000, 'error');
            return false;
        }
    }

    function getOwnedThemeIds() {
        const owned = DataManager.loadData('owned_themes_rome', ['default_rome']);
        if (!owned.includes('default_rome')) {
            owned.push('default_rome');
        }
        return owned;
    }

    function addOwnedThemeId(themeId) {
        if (themes[themeId]) {
            let owned = getOwnedThemeIds();
            if (!owned.includes(themeId)) {
                owned.push(themeId);
                DataManager.saveData('owned_themes_rome', owned);
                // SharedUtils.showToast(`Theme "${themes[themeId].name}" acquired!`, 2500, 'success'); // Toast is now in shop-script
                return true;
            }
            // SharedUtils.showToast(`Theme "${themes[themeId].name}" already owned.`, 2000, 'info'); // Toast handled in shop-script
            return false;
        }
        // SharedUtils.showToast(`Cannot acquire unknown theme: ${themeId}`, 3000, 'error'); // Toast handled in shop-script
        return false;
    }

    function getAllThemes() {
        return Object.entries(themes).map(([id, themeData]) => ({
            id: id,
            ...themeData
        }));
    }
    
    function getThemeById(themeId) {
        return themes[themeId] ? { id: themeId, ...themes[themeId] } : null;
    }

    return {
        applyTheme,
        getCurrentThemeId,
        setCurrentThemeId,
        getOwnedThemeIds,
        addOwnedThemeId,
        getAllThemes,
        getThemeById
    };
})();
