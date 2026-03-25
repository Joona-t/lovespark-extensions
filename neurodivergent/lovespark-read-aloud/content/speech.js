'use strict';

/**
 * LoveSpark Read Aloud — Web Speech API wrapper.
 * Handles play/pause/stop, speed control, voice selection.
 */
var LoveSparkSpeech = (function () {
  const synth = window.speechSynthesis;
  let currentUtterance = null;
  let onEndCallback = null;
  let onBoundaryCallback = null;
  let isPaused = false;
  let currentSpeed = 1.0;
  let currentVoiceURI = null;

  const PRESETS = {
    chill: 0.8,
    flow: 1.0,
    turbo: 1.5,
    hyperfocus: 2.0
  };

  function getVoices() {
    return synth.getVoices().filter(v => v.lang.startsWith('en'));
  }

  function getAllVoices() {
    return synth.getVoices();
  }

  function setVoice(uri) {
    currentVoiceURI = uri;
  }

  function setSpeed(rate) {
    currentSpeed = Math.max(0.5, Math.min(3.0, rate));
  }

  function setPreset(name) {
    if (PRESETS[name]) {
      currentSpeed = PRESETS[name];
    }
  }

  function speak(text, onEnd, onWordBoundary) {
    cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = currentSpeed;

    if (currentVoiceURI) {
      const voice = synth.getVoices().find(v => v.voiceURI === currentVoiceURI);
      if (voice) utterance.voice = voice;
    }

    onEndCallback = onEnd;
    onBoundaryCallback = onWordBoundary;

    utterance.onend = () => {
      currentUtterance = null;
      isPaused = false;
      if (onEndCallback) onEndCallback();
    };

    utterance.onerror = (e) => {
      if (e.error === 'interrupted' || e.error === 'canceled') return;
      console.warn('[LoveSpark Read Aloud] Speech error:', e.error);
      currentUtterance = null;
      isPaused = false;
      if (onEndCallback) onEndCallback();
    };

    if (onWordBoundary) {
      utterance.onboundary = (e) => {
        if (e.name === 'word') onBoundaryCallback(e);
      };
    }

    currentUtterance = utterance;
    isPaused = false;
    synth.speak(utterance);
  }

  function pause() {
    if (synth.speaking && !synth.paused) {
      synth.pause();
      isPaused = true;
    }
  }

  function resume() {
    if (synth.paused) {
      synth.resume();
      isPaused = false;
    }
  }

  function cancel() {
    synth.cancel();
    currentUtterance = null;
    isPaused = false;
  }

  function isSpeaking() {
    return synth.speaking && !synth.paused;
  }

  function getIsPaused() {
    return isPaused;
  }

  function getSpeed() {
    return currentSpeed;
  }

  return {
    getVoices,
    getAllVoices,
    setVoice,
    setSpeed,
    setPreset,
    speak,
    pause,
    resume,
    cancel,
    isSpeaking,
    isPaused: getIsPaused,
    getSpeed,
    PRESETS
  };
})();
