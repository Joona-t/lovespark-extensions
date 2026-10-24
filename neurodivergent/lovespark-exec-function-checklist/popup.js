'use strict';

LoveSparkTheme.init();

const checklistEl = document.getElementById('checklist');
const completeMsgEl = document.getElementById('completeMsg');
const resetBtn = document.getElementById('resetBtn');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const footerMount = document.getElementById('footerMount');

let prompts = [];
let checked = new Set();
let prevToday = 0;
let prevTotal = 0;

if (typeof LoveSparkFooter !== 'undefined') {
  LoveSparkFooter.render(footerMount);
}

async function sendBg(msg) {
  try {
    return await chrome.runtime.sendMessage(msg);
  } catch (err) {
    console.warn('[LoveSpark EF Checklist] sendBg error:', err.message);
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

function updateProgress() {
  const total = prompts.length;
  const done = checked.size;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  progressBar.style.width = pct + '%';
  progressBar.setAttribute('aria-valuenow', pct);
  progressText.textContent = done + '/' + total;

  if (done >= total && total > 0) {
    completeMsgEl.hidden = false;
    sendBg({ type: 'COMPLETE_CHECKLIST' });
    refreshStats();
  } else {
    completeMsgEl.hidden = true;
  }
}

function renderChecklist() {
  checklistEl.textContent = '';
  checked.clear();

  for (const prompt of prompts) {
    const item = el('div', {
      className: 'check-item',
      role: 'listitem',
      tabindex: '0',
      'aria-label': prompt.text
    }, [
      el('span', { className: 'check-box', 'aria-hidden': 'true', textContent: '\u2713' }),
      el('span', { className: 'check-emoji', 'aria-hidden': 'true', textContent: prompt.emoji }),
      el('span', { className: 'check-text', textContent: prompt.text })
    ]);

    item.addEventListener('click', () => {
      if (item.classList.contains('checked')) {
        item.classList.remove('checked');
        checked.delete(prompt.id);
      } else {
        item.classList.add('checked');
        checked.add(prompt.id);
      }
      updateProgress();
    });

    item.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        item.click();
      }
    });

    checklistEl.appendChild(item);
  }
  updateProgress();
}

resetBtn.addEventListener('click', () => {
  renderChecklist();
});

function updateStats(data) {
  const today = data.checklistsToday || 0;
  const total = data.checklistsTotal || 0;

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  prevToday = today;
  prevTotal = total;
}

async function refreshStats() {
  const data = await sendBg({ type: 'GET_STATS' });
  if (data) {
    updateStats(data);
    if (prompts.length === 0 && data.prompts) {
      prompts = data.prompts;
      renderChecklist();
    }
  }
}

chrome.storage.onChanged.addListener(() => refreshStats());
refreshStats();
