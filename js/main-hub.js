// js/main-hub.js

document.addEventListener('DOMContentLoaded', () => {
    const userTotalPointsDisplay = document.getElementById('userTotalPoints');
    const cityProsperityScoreDisplay = document.getElementById('cityProsperityScore');
    const currentYearDisplay = document.getElementById('currentYear');
    const districtNav = document.getElementById('districtNavigation');
    const cityMapPlaceholder = document.getElementById('cityMapPlaceholder'); // Get placeholder

    // --- District Configuration ---
    const districtMapConfig = {
        knowledge: {
            buildingId: 'map-building-knowledge',
            url: 'districts/knowledge_forum/knowledge.html',
            linkId: 'linkKnowledgeForum',
            statusId: 'statusKnowledgeForum',
            name: 'Knowledge Forum' // Added for toast messages
        },
        health: {
            buildingId: 'map-building-health',
            url: 'districts/health_district/smoke-tracker.html',
            linkId: 'linkHealthDistrict',
            statusId: 'statusHealthDistrict',
            name: 'Health District' // Added for toast messages
        },
        emporium: {
            buildingId: 'map-building-emporium',
            url: 'districts/emporium/shop.html',
            linkId: 'linkEmporium',
            statusId: 'statusEmporium',
            name: 'Emporium'
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
        
        // Ensure DOM is ready for building manipulation before checking statuses
        if (cityMapPlaceholder) { // Check if map placeholder exists
            checkAllDistrictStatuses(); // Check and apply status on load FIRST
        } else {
            console.error("City Map Placeholder not found during init!");
        }
        setupDistrictControls(); // Then setup controls

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
            DataManager.setLastProcessedDate(today);
        }
    }

    function isDistrictUnlocked(districtKey) {
        if (districtKey === 'emporium') return true;
        return DataManager.loadData(`${HUB_DATA_PREFIX}unlocked_${districtKey}`, false);
    }

    function unlockDistrict(districtKey) {
        const config = districtMapConfig[districtKey];
        if (!config) return;

        // Check if already unlocked to prevent re-processing (optional)
        if (isDistrictUnlocked(districtKey)) {
            SharedUtils.showToast(`${config.name} is already developed.`, 2000, 'info');
            return;
        }

        DataManager.saveData(`${HUB_DATA_PREFIX}unlocked_${districtKey}`, true);
        SharedUtils.showToast(`${config.name} District Unlocked!`, 2500, 'success');
        
        updateDistrictUIVisuals(districtKey);

        // Optional: Add a visual flourish when a building appears
        const buildingElement = document.getElementById(config.buildingId);
        if (buildingElement) {
            buildingElement.style.opacity = '0';
            buildingElement.style.transform = 'scale(0.8) translateY(20px)';
            // Force reflow before applying transition start state if using display:none
            // buildingElement.offsetHeight; // This is a trick to force reflow
            
            // Make sure 'locked' class is removed BEFORE triggering animation
            // If 'locked' uses display:none, the transition won't work as expected.
            // We might need to switch .locked to use opacity: 0 and pointer-events: none
            // instead of display: none for smooth transitions.
            // For now, the CSS uses display:none, so the building just appears.
            
            // If you change .locked in CSS to opacity: 0, then this would work:
            // setTimeout(() => {
            //     buildingElement.style.opacity = '1';
            //     buildingElement.style.transform = 'scale(1) translateY(0)';
            // }, 50); // Small delay
        }
    }

    function updateDistrictUIVisuals(districtKey) {
        const config = districtMapConfig[districtKey];
        if (!config) {
            console.warn(`No config found for district key: ${districtKey}`);
            return;
        }

        const buildingElement = document.getElementById(config.buildingId);
        const linkElement = document.getElementById(config.linkId);
        const statusElement = document.getElementById(config.statusId);
        const unlockButton = districtNav.querySelector(`.unlock-district-button[data-district="${districtKey}"]`);

        if (!buildingElement) console.warn(`Building element not found for ID: ${config.buildingId}`);
        if (!linkElement) console.warn(`Link element not found for ID: ${config.linkId}`);
        // statusElement and unlockButton might be null for emporium, which is fine.

        const unlocked = isDistrictUnlocked(districtKey);

        if (buildingElement) {
            if (unlocked) {
                buildingElement.classList.remove('locked'); // This should make it visible via CSS
                buildingElement.dataset.url = config.url;
                buildingElement.removeEventListener('click', navigateToDistrict); // Prevent duplicates
                buildingElement.addEventListener('click', navigateToDistrict);
            } else {
                buildingElement.classList.add('locked'); // This should hide it via CSS
                buildingElement.removeEventListener('click', navigateToDistrict);
            }
        }

        if (unlockButton) {
            unlockButton.style.display = unlocked ? 'none' : 'inline-block';
        }

        if (linkElement) {
            linkElement.classList.toggle('locked-link', !unlocked); // Optional styling
        }
        if (statusElement) {
            statusElement.textContent = unlocked ? "(Developed)" : "(Under Maint.)";
            if (districtKey === 'emporium') statusElement.textContent = "(Open)"; // Override for emporium
        }
    }
    
    function navigateToDistrict(event) {
        const url = event.currentTarget.dataset.url;
        if (url) {
            window.location.href = url;
        }
    }

    function checkAllDistrictStatuses() {
        console.log("Checking all district statuses on load...");
        for (const districtKey in districtMapConfig) {
            console.log(`Updating UI for ${districtKey}`);
            updateDistrictUIVisuals(districtKey);
        }
    }

    function setupDistrictControls() {
        const unlockButtons = districtNav.querySelectorAll('.unlock-district-button');
        unlockButtons.forEach(button => {
            button.addEventListener('click', (event) => {
                const districtKey = event.target.dataset.district;
                unlockDistrict(districtKey);
            });
        });

        // For Emporium (always unlocked), ensure its building is clickable
        if (isDistrictUnlocked('emporium')) {
            const emporiumConfig = districtMapConfig.emporium;
            const emporiumBuilding = document.getElementById(emporiumConfig.buildingId);
            if (emporiumBuilding) {
                emporiumBuilding.classList.remove('locked'); // Should already be not locked by CSS default, but good practice
                emporiumBuilding.dataset.url = emporiumConfig.url;
                emporiumBuilding.addEventListener('click', navigateToDistrict);
            }
        }
    }

    initializeHub();
});
