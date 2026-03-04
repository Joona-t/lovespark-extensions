// LoveSpark Fingerprint Shield — popup.js

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

const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const toggleBtn = document.getElementById('toggleBtn');
const statusCard = document.getElementById('statusCard');
const statusIcon = document.getElementById('statusIcon');
const statusText = document.getElementById('statusText');

// Animate counter value change with bounce
function setCounter(el, value) {
  const formatted = value.toLocaleString();
  if (el.textContent !== formatted) {
    el.textContent = formatted;
    el.classList.add('bounce');
    setTimeout(function() { el.classList.remove('bounce'); }, 200);
  }
}

// Update UI to reflect enabled/disabled state
function updateStatus(enabled) {
  if (enabled) {
    toggleBtn.classList.add('active');
    statusCard.classList.remove('disabled');
    statusIcon.textContent = '\u{1F6E1}\uFE0F';
    statusText.textContent = 'Shield Active';
  } else {
    toggleBtn.classList.remove('active');
    statusCard.classList.add('disabled');
    statusIcon.textContent = '\u{1F6E1}\uFE0F';
    statusText.textContent = 'Shield Inactive';
  }
}

// Load stats from background
function loadStats() {
  chrome.runtime.sendMessage({ action: 'getStats' }, function(response) {
    if (!response) return;
    setCounter(todayEl, response.today);
    setCounter(totalEl, response.total);
    updateStatus(response.isEnabled);
  });
}

// Toggle enabled state
toggleBtn.addEventListener('click', function() {
  const willEnable = !toggleBtn.classList.contains('active');
  chrome.runtime.sendMessage({
    action: 'setEnabled',
    enabled: willEnable
  }, function() {
    updateStatus(willEnable);
  });
});

// Initial load
loadStats();
