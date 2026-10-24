'use strict';

LoveSparkTheme.init();

const affirmationEl = document.getElementById('affirmation');
const newBtn = document.getElementById('newBtn');
const passTimerEl = document.getElementById('passTimer');
const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const footerMount = document.getElementById('footerMount');

if (typeof LoveSparkFooter !== 'undefined') {
  footerMount.innerHTML = LoveSparkFooter.render();
}

async function sendBg(msg) {
  try {
    return await chrome.runtime.sendMessage(msg);
  } catch (err) {
    console.warn('[LoveSpark RSD Shield] sendBg error:', err.message);
    return null;
  }
}

// ── 20-minute countdown ─────────────────────
let seconds = 20 * 60;
function updateTimer() {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  passTimerEl.textContent = m + ':' + String(s).padStart(2, '0');
  if (seconds > 0) seconds--;
}
const timerInterval = setInterval(updateTimer, 1000);
updateTimer();

// ── New affirmation ─────────────────────────
newBtn.addEventListener('click', async () => {
  affirmationEl.style.opacity = '0';
  const result = await sendBg({ type: 'GET_NEW' });
  setTimeout(() => {
    if (result && result.affirmation) {
      affirmationEl.textContent = result.affirmation;
    }
    affirmationEl.style.opacity = '1';
  }, 300);
});

// ── Init ────────────────────────────────────
async function init() {
  const data = await sendBg({ type: 'GET_STATS' });
  if (data) {
    todayEl.textContent = data.shieldsToday || 0;
    totalEl.textContent = data.shieldsTotal || 0;
    if (data.affirmation) {
      affirmationEl.textContent = data.affirmation;
    }
  }
}

init();
