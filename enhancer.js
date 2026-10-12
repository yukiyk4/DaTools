document.addEventListener("DOMContentLoaded", () => {
    const dropzone = document.getElementById("dropzone");
    const fileInput = document.getElementById("file-input");
    const workspaceControls = document.getElementById("workspace-controls");
    const previewSection = document.getElementById("preview-section");
    const loadingSpinner = document.getElementById("loading-spinner");
    const loadingStatus = document.getElementById("loading-status");
    const resultContainer = document.getElementById("result-container");
    const originalPreview = document.getElementById("original-preview");
    const enhancedPreview = document.getElementById("enhanced-preview");
    const processBtn = document.getElementById("process-btn");
    const resetImageBtn = document.getElementById("reset-image-btn");
    const downloadBtn = document.getElementById("download-btn");
    const scaleSelect = document.getElementById("scale-select");
    const noiseSelect = document.getElementById("noise-select");
    const outputDimensions = document.getElementById("output-dimensions");

    let activeImageFile = null;

    dropzone.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) {
            handleSelectedImage(e.target.files[0]);
        }
    });

    dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("border-purple-500", "bg-purple-500/5");
    });

    dropzone.addEventListener("dragleave", () => {
        dropzone.classList.remove("border-purple-500", "bg-purple-500/5");
    });

    dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("border-purple-500", "bg-purple-500/5");
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleSelectedImage(e.dataTransfer.files[0]);
        }
    });

    function handleSelectedImage(file) {
        if (!file.type.startsWith("image/")) {
            alert("Please upload a valid image file.");
            return;
        }
        activeImageFile = file;
        const reader = new FileReader();
        reader.onload = (e) => {
            originalPreview.src = e.target.result;
            dropzone.classList.add("hidden");
            workspaceControls.classList.remove("hidden");
            previewSection.classList.remove("hidden");
            resultContainer.classList.add("hidden");
        };
        reader.readAsDataURL(file);
    }

    resetImageBtn.addEventListener("click", () => {
        activeImageFile = null;
        fileInput.value = "";
        dropzone.classList.remove("hidden");
        workspaceControls.classList.add("hidden");
        previewSection.classList.add("hidden");
    });

    processBtn.addEventListener("click", () => {
        if (!activeImageFile) return;

        loadingSpinner.classList.remove("hidden");
        resultContainer.classList.add("hidden");
        loadingStatus.textContent = "Initializing high-definition canvas pipeline...";

        setTimeout(() => {
            loadingStatus.textContent = "Applying advanced sharpening & scale algorithms...";
            setTimeout(() => {
                executeAdvancedEnhancement();
            }, 500);
        }, 400);
    });

    function executeAdvancedEnhancement() {
        const img = new Image();
        img.onload = () => {
            const scale = parseInt(scaleSelect.value) || 2;
            const noiseLevel = parseInt(noiseSelect.value) || 1;

            const targetWidth = img.width * scale;
            const targetHeight = img.height * scale;

            const canvas = document.createElement("canvas");
            canvas.width = targetWidth;
            canvas.height = targetHeight;
            const ctx = canvas.getContext("2d");

            // Maximum quality bicubic interpolation
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = "high";
            ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

            // Apply visible sharpening / edge contrast matrix filter if enabled
            if (noiseLevel > 0) {
                applyCrispEdgeFilter(ctx, targetWidth, targetHeight, noiseLevel);
            }

            const dataUrl = canvas.toDataURL("image/png");
            enhancedPreview.src = dataUrl;
            downloadBtn.href = dataUrl;
            outputDimensions.textContent = `${targetWidth} × ${targetHeight}px`;

            loadingSpinner.classList.add("hidden");
            resultContainer.classList.remove("hidden");
        };
        img.src = originalPreview.src;
    }

    function applyCrispEdgeFilter(ctx, width, height, level) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const w = width;
        const h = height;

        const srcPixels = new Uint8ClampedArray(data);

        // Intensity scaling based on selected Denoise/Sharpness tier
        const amount = level === 2 ? 0.5 : 0.3;

        for (let y = 1; y < h - 1; y++) {
            for (let x = 1; x < w - 1; x++) {
                const idx = (y * w + x) * 4;

                for (let c = 0; c < 3; c++) {
                    const current = srcPixels[idx + c];
                    const top = srcPixels[((y - 1) * w + x) * 4 + c];
                    const bottom = srcPixels[((y + 1) * w + x) * 4 + c];
                    const left = srcPixels[(y * w + (x - 1)) * 4 + c];
                    const right = srcPixels[(y * w + (x + 1)) * 4 + c];

                    // High-pass filter kernel for crisp line extraction
                    const sharpened = current * (1 + 4 * amount) - (top + bottom + left + right) * amount;
                    data[idx + c] = Math.min(255, Math.max(0, sharpened));
                }
            }
        }
        ctx.putImageData(imageData, 0, 0);
    }
});
