// LoveSpark Reader — content.js
// Injected into every page by background.js via chrome.scripting.executeScript().
// Sole responsibility: manage the lovespark-* class on <html>.
// CSS does all the visual work — this just flips the switch.
'use strict';

(function () {
  // Guard: don't initialise twice in the same window
  if (window.__loveSparkReader) return;
  window.__loveSparkReader = true;

  const HTML    = document.documentElement;
  const CLASSES = ['lovespark-sakura', 'lovespark-hotpink', 'lovespark-starlight'];

  // ── Class helpers ──────────────────────────────────────────────────────────

  function applyMode(mode) {
    CLASSES.forEach(c => HTML.classList.remove(c));
    if (mode) HTML.classList.add(`lovespark-${mode}`);
  }

  function removeAll() {
    CLASSES.forEach(c => HTML.classList.remove(c));
  }

  // ── Initial state ──────────────────────────────────────────────────────────

  chrome.runtime.sendMessage({ action: 'getState' }, (response) => {
    if (chrome.runtime.lastError || !response) return;

    const { enabled, mode, disabledSites } = response;
    const hostname = location.hostname;

    if (enabled && !(disabledSites || []).includes(hostname)) {
      applyMode(mode);
    }
  });

  // ── Live message listener ──────────────────────────────────────────────────
  // background.js and popup.js both send messages here for instant updates.

  chrome.runtime.onMessage.addListener((message) => {
    switch (message.action) {
      case 'apply':
        applyMode(message.mode);
        break;
      case 'remove':
        removeAll();
        break;
    }
  });
})();
