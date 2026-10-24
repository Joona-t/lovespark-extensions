'use strict';

LoveSparkTheme.init();

const stepsListEl = document.getElementById('stepsList');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const streakText = document.getElementById('streakText');
const completeMsg = document.getElementById('completeMsg');
const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const footerMount = document.getElementById('footerMount');

let steps = [];
let checkedIds = new Set();

if (typeof LoveSparkFooter !== 'undefined') {
  footerMount.innerHTML = LoveSparkFooter.render();
}

async function sendBg(msg) {
  try {
    return await chrome.runtime.sendMessage(msg);
  } catch (err) {
    console.warn('[LoveSpark Morning Routine] sendBg error:', err.message);
    return null;
  }
}

function updateProgress() {
  const total = steps.length;
  const done = checkedIds.size;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  progressBar.style.width = pct + '%';
  progressBar.setAttribute('aria-valuenow', pct);
  progressText.textContent = done + '/' + total;
  completeMsg.hidden = done < total;
}

function renderSteps() {
  stepsListEl.textContent = '';
  for (const step of steps) {
    const isChecked = checkedIds.has(step.id);
    const item = document.createElement('div');
    item.className = 'step-item' + (isChecked ? ' checked' : '');
    item.setAttribute('role', 'listitem');
    item.setAttribute('tabindex', '0');
    item.setAttribute('aria-label', step.text + (isChecked ? ' (done)' : ''));

    const check = document.createElement('span');
    check.className = 'step-check';
    check.setAttribute('aria-hidden', 'true');
    check.textContent = '\u2713';

    const emoji = document.createElement('span');
    emoji.className = 'step-emoji';
    emoji.setAttribute('aria-hidden', 'true');
    emoji.textContent = step.emoji;

    const text = document.createElement('span');
    text.className = 'step-text';
    text.textContent = step.text;

    item.appendChild(check);
    item.appendChild(emoji);
    item.appendChild(text);

    item.addEventListener('click', () => toggleStep(step.id, item));
    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggleStep(step.id, item); }
    });

    stepsListEl.appendChild(item);
  }
}

async function toggleStep(stepId, itemEl) {
  if (checkedIds.has(stepId)) {
    checkedIds.delete(stepId);
    itemEl.classList.remove('checked');
    await sendBg({ type: 'UNCHECK_STEP', stepId });
  } else {
    checkedIds.add(stepId);
    itemEl.classList.add('checked');
    await sendBg({ type: 'CHECK_STEP', stepId });
  }
  updateProgress();
}

function updateStats(data) {
  todayEl.textContent = data.routinesCompleted || 0;
  totalEl.textContent = data.routinesTotal || 0;
  streakText.textContent = (data.streak || 0) + ' day streak';

  steps = data.steps || [];
  checkedIds = new Set(data.todayChecked || []);
  renderSteps();
  updateProgress();
}

async function refreshData() {
  const data = await sendBg({ type: 'GET_STATS' });
  if (data) updateStats(data);
}

chrome.storage.onChanged.addListener(() => refreshData());
refreshData();
