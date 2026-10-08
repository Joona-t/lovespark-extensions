'use strict';

/* ── Theme ─────────────────────────────────────────── */
LoveSparkTheme.init();

/* ── DOM refs ──────────────────────────────────────── */
const statusIcon  = document.getElementById('statusIcon');
const statusText  = document.getElementById('statusText');
const cuteMsg     = document.getElementById('cuteMsg');
const toggleEl    = document.getElementById('enableToggle');
const todayEl     = document.getElementById('todayCount');
const totalEl     = document.getElementById('totalCount');
const histCountEl = document.getElementById('historyCount');
const clearBtn    = document.getElementById('clearBtn');

/* ── State ─────────────────────────────────────────── */
let prevToday = 0;
let prevTotal = 0;
let selectedRange = 'hour';

const CUTE_MSGS = [
  'A clean history is a fresh start!',
  'Privacy is self-care!',
  'Fresh and sparkly!',
  'Your browsing, your rules!',
  'Sparky is proud of you!',
  'Browse freely, bestie!',
];

/* ── Safe message to background ────────────────────── */
function sendBg(msg) {
  try { return chrome.runtime.sendMessage(msg); } catch (_) { return Promise.resolve(null); }
}

/* ── Range buttons ─────────────────────────────────── */
document.querySelectorAll('.range-btn').forEach(function(btn) {
  btn.addEventListener('click', function() {
    document.querySelectorAll('.range-btn').forEach(function(b) {
      b.classList.remove('active');
      b.setAttribute('aria-pressed', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
    selectedRange = btn.dataset.range;
    fetchHistoryCount();
  });
});

/* ── Fetch history count ───────────────────────────── */
function fetchHistoryCount() {
  histCountEl.textContent = '...';
  sendBg({ type: 'GET_HISTORY_COUNT', range: selectedRange })
    .then(function(res) {
      if (res && res.count !== undefined) {
        histCountEl.textContent = res.count.toLocaleString();
      }
    })
    .catch(function() {
      histCountEl.textContent = '--';
    });
}

/* ── Clear button ──────────────────────────────────── */
clearBtn.addEventListener('click', function() {
  clearBtn.disabled = true;
  clearBtn.textContent = 'Clearing...';
  sendBg({ type: 'CLEAR_HISTORY', range: selectedRange })
    .then(function() {
      clearBtn.textContent = 'Cleared!';
      fetchHistoryCount();
      setTimeout(function() {
        clearBtn.textContent = 'Clear History';
        clearBtn.disabled = false;
      }, 1500);
    })
    .catch(function() {
      clearBtn.textContent = 'Error';
      setTimeout(function() {
        clearBtn.textContent = 'Clear History';
        clearBtn.disabled = false;
      }, 1500);
    });
});

/* ── Toggle ────────────────────────────────────────── */
toggleEl.addEventListener('change', function() {
  try { chrome.runtime.sendMessage({ type: 'SET_ENABLED', enabled: toggleEl.checked }); } catch (_) {}
  updateStatusUI(toggleEl.checked);
});

function updateStatusUI(enabled) {
  statusIcon.classList.toggle('paused', !enabled);
  statusText.textContent = enabled ? 'Ready to clean!' : 'Paused';
  clearBtn.disabled = !enabled;
}

/* ── UI update from storage ────────────────────────── */
function updateStats(data) {
  var enabled = data.isEnabled !== false;
  var today = data.clearedToday || 0;
  var total = data.clearedTotal || 0;

  toggleEl.checked = enabled;
  updateStatusUI(enabled);

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  prevToday = today;
  prevTotal = total;
}

chrome.storage.onChanged.addListener(function() {
  sendBg({ type: 'GET_STATS' }).then(function(data) { if (data) updateStats(data); });
});

/* ── Init ──────────────────────────────────────────── */
LoveSparkPopup.rotateMessages(cuteMsg, CUTE_MSGS);
sendBg({ type: 'GET_STATS' }).then(function(data) { if (data) updateStats(data); });
fetchHistoryCount();

/* ── Footer ────────────────────────────────────────── */
LoveSparkFooter.render();
