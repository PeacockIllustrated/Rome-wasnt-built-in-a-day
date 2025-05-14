// js/main-hub.js
document.addEventListener('DOMContentLoaded', () => {
    const userTotalPointsDisplay = document.getElementById('userTotalPoints');
    const cityProsperityScoreDisplay = document.getElementById('cityProsperityScore');
    const currentYearDisplay = document.getElementById('currentYear');
    // districtNav is not directly used for main nav anymore, but unlock buttons are on cards
    const cityMapPlaceholder = document.getElementById('cityMapPlaceholder');
    const buildingNameTag = document.getElementById('buildingNameTag');

    let selectedBuildingElement = null;
    let nameTagTimeout = null;

    const districtMapConfig = {
        knowledge: {
            buildingId: 'map-building-knowledge',
            url: 'districts/knowledge_forum/knowledge.html',
            linkId: 'linkKnowledgeForum', // ID of the 'Manage' button on its card
            name: 'Knowledge Forum',
            summaryElementId: 'summary-knowledge'
        },
        health: {
            buildingId: 'map-building-health',
            url: 'districts/health_district/smoke-tracker.html',
            linkId: 'linkHealthDistrict', // ID of the 'Manage' button on its card
            name: 'Health District',
            summaryElementId: 'summary-health'
        },
        emporium: {
            buildingId: 'map-building-emporium',
            url: 'districts/emporium/shop.html',
            linkId: 'linkEmporium', // ID of the 'Manage' button on its card
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
            checkAllDistrictStatuses(); // Set initial visibility and data-name attributes
        } else {
            console.error("City Map Placeholder not found during init!");
        }
        setupDistrictControls(); // For unlock buttons on cards
        setupMapInteractions(); // For map building clicks

        console.log("Rome Hub Initialized.");
        SharedUtils.showToast("Welcome to your Rome!", 2000);
        updateDashboardSummaries(); // Populate dashboard cards
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
        
        updateDistrictUIVisuals(districtKey, true); // Animate the unlocked building
        updateDashboardSummaries(); // Refresh dashboard card for this district
    }

    function updateDistrictUIVisuals(districtKey, animate = false) {
        const config = districtMapConfig[districtKey];
        if (!config) {
            console.warn(`No config found for district key: ${districtKey}`);
            return;
        }

        const buildingElement = document.getElementById(config.buildingId);
        const summaryElement = document.getElementById(config.summaryElementId);
        const unlockButton = summaryElement ? summaryElement.querySelector(`.unlock-district-button[data-district="${districtKey}"]`) : null;
        // const manageButtonElement = document.getElementById(config.linkId); // For styling the manage button

        if (!buildingElement) console.warn(`Building element not found for ID: ${config.buildingId}`);
        if (!summaryElement) console.warn(`Summary element not found for ID: ${config.summaryElementId}`);

        const unlocked = isDistrictUnlocked(districtKey);

        if (buildingElement) {
            // Ensure data attributes are set for name tag and navigation
            buildingElement.dataset.url = config.url;
            buildingElement.dataset.districtKey = districtKey;
            if (!buildingElement.dataset.name) { // Set if not already in HTML
                 buildingElement.dataset.name = config.name;
            }

            if (unlocked) {
                buildingElement.classList.remove('locked');
                
                if (animate) {
                    void buildingElement.offsetWidth; // Force reflow
                    buildingElement.classList.add('dropping-in');
                    buildingElement.addEventListener('transitionend', () => {
                        buildingElement.classList.remove('dropping-in');
                    }, { once: true });
                }
                // Click listener is handled globally by setupMapInteractions
            } else {
                buildingElement.classList.add('locked');
            }
        }

        if (unlockButton) {
            unlockButton.style.display = unlocked ? 'none' : 'inline-block';
        }

        // Update dashboard card content
        if (summaryElement) {
            const statusDisplay = summaryElement.querySelector('.district-summary-status');
            const dataDisplay = summaryElement.querySelector('.district-summary-data');
            const manageButton = summaryElement.querySelector('.manage-district-button');


            if (statusDisplay) {
                statusDisplay.textContent = unlocked ? "Status: Operational" : "Status: Needs Development";
                if (districtKey === 'emporium') statusDisplay.textContent = "Status: Operational";
            }
            
            if (dataDisplay) {
                if (unlocked) {
                    // Fetch and display actual data
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
            if(manageButton) {
                // Optionally hide/disable manage button if locked
                // manageButton.style.display = unlocked ? 'inline-block' : 'none';
            }
        }
    }
    
    function setupMapInteractions() {
        if (!cityMapPlaceholder) return;

        cityMapPlaceholder.addEventListener('click', (event) => {
            const clickedElement = event.target;

            if (clickedElement.classList.contains('map-asset') && !clickedElement.classList.contains('locked')) {
                const districtKey = clickedElement.dataset.districtKey;
                const buildingName = clickedElement.dataset.name || "Structure"; // Fallback name
                const buildingUrl = clickedElement.dataset.url;

                if (selectedBuildingElement === clickedElement) {
                    if (buildingUrl) {
                        window.location.href = buildingUrl;
                    }
                    hideNameTag();
                    selectedBuildingElement = null;
                } else {
                    showNameTag(clickedElement, buildingName);
                    selectedBuildingElement = clickedElement;
                }
            } else {
                if (selectedBuildingElement) {
                    hideNameTag();
                    selectedBuildingElement = null;
                }
            }
        });
    }

    function showNameTag(buildingElement, name) {
        if (!buildingNameTag || !buildingElement) return;
        buildingNameTag.textContent = name;

        const buildingRect = buildingElement.getBoundingClientRect();
        const placeholderRect = cityMapPlaceholder.getBoundingClientRect();

        let tagTop = (buildingRect.bottom - placeholderRect.top) + 5;
        let tagLeft = (buildingRect.left - placeholderRect.left) + (buildingRect.width / 2);
        
        buildingNameTag.style.left = `0px`; // Reset before measuring
        buildingNameTag.style.top = `0px`; // Reset before measuring
        buildingNameTag.classList.add('visible'); // Make it visible to measure its dimensions

        const tagWidth = buildingNameTag.offsetWidth;
        const tagHeight = buildingNameTag.offsetHeight;

        tagLeft -= (tagWidth / 2); // Center the tag

        // Boundary checks
        if (tagLeft < 5) tagLeft = 5; // Add some padding from edge
        if (tagLeft + tagWidth > placeholderRect.width - 5) {
            tagLeft = placeholderRect.width - tagWidth - 5;
        }
        if (tagTop + tagHeight > placeholderRect.height - 5) {
            tagTop = (buildingRect.top - placeholderRect.top) - tagHeight - 5; // Position above
        }
         if (tagTop < 5) tagTop = 5; // Prevent going off top

        buildingNameTag.style.left = `${tagLeft}px`;
        buildingNameTag.style.top = `${tagTop}px`;
        
        clearTimeout(nameTagTimeout);
        nameTagTimeout = setTimeout(() => {
            if (selectedBuildingElement === buildingElement) {
                hideNameTag();
                selectedBuildingElement = null;
            }
        }, 3000);
    }

    function hideNameTag() {
        if (!buildingNameTag) return;
        buildingNameTag.classList.remove('visible');
        clearTimeout(nameTagTimeout);
    }
    
    function checkAllDistrictStatuses() {
        console.log("Checking all district statuses on load...");
        for (const districtKey in districtMapConfig) {
            updateDistrictUIVisuals(districtKey, false); // No animation on initial load
        }
    }
    
    function setupDistrictControls() {
        const summariesContainer = document.querySelector('.district-summaries-container');
        if (summariesContainer) {
            summariesContainer.addEventListener('click', (event) => {
                if (event.target.matches('.unlock-district-button')) {
                    const districtKey = event.target.dataset.district;
                    unlockDistrict(districtKey);
                }
                // Could also handle manage button clicks here if they don't have hrefs
            });
        }
    }
    
    function updateDashboardSummaries() {
        for (const districtKey in districtMapConfig) {
            updateDistrictUIVisuals(districtKey, false); // Refresh data on cards
        }
    }

    // --- INITIALIZE THE HUB ---
    initializeHub();

}); // END OF DOMContentLoaded
