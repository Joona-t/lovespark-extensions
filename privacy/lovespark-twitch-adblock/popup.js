'use strict';

// Theme dropdown
const THEMES = ['retro', 'dark', 'beige', 'slate'];
const THEME_NAMES = { retro: 'Retro Pink', dark: 'Dark', beige: 'Beige', slate: 'Slate' };
function applyTheme(t) {
  THEMES.forEach(n => document.body.classList.remove('theme-' + n));
  document.body.classList.add('theme-' + t);
  const label = document.getElementById('themeLabel');
  if (label) label.textContent = THEME_NAMES[t] || t;
  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.theme === t);
  });
}
(function initThemeDropdown() {
  const toggle = document.getElementById('themeToggle');
  const menu = document.getElementById('themeMenu');
  if (toggle && menu) {
    toggle.addEventListener('click', (e) => { e.stopPropagation(); menu.classList.toggle('open'); });
    menu.addEventListener('click', (e) => {
      const opt = e.target.closest('.theme-option');
      if (!opt) return;
      const theme = opt.dataset.theme;
      applyTheme(theme);
      chrome.storage.local.set({ theme });
      menu.classList.remove('open');
    });
    document.addEventListener('click', () => menu.classList.remove('open'));
  }
  chrome.storage.local.get(['theme', 'darkMode'], ({ theme, darkMode }) => {
    if (!theme && darkMode) theme = 'dark';
    applyTheme(theme || 'retro');
  });
})();

const CUTE_MSGS = [
  'No Twitch ads, bestie! \u{1F495}',
  'Keeping your streams sparkly! \u2728',
  'Ad-free zone! \u{1F6E1}\uFE0F',
  'Muted with love! \u{1F496}',
  'Browse streamers in peace! \u{1F338}',
  'Your digital bodyguard \u{1F6E1}\uFE0F\u{1F495}',
];

let prevToday = 0;
let msgIndex = 0;

// ── DOM refs ──────────────────────────────────────

const shieldEl   = document.getElementById('shield-icon');
const statusEl   = document.getElementById('status-text');
const toggleEl   = document.getElementById('toggle-input');
const todayEl    = document.getElementById('stat-today');
const totalEl    = document.getElementById('stat-total');
const timeEl     = document.getElementById('stat-time');
const cuteMsgEl  = document.getElementById('cute-msg');
const settingsBtn = document.getElementById('settings-btn');

// ── Init ──────────────────────────────────────────

async function init() {
  const data = await sendMsg({ type: 'GET_STATS' });
  applyState(data);
  animateCount(todayEl, 0, data.adsMutedToday || 0, 600);
  animateCount(totalEl, 0, data.adsMutedTotal || 0, 800);
  timeEl.textContent = formatTime(data.timeSavedTotalSeconds || 0);
  prevToday = data.adsMutedToday || 0;
  setInterval(rotateCuteMsg, 3500);
}

function applyState(data) {
  var enabled = data.isEnabled !== false;
  toggleEl.checked = enabled;
  updateShieldUI(enabled);
}

function updateShieldUI(enabled) {
  if (enabled) {
    shieldEl.classList.remove('paused');
    statusEl.textContent = 'Protected! \u2728';
    statusEl.classList.remove('paused');
  } else {
    shieldEl.classList.add('paused');
    statusEl.textContent = 'Paused';
    statusEl.classList.add('paused');
  }
}

// ── Counter animation ─────────────────────────────

function easeOut(t) { return 1 - Math.pow(1 - t, 3); }

function animateCount(el, from, to, duration) {
  if (from === to) { el.textContent = to.toLocaleString(); return; }
  var start = performance.now();
  function step(now) {
    var t = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(from + (to - from) * easeOut(t)).toLocaleString();
    if (t < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function popEl(el) {
  el.classList.remove('popping');
  void el.offsetWidth;
  el.classList.add('popping');
  el.addEventListener('animationend', function() { el.classList.remove('popping'); }, { once: true });
}

// ── Time formatting ───────────────────────────────

function formatTime(seconds) {
  if (seconds < 60) return seconds + 's';
  if (seconds < 3600) return Math.floor(seconds / 60) + 'm ' + (seconds % 60) + 's';
  var h = Math.floor(seconds / 3600);
  var m = Math.floor((seconds % 3600) / 60);
  return h + 'h ' + m + 'm';
}

// ── Message rotation ──────────────────────────────

function rotateCuteMsg() {
  msgIndex = (msgIndex + 1) % CUTE_MSGS.length;
  cuteMsgEl.style.opacity = '0';
  setTimeout(function() {
    cuteMsgEl.textContent = CUTE_MSGS[msgIndex];
    cuteMsgEl.style.opacity = '1';
  }, 200);
}

// ── Events ────────────────────────────────────────

toggleEl.addEventListener('change', async function() {
  var enabled = toggleEl.checked;
  updateShieldUI(enabled);
  await sendMsg({ type: 'SET_ENABLED', enabled: enabled });
});

settingsBtn.addEventListener('click', function() {
  chrome.runtime.openOptionsPage();
});

// ── Live updates via storage.onChanged ────────────

chrome.storage.onChanged.addListener(function(changes, area) {
  if (area !== 'local') return;
  if (changes.adsMutedToday) {
    var newVal = changes.adsMutedToday.newValue || 0;
    if (newVal !== prevToday) {
      animateCount(todayEl, prevToday, newVal, 300);
      popEl(todayEl);
      prevToday = newVal;
    }
  }
  if (changes.adsMutedTotal) {
    totalEl.textContent = (changes.adsMutedTotal.newValue || 0).toLocaleString();
  }
  if (changes.timeSavedTotalSeconds) {
    timeEl.textContent = formatTime(changes.timeSavedTotalSeconds.newValue || 0);
  }
  if (changes.isEnabled) {
    var enabled = changes.isEnabled.newValue !== false;
    toggleEl.checked = enabled;
    updateShieldUI(enabled);
  }
});

// ── Helpers ───────────────────────────────────────

function sendMsg(msg) {
  return chrome.runtime.sendMessage(msg);
}

// ── Start ─────────────────────────────────────────

cuteMsgEl.textContent = CUTE_MSGS[Math.floor(Math.random() * CUTE_MSGS.length)];
init();
