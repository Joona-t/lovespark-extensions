'use strict';

/* ── Theme ─────────────────────────────────────────── */
LoveSparkTheme.init();

/* ── DOM refs ──────────────────────────────────────── */
var statusIcon     = document.getElementById('statusIcon');
var statusText     = document.getElementById('statusText');
var cuteMsg        = document.getElementById('cuteMsg');
var toggleEl       = document.getElementById('enableToggle');
var todayEl        = document.getElementById('todayCount');
var totalEl        = document.getElementById('totalCount');
var warningSection = document.getElementById('warningSection');
var warningFile    = document.getElementById('warningFile');
var warningExt     = document.getElementById('warningExt');
var allowBtn       = document.getElementById('allowBtn');
var cancelBtn      = document.getElementById('cancelBtn');

/* ── State ─────────────────────────────────────────── */
var prevToday = 0;
var prevTotal = 0;
var pendingId = null;

var CUTE_MSGS = [
  'Safe downloads only!',
  'Sparky is on watch!',
  'No sneaky files here!',
  'Your downloads are guarded!',
  'Stay safe, bestie!',
  'Only trusted files allowed!',
];

/* ── Warning panel ─────────────────────────────────── */
function showWarning(pending) {
  warningSection.classList.remove('hidden');
  var name = pending.filename || pending.url || 'Unknown file';
  warningFile.textContent = name;
  warningExt.textContent = 'Extension: ' + (pending.ext || 'unknown');
  pendingId = pending.id;
}

function hideWarning() {
  warningSection.classList.add('hidden');
  pendingId = null;
}

allowBtn.addEventListener('click', function() {
  if (pendingId) {
    chrome.runtime.sendMessage({ type: 'RESUME_DOWNLOAD', downloadId: pendingId });
  }
  hideWarning();
});

cancelBtn.addEventListener('click', function() {
  if (pendingId) {
    chrome.runtime.sendMessage({ type: 'CANCEL_DOWNLOAD', downloadId: pendingId });
  }
  hideWarning();
});

/* ── Toggle ────────────────────────────────────────── */
toggleEl.addEventListener('change', function() {
  chrome.runtime.sendMessage({ type: 'SET_ENABLED', enabled: toggleEl.checked });
  updateStatusUI(toggleEl.checked);
});

function updateStatusUI(enabled) {
  statusIcon.classList.toggle('paused', !enabled);
  statusText.textContent = enabled ? 'Guarding downloads!' : 'Paused';
}

/* ── UI update from storage ────────────────────────── */
function updateStats(data) {
  var enabled = data.isEnabled !== false;
  var today = data.blockedToday || 0;
  var total = data.blockedTotal || 0;

  toggleEl.checked = enabled;
  updateStatusUI(enabled);

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  prevToday = today;
  prevTotal = total;

  /* Check for pending download warning */
  if (data.pendingDownload && data.pendingDownload.id) {
    showWarning(data.pendingDownload);
  } else {
    hideWarning();
  }
}

chrome.storage.onChanged.addListener(function() {
  chrome.runtime.sendMessage({ type: 'GET_STATS' }).then(updateStats);
});

/* ── Init ──────────────────────────────────────────── */
LoveSparkPopup.rotateMessages(cuteMsg, CUTE_MSGS);
chrome.runtime.sendMessage({ type: 'GET_STATS' }).then(updateStats);

/* ── Footer ────────────────────────────────────────── */
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
