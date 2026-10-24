'use strict';

LoveSparkTheme.init();

const gardenGrid = document.getElementById('gardenGrid');
const emptyState = document.getElementById('emptyState');
const habitInput = document.getElementById('habitInput');
const addBtn = document.getElementById('addBtn');
const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const footerMount = document.getElementById('footerMount');

let prevToday = 0;
let prevTotal = 0;
let habits = [];

if (typeof LoveSparkFooter !== 'undefined') {
  footerMount.innerHTML = LoveSparkFooter.render();
}

// ── Safe message to background ──────────────
async function sendBg(msg) {
  try {
    return await chrome.runtime.sendMessage(msg);
  } catch (err) {
    console.warn('[LoveSpark Habit Garden] sendBg error:', err.message);
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

// ── Render garden ───────────────────────────
function renderGarden() {
  gardenGrid.textContent = '';

  if (habits.length === 0) {
    emptyState.hidden = false;
    gardenGrid.hidden = true;
    return;
  }

  emptyState.hidden = true;
  gardenGrid.hidden = false;

  for (const habit of habits) {
    const card = el('div', {
      className: 'habit-card' + (habit.completedToday ? ' completed' : ''),
      role: 'listitem',
      tabindex: '0',
      'aria-label': habit.name + ' — ' + habit.plant.label + ', ' + habit.streak + ' day streak' + (habit.completedToday ? ', completed' : ''),
      onClick: () => toggleHabit(habit.id, habit.completedToday)
    }, [
      el('button', {
        className: 'card-delete',
        'aria-label': 'Delete ' + habit.name,
        onClick: (e) => { e.stopPropagation(); deleteHabit(habit.id, habit.name); }
      }, ['\u00D7']),
      el('div', { className: 'card-check', 'aria-hidden': 'true' }, ['\u2713']),
      el('div', { className: 'card-plant', 'aria-hidden': 'true' }, [habit.plant.emoji]),
      el('div', { className: 'card-name', title: habit.name }, [habit.name]),
      el('div', { className: 'card-streak' }, [
        habit.streak > 0 ? habit.streak + ' day streak' : 'No streak yet'
      ]),
      el('div', { className: 'card-stage' }, [habit.plant.label])
    ]);

    // Keyboard support for cards
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleHabit(habit.id, habit.completedToday);
      }
    });

    gardenGrid.appendChild(card);
  }
}

// ── Toggle habit completion ─────────────────
async function toggleHabit(id, isCompleted) {
  if (isCompleted) {
    await sendBg({ type: 'UNCOMPLETE_HABIT', id });
  } else {
    await sendBg({ type: 'COMPLETE_HABIT', id });
  }
  await refreshData();
}

// ── Delete habit ────────────────────────────
async function deleteHabit(id, name) {
  // Simple confirmation via the card flashing red would be ideal,
  // but for V1, just delete directly (habits are local, recoverable by re-adding)
  await sendBg({ type: 'DELETE_HABIT', id });
  await refreshData();
}

// ── Add habit ───────────────────────────────
async function addHabit() {
  const name = habitInput.value.trim();
  if (!name) return;
  const result = await sendBg({ type: 'ADD_HABIT', name });
  if (result && result.error) {
    habitInput.setCustomValidity(result.error);
    habitInput.reportValidity();
    return;
  }
  habitInput.value = '';
  habitInput.setCustomValidity('');
  await refreshData();
}

addBtn.addEventListener('click', addHabit);
habitInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addHabit();
});

// ── Update stats ────────────────────────────
function updateStats(data) {
  const today = data.completionsToday || 0;
  const total = data.completionsTotal || 0;

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  prevToday = today;
  prevTotal = total;
}

// ── Refresh all data ────────────────────────
async function refreshData() {
  const data = await sendBg({ type: 'GET_STATS' });
  if (!data) return;
  habits = data.habits || [];
  renderGarden();
  updateStats(data);
}

// ── Listen for storage changes ──────────────
chrome.storage.onChanged.addListener(() => refreshData());

// ── Init ────────────────────────────────────
refreshData();
