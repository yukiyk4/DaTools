document.addEventListener("DOMContentLoaded", () => {
    // Tabs Navigation
    const tabBtns = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    tabBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            tabBtns.forEach((b) => b.classList.remove("active"));
            tabContents.forEach((c) => {
                c.classList.remove("active");
                c.classList.add("hidden");
            });
            btn.classList.add("active");
            const targetTab = document.getElementById(btn.dataset.tab);
            targetTab.classList.remove("hidden");
            targetTab.classList.add("active");
        });
    });

    // --- HELPER: Dynamic Blob Worker Factory for gif.js ---
    async function createGifInstance(width, height) {
        try {
            const response = await fetch("https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js");
            const workerCode = await response.text();
            const blob = new Blob([workerCode], { type: "application/javascript" });
            const blobUrl = URL.createObjectURL(blob);

            return new GIF({
                workers: 2,
                quality: 10,
                width: width,
                height: height,
                workerScript: blobUrl
            });
        } catch (e) {
            console.warn("Blob worker fetch failed, falling back to local file:", e);
            return new GIF({
                workers: 2,
                quality: 10,
                width: width,
                height: height,
                workerScript: "gif.worker.js"
            });
        }
    }

    // --- VIDEO TO GIF ---
    const videoDropzone = document.getElementById("video-dropzone");
    const videoInput = document.getElementById("video-input");
    const videoEditor = document.getElementById("video-editor");
    const videoPreview = document.getElementById("video-preview");
    const convertVideoBtn = document.getElementById("convert-video-btn");

    videoDropzone.addEventListener("click", () => videoInput.click());
    videoDropzone.addEventListener("dragover", (e) => e.preventDefault());
    videoDropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length) {
            videoInput.files = e.dataTransfer.files;
            handleVideoUpload({ target: videoInput });
        }
    });

    videoInput.addEventListener("change", handleVideoUpload);

    function handleVideoUpload(e) {
        const file = e.target.files[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        loadVideoSource(url);
    }

    function loadVideoSource(url) {
        videoPreview.crossOrigin = "anonymous";
        videoPreview.src = url;
        videoDropzone.classList.add("hidden");
        videoEditor.classList.remove("hidden");

        videoPreview.onloadedmetadata = () => {
            document.getElementById("end-time").value = Math.min(5, videoPreview.duration).toFixed(1);
        };
        videoPreview.onerror = () => {
            alert("Failed to load video. Ensure the file or URL is valid and accessible.");
        };
    }

    convertVideoBtn.addEventListener("click", async () => {
        const startTime = parseFloat(document.getElementById("start-time").value);
        const endTime = parseFloat(document.getElementById("end-time").value);
        const fps = parseInt(document.getElementById("fps").value);
        const targetWidth = parseInt(document.getElementById("width").value);

        if (isNaN(startTime) || isNaN(endTime) || startTime >= endTime || endTime > videoPreview.duration) {
            alert("Please select a valid time range within the video duration.");
            return;
        }

        showProcessingState();

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const aspectRatio = videoPreview.videoWidth / videoPreview.videoHeight || 16 / 9;
        canvas.width = targetWidth;
        canvas.height = Math.round(targetWidth / aspectRatio);

        const gif = await createGifInstance(canvas.width, canvas.height);

        const interval = 1 / fps;
        let currentTime = startTime;
        videoPreview.pause();

        const captureFrame = (time) => {
            return new Promise((resolve) => {
                let resolved = false;
                const onSeeked = () => {
                    if (resolved) return;
                    resolved = true;
                    videoPreview.removeEventListener("seeked", onSeeked);
                    ctx.drawImage(videoPreview, 0, 0, canvas.width, canvas.height);
                    gif.addFrame(ctx, { copy: true, delay: interval * 1000 });
                    resolve();
                };

                videoPreview.addEventListener("seeked", onSeeked);
                videoPreview.currentTime = time;

                setTimeout(() => {
                    if (!resolved) {
                        onSeeked();
                    }
                }, 400);
            });
        };

        try {
            while (currentTime <= endTime) {
                await captureFrame(currentTime);
                currentTime += interval;
                const progressPercent = Math.min(50, ((currentTime - startTime) / (endTime - startTime)) * 50);
                updateProgress(progressPercent);
            }
            renderGIF(gif);
        } catch (err) {
            console.error(err);
            alert("An error occurred while capturing video frames.");
            document.getElementById("result-panel").classList.add("hidden");
        }
    });

    // --- IMAGES TO GIF ---
    const imagesDropzone = document.getElementById("images-dropzone");
    const imagesInput = document.getElementById("images-input");
    const imagesEditor = document.getElementById("images-editor");
    const frameList = document.getElementById("frame-list");
    const convertImagesBtn = document.getElementById("convert-images-btn");
    let imageFiles = [];

    imagesDropzone.addEventListener("click", () => imagesInput.click());
    imagesDropzone.addEventListener("dragover", (e) => e.preventDefault());
    imagesDropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length) {
            imagesInput.files = e.dataTransfer.files;
            handleImagesUpload({ target: imagesInput });
        }
    });

    imagesInput.addEventListener("change", handleImagesUpload);

    function handleImagesUpload(e) {
        imageFiles = Array.from(e.target.files);
        if (!imageFiles.length) return;

        frameList.innerHTML = "";
        imageFiles.forEach((file) => {
            const img = document.createElement("img");
            img.src = URL.createObjectURL(file);
            img.classList.add("frame-item");
            frameList.appendChild(img);
        });

        imagesDropzone.classList.add("hidden");
        imagesEditor.classList.remove("hidden");
    }

    convertImagesBtn.addEventListener("click", async () => {
        if (!imageFiles.length) return;

        const frameDelay = parseInt(document.getElementById("frame-delay").value);
        const targetWidth = parseInt(document.getElementById("img-width").value);

        showProcessingState();

        const firstImg = new Image();
        firstImg.src = URL.createObjectURL(imageFiles[0]);
        await firstImg.decode();

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const aspectRatio = firstImg.naturalWidth / firstImg.naturalHeight || 4 / 3;
        canvas.width = targetWidth;
        canvas.height = Math.round(targetWidth / aspectRatio);

        const gif = await createGifInstance(canvas.width, canvas.height);

        for (let i = 0; i < imageFiles.length; i++) {
            const img = new Image();
            img.src = URL.createObjectURL(imageFiles[i]);
            await img.decode();
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            gif.addFrame(ctx, { copy: true, delay: frameDelay });
            updateProgress(((i + 1) / imageFiles.length) * 50);
        }

        renderGIF(gif);
    });

    // --- VIDEO URL LOADER ---
    const videoUrlInput = document.getElementById("video-url-input");
    const loadVideoUrlBtn = document.getElementById("load-video-url-btn");

    if (loadVideoUrlBtn && videoUrlInput) {
        loadVideoUrlBtn.addEventListener("click", () => {
            const url = videoUrlInput.value.trim();
            if (!url) return;
            loadVideoSource(url);
        });
    }

    // --- IMAGE URL LOADER ---
    const imageUrlInput = document.getElementById("image-url-input");
    const loadImageUrlBtn = document.getElementById("load-image-url-btn");

    if (loadImageUrlBtn && imageUrlInput) {
        loadImageUrlBtn.addEventListener("click", async () => {
            const url = imageUrlInput.value.trim();
            if (!url) return;

            try {
                const response = await fetch(url, { mode: "cors" });
                const blob = await response.blob();
                const file = new File([blob], "web_image.jpg", { type: blob.type });

                imageFiles.push(file);

                const img = document.createElement("img");
                img.src = URL.createObjectURL(file);
                img.classList.add("frame-item");
                frameList.appendChild(img);

                imagesDropzone.classList.add("hidden");
                imagesEditor.classList.remove("hidden");
                imageUrlInput.value = "";
            } catch (err) {
                console.error(err);
                alert("Could not load image URL directly due to CORS restrictions. Try downloading the image locally first.");
            }
        });
    }

    // --- HELPERS ---
    function showProcessingState() {
        document.getElementById("result-panel").classList.remove("hidden");
        document.getElementById("gif-preview-container").classList.add("hidden");
        document.getElementById("status-box").classList.remove("hidden");
        document.getElementById("status-text").innerText = "Rendering and capturing frames...";
        document.getElementById("gif-progress").value = 0;
    }

    function updateProgress(val) {
        document.getElementById("gif-progress").value = val;
    }

    function renderGIF(gif) {
        document.getElementById("status-text").innerText = "Encoding final GIF output...";

        gif.on("progress", function (p) {
            updateProgress(50 + p * 50);
        });

        gif.on("finished", function (blob) {
            const url = URL.createObjectURL(blob);
            document.getElementById("gif-result-img").src = url;
            document.getElementById("download-btn").href = url;

            document.getElementById("status-box").classList.add("hidden");
            document.getElementById("gif-preview-container").classList.remove("hidden");
        });

        gif.render();
    }

    const resetBtn = document.getElementById("reset-btn");
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            location.reload();
        });
    }
});
