'use strict';

LoveSparkTheme.init();

const CUTE_MSGS = [
  'Stay sparkly!', 'You got this!', 'Looking good, bestie!', 'Browse in peace!'
];

const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const toggleEl = document.getElementById('enableToggle');
const statusIcon = document.getElementById('statusIcon');
const statusText = document.getElementById('statusText');
const cuteMsg = document.getElementById('cuteMsg');

let prevToday = 0;
let prevTotal = 0;

function updateUI(data) {
  const enabled = data.isEnabled !== false;
  const today = data.reactiontimeToday || 0;
  const total = data.reactiontimeTotal || 0;

  toggleEl.checked = enabled;
  statusIcon.classList.toggle('paused', !enabled);
  statusText.textContent = enabled ? 'Active' : 'Paused';

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  prevToday = today;
  prevTotal = total;
}

toggleEl.addEventListener('change', () => {
  chrome.runtime.sendMessage({ type: 'SET_ENABLED', enabled: toggleEl.checked });
});

chrome.storage.onChanged.addListener(() => {
  chrome.runtime.sendMessage({ type: 'GET_STATS' }).then(updateUI);
});

LoveSparkPopup.rotateMessages(cuteMsg, CUTE_MSGS);
chrome.runtime.sendMessage({ type: 'GET_STATS' }).then(updateUI);
