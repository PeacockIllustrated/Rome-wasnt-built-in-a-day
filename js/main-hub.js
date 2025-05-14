// js/main-hub.js
document.addEventListener('DOMContentLoaded', () => {
    // ... (keep existing const declarations: userTotalPointsDisplay, etc.)
    const cityMapPlaceholder = document.getElementById('cityMapPlaceholder');

    const districtMapConfig = {
        knowledge: {
            buildingId: 'map-building-knowledge',
            url: 'districts/knowledge_forum/knowledge.html',
            linkId: 'linkKnowledgeForum',
            statusId: 'statusKnowledgeForum',
            name: 'Knowledge Forum',
            summaryElementId: 'summary-knowledge' // For dashboard
        },
        health: {
            buildingId: 'map-building-health',
            url: 'districts/health_district/smoke-tracker.html',
            linkId: 'linkHealthDistrict',
            statusId: 'statusHealthDistrict',
            name: 'Health District',
            summaryElementId: 'summary-health' // For dashboard
        },
        emporium: {
            buildingId: 'map-building-emporium',
            url: 'districts/emporium/shop.html',
            linkId: 'linkEmporium',
            statusId: 'statusEmporium',
            name: 'Emporium',
            summaryElementId: 'summary-emporium' // For dashboard
        }
    };
    const HUB_DATA_PREFIX = 'romehub_';

    // ... (keep initializeHub, updatePointsDisplay, performDailyGlobalTasks, isDistrictUnlocked)

    function unlockDistrict(districtKey) {
        const config = districtMapConfig[districtKey];
        if (!config) return;
        if (isDistrictUnlocked(districtKey)) {
            SharedUtils.showToast(`${config.name} is already developed.`, 2000, 'info');
            return;
        }

        DataManager.saveData(`${HUB_DATA_PREFIX}unlocked_${districtKey}`, true);
        SharedUtils.showToast(`${config.name} District Unlocked!`, 2500, 'success');
        
        updateDistrictUIVisuals(districtKey, true); // Pass true for animate
    }

    function updateDistrictUIVisuals(districtKey, animate = false) {
        const config = districtMapConfig[districtKey];
        // ... (rest of the variable declarations: buildingElement, linkElement, etc.)

        const buildingElement = document.getElementById(config.buildingId);
        const linkElement = document.getElementById(config.linkId);
        const statusElement = document.getElementById(config.statusId);
        const unlockButton = districtNav.querySelector(`.unlock-district-button[data-district="${districtKey}"]`);
        const summaryElement = document.getElementById(config.summaryElementId); // For dashboard

        const unlocked = isDistrictUnlocked(districtKey);

        if (buildingElement) {
            if (unlocked) {
                buildingElement.classList.remove('locked'); // ESSENTIAL: remove .locked first
                
                if (animate) {
                    // Force reflow to ensure 'locked' styles are removed before adding 'dropping-in'
                    void buildingElement.offsetWidth; 
                    buildingElement.classList.add('dropping-in');
                    buildingElement.addEventListener('transitionend', () => {
                        buildingElement.classList.remove('dropping-in');
                    }, { once: true });
                } else {
                    // If not animating (e.g., on page load), just ensure it's visible
                    // The opacity and transform will be set by its ID-specific CSS rule
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
        // ... (rest of linkElement, statusElement updates)

        // Dashboard Summary Update
        if (summaryElement) {
            if (unlocked) {
                summaryElement.querySelector('.district-summary-status').textContent = "Status: Operational";
                summaryElement.classList.remove('locked-summary');
                // TODO: Fetch actual summary data for this district from DataManager
                // For now, a placeholder:
                if (districtKey === 'knowledge') {
                    summaryElement.querySelector('.district-summary-data').textContent = "Insights: " + DataManager.loadData('idky_moments', []).length;
                } else if (districtKey === 'health') {
                     summaryElement.querySelector('.district-summary-data').textContent = "Streak: " + DataManager.loadData('smoketrack_streak', 0) + " days";
                } else if (districtKey === 'emporium') {
                    summaryElement.querySelector('.district-summary-data').textContent = "Themes: " + ThemeManager.getOwnedThemeIds().length;
                }


            } else {
                summaryElement.querySelector('.district-summary-status').textContent = "Status: Needs Development";
                summaryElement.querySelector('.district-summary-data').textContent = "Data: N/A";
                summaryElement.classList.add('locked-summary');
            }
        }
    }
    
    // ... (keep navigateToDistrict, checkAllDistrictStatuses, setupDistrictControls)

    function checkAllDistrictStatuses() {
        console.log("Checking all district statuses on load...");
        for (const districtKey in districtMapConfig) {
            updateDistrictUIVisuals(districtKey, false); // No animation on initial load
        }
    }
    
    // Add functions to fetch and display dashboard summaries later
    function updateDashboardSummaries() {
        for (const districtKey in districtMapConfig) {
            // This logic is now integrated into updateDistrictUIVisuals
            // but you might call it separately if needed.
            // updateDistrictUIVisuals(districtKey, false);
        }
    }

    // Call initializeHub at the end
    initializeHub();
    updateDashboardSummaries(); // Initial call to populate dashboard
});
