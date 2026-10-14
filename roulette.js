// DOM Elements
const canvas = document.getElementById("wheelCanvas");
const ctx = canvas.getContext("2d");
const spinBtn = document.getElementById("spinBtn");
const spinCenterBtn = document.getElementById("spinCenterBtn");
const bulkEditor = document.getElementById("bulkEditor");
const addItemForm = document.getElementById("addItemForm");
const newItemInput = document.getElementById("newItemInput");
const itemCountBadge = document.getElementById("itemCountBadge");
const shuffleBtn = document.getElementById("shuffleBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const soundToggle = document.getElementById("soundToggle");
const soundIcon = document.getElementById("soundIcon");
const fullscreenBtn = document.getElementById("fullscreenBtn");
const pointer = document.getElementById("pointer");

const winnerModal = document.getElementById("winnerModal");
const winnerModalContent = document.getElementById("winnerModalContent");
const winnerText = document.getElementById("winnerText");
const closeModalBtn = document.getElementById("closeModalBtn");
const removeWinnerBtn = document.getElementById("removeWinnerBtn");

// State Variables
let items = ["Option 1", "Option 2", "Option 3", "Option 4", "Option 5", "Option 6"];
let currentAngle = 0;
let isSpinning = false;
let soundEnabled = true;
let lastTickIndex = null;
let winningItem = null;

// Preset Data
const presets = {
    eat: ["Nasi Kandar", "Burger", "Pizza", "Ramen", "Chicken Rice", "Pasta", "Tacos", "Sushi"],
    yesno: ["Yes", "No", "Definitely", "Ask Again Later", "Never", "For Sure"],
    numbers: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
    truthdare: [
        "Truth: Embarrassing secret?",
        "Dare: Do 10 pushups",
        "Truth: Last lie told?",
        "Dare: Sing a song",
        "Truth: Crush name?",
        "Dare: Dance for 30s"
    ]
};

const colors = [
    "#6366f1",
    "#ec4899",
    "#8b5cf6",
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#f43f5e",
    "#14b8a6",
    "#a855f7",
    "#06b6d4",
    "#eab308",
    "#ef4444"
];

let audioCtx = null;
function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
}

function playTickSound() {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    try {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = "triangle";
        osc.frequency.setValueAtTime(600, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(200, audioCtx.currentTime + 0.03);

        gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.03);

        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.start();
        osc.stop(audioCtx.currentTime + 0.03);
    } catch (e) {}
}

function playWinSound() {
    if (!soundEnabled) return;
    initAudio();
    if (!audioCtx) return;

    try {
        const now = audioCtx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, index) => {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = "sine";
            osc.frequency.setValueAtTime(freq, now + index * 0.1);

            gain.gain.setValueAtTime(0.2, now + index * 0.1);
            gain.gain.exponentialRampToValueAtTime(0.001, now + index * 0.1 + 0.3);

            osc.connect(gain);
            gain.connect(audioCtx.destination);

            osc.start(now + index * 0.1);
            osc.stop(now + index * 0.1 + 0.3);
        });
    } catch (e) {}
}

function updateEditorFromItems() {
    bulkEditor.value = items.join("\n");
    itemCountBadge.textContent = `${items.length} item${items.length === 1 ? "" : "s"}`;
}

function updateItemsFromEditor() {
    const lines = bulkEditor.value
        .split("\n")
        .map((l) => l.trim())
        .filter((l) => l.length > 0);
    items = lines.length > 0 ? lines : ["Empty"];
    itemCountBadge.textContent = `${items.length} item${items.length === 1 ? "" : "s"}`;
    drawWheel();
}

function drawWheel() {
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(centerX, centerY) - 15;

    ctx.clearRect(0, 0, width, height);

    const sliceAngle = (2 * Math.PI) / items.length;

    items.forEach((item, index) => {
        const startAngle = currentAngle + index * sliceAngle;
        const endAngle = startAngle + sliceAngle;

        ctx.beginPath();
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, startAngle, endAngle);
        ctx.closePath();

        ctx.fillStyle = colors[index % colors.length];
        ctx.fill();
        ctx.lineWidth = 2;
        ctx.strokeStyle = "rgba(15, 23, 42, 0.4)";
        ctx.stroke();

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(startAngle + sliceAngle / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 16px system-ui, -apple-system, sans-serif";

        let displayText = item;
        if (displayText.length > 18) {
            displayText = displayText.substring(0, 16) + "...";
        }

        ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
        ctx.shadowBlur = 4;
        ctx.fillText(displayText, radius - 30, 6);
        ctx.restore();
    });

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#1e293b";
    ctx.stroke();

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius - 4, 0, 2 * Math.PI);
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#475569";
    ctx.stroke();
}

// Spin Animation Logic
// Spin Animation Logic
function spinWheel() {
    if (isSpinning || items.length === 0) return;
    isSpinning = true;
    spinBtn.disabled = true;
    spinCenterBtn.disabled = true;

    // Random extra spins (5 to 10 full rotations) plus random final offset
    const minSpins = 5;
    const maxSpins = 10;
    const extraSpins = Math.floor(Math.random() * (maxSpins - minSpins + 1)) + minSpins;
    const totalRotation = (extraSpins * 2 * Math.PI) + Math.random() * (2 * Math.PI);

    const startTime = performance.now();
    const duration = 4000; // 4 seconds spin duration
    const startAngle = currentAngle;

    function animateSpin(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        // Ease-out cubic deceleration
        const easeOut = 1 - Math.pow(1 - progress, 3);

        currentAngle = startAngle + totalRotation * easeOut;
        drawWheel();

        const sliceAngle = (2 * Math.PI) / items.length;

        // Audio tick calculation synced with movement past the top pointer
        const normalizedAngle = (currentAngle % (2 * Math.PI));
        const currentSliceIndex = Math.floor((2 * Math.PI - normalizedAngle) / sliceAngle) % items.length;

        if (currentSliceIndex !== lastTickIndex) {
            playTickSound();
            lastTickIndex = currentSliceIndex;
            pointer.style.transform = 'translateY(-6px) rotate(15deg)';
            setTimeout(() => {
                pointer.style.transform = 'translateY(0px) rotate(0deg)';
            }, 50);
        }

        if (progress < 1) {
            requestAnimationFrame(animateSpin);
        } else {
            // Spin Finished
            isSpinning = false;
            spinBtn.disabled = false;
            spinCenterBtn.disabled = false;

            // Accurate Winner Calculation aligned strictly with the top arrow pointer
            const netAngle = (currentAngle + Math.PI / 2) % (2 * Math.PI);
            const winningIndex = Math.floor((2 * Math.PI - netAngle) / sliceAngle) % items.length;
            winningItem = items[(winningIndex + items.length) % items.length];

            // Trigger Winner UI & Confetti
            playWinSound();
            showWinnerModal(winningItem);
        }
    }

    requestAnimationFrame(animateSpin);
}

function showWinnerModal(winner) {
    winnerText.textContent = winner;
    winnerModal.classList.remove("opacity-0", "pointer-events-none");
    winnerModalContent.classList.remove("scale-95");
    winnerModalContent.classList.add("scale-100");

    confetti({
        particleCount: 120,
        spread: 80,
        origin: { y: 0.6 }
    });
}

function hideWinnerModal() {
    winnerModalContent.classList.remove("scale-100");
    winnerModalContent.classList.add("scale-95");
    winnerModal.classList.add("opacity-0", "pointer-events-none");
}

// Event Listeners
spinBtn.addEventListener("click", spinWheel);
spinCenterBtn.addEventListener("click", spinWheel);
canvas.addEventListener("click", spinWheel);
bulkEditor.addEventListener("input", updateItemsFromEditor);

addItemForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const val = newItemInput.value.trim();
    if (val) {
        items.push(val);
        newItemInput.value = "";
        updateEditorFromItems();
        drawWheel();
    }
});

shuffleBtn.addEventListener("click", () => {
    for (let i = items.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [items[i], items[j]] = [items[j], items[i]];
    }
    updateEditorFromItems();
    drawWheel();
});

clearAllBtn.addEventListener("click", () => {
    if (confirm("Clear all items from the wheel?")) {
        items = [];
        updateEditorFromItems();
        drawWheel();
    }
});

document.querySelectorAll(".preset-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
        const presetKey = btn.getAttribute("data-preset");
        if (presets[presetKey]) {
            items = [...presets[presetKey]];
            updateEditorFromItems();
            drawWheel();
        }
    });
});

closeModalBtn.addEventListener("click", hideWinnerModal);

removeWinnerBtn.addEventListener("click", () => {
    if (winningItem) {
        items = items.filter((item) => item !== winningItem);
        updateEditorFromItems();
        drawWheel();
    }
    hideWinnerModal();
});

soundToggle.addEventListener("click", () => {
    soundEnabled = !soundEnabled;
    if (soundEnabled) {
        soundIcon.className = "fa-solid fa-volume-high";
        soundToggle.title = "Mute Sound";
    } else {
        soundIcon.className = "fa-solid fa-volume-xmark";
        soundToggle.title = "Unmute Sound";
    }
});

fullscreenBtn.addEventListener("click", () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch((err) => {
            alert(`Error attempting to enable fullscreen: ${err.message}`);
        });
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        }
    }
});

window.addEventListener("load", () => {
    updateEditorFromItems();
    drawWheel();
});

window.addEventListener("resize", drawWheel);
