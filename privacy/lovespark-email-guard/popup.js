'use strict';

// ── DOM refs ─────────────────────────────────────────────
const statusIcon = document.getElementById('status-icon');
const statusText = document.getElementById('status-text');
const cuteMsg = document.getElementById('cute-msg');
const toggleEl = document.getElementById('main-toggle');
const todayEl = document.getElementById('stat-today');
const totalEl = document.getElementById('stat-total');

// ── State ────────────────────────────────────────────────
let isEnabled = true;
let prevToday = 0;
let prevTotal = 0;
let msgIndex = 0;

// ── Cute messages ────────────────────────────────────────
const CUTE_MSGS = [
  'Your inbox, your business \u2728',
  "No one's watching, bestie! \uD83D\uDC95",
  'Trackers? Blocked! \uD83D\uDC8C',
  'Inbox privacy: secured \uD83C\uDF38',
  'Open emails in peace \uD83D\uDC96',
  'Spy pixels? Not today! \u2728',
  'Stay invisible, bestie! \uD83D\uDC95',
  'Your reads are your secret \uD83C\uDF38',
];

// ── Helpers ──────────────────────────────────────────────
function sendMsg(msg) {
  return chrome.runtime.sendMessage(msg);
}

function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}

function animateCount(el, from, to, duration) {
  if (from === to) { el.textContent = to.toLocaleString(); return; }
  const start = performance.now();
  const step = (now) => {
    const t = Math.min((now - start) / duration, 1);
    el.textContent = Math.round(from + (to - from) * easeOut(t)).toLocaleString();
    if (t < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

function popEl(el) {
  el.classList.remove('popping');
  void el.offsetWidth;
  el.classList.add('popping');
  el.addEventListener('animationend', () => el.classList.remove('popping'), { once: true });
}

function updateStatusUI(enabled) {
  if (enabled) {
    statusIcon.textContent = '\uD83D\uDC8C';
    statusIcon.classList.remove('paused');
    statusText.textContent = 'Inbox protected!';
  } else {
    statusIcon.textContent = '\u23F8\uFE0F';
    statusIcon.classList.add('paused');
    statusText.textContent = 'Paused';
  }
}

function rotateCuteMsg() {
  msgIndex = (msgIndex + 1) % CUTE_MSGS.length;
  cuteMsg.style.opacity = '0';
  setTimeout(() => {
    cuteMsg.textContent = CUTE_MSGS[msgIndex];
    cuteMsg.style.opacity = '1';
  }, 200);
}

// ── Toggle handler ───────────────────────────────────────
toggleEl.addEventListener('change', async () => {
  isEnabled = toggleEl.checked;
  updateStatusUI(isEnabled);
  await sendMsg({ type: 'SET_ENABLED', enabled: isEnabled });
});

// ── Real-time updates via storage.onChanged ──────────────
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;

  if (changes.isEnabled !== undefined) {
    isEnabled = changes.isEnabled.newValue !== false;
    toggleEl.checked = isEnabled;
    updateStatusUI(isEnabled);
  }

  if (changes.trackersBlockedToday) {
    const newVal = changes.trackersBlockedToday.newValue || 0;
    if (newVal !== prevToday) {
      animateCount(todayEl, prevToday, newVal, 300);
      popEl(todayEl);
      prevToday = newVal;
    }
  }

  if (changes.trackersBlockedTotal) {
    const newVal = changes.trackersBlockedTotal.newValue || 0;
    if (newVal !== prevTotal) {
      animateCount(totalEl, prevTotal, newVal, 300);
      prevTotal = newVal;
    }
  }
});

// ── Init ─────────────────────────────────────────────────
async function init() {
  const data = await sendMsg({ type: 'GET_STATS' });

  isEnabled = data.isEnabled !== false;
  toggleEl.checked = isEnabled;
  updateStatusUI(isEnabled);

  const today = data.trackersBlockedToday || 0;
  const total = data.trackersBlockedTotal || 0;

  animateCount(todayEl, 0, today, 600);
  animateCount(totalEl, 0, total, 800);
  prevToday = today;
  prevTotal = total;

  setInterval(rotateCuteMsg, 3500);
}

init();
