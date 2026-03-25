'use strict';

/**
 * LoveSpark Read Aloud — Main controller.
 * Orchestrates reader, speech, and highlighter.
 * Communicates with popup and background via chrome.runtime messages.
 */
var LoveSparkReadAloud = (function () {
  let sentences = [];
  let articleTitle = '';
  let articleByline = '';
  let currentIndex = 0;
  let isPlaying = false;
  let autoScroll = true;
  let highlightEnabled = true;
  let isInitialized = false;

  function init() {
    if (isInitialized) return getState();
    const result = LoveSparkReader.extract();
    sentences = result.sentences;
    articleTitle = result.title;
    articleByline = result.byline;

    if (sentences.length === 0) {
      return { error: result.error || 'No readable content found on this page.' };
    }

    if (highlightEnabled) {
      LoveSparkHighlighter.wrapSentences(sentences);
    }

    isInitialized = true;
    return getState();
  }

  function getState() {
    return {
      title: articleTitle,
      byline: articleByline,
      totalSentences: sentences.length,
      currentIndex,
      isPlaying,
      speed: LoveSparkSpeech.getSpeed(),
      error: sentences.length === 0 ? 'No readable content found.' : null
    };
  }

  function play() {
    if (sentences.length === 0) return;

    if (LoveSparkSpeech.isPaused()) {
      LoveSparkSpeech.resume();
      isPlaying = true;
      notifyState();
      return;
    }

    isPlaying = true;
    speakCurrentSentence();
  }

  function speakCurrentSentence() {
    if (currentIndex >= sentences.length) {
      stop();
      return;
    }

    if (highlightEnabled) {
      LoveSparkHighlighter.highlight(currentIndex, autoScroll);
    }

    LoveSparkSpeech.speak(
      sentences[currentIndex],
      onSentenceEnd,
      null
    );

    notifyState();
    notifyStats();
  }

  function onSentenceEnd() {
    currentIndex++;
    if (currentIndex >= sentences.length) {
      stop();
      return;
    }
    if (isPlaying) {
      speakCurrentSentence();
    }
  }

  function pause() {
    LoveSparkSpeech.pause();
    isPlaying = false;
    savePosition();
    notifyState();
  }

  function stop() {
    LoveSparkSpeech.cancel();
    isPlaying = false;
    LoveSparkHighlighter.cleanup();
    savePosition();
    notifyState();
  }

  function togglePlayPause() {
    if (!isInitialized) {
      const result = init();
      if (result.error) return result;
    }
    if (isPlaying) {
      pause();
    } else {
      play();
    }
    return getState();
  }

  function skipForward() {
    if (currentIndex < sentences.length - 1) {
      LoveSparkSpeech.cancel();
      currentIndex++;
      if (isPlaying) {
        speakCurrentSentence();
      } else if (highlightEnabled) {
        LoveSparkHighlighter.highlight(currentIndex, autoScroll);
      }
      notifyState();
    }
  }

  function skipBackward() {
    if (currentIndex > 0) {
      LoveSparkSpeech.cancel();
      currentIndex--;
      if (isPlaying) {
        speakCurrentSentence();
      } else if (highlightEnabled) {
        LoveSparkHighlighter.highlight(currentIndex, autoScroll);
      }
      notifyState();
    }
  }

  function seekTo(index) {
    if (index >= 0 && index < sentences.length) {
      LoveSparkSpeech.cancel();
      currentIndex = index;
      if (isPlaying) {
        speakCurrentSentence();
      } else if (highlightEnabled) {
        LoveSparkHighlighter.highlight(currentIndex, autoScroll);
      }
      notifyState();
    }
  }

  function setSpeed(rate) {
    LoveSparkSpeech.setSpeed(rate);
    // If currently speaking, restart current sentence at new speed
    if (isPlaying && LoveSparkSpeech.isSpeaking()) {
      LoveSparkSpeech.cancel();
      speakCurrentSentence();
    }
    notifyState();
  }

  function setPreset(name) {
    LoveSparkSpeech.setPreset(name);
    if (isPlaying && LoveSparkSpeech.isSpeaking()) {
      LoveSparkSpeech.cancel();
      speakCurrentSentence();
    }
    notifyState();
  }

  function setVoice(uri) {
    LoveSparkSpeech.setVoice(uri);
    if (isPlaying && LoveSparkSpeech.isSpeaking()) {
      LoveSparkSpeech.cancel();
      speakCurrentSentence();
    }
  }

  function setAutoScroll(enabled) {
    autoScroll = enabled;
  }

  function setHighlightEnabled(enabled) {
    highlightEnabled = enabled;
    if (!enabled) {
      LoveSparkHighlighter.cleanup();
    } else if (isInitialized && sentences.length > 0) {
      LoveSparkHighlighter.wrapSentences(sentences);
      LoveSparkHighlighter.highlight(currentIndex, false);
    }
  }

  function restorePosition(savedIndex) {
    if (savedIndex > 0 && savedIndex < sentences.length) {
      currentIndex = savedIndex;
    }
  }

  function savePosition() {
    try {
      chrome.runtime.sendMessage({
        type: 'SAVE_POSITION',
        url: window.location.href,
        index: currentIndex
      });
    } catch (e) {
      console.warn('[LoveSpark Read Aloud] Could not save position:', e.message);
    }
  }

  function notifyState() {
    try {
      chrome.runtime.sendMessage({
        type: 'STATE_UPDATE',
        state: getState()
      });
    } catch (e) {
      // Service worker may be asleep — non-critical
    }
  }

  function notifyStats() {
    try {
      chrome.runtime.sendMessage({ type: 'BUMP_STAT' });
    } catch (e) {
      // Non-critical
    }
  }

  function destroy() {
    LoveSparkSpeech.cancel();
    LoveSparkHighlighter.cleanup();
    sentences = [];
    currentIndex = 0;
    isPlaying = false;
    isInitialized = false;
  }

  // Listen for messages from popup/background
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    switch (msg.type) {
      case 'INIT_READER': {
        const result = init();
        sendResponse(result);
        break;
      }
      case 'TOGGLE_PLAY':
        sendResponse(togglePlayPause());
        break;
      case 'PLAY':
        play();
        sendResponse(getState());
        break;
      case 'PAUSE':
        pause();
        sendResponse(getState());
        break;
      case 'STOP':
        stop();
        sendResponse(getState());
        break;
      case 'SKIP_FORWARD':
        skipForward();
        sendResponse(getState());
        break;
      case 'SKIP_BACKWARD':
        skipBackward();
        sendResponse(getState());
        break;
      case 'SEEK_TO':
        seekTo(msg.index);
        sendResponse(getState());
        break;
      case 'SET_SPEED':
        setSpeed(msg.speed);
        sendResponse(getState());
        break;
      case 'SET_PRESET':
        setPreset(msg.preset);
        sendResponse(getState());
        break;
      case 'SET_VOICE':
        setVoice(msg.voiceURI);
        sendResponse(getState());
        break;
      case 'SET_AUTO_SCROLL':
        setAutoScroll(msg.enabled);
        sendResponse({ ok: true });
        break;
      case 'SET_HIGHLIGHT':
        setHighlightEnabled(msg.enabled);
        sendResponse({ ok: true });
        break;
      case 'RESTORE_POSITION':
        restorePosition(msg.index);
        sendResponse(getState());
        break;
      case 'GET_STATE':
        sendResponse(getState());
        break;
      case 'GET_VOICES': {
        const voices = LoveSparkSpeech.getAllVoices();
        sendResponse(voices.map(v => ({ name: v.name, voiceURI: v.voiceURI, lang: v.lang })));
        break;
      }
      case 'DESTROY':
        destroy();
        sendResponse({ ok: true });
        break;
      default:
        return false;
    }
    return true; // Keep message channel open for async
  });

  // Keyboard shortcuts (page-level)
  document.addEventListener('keydown', (e) => {
    // Only handle if no input/textarea is focused
    const tag = document.activeElement.tagName.toLowerCase();
    if (['input', 'textarea', 'select'].includes(tag)) return;
    if (document.activeElement.isContentEditable) return;

    if (!isInitialized) return;

    switch (e.code) {
      case 'Space':
        if (e.target === document.body || e.target === document.documentElement) {
          e.preventDefault();
          togglePlayPause();
        }
        break;
      case 'ArrowRight':
        if (e.altKey) {
          e.preventDefault();
          skipForward();
        }
        break;
      case 'ArrowLeft':
        if (e.altKey) {
          e.preventDefault();
          skipBackward();
        }
        break;
      case 'ArrowUp':
        if (e.altKey) {
          e.preventDefault();
          setSpeed(LoveSparkSpeech.getSpeed() + 0.25);
        }
        break;
      case 'ArrowDown':
        if (e.altKey) {
          e.preventDefault();
          setSpeed(LoveSparkSpeech.getSpeed() - 0.25);
        }
        break;
      case 'Escape':
        stop();
        break;
    }
  });

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    if (isInitialized) {
      savePosition();
      LoveSparkSpeech.cancel();
    }
  });

  return {
    init,
    getState,
    play,
    pause,
    stop,
    togglePlayPause,
    skipForward,
    skipBackward,
    setSpeed,
    setPreset,
    setVoice,
    destroy
  };
})();
