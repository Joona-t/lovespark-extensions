'use strict';

LoveSparkTheme.init();

const CUTE_MSGS = [
  'Read faster, stay focused!', 'Your eyes will thank you!', 'Stay sparkly!', 'Speed reading mode!'
];

const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const toggleEl = document.getElementById('enableToggle');
const statusIcon = document.getElementById('statusIcon');
const statusText = document.getElementById('statusText');
const cuteMsg = document.getElementById('cuteMsg');
const ratioSlider = document.getElementById('ratioSlider');
const ratioValue = document.getElementById('ratioValue');
const activateBtn = document.getElementById('activateBtn');
const previewText = document.getElementById('previewText');

let prevToday = 0;
let prevTotal = 0;

const PREVIEW_WORDS = ['This', 'is', 'how', 'bionic', 'reading', 'works'];

function renderPreview(ratio) {
  // Clear preview using DOM API only
  while (previewText.firstChild) {
    previewText.removeChild(previewText.firstChild);
  }
  PREVIEW_WORDS.forEach((word, i) => {
    if (i > 0) {
      previewText.appendChild(document.createTextNode(' '));
    }
    const boldLen = Math.max(1, Math.ceil(word.length * ratio));
    const span = document.createElement('span');
    span.setAttribute('data-ls-bionic', '');
    const b = document.createElement('b');
    b.style.fontWeight = '700';
    b.textContent = word.slice(0, boldLen);
    span.appendChild(b);
    const rest = word.slice(boldLen);
    if (rest) {
      span.appendChild(document.createTextNode(rest));
    }
    previewText.appendChild(span);
  });
}

function updateUI(data) {
  const enabled = data.isEnabled !== false;
  const today = data.pagesStyledToday || 0;
  const total = data.pagesStyledTotal || 0;
  const ratio = data.boldRatio != null ? data.boldRatio : 0.5;

  toggleEl.checked = enabled;
  statusIcon.classList.toggle('paused', !enabled);
  statusText.textContent = enabled ? 'Active' : 'Paused';
  activateBtn.disabled = !enabled;

  ratioSlider.value = Math.round(ratio * 100);
  ratioValue.textContent = Math.round(ratio * 100) + '%';
  renderPreview(ratio);

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  prevToday = today;
  prevTotal = total;
}

toggleEl.addEventListener('change', () => {
  chrome.runtime.sendMessage({ type: 'SET_ENABLED', enabled: toggleEl.checked });
});

ratioSlider.addEventListener('input', () => {
  const pct = parseInt(ratioSlider.value, 10);
  const ratio = pct / 100;
  ratioValue.textContent = pct + '%';
  renderPreview(ratio);
  chrome.runtime.sendMessage({ type: 'SET_BOLD_RATIO', boldRatio: ratio });
});

activateBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ type: 'ACTIVATE_ON_PAGE' });
});

chrome.storage.onChanged.addListener(() => {
  chrome.runtime.sendMessage({ type: 'GET_STATS' }).then(updateUI);
});

LoveSparkPopup.rotateMessages(cuteMsg, CUTE_MSGS);
chrome.runtime.sendMessage({ type: 'GET_STATS' }).then(updateUI);

/* ── Author / Ko-fi Footer ── */
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
