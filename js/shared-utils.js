// js/shared-utils.js

const SharedUtils = (() => {
    const localStorageKeySuffix = '_v27_theme_shop_rome'; // Updated suffix for the new app structure

    function showToast(message, duration = 2500, type = 'info') {
        const toastId = 'romeToastNotification';
        let toastNotification = document.getElementById(toastId);

        if (!toastNotification) {
            toastNotification = document.createElement('div');
            toastNotification.id = toastId;
            // Basic styling, assuming style.css will have more comprehensive styles
            // The existing style.css has .toast-notification, we can adapt or ensure it's generic
            toastNotification.className = 'toast-notification'; // Use existing class from style.css
            document.body.appendChild(toastNotification);
        }

        toastNotification.textContent = message;
        toastNotification.classList.remove('show', 'error', 'success'); // Clear previous types

        if (type === 'error') {
            toastNotification.classList.add('error'); // Assuming you'll add .error styles
        } else if (type === 'success') {
            toastNotification.classList.add('success'); // Assuming you'll add .success styles
        }

        toastNotification.classList.add('show');
        setTimeout(() => {
            toastNotification.classList.remove('show');
        }, duration);
    }

    // Generic function to get current date string (YYYY-MM-DD)
    function getCurrentDateString() {
        const t = new Date();
        const y = t.getFullYear();
        const m = String(t.getMonth() + 1).padStart(2, '0');
        const d = String(t.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    function getDateStringFromTimestamp(timestamp) {
        const date = new Date(timestamp);
        const y = date.getFullYear();
        const m = String(date.getMonth() + 1).padStart(2, '0');
        const d = String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    // Format time from total seconds to "Xm Ys"
    function formatTime(totalSeconds) {
        if (isNaN(totalSeconds) || totalSeconds < 0) {
            return "0m 0s";
        }
        const m = Math.floor(totalSeconds / 60);
        const s = Math.floor(totalSeconds % 60);
        return `${m}m ${s}s`;
    }


    return {
        localStorageKeySuffix,
        showToast,
        getCurrentDateString,
        getDateStringFromTimestamp,
        formatTime
        // Other utilities will be added here
    };
})();
