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

// ── DOM refs ──────────────────────────────────────

var toggleEl  = document.getElementById('toggle-enabled');
var todayEl   = document.getElementById('stat-today');
var totalEl   = document.getElementById('stat-total');
var timeEl    = document.getElementById('stat-time');
var exportBtn = document.getElementById('btn-export');
var resetBtn  = document.getElementById('btn-reset');

// ── Init ──────────────────────────────────────────

async function init() {
  var data = await sendMsg({ type: 'GET_STATS' });
  toggleEl.checked = data.isEnabled !== false;
  todayEl.textContent = (data.adsMutedToday || 0).toLocaleString();
  totalEl.textContent = (data.adsMutedTotal || 0).toLocaleString();
  timeEl.textContent = formatTime(data.timeSavedTotalSeconds || 0);
}

// ── Time formatting ───────────────────────────────

function formatTime(seconds) {
  if (seconds < 60) return seconds + 's';
  if (seconds < 3600) return Math.floor(seconds / 60) + 'm ' + (seconds % 60) + 's';
  var h = Math.floor(seconds / 3600);
  var m = Math.floor((seconds % 3600) / 60);
  return h + 'h ' + m + 'm';
}

// ── Events ────────────────────────────────────────

toggleEl.addEventListener('change', async function() {
  await sendMsg({ type: 'SET_ENABLED', enabled: toggleEl.checked });
});

exportBtn.addEventListener('click', async function() {
  var data = await sendMsg({ type: 'GET_STATS' });
  var rows = [
    ['Metric', 'Value'],
    ['Ads Muted Today', data.adsMutedToday || 0],
    ['Ads Muted Total', data.adsMutedTotal || 0],
    ['Time Saved (seconds)', data.timeSavedTotalSeconds || 0],
    ['Last Reset Date', data.lastResetDate || ''],
  ];
  var csv = rows.map(function(r) { return r.join(','); }).join('\n');
  var blob = new Blob([csv], { type: 'text/csv' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'lovespark-twitch-adblock-stats.csv';
  a.click();
  URL.revokeObjectURL(url);
});

resetBtn.addEventListener('click', async function() {
  if (!confirm('Reset all stats to zero?')) return;
  await sendMsg({ type: 'RESET_STATS' });
});

// ── Live updates ──────────────────────────────────

chrome.storage.onChanged.addListener(function(changes, area) {
  if (area !== 'local') return;
  if (changes.adsMutedToday) todayEl.textContent = (changes.adsMutedToday.newValue || 0).toLocaleString();
  if (changes.adsMutedTotal) totalEl.textContent = (changes.adsMutedTotal.newValue || 0).toLocaleString();
  if (changes.timeSavedTotalSeconds) timeEl.textContent = formatTime(changes.timeSavedTotalSeconds.newValue || 0);
  if (changes.isEnabled) toggleEl.checked = changes.isEnabled.newValue !== false;
});

// ── Helpers ───────────────────────────────────────

function sendMsg(msg) {
  return chrome.runtime.sendMessage(msg);
}

// ── Start ─────────────────────────────────────────

init();
