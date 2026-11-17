document.addEventListener("DOMContentLoaded", () => {
    // --- Tabs Navigation ---
    const tabBtns = document.querySelectorAll(".tab-btn");
    const tabContents = document.querySelectorAll(".tab-content");

    tabBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            const targetId = btn.getAttribute("data-tab");

            // Update buttons active state
            tabBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");

            // Update tab contents visibility
            tabContents.forEach((content) => {
                if (content.id === targetId) {
                    content.classList.remove("hidden");
                    content.classList.add("active");
                } else {
                    content.classList.add("hidden");
                    content.classList.remove("active");
                }
            });
        });
    });

    // ==========================================
    // 1. VIDEO RESIZER LOGIC
    // ==========================================
    const dropzone = document.getElementById("video-dropzone");
    const videoInput = document.getElementById("video-input");
    const urlLoaderSection = document.getElementById("url-loader-section");
    const videoUrlInput = document.getElementById("video-url-input");
    const loadVideoUrlBtn = document.getElementById("load-video-url-btn");

    const editorPanel = document.getElementById("video-editor");
    const videoPreview = document.getElementById("video-preview");
    const framingCanvas = document.getElementById("framing-canvas");
    const framingCtx = framingCanvas.getContext("2d", { alpha: false });

    const origResBadge = document.getElementById("orig-res-badge");
    const targetResBadge = document.getElementById("target-res-badge");
    const changeVideoBtn = document.getElementById("change-video-btn");

    const resPreset = document.getElementById("res-preset");
    const fitMode = document.getElementById("fit-mode");
    const outWidthInput = document.getElementById("out-width");
    const outHeightInput = document.getElementById("out-height");
    const lockAspectCheckbox = document.getElementById("lock-aspect");

    const rotateBtn = document.getElementById("rotate-btn");
    const rotateValSpan = document.getElementById("rotate-val");
    const flipHBtn = document.getElementById("flip-h-btn");
    const flipVBtn = document.getElementById("flip-v-btn");
    const muteAudioBtn = document.getElementById("mute-audio-btn");

    const startTimeInput = document.getElementById("start-time");
    const endTimeInput = document.getElementById("end-time");
    const setStartNowBtn = document.getElementById("set-start-now");
    const setEndNowBtn = document.getElementById("set-end-now");
    const targetFpsSelect = document.getElementById("target-fps");
    const bitrateSelect = document.getElementById("bitrate-select");

    const renderBtn = document.getElementById("render-video-btn");
    const cancelRenderBtn = document.getElementById("cancel-render-btn");
    const resultPanel = document.getElementById("video-result-panel");
    const statusBox = document.getElementById("video-status-box");
    const statusText = document.getElementById("video-status-text");
    const progressPercent = document.getElementById("progress-percent");
    const videoProgress = document.getElementById("video-progress");
    const resultContainer = document.getElementById("video-result-container");
    const resultPlayer = document.getElementById("video-result-player");
    const outputFileSize = document.getElementById("output-file-size");
    const downloadBtn = document.getElementById("download-btn");
    const resetBtn = document.getElementById("reset-btn");

    let sourceAspect = 16 / 9;
    let rotation = 0;
    let flipH = false;
    let flipV = false;
    let keepAudio = true;
    let isRendering = false;
    let activeRecorder = null;
    let previewRafId = null;

    dropzone.addEventListener("click", () => videoInput.click());
    dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("drag-over");
    });
    dropzone.addEventListener("dragleave", () => dropzone.classList.remove("drag-over"));
    dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("drag-over");
        if (e.dataTransfer.files.length) loadVideoFile(e.dataTransfer.files[0]);
    });

    videoInput.addEventListener("change", (e) => {
        if (e.target.files.length) loadVideoFile(e.target.files[0]);
    });

    loadVideoUrlBtn.addEventListener("click", () => {
        const url = videoUrlInput.value.trim();
        if (url) loadVideoSource(url);
    });

    changeVideoBtn.addEventListener("click", () => {
        videoPreview.pause();
        editorPanel.classList.add("hidden");
        resultPanel.classList.add("hidden");
        dropzone.classList.remove("hidden");
        urlLoaderSection.classList.remove("hidden");
        videoInput.value = "";
    });

    function loadVideoFile(file) {
        loadVideoSource(URL.createObjectURL(file));
    }

    function loadVideoSource(url) {
        videoPreview.crossOrigin = "anonymous";
        videoPreview.src = url;

        videoPreview.onloadedmetadata = () => {
            const vw = videoPreview.videoWidth || 1280;
            const vh = videoPreview.videoHeight || 720;
            sourceAspect = vw / vh;

            origResBadge.textContent = `${vw} × ${vh}`;
            startTimeInput.value = 0;
            endTimeInput.value = videoPreview.duration.toFixed(1);
            endTimeInput.max = videoPreview.duration.toFixed(1);

            resPreset.value = "720p";
            applyPreset("720p");

            dropzone.classList.add("hidden");
            urlLoaderSection.classList.add("hidden");
            editorPanel.classList.remove("hidden");
            resultPanel.classList.add("hidden");
        };

        videoPreview.onerror = () => alert("Could not load video. Check file format or CORS permissions.");
    }

    const previewModeBtns = document.querySelectorAll("#video-tab .preview-mode-btn");
    previewModeBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            previewModeBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");

            if (btn.dataset.mode === "framing") {
                videoPreview.classList.add("hidden");
                framingCanvas.classList.remove("hidden");
                startLiveFramingLoop();
            } else {
                stopLiveFramingLoop();
                framingCanvas.classList.add("hidden");
                videoPreview.classList.remove("hidden");
            }
        });
    });

    function startLiveFramingLoop() {
        const renderPreview = () => {
            const w = parseInt(outWidthInput.value) || 640;
            const h = parseInt(outHeightInput.value) || 360;
            framingCanvas.width = w;
            framingCanvas.height = h;
            drawTransformedFrame(framingCtx, videoPreview, w, h);
            previewRafId = requestAnimationFrame(renderPreview);
        };
        renderPreview();
    }

    function stopLiveFramingLoop() {
        if (previewRafId) {
            cancelAnimationFrame(previewRafId);
            previewRafId = null;
        }
    }

    function ensureEven(num) {
        const n = Math.max(16, Math.round(num));
        return n % 2 === 0 ? n : n + 1;
    }

    function updateBadge() {
        targetResBadge.textContent = `${outWidthInput.value} × ${outHeightInput.value}`;
    }

    function applyPreset(preset) {
        const effectiveAspect = rotation % 180 !== 0 ? 1 / sourceAspect : sourceAspect;
        if (preset === "1080p") {
            outHeightInput.value = 1080;
            outWidthInput.value = lockAspectCheckbox.checked ? ensureEven(1080 * effectiveAspect) : 1920;
        } else if (preset === "720p") {
            outHeightInput.value = 720;
            outWidthInput.value = lockAspectCheckbox.checked ? ensureEven(720 * effectiveAspect) : 1280;
        } else if (preset === "480p") {
            outHeightInput.value = 480;
            outWidthInput.value = lockAspectCheckbox.checked ? ensureEven(480 * effectiveAspect) : 854;
        } else if (preset === "360p") {
            outHeightInput.value = 360;
            outWidthInput.value = lockAspectCheckbox.checked ? ensureEven(360 * effectiveAspect) : 640;
        } else if (preset === "shorts") {
            lockAspectCheckbox.checked = false;
            outWidthInput.value = 1080;
            outHeightInput.value = 1920;
            fitMode.value = "cover";
        } else if (preset === "square") {
            lockAspectCheckbox.checked = false;
            outWidthInput.value = 1080;
            outHeightInput.value = 1080;
            fitMode.value = "cover";
        }
        updateBadge();
    }

    resPreset.addEventListener("change", () => applyPreset(resPreset.value));

    outWidthInput.addEventListener("input", () => {
        resPreset.value = "custom";
        if (lockAspectCheckbox.checked) {
            const effectiveAspect = rotation % 180 !== 0 ? 1 / sourceAspect : sourceAspect;
            const w = parseInt(outWidthInput.value) || 16;
            outHeightInput.value = ensureEven(w / effectiveAspect);
        }
        updateBadge();
    });

    outHeightInput.addEventListener("input", () => {
        resPreset.value = "custom";
        if (lockAspectCheckbox.checked) {
            const effectiveAspect = rotation % 180 !== 0 ? 1 / sourceAspect : sourceAspect;
            const h = parseInt(outHeightInput.value) || 16;
            outWidthInput.value = ensureEven(h * effectiveAspect);
        }
        updateBadge();
    });

    rotateBtn.addEventListener("click", () => {
        rotation = (rotation + 90) % 360;
        rotateValSpan.textContent = `${rotation}°`;
        const tempW = outWidthInput.value;
        outWidthInput.value = outHeightInput.value;
        outHeightInput.value = tempW;
        updateBadge();
    });

    flipHBtn.addEventListener("click", () => {
        flipH = !flipH;
        flipHBtn.classList.toggle("active-chip", flipH);
    });

    flipVBtn.addEventListener("click", () => {
        flipV = !flipV;
        flipVBtn.classList.toggle("active-chip", flipV);
    });

    muteAudioBtn.addEventListener("click", () => {
        keepAudio = !keepAudio;
        muteAudioBtn.innerHTML = keepAudio
            ? `<i class="fa-solid fa-volume-high mr-1.5"></i> <span>Keep Audio</span>`
            : `<i class="fa-solid fa-volume-xmark mr-1.5 text-rose-400"></i> <span class="text-rose-400">Audio Muted</span>`;
    });

    setStartNowBtn.addEventListener("click", () => {
        startTimeInput.value = videoPreview.currentTime.toFixed(1);
    });

    setEndNowBtn.addEventListener("click", () => {
        endTimeInput.value = videoPreview.currentTime.toFixed(1);
    });

    function drawTransformedFrame(ctx, video, targetW, targetH) {
        ctx.fillStyle = "#000000";
        ctx.fillRect(0, 0, targetW, targetH);
        const vw = video.videoWidth || targetW;
        const vh = video.videoHeight || targetH;
        const isRotated90 = rotation % 180 !== 0;
        const srcW = isRotated90 ? vh : vw;
        const srcH = isRotated90 ? vw : vh;
        let drawW = targetW;
        let drawH = targetH;
        const mode = fitMode.value;
        if (mode === "contain") {
            const scale = Math.min(targetW / srcW, targetH / srcH);
            drawW = srcW * scale;
            drawH = srcH * scale;
        } else if (mode === "cover") {
            const scale = Math.max(targetW / srcW, targetH / srcH);
            drawW = srcW * scale;
            drawH = srcH * scale;
        }
        ctx.save();
        ctx.translate(targetW / 2, targetH / 2);
        ctx.rotate((rotation * Math.PI) / 180);
        ctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
        const finalW = isRotated90 ? drawH : drawW;
        const finalH = isRotated90 ? drawW : drawH;
        ctx.drawImage(video, -finalW / 2, -finalH / 2, finalW, finalH);
        ctx.restore();
    }

    renderBtn.addEventListener("click", async () => {
        if (isRendering) return;
        const startTime = parseFloat(startTimeInput.value) || 0;
        const endTime = parseFloat(endTimeInput.value) || videoPreview.duration;
        const outW = ensureEven(parseInt(outWidthInput.value) || 1280);
        const outH = ensureEven(parseInt(outHeightInput.value) || 720);
        const fps = parseInt(targetFpsSelect.value) || 30;
        const bitrate = parseInt(bitrateSelect.value) || 4000000;

        if (startTime >= endTime || endTime > videoPreview.duration + 0.1) {
            alert("Please enter a valid start and end time within the video duration.");
            return;
        }

        isRendering = true;
        stopLiveFramingLoop();
        resultPanel.classList.remove("hidden");
        statusBox.classList.remove("hidden");
        resultContainer.classList.add("hidden");
        videoProgress.value = 0;
        progressPercent.textContent = "0%";
        statusText.textContent = "Preparing high-speed render stream...";

        const offscreenCanvas = document.createElement("canvas");
        offscreenCanvas.width = outW;
        offscreenCanvas.height = outH;
        const ctx = offscreenCanvas.getContext("2d", { alpha: false, desynchronized: true });

        const canvasStream = offscreenCanvas.captureStream(fps);
        const combinedTracks = [...canvasStream.getVideoTracks()];

        if (keepAudio) {
            try {
                const videoStream = videoPreview.captureStream ? videoPreview.captureStream() : null;
                if (videoStream && videoStream.getAudioTracks().length > 0) {
                    combinedTracks.push(...videoStream.getAudioTracks());
                }
            } catch (err) {
                console.warn("Audio track capture skipped:", err);
            }
        }

        const finalStream = new MediaStream(combinedTracks);
        const mimeTypes = ["video/mp4;codecs=avc1", "video/mp4", "video/webm;codecs=vp9,opus", "video/webm"];
        const selectedMime = mimeTypes.find((type) => MediaRecorder.isTypeSupported(type)) || "";
        const fileExt = selectedMime.includes("mp4") ? "mp4" : "webm";

        const chunks = [];
        activeRecorder = new MediaRecorder(finalStream, { mimeType: selectedMime || undefined, videoBitsPerSecond: bitrate });
        activeRecorder.ondataavailable = (e) => { if (e.data && e.data.size > 0) chunks.push(e.data); };
        activeRecorder.onstop = () => {
            isRendering = false;
            if (chunks.length === 0) return;
            const blob = new Blob(chunks, { type: selectedMime || "video/webm" });
            const url = URL.createObjectURL(blob);
            resultPlayer.src = url;
            downloadBtn.href = url;
            downloadBtn.download = `DaVid_${outW}x${outH}.${fileExt}`;
            outputFileSize.textContent = `${(blob.size / (1024 * 1024)).toFixed(2)} MB (${fileExt.toUpperCase()})`;
            statusBox.classList.add("hidden");
            resultContainer.classList.remove("hidden");
        };

        videoPreview.pause();
        videoPreview.muted = !keepAudio;
        videoPreview.currentTime = startTime;
        await new Promise((resolve) => { videoPreview.onseeked = () => { videoPreview.onseeked = null; resolve(); }; });

        statusText.textContent = "Rendering and encoding frames smoothly...";
        activeRecorder.start(250);
        await videoPreview.play();

        const duration = endTime - startTime;
        let lastFrameTime = 0;
        const frameInterval = 1 / fps;

        const renderStep = () => {
            if (!isRendering) return;
            if (videoPreview.currentTime >= endTime || videoPreview.ended) {
                videoPreview.pause();
                if (activeRecorder && activeRecorder.state !== "inactive") activeRecorder.stop();
                return;
            }
            const currentElapsed = videoPreview.currentTime - startTime;
            if (currentElapsed - lastFrameTime >= frameInterval * 0.9) {
                drawTransformedFrame(ctx, videoPreview, outW, outH);
                lastFrameTime = currentElapsed;
            }
            const pct = Math.min(100, Math.max(0, (currentElapsed / duration) * 100));
            videoProgress.value = pct;
            progressPercent.textContent = `${Math.round(pct)}%`;
            requestAnimationFrame(renderStep);
        };
        requestAnimationFrame(renderStep);
    });

    cancelRenderBtn.addEventListener("click", () => {
        isRendering = false;
        videoPreview.pause();
        if (activeRecorder && activeRecorder.state !== "inactive") activeRecorder.stop();
        resultPanel.classList.add("hidden");
    });

    resetBtn.addEventListener("click", () => location.reload());

    // ==========================================
    // 2. IMAGE RESIZER LOGIC
    // ==========================================
    const imgDropzone = document.getElementById("image-dropzone");
    const imgInput = document.getElementById("image-input");
    const imgEditor = document.getElementById("image-editor");
    const imgPreview = document.getElementById("image-preview-element");
    const changeImgBtn = document.getElementById("change-image-btn");

    const imgOrigRes = document.getElementById("img-orig-res");
    const imgTargetRes = document.getElementById("img-target-res");
    const imgResPreset = document.getElementById("img-res-preset");
    const imgWidthInput = document.getElementById("img-width");
    const imgHeightInput = document.getElementById("img-height");
    const imgLockAspect = document.getElementById("img-lock-aspect");
    const imgFormatSelect = document.getElementById("img-format");
    const imgQualitySelect = document.getElementById("img-quality");

    const renderImgBtn = document.getElementById("render-image-btn");
    const imgResultPanel = document.getElementById("image-result-panel");
    const imgResultPreview = document.getElementById("image-result-preview");
    const imgOutputSize = document.getElementById("img-output-size");
    const imgDownloadBtn = document.getElementById("img-download-btn");
    const imgResetBtn = document.getElementById("img-reset-btn");

    let loadedImage = null;
    let imgSourceAspect = 1;

    imgDropzone.addEventListener("click", () => imgInput.click());
    imgDropzone.addEventListener("dragover", (e) => e.preventDefault());
    imgDropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        if (e.dataTransfer.files.length) loadImageFile(e.dataTransfer.files[0]);
    });
    imgInput.addEventListener("change", (e) => {
        if (e.target.files.length) loadImageFile(e.target.files[0]);
    });

    changeImgBtn.addEventListener("click", () => {
        imgEditor.classList.add("hidden");
        imgResultPanel.classList.add("hidden");
        imgDropzone.classList.remove("hidden");
        imgInput.value = "";
    });

    function loadImageFile(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                loadedImage = img;
                imgSourceAspect = img.naturalWidth / img.naturalHeight;
                imgOrigRes.textContent = `${img.naturalWidth} × ${img.naturalHeight}`;

                // Default preset to 720p or scale naturally
                if (imgResPreset) {
                    imgResPreset.value = "720p";
                    applyImagePreset("720p");
                } else {
                    imgWidthInput.value = img.naturalWidth;
                    imgHeightInput.value = img.naturalHeight;
                    imgTargetRes.textContent = `${img.naturalWidth} × ${img.naturalHeight}`;
                }

                imgPreview.src = e.target.result;
                imgDropzone.classList.add("hidden");
                imgEditor.classList.remove("hidden");
                imgResultPanel.classList.add("hidden");
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    function applyImagePreset(preset) {
        if (!loadedImage) return;

        if (preset === "1080p") {
            imgHeightInput.value = 1080;
            imgWidthInput.value = imgLockAspect.checked ? Math.round(1080 * imgSourceAspect) : 1920;
        } else if (preset === "720p") {
            imgHeightInput.value = 720;
            imgWidthInput.value = imgLockAspect.checked ? Math.round(720 * imgSourceAspect) : 1280;
        } else if (preset === "480p") {
            imgHeightInput.value = 480;
            imgWidthInput.value = imgLockAspect.checked ? Math.round(480 * imgSourceAspect) : 854;
        } else if (preset === "square") {
            imgLockAspect.checked = false;
            imgWidthInput.value = 1080;
            imgHeightInput.value = 1080;
        } else if (preset === "story") {
            imgLockAspect.checked = false;
            imgWidthInput.value = 1080;
            imgHeightInput.value = 1920;
        }
        imgTargetRes.textContent = `${imgWidthInput.value} × ${imgHeightInput.value}`;
    }

    if (imgResPreset) {
        imgResPreset.addEventListener("change", () => {
            if (imgResPreset.value !== "custom") {
                applyImagePreset(imgResPreset.value);
            }
        });
    }

    imgWidthInput.addEventListener("input", () => {
        if (imgResPreset) imgResPreset.value = "custom";
        if (imgLockAspect.checked && loadedImage) {
            const w = parseInt(imgWidthInput.value) || 1;
            imgHeightInput.value = Math.round(w / imgSourceAspect);
        }
        imgTargetRes.textContent = `${imgWidthInput.value} × ${imgHeightInput.value}`;
    });

    imgHeightInput.addEventListener("input", () => {
        if (imgResPreset) imgResPreset.value = "custom";
        if (imgLockAspect.checked && loadedImage) {
            const h = parseInt(imgHeightInput.value) || 1;
            imgWidthInput.value = Math.round(h * imgSourceAspect);
        }
        imgTargetRes.textContent = `${imgWidthInput.value} × ${imgHeightInput.value}`;
    });

    renderImgBtn.addEventListener("click", () => {
        if (!loadedImage) return;

        const targetW = parseInt(imgWidthInput.value) || 800;
        const targetH = parseInt(imgHeightInput.value) || 600;
        const format = imgFormatSelect.value;
        const quality = parseFloat(imgQualitySelect.value) || 0.85;

        const canvas = document.createElement("canvas");
        canvas.width = targetW;
        canvas.height = targetH;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(loadedImage, 0, 0, targetW, targetH);

        canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            imgResultPreview.src = url;
            imgDownloadBtn.href = url;
            const ext = format.split("/")[1];
            imgDownloadBtn.download = `DaVid_Resized_${targetW}x${targetH}.${ext}`;
            imgOutputSize.textContent = `${(blob.size / 1024).toFixed(1)} KB`;

            imgResultPanel.classList.remove("hidden");
        }, format, quality);
    });

    if (imgResetBtn) {
        imgResetBtn.addEventListener("click", () => location.reload());
    }
});
