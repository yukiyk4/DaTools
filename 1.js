// DOM Elements
const toggleBtn = document.getElementById('theme-toggle');
const modalThemeBtn = document.getElementById('modal-theme-btn');
const themeIcon = document.getElementById('theme-icon');
const themeText = document.getElementById('theme-text');

const settingsBtn = document.getElementById('settings-btn');
const settingsModal = document.getElementById('settings-modal');
const closeModal = document.getElementById('close-modal');
const clearCacheBtn = document.getElementById('clear-cache-btn');

// Wallpaper & Transparency Elements
const bgUrlInput = document.getElementById('bg-url-input');
const applyUrlBtn = document.getElementById('apply-url-btn');
const bgFileInput = document.getElementById('bg-file-input');
const resetBgBtn = document.getElementById('reset-bg-btn');
const transparencySlider = document.getElementById('transparency-slider');
const transparencyValueDisplay = document.getElementById('transparency-value');

// --- Wallpaper Manager ---
function setCustomWallpaper(imageUrl) {
    if (imageUrl) {
        document.body.style.backgroundImage = `url('${imageUrl}')`;
        document.body.style.backgroundSize = 'cover';
        document.body.style.backgroundPosition = 'center';
        document.body.style.backgroundAttachment = 'fixed';
        document.body.classList.add('has-wallpaper');
        localStorage.setItem('customWallpaper', imageUrl);
    } else {
        document.body.style.backgroundImage = '';
        document.body.classList.remove('has-wallpaper');
        localStorage.removeItem('customWallpaper');
    }
}

// --- Transparency Manager ---
function updateCardTransparency(alpha) {
    // Set a CSS variable on the root document for real-time adjustments
    document.documentElement.style.setProperty('--card-alpha', alpha);
    const percentage = Math.round(alpha * 100) + '%';
    if (transparencyValueDisplay) transparencyValueDisplay.textContent = percentage;
    localStorage.setItem('cardTransparency', alpha);
}

// Load saved wallpaper & transparency on startup
const savedWallpaper = localStorage.getItem('customWallpaper');
if (savedWallpaper) {
    setCustomWallpaper(savedWallpaper);
}

const savedTransparency = localStorage.getItem('cardTransparency') || '0.65';
if (transparencySlider) {
    transparencySlider.value = savedTransparency;
}
updateCardTransparency(savedTransparency);

// Slider event listener
if (transparencySlider) {
    transparencySlider.addEventListener('input', (e) => {
        updateCardTransparency(e.target.value);
    });
}

// Apply Image URL
if (applyUrlBtn) {
    applyUrlBtn.addEventListener('click', () => {
        const url = bgUrlInput.value.trim();
        if (url) {
            setCustomWallpaper(url);
            bgUrlInput.value = '';
        }
    });
}

// Upload Local Image File
if (bgFileInput) {
    bgFileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                setCustomWallpaper(event.target.result);
            };
            reader.readAsDataURL(file);
        }
    });
}

// Reset Background to Default Theme Color
if (resetBgBtn) {
    resetBgBtn.addEventListener('click', () => {
        setCustomWallpaper(null);
        if (bgFileInput) bgFileInput.value = '';
        if (bgUrlInput) bgUrlInput.value = '';
        updateCardTransparency('0.65');
        if (transparencySlider) transparencySlider.value = '0.65';
    });
}

// --- Theme Logic ---
if (localStorage.getItem('theme') === 'dark') {
    document.body.classList.add('dark-mode');
    if (themeText) themeText.textContent = 'Light Mode';
    if (themeIcon) themeIcon.textContent = '☀️';
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');

    if (themeIcon) themeIcon.textContent = isDark ? '☀️' : '🌙';
    if (themeText) themeText.textContent = isDark ? 'Light Mode' : 'Dark Mode';

    localStorage.setItem('theme', isDark ? 'dark' : 'light');
}

if (toggleBtn) toggleBtn.addEventListener('click', toggleTheme);
if (modalThemeBtn) modalThemeBtn.addEventListener('click', toggleTheme);

// --- Settings Modal Logic ---
if (settingsBtn) {
    settingsBtn.addEventListener('click', () => {
        settingsModal.classList.remove('hidden');
    });
}

if (closeModal) {
    closeModal.addEventListener('click', () => {
        settingsModal.classList.add('hidden');
    });
}

if (settingsModal) {
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) {
            settingsModal.classList.add('hidden');
        }
    });
}

// Clear Cache
if (clearCacheBtn) {
    clearCacheBtn.addEventListener('click', () => {
        localStorage.clear();
        location.reload();
    });
}
