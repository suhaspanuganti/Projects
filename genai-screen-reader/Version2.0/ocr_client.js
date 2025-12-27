// ocr_client.js
// Optional OCR support for AI Smart Reader using Tesseract.js.
// On shopping sites, it can use OCR or alt-text from product images to augment text.

(function () {
  const ASR = (window.AISmartReader = window.AISmartReader || {});
  ASR.ocr = ASR.ocr || {};

  const OCR_DOMAINS = ["amazon.", "walmart.", "ebay.", "flipkart."];

  function shouldUseOCR() {
    const host = location.hostname || "";
    return OCR_DOMAINS.some(d => host.includes(d));
  }

  function findMainImage(node) {
    if (!node) return null;
    if (node.tagName && node.tagName.toLowerCase() === "img") return node;
    const imgs = node.querySelectorAll("img");
    if (!imgs.length) return null;
    return imgs[0];
  }

  async function extractTextFromImage(img) {
    if (!img) return "";

    if (!window.Tesseract) {
      const alt = (img.alt || "").trim();
      return alt;
    }

    try {
      const result = await Tesseract.recognize(
        img,
        "eng",
        { logger: () => {} }
      );
      const ocrText = (result.data && result.data.text) ? result.data.text : "";
      const alt = (img.alt || "").trim();
      return (ocrText + " " + alt).trim();
    } catch (err) {
      console.error("[AI Smart Reader OCR] Tesseract error:", err);
      return (img.alt || "").trim();
    }
  }

  async function extractTextFromNode(node, existingText) {
    if (!shouldUseOCR()) return existingText || "";

    const baseText = (existingText || "").trim();
    if (baseText.split(/\s+/).length >= 5) {
      return baseText;
    }

    const img = findMainImage(node);
    if (!img) return baseText;

    const imageText = await extractTextFromImage(img);
    const combined = (baseText + " " + imageText).replace(/\s+/g, " ").trim();
    return combined;
  }

  ASR.ocr.extractTextFromNode = extractTextFromNode;
})();
