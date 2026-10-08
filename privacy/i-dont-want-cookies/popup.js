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
  'Cookie-free zone! 💕',
  'No tracking here, bestie! ✨',
  'Browse in peace! 🌸',
  'Consent fatigue? Not today! 💖',
  'Your banners are gone 🚫🍪',
  'Clean web, happy you! 💅',
];

let currentDomain = null;
let whitelistedDomains = [];
let msgIndex = 0;
let prevToday = 0;

// ── DOM refs ──────────────────────────────────────────────────────────────────
const cookieIconEl   = document.getElementById('cookie-icon');
const statusTextEl   = document.getElementById('status-text');
const cuteMsgEl      = document.getElementById('cute-msg');
const mainToggle     = document.getElementById('main-toggle');
const autoDeclineEl  = document.getElementById('auto-decline-toggle');
const todayEl        = document.getElementById('stat-today');
const totalEl        = document.getElementById('stat-total');
const domainEl       = document.getElementById('site-domain');
const wlBtn          = document.getElementById('whitelist-btn');
const settingsBtn    = document.getElementById('settings-btn');
const settingsFooter = document.getElementById('settings-footer-btn');

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      try { currentDomain = new URL(tab.url).hostname.replace(/^www\./, ''); } catch (_) {}
    }
  } catch (_) {}

  const data = await chrome.runtime.sendMessage({ type: 'GET_STATS' });
  applyState(data);

  animateCount(todayEl, 0, data.bannersHiddenToday || 0, 600);
  animateCount(totalEl, 0, data.bannersHiddenTotal || 0, 800);
  prevToday = data.bannersHiddenToday || 0;

  if (currentDomain) {
    domainEl.textContent = currentDomain;
    updateWlBtn();
  }

  setInterval(rotateCuteMsg, 3500);
  setInterval(pollStats, 2000);
}

// ── State ─────────────────────────────────────────────────────────────────────
function applyState(data) {
  whitelistedDomains = data.whitelistedDomains || [];
  mainToggle.checked     = data.isEnabled !== false;
  autoDeclineEl.checked  = !!data.autoDecline;
  updateStatusUI(data.isEnabled !== false);
  updateWlBtn();
}

function updateStatusUI(enabled) {
  if (enabled) {
    cookieIconEl.textContent = '🚫';
    cookieIconEl.classList.remove('paused');
    statusTextEl.textContent = 'Cookie-Free! ✨';
    statusTextEl.classList.remove('paused');
  } else {
    cookieIconEl.textContent = '🍪';
    cookieIconEl.classList.add('paused');
    statusTextEl.textContent = 'Paused';
    statusTextEl.classList.add('paused');
  }
}

function updateWlBtn() {
  if (!currentDomain) return;
  const isWL = whitelistedDomains.includes(currentDomain);
  wlBtn.textContent = isWL ? '✓ Allowed' : '☆ Allow';
  wlBtn.classList.toggle('active', isWL);
}

// ── Counter animation ─────────────────────────────────────────────────────────
function easeOut(t) { return 1 - (1 - t) ** 3; }

function animateCount(el, from, to, dur) {
  if (from === to) { el.textContent = to.toLocaleString(); return; }
  const start = performance.now();
  const step = (now) => {
    const t = Math.min((now - start) / dur, 1);
    el.textContent = Math.round(from + (to - from) * easeOut(t)).toLocaleString();
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function popEl(el) {
  el.classList.remove('popping');
  void el.offsetWidth;
  el.classList.add('popping');
  el.addEventListener('animationend', () => el.classList.remove('popping'), { once: true });
}

// ── Rotate message ────────────────────────────────────────────────────────────
function rotateCuteMsg() {
  msgIndex = (msgIndex + 1) % CUTE_MSGS.length;
  cuteMsgEl.style.opacity = '0';
  setTimeout(() => {
    cuteMsgEl.textContent = CUTE_MSGS[msgIndex];
    cuteMsgEl.style.opacity = '1';
  }, 200);
}

// ── Poll stats while open ─────────────────────────────────────────────────────
async function pollStats() {
  const data = await chrome.runtime.sendMessage({ type: 'GET_STATS' });
  const newToday = data.bannersHiddenToday || 0;
  if (newToday !== prevToday) {
    animateCount(todayEl, prevToday, newToday, 300);
    popEl(todayEl);
    prevToday = newToday;
  }
  totalEl.textContent = (data.bannersHiddenTotal || 0).toLocaleString();
}

// ── Events ────────────────────────────────────────────────────────────────────
mainToggle.addEventListener('change', async () => {
  updateStatusUI(mainToggle.checked);
  await chrome.runtime.sendMessage({ type: 'SET_ENABLED', enabled: mainToggle.checked });
});

autoDeclineEl.addEventListener('change', async () => {
  await chrome.runtime.sendMessage({ type: 'SET_AUTO_DECLINE', autoDecline: autoDeclineEl.checked });
});

wlBtn.addEventListener('click', async () => {
  if (!currentDomain) return;
  const isWL = whitelistedDomains.includes(currentDomain);
  if (isWL) {
    await chrome.runtime.sendMessage({ type: 'REMOVE_WHITELIST', domain: currentDomain });
    whitelistedDomains = whitelistedDomains.filter((d) => d !== currentDomain);
  } else {
    await chrome.runtime.sendMessage({ type: 'ADD_WHITELIST', domain: currentDomain });
    whitelistedDomains.push(currentDomain);
  }
  updateWlBtn();
});

[settingsBtn, settingsFooter].forEach((btn) =>
  btn.addEventListener('click', () => chrome.runtime.openOptionsPage())
);

init();

/* ── Author / Ko-fi Footer ── */
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
