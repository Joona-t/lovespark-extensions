'use strict';

// Theme init — shared lib looks for #themeToggle and #themeMenu
LoveSparkTheme.init();

// Wire aria-expanded on theme dropdown (KI-013)
const themeToggle = document.getElementById('themeToggle');
const themeMenu = document.getElementById('themeMenu');
if (themeToggle && themeMenu) {
  const observer = new MutationObserver(() => {
    const isOpen = themeMenu.classList.contains('open');
    themeToggle.setAttribute('aria-expanded', String(isOpen));
  });
  observer.observe(themeMenu, { attributes: true, attributeFilter: ['class'] });
}

// Elements
const taskInputSection = document.getElementById('taskInputSection');
const taskDisplaySection = document.getElementById('taskDisplaySection');
const taskTextInput = document.getElementById('taskText');
const pinBtn = document.getElementById('pinTask');
const currentTaskText = document.getElementById('currentTaskText');
const doneBtn = document.getElementById('doneTask');
const clearBtn = document.getElementById('clearTask');
const toggleEl = document.getElementById('enableToggle');
const statusText = document.getElementById('statusText');
const cuteMsg = document.getElementById('cuteMsg');
const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const completedEl = document.getElementById('completedCount');

let prevToday = 0;
let prevTotal = 0;
let prevCompleted = 0;

const CUTE_MSGS = [
  'Stay focused!', 'You got this!', 'Deep work energy!',
  'One thing at a time!', 'Stay on track, bestie!'
];

function safeSendMessage(msg) {
  try {
    return chrome.runtime.sendMessage(msg).catch(err => {
      console.warn('[LoveSpark Task Anchor] msg:', err);
      return {};
    });
  } catch (err) {
    console.warn('[LoveSpark Task Anchor] msg:', err);
    return Promise.resolve({});
  }
}

function updateUI(data) {
  const enabled = data.isEnabled !== false;
  const hasTask = Boolean(data.currentTask);
  const today = data.taskanchorToday || 0;
  const total = data.taskanchorTotal || 0;
  const completed = data.tasksCompleted || 0;

  // Toggle
  toggleEl.checked = enabled;
  statusText.textContent = enabled ? 'Active' : 'Paused';

  // Task sections
  taskInputSection.style.display = hasTask ? 'none' : '';
  taskDisplaySection.style.display = hasTask ? '' : 'none';
  if (hasTask) {
    currentTaskText.textContent = data.currentTask;
  }

  // Stats
  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  LoveSparkPopup.animateCount(completedEl, prevCompleted, completed);

  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);
  if (completed > prevCompleted && prevCompleted > 0) LoveSparkPopup.pop(completedEl);

  prevToday = today;
  prevTotal = total;
  prevCompleted = completed;
}

// Pin task
pinBtn.addEventListener('click', () => {
  const task = taskTextInput.value.trim();
  if (!task) {
    taskTextInput.focus();
    return;
  }
  safeSendMessage({ type: 'SET_TASK', task });
  taskTextInput.value = '';
});

// Pin on Enter
taskTextInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    pinBtn.click();
  }
});

// Done task
doneBtn.addEventListener('click', () => {
  safeSendMessage({ type: 'COMPLETE_TASK' });
});

// Clear task
clearBtn.addEventListener('click', () => {
  safeSendMessage({ type: 'CLEAR_TASK' });
});

// Toggle
toggleEl.addEventListener('change', () => {
  safeSendMessage({ type: 'SET_ENABLED', enabled: toggleEl.checked });
});

// Listen for storage changes
chrome.storage.onChanged.addListener(() => {
  safeSendMessage({ type: 'GET_STATS' }).then(updateUI);
});

// Rotating cute messages (no aria-live — cosmetic only, KI-018)
LoveSparkPopup.rotateMessages(cuteMsg, CUTE_MSGS);

// Initial load
safeSendMessage({ type: 'GET_STATS' }).then(updateUI);
