/**
 * LoveSpark Reader — content.js
 * Storage-driven class toggler. No message passing to background.
 * CSS does all visual work — this just manages the class on <html>.
 */
'use strict';

const CLASSES = ['lovespark-sakura', 'lovespark-hotpink', 'lovespark-starlight'];
const DEFAULT_STATE = { enabled: true, mode: 'sakura', disabledSites: [] };

let state = { ...DEFAULT_STATE };

function applyState() {
  const html = document.documentElement;
  CLASSES.forEach(c => html.classList.remove(c));

  if (!state.enabled) return;
  if ((state.disabledSites || []).includes(location.hostname)) return;

  html.classList.add('lovespark-' + state.mode);
}

// ── Init: read storage, apply immediately ───────────────────────────────────

browser.storage.local.get(Object.keys(DEFAULT_STATE)).then(data => {
  state = { ...DEFAULT_STATE, ...data };
  applyState();
}).catch(() => {
  applyState();
});

// ── Live updates: storage.onChanged fires when popup writes settings ────────

browser.storage.onChanged.addListener((changes, areaName) => {
  if (areaName !== 'local') return;

  for (const key of Object.keys(changes)) {
    if (key in state) state[key] = changes[key].newValue;
  }

  applyState();
});

// ── Hostname message: popup asks for active tab's hostname ──────────────────

browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getHostname') {
    sendResponse({ hostname: location.hostname });
  }
});
