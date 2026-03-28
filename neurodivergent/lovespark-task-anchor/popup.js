'use strict';

LoveSparkTheme.init();

const CUTE_MSGS = [
  'Stay on track!', 'You got this!', 'Focus mode: ON',
  'One thing at a time!', 'Almost there!', 'Keep going!'
];

const taskInput = document.getElementById('taskInput');
const taskClear = document.getElementById('taskClear');
const taskHint = document.getElementById('taskHint');
const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const toggleEl = document.getElementById('enableToggle');
const statusIcon = document.getElementById('statusIcon');
const statusText = document.getElementById('statusText');
const cuteMsg = document.getElementById('cuteMsg');
const positionSelect = document.getElementById('bannerPosition');
const autoHideSelect = document.getElementById('autoHide');

let prevToday = 0;
let prevTotal = 0;
let saveTimer = null;

function safeSend(msg) {
  return chrome.runtime.sendMessage(msg).catch((err) => {
    console.warn('[TaskAnchor] sendMessage:', err);
    return {};
  });
}

function updateUI(data) {
  if (!data) return;
  const enabled = data.isEnabled !== false;
  const today = data.taskanchorToday || 0;
  const total = data.taskanchorTotal || 0;

  toggleEl.checked = enabled;
  statusIcon.classList.toggle('paused', !enabled);
  statusText.textContent = enabled ? 'Active' : 'Paused';

  if (data.currentTask && !taskInput.matches(':focus')) {
    taskInput.value = data.currentTask;
  }

  if (data.bannerPosition) positionSelect.value = data.bannerPosition;
  if (data.autoHide !== undefined) autoHideSelect.value = String(data.autoHide);

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  prevToday = today;
  prevTotal = total;
}

function saveTask() {
  const task = taskInput.value.trim();
  safeSend({ type: 'SET_TASK', task });
  taskHint.textContent = task ? 'Saved!' : 'Task cleared';
  taskHint.classList.add('saved');
  setTimeout(() => {
    taskHint.textContent = 'Type your task and press Enter';
    taskHint.classList.remove('saved');
  }, 1500);
}

taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    saveTask();
  }
});

taskInput.addEventListener('input', () => {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(saveTask, 800);
});

taskClear.addEventListener('click', () => {
  taskInput.value = '';
  saveTask();
  taskInput.focus();
});

toggleEl.addEventListener('change', () => {
  safeSend({ type: 'SET_ENABLED', enabled: toggleEl.checked });
});

positionSelect.addEventListener('change', () => {
  safeSend({ type: 'SET_SETTING', key: 'bannerPosition', value: positionSelect.value });
});

autoHideSelect.addEventListener('change', () => {
  safeSend({ type: 'SET_SETTING', key: 'autoHide', value: Number(autoHideSelect.value) });
});

chrome.storage.onChanged.addListener(() => {
  safeSend({ type: 'GET_STATS' }).then(updateUI);
});

LoveSparkPopup.rotateMessages(cuteMsg, CUTE_MSGS);
safeSend({ type: 'GET_STATS' }).then(updateUI);

/* ── Author / Ko-fi Footer ── */
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
