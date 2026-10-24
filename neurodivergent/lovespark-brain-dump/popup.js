'use strict';

LoveSparkTheme.init();

const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const thoughtInputEl = document.getElementById('thoughtInput');
const addBtnEl = document.getElementById('addBtn');
const thoughtListEl = document.getElementById('thoughtList');
const emptyStateEl = document.getElementById('emptyState');
const clearBtnEl = document.getElementById('clearBtn');
const footerMount = document.getElementById('footerMount');

let prevToday = 0;
let prevTotal = 0;
let selectedTag = null;

if (typeof LoveSparkFooter !== 'undefined') {
  LoveSparkFooter.render(footerMount);
}

async function sendBg(msg) {
  try {
    return await chrome.runtime.sendMessage(msg);
  } catch (err) {
    console.warn('[LoveSpark Brain Dump] sendBg error:', err.message);
    return null;
  }
}

function el(tag, attrs, children) {
  const node = document.createElement(tag);
  if (attrs) {
    for (const [key, val] of Object.entries(attrs)) {
      if (key === 'textContent') node.textContent = val;
      else if (key === 'className') node.className = val;
      else if (key.startsWith('on')) node.addEventListener(key.slice(2).toLowerCase(), val);
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

// ── Tag buttons ─────────────────────────────
document.querySelectorAll('.tag-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const tag = btn.dataset.tag;
    if (selectedTag === tag) {
      selectedTag = null;
      btn.setAttribute('aria-pressed', 'false');
    } else {
      document.querySelectorAll('.tag-btn').forEach(b => b.setAttribute('aria-pressed', 'false'));
      selectedTag = tag;
      btn.setAttribute('aria-pressed', 'true');
    }
  });
});

// ── Render thoughts ─────────────────────────
function renderThoughts(thoughts) {
  thoughtListEl.textContent = '';
  if (!thoughts || thoughts.length === 0) {
    emptyStateEl.hidden = false;
    thoughtListEl.hidden = true;
    clearBtnEl.hidden = true;
    return;
  }
  emptyStateEl.hidden = true;
  thoughtListEl.hidden = false;
  clearBtnEl.hidden = false;

  // Show newest first
  const sorted = [...thoughts].reverse();
  for (const t of sorted) {
    const tagEmojis = { do: '\u26A1', think: '\u{1F4AD}', feel: '\u{1F496}' };
    const tagEmoji = t.tag ? tagEmojis[t.tag] || '' : '\u{1F4DD}';

    const item = el('div', { className: 'thought-item', role: 'listitem' }, [
      el('span', { className: 'thought-tag', 'aria-hidden': 'true', textContent: tagEmoji }),
      el('span', { className: 'thought-text', textContent: t.text }),
      el('span', { className: 'thought-time', textContent: t.time }),
      el('button', {
        className: 'thought-delete',
        'aria-label': 'Delete thought',
        onClick: () => deleteThought(t.id)
      }, ['\u00D7'])
    ]);
    thoughtListEl.appendChild(item);
  }
}

// ── Add thought ─────────────────────────────
async function addThought() {
  const text = thoughtInputEl.value.trim();
  if (!text) return;
  const result = await sendBg({ type: 'ADD_THOUGHT', text, tag: selectedTag });
  if (result && result.ok) {
    thoughtInputEl.value = '';
    thoughtInputEl.focus();
    await refreshData();
  }
}

addBtnEl.addEventListener('click', addThought);
thoughtInputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addThought();
});

// ── Delete thought ──────────────────────────
async function deleteThought(id) {
  await sendBg({ type: 'DELETE_THOUGHT', id });
  await refreshData();
}

// ── Clear today ─────────────────────────────
clearBtnEl.addEventListener('click', async () => {
  await sendBg({ type: 'CLEAR_TODAY' });
  await refreshData();
});

// ── Update stats ────────────────────────────
function updateStats(data) {
  const today = data.dumpsToday || 0;
  const total = data.dumpsTotal || 0;

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  prevToday = today;
  prevTotal = total;

  renderThoughts(data.thoughts);
}

async function refreshData() {
  const data = await sendBg({ type: 'GET_STATS' });
  if (data) updateStats(data);
}

chrome.storage.onChanged.addListener(() => refreshData());
refreshData();
