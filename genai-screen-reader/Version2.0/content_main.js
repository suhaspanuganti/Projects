// content_main.js
// DOM scanning + section detection for AI Smart Reader V2.
//
// This is a simplified, generic content extractor:
// - Finds paragraphs and important blocks.
// - Builds sections with headingText + bodyText + domNodes.
// - Filters out obvious ads / sponsored content / tiny fragments.
// - Hands sections to ASR.ui for overlays and keyboard handling.

(function () {
  const ASR = (window.AISmartReader = window.AISmartReader || {});

  function isProbablyVisible(el) {
    if (!el) return false;
    const style = window.getComputedStyle(el);
    if (
      style.display === "none" ||
      style.visibility === "hidden" ||
      style.opacity === "0"
    ) {
      return false;
    }
    const rect = el.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2) return false;
    return true;
  }

  function looksLikeAdText(text) {
    const t = text.toLowerCase();
    return (
      t.includes("sponsored") ||
      t.includes("advertisement") ||
      t.includes("ad choices") ||
      t.includes("cookie") && t.includes("policy")
    );
  }

  function collectParagraphNodes() {
    const nodes = [];
    const tags = ["p", "li", "article", "section", "div"];

    tags.forEach(tag => {
      document.querySelectorAll(tag).forEach(el => {
        if (!isProbablyVisible(el)) return;
        const text = (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
        if (!text) return;
        if (text.length < 40) return; // skip ultra tiny bits
        if (looksLikeAdText(text)) return;
        nodes.push(el);
      });
    });

    return nodes;
  }

  function buildSectionsFromNodes(nodes) {
    const sections = [];
    nodes.forEach(node => {
      const text = (node.innerText || node.textContent || "").replace(/\s+/g, " ").trim();
      if (!text) return;

      const section = {
        headingText: "",
        bodyText: text,
        summaryText: "",
        domNodes: [node],
        priority: "medium"
        // price, rating can be added later for shopping sites
      };

      sections.push(section);
    });
    return sections;
  }

  function init() {
    if (!ASR.ui || !ASR.ui.createOverlays) {
      console.warn("[AI Smart Reader] UI layer not ready.");
      return;
    }

    const paraNodes = collectParagraphNodes();
    const sections = buildSectionsFromNodes(paraNodes);

    if (!sections.length) {
      console.warn("[AI Smart Reader] No sections detected on this page.");
      return;
    }

    ASR.ui.highlightSections(sections);
    ASR.ui.createOverlays(sections);

    if (ASR.ui.handleGlobalKeydown) {
      window.addEventListener("keydown", ASR.ui.handleGlobalKeydown, true);
    }

    console.log("[AI Smart Reader] Initialized with", sections.length, "sections.");
  }

  if (document.readyState === "complete" || document.readyState === "interactive") {
    setTimeout(init, 500);
  } else {
    window.addEventListener("DOMContentLoaded", () => setTimeout(init, 500));
  }
})();
