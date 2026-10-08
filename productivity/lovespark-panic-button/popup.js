'use strict';

LoveSparkTheme.init();

const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const safeMsgEl = document.getElementById('safeMsg');
const newMsgBtn = document.getElementById('newMsgBtn');
const breatheText = document.getElementById('breatheText');
const footerMount = document.getElementById('footerMount');

let prevToday = 0;
let prevTotal = 0;

if (typeof LoveSparkFooter !== 'undefined') {
  LoveSparkFooter.render(footerMount);
}

async function sendBg(msg) {
  try {
    return await chrome.runtime.sendMessage(msg);
  } catch (err) {
    console.warn('[LoveSpark Panic Button] sendBg error:', err.message);
    return null;
  }
}

// ── Breathing text cycle ────────────────────
const BREATHE_PHASES = [
  { text: 'Breathe in...', duration: 4000 },
  { text: 'Hold...', duration: 4000 },
  { text: 'Breathe out...', duration: 4000 },
  { text: 'Hold...', duration: 2000 }
];

let breatheIndex = 0;
function cycleBreathe() {
  const phase = BREATHE_PHASES[breatheIndex % BREATHE_PHASES.length];
  breatheText.textContent = phase.text;
  breatheIndex++;
  setTimeout(cycleBreathe, phase.duration);
}
cycleBreathe();

// ── New message ─────────────────────────────
newMsgBtn.addEventListener('click', async () => {
  safeMsgEl.style.opacity = '0';
  const result = await sendBg({ type: 'GET_MESSAGE' });
  setTimeout(() => {
    if (result && result.message) {
      safeMsgEl.textContent = result.message;
    }
    safeMsgEl.style.opacity = '1';
  }, 300);
});

// ── Stats ───────────────────────────────────
function updateStats(data) {
  const today = data.escapesToday || 0;
  const total = data.escapesTotal || 0;

  todayEl.textContent = today;
  totalEl.textContent = total;
  prevToday = today;
  prevTotal = total;

  if (data.message) {
    safeMsgEl.textContent = data.message;
  }
}

// ── Init ────────────────────────────────────
async function init() {
  // Log this escape
  await sendBg({ type: 'LOG_ESCAPE' });

  // Load stats + message
  const data = await sendBg({ type: 'GET_STATS' });
  if (data) updateStats(data);
}

init();
