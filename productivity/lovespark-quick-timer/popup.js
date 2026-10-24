'use strict';

LoveSparkTheme.init();

const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const timerDisplay = document.getElementById('timerDisplay');
const presetSection = document.getElementById('presetSection');
const completedMsg = document.getElementById('completedMsg');
const timerText = document.getElementById('timerText');
const ringProgress = document.getElementById('ringProgress');
const stopBtn = document.getElementById('stopBtn');
const dismissBtn = document.getElementById('dismissBtn');
const customMin = document.getElementById('customMin');
const customBtn = document.getElementById('customBtn');
const footerMount = document.getElementById('footerMount');

let prevToday = 0;
let prevTotal = 0;
let pollInterval = null;
const CIRCUMFERENCE = 2 * Math.PI * 42;

if (typeof LoveSparkFooter !== 'undefined') {
  LoveSparkFooter.render(footerMount);
}

async function sendBg(msg) {
  try {
    return await chrome.runtime.sendMessage(msg);
  } catch (err) {
    console.warn('[LoveSpark Quick Timer] sendBg error:', err.message);
    return null;
  }
}

function formatSeconds(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m + ':' + String(s).padStart(2, '0');
}

function showTimerUI(timer) {
  presetSection.hidden = true;
  completedMsg.hidden = true;
  timerDisplay.hidden = false;
  timerText.textContent = formatSeconds(timer.remaining);
  const offset = CIRCUMFERENCE - (timer.progress / 100) * CIRCUMFERENCE;
  ringProgress.style.strokeDashoffset = offset;
}

function showPresetUI() {
  timerDisplay.hidden = true;
  completedMsg.hidden = true;
  presetSection.hidden = false;
  stopPolling();
}

function showCompletedUI() {
  timerDisplay.hidden = true;
  presetSection.hidden = true;
  completedMsg.hidden = false;
  stopPolling();
}

function updateStats(data) {
  const today = data.timersToday || 0;
  const total = data.timersTotal || 0;

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  prevToday = today;
  prevTotal = total;

  const timer = data.timer;
  if (timer && timer.running) {
    showTimerUI(timer);
    startPolling();
  } else if (timer && timer.completed) {
    showCompletedUI();
  } else {
    showPresetUI();
  }
}

async function startTimer(minutes) {
  const result = await sendBg({ type: 'START_TIMER', minutes });
  if (result && result.ok) {
    showTimerUI(result.timer);
    startPolling();
  }
}

// Preset buttons
document.querySelectorAll('.btn-preset').forEach(btn => {
  btn.addEventListener('click', () => startTimer(parseInt(btn.dataset.minutes)));
});

// Custom input
customBtn.addEventListener('click', () => {
  const val = parseInt(customMin.value);
  if (val >= 1 && val <= 120) startTimer(val);
});
customMin.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') customBtn.click();
});

// Stop
stopBtn.addEventListener('click', async () => {
  await sendBg({ type: 'STOP_TIMER' });
  showPresetUI();
  await refreshData();
});

// Dismiss completed
dismissBtn.addEventListener('click', async () => {
  await sendBg({ type: 'STOP_TIMER' });
  showPresetUI();
  await refreshData();
});

// Polling
function startPolling() {
  stopPolling();
  pollInterval = setInterval(refreshData, 3000);
}

function stopPolling() {
  if (pollInterval) {
    clearInterval(pollInterval);
    pollInterval = null;
  }
}

async function refreshData() {
  const data = await sendBg({ type: 'GET_STATS' });
  if (data) updateStats(data);
}

chrome.storage.onChanged.addListener(() => refreshData());
refreshData();
