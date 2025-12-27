// voice_controller.js
// Handles starting/stopping Web Speech recognition.
// Toggled from overlay_ui.js with key "V".

(function () {
  const ASR = (window.AISmartReader = window.AISmartReader || {});
  ASR.voice = ASR.voice || {};

  let recognition = null;
  let recognizing = false;
  let gotResult = false;

  function ensureRecognizer() {
    if (recognition) return recognition;

    const SR =
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      window.mozSpeechRecognition ||
      window.msSpeechRecognition;

    if (!SR) {
      console.warn("[AI Smart Reader] SpeechRecognition not supported.");
      if (ASR.tts && ASR.tts.speakText) {
        ASR.tts.speakText("Voice recognition is not supported in this browser.");
      }
      return null;
    }

    recognition = new SR();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      console.log("[AI Smart Reader] Voice recognition started.");
      recognizing = true;
      gotResult = false;
      if (ASR.tts && ASR.tts.speakText) {
        ASR.tts.speakText("Listening.");
      }
    };

    recognition.onerror = (event) => {
      console.error("[AI Smart Reader] Voice recognition error:", event.error);
      recognizing = false;
      if (ASR.tts && ASR.tts.speakText) {
        ASR.tts.speakText("Sorry, there was an error with voice recognition.");
      }
    };

    recognition.onend = () => {
      console.log("[AI Smart Reader] Voice recognition ended.");
      recognizing = false;
      if (!gotResult && ASR.tts && ASR.tts.speakText) {
        ASR.tts.speakText("I did not catch that.");
      }
    };

    recognition.onresult = (event) => {
      const result = event.results[0][0].transcript;
      gotResult = true;
      console.log("[AI Smart Reader] Voice transcript:", result);

      if (!result || !result.trim()) {
        if (ASR.tts && ASR.tts.speakText) {
          ASR.tts.speakText("I did not hear anything.");
        }
        return;
      }

      if (ASR.ui && typeof ASR.ui.handleVoiceQuery === "function") {
        ASR.ui.handleVoiceQuery(result);
      } else if (ASR.tts && ASR.tts.speakText) {
        ASR.tts.speakText("Voice query handler is not available.");
      }
    };

    return recognition;
  }

  function toggleVoice() {
    const rec = ensureRecognizer();
    if (!rec) return;

    if (!recognizing) {
      try {
        rec.start();
      } catch (e) {
        console.error("[AI Smart Reader] Failed to start recognition:", e);
        if (ASR.tts && ASR.tts.speakText) {
          ASR.tts.speakText("Could not start voice recognition.");
        }
      }
    } else {
      try {
        rec.stop();
      } catch (e) {
        console.error("[AI Smart Reader] Failed to stop recognition:", e);
      }
      recognizing = false;
    }
  }

  ASR.voice.toggleVoice = toggleVoice;
})();
