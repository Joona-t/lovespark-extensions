'use strict';

LoveSparkTheme.init();

const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const jarEmojiEl = document.getElementById('jarEmoji');
const jarLabelEl = document.getElementById('jarLabel');
const jarCountEl = document.getElementById('jarCount');
const streakTextEl = document.getElementById('streakText');
const shakeBtnEl = document.getElementById('shakeBtn');
const randomWinEl = document.getElementById('randomWin');
const randomWinTextEl = document.getElementById('randomWinText');
const randomWinDateEl = document.getElementById('randomWinDate');
const celebrationEl = document.getElementById('celebration');
const winInputEl = document.getElementById('winInput');
const addBtnEl = document.getElementById('addBtn');
const todayWinsSectionEl = document.getElementById('todayWinsSection');
const todayWinsListEl = document.getElementById('todayWinsList');
const footerMount = document.getElementById('footerMount');

let prevToday = 0;
let prevTotal = 0;

if (typeof LoveSparkFooter !== 'undefined') {
  LoveSparkFooter.render(footerMount);
}

// ── Safe message to background ──────────────
async function sendBg(msg) {
  try {
    return await chrome.runtime.sendMessage(msg);
  } catch (err) {
    console.warn('[LoveSpark Win Jar] sendBg error:', err.message);
    return null;
  }
}

// ── DOM helper (NO innerHTML per KI-011) ────
function el(tag, attrs, children) {
  const node = document.createElement(tag);
  if (attrs) {
    for (const [key, val] of Object.entries(attrs)) {
      if (key === 'textContent') node.textContent = val;
      else if (key === 'className') node.className = val;
      else node.setAttribute(key, val);
    }
  }
  if (children) {
    for (const child of children) {
      if (typeof child === 'string') node.appendChild(document.createTextNode(child));
      else if (child) node.appendChild(child);
    }
  }
  return node;
}

// ── Render today's wins ─────────────────────
function renderTodayWins(wins) {
  todayWinsListEl.textContent = '';
  if (!wins || wins.length === 0) {
    todayWinsSectionEl.hidden = true;
    return;
  }
  todayWinsSectionEl.hidden = false;
  for (const win of wins) {
    const item = el('div', { className: 'win-item', role: 'listitem' }, [
      el('span', { className: 'win-item-star', 'aria-hidden': 'true', textContent: '\u2B50' }),
      el('span', { className: 'win-item-text', title: win.text, textContent: win.text }),
      el('span', { className: 'win-item-time', textContent: win.time })
    ]);
    todayWinsListEl.appendChild(item);
  }
}

// ── Update jar display ──────────────────────
function updateJar(data) {
  if (data.jarLevel) {
    jarEmojiEl.textContent = data.jarLevel.emoji;
    jarLabelEl.textContent = data.jarLevel.label;
  }
  jarCountEl.textContent = (data.totalWins || 0) + ' wins collected';
  if (data.streak > 0) {
    streakTextEl.textContent = data.streak + ' day streak';
  } else {
    streakTextEl.textContent = '';
  }
  shakeBtnEl.disabled = (data.totalWins || 0) === 0;
}

// ── Update stats ────────────────────────────
function updateStats(data) {
  const today = data.winsToday || 0;
  const total = data.winsTotal || 0;

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  prevToday = today;
  prevTotal = total;

  updateJar(data);
  renderTodayWins(data.todayWins);
}

// ── Add win ─────────────────────────────────
async function addWin() {
  const text = winInputEl.value.trim();
  if (!text) return;
  const result = await sendBg({ type: 'ADD_WIN', text });
  if (result && result.ok) {
    winInputEl.value = '';

    // Show celebration
    celebrationEl.textContent = result.celebration;
    celebrationEl.hidden = false;
    setTimeout(() => { celebrationEl.hidden = true; }, 2500);

    // Animate jar
    jarEmojiEl.classList.remove('shaking');
    void jarEmojiEl.offsetWidth;
    jarEmojiEl.classList.add('shaking');

    // Update jar level
    if (result.jarLevel) {
      jarEmojiEl.textContent = result.jarLevel.emoji;
      jarLabelEl.textContent = result.jarLevel.label;
    }
    jarCountEl.textContent = (result.totalWins || 0) + ' wins collected';

    await refreshData();
  }
}

addBtnEl.addEventListener('click', addWin);
winInputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addWin();
});

// ── Shake jar ───────────────────────────────
shakeBtnEl.addEventListener('click', async () => {
  // Animate shake
  jarEmojiEl.classList.remove('shaking');
  void jarEmojiEl.offsetWidth;
  jarEmojiEl.classList.add('shaking');

  const result = await sendBg({ type: 'SHAKE_JAR' });
  if (result && result.win) {
    randomWinEl.hidden = false;
    randomWinTextEl.textContent = result.win.text;
    randomWinDateEl.textContent = result.win.date + ' at ' + result.win.time;
  } else if (result && result.error) {
    randomWinEl.hidden = false;
    randomWinTextEl.textContent = result.error;
    randomWinDateEl.textContent = '';
  }
});

// ── Refresh all data ────────────────────────
async function refreshData() {
  const data = await sendBg({ type: 'GET_STATS' });
  if (data) updateStats(data);
}

// ── Listen for storage changes ──────────────
chrome.storage.onChanged.addListener(() => refreshData());

// ── Init ────────────────────────────────────
refreshData();
