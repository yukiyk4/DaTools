// DaTools Universal App Controller & DaICO Pro Logic

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

    const isDark = document.body.classList.contains("dark-mode");
    if (themeText) themeText.textContent = isDark ? "Light Mode" : "Dark Mode";
    if (themeIcon) themeIcon.textContent = isDark ? "☀️" : "🌙";

    const currentAlpha = localStorage.getItem("cardTransparency") || "0.65";
    if (transparencySlider) transparencySlider.value = currentAlpha;
    if (transparencyValueDisplay) transparencyValueDisplay.textContent = Math.round(currentAlpha * 100) + "%";

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

    function toggleTheme() {
        document.body.classList.toggle("dark-mode");
        const activeDark = document.body.classList.contains("dark-mode");
        if (themeIcon) themeIcon.textContent = activeDark ? "☀️" : "🌙";
        if (themeText) themeText.textContent = activeDark ? "Light Mode" : "Dark Mode";
        localStorage.setItem("theme", activeDark ? "dark" : "light");
    }

    if (toggleBtn) toggleBtn.addEventListener("click", toggleTheme);
    if (modalThemeBtn) modalThemeBtn.addEventListener("click", toggleTheme);

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

    if (settingsBtn && settingsModal) {
        settingsBtn.addEventListener("click", () => settingsModal.classList.remove("hidden"));
    }
    if (closeModal && settingsModal) {
        closeModal.addEventListener("click", () => settingsModal.classList.add("hidden"));
    }
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

    const dropzone = document.getElementById("ico-dropzone");
    const fileInput = document.getElementById("ico-input");
    const editorPanel = document.getElementById("ico-editor");
    const sourcePreview = document.getElementById("source-preview");
    const changeImgBtn = document.getElementById("change-img-btn");
    const generateBtn = document.getElementById("generate-ico-btn");
    const resultPanel = document.getElementById("result-panel");
    const downloadBtn = document.getElementById("download-ico-btn");
    const resetBtn = document.getElementById("reset-ico-btn");

    let loadedImage = null;

    if (dropzone && fileInput) {
        dropzone.addEventListener("click", () => fileInput.click());
        dropzone.addEventListener("dragover", (e) => {
            e.preventDefault();
            dropzone.classList.add("dragover");
        });
        dropzone.addEventListener("dragleave", () => {
            dropzone.classList.remove("dragover");
        });
        dropzone.addEventListener("drop", (e) => {
            e.preventDefault();
            dropzone.classList.remove("dragover");
            if (e.dataTransfer.files.length) {
                handleFile(e.dataTransfer.files[0]);
            }
        });

        fileInput.addEventListener("change", (e) => {
            if (e.target.files.length) {
                handleFile(e.target.files[0]);
            }
        });
    }

    function handleFile(file) {
        if (!file.type.startsWith("image/")) {
            alert("Please upload a valid image file (PNG, JPG, WebP).");
            return;
        }

        const reader = new FileReader();
        reader.onload = (evt) => {
            const img = new Image();
            img.onload = () => {
                loadedImage = img;
                sourcePreview.src = evt.target.result;

                [16, 32, 64, 256].forEach(size => {
                    const previewCanvas = document.getElementById(`prev-${size}`);
                    if (previewCanvas) {
                        const resCanvas = drawHighQualityResizedCanvas(img, size);
                        previewCanvas.width = size;
                        previewCanvas.height = size;
                        const pCtx = previewCanvas.getContext("2d");
                        pCtx.imageSmoothingEnabled = true;
                        pCtx.imageSmoothingQuality = "high";
                        pCtx.clearRect(0, 0, size, size);
                        pCtx.drawImage(resCanvas, 0, 0, size, size);
                    }
                });

                dropzone.classList.add("hidden");
                editorPanel.classList.remove("hidden");
                resultPanel.classList.add("hidden");
            };
            img.src = evt.target.result;
        };
        reader.readAsDataURL(file);
    }

    if (changeImgBtn) {
        changeImgBtn.addEventListener("click", () => {
            editorPanel.classList.add("hidden");
            dropzone.classList.remove("hidden");
            fileInput.value = "";
        });
    }

    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            location.reload();
        });
    }

    // --- High-Precision Face-Focused Resizing & Sharpening Algorithm ---
    function drawHighQualityResizedCanvas(img, targetSize) {
        const canvas = document.createElement("canvas");
        canvas.width = targetSize;
        canvas.height = targetSize;
        const ctx = canvas.getContext("2d");

        ctx.clearRect(0, 0, targetSize, targetSize);
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";

        let sWidth = img.width;
        let sHeight = img.height;
        let sx = 0;
        let sy = 0;

        if (sWidth > sHeight) {
            sWidth = sHeight;
            sx = (img.width - sWidth) / 2;
            sy = Math.max(0, (img.height - sHeight) * 0.12);
        } else {
            sHeight = sWidth;
            sy = Math.max(0, (img.height - sHeight) * 0.15);
            sx = (img.width - sWidth) / 2;
        }

        let oc = document.createElement("canvas");
        let octx = oc.getContext("2d");
        let curW = sWidth;
        let curH = sHeight;

        oc.width = curW;
        oc.height = curH;
        octx.clearRect(0, 0, curW, curH);
        octx.imageSmoothingEnabled = true;
        octx.imageSmoothingQuality = "high";
        octx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, curW, curH);

        while (curW > targetSize * 2) {
            curW = Math.max(targetSize, Math.round(curW / 2));
            curH = Math.max(targetSize, Math.round(curH / 2));
            let nextOc = document.createElement("canvas");
            let nextOctx = nextOc.getContext("2d");
            nextOc.width = curW;
            nextOc.height = curH;
            nextOctx.clearRect(0, 0, curW, curH);
            nextOctx.imageSmoothingEnabled = true;
            nextOctx.imageSmoothingQuality = "high";
            nextOctx.drawImage(oc, 0, 0, oc.width, oc.height, 0, 0, curW, curH);
            oc = nextOc;
        }

        ctx.drawImage(oc, 0, 0, oc.width, oc.height, 0, 0, targetSize, targetSize);

        if (targetSize <= 32) {
            applySharpenFilter(ctx, targetSize, targetSize);
        }

        return canvas;
    }

    function applySharpenFilter(ctx, width, height) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const w = width;
        const h = height;
        const weights = [0, -1, 0, -1, 5, -1, 0, -1, 0];
        const side = Math.round(Math.sqrt(weights.length));
        const halfSide = Math.floor(side / 2);
        const src = new Uint8ClampedArray(data);

        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                const dstOff = (y * w + x) * 4;
                let r = 0, g = 0, b = 0;
                for (let cy = 0; cy < side; cy++) {
                    for (let cx = 0; cx < side; cx++) {
                        const scy = y + cy - halfSide;
                        const scx = x + cx - halfSide;
                        if (scy >= 0 && scy < h && scx >= 0 && scx < w) {
                            const srcOff = (scy * w + scx) * 4;
                            const wt = weights[cy * side + cx];
                            r += src[srcOff] * wt;
                            g += src[srcOff + 1] * wt;
                            b += src[srcOff + 2] * wt;
                        }
                    }
                }
                data[dstOff]     = Math.min(255, Math.max(0, r));
                data[dstOff + 1] = Math.min(255, Math.max(0, g));
                data[dstOff + 2] = Math.min(255, Math.max(0, b));
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }

    if (generateBtn) {
        generateBtn.addEventListener("click", async () => {
            if (!loadedImage) return;

            const selectedRadio = document.querySelector('input[name="ico-max-size"]:checked');
            if (!selectedRadio) {
                alert("Please select a maximum quality tier.");
                return;
            }

            const maxSize = parseInt(selectedRadio.value);
            const standardMilestones = [16, 32, 48, 64, 128, 256];
            const sizes = standardMilestones.filter((s) => s <= maxSize);

            try {
                const pngBuffers = [];

                for (const size of sizes) {
                    const resizedCanvas = drawHighQualityResizedCanvas(loadedImage, size);
                    const blob = await new Promise((resolve) => {
                        resizedCanvas.toBlob((b) => resolve(b), "image/png");
                    });

                    if (!blob) throw new Error(`Failed to create blob for size ${size}`);
                    const buffer = await blob.arrayBuffer();
                    pngBuffers.push({ size, buffer });
                }

                const icoBlob = createIcoFile(pngBuffers);
                const url = URL.createObjectURL(icoBlob);
                downloadBtn.href = url;

                editorPanel.classList.add("hidden");
                resultPanel.classList.remove("hidden");
            } catch (err) {
                console.error("ICO Generation Error:", err);
                alert("Failed to generate ICO file. Please try another image.");
            }
        });
    }

    // --- Strict Binary Struct Packager (Sorted Largest to Smallest) ---
    function createIcoFile(images) {
        // Sort largest to smallest so Windows Explorer uses 256px as the primary thumbnail
        images.sort((a, b) => b.size - a.size);

        const numImages = images.length;
        const headerSize = 6;
        const directoryEntrySize = 16;
        let offset = headerSize + directoryEntrySize * numImages;

        const headerBuffer = new ArrayBuffer(headerSize);
        const headerView = new DataView(headerBuffer);
        headerView.setUint16(0, 0, true);
        headerView.setUint16(2, 1, true);
        headerView.setUint16(4, numImages, true);

        const dirBuffers = [];
        const dataBuffers = [];

        images.forEach((img) => {
            const size = img.size;
            const buffer = img.buffer;
            const dataLength = buffer.byteLength;

            const dirBuffer = new ArrayBuffer(directoryEntrySize);
            const dirView = new DataView(dirBuffer);

            // 256px width/height must be encoded as 0 in a single byte per Windows ICO spec
            const encodedByteSize = size >= 256 ? 0 : size;

            dirView.setUint8(0, encodedByteSize);
            dirView.setUint8(1, encodedByteSize);
            dirView.setUint8(2, 0);
            dirView.setUint8(3, 0);
            dirView.setUint16(4, 1, true);
            dirView.setUint16(6, 32, true);
            dirView.setUint32(8, dataLength, true);
            dirView.setUint32(12, offset, true);

            dirBuffers.push(dirBuffer);
            dataBuffers.push(buffer);
            offset += dataLength;
        });

        const allBuffers = [headerBuffer, ...dirBuffers, ...dataBuffers];
        return new Blob(allBuffers, { type: "image/x-icon" });
    }
});
