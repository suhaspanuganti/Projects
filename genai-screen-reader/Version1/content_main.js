// content_main.js
// Orchestrates DOM filtering, NLP summarization, overlays, TTS, and keyboard controls.

(function() {
  console.log("[AI Smart Reader Modular NLP + AI] Loaded on:", window.location.href);

  const ASR = (window.AISmartReader = window.AISmartReader || {});
  ASR.state = ASR.state || {
    currentSections: [],
    currentSectionIndex: null,
    overlayRoot: null,
    previewUI: null
  };

  const dom = ASR.dom;
  const nlp = ASR.nlp;
  const ui = ASR.ui;

  if (!dom || !nlp || !ui) {
    console.warn("[AI Smart Reader Modular NLP + AI] Missing modules:", {
      domLoaded: !!dom,
      nlpLoaded: !!nlp,
      uiLoaded: !!ui
    });
  }

  function run() {
    try {
      dom.removeDonationOverlays();

      const blocks = dom.getTextBlocks();
      const sections = dom.groupIntoSections(blocks);

      nlp.summariseSections(sections);

      ASR.state.currentSections = sections;

      console.log(
        `[AI Smart Reader Modular NLP + AI] Sections on this page: ${sections.length}`
      );
      sections.forEach((sec, i) => {
        console.log(`\n--- Section ${i + 1} ---`);
        console.log("Heading:", sec.headingText);
        console.log("Summary:", sec.summaryText);
      });

      ui.highlightSections(sections);
      ui.createOverlays(sections);

      document.addEventListener("keydown", ui.handleGlobalKeydown, true);
    } catch (err) {
      console.error("[AI Smart Reader Modular NLP + AI] Error in run():", err);
    }
  }

  run();
})();
