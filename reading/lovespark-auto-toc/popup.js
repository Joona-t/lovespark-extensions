'use strict';

LoveSparkTheme.init();

const CUTE_MSGS = [
  'Navigate articles easily!', 'Never lose your place!', 'Stay sparkly!', 'Headings mapped!'
];

const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const toggleEl = document.getElementById('enableToggle');
const statusIcon = document.getElementById('statusIcon');
const statusText = document.getElementById('statusText');
const cuteMsg = document.getElementById('cuteMsg');
const positionSelect = document.getElementById('positionSelect');
const generateBtn = document.getElementById('generateBtn');
const headingInfo = document.getElementById('headingInfo');

let prevToday = 0;
let prevTotal = 0;

function updateUI(data) {
  const enabled = data.isEnabled !== false;
  const today = data.tocsGeneratedToday || 0;
  const total = data.tocsGeneratedTotal || 0;

  toggleEl.checked = enabled;
  statusIcon.classList.toggle('paused', !enabled);
  statusText.textContent = enabled ? 'Active' : 'Paused';
  generateBtn.disabled = !enabled;
  positionSelect.disabled = !enabled;

  if (data.tocPosition) {
    positionSelect.value = data.tocPosition;
  }

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  prevToday = today;
  prevTotal = total;
}

toggleEl.addEventListener('change', () => {
  chrome.runtime.sendMessage({ type: 'SET_ENABLED', enabled: toggleEl.checked });
});

positionSelect.addEventListener('change', () => {
  chrome.runtime.sendMessage({ type: 'SET_POSITION', position: positionSelect.value });
});

generateBtn.addEventListener('click', () => {
  headingInfo.textContent = 'Generating...';
  chrome.runtime.sendMessage({ type: 'GENERATE_TOC' }).then((result) => {
    if (result && result.headingCount > 0) {
      headingInfo.textContent = 'Found ' + result.headingCount + ' headings';
    } else if (result && result.headingCount === 0) {
      headingInfo.textContent = 'No headings found on this page';
    } else {
      headingInfo.textContent = 'Could not generate TOC';
    }
  });
});

chrome.storage.onChanged.addListener(() => {
  chrome.runtime.sendMessage({ type: 'GET_STATS' }).then(updateUI);
});

LoveSparkPopup.rotateMessages(cuteMsg, CUTE_MSGS);
chrome.runtime.sendMessage({ type: 'GET_STATS' }).then(updateUI);

/* ── Author / Ko-fi Footer ── */
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
