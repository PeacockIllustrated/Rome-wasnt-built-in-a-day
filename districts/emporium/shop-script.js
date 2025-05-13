// shop-script.js
document.addEventListener('DOMContentLoaded', () => {
    const themeGalleryWindow = document.getElementById('themeGalleryWindow');
    const shopPageUserPointsDisplay = document.getElementById('shopPageUserPoints');
    const particleCanvasShop = document.getElementById('particleCanvasShop');
    const dispensingTrayVisual = document.querySelector('.dispensing-tray-visual');
    const shopToastNotification = document.createElement('div');

    // Style the toast element (remains the same)
    shopToastNotification.id = 'shopToastNotification'; // For potential specific styling via CSS
    shopToastNotification.style.position = 'fixed';
    shopToastNotification.style.bottom = '20px';
    shopToastNotification.style.left = '50%';
    shopToastNotification.style.transform = 'translateX(-50%) translateY(70px)';
    shopToastNotification.style.backgroundColor = 'var(--theme-primary-dark, #333)';
    shopToastNotification.style.color = 'var(--theme-text-on-dark, #fff)';
    shopToastNotification.style.padding = '10px 20px';
    shopToastNotification.style.border = 'var(--pixel-border-width, 2px) solid var(--theme-secondary-accent, #E9C46A)';
    shopToastNotification.style.fontFamily = "'VT323', monospace";
    shopToastNotification.style.fontSize = '18px';
    shopToastNotification.style.zIndex = '4000';
    shopToastNotification.style.opacity = '0';
    shopToastNotification.style.transition = 'transform 0.3s ease-out, opacity 0.3s ease-out';
    shopToastNotification.style.boxShadow = '2px 2px 0px var(--theme-secondary-accent, #E9C46A)';
    document.body.appendChild(shopToastNotification);


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

    const localStorageKeySuffix = '_v27_theme_shop'; // MUST match other scripts
    const themes = { // MUST be complete and match other scripts
        default: { name: "Default Retro", cost: 0, owned: true, description: "The classic look and feel.", cssVariables: { '--theme-primary-dark': '#264653', '--theme-primary-accent': '#2A9D8F', '--theme-secondary-accent': '#E9C46A', '--theme-tertiary-accent': '#F4A261', '--theme-highlight-accent': '#E76F51', '--theme-light-bg': '#EAEAEA', '--theme-card-bg': '#FFFFFF', '--theme-text-on-dark': '#EAEAEA', '--theme-page-bg': 'rgb(174, 217, 211)' } },
        oceanDepths: { name: "Ocean Depths", cost: 1, description: "Dive into cool blue tranquility.", cssVariables: { '--theme-primary-dark': '#03045E', '--theme-primary-accent': '#0077B6', '--theme-secondary-accent': '#00B4D8', '--theme-tertiary-accent': '#90E0EF', '--theme-highlight-accent': '#CAF0F8', '--theme-light-bg': '#E0FBFC', '--theme-card-bg': '#FFFFFF', '--theme-text-on-dark': '#CAF0F8', '--theme-page-bg': '#ADE8F4' } },
        volcanoRush: { name: "Volcano Rush", cost: 1, description: "Fiery reds and oranges.", cssVariables: { '--theme-primary-dark': '#2B0000', '--theme-primary-accent': '#6A0000', '--theme-secondary-accent': '#FF4500', '--theme-tertiary-accent': '#FF8C00', '--theme-highlight-accent': '#AE2012', '--theme-light-bg': '#FFF2E6', '--theme-card-bg': '#FFFFFF', '--theme-text-on-dark': '#FFDAB9', '--theme-page-bg': '#FFCDB2' } },
        techOrangeBlue: { name: "Tech Orange & Blue", cost: 1, description: "A modern tech-inspired palette.", cssVariables: { '--theme-primary-dark': '#004C97', '--theme-primary-accent': '#4A7DB5', '--theme-secondary-accent': '#FF6600', '--theme-tertiary-accent': '#C0C0C0', '--theme-highlight-accent': '#FF7700', '--theme-light-bg': '#F0F0F0', '--theme-card-bg': '#FFFFFF', '--theme-text-on-dark': '#F0F0F0', '--theme-page-bg': '#E8E8E8' } },
        forestGreens: { name: "Forest Greens", cost: 1, description: "Earthy and calming greens.", cssVariables: { '--theme-primary-dark': '#1A2B12', '--theme-primary-accent': '#335128', '--theme-secondary-accent': '#526F35', '--theme-tertiary-accent': '#8A9A5B', '--theme-highlight-accent': '#E0E7A3', '--theme-light-bg': '#F0F5E0', '--theme-card-bg': '#FFFFFF', '--theme-text-on-dark': '#E0E7A3', '--theme-page-bg': '#D8E0C0' } }
    };

    let userPoints = parseInt(localStorage.getItem('idk_user_points_val' + localStorageKeySuffix)) || 0;
    let ownedThemes = JSON.parse(localStorage.getItem('idk_owned_themes' + localStorageKeySuffix)) || ['default'];
    let currentTheme = localStorage.getItem('idk_current_theme' + localStorageKeySuffix) || 'default';

    function showToast(message, duration = 2500) {
        if (!shopToastNotification) return;
        shopToastNotification.textContent = message;
        shopToastNotification.style.transform = 'translateX(-50%) translateY(0)';
        shopToastNotification.style.opacity = '1';
        setTimeout(() => {
            shopToastNotification.style.transform = 'translateX(-50%) translateY(70px)';
            shopToastNotification.style.opacity = '0';
        }, duration);
    }

    function applyThemeOnPage(themeId) {
        const themeToApply = themes[themeId] || themes.default;
        currentTheme = themeId; // Update the current theme state variable

        if (themeToApply && themeToApply.cssVariables) {
            const themeVars = themeToApply.cssVariables;
            for (const [key, value] of Object.entries(themeVars)) {
                document.documentElement.style.setProperty(key, value);
            }
            document.documentElement.style.setProperty('--theme-text-main', themeVars['--theme-primary-dark']);
            document.documentElement.style.setProperty('--theme-border-main', themeVars['--theme-primary-dark']);
        } else {
            console.warn(`Theme ID "${themeId}" not found. Applying default explicitly.`);
            if (themes.default && themes.default.cssVariables) { // Ensure default exists
                 const defaultVars = themes.default.cssVariables;
                 for (const [key, value] of Object.entries(defaultVars)) { document.documentElement.style.setProperty(key, value); }
                 document.documentElement.style.setProperty('--theme-text-main', defaultVars['--theme-primary-dark']);
                 document.documentElement.style.setProperty('--theme-border-main', defaultVars['--theme-primary-dark']);
                 currentTheme = 'default'; // Explicitly set to default
            }
        }
        saveShopData(); // Save theme choice immediately
    }

    function saveShopData() {
        localStorage.setItem('idk_user_points_val' + localStorageKeySuffix, userPoints.toString());
        localStorage.setItem('idk_owned_themes' + localStorageKeySuffix, JSON.stringify(ownedThemes));
        localStorage.setItem('idk_current_theme' + localStorageKeySuffix, currentTheme);
    }

    function renderShopPageThemes() {
        if (!themeGalleryWindow) return;
        themeGalleryWindow.innerHTML = '';

        Object.entries(themes).forEach(([themeId, themeData]) => {
            const itemSlot = document.createElement('div');
            itemSlot.className = 'vending-item-slot';
            if (currentTheme === themeId) {
                itemSlot.classList.add('highlighted-product');
            }
            itemSlot.dataset.themeId = themeId;

            let previewHTML = '<div class="vending-item-preview">';
            const colorKeys = ['--theme-primary-dark', '--theme-primary-accent', '--theme-secondary-accent', '--theme-tertiary-accent', '--theme-highlight-accent'];
            for(let i=0; i < 5; i++) {
                previewHTML += `<span style="background-color: ${themeData.cssVariables[colorKeys[i % colorKeys.length]]};"></span>`;
            }
            previewHTML += '</div>';

            const isOwned = ownedThemes.includes(themeId);
            const isActive = currentTheme === themeId;
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
            applyThemeOnPage(themeId); // This now saves
            showToast(`${themeData.name} theme APPLIED!`);
            if (dispensingTrayVisual) dispensingTrayVisual.textContent = `${themeData.name} APPLIED!`;
            if(cardElement && particleCanvasShop) {
                const rect = cardElement.getBoundingClientRect();
                createShopParticle(rect.left + rect.width/2, rect.top + rect.height/2, particleColor, 5, 30, 5, 1.2);
            }
        } else if (action === 'buy') {
            if (userPoints >= themeData.cost) {
                userPoints -= themeData.cost;
                ownedThemes.push(themeId);
                applyThemeOnPage(themeId); // Apply immediately after buying (this also saves)
                showToast(`Purchased & Applied ${themeData.name}!`);
                if (dispensingTrayVisual) {
                    dispensingTrayVisual.textContent = `VENDING ${themeData.name}...`;
                    setTimeout(() => { dispensingTrayVisual.textContent = `${themeData.name} DISPENSED!`;}, 700);
                }
                if(cardElement && particleCanvasShop) {
                    const rect = cardElement.getBoundingClientRect();
                    createShopParticle(rect.left + rect.width/2, rect.top + rect.height/2, particleColor, 8, 60, 8, 1.5);
                }
            } else {
                showToast("Not enough PTS!");
                if (dispensingTrayVisual) dispensingTrayVisual.textContent = `INSUFFICIENT PTS!`;
            }
        }
        renderShopPageThemes(); // Re-render to update states and points
    }

    // --- Particle Effects ---
    function createShopParticle(x, y, color, size, count, spread, speedMultiplier = 1) {
        if (!particleCanvasShop || !shopCtx) return;
        for (let i = 0; i < count; i++) {
            shopParticles.push({ x, y, size: Math.random() * size + 2, color, vx: (Math.random() - 0.5) * spread * speedMultiplier, vy: (Math.random() * -2.5 - 0.5) * speedMultiplier, life: 50 + Math.random() * 30 }); // Adjusted vy for more upward burst
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
            const p = shopParticles[i]; p.x += p.vx; p.y += p.vy; p.vy += 0.09; /* Gravity */ p.life--;
            if (p.life <= 0) { shopParticles.splice(i, 1); continue; }
            shopCtx.fillStyle = p.color; shopCtx.globalAlpha = Math.max(0, p.life / 80); // Fade out
            shopCtx.fillRect(p.x - p.size / 2, p.y - p.size / 2, p.size, p.size);
            stillAnimating = true;
        }
        shopCtx.globalAlpha = 1;
        if (stillAnimating) { requestAnimationFrame(updateAndDrawParticlesShop); }
        else { shopParticles.isAnimatingLoop = false; }
    }

    // --- Initial Setup ---
    // document.body.classList.add('shop-active'); // This is now directly in shop.html
    if(shopPageUserPointsDisplay) shopPageUserPointsDisplay.textContent = userPoints;
    applyThemeOnPage(currentTheme);
    renderShopPageThemes();

    console.log("Shop Page Initialized.");
});
