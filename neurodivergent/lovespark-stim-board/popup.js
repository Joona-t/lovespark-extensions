'use strict';

LoveSparkTheme.init();

const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const clickerEl = document.getElementById('clicker');
const clickerCountEl = document.getElementById('clickerCount');
const colorBlobEl = document.getElementById('colorBlob');
const blobCircleEl = document.getElementById('blobCircle');
const spinnerEl = document.getElementById('spinner');
const spinnerIconEl = document.getElementById('spinnerIcon');
const toggleStimEl = document.getElementById('toggleStim');
const toggleDotEl = document.getElementById('toggleDot');
const patternGridEl = document.getElementById('patternGrid');
const footerMount = document.getElementById('footerMount');

let prevToday = 0;
let prevTotal = 0;
let toggleState = false;

if (typeof LoveSparkFooter !== 'undefined') {
  footerMount.innerHTML = LoveSparkFooter.render();
}

async function sendBg(msg) {
  try {
    return await chrome.runtime.sendMessage(msg);
  } catch (err) {
    console.warn('[LoveSpark Stim Board] sendBg error:', err.message);
    return null;
  }
}

// ── Random color ────────────────────────────
const COLORS = [
  '#E8457C', '#D63466', '#FF6B9D', '#C44569',
  '#7C5CBF', '#9B59B6', '#6C5CE7', '#A29BFE',
  '#00B894', '#55EFC4', '#00CEC9', '#81ECEC',
  '#FDCB6E', '#F39C12', '#E17055', '#FAB1A0'
];

function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

// ── Build pattern grid (3x3) ────────────────
function buildPatternGrid() {
  patternGridEl.textContent = '';
  for (let i = 0; i < 9; i++) {
    const cell = document.createElement('button');
    cell.className = 'pattern-cell';
    cell.setAttribute('aria-label', 'Pattern cell ' + (i + 1));
    cell.addEventListener('click', (e) => {
      e.stopPropagation();
      cell.classList.toggle('lit');
      sendBg({ type: 'STIM' });
      refreshStats();
    });
    patternGridEl.appendChild(cell);
  }
}

// ── 1. Clicker ──────────────────────────────
clickerEl.addEventListener('click', async () => {
  const result = await sendBg({ type: 'CLICK' });
  if (result && result.ok) {
    clickerCountEl.textContent = result.count;
    LoveSparkPopup.pop(clickerCountEl);
  }
  refreshStats();
});

// Long press to reset
let clickerTimer = null;
clickerEl.addEventListener('mousedown', () => {
  clickerTimer = setTimeout(async () => {
    const result = await sendBg({ type: 'RESET_CLICKER' });
    if (result) clickerCountEl.textContent = '0';
  }, 1500);
});
clickerEl.addEventListener('mouseup', () => clearTimeout(clickerTimer));
clickerEl.addEventListener('mouseleave', () => clearTimeout(clickerTimer));

// ── 2. Color Blob ───────────────────────────
colorBlobEl.addEventListener('click', async () => {
  blobCircleEl.style.background = randomColor();
  await sendBg({ type: 'STIM' });
  refreshStats();
});

// ── 3. Breathing — auto-animates via CSS ────
// No click handler needed — it's a passive stim

// ── 4. Pattern — built above ────────────────

// ── 5. Spinner ──────────────────────────────
spinnerEl.addEventListener('click', async () => {
  spinnerIconEl.classList.remove('spinning');
  void spinnerIconEl.offsetWidth;
  spinnerIconEl.classList.add('spinning');
  await sendBg({ type: 'STIM' });
  refreshStats();
});

// ── 6. Toggle ───────────────────────────────
toggleStimEl.addEventListener('click', async () => {
  toggleState = !toggleState;
  toggleDotEl.classList.toggle('on', toggleState);
  await sendBg({ type: 'STIM' });
  refreshStats();
});

// ── Stats ───────────────────────────────────
function updateStats(data) {
  const today = data.stimsToday || 0;
  const total = data.stimsTotal || 0;

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  prevToday = today;
  prevTotal = total;

  clickerCountEl.textContent = data.clickerCount || 0;
}

async function refreshStats() {
  const data = await sendBg({ type: 'GET_STATS' });
  if (data) updateStats(data);
}

// ── Init ────────────────────────────────────
buildPatternGrid();
refreshStats();
