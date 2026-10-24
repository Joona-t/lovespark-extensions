'use strict';

LoveSparkTheme.init();

const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const streakFlowerEl = document.getElementById('streakFlower');
const streakTextEl = document.getElementById('streakText');
const promptTextEl = document.getElementById('promptText');
const entryInputEl = document.getElementById('entryInput');
const addBtnEl = document.getElementById('addBtn');
const inputSectionEl = document.getElementById('inputSection');
const todayListEl = document.getElementById('todayList');
const fullMsgEl = document.getElementById('fullMsg');
const slotDots = [
  document.getElementById('slotDot1'),
  document.getElementById('slotDot2'),
  document.getElementById('slotDot3')
];
const footerMount = document.getElementById('footerMount');

let prevToday = 0;
let prevTotal = 0;
const ENTRY_FLOWERS = ['\u{1F33C}', '\u{1F338}', '\u{1F33B}'];

if (typeof LoveSparkFooter !== 'undefined') {
  LoveSparkFooter.render(footerMount);
}

async function sendBg(msg) {
  try {
    return await chrome.runtime.sendMessage(msg);
  } catch (err) {
    console.warn('[LoveSpark Gratitude Journal] sendBg error:', err.message);
    return null;
  }
}

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

function renderEntries(entries) {
  todayListEl.textContent = '';
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const flower = ENTRY_FLOWERS[i] || '\u{1F33A}';
    const item = el('div', { className: 'entry-item', role: 'listitem' }, [
      el('span', { className: 'entry-flower', 'aria-hidden': 'true', textContent: flower }),
      el('span', { className: 'entry-text', textContent: e.text })
    ]);
    todayListEl.appendChild(item);
  }
}

function updateSlots(count) {
  for (let i = 0; i < 3; i++) {
    slotDots[i].classList.toggle('filled', i < count);
  }
}

function updateStats(data) {
  const today = data.entriesToday || 0;
  const total = data.entriesTotal || 0;

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  prevToday = today;
  prevTotal = total;

  // Streak
  if (data.flower) streakFlowerEl.textContent = data.flower.emoji;
  streakTextEl.textContent = (data.streak || 0) + ' day streak';

  // Prompt
  if (data.prompt) promptTextEl.textContent = data.prompt;

  // Today's entries
  const todayEntries = data.todayEntries || [];
  renderEntries(todayEntries);
  updateSlots(todayEntries.length);

  // Show/hide input vs full message
  if (todayEntries.length >= 3) {
    inputSectionEl.hidden = true;
    fullMsgEl.hidden = false;
  } else {
    inputSectionEl.hidden = false;
    fullMsgEl.hidden = true;
  }
}

async function addEntry() {
  const text = entryInputEl.value.trim();
  if (!text) return;
  const result = await sendBg({ type: 'ADD_ENTRY', text });
  if (result && result.ok) {
    entryInputEl.value = '';
    entryInputEl.focus();
    if (result.flower) {
      streakFlowerEl.textContent = result.flower.emoji;
    }
    streakTextEl.textContent = (result.streak || 0) + ' day streak';
    await refreshData();
  } else if (result && result.error) {
    entryInputEl.setCustomValidity(result.error);
    entryInputEl.reportValidity();
    setTimeout(() => entryInputEl.setCustomValidity(''), 2000);
  }
}

addBtnEl.addEventListener('click', addEntry);
entryInputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addEntry();
});

async function refreshData() {
  const data = await sendBg({ type: 'GET_STATS' });
  if (data) updateStats(data);
}

chrome.storage.onChanged.addListener(() => refreshData());
refreshData();
