// js/main-hub.js

document.addEventListener('DOMContentLoaded', () => {
    const userTotalPointsDisplay = document.getElementById('userTotalPoints');
    const cityProsperityScoreDisplay = document.getElementById('cityProsperityScore');
    const currentYearDisplay = document.getElementById('currentYear');

    function initializeHub() {
        // Apply the saved theme
        const currentThemeId = ThemeManager.getCurrentThemeId();
        ThemeManager.applyTheme(currentThemeId);

        // Load and display user points
        updatePointsDisplay();

        // Set current year in footer
        if (currentYearDisplay) {
            currentYearDisplay.textContent = new Date().getFullYear();
        }
        
        // Basic daily check example (can be expanded)
        performDailyGlobalTasks();

        console.log("Rome Hub Initialized.");
        SharedUtils.showToast("Welcome to your Rome!", 2000);

        // TODO: Add logic to update district statuses based on DataManager
        // TODO: Add logic for city visualization based on progress
    }

    function updatePointsDisplay() {
        if (userTotalPointsDisplay) {
            userTotalPointsDisplay.textContent = DataManager.getUserPoints();
        }
    }
    
    function performDailyGlobalTasks() {
        const today = SharedUtils.getCurrentDateString();
        const lastProcessed = DataManager.getLastProcessedDate();

        if (today !== lastProcessed) {
            console.log("Performing daily global tasks for the first time today:", today);
            // Example: Grant a small daily login bonus for visiting the hub
            // DataManager.addPoints(1, "Daily Hub Visit");
            // updatePointsDisplay(); // Update display if points changed

            DataManager.setLastProcessedDate(today);
            console.log("Last processed date updated to:", today);
        } else {
            console.log("Daily global tasks already performed for today:", today);
        }
    }


    // --- Particle System for Hub (Optional - can be added later) ---
    // const particleCanvasRome = document.getElementById('particleCanvasRome');
    // let romeCtx, romeParticles = [];
    // if (particleCanvasRome) {
    //     romeCtx = particleCanvasRome.getContext('2d');
    //     // Initialize canvas size etc.
    // }
    // function createRomeParticle() { /* ... */ }
    // function updateAndDrawRomeParticles() { /* ... */ }

    initializeHub();
});
