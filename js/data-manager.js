// js/data-manager.js

const DataManager = (() => {
    const suffix = SharedUtils.localStorageKeySuffix;

    function loadData(key, defaultValue = null) {
        try {
            const item = localStorage.getItem(key + suffix);
            return item ? JSON.parse(item) : defaultValue;
        } catch (error) {
            console.error(`Error loading data for key "${key}":`, error);
            SharedUtils.showToast(`Error loading data: ${key}`, 3000, 'error');
            return defaultValue;
        }
    }

    function saveData(key, value) {
        try {
            localStorage.setItem(key + suffix, JSON.stringify(value));
        } catch (error) {
            console.error(`Error saving data for key "${key}":`, error);
            SharedUtils.showToast(`Error saving data: ${key}`, 3000, 'error');
        }
    }

    function getUserPoints() {
        return loadData('user_points', 0);
    }

    function setUserPoints(points) {
        saveData('user_points', points);
    }

    function addPoints(amount, reason = "") {
        let currentPoints = getUserPoints();
        if (typeof amount === 'number' && amount > 0) {
            currentPoints += amount;
            setUserPoints(currentPoints);
            SharedUtils.showToast(`+${amount} PTS! ${reason}`.trim(), amount > 5 ? 3000 : 2500, 'success');
            // Consider adding a points flash visual effect trigger here if needed globally
            // For now, individual app scripts might handle their specific UI flashes.
            return true;
        }
        return false;
    }
    
    // Placeholder for global app settings, like last processed date for daily tasks
    function getLastProcessedDate() {
        return loadData('last_processed_date', '');
    }

    function setLastProcessedDate(dateString) {
        saveData('last_processed_date', dateString);
    }


    // Add more specific data getters/setters as needed for districts
    // e.g., getDistrictProgress(districtName), saveDistrictProgress(districtName, data)

    return {
        loadData,
        saveData,
        getUserPoints,
        setUserPoints,
        addPoints,
        getLastProcessedDate,
        setLastProcessedDate
        // ... other data management functions
    };
})();
