'use strict';

LoveSparkTheme.init();

const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const streakFlowerEl = document.getElementById('streakFlower');
const streakTextEl = document.getElementById('streakText');
const weekGardenEl = document.getElementById('weekGarden');
const noteSectionEl = document.getElementById('noteSection');
const noteInputEl = document.getElementById('noteInput');
const saveBtnEl = document.getElementById('saveBtn');
const checkinConfirmEl = document.getElementById('checkinConfirm');
const confirmEmojiEl = document.getElementById('confirmEmoji');
const confirmTextEl = document.getElementById('confirmText');
const footerMount = document.getElementById('footerMount');

let prevToday = 0;
let prevTotal = 0;
let selectedMood = null;

if (typeof LoveSparkFooter !== 'undefined') {
  LoveSparkFooter.render(footerMount);
}

// ── Safe message to background ──────────────
async function sendBg(msg) {
  try {
    return await chrome.runtime.sendMessage(msg);
  } catch (err) {
    console.warn('[LoveSpark Mood Bloom] sendBg error:', err.message);
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

// ── Render week garden ──────────────────────
function renderGarden(garden) {
  weekGardenEl.textContent = '';
  for (const day of garden) {
    const dayEl = el('div', {
      className: 'garden-day' + (day.isToday ? ' today' : ''),
      role: 'listitem',
      'aria-label': day.day + ': ' + day.mood
    }, [
      el('div', { className: 'garden-flower', 'aria-hidden': 'true', textContent: day.flower }),
      el('div', { className: 'garden-day-label', textContent: day.day })
    ]);
    weekGardenEl.appendChild(dayEl);
  }
}

// ── Update stats ────────────────────────────
function updateStats(data) {
  const today = data.checkinsToday || 0;
  const total = data.checkinsTotal || 0;

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  prevToday = today;
  prevTotal = total;

  // Streak
  const streak = data.streak || 0;
  if (data.streakFlower) {
    streakFlowerEl.textContent = data.streakFlower.emoji;
  }
  streakTextEl.textContent = streak + ' day streak';

  // Garden
  if (data.garden) {
    renderGarden(data.garden);
  }

  // Show today's mood if already checked in
  if (data.todayMood) {
    showConfirmation(data.todayMood);
  }
}

// ── Show check-in confirmation ──────────────
function showConfirmation(entry) {
  checkinConfirmEl.hidden = false;
  confirmEmojiEl.textContent = entry.emoji;
  confirmTextEl.textContent = 'Feeling ' + entry.label.toLowerCase() +
    (entry.note ? ' — ' + entry.note : '') +
    ' (' + entry.time + ')';
}

// ── Mood button handlers ────────────────────
document.querySelectorAll('.mood-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    selectedMood = btn.dataset.mood;

    // Update selection visuals
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');

    // Bloom animation
    const emoji = btn.querySelector('.mood-emoji');
    if (emoji) {
      emoji.classList.remove('blooming');
      void emoji.offsetWidth;
      emoji.classList.add('blooming');
    }

    // Show note input
    noteSectionEl.hidden = false;
    noteInputEl.focus();
  });

  // Keyboard support
  btn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      btn.click();
    }
  });
});

// ── Save mood ───────────────────────────────
async function saveMood() {
  if (!selectedMood) return;
  const note = noteInputEl.value.trim();
  const result = await sendBg({ type: 'LOG_MOOD', mood: selectedMood, note });
  if (result && result.ok) {
    noteSectionEl.hidden = true;
    noteInputEl.value = '';
    showConfirmation(result.entry);

    // Update streak display
    if (result.streakFlower) {
      streakFlowerEl.textContent = result.streakFlower.emoji;
      streakFlowerEl.classList.remove('blooming');
      void streakFlowerEl.offsetWidth;
      streakFlowerEl.classList.add('blooming');
    }
    streakTextEl.textContent = result.streak + ' day streak';

    // Reset selection
    document.querySelectorAll('.mood-btn').forEach(b => b.classList.remove('selected'));
    selectedMood = null;

    // Refresh stats
    await refreshData();
  }
}

saveBtnEl.addEventListener('click', saveMood);
noteInputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') saveMood();
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
