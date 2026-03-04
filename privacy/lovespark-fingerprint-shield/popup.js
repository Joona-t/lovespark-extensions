// LoveSpark Fingerprint Shield — popup.js

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
