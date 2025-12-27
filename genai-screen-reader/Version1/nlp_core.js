// nlp_core.js
// Local extractive summarization & heading generation.

(function() {
  const ASR = (window.AISmartReader = window.AISmartReader || {});
  ASR.nlp = ASR.nlp || {};

  const STOPWORDS = new Set([
    "the","is","in","at","of","on","and","a","an","to","for","with","that","this","it",
    "as","by","from","or","be","are","was","were","has","have","had","but","not","can",
    "could","should","would","will","may","might","do","does","did","about","into",
    "over","after","before","between","during","than","then","so","such","its","their",
    "they","them","he","she","his","her","you","your","we","our","us","these","those",
    "which","who","whom","what","when","where","why","how"
  ]);

  function cleanText(text) {
    return (text || "").replace(/\s+/g, " ").trim();
  }

  function splitIntoSentences(text) {
    if (!text) return [];
    const parts = text.match(/[^.!?]+[.!?]*/g);
    if (!parts) return [text];
    return parts.map(s => cleanText(s)).filter(s => s.length > 0);
  }

  function buildWordFrequency(text) {
    const freq = Object.create(null);
    const tokens = (text || "")
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 2 && !STOPWORDS.has(w));

    tokens.forEach(w => {
      freq[w] = (freq[w] || 0) + 1;
    });

    return freq;
  }

  function summarizeText(text, maxSentences = 3) {
    const sentences = splitIntoSentences(text);
    if (sentences.length <= maxSentences) {
      return cleanText(sentences.join(" "));
    }

    const freq = buildWordFrequency(text);
    const scored = sentences.map((sentence, index) => {
      const tokens = sentence
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, " ")
        .split(/\s+/)
        .filter(w => w.length > 0);

      let score = 0;
      tokens.forEach(w => {
        if (freq[w]) score += freq[w];
      });

      return { sentence, index, score };
    });

    scored.sort((a, b) => b.score - a.score);
    const top = scored.slice(0, maxSentences).sort((a, b) => a.index - b.index);
    const summary = top.map(s => s.sentence).join(" ");
    return cleanText(summary);
  }

  function generateHeadingFromText(text, maxWords = 6) {
    const words = cleanText(text).split(" ");
    return words.slice(0, maxWords).join(" ");
  }

  function summariseSections(sections) {
    sections.forEach(sec => {
      const body = sec.bodyText || "";
      if (body.length < 120) {
        sec.summaryText = cleanText(body);
      } else {
        sec.summaryText = summarizeText(body, 2);
      }

      if (!sec.headingText || sec.headingText === "Untitled Section") {
        sec.headingText = generateHeadingFromText(sec.summaryText || body);
      }
    });
  }

  ASR.nlp.summarizeText = summarizeText;
  ASR.nlp.generateHeadingFromText = generateHeadingFromText;
  ASR.nlp.summariseSections = summariseSections;
})();
