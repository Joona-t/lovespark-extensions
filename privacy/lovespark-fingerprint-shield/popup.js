// LoveSpark Fingerprint Shield — popup.js

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
