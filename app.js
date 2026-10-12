// DaTools Universal App Controller

// 1. Immediate Theme & Wallpaper Execution (Runs instantly on script parse)
(function applySavedState() {
    if (localStorage.getItem('theme') === 'dark') {
        document.body.classList.add('dark-mode');
    }

    const savedWallpaper = localStorage.getItem('customWallpaper');
    if (savedWallpaper) {
        document.body.style.backgroundImage = `url('${savedWallpaper}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
        document.body.classList.add('has-wallpaper');
    }

    const savedAlpha = localStorage.getItem('cardTransparency') || '0.65';
    document.documentElement.style.setProperty('--card-alpha', savedAlpha);
})();

document.addEventListener("DOMContentLoaded", () => {
    // --- Global Elements ---
    const toggleBtn = document.getElementById("theme-toggle");
    const modalThemeBtn = document.getElementById("modal-theme-btn");
    const themeIcon = document.getElementById("theme-icon");
    const themeText = document.getElementById("theme-text");

    const settingsBtn = document.getElementById("settings-btn");
    const settingsModal = document.getElementById("settings-modal");
    const closeModal = document.getElementById("close-modal");
    const clearCacheBtn = document.getElementById("clear-cache-btn");

    const bgUrlInput = document.getElementById("bg-url-input");
    const applyUrlBtn = document.getElementById("apply-url-btn");
    const bgFileInput = document.getElementById("bg-file-input");
    const resetBgBtn = document.getElementById("reset-bg-btn");
    const transparencySlider = document.getElementById("transparency-slider");
    const transparencyValueDisplay = document.getElementById("transparency-value");

    // Sync Initial Theme Text
    const isDark = document.body.classList.contains("dark-mode");
    if (themeText) themeText.textContent = isDark ? "Light Mode" : "Dark Mode";
    if (themeIcon) themeIcon.textContent = isDark ? "☀️" : "🌙";

    const currentAlpha = localStorage.getItem("cardTransparency") || "0.65";
    if (transparencySlider) transparencySlider.value = currentAlpha;
    if (transparencyValueDisplay) transparencyValueDisplay.textContent = Math.round(currentAlpha * 100) + "%";

    // --- Wallpaper & Transparency Helpers ---
    function setCustomWallpaper(imageUrl) {
        if (imageUrl) {
            document.body.style.backgroundImage = `url('${imageUrl}')`;
            document.body.style.backgroundSize = "cover";
            document.body.style.backgroundPosition = "center";
            document.body.style.backgroundAttachment = "fixed";
            document.body.classList.add("has-wallpaper");
            localStorage.setItem("customWallpaper", imageUrl);
        } else {
            document.body.style.backgroundImage = "";
            document.body.classList.remove("has-wallpaper");
            localStorage.removeItem("customWallpaper");
        }
    }

    function updateTransparency(alpha) {
        document.documentElement.style.setProperty("--card-alpha", alpha);
        if (transparencyValueDisplay) transparencyValueDisplay.textContent = Math.round(alpha * 100) + "%";
        localStorage.setItem("cardTransparency", alpha);
    }

    // --- Theme Listener ---
    function toggleTheme() {
        document.body.classList.toggle("dark-mode");
        const activeDark = document.body.classList.contains("dark-mode");
        if (themeIcon) themeIcon.textContent = activeDark ? "☀️" : "🌙";
        if (themeText) themeText.textContent = activeDark ? "Light Mode" : "Dark Mode";
        localStorage.setItem("theme", activeDark ? "dark" : "light");
    }

    if (toggleBtn) toggleBtn.addEventListener("click", toggleTheme);
    if (modalThemeBtn) modalThemeBtn.addEventListener("click", toggleTheme);

    // --- Wallpaper & Modal Event Listeners ---
    if (transparencySlider) transparencySlider.addEventListener("input", (e) => updateTransparency(e.target.value));

    if (applyUrlBtn) {
        applyUrlBtn.addEventListener("click", () => {
            const url = bgUrlInput.value.trim();
            if (url) {
                setCustomWallpaper(url);
                bgUrlInput.value = "";
            }
        });
    }

    if (bgFileInput) {
        bgFileInput.addEventListener("change", (e) => {
            const file = e.target.files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => setCustomWallpaper(evt.target.result);
                reader.readAsDataURL(file);
            }
        });
    }

    if (resetBgBtn) {
        resetBgBtn.addEventListener("click", () => {
            setCustomWallpaper(null);
            if (bgFileInput) bgFileInput.value = "";
            if (bgUrlInput) bgUrlInput.value = "";
            updateTransparency("0.65");
            if (transparencySlider) transparencySlider.value = "0.65";
        });
    }

    if (settingsBtn && settingsModal)
        settingsBtn.addEventListener("click", () => settingsModal.classList.remove("hidden"));
    if (closeModal && settingsModal) closeModal.addEventListener("click", () => settingsModal.classList.add("hidden"));
    if (settingsModal) {
        settingsModal.addEventListener("click", (e) => {
            if (e.target === settingsModal) settingsModal.classList.add("hidden");
        });
    }

    if (clearCacheBtn) {
        clearCacheBtn.addEventListener("click", () => {
            localStorage.clear();
            location.reload();
        });
    }

    // ==========================================
    // DaTax Pro Financial Calculator Logic
    // ==========================================
    const amountInput = document.getElementById("amountInput");
    if (amountInput) {
        const qtyInput = document.getElementById("qtyInput");
        const discountInput = document.getElementById("discountInput");
        const serviceInput = document.getElementById("serviceInput");
        const taxInput = document.getElementById("taxInput");
        const shippingInput = document.getElementById("shippingInput");
        const taxInclusiveToggle = document.getElementById("taxInclusiveToggle");
        const splitInput = document.getElementById("splitInput");

        const baseSubtotalDisplay = document.getElementById("baseSubtotalDisplay");
        const discountDisplay = document.getElementById("discountDisplay");
        const serviceDisplay = document.getElementById("serviceDisplay");
        const taxAmountDisplay = document.getElementById("taxAmountDisplay");
        const shippingDisplay = document.getElementById("shippingDisplay");
        const grandTotalDisplay = document.getElementById("grandTotalDisplay");
        const splitRow = document.getElementById("splitRow");
        const splitCountDisplay = document.getElementById("splitCountDisplay");
        const perPersonDisplay = document.getElementById("perPersonDisplay");
        const resetBtn = document.getElementById("resetBtn");

        function calculateTax() {
            const unitPrice = parseFloat(amountInput.value) || 0;
            const qty = parseInt(qtyInput.value) || 1;
            const discountPercent = parseFloat(discountInput.value) || 0;
            const servicePercent = parseFloat(serviceInput.value) || 0;
            const taxPercent = parseFloat(taxInput.value) || 0;
            const shippingFee = parseFloat(shippingInput.value) || 0;
            const isInclusive = taxInclusiveToggle.checked;
            const splitCount = parseInt(splitInput.value) || 1;

            const baseSubtotal = unitPrice * qty;
            const discountAmount = baseSubtotal * (discountPercent / 100);
            const subtotalAfterDiscount = baseSubtotal - discountAmount;
            const serviceAmount = subtotalAfterDiscount * (servicePercent / 100);

            let taxAmount = 0;
            const taxableBase = subtotalAfterDiscount + serviceAmount;

            if (isInclusive) {
                const netAmount = taxableBase / (1 + taxPercent / 100);
                taxAmount = taxableBase - netAmount;
            } else {
                taxAmount = taxableBase * (taxPercent / 100);
            }

            const grandTotal = isInclusive ? taxableBase + shippingFee : taxableBase + taxAmount + shippingFee;
            const validSplit = splitCount > 0 ? splitCount : 1;
            const perPersonTotal = grandTotal / validSplit;

            baseSubtotalDisplay.textContent = `$${baseSubtotal.toFixed(2)}`;
            discountDisplay.textContent = `-$${discountAmount.toFixed(2)}`;
            serviceDisplay.textContent = `+$${serviceAmount.toFixed(2)}`;
            taxAmountDisplay.textContent = `${isInclusive ? "(Inclusive) " : "+"}$${taxAmount.toFixed(2)}`;
            shippingDisplay.textContent = `+$${shippingFee.toFixed(2)}`;
            grandTotalDisplay.textContent = `$${grandTotal.toFixed(2)}`;

            if (validSplit > 1) {
                splitRow.classList.remove("hidden");
                splitCountDisplay.textContent = validSplit;
                perPersonDisplay.textContent = `$${perPersonTotal.toFixed(2)}`;
            } else {
                splitRow.classList.add("hidden");
            }
        }

        [
            amountInput,
            qtyInput,
            discountInput,
            serviceInput,
            taxInput,
            shippingInput,
            taxInclusiveToggle,
            splitInput
        ].forEach((el) => {
            if (el) {
                el.addEventListener("input", calculateTax);
                el.addEventListener("change", calculateTax);
            }
        });

        if (resetBtn) {
            resetBtn.addEventListener("click", () => {
                amountInput.value = "";
                qtyInput.value = "1";
                discountInput.value = "0";
                serviceInput.value = "0";
                taxInput.value = "6";
                shippingInput.value = "0";
                taxInclusiveToggle.checked = false;
                splitInput.value = "1";
                calculateTax();
            });
        }

        calculateTax();
    }
});
