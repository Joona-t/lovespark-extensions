// Pink Anti-Doomscroll — popup.js
'use strict';

// ── Default state & mode presets ────────────────────────────────────────────

const DEFAULT_STATE = {
  enabled: true,
  sites: { 'x.com': true, 'twitter.com': true, 'reddit.com': true },
  mode: 'standard',
  sparkleEnabled: true,
  snoozeUntilTs: 0,
  continuousScrollMs: 45000,
  escalateMs: 90000,
  tintOpacity: 0.10,
  softenAfterIdleMs: 10000,
};

const MODE_PRESETS = {
  gentle:   { continuousScrollMs: 60000,  escalateMs: 120000, tintOpacity: 0.06 },
  standard: { continuousScrollMs: 45000,  escalateMs: 90000,  tintOpacity: 0.10 },
  firm:     { continuousScrollMs: 20000,  escalateMs: 45000,  tintOpacity: 0.15 },
};

async function getState() {
  const stored = await chrome.storage.sync.get(null);
  return { ...DEFAULT_STATE, ...stored };
}

// ── DOM refs ────────────────────────────────────────────────────────────────

const cbEnabled    = document.getElementById('cb-enabled');
const cbSiteX      = document.getElementById('cb-site-x');
const cbSiteReddit = document.getElementById('cb-site-reddit');
const cbSparkle    = document.getElementById('cb-sparkle');
const modeRadios   = document.querySelectorAll('input[name="mode"]');
const btnSnooze    = document.getElementById('btn-snooze');

// ── Render ──────────────────────────────────────────────────────────────────

let currentState = null;

function render(state) {
  currentState = state;

  cbEnabled.checked = state.enabled;
  cbSiteX.checked = state.sites['x.com'] && state.sites['twitter.com'];
  cbSiteReddit.checked = state.sites['reddit.com'];
  cbSparkle.checked = state.sparkleEnabled;

  modeRadios.forEach(r => {
    r.checked = r.value === state.mode;
  });

  updateSnoozeButton(state.snoozeUntilTs);
}

function updateSnoozeButton(snoozeUntilTs) {
  const now = Date.now();
  if (snoozeUntilTs > now) {
    const until = new Date(snoozeUntilTs);
    const hh = String(until.getHours()).padStart(2, '0');
    const mm = String(until.getMinutes()).padStart(2, '0');
    btnSnooze.textContent = `Snoozed until ${hh}:${mm}`;
    btnSnooze.disabled = true;
  } else {
    btnSnooze.textContent = 'Snooze 10 min';
    btnSnooze.disabled = false;
  }
}

// ── Event handlers ──────────────────────────────────────────────────────────

cbEnabled.addEventListener('change', () => {
  chrome.storage.sync.set({ enabled: cbEnabled.checked });
});

cbSiteX.addEventListener('change', () => {
  const val = cbSiteX.checked;
  const sites = { ...currentState.sites, 'x.com': val, 'twitter.com': val };
  chrome.storage.sync.set({ sites });
  currentState.sites = sites;
});

cbSiteReddit.addEventListener('change', () => {
  const sites = { ...currentState.sites, 'reddit.com': cbSiteReddit.checked };
  chrome.storage.sync.set({ sites });
  currentState.sites = sites;
});

modeRadios.forEach(radio => {
  radio.addEventListener('change', () => {
    const mode = radio.value;
    const preset = MODE_PRESETS[mode];
    chrome.storage.sync.set({ mode, ...preset });
  });
});

cbSparkle.addEventListener('change', () => {
  chrome.storage.sync.set({ sparkleEnabled: cbSparkle.checked });
});

btnSnooze.addEventListener('click', () => {
  const snoozeUntilTs = Date.now() + 600000; // 10 minutes
  chrome.storage.sync.set({ snoozeUntilTs });
  updateSnoozeButton(snoozeUntilTs);
});

// ── Storage change listener ─────────────────────────────────────────────────

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;
  for (const key of Object.keys(changes)) {
    if (key in DEFAULT_STATE) {
      currentState[key] = changes[key].newValue;
    }
  }
  render(currentState);
});

// ── Init ────────────────────────────────────────────────────────────────────

getState().then(render);
