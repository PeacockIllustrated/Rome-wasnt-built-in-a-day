// js/main-hub.js

document.addEventListener('DOMContentLoaded', () => {
    const userTotalPointsDisplay = document.getElementById('userTotalPoints');
    const cityProsperityScoreDisplay = document.getElementById('cityProsperityScore');
    const currentYearDisplay = document.getElementById('currentYear');
    const districtNav = document.getElementById('districtNavigation');

    // --- District Configuration ---
    // Link building IDs on the map to district keys and their URLs
    const districtMapConfig = {
        knowledge: {
            buildingId: 'map-building-knowledge',
            url: 'districts/knowledge_forum/knowledge.html',
            linkId: 'linkKnowledgeForum',
            statusId: 'statusKnowledgeForum'
        },
        health: {
            buildingId: 'map-building-health',
            url: 'districts/health_district/smoke-tracker.html',
            linkId: 'linkHealthDistrict',
            statusId: 'statusHealthDistrict'
        },
        emporium: { // Emporium is "unlocked" by default
            buildingId: 'map-building-emporium',
            url: 'districts/emporium/shop.html',
            linkId: 'linkEmporium',
            statusId: 'statusEmporium'
        }
    };
    const HUB_DATA_PREFIX = 'romehub_';

    function initializeHub() {
        ThemeManager.applyTheme(ThemeManager.getCurrentThemeId());
        updatePointsDisplay();
        if (currentYearDisplay) {
            currentYearDisplay.textContent = new Date().getFullYear();
        }
        performDailyGlobalTasks();
        setupDistrictControls();
        checkAllDistrictStatuses(); // Check and apply status on load

        console.log("Rome Hub Initialized.");
        SharedUtils.showToast("Welcome to your Rome!", 2000);
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
            // DataManager.addPoints(1, "Daily Hub Visit"); // Example
            // updatePointsDisplay();
            DataManager.setLastProcessedDate(today);
        }
    }

    function isDistrictUnlocked(districtKey) {
        if (districtKey === 'emporium') return true; // Emporium always unlocked for now
        return DataManager.loadData(`${HUB_DATA_PREFIX}unlocked_${districtKey}`, false);
    }

    function unlockDistrict(districtKey) {
        if (!districtMapConfig[districtKey]) return;

        DataManager.saveData(`${HUB_DATA_PREFIX}unlocked_${districtKey}`, true);
        SharedUtils.showToast(`${districtMapConfig[districtKey].linkId.replace('link', '')} District Unlocked!`, 2500, 'success');
        
        // Update the specific district's UI
        updateDistrictUIVisuals(districtKey);
    }

    function updateDistrictUIVisuals(districtKey) {
        const config = districtMapConfig[districtKey];
        const buildingElement = document.getElementById(config.buildingId);
        const linkElement = document.getElementById(config.linkId);
        const statusElement = document.getElementById(config.statusId);
        const unlockButton = districtNav.querySelector(`.unlock-district-button[data-district="${districtKey}"]`);

        if (isDistrictUnlocked(districtKey)) {
            if (buildingElement) {
                buildingElement.classList.remove('locked');
                // Add click listener if not already present or if re-enabled
                buildingElement.removeEventListener('click', navigateToDistrict); // Remove old one first
                buildingElement.addEventListener('click', navigateToDistrict);
                buildingElement.dataset.url = config.url; // Store URL for click handler
            }
            if (unlockButton) {
                unlockButton.style.display = 'none';
            }
            if (linkElement) {
                linkElement.classList.remove('locked-link');
            }
            if (statusElement) {
                statusElement.textContent = "(Developed)";
            }
        } else {
            // This part handles initial setup for locked districts
            if (buildingElement) {
                buildingElement.classList.add('locked');
            }
            if (unlockButton) {
                unlockButton.style.display = 'inline-block';
            }
            if (linkElement) {
                // linkElement.classList.add('locked-link'); // Optional: style the link itself
            }
            if (statusElement) {
                statusElement.textContent = "(Under Maint.)"; // Placeholder for locked
            }
        }
    }
    
    function navigateToDistrict(event) {
        const url = event.currentTarget.dataset.url;
        if (url) {
            window.location.href = url;
        }
    }

    function checkAllDistrictStatuses() {
        for (const districtKey in districtMapConfig) {
            updateDistrictUIVisuals(districtKey);
        }
    }

    function setupDistrictControls() {
        const unlockButtons = districtNav.querySelectorAll('.unlock-district-button');
        unlockButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const districtKey = event.target.dataset.district;
                // For testing, unlock immediately. Later, you might add cost checks.
                unlockDistrict(districtKey);
            });
        });

        // Add initial click listeners for always-unlocked buildings like Emporium
        const emporiumBuilding = document.getElementById(districtMapConfig.emporium.buildingId);
        if (emporiumBuilding) {
            emporiumBuilding.dataset.url = districtMapConfig.emporium.url;
            emporiumBuilding.addEventListener('click', navigateToDistrict);
        }
    }

    initializeHub();
});
