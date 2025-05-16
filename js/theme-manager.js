// js/theme-manager.js

const ThemeManager = (() => {
    // Updated themes object with previewImage and previewColors
    // IMPORTANT: Ensure these image paths are correct relative to your deployment.
    // Using root-relative paths like '/assets/...' is often safest if your site root is consistent.
    const themes = {
        default_rome: { // Changed 'default' to 'default_rome' to match shop-script's initial data
            id: "default_rome", // Added id for consistency
            name: "Imperial Standard",
            cost: 0,
            description: "The classic look and feel of Rome, majestic and timeless.",
            previewImage: "/assets/images/theme-previews/default_rome_preview.png",
            previewColors: ["#A0522D", "#D2B48C", "#FFFFFF", "#800000"], // Example parchment/gold/red
            cssVariables: {
                // Define your --rome-prefixed CSS variables for this theme
                // These are just placeholders, replace with actual VT323/Parchment theme vars
                '--rome-font-family': "'VT323', monospace",
                '--rome-primary-color': '#795548', // Brown
                '--rome-text-color': '#3a2e20',    // Dark Brown
                '--rome-background-color': '#fdf6e8', // Light Cream
                '--rome-card-background': '#fffaf0',  // Creamy White
                '--rome-border-color': '#ddcba7',     // Tan border
                '--rome-accent-color': '#B71C1C',     // Imperial Red
                '--rome-accent-text-color': '#FFFFFF',
                // ... other relevant variables for this theme
                // These generic theme variables will be updated by these
                '--theme-primary-dark': '#5D4037', // Darker Brown for a "dark" element
                '--theme-primary-accent': '#B71C1C', // Imperial Red
                '--theme-secondary-accent': '#FFAB00', // Gold
                '--theme-tertiary-accent': '#D2B48C', // Parchment accent
                '--theme-highlight-accent': '#800000', // Deeper Red
                '--theme-light-bg': '#F5EFE6', // Light Parchment
                '--theme-card-bg': '#FFF8E1', // Parchment Card
                '--theme-text-on-dark': '#FFF8E1',
                '--theme-page-bg': '#FDF6E3', // Main Parchment page background
            }
        },
        colosseum_sand: {
            id: "colosseum_sand",
            name: "Colosseum Sand",
            cost: 100,
            description: "Earthy tones inspired by the sands of the grand arena.",
            previewImage: "/assets/images/theme-previews/colosseum_sand_preview.png",
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
                '--theme-secondary-accent': '#FFAB00', // Gold accent
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
            previewImage: "/assets/images/theme-previews/senate_marble_preview.png",
            previewColors: ["#E0E0E0", "#BDBDBD", "#212121", "#4A148C"],
            cssVariables: {
                '--rome-font-family': "'VT323', monospace",
                '--rome-primary-color': '#607D8B', // Blue Grey
                '--rome-text-color': '#263238',    // Dark Blue Grey
                '--rome-background-color': '#ECEFF1', // Light Blue Grey
                '--rome-card-background': '#FFFFFF',  // White
                '--rome-border-color': '#B0BEC5',     // Medium Blue Grey
                '--rome-accent-color': '#4A148C',     // Deep Purple
                '--rome-accent-text-color': '#FFFFFF',

                '--theme-primary-dark': '#263238',
                '--theme-primary-accent': '#4A148C', // Purple
                '--theme-secondary-accent': '#CFD8DC', // Light Grey
                '--theme-tertiary-accent': '#78909C', // Grey
                '--theme-highlight-accent': '#5E35B1', // Lighter Purple
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
            previewImage: "/assets/images/theme-previews/night_watch_preview.png",
            previewColors: ["#263238", "#455A64", "#CFD8DC", "#FF6F00"],
            cssVariables: {
                '--rome-font-family': "'VT323', monospace",
                '--rome-primary-color': '#37474F', // Dark Grey
                '--rome-text-color': '#CFD8DC',    // Light Grey Text
                '--rome-background-color': '#263238', // Very Dark Grey BG
                '--rome-card-background': '#37474F',  // Dark Grey Card
                '--rome-border-color': '#546E7A',     // Medium Grey Border
                '--rome-accent-color': '#FF6F00',     // Orange Accent
                '--rome-accent-text-color': '#263238',

                '--theme-primary-dark': '#102027',
                '--theme-primary-accent': '#FF6F00', // Orange
                '--theme-secondary-accent': '#FFAB40', // Lighter Orange
                '--theme-tertiary-accent': '#78909C', // Muted Blue Grey
                '--theme-highlight-accent': '#DD2C00', // Deep Orange/Red
                '--theme-light-bg': '#455A64', // Mid-dark grey for contrast
                '--theme-card-bg': '#37474F',
                '--theme-text-on-dark': '#CFD8DC', // Text on dark elements
                '--theme-page-bg': '#263238' // Main page background
            }
        }
        // Add other themes from your old ThemeManager here, converting their variables
    };

    function applyTheme(themeId) {
        const themeToApply = themes[themeId] || themes.default_rome; // Fallback to default_rome
        if (themeToApply && themeToApply.cssVariables) {
            const themeVars = themeToApply.cssVariables;
            for (const [key, value] of Object.entries(themeVars)) {
                document.documentElement.style.setProperty(key, value);
            }
            // These derived variables might still be useful if your _base.css or components rely on them
            // If your new --rome- variables cover all cases, these might become redundant
            document.documentElement.style.setProperty('--theme-text-main', themeVars['--theme-primary-dark'] || themeVars['--rome-text-color']);
            document.documentElement.style.setProperty('--theme-border-main', themeVars['--theme-primary-dark'] || themeVars['--rome-border-color']);
            console.log(`Applied theme: ${themeToApply.name}`);
            return true; // Indicate success
        } else {
            console.warn(`Theme ID "${themeId}" not found. Applying default_rome theme.`);
            if (themes.default_rome && themes.default_rome.cssVariables) {
                 const defaultVars = themes.default_rome.cssVariables;
                 for (const [key, value] of Object.entries(defaultVars)) { document.documentElement.style.setProperty(key, value); }
                 document.documentElement.style.setProperty('--theme-text-main', defaultVars['--theme-primary-dark'] || defaultVars['--rome-text-color']);
                 document.documentElement.style.setProperty('--theme-border-main', defaultVars['--theme-primary-dark'] || defaultVars['--rome-border-color']);
            }
            return false; // Indicate failure or fallback
        }
    }

    function getCurrentThemeId() {
        return DataManager.loadData('current_theme_rome', 'default_rome'); // Use a unique key
    }

    function setCurrentThemeId(themeId) {
        if (themes[themeId]) {
            DataManager.saveData('current_theme_rome', themeId);
            applyTheme(themeId); // Apply it visually
            return true;
        } else {
            SharedUtils.showToast(`Attempted to set invalid theme: ${themeId}`, 3000, 'error');
            return false;
        }
    }

    function getOwnedThemeIds() {
        // Ensure 'default_rome' is always owned
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
                SharedUtils.showToast(`Theme "${themes[themeId].name}" acquired!`, 2500, 'success');
                return true;
            }
            SharedUtils.showToast(`Theme "${themes[themeId].name}" already owned.`, 2000, 'info');
            return false; // Already owned
        }
        SharedUtils.showToast(`Cannot acquire unknown theme: ${themeId}`, 3000, 'error');
        return false; // Theme does not exist
    }

    function getAllThemes() {
        // Return a structured array of theme objects, ensuring each has an 'id'
        return Object.entries(themes).map(([id, themeData]) => ({
            id: id, // Ensure the id is part of the object
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
        getThemeById // Expose this if needed by shop-script for direct lookups
    };
})();
