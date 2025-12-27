// ai_client.js
// OpenAI + offline fallback summarization for AI Smart Reader V2.
//
// Behavior:
// - If OFFLINE_ONLY is true  → never call OpenAI, use local summary only.
// - If OpenAI key missing    → local summary only.
// - If OpenAI returns quota/rate-limit/network errors → switch to local summaries
//   for the rest of this tab session.
//
// NOTE: This exposes your API key in the extension. Fine for a local school project,
// NOT safe for production deployment.

(function () {
  const ASR = (window.AISmartReader = window.AISmartReader || {});
  ASR.ai = ASR.ai || {};

  // 🔑 PASTE YOUR OPENAI API KEY HERE LOCALLY
  // Example: const OPENAI_API_KEY = "sk-proj-xxxx";
  const OPENAI_API_KEY = "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";

  // Set this to true if you want to completely disable OpenAI calls
  // and run in "offline only" mode.
  const OFFLINE_ONLY = false;

  let AI_ENABLED = true;

  function localSummarize(text) {
    const cleaned = (text || "").replace(/\s+/g, " ").trim();
    if (!cleaned) return "";

    const parts = cleaned.split(/(?<=[.!?])\s+/);
    if (parts.length === 1) {
      return cleaned.length > 320 ? cleaned.slice(0, 320) + "…" : cleaned;
    }

    const firstTwo = parts.slice(0, 2).join(" ");
    return firstTwo.length > 360 ? firstTwo.slice(0, 360) + "…" : firstTwo;
  }

  async function summarizeWithAI(text) {
    const trimmed = (text || "").trim();
    if (trimmed.length < 10) return trimmed;

    if (
      OFFLINE_ONLY ||
      !OPENAI_API_KEY ||
      OPENAI_API_KEY === "YOUR_API_KEY_HERE" ||
      !AI_ENABLED
    ) {
      return localSummarize(trimmed);
    }

    const MAX_CHARS = 4000;
    const inputText =
      trimmed.length > MAX_CHARS ? trimmed.slice(0, MAX_CHARS) : trimmed;

    const payload = {
      model: "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content:
            "You are an accessibility summarizer for visually impaired users. " +
            "Summarize the provided webpage text in 2–4 short, simple sentences. " +
            "Ignore ads, prices, and promotions."
        },
        { role: "user", content: inputText }
      ],
      temperature: 0.3,
      max_tokens: 200
    };

    let response;
    try {
      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer " + OPENAI_API_KEY
        },
        body: JSON.stringify(payload)
      });
    } catch (networkError) {
      console.error("[AI Smart Reader] Network error talking to OpenAI:", networkError);
      AI_ENABLED = false;
      return localSummarize(trimmed);
    }

    if (!response.ok) {
      const errText = await response.text().catch(() => "");
      console.error("[AI Smart Reader] OpenAI error:", errText || response.status);

      try {
        const parsed = JSON.parse(errText);
        const code = parsed?.error?.code;
        if (code === "insufficient_quota" || code === "rate_limit_exceeded") {
          console.warn(
            "[AI Smart Reader] Quota / rate limit reached – switching to offline summaries only."
          );
          AI_ENABLED = false;
        }
      } catch (_) {}

      return localSummarize(trimmed);
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content?.trim();
    if (!summary) {
      return localSummarize(trimmed);
    }
    return summary;
  }

  ASR.ai.summarizeWithAI = summarizeWithAI;
  ASR.ai.localSummarize = localSummarize;
})();
