// tts_client.js
// Simple wrapper around the Web Speech API for AI Smart Reader.

(function () {
  const ASR = (window.AISmartReader = window.AISmartReader || {});
  ASR.tts = ASR.tts || {};

  function speakText(text) {
    if (!text) return;
    const synth = window.speechSynthesis;
    if (!synth) {
      console.warn("[AI Smart Reader] Speech synthesis not supported.");
      return;
    }
    // Cancel any ongoing speech
    synth.cancel();

    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.0;
    utter.pitch = 1.0;
    utter.lang = "en-US";

    synth.speak(utter);
  }

  function pauseSpeech() {
    const synth = window.speechSynthesis;
    if (synth && synth.speaking && !synth.paused) {
      synth.pause();
    }
  }

  function resumeSpeech() {
    const synth = window.speechSynthesis;
    if (synth && synth.paused) {
      synth.resume();
    }
  }

  ASR.tts.speakText = speakText;
  ASR.tts.pauseSpeech = pauseSpeech;
  ASR.tts.resumeSpeech = resumeSpeech;
})();
