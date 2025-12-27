// ads_dom.js
// DOM scanning, visibility checks, ad/promotional/donation detection,
// donation overlay removal, and block/section building.

(function() {
  const ASR = (window.AISmartReader = window.AISmartReader || {});
  ASR.dom = ASR.dom || {};

  // -------------------------
  // CONFIG
  // -------------------------
  const BLOCK_TAGS = ["P", "DIV", "ARTICLE", "SECTION", "MAIN"];
  const HEADER_TAGS = ["H1", "H2", "H3"];

  const EXCLUDE_LAYOUT_SELECTORS = [
    "header",
    "nav",
    "footer",
    "aside",
    "[role='navigation']",
    "[role='banner']",
    "[role='search']",
    ".sidebar",
    ".menu",
    ".footer",
    ".cookie",
    ".cookies",
    "#cookie-banner",
    "#cookie-consent"
  ];

  const EXCLUDE_LAYOUT_CLASSID_PATTERN =
    /(nav|menu|sidebar|footer|header|toolbar|panel|cookie|gdpr|banner|subscribe|signup|login|toc)/i;

  const AD_CLASS_PATTERN =
    /\b(ad|ads|advert|advertisement|sponsored-result|sponsor(ed)?|promo|promoted|banner|deal|marketing)\b/i;

  const DONATION_TEXT_PATTERN =
    /\b(donate|donation|support our work|support us|fundraiser|fundraising|give now|please give|help us keep|help us continue|nonprofit|non-profit)\b/i;

  const PROMO_TEXT_PATTERN =
    /\b(buy now|shop now|order now|limited time|limited offer|deal of the day|% off|percent off|add to cart|subscribe|sign up|best price|lowest price|hot deal|special offer)\b/i;

  // -------------------------
  // Utility helpers
  // -------------------------
  function cleanText(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }

  function isVisible(el) {
    const style = window.getComputedStyle(el);
    return (
      style &&
      style.display !== "none" &&
      style.visibility !== "hidden" &&
      el.offsetParent !== null
    );
  }

  function isLikelyOverlay(el) {
    const style = window.getComputedStyle(el);
    const position = style.position;
    const z = parseInt(style.zIndex || "0", 10);
    const rect = el.getBoundingClientRect();
    const vw = window.innerWidth || document.documentElement.clientWidth;
    const vh = window.innerHeight || document.documentElement.clientHeight;

    if (!rect || rect.width === 0 || rect.height === 0) return false;

    const area = rect.width * rect.height;
    const viewportArea = vw * vh;
    const areaRatio = area / viewportArea;

    const overlaid =
      (position === "fixed" || position === "absolute") &&
      (z >= 1000 || areaRatio > 0.3);

    return overlaid;
  }

  function isDonationOverlay(el, text) {
    const cleaned = cleanText(text);
    if (!cleaned || cleaned.length < 20) return false;
    if (!isLikelyOverlay(el)) return false;
    return DONATION_TEXT_PATTERN.test(cleaned.toLowerCase());
  }

  function removeDonationOverlays() {
    const candidates = Array.from(
      document.querySelectorAll("div, section, article, aside")
    );

    candidates.forEach(el => {
      if (!isVisible(el)) return;

      const txt = cleanText(el.innerText || "");
      if (txt.length < 30) return;

      if (isDonationOverlay(el, txt)) {
        console.log(
          "[AI Smart Reader DOM] Hiding donation overlay:",
          txt.slice(0, 80) + "…"
        );
        el.style.display = "none";

        const parent = el.parentElement;
        if (parent && isLikelyOverlay(parent)) {
          parent.style.display = "none";
        }
      }
    });
  }

  function classifyBlockType(el, text) {
    const loweredText = (text || "").toLowerCase();
    const classId = (el.className + " " + el.id).toLowerCase();
    const htmlSnippet = (el.outerHTML || "").toLowerCase();

    if (DONATION_TEXT_PATTERN.test(loweredText) || DONATION_TEXT_PATTERN.test(htmlSnippet)) {
      return "donation";
    }

    if (htmlSnippet.includes("sponsored") || loweredText.includes("sponsored")) {
      return "ad";
    }

    if (AD_CLASS_PATTERN.test(classId)) {
      return "ad";
    }

    if (PROMO_TEXT_PATTERN.test(loweredText)) {
      return "ad";
    }

    return "content";
  }

  function getTextBlocks() {
    const elements = Array.from(document.querySelectorAll(BLOCK_TAGS.join(",")));
    const blocks = [];

    for (const el of elements) {
      if (!isVisible(el)) continue;

      const rawText = el.innerText || "";
      const cleaned = cleanText(rawText);
      if (cleaned.length < 80) continue;

      if (EXCLUDE_LAYOUT_SELECTORS.some(sel => el.closest(sel))) continue;

      const classId = (el.className + " " + el.id).toLowerCase();
      if (EXCLUDE_LAYOUT_CLASSID_PATTERN.test(classId)) continue;

      const type = classifyBlockType(el, cleaned);
      if (type === "ad" || type === "donation") {
        continue;
      }

      blocks.push({ el, text: cleaned });
    }

    return blocks;
  }

  // 🔥 NEW: treat each block as its own "section" so each paragraph can be spoken individually
  function groupIntoSections(blocks) {
    const sections = [];

    blocks.forEach((block, idx) => {
      const headingEl = block.el.querySelector(HEADER_TAGS.join(","));
      let headingText;

      if (headingEl) {
        headingText = cleanText(headingEl.innerText);
      } else {
        headingText = `Paragraph ${idx + 1}`;
      }

      sections.push({
        headingText,
        bodyText: block.text,
        domNodes: [block.el]
      });
    });

    return sections;
  }

  ASR.dom.BLOCK_TAGS = BLOCK_TAGS;
  ASR.dom.HEADER_TAGS = HEADER_TAGS;
  ASR.dom.cleanText = cleanText;
  ASR.dom.isVisible = isVisible;
  ASR.dom.removeDonationOverlays = removeDonationOverlays;
  ASR.dom.getTextBlocks = getTextBlocks;
  ASR.dom.groupIntoSections = groupIntoSections;
})();
