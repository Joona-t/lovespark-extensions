'use strict';

LoveSparkTheme.init();

const todayEl = document.getElementById('todayCount');
const sessionsEl = document.getElementById('sessionsCount');
const totalEl = document.getElementById('totalCount');
const sparkyStateEl = document.getElementById('sparkyState');
const encouragementEl = document.getElementById('encouragement');
const timerSection = document.getElementById('timerSection');
const presetSection = document.getElementById('presetSection');
const timerDisplay = document.getElementById('timerDisplay');
const timerLabel = document.getElementById('timerLabel');
const timerRingProgress = document.getElementById('timerRingProgress');
const stopBtn = document.getElementById('stopBtn');
const footerMount = document.getElementById('footerMount');

let prevToday = 0;
let prevTotal = 0;
let refreshInterval = null;
const CIRCUMFERENCE = 2 * Math.PI * 35; // r=35 from SVG

if (typeof LoveSparkFooter !== 'undefined') {
  LoveSparkFooter.render(footerMount);
}

// ── Safe message to background ──────────────
async function sendBg(msg) {
  try {
    return await chrome.runtime.sendMessage(msg);
  } catch (err) {
    console.warn('[LoveSpark Body Double] sendBg error:', err.message);
    return null;
  }
}

// ── Format minutes as M:SS ──────────────────
function formatTime(minutes) {
  const m = Math.floor(minutes);
  const s = Math.round((minutes - m) * 60);
  return m + ':' + String(s).padStart(2, '0');
}

// ── Update timer ring ───────────────────────
function updateRing(progress) {
  const offset = CIRCUMFERENCE - (progress / 100) * CIRCUMFERENCE;
  timerRingProgress.style.strokeDashoffset = offset;
}

// ── Show active session UI ──────────────────
function showActiveSession(session) {
  presetSection.hidden = true;
  timerSection.hidden = false;
  sparkyStateEl.classList.add('focusing');
  sparkyStateEl.textContent = '\u{1F33A}'; // focusing flower

  timerDisplay.textContent = formatTime(session.remaining);
  timerLabel.textContent = session.remaining + ' min remaining';
  updateRing(session.progress);
  encouragementEl.textContent = session.encouragement;
}

// ── Show idle UI ────────────────────────────
function showIdleUI(encouragement) {
  presetSection.hidden = false;
  timerSection.hidden = true;
  sparkyStateEl.classList.remove('focusing');
  sparkyStateEl.textContent = '\u{1F33A}';
  encouragementEl.textContent = encouragement || "I'm here. Ready when you are.";
}

// ── Update stats ────────────────────────────
function updateStats(data) {
  const today = data.minutesToday || 0;
  const total = data.minutesTotal || 0;
  const sessions = data.sessionsToday || 0;

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  sessionsEl.textContent = sessions;
  prevToday = today;
  prevTotal = total;

  // Show session or idle
  if (data.session && data.session.active) {
    showActiveSession(data.session);
  } else {
    showIdleUI(data.session ? data.session.encouragement : null);
  }
}

// ── Preset click handlers ───────────────────
document.querySelectorAll('.btn-preset').forEach(btn => {
  btn.addEventListener('click', async () => {
    const preset = btn.dataset.preset;
    const result = await sendBg({ type: 'START_SESSION', preset });
    if (result && result.ok) {
      showActiveSession(result.session);
      startPolling();
      await refreshData();
    }
  });
});

// ── Stop session ────────────────────────────
stopBtn.addEventListener('click', async () => {
  await sendBg({ type: 'STOP_SESSION' });
  stopPolling();
  await refreshData();
});

// ── Polling for timer updates ───────────────
function startPolling() {
  stopPolling();
  refreshInterval = setInterval(async () => {
    const data = await sendBg({ type: 'GET_STATS' });
    if (data) {
      updateStats(data);
      if (!data.session || !data.session.active) {
        stopPolling();
      }
    }
  }, 5000);
}

function stopPolling() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}

// ── Refresh all data ────────────────────────
async function refreshData() {
  const data = await sendBg({ type: 'GET_STATS' });
  if (data) {
    updateStats(data);
    if (data.session && data.session.active) {
      startPolling();
    }
  }
}

// ── Init ────────────────────────────────────
refreshData();
