'use strict';

LoveSparkTheme.init();

const step1El = document.getElementById('step1');
const step2El = document.getElementById('step2');
const step3El = document.getElementById('step3');
const taskInput = document.getElementById('taskInput');
const stepInput = document.getElementById('stepInput');
const step1Next = document.getElementById('step1Next');
const step2Next = document.getElementById('step2Next');
const goTask = document.getElementById('goTask');
const goStep = document.getElementById('goStep');
const encouragementEl = document.getElementById('encouragement');
const resetBtn = document.getElementById('resetBtn');
const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const footerMount = document.getElementById('footerMount');

if (typeof LoveSparkFooter !== 'undefined') {
  footerMount.innerHTML = LoveSparkFooter.render();
}

async function sendBg(msg) {
  try {
    return await chrome.runtime.sendMessage(msg);
  } catch (err) {
    console.warn('[LoveSpark Task Starter] sendBg error:', err.message);
    return null;
  }
}

function showStep(num) {
  step1El.hidden = num !== 1;
  step2El.hidden = num !== 2;
  step3El.hidden = num !== 3;
}

// Step 1 -> Step 2
step1Next.addEventListener('click', () => {
  if (!taskInput.value.trim()) return;
  showStep(2);
  stepInput.focus();
});
taskInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') step1Next.click();
});

// Step 2 -> Step 3 (Go!)
step2Next.addEventListener('click', async () => {
  if (!stepInput.value.trim()) return;
  goTask.textContent = 'Task: ' + taskInput.value.trim();
  goStep.textContent = stepInput.value.trim();

  const result = await sendBg({ type: 'LOG_START' });
  if (result && result.encouragement) {
    encouragementEl.textContent = result.encouragement;
  }
  showStep(3);
  await refreshStats();
});
stepInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') step2Next.click();
});

// Reset
resetBtn.addEventListener('click', () => {
  taskInput.value = '';
  stepInput.value = '';
  showStep(1);
  taskInput.focus();
});

async function refreshStats() {
  const data = await sendBg({ type: 'GET_STATS' });
  if (data) {
    todayEl.textContent = data.startsToday || 0;
    totalEl.textContent = data.startsTotal || 0;
  }
}

showStep(1);
refreshStats();
