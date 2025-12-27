// tts_engine.js
// Wrapper around Web Speech API for TTS.

(function() {
  const ASR = (window.AISmartReader = window.AISmartReader || {});
  ASR.tts = ASR.tts || {};

  let ttsUtterance = null;

  function speakText(text) {
    if (!text) return;
    window.speechSynthesis.cancel();

    ttsUtterance = new SpeechSynthesisUtterance(text);
    ttsUtterance.rate = 1;
    ttsUtterance.pitch = 1;
    ttsUtterance.volume = 1.0;

    window.speechSynthesis.speak(ttsUtterance);
  }

  function stopSpeech() {
    window.speechSynthesis.cancel();
  }

  function pauseSpeech() {
    window.speechSynthesis.pause();
  }

  function resumeSpeech() {
    window.speechSynthesis.resume();
  }

  ASR.tts.speakText = speakText;
  ASR.tts.stopSpeech = stopSpeech;
  ASR.tts.pauseSpeech = pauseSpeech;
  ASR.tts.resumeSpeech = resumeSpeech;
})();
