document.addEventListener("DOMContentLoaded", () => {
    const defaultScript = {
        title: "Echoes of Rain",
        startNode: "intro_1",
        nodes: {
            intro_1: {
                x: 80,
                y: 160,
                bg: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                speaker: "System",
                speakerColor: "#a855f7",
                text: "The rain taps steadily against the library window as evening settles over the campus.",
                sprites: [],
                next: "intro_2"
            },
            intro_2: {
                x: 410,
                y: 160,
                bg: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
                speaker: "Aoi",
                speakerColor: "#38bdf8",
                text: "Still debugging that script? You've been staring at that screen for two hours straight.",
                sprites: [{ id: "aoi", name: "Aoi", expression: "Determined", color: "#38bdf8", img: "" }],
                choices: [
                    { text: "Take a break and grab coffee", target: "branch_coffee" },
                    { text: "Push through and finish the build", target: "branch_code" }
                ]
            },
            branch_coffee: {
                x: 760,
                y: 60,
                bg: "linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)",
                speaker: "Aoi",
                speakerColor: "#38bdf8",
                text: "Good choice. Even the best developer engines need a proper cooldown cycle.",
                sprites: [{ id: "aoi", name: "Aoi", expression: "Happy", color: "#38bdf8", img: "" }],
                next: "ending_common"
            },
            branch_code: {
                x: 760,
                y: 310,
                bg: "linear-gradient(135deg, #064e3b 0%, #065f46 100%)",
                speaker: "Aoi",
                speakerColor: "#38bdf8",
                text: "Spoken like a true engineer. Let's squash the last bug together then.",
                sprites: [{ id: "aoi", name: "Aoi", expression: "Focused", color: "#38bdf8", img: "" }],
                next: "ending_common"
            },
            ending_common: {
                x: 1110,
                y: 180,
                bg: "linear-gradient(135deg, #0f172a 0%, #0f172a 100%)",
                speaker: "System",
                speakerColor: "#a855f7",
                text: "End of demo! Open Studio Editor to add custom background images, character portraits, and branches.",
                sprites: [],
                next: null
            }
        }
    };

    let currentStory = JSON.parse(localStorage.getItem("davn_current_story")) || defaultScript;
    let currentNodeId = localStorage.getItem("davn_current_node") || currentStory.startNode || Object.keys(currentStory.nodes)[0];
    let historyLog = JSON.parse(localStorage.getItem("davn_history")) || [];

    function normalizeCoordinates(story) {
        let index = 0;
        Object.keys(story.nodes).forEach((id) => {
            const node = story.nodes[id];
            if (typeof node.x !== "number") node.x = 80 + (index % 4) * 320;
            if (typeof node.y !== "number") node.y = 80 + Math.floor(index / 4) * 240;
            index++;
        });
    }
    normalizeCoordinates(currentStory);

    // ==========================================
    // 1. VISUAL NOVEL PLAYER ENGINE
    // ==========================================
    const vnBg = document.getElementById("vn-bg");
    const vnSprites = document.getElementById("vn-sprites");
    const vnChoices = document.getElementById("vn-choices");
    const vnText = document.getElementById("vn-text");
    const speakerBadge = document.getElementById("speaker-badge");
    const dialogueBox = document.getElementById("dialogue-box");
    const vnSceneTitle = document.getElementById("vn-scene-title");

    let isTyping = false;
    let currentFullText = "";
    let typeTimer = null;

    function renderNode(nodeId) {
        const node = currentStory.nodes[nodeId];
        if (!node) {
            vnText.textContent = "Reached end of script. Open Studio Editor to add more scenes!";
            speakerBadge.textContent = "End";
            vnChoices.classList.add("hidden");
            return;
        }

        currentNodeId = nodeId;
        currentFullText = node.text;
        vnSceneTitle.textContent = currentStory.title || "Visual Novel";

        localStorage.setItem("davn_current_node", currentNodeId);

        if (node.bg && (node.bg.startsWith("http") || node.bg.startsWith("data:"))) {
            vnBg.style.background = `url('${node.bg}') center/cover no-repeat`;
        } else {
            vnBg.style.background = node.bg || "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)";
        }

        speakerBadge.textContent = node.speaker || "Narrator";
        speakerBadge.style.backgroundColor = node.speakerColor || "#a855f7";

        vnSprites.innerHTML = "";
        if (node.sprites && node.sprites.length > 0) {
            node.sprites.forEach((sprite) => {
                const spriteEl = document.createElement("div");
                spriteEl.className = "vn-sprite flex flex-col items-center";

                let visualHtml = "";
                if (sprite.img && sprite.img.trim() !== "") {
                    visualHtml = `<img src="${sprite.img}" alt="${sprite.name}" class="w-32 sm:w-48 h-56 sm:h-80 object-cover rounded-2xl shadow-2xl border border-slate-700/50" />`;
                } else {
                    visualHtml = `
                        <div class="w-28 sm:w-44 h-48 sm:h-72 rounded-2xl bg-gradient-to-t from-slate-900/80 to-slate-800/40 border border-slate-700/50 flex flex-col items-center justify-center shadow-2xl p-4 text-center">
                            <i class="fa-solid fa-user-ninja text-4xl sm:text-6xl mb-3 text-purple-400"></i>
                            <span class="font-bold text-xs sm:text-sm text-white">${sprite.name}</span>
                            <span class="text-[10px] text-slate-400 mt-1 px-2 py-0.5 rounded-full bg-slate-900/60 border border-slate-700">${sprite.expression || "Normal"}</span>
                        </div>
                    `;
                }

                spriteEl.innerHTML = visualHtml;
                vnSprites.appendChild(spriteEl);
            });
        }

        startTypewriter(node.text);
        historyLog.push({ speaker: node.speaker || "Narrator", text: node.text });
        localStorage.setItem("davn_history", JSON.stringify(historyLog));

        vnChoices.innerHTML = "";
        if (node.choices && node.choices.length > 0) {
            vnChoices.classList.remove("hidden");
            node.choices.forEach((choice) => {
                const btn = document.createElement("button");
                btn.className = "vn-choice-btn flex items-center";
                btn.innerHTML = `<i class="fa-solid fa-chevron-right text-purple-400 mr-3 text-xs"></i> <span>${choice.text}</span>`;
                btn.addEventListener("click", (e) => {
                    e.stopPropagation();
                    vnChoices.classList.add("hidden");
                    renderNode(choice.target);
                });
                vnChoices.appendChild(btn);
            });
        } else {
            vnChoices.classList.add("hidden");
        }
    }

    function startTypewriter(text) {
        if (typeTimer) clearInterval(typeTimer);
        vnText.textContent = "";
        isTyping = true;
        let charIndex = 0;

        typeTimer = setInterval(() => {
            if (charIndex < text.length) {
                vnText.textContent += text.charAt(charIndex);
                charIndex++;
            } else {
                clearInterval(typeTimer);
                isTyping = false;
            }
        }, 20);
    }

    function advanceStory() {
        if (isTyping) {
            clearInterval(typeTimer);
            vnText.textContent = currentFullText;
            isTyping = false;
            return;
        }
        const node = currentStory.nodes[currentNodeId];
        if (node && node.choices && node.choices.length > 0) return;
        if (node && node.next) renderNode(node.next);
    }

    dialogueBox.addEventListener("click", advanceStory);

    // ==========================================
    // 2. SAVE / LOAD MENU MANAGER
    // ==========================================
    const saveLoadBtn = document.getElementById("save-load-btn");
    const saveLoadModal = document.getElementById("save-load-modal");
    const closeSaveLoad = document.getElementById("close-save-load");
    const saveSlotsContainer = document.getElementById("save-slots-container");

    function renderSaveSlots() {
        saveSlotsContainer.innerHTML = "";
        for (let i = 1; i <= 4; i++) {
            const slotData = JSON.parse(localStorage.getItem(`davn_slot_${i}`));
            const slotEl = document.createElement("div");
            slotEl.className = "p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-3 text-xs";

            if (slotData) {
                slotEl.innerHTML = `
                    <div class="truncate">
                        <p class="font-bold text-purple-400 text-sm mb-0.5">Slot ${i}: ${slotData.storyTitle}</p>
                        <p class="text-slate-400 truncate"><span class="text-white">${slotData.speaker}:</span> ${slotData.previewText}</p>
                        <p class="text-[10px] text-slate-500 mt-1"><i class="fa-regular fa-clock mr-1"></i> ${slotData.timestamp}</p>
                    </div>
                    <div class="flex items-center gap-1.5 shrink-0">
                        <button class="load-slot-btn px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors" data-slot="${i}">Load</button>
                        <button class="save-slot-btn px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold transition-colors" data-slot="${i}">Overwrite</button>
                    </div>
                `;
            } else {
                slotEl.innerHTML = `
                    <div>
                        <p class="font-bold text-slate-400 text-sm mb-0.5">Slot ${i}</p>
                        <p class="text-slate-500 italic">Empty Slot</p>
                    </div>
                    <button class="save-slot-btn px-3.5 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-semibold transition-colors" data-slot="${i}">Save Game</button>
                `;
            }
            saveSlotsContainer.appendChild(slotEl);
        }

        saveSlotsContainer.querySelectorAll(".save-slot-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                const slotNum = btn.dataset.slot;
                const node = currentStory.nodes[currentNodeId];
                const saveData = {
                    storyTitle: currentStory.title || "Visual Novel",
                    story: currentStory,
                    nodeId: currentNodeId,
                    speaker: node ? (node.speaker || "Narrator") : "Narrator",
                    previewText: node ? node.text.substring(0, 50) + "..." : "",
                    timestamp: new Date().toLocaleString()
                };
                localStorage.setItem(`davn_slot_${slotNum}`, JSON.stringify(saveData));
                renderSaveSlots();
            });
        });

        saveSlotsContainer.querySelectorAll(".load-slot-btn").forEach((btn) => {
            btn.addEventListener("click", () => {
                const slotNum = btn.dataset.slot;
                const saveData = JSON.parse(localStorage.getItem(`davn_slot_${slotNum}`));
                if (saveData) {
                    currentStory = saveData.story;
                    currentNodeId = saveData.nodeId;
                    localStorage.setItem("davn_current_story", JSON.stringify(currentStory));
                    localStorage.setItem("davn_current_node", currentNodeId);
                    historyLog = [];
                    saveLoadModal.classList.add("hidden");
                    renderNode(currentNodeId);
                }
            });
        });
    }

    saveLoadBtn.addEventListener("click", () => {
        renderSaveSlots();
        saveLoadModal.classList.remove("hidden");
    });
    closeSaveLoad.addEventListener("click", () => saveLoadModal.classList.add("hidden"));

    const historyBtn = document.getElementById("history-btn");
    const historyModal = document.getElementById("history-modal");
    const closeHistory = document.getElementById("close-history");
    const historyContent = document.getElementById("history-content");

    historyBtn.addEventListener("click", () => {
        historyContent.innerHTML = "";
        historyLog
            .slice(-30)
            .reverse()
            .forEach((entry) => {
                const div = document.createElement("div");
                div.className = "p-3 rounded-xl bg-slate-900/60 border border-slate-800";
                div.innerHTML = `<p class="font-bold text-purple-400 text-xs mb-1">${entry.speaker}</p><p class="text-slate-300">${entry.text}</p>`;
                historyContent.appendChild(div);
            });
        historyModal.classList.remove("hidden");
    });
    closeHistory.addEventListener("click", () => historyModal.classList.add("hidden"));

    // ==========================================
    // 3. VISUAL NODE-GRAPH STUDIO EDITOR
    // ==========================================
    const studioBtn = document.getElementById("studio-btn");
    const studioModal = document.getElementById("studio-modal");
    const closeStudio = document.getElementById("close-studio");
    const storyTitleInput = document.getElementById("story-title-input");
    const addNodeBtn = document.getElementById("add-node-btn");
    const applyScriptBtn = document.getElementById("apply-script-btn");
    const exportJsonBtn = document.getElementById("export-json-btn");
    const importJsonFile = document.getElementById("import-json-file");

    const nodeCardsLayer = document.getElementById("node-cards-layer");
    const nodeWiresSvg = document.getElementById("node-wires-svg");
    const wiringBanner = document.getElementById("wiring-banner");
    const cancelWiringBtn = document.getElementById("cancel-wiring-btn");

    const inspNodeId = document.getElementById("insp-node-id");
    const inspSetStartBtn = document.getElementById("insp-set-start-btn");
    const inspSpeaker = document.getElementById("insp-speaker");
    const inspColor = document.getElementById("insp-color");
    const inspText = document.getElementById("insp-text");
    const inspBgPreset = document.getElementById("insp-bg-preset");
    const inspBgCustomUrl = document.getElementById("insp-bg-custom-url");
    const inspBgFileWrapper = document.getElementById("insp-bg-file-wrapper");
    const inspBgCustomFile = document.getElementById("insp-bg-custom-file");
    const inspBgImgPreviewText = document.getElementById("insp-bg-img-preview-text");

    const inspSpriteToggle = document.getElementById("insp-sprite-toggle");
    const inspSpriteFields = document.getElementById("insp-sprite-fields");
    const inspSpriteName = document.getElementById("insp-sprite-name");
    const inspSpriteExp = document.getElementById("insp-sprite-exp");
    const inspSpriteImg = document.getElementById("insp-sprite-img");
    const inspSpriteFile = document.getElementById("insp-sprite-file");

    const inspAddChoiceBtn = document.getElementById("insp-add-choice-btn");
    const inspChoicesList = document.getElementById("insp-choices-list");
    const inspDeleteNodeBtn = document.getElementById("insp-delete-node-btn");

    let draftStory = null;
    let selectedNodeId = null;
    let pendingConnection = null;

    studioBtn.addEventListener("click", () => {
        draftStory = JSON.parse(JSON.stringify(currentStory));
        normalizeCoordinates(draftStory);
        storyTitleInput.value = draftStory.title || "Untitled Story";
        selectedNodeId = draftStory.startNode || Object.keys(draftStory.nodes)[0];
        pendingConnection = null;
        wiringBanner.classList.add("hidden");
        studioModal.classList.remove("hidden");
        renderGraph();
        loadInspector(selectedNodeId);
    });

    closeStudio.addEventListener("click", () => {
        pendingConnection = null;
        wiringBanner.classList.add("hidden");
        studioModal.classList.add("hidden");
    });

    storyTitleInput.addEventListener("input", () => {
        if (draftStory) draftStory.title = storyTitleInput.value;
    });

    addNodeBtn.addEventListener("click", () => {
        const newId = "scene_" + Date.now().toString().slice(-4);
        const existingKeys = Object.keys(draftStory.nodes);
        const refNode = draftStory.nodes[selectedNodeId] || draftStory.nodes[existingKeys[existingKeys.length - 1]];
        draftStory.nodes[newId] = {
            x: refNode ? refNode.x + 290 : 120,
            y: refNode ? refNode.y + 40 : 120,
            bg: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
            speaker: "Character",
            speakerColor: "#38bdf8",
            text: "Write your new scene dialogue here...",
            sprites: [],
            next: null
        };
        selectedNodeId = newId;
        renderGraph();
        loadInspector(newId);
    });

    function renderGraph() {
        nodeCardsLayer.innerHTML = "";
        const isConnecting = pendingConnection !== null;

        Object.entries(draftStory.nodes).forEach(([id, node]) => {
            const isStart = draftStory.startNode === id;
            const isSelected = selectedNodeId === id;
            const hasChoices = node.choices && node.choices.length > 0;

            const card = document.createElement("div");
            card.className = `vn-node-box ${isSelected ? "selected" : ""} ${
                isConnecting && pendingConnection.sourceNodeId !== id ? "connect-target-ready" : ""
            }`;
            card.style.left = `${node.x}px`;
            card.style.top = `${node.y}px`;
            card.dataset.nodeId = id;

            let html = `
                <div class="px-3.5 py-2.5 border-b border-slate-800 flex items-center justify-between">
                    <div class="flex items-center gap-2 truncate">
                        <span class="w-2.5 h-2.5 rounded-full shrink-0" style="background:${node.speakerColor || "#a855f7"}"></span>
                        <span class="font-bold text-xs text-white truncate">${node.speaker || "Narrator"}</span>
                    </div>
                    ${
                        isStart
                            ? `<span class="text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Start</span>`
                            : `<span class="text-[10px] font-mono text-slate-500">${id}</span>`
                    }
                </div>
                <div class="p-3.5 text-[11px] text-slate-300 line-clamp-3 leading-relaxed">
                    ${node.text || "<i>(Empty dialogue)</i>"}
                </div>
                <div class="px-3.5 py-2.5 bg-slate-950/60 rounded-b-2xl border-t border-slate-800/80 space-y-1.5">
            `;

            if (hasChoices) {
                node.choices.forEach((ch, idx) => {
                    const targetLabel = ch.target ? `→ ${ch.target}` : "Unlinked";
                    html += `
                        <div class="flex items-center justify-between gap-2 text-[10px] bg-slate-900 px-2 py-1 rounded-lg border border-slate-800">
                            <span class="truncate text-purple-300 font-medium" title="${ch.text}">${ch.text}</span>
                            <div class="flex items-center gap-1.5 shrink-0">
                                <span class="text-[9px] text-slate-500 font-mono">${targetLabel}</span>
                                <button class="vn-pin-out" data-pin-node="${id}" data-pin-choice="${idx}" title="Click to connect response"></button>
                            </div>
                        </div>
                    `;
                });
            } else {
                const nextLabel = node.next ? `→ ${node.next}` : "End of Route";
                html += `
                    <div class="flex items-center justify-between text-[10px] text-slate-400">
                        <span>Next Scene</span>
                        <div class="flex items-center gap-1.5">
                            <span class="font-mono text-[9px] text-slate-500">${nextLabel}</span>
                            <button class="vn-pin-out" data-pin-node="${id}" data-pin-choice="" title="Click to connect next scene"></button>
                        </div>
                    </div>
                `;
            }

            html += `</div>`;
            card.innerHTML = html;

            card.addEventListener("click", (e) => {
                if (e.target.classList.contains("vn-pin-out")) return;

                if (pendingConnection && pendingConnection.sourceNodeId !== id) {
                    const srcNode = draftStory.nodes[pendingConnection.sourceNodeId];
                    if (pendingConnection.choiceIndex !== null) {
                        srcNode.choices[pendingConnection.choiceIndex].target = id;
                    } else {
                        srcNode.next = id;
                    }
                    pendingConnection = null;
                    wiringBanner.classList.add("hidden");
                    renderGraph();
                    loadInspector(selectedNodeId);
                    return;
                }

                selectedNodeId = id;
                renderGraph();
                loadInspector(id);
            });

            let isDragging = false;
            let startX, startY, origX, origY;

            card.addEventListener("mousedown", (e) => {
                if (e.target.classList.contains("vn-pin-out") || pendingConnection) return;
                isDragging = true;
                startX = e.clientX;
                startY = e.clientY;
                origX = node.x;
                origY = node.y;
                selectedNodeId = id;
                loadInspector(id);

                const onMouseMove = (moveEvent) => {
                    if (!isDragging) return;
                    node.x = Math.max(10, origX + (moveEvent.clientX - startX));
                    node.y = Math.max(10, origY + (moveEvent.clientY - startY));
                    card.style.left = `${node.x}px`;
                    card.style.top = `${node.y}px`;
                    drawWires();
                };

                const onMouseUp = () => {
                    isDragging = false;
                    document.removeEventListener("mousemove", onMouseMove);
                    document.removeEventListener("mouseup", onMouseUp);
                    renderGraph();
                };

                document.addEventListener("mousemove", onMouseMove);
                document.addEventListener("mouseup", onMouseUp);
            });

            nodeCardsLayer.appendChild(card);
        });

        document.querySelectorAll(".vn-pin-out").forEach((pin) => {
            pin.addEventListener("click", (e) => {
                e.stopPropagation();
                const srcId = pin.dataset.pinNode;
                const choiceIdx = pin.dataset.pinChoice === "" ? null : parseInt(pin.dataset.pinChoice, 10);
                pendingConnection = { sourceNodeId: srcId, choiceIndex: choiceIdx };
                wiringBanner.classList.remove("hidden");
                renderGraph();
            });
        });

        drawWires();
    }

    cancelWiringBtn.addEventListener("click", () => {
        pendingConnection = null;
        wiringBanner.classList.add("hidden");
        renderGraph();
    });

    function drawWires() {
        nodeWiresSvg.innerHTML = "";

        Object.entries(draftStory.nodes).forEach(([id, node]) => {
            const hasChoices = node.choices && node.choices.length > 0;

            if (hasChoices) {
                node.choices.forEach((ch, idx) => {
                    if (ch.target && draftStory.nodes[ch.target]) {
                        const yOffset = 118 + idx * 30;
                        createCurve(node.x + 245, node.y + yOffset, draftStory.nodes[ch.target].x, draftStory.nodes[ch.target].y + 45, "#a855f7");
                    }
                });
            } else if (node.next && draftStory.nodes[node.next]) {
                createCurve(node.x + 245, node.y + 122, draftStory.nodes[node.next].x, draftStory.nodes[node.next].y + 45, "#38bdf8");
            }
        });
    }

    function createCurve(x1, y1, x2, y2, strokeColor) {
        const dx = Math.max(60, Math.abs(x2 - x1) * 0.5);
        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", `M ${x1} ${y1} C ${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}`);
        path.setAttribute("class", "vn-wire-path");
        path.setAttribute("stroke", strokeColor);
        nodeWiresSvg.appendChild(path);
    }

    function loadInspector(nodeId) {
        const node = draftStory.nodes[nodeId];
        if (!node) return;

        inspNodeId.textContent = nodeId;
        inspSpeaker.value = node.speaker || "";
        inspColor.value = node.speakerColor || "#a855f7";
        inspText.value = node.text || "";

        if (draftStory.startNode === nodeId) {
            inspSetStartBtn.textContent = "✓ Current Start";
            inspSetStartBtn.className = "px-2.5 py-1 rounded-lg text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30";
        } else {
            inspSetStartBtn.textContent = "Set as Start";
            inspSetStartBtn.className = "px-2.5 py-1 rounded-lg text-[11px] font-bold bg-purple-600/20 text-purple-400 border border-purple-500/30 hover:bg-purple-600 hover:text-white transition-colors";
        }

        const presetValues = Array.from(inspBgPreset.options).map(o => o.value);
        if (presetValues.includes(node.bg)) {
            inspBgPreset.value = node.bg;
            inspBgCustomUrl.classList.add("hidden");
            inspBgFileWrapper.classList.add("hidden");
        } else if (node.bg && node.bg.startsWith("data:")) {
            inspBgPreset.value = "custom-file";
            inspBgCustomUrl.classList.add("hidden");
            inspBgFileWrapper.classList.remove("hidden");
            inspBgImgPreviewText.value = "Uploaded background image attached";
        } else {
            inspBgPreset.value = "custom-url";
            inspBgCustomUrl.value = node.bg || "";
            inspBgCustomUrl.classList.remove("hidden");
            inspBgFileWrapper.classList.add("hidden");
        }

        const hasSprite = node.sprites && node.sprites.length > 0;
        inspSpriteToggle.checked = hasSprite;
        if (hasSprite) {
            inspSpriteFields.classList.remove("hidden");
            inspSpriteName.value = node.sprites[0].name || "";
            inspSpriteExp.value = node.sprites[0].expression || "";
            inspSpriteImg.value = node.sprites[0].img || "";
        } else {
            inspSpriteFields.classList.add("hidden");
            inspSpriteName.value = "";
            inspSpriteExp.value = "";
            inspSpriteImg.value = "";
        }

        renderInspectorChoices(node);
    }

    function renderInspectorChoices(node) {
        inspChoicesList.innerHTML = "";
        const allNodeIds = Object.keys(draftStory.nodes);
        if (!node.choices || node.choices.length === 0) return;

        node.choices.forEach((ch, idx) => {
            const row = document.createElement("div");
            row.className = "p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2";

            const optionsHtml = allNodeIds
                .map((targetId) => `<option value="${targetId}" ${ch.target === targetId ? "selected" : ""}>→ ${targetId}</option>`)
                .join("");

            row.innerHTML = `
                <div class="flex items-center gap-1.5">
                    <input type="text" value="${ch.text}" placeholder="Choice text..." class="choice-text-input flex-grow p-1.5 rounded bg-slate-950 border border-slate-700 text-white text-xs" />
                    <button class="remove-choice-btn text-rose-500 hover:text-rose-400 px-1.5" title="Remove Choice"><i class="fa-solid fa-xmark"></i></button>
                </div>
                <div class="flex items-center justify-between gap-2">
                    <span class="text-[10px] text-slate-400">Connects to:</span>
                    <select class="choice-target-select p-1 rounded bg-slate-950 border border-slate-700 text-purple-300 text-[11px] font-mono">
                        <option value="">-- Unlinked --</option>
                        ${optionsHtml}
                    </select>
                </div>
            `;

            row.querySelector(".choice-text-input").addEventListener("input", (e) => {
                ch.text = e.target.value;
                renderGraph();
            });

            row.querySelector(".choice-target-select").addEventListener("change", (e) => {
                ch.target = e.target.value || null;
                renderGraph();
            });

            row.querySelector(".remove-choice-btn").addEventListener("click", () => {
                node.choices.splice(idx, 1);
                if (node.choices.length === 0) delete node.choices;
                renderGraph();
                renderInspectorChoices(node);
            });

            inspChoicesList.appendChild(row);
        });
    }

    inspSetStartBtn.addEventListener("click", () => {
        draftStory.startNode = selectedNodeId;
        renderGraph();
        loadInspector(selectedNodeId);
    });

    inspSpeaker.addEventListener("input", () => {
        draftStory.nodes[selectedNodeId].speaker = inspSpeaker.value;
        renderGraph();
    });

    inspColor.addEventListener("input", () => {
        draftStory.nodes[selectedNodeId].speakerColor = inspColor.value;
        renderGraph();
    });

    inspText.addEventListener("input", () => {
        draftStory.nodes[selectedNodeId].text = inspText.value;
        renderGraph();
    });

    inspBgPreset.addEventListener("change", () => {
        const val = inspBgPreset.value;
        const node = draftStory.nodes[selectedNodeId];
        if (val === "custom-url") {
            inspBgCustomUrl.classList.remove("hidden");
            inspBgFileWrapper.classList.add("hidden");
            node.bg = inspBgCustomUrl.value;
        } else if (val === "custom-file") {
            inspBgCustomUrl.classList.add("hidden");
            inspBgFileWrapper.classList.remove("hidden");
        } else {
            inspBgCustomUrl.classList.add("hidden");
            inspBgFileWrapper.classList.add("hidden");
            node.bg = val;
        }
    });

    inspBgCustomUrl.addEventListener("input", () => {
        draftStory.nodes[selectedNodeId].bg = inspBgCustomUrl.value;
    });

    inspBgCustomFile.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            draftStory.nodes[selectedNodeId].bg = event.target.result;
            inspBgImgPreviewText.value = file.name;
        };
        reader.readAsDataURL(file);
    });

    inspSpriteToggle.addEventListener("change", () => {
        const node = draftStory.nodes[selectedNodeId];
        if (inspSpriteToggle.checked) {
            inspSpriteFields.classList.remove("hidden");
            node.sprites = [{ id: "char", name: inspSpriteName.value || "Character", expression: "Normal", img: inspSpriteImg.value || "" }];
        } else {
            inspSpriteFields.classList.add("hidden");
            node.sprites = [];
        }
    });

    [inspSpriteName, inspSpriteExp, inspSpriteImg].forEach((input) => {
        input.addEventListener("input", () => {
            const node = draftStory.nodes[selectedNodeId];
            if (node.sprites && node.sprites[0]) {
                node.sprites[0].name = inspSpriteName.value || "Character";
                node.sprites[0].expression = inspSpriteExp.value || "Normal";
                node.sprites[0].img = inspSpriteImg.value || "";
            }
        });
    });

    inspSpriteFile.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            const base64Str = event.target.result;
            inspSpriteImg.value = base64Str;
            const node = draftStory.nodes[selectedNodeId];
            if (node.sprites && node.sprites[0]) {
                node.sprites[0].img = base64Str;
            }
        };
        reader.readAsDataURL(file);
    });

    inspAddChoiceBtn.addEventListener("click", () => {
        const node = draftStory.nodes[selectedNodeId];
        if (!node.choices) node.choices = [];
        node.choices.push({ text: "New Option", target: null });
        node.next = null;
        renderGraph();
        renderInspectorChoices(node);
    });

    inspDeleteNodeBtn.addEventListener("click", () => {
        const keys = Object.keys(draftStory.nodes);
        if (keys.length <= 1) {
            alert("You must keep at least one scene box in your story.");
            return;
        }
        delete draftStory.nodes[selectedNodeId];
        if (draftStory.startNode === selectedNodeId) {
            draftStory.startNode = Object.keys(draftStory.nodes)[0];
        }
        selectedNodeId = Object.keys(draftStory.nodes)[0];
        renderGraph();
        loadInspector(selectedNodeId);
    });

    applyScriptBtn.addEventListener("click", () => {
        currentStory = JSON.parse(JSON.stringify(draftStory));
        localStorage.setItem("davn_current_story", JSON.stringify(currentStory));
        currentNodeId = currentStory.startNode;
        historyLog = [];
        localStorage.setItem("davn_history", JSON.stringify(historyLog));
        studioModal.classList.add("hidden");
        renderNode(currentNodeId);
    });

    exportJsonBtn.addEventListener("click", () => {
        const blob = new Blob([JSON.stringify(draftStory, null, 4)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${(draftStory.title || "vn_story").replace(/\s+/g, "_")}.json`;
        a.click();
        URL.revokeObjectURL(url);
    });

    importJsonFile.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
            try {
                const parsed = JSON.parse(event.target.result);
                if (!parsed.nodes || !parsed.startNode) {
                    alert("Invalid story JSON file.");
                    return;
                }
                draftStory = parsed;
                normalizeCoordinates(draftStory);
                storyTitleInput.value = draftStory.title || "Imported Story";
                selectedNodeId = draftStory.startNode;
                renderGraph();
                loadInspector(selectedNodeId);
            } catch (err) {
                alert("Could not parse JSON: " + err.message);
            }
        };
        reader.readAsText(file);
    });

    renderNode(currentNodeId);
});
