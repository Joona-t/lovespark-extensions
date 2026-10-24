'use strict';

LoveSparkTheme.init();

const timerSection = document.getElementById('timerSection');
const presetSection = document.getElementById('presetSection');
const phaseLabel = document.getElementById('phaseLabel');
const timerText = document.getElementById('timerText');
const ringProgress = document.getElementById('ringProgress');
const stopBtn = document.getElementById('stopBtn');
const startBtn = document.getElementById('startBtn');
const roseGarden = document.getElementById('roseGarden');
const emptyGarden = document.getElementById('emptyGarden');
const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const footerMount = document.getElementById('footerMount');

let prevToday = 0;
let prevTotal = 0;
let selectedPreset = 'classic';
let pollInterval = null;
const CIRCUMFERENCE = 2 * Math.PI * 42;

if (typeof LoveSparkFooter !== 'undefined') {
  footerMount.innerHTML = LoveSparkFooter.render();
}

async function sendBg(msg) {
  try {
    return await chrome.runtime.sendMessage(msg);
  } catch (err) {
    console.warn('[LoveSpark Pomodoro Rose] sendBg error:', err.message);
    return null;
  }
}

function formatSeconds(secs) {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m + ':' + String(s).padStart(2, '0');
}

function showTimer(session) {
  presetSection.hidden = true;
  timerSection.hidden = false;
  const isBreak = session.phase === 'break';
  phaseLabel.textContent = isBreak ? 'Break time' : 'Working';
  phaseLabel.classList.toggle('on-break', isBreak);
  ringProgress.classList.toggle('on-break', isBreak);
  timerText.textContent = formatSeconds(session.remaining);
  const offset = CIRCUMFERENCE - (session.progress / 100) * CIRCUMFERENCE;
  ringProgress.style.strokeDashoffset = offset;
}

function showPresets() {
  timerSection.hidden = true;
  presetSection.hidden = false;
  stopPolling();
}

function renderRoses(roses) {
  roseGarden.textContent = '';
  if (!roses || roses.length === 0) {
    emptyGarden.hidden = false;
    roseGarden.hidden = true;
    return;
  }
  emptyGarden.hidden = true;
  roseGarden.hidden = false;
  for (const rose of roses) {
    const span = document.createElement('span');
    span.className = 'rose-item';
    span.textContent = '\u{1F339}';
    span.setAttribute('aria-label', 'Rose earned at ' + rose.time);
    roseGarden.appendChild(span);
  }
}

function updateStats(data) {
  const today = data.pomosToday || 0;
  const total = data.pomosTotal || 0;

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  prevToday = today;
  prevTotal = total;

  renderRoses(data.roses);

  if (data.session && data.session.active) {
    showTimer(data.session);
    startPolling();
  } else {
    showPresets();
  }
}

// Preset selection
document.querySelectorAll('.btn-preset').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedPreset = btn.dataset.preset;
    document.querySelectorAll('.btn-preset').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
  });
});

startBtn.addEventListener('click', async () => {
  const result = await sendBg({ type: 'START_POMO', preset: selectedPreset });
  if (result && result.ok) {
    showTimer(result.session);
    startPolling();
  }
});

stopBtn.addEventListener('click', async () => {
  await sendBg({ type: 'STOP_POMO' });
  showPresets();
  await refreshData();
});

function startPolling() {
  stopPolling();
  pollInterval = setInterval(refreshData, 3000);
}

function stopPolling() {
  if (pollInterval) { clearInterval(pollInterval); pollInterval = null; }
}

async function refreshData() {
  const data = await sendBg({ type: 'GET_STATS' });
  if (data) updateStats(data);
}

chrome.storage.onChanged.addListener(() => refreshData());
refreshData();
