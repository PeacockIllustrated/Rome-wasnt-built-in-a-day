// js/main-hub.js
document.addEventListener('DOMContentLoaded', () => {
    const userTotalPointsDisplay = document.getElementById('userTotalPoints');
    const cityProsperityScoreDisplay = document.getElementById('cityProsperityScore');
    const currentYearDisplay = document.getElementById('currentYear');
    const districtNav = document.getElementById('districtNavigation'); // Keep this for unlock buttons on cards
    const cityMapPlaceholder = document.getElementById('cityMapPlaceholder');

    const districtMapConfig = {
        knowledge: {
            buildingId: 'map-building-knowledge',
            url: 'districts/knowledge_forum/knowledge.html',
            linkId: 'linkKnowledgeForum', // Corresponds to the 'Manage' button ID on the card
            statusId: 'statusKnowledgeForum', // Not directly used if status text is in summary card
            name: 'Knowledge Forum',
            summaryElementId: 'summary-knowledge'
        },
        health: {
            buildingId: 'map-building-health',
            url: 'districts/health_district/smoke-tracker.html',
            linkId: 'linkHealthDistrict', // Corresponds to the 'Manage' button ID on the card
            statusId: 'statusHealthDistrict', // Not directly used
            name: 'Health District',
            summaryElementId: 'summary-health'
        },
        emporium: {
            buildingId: 'map-building-emporium',
            url: 'districts/emporium/shop.html',
            linkId: 'linkEmporium', // Corresponds to the 'Manage' button ID on the card
            statusId: 'statusEmporium', // Not directly used
            name: 'Emporium',
            summaryElementId: 'summary-emporium'
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
        
        if (cityMapPlaceholder) {
            checkAllDistrictStatuses();
        } else {
            console.error("City Map Placeholder not found during init!");
        }
        setupDistrictControls(); 

        console.log("Rome Hub Initialized.");
        SharedUtils.showToast("Welcome to your Rome!", 2000);
        updateDashboardSummaries(); // Call after everything is set up
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
        if (isDistrictUnlocked(districtKey)) {
            SharedUtils.showToast(`${config.name} is already developed.`, 2000, 'info');
            return;
        }

        DataManager.saveData(`${HUB_DATA_PREFIX}unlocked_${districtKey}`, true);
        SharedUtils.showToast(`${config.name} District Unlocked!`, 2500, 'success');
        
        updateDistrictUIVisuals(districtKey, true); 
    }

    function updateDistrictUIVisuals(districtKey, animate = false) {
        const config = districtMapConfig[districtKey];
        if (!config) {
            console.warn(`No config found for district key: ${districtKey}`);
            return;
        }

        const buildingElement = document.getElementById(config.buildingId);
        // Link element is now the 'Manage' button on the card
        const manageButtonElement = document.getElementById(config.linkId); 
        const summaryElement = document.getElementById(config.summaryElementId);
        // Unlock button is now specifically within the summary card for that district
        const unlockButton = summaryElement ? summaryElement.querySelector(`.unlock-district-button[data-district="${districtKey}"]`) : null;


        if (!buildingElement) console.warn(`Building element not found for ID: ${config.buildingId}`);
        if (!manageButtonElement && districtKey !== 'emporium') console.warn(`Manage button (link) element not found for ID: ${config.linkId}`); // Emporium might have different button text
        if (!summaryElement) console.warn(`Summary element not found for ID: ${config.summaryElementId}`);


        const unlocked = isDistrictUnlocked(districtKey);

        if (buildingElement) {
            if (unlocked) {
                buildingElement.classList.remove('locked');
                
                if (animate) {
                    void buildingElement.offsetWidth; 
                    buildingElement.classList.add('dropping-in');
                    buildingElement.addEventListener('transitionend', () => {
                        buildingElement.classList.remove('dropping-in');
                    }, { once: true });
                }
                buildingElement.dataset.url = config.url;
                buildingElement.removeEventListener('click', navigateToDistrict);
                buildingElement.addEventListener('click', navigateToDistrict);
            } else {
                buildingElement.classList.add('locked');
                buildingElement.removeEventListener('click', navigateToDistrict);
            }
        }

        if (unlockButton) {
            unlockButton.style.display = unlocked ? 'none' : 'inline-block';
        }
        
        // If you want to visually change the manage button when locked/unlocked
        if (manageButtonElement) {
             manageButtonElement.classList.toggle('locked-link', !unlocked); // Example class
        }


        if (summaryElement) {
            const statusDisplay = summaryElement.querySelector('.district-summary-status');
            const dataDisplay = summaryElement.querySelector('.district-summary-data');

            if (statusDisplay) {
                statusDisplay.textContent = unlocked ? "Status: Operational" : "Status: Needs Development";
                if (districtKey === 'emporium') statusDisplay.textContent = "Status: Operational"; // Emporium always operational
            }
            
            if (dataDisplay) {
                if (unlocked) {
                    if (districtKey === 'knowledge') {
                        dataDisplay.textContent = "Insights Logged: " + DataManager.loadData('idky_moments', []).length;
                    } else if (districtKey === 'health') {
                         dataDisplay.textContent = "Smoke-Free Streak: " + DataManager.loadData('smoketrack_streak', 0) + " days";
                    } else if (districtKey === 'emporium') {
                        dataDisplay.textContent = "Themes Owned: " + ThemeManager.getOwnedThemeIds().length;
                    }
                } else {
                    dataDisplay.textContent = "Data: N/A";
                }
            }
            summaryElement.classList.toggle('locked-summary', !unlocked && districtKey !== 'emporium');
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
            updateDistrictUIVisuals(districtKey, false); 
        }
    }
    
    function setupDistrictControls() {
        // Event delegation for unlock buttons if they are dynamically added or many
        const summariesContainer = document.querySelector('.district-summaries-container');
        if (summariesContainer) {
            summariesContainer.addEventListener('click', (event) => {
                if (event.target.matches('.unlock-district-button')) {
                    const districtKey = event.target.dataset.district;
                    unlockDistrict(districtKey);
                }
            });
        }


        // For Emporium (always unlocked), ensure its building is clickable
        if (isDistrictUnlocked('emporium')) {
            const emporiumConfig = districtMapConfig.emporium;
            const emporiumBuilding = document.getElementById(emporiumConfig.buildingId);
            if (emporiumBuilding) {
                emporiumBuilding.classList.remove('locked'); 
                emporiumBuilding.dataset.url = emporiumConfig.url;
                emporiumBuilding.addEventListener('click', navigateToDistrict);
            }
        }
    }
    
    function updateDashboardSummaries() {
        for (const districtKey in districtMapConfig) {
            updateDistrictUIVisuals(districtKey, false); // Re-run to populate data correctly
        }
    }

    // --- INITIALIZE THE HUB ---
    initializeHub(); 
    // updateDashboardSummaries(); // This is now called at the end of initializeHub

}); // END OF DOMContentLoaded
