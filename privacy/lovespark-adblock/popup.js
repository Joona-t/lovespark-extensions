'use strict';

// Theme system
const THEMES = ['dark', 'retro', 'beige', 'slate'];
function applyTheme(t) {
  THEMES.forEach(n => document.body.classList.remove('theme-' + n));
  document.body.classList.add('theme-' + t);
  const btn = document.getElementById('themeTab');
  if (btn) btn.textContent = t;
}
function cycleTheme() {
  const cur = THEMES.find(t => document.body.classList.contains('theme-' + t)) || 'retro';
  const next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
  applyTheme(next);
  chrome.storage.local.set({ theme: next });
}
chrome.storage.local.get(['theme', 'darkMode'], ({ theme, darkMode }) => {
  if (!theme && darkMode) theme = 'dark';
  applyTheme(theme || 'retro');
});
document.getElementById('themeTab').addEventListener('click', cycleTheme);

const CUTE_MSGS = [
  'Keeping your internet sparkly! ✨',
  'No ads here, bestie! 💕',
  'You deserve a clean web! 🌸',
  'Blocked with love! 💖',
  'Slaying ads since 2025 💅',
  'Your digital bodyguard 🛡️💕',
];

let currentDomain = null;
let isEnabled = true;
let whitelistedDomains = [];
let msgIndex = 0;
let prevToday = 0;

// ── DOM refs ──────────────────────────────────────────────────────────────────

const shieldEl     = document.getElementById('shield-icon');
const statusEl     = document.getElementById('status-text');
const cuteMsgEl    = document.getElementById('cute-msg');
const toggleEl     = document.getElementById('main-toggle');
const todayEl      = document.getElementById('stat-today');
const totalEl      = document.getElementById('stat-total');
const domainEl     = document.getElementById('site-domain');
const wlBtn        = document.getElementById('whitelist-btn');
const settingsBtn  = document.getElementById('settings-btn');
const boardBtn     = document.getElementById('board-btn');

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  // Get current tab domain
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      try {
        currentDomain = new URL(tab.url).hostname.replace(/^www\./, '');
      } catch (_) { /* ignore non-URL tabs */ }
    }
  } catch (_) {}

  // Load state from background
  const data = await sendMsg({ type: 'GET_STATS' });
  applyState(data);

  // Animate counters in
  animateCount(todayEl, 0, data.adsBlockedToday || 0, 600);
  animateCount(totalEl, 0, data.adsBlockedTotal || 0, 800);
  prevToday = data.adsBlockedToday || 0;

  // Show domain
  if (currentDomain) {
    domainEl.textContent = currentDomain;
    updateWhitelistBtn();
  }

  // Rotate cute messages
  setInterval(rotateCuteMsg, 3500);
}

// ── State application ─────────────────────────────────────────────────────────

function applyState(data) {
  isEnabled = data.isEnabled !== false;
  whitelistedDomains = data.whitelistedDomains || [];

  toggleEl.checked = isEnabled;
  updateShieldUI(isEnabled);
}

function updateShieldUI(enabled) {
  if (enabled) {
    shieldEl.textContent = '🛡️';
    shieldEl.classList.remove('paused');
    statusEl.textContent = 'Protected! ✨';
    statusEl.classList.remove('paused');
  } else {
    shieldEl.textContent = '🛡️';
    shieldEl.classList.add('paused');
    statusEl.textContent = 'Paused';
    statusEl.classList.add('paused');
  }
}

function updateWhitelistBtn() {
  if (!currentDomain) return;
  const isWL = whitelistedDomains.includes(currentDomain);
  wlBtn.textContent = isWL ? '✓ Allowed' : '☆ Allow';
  wlBtn.classList.toggle('active', isWL);
}

// ── Counter animation ─────────────────────────────────────────────────────────

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

function animateCount(el, from, to, duration) {
  if (from === to) { el.textContent = to.toLocaleString(); return; }
  const start = performance.now();
  const step = (now) => {
    const t = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(from + (to - from) * easeOut(t)).toLocaleString();
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function popEl(el) {
  el.classList.remove('popping');
  void el.offsetWidth; // reflow to restart animation
  el.classList.add('popping');
  el.addEventListener('animationend', () => el.classList.remove('popping'), { once: true });
}

// ── Cute message rotation ─────────────────────────────────────────────────────

function rotateCuteMsg() {
  msgIndex = (msgIndex + 1) % CUTE_MSGS.length;
  cuteMsgEl.style.opacity = '0';
  setTimeout(() => {
    cuteMsgEl.textContent = CUTE_MSGS[msgIndex];
    cuteMsgEl.style.opacity = '1';
  }, 200);
}

// ── Event listeners ───────────────────────────────────────────────────────────

toggleEl.addEventListener('change', async () => {
  isEnabled = toggleEl.checked;
  updateShieldUI(isEnabled);
  await sendMsg({ type: 'SET_ENABLED', enabled: isEnabled });
});

wlBtn.addEventListener('click', async () => {
  if (!currentDomain) return;
  const isWL = whitelistedDomains.includes(currentDomain);
  if (isWL) {
    await sendMsg({ type: 'REMOVE_WHITELIST', domain: currentDomain });
    whitelistedDomains = whitelistedDomains.filter((d) => d !== currentDomain);
  } else {
    await sendMsg({ type: 'ADD_WHITELIST', domain: currentDomain });
    whitelistedDomains.push(currentDomain);
  }
  updateWhitelistBtn();
});

settingsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

boardBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// ── Helpers ───────────────────────────────────────────────────────────────────

function sendMsg(msg) {
  return chrome.runtime.sendMessage(msg);
}

// React to storage changes instead of polling — zero CPU when idle, instant updates.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.adsBlockedToday) {
    const newVal = changes.adsBlockedToday.newValue || 0;
    if (newVal !== prevToday) {
      animateCount(todayEl, prevToday, newVal, 300);
      popEl(todayEl);
      prevToday = newVal;
    }
  }
  if (changes.adsBlockedTotal) {
    totalEl.textContent = (changes.adsBlockedTotal.newValue || 0).toLocaleString();
  }
  if (changes.isEnabled) {
    isEnabled = changes.isEnabled.newValue !== false;
    toggleEl.checked = isEnabled;
    updateShieldUI(isEnabled);
  }
  if (changes.whitelistedDomains) {
    whitelistedDomains = changes.whitelistedDomains.newValue || [];
    updateWhitelistBtn();
  }
});

// Start
init();
