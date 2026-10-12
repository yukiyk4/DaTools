document.addEventListener("DOMContentLoaded", () => {
    // Configure PDF.js worker
    pdfjsLib.GlobalWorkerOptions.workerSrc = "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";

    // DOM Elements
    const dropzone = document.getElementById("pdf-dropzone");
    const pdfInput = document.getElementById("pdf-input");
    const browseBtn = document.getElementById("browse-btn");
    const workspace = document.getElementById("editor-workspace");

    const renderCanvas = document.getElementById("pdf-render-canvas");
    const renderCtx = renderCanvas.getContext("2d");
    const annotationCanvas = document.getElementById("annotation-canvas");
    const annotCtx = annotationCanvas.getContext("2d");

    const thumbnailContainer = document.getElementById("thumbnail-container");
    const totalPageCountEl = document.getElementById("total-page-count");
    const currentPageNumEl = document.getElementById("current-page-num");
    const maxPageNumEl = document.getElementById("max-page-num");

    // Tool Buttons
    const toolBtns = document.querySelectorAll(".pdf-tool-btn");
    const pickerColor = document.getElementById("picker-color");
    const pickerSize = document.getElementById("picker-size");

    // Action Controls
    const btnUndo = document.getElementById("btn-undo");
    const btnClearPage = document.getElementById("btn-clear-page");
    const btnClosePdf = document.getElementById("btn-close-pdf");
    const btnRotatePage = document.getElementById("btn-rotate-page");
    const btnDeletePage = document.getElementById("btn-delete-page");
    const btnExportPdf = document.getElementById("btn-export-pdf");
    const btnAddPage = document.getElementById("btn-add-page");

    // Navigation & Zoom
    const btnPrevPage = document.getElementById("btn-prev-page");
    const btnNextPage = document.getElementById("btn-next-page");
    const btnZoomIn = document.getElementById("btn-zoom-in");
    const btnZoomOut = document.getElementById("btn-zoom-out");
    const zoomLabel = document.getElementById("zoom-label");

    // App State
    let originalPdfBytes = null;
    let pdfDoc = null;
    let currentPageIndex = 0; // 0-indexed
    let totalPages = 0;
    let currentZoom = 1.0;
    let currentTool = "select"; // 'select', 'draw', 'highlight', 'eraser', 'text', 'rect', 'circle', 'watermark'
    let rotations = []; // degree per page
    let pageAnnotations = []; // drawing stroke actions per page

    // Drawing state
    let isDrawing = false;
    let startX = 0;
    let startY = 0;

    // File Selection Handlers
    browseBtn.addEventListener("click", () => pdfInput.click());
    pdfInput.addEventListener("change", (e) => {
        if (e.target.files && e.target.files[0]) loadPdfFile(e.target.files[0]);
    });

    dropzone.addEventListener("dragover", (e) => {
        e.preventDefault();
        dropzone.classList.add("border-rose-500", "bg-rose-500/5");
    });
    dropzone.addEventListener("dragleave", () => dropzone.classList.remove("border-rose-500", "bg-rose-500/5"));
    dropzone.addEventListener("drop", (e) => {
        e.preventDefault();
        dropzone.classList.remove("border-rose-500", "bg-rose-500/5");
        if (e.dataTransfer.files && e.dataTransfer.files[0]) loadPdfFile(e.dataTransfer.files[0]);
    });

    async function loadPdfFile(file) {
        if (file.type !== "application/pdf") {
            alert("Please select a valid PDF file.");
            return;
        }

        const arrayBuffer = await file.arrayBuffer();
        originalPdfBytes = new Uint8Array(arrayBuffer);
        pdfDoc = await pdfjsLib.getDocument({ data: originalPdfBytes }).promise;

        totalPages = pdfDoc.numPages;
        currentPageIndex = 0;
        rotations = new Array(totalPages).fill(0);
        pageAnnotations = Array.from({ length: totalPages }, () => []);

        dropzone.classList.add("hidden");
        workspace.classList.remove("hidden");

        totalPageCountEl.textContent = totalPages;
        maxPageNumEl.textContent = totalPages;

        await renderThumbnails();
        await renderCurrentPage();
    }

    // Reset / Close Current PDF
    btnClosePdf.addEventListener("click", () => {
        if (confirm("Close current PDF and discard changes?")) {
            originalPdfBytes = null;
            pdfDoc = null;
            pdfInput.value = "";
            workspace.classList.add("hidden");
            dropzone.classList.remove("hidden");
        }
    });

    // Render Page Thumbnails in Sidebar
    async function renderThumbnails() {
        thumbnailContainer.innerHTML = "";
        for (let i = 0; i < totalPages; i++) {
            const page = await pdfDoc.getPage(i + 1);
            const viewport = page.getViewport({ scale: 0.2 });

            const thumbBox = document.createElement("div");
            thumbBox.className = `thumbnail-item ${i === currentPageIndex ? "active" : ""}`;
            thumbBox.dataset.pageIndex = i;

            const canvas = document.createElement("canvas");
            canvas.className = "thumbnail-canvas";
            canvas.width = viewport.width;
            canvas.height = viewport.height;
            const ctx = canvas.getContext("2d");

            await page.render({ canvasContext: ctx, viewport: viewport }).promise;

            const label = document.createElement("p");
            label.className = "text-center text-xs font-semibold mt-1 text-slate-500";
            label.textContent = `Page ${i + 1}`;

            thumbBox.appendChild(canvas);
            thumbBox.appendChild(label);

            thumbBox.addEventListener("click", () => {
                currentPageIndex = i;
                updateActiveThumbnail();
                renderCurrentPage();
            });

            thumbnailContainer.appendChild(thumbBox);
        }
    }

    function updateActiveThumbnail() {
        document.querySelectorAll(".thumbnail-item").forEach((item, idx) => {
            if (idx === currentPageIndex) {
                item.classList.add("active");
                item.scrollIntoView({ behavior: "smooth", block: "nearest" });
            } else {
                item.classList.remove("active");
            }
        });
    }

    // Render Current Page on Main Stage
    async function renderCurrentPage() {
        if (!pdfDoc) return;

        currentPageNumEl.textContent = currentPageIndex + 1;
        updateActiveThumbnail();

        const page = await pdfDoc.getPage(currentPageIndex + 1);
        const rotation = rotations[currentPageIndex] || 0;
        const viewport = page.getViewport({ scale: currentZoom * 1.5, rotation: rotation });

        renderCanvas.width = viewport.width;
        renderCanvas.height = viewport.height;
        annotationCanvas.width = viewport.width;
        annotationCanvas.height = viewport.height;

        await page.render({ canvasContext: renderCtx, viewport: viewport }).promise;
        redrawAnnotations();
    }

    // Tool Switcher logic
    toolBtns.forEach((btn) => {
        btn.addEventListener("click", () => {
            toolBtns.forEach((b) => b.classList.remove("active"));
            btn.classList.add("active");
            currentTool = btn.id.replace("tool-", "");

            if (currentTool === "select") {
                annotationCanvas.style.pointerEvents = "none";
            } else {
                annotationCanvas.style.pointerEvents = "auto";
            }
        });
    });

    // Drawing Canvas Handlers
    annotationCanvas.addEventListener("mousedown", (e) => {
        if (currentTool === "select") return;

        const rect = annotationCanvas.getBoundingClientRect();
        startX = e.clientX - rect.left;
        startY = e.clientY - rect.top;

        // Eraser Tool: Click near an annotation item to delete it
        if (currentTool === "eraser") {
            const annots = pageAnnotations[currentPageIndex];
            // Search backwards to delete top-most annotation first
            for (let i = annots.length - 1; i >= 0; i--) {
                const item = annots[i];
                let hit = false;
                if (item.type === "draw" || item.type === "highlight") {
                    hit = item.points.some(p => Math.hypot(p.x - startX, p.y - startY) < 20);
                } else if (item.type === "rect" || item.type === "circle") {
                    hit = startX >= item.x && startX <= item.x + item.width && startY >= item.y && startY <= item.y + item.height;
                } else if (item.type === "text") {
                    hit = Math.hypot(item.x - startX, item.y - startY) < 30;
                }
                if (hit) {
                    annots.splice(i, 1);
                    redrawAnnotations();
                    break;
                }
            }
            return;
        }

        if (currentTool === "text") {
            const text = prompt("Enter text to insert:");
            if (text) {
                pageAnnotations[currentPageIndex].push({
                    type: "text",
                    text: text,
                    x: startX,
                    y: startY,
                    color: pickerColor.value,
                    size: parseInt(pickerSize.value) * 4
                });
                redrawAnnotations();
            }
            return;
        }

        if (currentTool === "watermark") {
            const wmText = prompt("Enter Watermark Text:", "CONFIDENTIAL");
            if (wmText) {
                pageAnnotations[currentPageIndex].push({
                    type: "watermark",
                    text: wmText,
                    x: annotationCanvas.width / 2,
                    y: annotationCanvas.height / 2,
                    color: "rgba(225, 29, 72, 0.25)",
                    size: 48
                });
                redrawAnnotations();
            }
            return;
        }

        isDrawing = true;
        if (currentTool === "draw" || currentTool === "highlight") {
            pageAnnotations[currentPageIndex].push({
                type: currentTool,
                color: currentTool === "highlight" ? hexToRgba(pickerColor.value, 0.35) : pickerColor.value,
                size: currentTool === "highlight" ? parseInt(pickerSize.value) * 3 : parseInt(pickerSize.value),
                points: [{ x: startX, y: startY }]
            });
        }
    });

    annotationCanvas.addEventListener("mousemove", (e) => {
        if (!isDrawing) return;
        const rect = annotationCanvas.getBoundingClientRect();
        const currentX = e.clientX - rect.left;
        const currentY = e.clientY - rect.top;

        const currentAnnots = pageAnnotations[currentPageIndex];

        if (currentTool === "draw" || currentTool === "highlight") {
            const lastStroke = currentAnnots[currentAnnots.length - 1];
            lastStroke.points.push({ x: currentX, y: currentY });
            redrawAnnotations();
        }
    });

    annotationCanvas.addEventListener("mouseup", (e) => {
        if (!isDrawing) return;
        isDrawing = false;

        const rect = annotationCanvas.getBoundingClientRect();
        const endX = e.clientX - rect.left;
        const endY = e.clientY - rect.top;

        if (currentTool === "rect" || currentTool === "circle") {
            pageAnnotations[currentPageIndex].push({
                type: currentTool,
                x: Math.min(startX, endX),
                y: Math.min(startY, endY),
                width: Math.abs(endX - startX),
                height: Math.abs(endY - startY),
                color: pickerColor.value,
                size: parseInt(pickerSize.value)
            });
            redrawAnnotations();
        }
    });

    function redrawAnnotations() {
        annotCtx.clearRect(0, 0, annotationCanvas.width, annotationCanvas.height);
        const annots = pageAnnotations[currentPageIndex] || [];

        annots.forEach((item) => {
            annotCtx.beginPath();
            annotCtx.strokeStyle = item.color;
            annotCtx.fillStyle = item.color;
            annotCtx.lineWidth = item.size;
            annotCtx.lineCap = "round";
            annotCtx.lineJoin = "round";

            if (item.type === "draw" || item.type === "highlight") {
                if (item.points.length < 2) return;
                annotCtx.moveTo(item.points[0].x, item.points[0].y);
                for (let i = 1; i < item.points.length; i++) {
                    annotCtx.lineTo(item.points[i].x, item.points[i].y);
                }
                annotCtx.stroke();
            } else if (item.type === "rect") {
                annotCtx.strokeRect(item.x, item.y, item.width, item.height);
            } else if (item.type === "circle") {
                annotCtx.beginPath();
                annotCtx.arc(item.x + item.width / 2, item.y + item.height / 2, Math.max(item.width, item.height) / 2, 0, 2 * Math.PI);
                annotCtx.stroke();
            } else if (item.type === "text") {
                annotCtx.font = `${item.size}px Inter, sans-serif`;
                annotCtx.fillText(item.text, item.x, item.y);
            } else if (item.type === "watermark") {
                annotCtx.save();
                annotCtx.translate(item.x, item.y);
                annotCtx.rotate(-Math.PI / 4);
                annotCtx.font = `bold ${item.size}px Inter, sans-serif`;
                annotCtx.textAlign = "center";
                annotCtx.fillText(item.text, 0, 0);
                annotCtx.restore();
            }
        });
    }

    function hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    // Actions Logic
    btnUndo.addEventListener("click", () => {
        if (pageAnnotations[currentPageIndex].length > 0) {
            pageAnnotations[currentPageIndex].pop();
            redrawAnnotations();
        }
    });

    btnClearPage.addEventListener("click", () => {
        if (confirm("Clear all annotations on this page?")) {
            pageAnnotations[currentPageIndex] = [];
            redrawAnnotations();
        }
    });

    btnRotatePage.addEventListener("click", () => {
        rotations[currentPageIndex] = (rotations[currentPageIndex] + 90) % 360;
        renderCurrentPage();
    });

    btnDeletePage.addEventListener("click", () => {
        if (totalPages <= 1) {
            alert("Cannot delete the only remaining page.");
            return;
        }
        if (confirm(`Delete Page ${currentPageIndex + 1}?`)) {
            rotations.splice(currentPageIndex, 1);
            pageAnnotations.splice(currentPageIndex, 1);
            totalPages--;
            totalPageCountEl.textContent = totalPages;
            maxPageNumEl.textContent = totalPages;
            if (currentPageIndex >= totalPages) currentPageIndex = totalPages - 1;
            renderThumbnails();
            renderCurrentPage();
        }
    });

    btnAddPage.addEventListener("click", () => {
        totalPages++;
        rotations.push(0);
        pageAnnotations.push([]);
        totalPageCountEl.textContent = totalPages;
        maxPageNumEl.textContent = totalPages;
        renderThumbnails();
    });

    // Navigation Controls
    btnPrevPage.addEventListener("click", () => {
        if (currentPageIndex > 0) {
            currentPageIndex--;
            renderCurrentPage();
        }
    });

    btnNextPage.addEventListener("click", () => {
        if (currentPageIndex < totalPages - 1) {
            currentPageIndex++;
            renderCurrentPage();
        }
    });

    btnZoomIn.addEventListener("click", () => {
        if (currentZoom < 2.5) {
            currentZoom += 0.25;
            zoomLabel.textContent = `${Math.round(currentZoom * 100)}%`;
            renderCurrentPage();
        }
    });

    btnZoomOut.addEventListener("click", () => {
        if (currentZoom > 0.5) {
            currentZoom -= 0.25;
            zoomLabel.textContent = `${Math.round(currentZoom * 100)}%`;
            renderCurrentPage();
        }
    });

    // PDF Exporting via PDF-LIB
    btnExportPdf.addEventListener("click", async () => {
        if (!originalPdfBytes) return;

        try {
            const pdfDocLib = await PDFLib.PDFDocument.load(originalPdfBytes);
            const pageCount = pdfDocLib.getPageCount();

            // Apply page rotations
            for (let i = 0; i < pageCount; i++) {
                if (rotations[i]) {
                    const page = pdfDocLib.getPage(i);
                    page.setRotation(PDFLib.degrees(rotations[i]));
                }
            }

            const pdfBytes = await pdfDocLib.save();
            const blob = new Blob([pdfBytes], { type: "application/pdf" });
            const link = document.createElement("a");
            link.href = URL.createObjectURL(blob);
            link.download = "edited-datools.pdf";
            link.click();
        } catch (err) {
            console.error("Export Error:", err);
            alert("Error generating edited PDF document.");
        }
    });
});
