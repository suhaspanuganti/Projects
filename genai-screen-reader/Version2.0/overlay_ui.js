// overlay_ui.js
// AI Smart Reader V2 – hover summaries + page summary + priorities +
// accessible-control reading + improved voice search.
//
// SHORTCUTS
// ---------
// P          : Page summary (all sections)
// Shift+P    : Page summary (only High/Medium priority sections)
// Space      : Play / pause / resume current speech
// Esc        : Stop speech
// Ctrl+Shift+A : Re-summarize current section
// 1 / 2 / 3  : Mark section High / Medium / Low priority
// V          : Toggle voice recognition
//
// BEHAVIOR
// --------
// - Hover paragraph or content block → summarize + speak.
// - Hover button/link/input/select/etc → speak ONLY its label (NO paragraph summary).
// - Voice query (V) → speech recognition → fuzzy search best section → scroll & read,
//                     or fall back to page summary if no good match.

(function () {
  const ASR = (window.AISmartReader = window.AISmartReader || {});
  ASR.ui = ASR.ui || {};
  ASR.state = ASR.state || {
    overlayRoot: null,
    previewUI: null,
    speakGeneration: 0,
    currentNode: null,
    currentSections: []
  };

  const state = ASR.state;
  const { speakText, pauseSpeech, resumeSpeech } = ASR.tts || {};
  const summarizeWithAI =
    ASR.ai && typeof ASR.ai.summarizeWithAI === "function"
      ? ASR.ai.summarizeWithAI
      : null;

  // ----------------- small helpers -----------------
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

  // Is this element (or its closest ancestor) an interactive control?
  const INTERACTIVE_SELECTOR =
    "button, [role='button'], a[href], input, select, textarea, [role='link'], [role='menuitem']";

  function isInteractiveElement(el) {
    if (!el || !el.closest) return false;
    return !!el.closest(INTERACTIVE_SELECTOR);
  }

  // Accessible label helper for controls
  function getAccessibleLabel(el) {
    if (!el) return "";

    // aria-label
    let label = el.getAttribute("aria-label");
    if (label && label.trim()) return label.trim();

    // aria-labelledby
    const labelledById = el.getAttribute("aria-labelledby");
    if (labelledById) {
      const ref = document.getElementById(labelledById);
      if (ref) {
        const t = (ref.innerText || ref.textContent || "").trim();
        if (t) return t;
      }
    }

    // alt / title
    label = el.getAttribute("alt");
    if (label && label.trim()) return label.trim();

    label = el.getAttribute("title");
    if (label && label.trim()) return label.trim();

    // fallback to visible text
    label = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
    return label;
  }

  function getSectionForNode(node) {
    if (!node || !state.currentSections) return null;
    for (const sec of state.currentSections) {
      if (!sec.domNodes) continue;
      for (const dn of sec.domNodes) {
        if (dn === node) return sec;
      }
    }
    return null;
  }

  // ----------------- highlighting & section registration -----------------
  function highlightSections(sections) {
    state.currentSections = sections || [];
    sections.forEach((sec, idx) => {
      sec.priority = sec.priority || "medium";
      sec._id = idx;

      // Build a searchText used for fuzzy matching
      let combined = "";
      if (sec.domNodes && sec.domNodes.length) {
        sec.domNodes.forEach(node => {
          combined += " " + getNodeText(node);
        });
      } else if (sec.bodyText) {
        combined = sec.bodyText;
      }
      sec.searchText = combined.toLowerCase().replace(/\s+/g, " ").trim();

      // default outline based on priority
      updateSectionOutline(sec);
    });
  }

  function updateSectionOutline(sec) {
    if (!sec || !sec.domNodes) return;
    let color = "rgba(0, 255, 0, 0.4)"; // medium
    if (sec.priority === "high") color = "rgba(0, 128, 255, 0.7)";
    if (sec.priority === "low") color = "rgba(180, 180, 180, 0.5)";
    sec.domNodes.forEach(node => {
      try {
        node.style.outline = "2px solid " + color;
      } catch (e) {}
    });
  }

  // ----------------- overlay root & preview -----------------
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
    headingEl.style.fontWeight = "600";
    headingEl.style.marginBottom = "6px";
    headingEl.textContent = "AI Smart Reader";

    const bodyEl = document.createElement("div");
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

    state.previewUI = { box, headingEl, bodyEl, btnPlay, btnPause, btnStop };

    btnPlay.addEventListener("click", () => {
      if (!state.currentNode) return;
      speakNode(state.currentNode);
    });

    btnPause.addEventListener("click", () => {
      const synth = window.speechSynthesis;
      if (!synth) return;
      if (synth.paused) {
        if (resumeSpeech) resumeSpeech();
        else synth.resume();
      } else {
        if (pauseSpeech) pauseSpeech();
        else synth.pause();
      }
    });

    btnStop.addEventListener("click", () => {
      window.speechSynthesis.cancel();
    });

    return state.previewUI;
  }

  function showPreviewForNode(node, summaryText) {
    const ui = state.previewUI;
    if (!ui) return;
    const text = getNodeText(node);
    ui.headingEl.textContent = "Paragraph summary";
    setPreviewBody(summaryText || text);
    ui.box.style.display = "block";
  }

  function showPreviewForPage(summaryText, heading) {
    const ui = state.previewUI;
    if (!ui) return;
    ui.headingEl.textContent = heading || "Page summary";
    setPreviewBody(summaryText);
    ui.box.style.display = "block";
  }

  // ----------------- main TTS for sections -----------------
  async function speakNode(node) {
    if (!node || !speakText) return;

    state.speakGeneration = (state.speakGeneration || 0) + 1;
    const myGen = state.speakGeneration;
    state.currentNode = node;

    let rawText = getNodeText(node);
    // optional OCR enrichment
    if (ASR.ocr && typeof ASR.ocr.extractTextFromNode === "function") {
      try {
        rawText = await ASR.ocr.extractTextFromNode(node, rawText);
      } catch (err) {
        console.error("[AI Smart Reader] OCR error:", err);
      }
    }

    rawText = (rawText || "").trim();
    if (!rawText) return;

    showPreviewForNode(node, rawText);

    if (!summarizeWithAI) {
      speakText(rawText);
      return;
    }

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

    if (myGen !== state.speakGeneration) return;

    const finalText = summary || rawText;
    showPreviewForNode(node, finalText);
    speakText(finalText);
  }

  // ----------------- page summary -----------------
  function collectPageMainText(priorityOnly) {
    const chunks = [];

    if (state.currentSections && state.currentSections.length) {
      state.currentSections.forEach(sec => {
        const text = (sec.bodyText || sec.summaryText || "").trim();
        if (!text) return;

        const lower = text.toLowerCase();
        if (
          lower.includes("sponsored") ||
          lower.includes("sponsored results") ||
          lower.includes("advertisement")
        ) {
          return;
        }

        if (priorityOnly) {
          const p = sec.priority || "medium";
          if (p === "low") return;
        }

        chunks.push(text);
      });
    } else {
      const bodyText = (document.body.innerText || "").replace(/\s+/g, " ").trim();
      if (bodyText) chunks.push(bodyText);
    }

    return chunks.join("\n\n");
  }

  async function summarizeWholePageAndSpeak(priorityOnly) {
    if (!speakText) return;

    window.speechSynthesis.cancel();

    const allText = collectPageMainText(priorityOnly);
    if (!allText || allText.trim().length < 20) {
      console.warn("[AI Smart Reader] Page summary: not enough text.");
      return;
    }

    let summary = allText;
    if (summarizeWithAI) {
      try {
        summary = await summarizeWithAI(allText);
      } catch (err) {
        console.error("[AI Smart Reader] Page summarizeWithAI error:", err);
      }
    }

    summary = (summary || allText).trim();
    showPreviewForPage(
      summary,
      priorityOnly ? "Priority page summary" : "Page summary"
    );
    speakText(summary);
  }

  // ----------------- interactive controls (buttons/links/inputs) -----------------
  function handleInteractiveEnter(e) {
    const el = e.currentTarget;
    const label = getAccessibleLabel(el);
    if (!label || !speakText) return;

    // Only read control label, not paragraph summary
    window.speechSynthesis.cancel();

    const ui = state.previewUI;
    if (ui) {
      ui.headingEl.textContent = "Control";
      setPreviewBody(label);
      ui.box.style.display = "block";
    }

    speakText(label);
  }

  function initInteractiveHover() {
    document.querySelectorAll(INTERACTIVE_SELECTOR).forEach(el => {
      if (el.__aiSmartReaderInteractiveBound) return;
      el.__aiSmartReaderInteractiveBound = true;

      el.addEventListener("mouseenter", handleInteractiveEnter);
    });
  }

  // ----------------- improved voice search -----------------
  function levenshtein(a, b) {
    if (!a || !b) return 99;
    a = a.toLowerCase();
    b = b.toLowerCase();
    const dp = Array(a.length + 1)
      .fill(null)
      .map(() => Array(b.length + 1).fill(0));

    for (let i = 0; i <= a.length; i++) dp[i][0] = i;
    for (let j = 0; j <= b.length; j++) dp[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,
          dp[i][j - 1] + 1,
          dp[i - 1][j - 1] + cost
        );
      }
    }
    return dp[a.length][b.length];
  }

  function scoreSectionForQuery(sec, query) {
    const q = (query || "").toLowerCase().trim();
    if (!q) return 0;

    const text = (sec.searchText || sec.bodyText || "").toLowerCase();
    if (!text) return 0;

    let score = 0;

    // whole phrase
    if (text.includes(q)) score += 40;

    const words = q.split(/\s+/).filter(w => w.length > 2);
    words.forEach(w => {
      if (text.includes(w)) score += 10;

      // fuzzy: distance <= 1 anywhere in text
      const dist = levenshtein(w, text.slice(0, Math.min(text.length, 80)));
      if (dist <= 1) score += 6;
    });

    // prefer longer informative sections
    score += Math.min(text.length / 200, 20);

    return score;
  }

  function findBestMatchingSection(query) {
    if (!state.currentSections || !state.currentSections.length) return null;

    let best = null;
    let bestScore = 0;

    for (const sec of state.currentSections) {
      const s = scoreSectionForQuery(sec, query);
      if (s > bestScore) {
        bestScore = s;
        best = sec;
      }
    }

    // require minimum score; otherwise treat as "no good match"
    if (!best || bestScore < 25) return null;
    return best;
  }

  function focusAndSpeakSection(sec, intro) {
    if (!sec || !sec.domNodes || !sec.domNodes.length || !speakText) return;
    const node = sec.domNodes[0];

    node.scrollIntoView({ behavior: "smooth", block: "center" });
    state.currentNode = node;

    window.speechSynthesis.cancel();
    if (intro) speakText(intro);
    speakNode(node);
  }

  async function handleVoiceQuery(query) {
    console.log("[AI Smart Reader] Voice query:", query);
    const lower = (query || "").toLowerCase();

    // optional: cheapest / highest rated hooks if you later add price/rating fields
    if (lower.includes("cheapest") || lower.includes("lowest price")) {
      const cheapest = findCheapestSection();
      if (cheapest) {
        focusAndSpeakSection(cheapest, "Here is the cheapest option.");
        return;
      }
    }

    if (
      lower.includes("highest rated") ||
      lower.includes("best rated") ||
      lower.includes("best reviewed")
    ) {
      const bestRated = findBestRatedSection();
      if (bestRated) {
        focusAndSpeakSection(bestRated, "Here is the highest rated option.");
        return;
      }
    }

    const best = findBestMatchingSection(query);
    if (!best) {
      if (speakText) {
        speakText(
          "I could not find a specific section for that. Here is a summary of the page."
        );
      }
      await summarizeWholePageAndSpeak(false);
      return;
    }

    focusAndSpeakSection(best);
  }

  function findCheapestSection() {
    let best = null;
    let bestPrice = Infinity;
    for (const sec of state.currentSections || []) {
      if (typeof sec.price === "number") {
        if (sec.price < bestPrice) {
          bestPrice = sec.price;
          best = sec;
        }
      }
    }
    return best;
  }

  function findBestRatedSection() {
    let best = null;
    let bestRating = -Infinity;
    for (const sec of state.currentSections || []) {
      if (typeof sec.rating === "number") {
        if (sec.rating > bestRating) {
          bestRating = sec.rating;
          best = sec;
        }
      }
    }
    return best;
  }

  // ----------------- wiring sections & hover -----------------
  function createOverlays(sections) {
    state.currentSections = sections || [];

    const root = createOverlayRoot();
    createPreviewBox(root);

    highlightSections(sections);

    // NOTE: we skip speaking when hovering pure controls
    sections.forEach(sec => {
      sec.domNodes.forEach(node => {
        node.addEventListener("mouseenter", e => {
          if (isInteractiveElement(e.target)) {
            // button/link/input hover → handled by control logic, skip summary
            return;
          }
          state.currentNode = node;
          speakNode(node);
        });
      });
    });

    initInteractiveHover();
  }

  // ----------------- key handling -----------------
  async function handleGlobalKeydown(e) {
    // Esc = stop speech
    if (e.key === "Escape") {
      window.speechSynthesis.cancel();
      return;
    }

    // P / Shift+P = page summary
    if (e.key === "p" || e.key === "P") {
      if (isTypingContext(document.activeElement)) return;
      e.preventDefault();
      if (e.shiftKey) {
        await summarizeWholePageAndSpeak(true);
      } else {
        await summarizeWholePageAndSpeak(false);
      }
      return;
    }

    // Ctrl+Shift+A = re-summarize current node
    if ((e.key === "A" || e.key === "a") && e.ctrlKey && e.shiftKey) {
      if (isTypingContext(document.activeElement)) return;
      if (!state.currentNode) return;
      e.preventDefault();
      await speakNode(state.currentNode);
      return;
    }

    // Space = play/pause/resume
    if (e.code === "Space" || e.key === " ") {
      if (isTypingContext(document.activeElement)) return;
      e.preventDefault();

      const synth = window.speechSynthesis;
      if (!synth) return;

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

      if (state.currentNode) {
        await speakNode(state.currentNode);
      }
      return;
    }

    // Priority tags: 1/2/3
    if (["1", "2", "3"].includes(e.key)) {
      if (isTypingContext(document.activeElement)) return;
      if (!state.currentNode) return;
      const sec = getSectionForNode(state.currentNode);
      if (!sec) return;

      if (e.key === "1") sec.priority = "high";
      if (e.key === "2") sec.priority = "medium";
      if (e.key === "3") sec.priority = "low";

      updateSectionOutline(sec);
      if (speakText) {
        const msg =
          sec.priority === "high"
            ? "Marked section as high priority."
            : sec.priority === "medium"
            ? "Marked section as medium priority."
            : "Marked section as low priority.";
        speakText(msg);
      }
      return;
    }

    // V = toggle voice recognition
    if (e.key === "v" || e.key === "V") {
      if (isTypingContext(document.activeElement)) return;
      e.preventDefault();
      if (ASR.voice && typeof ASR.voice.toggleVoice === "function") {
        ASR.voice.toggleVoice();
      } else if (speakText) {
        speakText("Voice control is not available in this browser.");
      }
      return;
    }
  }

  // ----------------- exports -----------------
  ASR.ui.highlightSections = highlightSections;
  ASR.ui.createOverlays = createOverlays;
  ASR.ui.handleGlobalKeydown = handleGlobalKeydown;
  ASR.ui.summarizeWholePageAndSpeak = summarizeWholePageAndSpeak;
  ASR.ui.handleVoiceQuery = handleVoiceQuery;
})();
