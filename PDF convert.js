document.addEventListener("DOMContentLoaded", () => {
    // --- DOM Elements ---
    const fileInput = document.getElementById("fileInput");
    const addMoreInput = document.getElementById("addMoreInput");
    const previewContainer = document.getElementById("previewContainer");
    const imageListContainer = document.getElementById("imageListContainer");
    const clearAllBtn = document.getElementById("clearAllBtn");

    const convertBtn = document.getElementById("convertBtn");

    const loadingState = document.getElementById("loadingState");
    const successState = document.getElementById("successState");
    const downloadLink = document.getElementById("downloadLink");
    const convertAnotherBtn = document.getElementById("convertAnotherBtn");
    const errorBox = document.getElementById("errorBox");
    const errorMessageText = document.getElementById("errorMessageText");
    const dropzone = document.getElementById("dropzone");

    // Array holding image objects: { id, file, name, size, dataUrl }
    let imageQueue = [];
    let draggedIndex = null;

    // --- File Selection & Adding Handlers ---
    fileInput.addEventListener("change", (e) => handleFiles(e.target.files));
    if (addMoreInput) {
        addMoreInput.addEventListener("change", (e) => handleFiles(e.target.files));
    }

    async function handleFiles(files) {
        if (!files || files.length === 0) return;

        errorBox.classList.add("hidden");

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (!["image/png", "image/jpeg", "image/jpg", "image/webp"].includes(file.type)) continue;

            const dataUrl = await readFileAsDataURL(file);
            imageQueue.push({
                id: Math.random().toString(36).substring(2, 9),
                file: file,
                name: file.name,
                size: formatBytes(file.size),
                dataUrl: dataUrl
            });
        }

        if (imageQueue.length > 0) {
            dropzone.classList.add("hidden");
            previewContainer.classList.remove("hidden");
            renderImageList();
        }

        fileInput.value = "";
        if (addMoreInput) addMoreInput.value = "";
    }

    function readFileAsDataURL(file) {
        return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (evt) => resolve(evt.target.result);
            reader.readAsDataURL(file);
        });
    }

    // --- Render Interactive Drag-and-Drop Reorderable List ---
    function renderImageList() {
        imageListContainer.innerHTML = "";

        imageQueue.forEach((item, index) => {
            const card = document.createElement("div");
            card.draggable = true;
            card.dataset.index = index;
            card.className =
                "draggable-page-card flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-2xl gap-3 transition-all hover:border-blue-400 cursor-grab active:cursor-grabbing select-none";

            card.innerHTML = `
                <div class="flex items-center space-x-3 overflow-hidden pointer-events-none">
                    <div class="text-slate-400 px-1">
                        <i class="fa-solid fa-grip-vertical"></i>
                    </div>
                    <span class="page-num-badge w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                        ${index + 1}
                    </span>
                    <img src="${item.dataUrl}" alt="Thumbnail" class="w-12 h-12 object-cover rounded-xl border border-slate-200 shrink-0" />
                    <div class="truncate">
                        <h4 class="font-semibold text-slate-800 text-sm truncate">${item.name}</h4>
                        <span class="text-xs text-slate-400 font-medium">Page ${index + 1} &bull; ${item.size} &bull; Drag to reorder</span>
                    </div>
                </div>
                <div class="flex items-center shrink-0">
                    <button type="button" onclick="removeItem('${item.id}')" class="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors pointer-events-auto" title="Remove Page">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            `;

            // --- Drag and Drop Events ---
            card.addEventListener("dragstart", (e) => {
                draggedIndex = index;
                card.classList.add("dragging-card");
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", index);
            });

            card.addEventListener("dragover", (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (draggedIndex === null || draggedIndex === index) return;
                card.classList.add("drag-target-highlight");
            });

            card.addEventListener("dragleave", () => {
                card.classList.remove("drag-target-highlight");
            });

            card.addEventListener("drop", (e) => {
                e.preventDefault();
                card.classList.remove("drag-target-highlight");

                if (draggedIndex === null || draggedIndex === index) return;

                const [movedItem] = imageQueue.splice(draggedIndex, 1);
                imageQueue.splice(index, 0, movedItem);

                draggedIndex = null;
                renderImageList();
            });

            card.addEventListener("dragend", () => {
                draggedIndex = null;
                document.querySelectorAll(".draggable-page-card").forEach((el) => {
                    el.classList.remove("dragging-card", "drag-target-highlight");
                });
            });

            imageListContainer.appendChild(card);
        });
    }

    window.removeItem = (id) => {
        imageQueue = imageQueue.filter(item => item.id !== id);
        if (imageQueue.length === 0) {
            resetState();
        } else {
            renderImageList();
        }
    };

    clearAllBtn.addEventListener("click", () => resetState());
    convertAnotherBtn.addEventListener("click", () => resetState());

    function resetState() {
        imageQueue = [];
        fileInput.value = "";
        if (addMoreInput) addMoreInput.value = "";
        previewContainer.classList.add("hidden");
        dropzone.classList.remove("hidden");
        loadingState.classList.add("hidden");
        successState.classList.add("hidden");
        errorBox.classList.add("hidden");
    }

    // --- Convert Multi-Images to Edge-to-Edge PDF (Exact Image Dimensions, No White Margins) ---
    convertBtn.addEventListener("click", async () => {
        if (imageQueue.length === 0) return;

        try {
            previewContainer.classList.add("hidden");
            loadingState.classList.remove("hidden");
            errorBox.classList.add("hidden");

            const { jsPDF } = window.jspdf;

            // Load first image dimensions to initialize document
            const firstImgObj = new Image();
            firstImgObj.src = imageQueue[0].dataUrl;
            await new Promise((resolve) => (firstImgObj.onload = resolve));

            const pxToMm = 0.264583; // Pixel to Millimeter scale factor
            const firstW = firstImgObj.naturalWidth * pxToMm;
            const firstH = firstImgObj.naturalHeight * pxToMm;

            const doc = new jsPDF({
                orientation: firstW > firstH ? "landscape" : "portrait",
                unit: "mm",
                format: [firstW, firstH]
            });

            for (let i = 0; i < imageQueue.length; i++) {
                const item = imageQueue[i];
                const imgObj = new Image();
                imgObj.src = item.dataUrl;
                await new Promise((resolve) => (imgObj.onload = resolve));

                const imgW = imgObj.naturalWidth * pxToMm;
                const imgH = imgObj.naturalHeight * pxToMm;

                if (i > 0) {
                    doc.addPage([imgW, imgH], imgW > imgH ? "landscape" : "portrait");
                }

                const ext = item.file.name.split(".").pop().toUpperCase();
                const format = ["JPG", "JPEG"].includes(ext) ? "JPEG" : "PNG";

                // Draw edge-to-edge with zero margins
                doc.addImage(item.dataUrl, format, 0, 0, imgW, imgH);
            }

            const pdfBlob = doc.output("blob");
            const blobUrl = URL.createObjectURL(pdfBlob);

            downloadLink.href = blobUrl;
            downloadLink.download = `DocToPDF_EdgeToEdge_${Date.now()}.pdf`;

            loadingState.classList.add("hidden");
            successState.classList.remove("hidden");
        } catch (err) {
            console.error(err);
            loadingState.classList.add("hidden");
            previewContainer.classList.remove("hidden");
            errorMessageText.textContent = "Failed to compile PDF. Please check your image formats.";
            errorBox.classList.remove("hidden");
        }
    });

    function formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return "0 Bytes";
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ["Bytes", "KB", "MB", "GB"];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i];
    }
});