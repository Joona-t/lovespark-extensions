'use strict';

/* ── Theme ─────────────────────────────────────────── */
LoveSparkTheme.init();

/* ── DOM refs ──────────────────────────────────────── */
var statusIcon = document.getElementById('statusIcon');
var statusText = document.getElementById('statusText');
var cuteMsg    = document.getElementById('cuteMsg');
var toggleEl   = document.getElementById('enableToggle');
var todayEl    = document.getElementById('todayCount');
var totalEl    = document.getElementById('totalCount');

/* ── State ─────────────────────────────────────────── */
var prevToday = 0;
var prevTotal = 0;

var CUTE_MSGS = [
  'Clean URLs, happy browsing!',
  'Trackers? Never heard of them!',
  'Your links are sparkling!',
  'Privacy is beautiful!',
  'No tracking params here!',
  'Browse in peace, bestie!',
  'Stripped with love!',
  'URLs, decluttered!',
];

/* ── Toggle ────────────────────────────────────────── */
toggleEl.addEventListener('change', function() {
  chrome.runtime.sendMessage({ type: 'SET_ENABLED', enabled: toggleEl.checked });
  updateStatusUI(toggleEl.checked);
});

function updateStatusUI(enabled) {
  statusIcon.classList.toggle('paused', !enabled);
  statusText.textContent = enabled ? 'Stripping trackers!' : 'Paused';
}

/* ── UI update from storage ────────────────────────── */
function updateStats(data) {
  var enabled = data.isEnabled !== false;
  var today = data.strippedToday || 0;
  var total = data.strippedTotal || 0;

  toggleEl.checked = enabled;
  updateStatusUI(enabled);

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  prevToday = today;
  prevTotal = total;
}

chrome.storage.onChanged.addListener(function() {
  chrome.runtime.sendMessage({ type: 'GET_STATS' }).then(updateStats);
});

/* ── Init ──────────────────────────────────────────── */
LoveSparkPopup.rotateMessages(cuteMsg, CUTE_MSGS);
chrome.runtime.sendMessage({ type: 'GET_STATS' }).then(updateStats);

/* ── Footer ────────────────────────────────────────── */
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
