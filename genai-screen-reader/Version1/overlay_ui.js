// overlay_ui.js
// Paragraph-level hover reading with AI-first summarization + page summary
// + control-name reading for buttons/links/inputs.
//
// - Hover paragraph/tile  → summarize THAT node's text and speak it.
// - Hover button/link/etc → speak accessible label (no AI).
// - P              → summarize whole page (non-ad content) and speak.
// - Space          → play/pause/resume current speech.
// - Esc            → stop TTS.
// - Ctrl+Shift+A   → re-summarize the currently hovered node.
//
// Uses:
//   ASR.ai.summarizeWithAI (with local fallback inside ai_client.js)
//   ASR.ocr.extractTextFromNode (optional, for shopping sites)
//   ASR.tts.speakText / pauseSpeech / resumeSpeech

(function () {
  const ASR = (window.AISmartReader = window.AISmartReader || {});
  ASR.ui = ASR.ui || {};
  ASR.state = ASR.state || {
    overlayRoot: null,
    previewUI: null,
    speakGeneration: 0,
    currentNode: null,       // current content node (paragraph/tile)
    currentSections: []      // sections passed from content_main.js
  };

  const state = ASR.state;
  const { speakText, pauseSpeech, resumeSpeech } = ASR.tts || {};
  const summarizeWithAI =
    ASR.ai && typeof ASR.ai.summarizeWithAI === "function"
      ? ASR.ai.summarizeWithAI
      : null;

  // ----------------- Utility helpers -----------------
  function isTypingContext(el) {
    if (!el) return false;
    const tag = el.tagName ? el.tagName.toLowerCase() : "";
    return tag === "input" || tag === "textarea" || el.isContentEditable;
  }

  function getNodeText(node) {
    if (!node) return "";
    return (node.innerText || node.textContent || "").replace(/\s+/g, " ").trim();
  }

  function setPreviewBody(text) {
    if (!state.previewUI) return;
    const trimmed = (text || "").trim();
    state.previewUI.bodyEl.textContent =
      trimmed.length > 260 ? trimmed.slice(0, 260) + "…" : trimmed;
  }

  // Accessible label helper for controls (buttons, links, etc.)
  function getAccessibleLabel(el) {
    if (!el) return "";

    // 1) aria-label
    let label = el.getAttribute("aria-label");
    if (label && label.trim()) return label.trim();

    // 2) aria-labelledby
    const labelledById = el.getAttribute("aria-labelledby");
    if (labelledById) {
      const ref = document.getElementById(labelledById);
      if (ref) {
        const t = (ref.innerText || ref.textContent || "").trim();
        if (t) return t;
      }
    }

    // 3) alt (for image buttons / icons)
    label = el.getAttribute("alt");
    if (label && label.trim()) return label.trim();

    // 4) title attribute
    label = el.getAttribute("title");
    if (label && label.trim()) return label.trim();

    // 5) fallback: visible text
    label = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
    return label;
  }

  // ----------------- Highlight sections (for content_main.js) -----------------
  // Draw green outlines and remember sections.
  function highlightSections(sections) {
    state.currentSections = sections || [];
    sections.forEach(sec => {
      sec.domNodes.forEach(node => {
        try {
          node.style.outline = "2px solid rgba(0, 255, 0, 0.4)";
        } catch (e) {
          // ignore errors on weird nodes
        }
      });
    });
  }

  // ----------------- Overlay Root & Preview -----------------
  function createOverlayRoot() {
    const existing = document.getElementById("ai-smart-reader-overlay-root");
    if (existing) existing.remove();

    const root = document.createElement("div");
    root.id = "ai-smart-reader-overlay-root";
    root.style.position = "absolute";
    root.style.top = "0";
    root.style.left = "0";
    root.style.width = "100%";
    root.style.height = "0";
    root.style.pointerEvents = "none";
    root.style.zIndex = "2147483647";

    document.body.appendChild(root);
    state.overlayRoot = root;
    return root;
  }

  function createPreviewBox(root) {
    const box = document.createElement("div");
    box.id = "ai-smart-reader-preview";
    box.style.position = "fixed";
    box.style.bottom = "16px";
    box.style.right = "16px";
    box.style.maxWidth = "360px";
    box.style.background = "rgba(20, 20, 20, 0.95)";
    box.style.color = "#fff";
    box.style.padding = "10px 12px";
    box.style.borderRadius = "10px";
    box.style.fontFamily = "system-ui, sans-serif";
    box.style.fontSize = "12px";
    box.style.boxShadow = "0 4px 14px rgba(0,0,0,0.5)";
    box.style.display = "none";
    box.style.pointerEvents = "auto";

    const headingEl = document.createElement("div");
    headingEl.id = "ai-smart-reader-preview-heading";
    headingEl.style.fontWeight = "600";
    headingEl.style.marginBottom = "6px";
    headingEl.textContent = "AI Smart Reader";

    const bodyEl = document.createElement("div");
    bodyEl.id = "ai-smart-reader-preview-body";
    bodyEl.style.marginBottom = "8px";

    const controls = document.createElement("div");
    controls.style.display = "flex";
    controls.style.gap = "6px";

    const btnPlay = document.createElement("button");
    btnPlay.textContent = "▶ Play";
    btnPlay.style.padding = "4px 6px";
    btnPlay.style.background = "#2ecc71";
    btnPlay.style.border = "none";
    btnPlay.style.borderRadius = "4px";
    btnPlay.style.cursor = "pointer";
    btnPlay.style.color = "#fff";
    btnPlay.style.fontSize = "11px";

    const btnPause = document.createElement("button");
    btnPause.textContent = "⏸ Pause";
    btnPause.style.padding = "4px 6px";
    btnPause.style.background = "#f1c40f";
    btnPause.style.border = "none";
    btnPause.style.borderRadius = "4px";
    btnPause.style.cursor = "pointer";
    btnPause.style.color = "#000";
    btnPause.style.fontSize = "11px";

    const btnStop = document.createElement("button");
    btnStop.textContent = "⏹ Stop";
    btnStop.style.padding = "4px 6px";
    btnStop.style.background = "#e74c3c";
    btnStop.style.border = "none";
    btnStop.style.borderRadius = "4px";
    btnStop.style.cursor = "pointer";
    btnStop.style.color = "#fff";
    btnStop.style.fontSize = "11px";

    controls.appendChild(btnPlay);
    controls.appendChild(btnPause);
    controls.appendChild(btnStop);

    box.appendChild(headingEl);
    box.appendChild(bodyEl);
    box.appendChild(controls);
    root.appendChild(box);

    const previewUI = { box, headingEl, bodyEl, btnPlay, btnPause, btnStop };
    state.previewUI = previewUI;

    btnPlay.addEventListener("click", () => {
      if (!state.currentNode) return;
      speakNode(state.currentNode);
    });

    btnPause.addEventListener("click", () => {
      if (pauseSpeech) pauseSpeech();
      else window.speechSynthesis.pause();
    });

    btnStop.addEventListener("click", () => {
      window.speechSynthesis.cancel();
    });

    return previewUI;
  }

  function showPreviewForNode(node, summaryText) {
    const previewUI = state.previewUI;
    if (!previewUI) return;

    const text = getNodeText(node);
    previewUI.headingEl.textContent = "Paragraph summary";
    setPreviewBody(summaryText || text);
    previewUI.box.style.display = "block";
  }

  function showPreviewForPage(summaryText) {
    const previewUI = state.previewUI;
    if (!previewUI) return;

    previewUI.headingEl.textContent = "Page summary";
    setPreviewBody(summaryText);
    previewUI.box.style.display = "block";
  }

  function hidePreview() {
    const previewUI = state.previewUI;
    if (!previewUI) return;
    previewUI.box.style.display = "none";
  }

  // ----------------- Speaking logic per node (with optional OCR) -----------------
  async function speakNode(node) {
    if (!node || !speakText) return;

    // Bump generation counter; stale async responses won't speak.
    state.speakGeneration = (state.speakGeneration || 0) + 1;
    const myGen = state.speakGeneration;

    state.currentNode = node;

    // 1) Get visible DOM text
    let rawText = getNodeText(node);

    // 2) If it's too short AND OCR module is available, augment with OCR
    if (ASR.ocr && typeof ASR.ocr.extractTextFromNode === "function") {
      try {
        rawText = await ASR.ocr.extractTextFromNode(node, rawText);
      } catch (ocrErr) {
        console.error("[AI Smart Reader] OCR error:", ocrErr);
      }
    }

    rawText = (rawText || "").trim();
    if (!rawText) return;

    // 3) Show preview immediately with whatever text we have now
    showPreviewForNode(node, rawText);

    // 4) If we have no AI at all, just read the paragraph
    if (!summarizeWithAI) {
      speakText(rawText);
      return;
    }

    // Show loading indicator in preview while AI runs
    if (state.previewUI) {
      state.previewUI.bodyEl.textContent = "Summarizing paragraph…";
    }

    let summary = rawText;
    try {
      summary = await summarizeWithAI(rawText);
    } catch (err) {
      console.error("[AI Smart Reader] summarizeWithAI error:", err);
      summary = rawText;
    }

    // 5) If a newer speak started while we waited, abort this one.
    if (myGen !== state.speakGeneration) {
      return;
    }

    const finalText = summary || rawText;
    showPreviewForNode(node, finalText);
    speakText(finalText);
  }

  // ----------------- Page summary helpers -----------------
  function collectPageMainText() {
    const chunks = [];

    if (state.currentSections && state.currentSections.length) {
      state.currentSections.forEach(sec => {
        const text = (sec.bodyText || sec.summaryText || "").trim();
        if (!text) return;

        const lower = text.toLowerCase();
        // crude ad/sponsored filter
        if (
          lower.includes("sponsored") ||
          lower.includes("sponsored results") ||
          lower.includes("advertisement")
        ) {
          return;
        }

        chunks.push(text);
      });
    } else {
      const bodyText = (document.body.innerText || "").replace(/\s+/g, " ").trim();
      if (bodyText) chunks.push(bodyText);
    }

    return chunks.join("\n\n");
  }

  async function summarizeWholePageAndSpeak() {
    if (!speakText) return;

    // Stop any current speech
    window.speechSynthesis.cancel();

    const allText = collectPageMainText();
    if (!allText || allText.trim().length < 20) {
      console.warn("[AI Smart Reader] Page summary: not enough text.");
      return;
    }

    let summaryText = allText;

    if (summarizeWithAI) {
      try {
        summaryText = await summarizeWithAI(allText);
      } catch (err) {
        console.error("[AI Smart Reader] Page summarizeWithAI error:", err);
      }
    }

    summaryText = (summaryText || allText).trim();
    showPreviewForPage(summaryText);
    speakText(summaryText);
  }

  // ----------------- Interactive controls hover (buttons/links/inputs) -----------------
  function handleInteractiveEnter(e) {
    const el = e.currentTarget;
    const label = getAccessibleLabel(el);
    if (!label) return;

    // Stop ongoing long reads so control label is heard clearly
    window.speechSynthesis.cancel();

    const previewUI = state.previewUI;
    if (previewUI) {
      previewUI.headingEl.textContent = "Control";
      setPreviewBody(label);
      previewUI.box.style.display = "block";
    }

    if (speakText) {
      speakText(label);
    }
  }

  function handleInteractiveLeave(e) {
    // We keep the preview; user may still be listening.
    // If you want to hide preview on leave, uncomment:
    // hidePreview();
  }

  function initInteractiveHover() {
    const interactiveSelectors = [
      "button",
      "[role='button']",
      "a[href]",
      "input",
      "select",
      "textarea",
      "[role='link']",
      "[role='menuitem']"
    ].join(",");

    document.querySelectorAll(interactiveSelectors).forEach(el => {
      // Avoid double-binding
      if (el.__aiSmartReaderInteractiveBound) return;
      el.__aiSmartReaderInteractiveBound = true;

      el.addEventListener("mouseenter", handleInteractiveEnter);
      el.addEventListener("mouseleave", handleInteractiveLeave);
    });
  }

  // ----------------- Paragraph wiring -----------------
  // content_main.js passes `sections` with .domNodes; we hook hover to each domNode.
  function createOverlays(sections) {
    state.currentSections = sections || [];

    const root = createOverlayRoot();
    createPreviewBox(root);

    // Visually highlight sections
    highlightSections(sections);

    // Attach hover handlers directly to each paragraph-like domNode
    sections.forEach(sec => {
      sec.domNodes.forEach(node => {
        node.addEventListener("mouseenter", () => {
          state.currentNode = node;
          speakNode(node);
        });
        node.addEventListener("mouseleave", () => {
          // do not stop TTS on leave; user can move mouse while listening
        });
      });
    });

    // NEW: also enable hover for interactive controls
    initInteractiveHover();
  }

  // ----------------- Key handling -----------------
  async function handleGlobalKeydown(e) {
    // Esc = hard stop TTS
    if (e.key === "Escape") {
      window.speechSynthesis.cancel();
      return;
    }

    // P = summarize the whole page (non-ad content)
    if (e.key === "p" || e.key === "P") {
      if (isTypingContext(document.activeElement)) return;
      e.preventDefault();
      await summarizeWholePageAndSpeak();
      return;
    }

    // Ctrl+Shift+A = force re-summarize current node
    if ((e.key === "A" || e.key === "a") && e.ctrlKey && e.shiftKey) {
      if (isTypingContext(document.activeElement)) return;
      if (!state.currentNode) return;
      e.preventDefault();
      await speakNode(state.currentNode);
      return;
    }

    // Space = play/pause/resume current speech
    if (e.code === "Space" || e.key === " ") {
      if (isTypingContext(document.activeElement)) return;
      e.preventDefault();

      const synth = window.speechSynthesis;
      if (synth.paused) {
        if (resumeSpeech) resumeSpeech();
        else synth.resume();
        return;
      }
      if (synth.speaking) {
        if (pauseSpeech) pauseSpeech();
        else synth.pause();
        return;
      }

      // Not speaking → speak current node again
      if (state.currentNode) {
        await speakNode(state.currentNode);
      }
      return;
    }
  }

  // Expose functions used by content_main.js / others
  ASR.ui.highlightSections = highlightSections;
  ASR.ui.createOverlays = createOverlays;
  ASR.ui.handleGlobalKeydown = handleGlobalKeydown;
  ASR.ui.summarizeWholePageAndSpeak = summarizeWholePageAndSpeak;
})();
