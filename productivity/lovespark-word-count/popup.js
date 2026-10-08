'use strict';

LoveSparkTheme.init();

const CUTE_MSGS = [
  'Count those words!', 'Knowledge is power!', 'Stay sparkly!', 'Words are magic!'
];

const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const toggleEl = document.getElementById('enableToggle');
const statusIcon = document.getElementById('statusIcon');
const statusText = document.getElementById('statusText');
const cuteMsg = document.getElementById('cuteMsg');
const wordCountEl = document.getElementById('wordCount');
const charCountEl = document.getElementById('charCount');
const readTimeEl = document.getElementById('readTime');
const refreshBtn = document.getElementById('refreshBtn');

let prevToday = 0;
let prevTotal = 0;

function updateStats(data) {
  const enabled = data.isEnabled !== false;
  const today = data.countsToday || 0;
  const total = data.countsTotal || 0;

  toggleEl.checked = enabled;
  statusIcon.classList.toggle('paused', !enabled);

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  prevToday = today;
  prevTotal = total;
}

function fetchSelection() {
  chrome.runtime.sendMessage({ type: 'GET_SELECTION' }).then((result) => {
    if (!result) return;
    wordCountEl.textContent = (result.words || 0).toLocaleString();
    charCountEl.textContent = (result.chars || 0).toLocaleString();
    readTimeEl.textContent = result.readTime || '0 sec';

    if (result.words > 0) {
      statusText.textContent = 'Selection found';
      chrome.runtime.sendMessage({ type: 'COUNT_SELECTION' });
    } else if (result.error) {
      statusText.textContent = result.error;
    } else {
      statusText.textContent = 'No text selected';
    }
  });
}

toggleEl.addEventListener('change', () => {
  chrome.runtime.sendMessage({ type: 'SET_ENABLED', enabled: toggleEl.checked });
});

refreshBtn.addEventListener('click', fetchSelection);

chrome.storage.onChanged.addListener(() => {
  chrome.runtime.sendMessage({ type: 'GET_STATS' }).then(updateStats);
});

LoveSparkPopup.rotateMessages(cuteMsg, CUTE_MSGS);
chrome.runtime.sendMessage({ type: 'GET_STATS' }).then(updateStats);
fetchSelection();

/* ── Author / Ko-fi Footer ── */
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
