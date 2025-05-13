// districts/emporium/shop-script.js
document.addEventListener('DOMContentLoaded', () => {
    // --- Element Selectors ---
    const themeGalleryWindow = document.getElementById('themeGalleryWindow');
    const shopPageUserPointsDisplay = document.getElementById('shopPageUserPoints');
    const particleCanvasShop = document.getElementById('particleCanvasShop');
    const dispensingTrayVisual = document.querySelector('.dispensing-tray-visual');
    // shopToastNotification is now created dynamically by SharedUtils.showToast

    // --- State Variables (Loaded from Managers) ---
    let userPoints = DataManager.getUserPoints();
    let ownedThemeIds = ThemeManager.getOwnedThemeIds(); // Changed variable name for clarity
    let currentThemeId = ThemeManager.getCurrentThemeId(); // Changed variable name

    // Particle system setup (remains largely the same, uses local canvas)
    let shopCtx, shopParticles = [];
    if (particleCanvasShop) {
        shopCtx = particleCanvasShop.getContext('2d');
        particleCanvasShop.width = window.innerWidth;
        particleCanvasShop.height = window.innerHeight;
        window.addEventListener('resize', () => {
            if (particleCanvasShop) {
                particleCanvasShop.width = window.innerWidth;
                particleCanvasShop.height = window.innerHeight;
            }
        });
    }

    // THEMES are now loaded from ThemeManager
    const allThemes = ThemeManager.getAllThemes();

    function applyAndPersistTheme(themeId) {
        ThemeManager.setCurrentThemeId(themeId); // This applies visually AND saves to localStorage
        currentThemeId = themeId; // Update local state for immediate UI consistency if needed
    }

    // Only responsible for saving points now, as theme persistence is handled by ThemeManager
    function saveUserPoints() {
        DataManager.setUserPoints(userPoints);
    }

    function renderShopPageThemes() {
        if (!themeGalleryWindow) return;
        themeGalleryWindow.innerHTML = '';

        // Use allThemes obtained from ThemeManager
        Object.entries(allThemes).forEach(([themeId, themeData]) => {
            const itemSlot = document.createElement('div');
            itemSlot.className = 'vending-item-slot';
            if (currentThemeId === themeId) { // Use currentThemeId
                itemSlot.classList.add('highlighted-product');
            }
            itemSlot.dataset.themeId = themeId;

            let previewHTML = '<div class="vending-item-preview">';
            const colorKeys = ['--theme-primary-dark', '--theme-primary-accent', '--theme-secondary-accent', '--theme-tertiary-accent', '--theme-highlight-accent'];
            for(let i=0; i < 5; i++) {
                previewHTML += `<span style="background-color: ${themeData.cssVariables[colorKeys[i % colorKeys.length]]};"></span>`;
            }
            previewHTML += '</div>';

            const isOwned = ownedThemeIds.includes(themeId); // Use ownedThemeIds
            const isActive = currentThemeId === themeId;   // Use currentThemeId
            let buttonHTML, statusHTML = '';

            if (isActive) {
                buttonHTML = `<button class="vending-item-button equipped-button" disabled>EQUIPPED</button>`;
                statusHTML = `<span class="vending-item-status active">ACTIVE</span>`;
            } else if (isOwned) {
                buttonHTML = `<button class="vending-item-button apply-button" data-action="apply">APPLY</button>`;
                statusHTML = `<span class="vending-item-status owned">OWNED</span>`;
            } else {
                buttonHTML = `<button class="vending-item-button buy-button" data-action="buy" ${userPoints < themeData.cost ? 'disabled' : ''}>BUY</button>`;
                statusHTML = `<span class="vending-item-status cost">${themeData.cost} <i class="fas fa-coins"></i></span>`;
            }

            itemSlot.innerHTML = `
                ${previewHTML}
                <div class="vending-item-info">
                    <h3 class="vending-item-name">${themeData.name}</h3>
                    <p class="vending-item-description">${themeData.description || 'A fine choice!'}</p>
                </div>
                <div class="vending-item-purchase-area">
                    ${statusHTML}
                    ${buttonHTML}
                </div>`;
            themeGalleryWindow.appendChild(itemSlot);

            const button = itemSlot.querySelector('.vending-item-button[data-action]');
            if (button) {
                button.addEventListener('click', () => handleShopPageThemeAction(themeId, themeData, button.dataset.action, itemSlot));
            }
        });
        if(shopPageUserPointsDisplay) shopPageUserPointsDisplay.textContent = userPoints;
    }

    function handleShopPageThemeAction(themeId, themeData, action, cardElement) {
        let particleColor = themeData.cssVariables['--theme-secondary-accent'];

        if (action === 'apply') {
            applyAndPersistTheme(themeId); // Use new function
            SharedUtils.showToast(`${themeData.name} theme APPLIED!`, 2500, 'success');
            if (dispensingTrayVisual) dispensingTrayVisual.textContent = `${themeData.name} APPLIED!`;
            if(cardElement && particleCanvasShop) { // Particle effect remains
                const rect = cardElement.getBoundingClientRect();
                createShopParticle(rect.left + rect.width/2, rect.top + rect.height/2, particleColor, 5, 30, 5, 1.2);
            }
        } else if (action === 'buy') {
            if (userPoints >= themeData.cost) {
                userPoints -= themeData.cost;
                saveUserPoints(); // Save updated points

                // Add to owned themes using ThemeManager
                if (ThemeManager.addOwnedThemeId(themeId)) {
                    ownedThemeIds = ThemeManager.getOwnedThemeIds(); // Refresh local copy
                }

                applyAndPersistTheme(themeId); // Apply and persist the newly bought theme

                // SharedUtils.showToast is already called by addOwnedThemeId if successful
                // but we can add another for purchase confirmation if desired.
                SharedUtils.showToast(`Purchased & Applied ${themeData.name}!`, 2500, 'success');

                if (dispensingTrayVisual) {
                    dispensingTrayVisual.textContent = `VENDING ${themeData.name}...`;
                    setTimeout(() => { dispensingTrayVisual.textContent = `${themeData.name} DISPENSED!`;}, 700);
                }
                if(cardElement && particleCanvasShop) { // Particle effect
                    const rect = cardElement.getBoundingClientRect();
                    createShopParticle(rect.left + rect.width/2, rect.top + rect.height/2, particleColor, 8, 60, 8, 1.5);
                }
            } else {
                SharedUtils.showToast("Not enough PTS!", 2500, 'error');
                if (dispensingTrayVisual) dispensingTrayVisual.textContent = `INSUFFICIENT PTS!`;
            }
        }
        renderShopPageThemes(); // Re-render to update states and points
    }

    // --- Particle Effects (These functions remain local to shop-script.js) ---
    function createShopParticle(x, y, color, size, count, spread, speedMultiplier = 1) {
        if (!particleCanvasShop || !shopCtx) return;
        for (let i = 0; i < count; i++) {
            shopParticles.push({ x, y, size: Math.random() * size + 2, color, vx: (Math.random() - 0.5) * spread * speedMultiplier, vy: (Math.random() * -2.5 - 0.5) * speedMultiplier, life: 50 + Math.random() * 30 });
        }
        if (shopParticles.length > 0 && !shopParticles.isAnimatingLoop) {
            shopParticles.isAnimatingLoop = true;
            requestAnimationFrame(() => { updateAndDrawParticlesShop(); shopParticles.isAnimatingLoop = false; });
        }
    }
    function updateAndDrawParticlesShop() {
        if (!particleCanvasShop || !shopCtx) return;
        shopCtx.clearRect(0, 0, particleCanvasShop.width, particleCanvasShop.height);
        let stillAnimating = false;
        for (let i = shopParticles.length - 1; i >= 0; i--) {
            const p = shopParticles[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.09; p.life--;
            if (p.life <= 0) { shopParticles.splice(i, 1); continue; }
            shopCtx.fillStyle = p.color; shopCtx.globalAlpha = Math.max(0, p.life / 80);
            shopCtx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
            stillAnimating = true;
        }
        shopCtx.globalAlpha = 1;
        if (stillAnimating) { requestAnimationFrame(updateAndDrawParticlesShop); }
        else { shopParticles.isAnimatingLoop = false; }
    }

    // --- Initial Setup ---
    if(shopPageUserPointsDisplay) shopPageUserPointsDisplay.textContent = userPoints;
    ThemeManager.applyTheme(currentThemeId); // Apply theme using ThemeManager on load
    renderShopPageThemes();

    console.log("Shop Page Initialized (Refactored for Rome Hub).");
});
