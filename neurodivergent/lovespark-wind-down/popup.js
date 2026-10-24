'use strict';

LoveSparkTheme.init();

const countdownText = document.getElementById('countdownText');
const countdownEmoji = document.getElementById('countdownEmoji');
const warmthFill = document.getElementById('warmthFill');
const warmthLabel = document.getElementById('warmthLabel');
const bedtimeHour = document.getElementById('bedtimeHour');
const bedtimeMinute = document.getElementById('bedtimeMinute');
const toggleEl = document.getElementById('enableToggle');
const statusText = document.getElementById('statusText');
const todayEl = document.getElementById('todayCount');
const footerMount = document.getElementById('footerMount');

if (typeof LoveSparkFooter !== 'undefined') LoveSparkFooter.render(footerMount);

// Populate hour dropdown
for (let h = 0; h < 24; h++) {
  const opt = document.createElement('option');
  opt.value = h;
  opt.textContent = String(h).padStart(2, '0');
  bedtimeHour.appendChild(opt);
}

async function sendBg(msg) {
  try { return await chrome.runtime.sendMessage(msg); }
  catch (_) { return null; }
}

function formatCountdown(mins) {
  if (mins <= 0) return 'Past bedtime!';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h > 0) return h + 'h ' + m + 'm until bed';
  return m + ' min until bed';
}

function updateUI(data) {
  todayEl.textContent = data.remindersToday || 0;
  toggleEl.checked = data.isEnabled !== false;
  statusText.textContent = data.isEnabled !== false ? 'Wind down active' : 'Wind down off';
  bedtimeHour.value = data.bedtimeHour || 22;
  bedtimeMinute.value = data.bedtimeMinute || 0;

  const mins = data.minutesUntilBed;
  countdownText.textContent = formatCountdown(mins);
  countdownEmoji.textContent = mins <= 0 ? '\u{1F634}' : mins <= 30 ? '\u{1F319}' : '\u{1F305}';

  const warmth = data.warmth || 0;
  warmthFill.style.width = warmth + '%';
  warmthLabel.textContent = 'Screen warmth: ' + warmth + '%';
}

toggleEl.addEventListener('change', async () => {
  await sendBg({ type: 'SET_ENABLED', enabled: toggleEl.checked });
  statusText.textContent = toggleEl.checked ? 'Wind down active' : 'Wind down off';
});

bedtimeHour.addEventListener('change', async () => {
  await sendBg({ type: 'SET_BEDTIME', hour: parseInt(bedtimeHour.value), minute: parseInt(bedtimeMinute.value) });
  const data = await sendBg({ type: 'GET_STATS' });
  if (data) updateUI(data);
});

bedtimeMinute.addEventListener('change', async () => {
  await sendBg({ type: 'SET_BEDTIME', hour: parseInt(bedtimeHour.value), minute: parseInt(bedtimeMinute.value) });
  const data = await sendBg({ type: 'GET_STATS' });
  if (data) updateUI(data);
});

async function init() {
  const data = await sendBg({ type: 'GET_STATS' });
  if (data) updateUI(data);
}

init();
