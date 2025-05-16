// js/theme-manager.js

const ThemeManager = (() => {
    // !!! IMPORTANT: Replace 'Rome-wasnt-built-in-a-day' with your actual repository name if different !!!
    const REPO_NAME_PREFIX = "/Rome-wasnt-built-in-a-day"; // Or "" if using a custom domain mapped to root

    const themes = {
        default_rome: {
            id: "default_rome",
            name: "Imperial Standard",
            cost: 0,
            description: "The classic look and feel of Rome, majestic and timeless.",
            previewImage: `${REPO_NAME_PREFIX}/assets/images/theme-previews/default_rome_preview.png`,
            previewColors: ["#A0522D", "#D2B48C", "#FFFFFF", "#800000"],
            cssVariables: {
                '--rome-font-family': "'VT323', monospace",
                '--rome-primary-color': '#795548', // Brown
                '--rome-text-color': '#3a2e20',    // Dark Brown text
                '--rome-background-color': '#fdf6e8', // Light Cream / Parchment Base BG
                '--rome-card-background': '#fffaf0',  // Creamy White for cards / Parchment Card BG
                '--rome-border-color': '#ddcba7',     // Tan border
                '--rome-accent-color': '#B71C1C',     // Imperial Red
                '--rome-accent-text-color': '#FFFFFF', // White text on accent
                // Generic theme vars mapping for default_rome
                '--theme-primary-dark': '#5D4037', // Darker Brown
                '--theme-primary-accent': '#B71C1C', // Imperial Red
                '--theme-secondary-accent': '#FFAB00', // Gold
                '--theme-tertiary-accent': '#D2B48C', // Parchment accent
                '--theme-highlight-accent': '#800000', // Deeper Red
                '--theme-light-bg': '#F5EFE6', // Light Parchment element BG
                '--theme-card-bg': '#FFF8E1', // Parchment Card actual BG
                '--theme-text-on-dark': '#FFF8E1', // Text on dark elements
                '--theme-page-bg': '#FDF6E3', // Main Parchment page background
            }
        },
        colosseum_sand: {
            id: "colosseum_sand",
            name: "Colosseum Sand",
            cost: 100,
            description: "Earthy tones inspired by the sands of the grand arena.",
            previewImage: `${REPO_NAME_PREFIX}/assets/images/theme-previews/colosseum_sand_preview.png`,
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
            previewImage: `${REPO_NAME_PREFIX}/assets/images/theme-previews/senate_marble_preview.png`,
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
            previewImage: `${REPO_NAME_PREFIX}/assets/images/theme-previews/night_watch_preview.png`,
            previewColors: ["#263238", "#CFD8DC", "#FF6F00", "#546E7A"], // Reordered for better visual flow
            cssVariables: {
                '--rome-font-family': "'VT323', monospace",
                // Core "Rome" variables for Night Watch
                '--rome-primary-color': '#455A64',      // Muted Blue-Grey (less harsh than pure black for primary)
                '--rome-text-color': '#CFD8DC',         // Light Grey text (readable on dark backgrounds)
                '--rome-background-color': '#263238',   // Very Dark Blue-Grey page background
                '--rome-card-background': '#37474F',    // Darker Grey for cards
                '--rome-border-color': '#546E7A',       // Medium Grey for borders
                '--rome-accent-color': '#FF8F00',       // Brighter Orange for primary accent
                '--rome-accent-text-color': '#1A1A1A',  // Dark text on orange accent for readability
                '--rome-secondary-color': '#FFB300',    // Secondary accent (Gold/Amber)
                '--rome-secondary-text-color': '#1A1A1A',// Dark text on gold/amber

                // Generic theme variables mapping for Night Watch
                '--theme-primary-dark': '#102027',      // Even darker for "darkest" elements
                '--theme-primary-accent': 'var(--rome-accent-color)', // Orange
                '--theme-secondary-accent': 'var(--rome-secondary-color)', // Gold/Amber
                '--theme-tertiary-accent': '#78909C',    // Muted Blue Grey for less emphasis
                '--theme-highlight-accent': '#FF6F00',    // Slightly different orange for highlights
                '--theme-light-bg': '#455A64',         // Mid-dark grey for "lighter" elements in this dark theme
                '--theme-card-bg': 'var(--rome-card-background)',
                '--theme-text-on-dark': 'var(--rome-text-color)', // Light grey for text on dark UI parts
                '--theme-page-bg': 'var(--rome-background-color)'
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
            // These generic mappings might need adjustment based on how `--rome-` variables are used
            document.documentElement.style.setProperty('--theme-text-main', themeVars['--rome-text-color']);
            document.documentElement.style.setProperty('--theme-border-main', themeVars['--rome-border-color-dark'] || themeVars['--rome-border-color']);
            // console.log(`Applied theme: ${themeToApply.name}`);
            return true;
        } else {
            console.warn(`Theme ID "${themeId}" not found. Applying default_rome theme.`);
            if (themes.default_rome && themes.default_rome.cssVariables) {
                 const defaultVars = themes.default_rome.cssVariables;
                 for (const [key, value] of Object.entries(defaultVars)) { document.documentElement.style.setProperty(key, value); }
                 document.documentElement.style.setProperty('--theme-text-main', defaultVars['--rome-text-color']);
                 document.documentElement.style.setProperty('--theme-border-main', defaultVars['--rome-border-color-dark'] || defaultVars['--rome-border-color']);
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
                return true;
            }
            return false;
        }
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
