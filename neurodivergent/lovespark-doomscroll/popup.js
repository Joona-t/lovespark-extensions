// Pink Anti-Doomscroll — popup.js
'use strict';

// Dark mode
chrome.storage.local.get(['darkMode'], ({ darkMode }) => {
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  const btn = document.getElementById('btnDarkMode');
  if (btn) btn.textContent = darkMode ? '☀️' : '🌙';
});
function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  chrome.storage.local.set({ darkMode: !isDark });
  const btn = document.getElementById('btnDarkMode');
  if (btn) btn.textContent = isDark ? '🌙' : '☀️';
}
document.getElementById('btnDarkMode').addEventListener('click', toggleTheme);

// ── Default state & mode presets ────────────────────────────────────────────

const DEFAULT_STATE = {
  enabled: true,
  sites: { 'x.com': true, 'twitter.com': true, 'reddit.com': true, 'facebook.com': true },
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
  const sites = { ...DEFAULT_STATE.sites, ...(stored.sites || {}) };
  return { ...DEFAULT_STATE, ...stored, sites };
}

// ── DOM refs ────────────────────────────────────────────────────────────────

const cbEnabled    = document.getElementById('cb-enabled');
const cbSiteX        = document.getElementById('cb-site-x');
const cbSiteReddit   = document.getElementById('cb-site-reddit');
const cbSiteFacebook = document.getElementById('cb-site-facebook');
const cbSparkle    = document.getElementById('cb-sparkle');
const modeRadios   = document.querySelectorAll('input[name="mode"]');
const btnSnooze    = document.getElementById('btn-snooze');

const statNudgesToday  = document.getElementById('stat-nudges-today');
const statPausesToday  = document.getElementById('stat-pauses-today');
const statNudgesTotal  = document.getElementById('stat-nudges-total');
const statPausesTotal  = document.getElementById('stat-pauses-total');
const cuteMsgEl        = document.getElementById('cute-msg');

// ── Cute messages ───────────────────────────────────────────────────────────

const CUTE_MESSAGES = [
  'Stay mindful, bestie! 💕',
  'Your brain deserves a break ✨',
  'Scrolling less, living more 🌸',
  'You got this! 💖',
  'Breathe in, breathe out 🌙',
  'The feed can wait for you ✨',
  'Choose calm over chaos 💕',
];

let cuteMsgIndex = 0;
let cuteMsgIntervalId = 0;

function rotateCuteMessage() {
  cuteMsgEl.style.opacity = '0';
  setTimeout(() => {
    cuteMsgIndex = (cuteMsgIndex + 1) % CUTE_MESSAGES.length;
    cuteMsgEl.textContent = CUTE_MESSAGES[cuteMsgIndex];
    cuteMsgEl.style.opacity = '1';
  }, 400);
}

function startCuteMessages() {
  cuteMsgEl.textContent = CUTE_MESSAGES[0];
  cuteMsgIntervalId = setInterval(rotateCuteMessage, 3500);
}

// ── Stats animation ─────────────────────────────────────────────────────────

function animateCount(el, newValue) {
  const current = parseInt(el.textContent, 10) || 0;
  if (current === newValue) return;
  el.textContent = newValue;
  popEl(el);
}

function popEl(el) {
  el.classList.remove('pop');
  void el.offsetWidth;
  el.classList.add('pop');
  setTimeout(() => el.classList.remove('pop'), 300);
}

// ── Render ──────────────────────────────────────────────────────────────────

let currentState = null;

function render(state) {
  currentState = state;

  cbEnabled.checked = state.enabled;
  cbSiteX.checked = state.sites['x.com'] && state.sites['twitter.com'];
  cbSiteReddit.checked = state.sites['reddit.com'];
  cbSiteFacebook.checked = state.sites['facebook.com'];
  cbSparkle.checked = state.sparkleEnabled;

  modeRadios.forEach(r => {
    r.checked = r.value === state.mode;
  });

  updateSnoozeButton(state.snoozeUntilTs);
  renderStats(state);
}

function renderStats(state) {
  animateCount(statNudgesToday, state.nudgesToday || 0);
  animateCount(statPausesToday, state.pausesToday || 0);
  animateCount(statNudgesTotal, state.nudgesTotal || 0);
  animateCount(statPausesTotal, state.pausesTotal || 0);
}

// ── Snooze countdown ────────────────────────────────────────────────────────

let snoozeIntervalId = 0;

function updateSnoozeButton(snoozeUntilTs) {
  clearInterval(snoozeIntervalId);
  snoozeIntervalId = 0;

  const remaining = snoozeUntilTs - Date.now();
  if (remaining > 0) {
    btnSnooze.disabled = true;
    tickSnooze(snoozeUntilTs);
    snoozeIntervalId = setInterval(() => tickSnooze(snoozeUntilTs), 1000);
  } else {
    btnSnooze.textContent = 'Snooze 10 min';
    btnSnooze.disabled = false;
  }
}

function tickSnooze(snoozeUntilTs) {
  const remaining = snoozeUntilTs - Date.now();
  if (remaining <= 0) {
    clearInterval(snoozeIntervalId);
    snoozeIntervalId = 0;
    btnSnooze.textContent = 'Snooze 10 min';
    btnSnooze.disabled = false;
    return;
  }
  const mins = Math.floor(remaining / 60000);
  const secs = Math.floor((remaining % 60000) / 1000);
  btnSnooze.textContent = `Snoozed ${mins}m ${String(secs).padStart(2, '0')}s`;
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

cbSiteFacebook.addEventListener('change', () => {
  const sites = { ...currentState.sites, 'facebook.com': cbSiteFacebook.checked };
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
    if (key in DEFAULT_STATE || key.endsWith('Today') || key.endsWith('Total') || key === 'lastResetDate') {
      currentState[key] = changes[key].newValue;
    }
  }
  render(currentState);
});

// ── Init ────────────────────────────────────────────────────────────────────

getState().then(state => {
  render(state);
  startCuteMessages();
});
