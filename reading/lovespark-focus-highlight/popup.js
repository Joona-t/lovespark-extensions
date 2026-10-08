'use strict';

LoveSparkTheme.init();

const CUTE_MSGS = [
  'Spotlight your reading!', 'Focus mode on!', 'Read in peace!', 'Stay sparkly!'
];

const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const toggleEl = document.getElementById('enableToggle');
const statusIcon = document.getElementById('statusIcon');
const statusText = document.getElementById('statusText');
const cuteMsg = document.getElementById('cuteMsg');
const dimSlider = document.getElementById('dimSlider');
const dimValue = document.getElementById('dimValue');
const activateBtn = document.getElementById('activateBtn');

let prevToday = 0;
let prevTotal = 0;

function updateUI(data) {
  const enabled = data.isEnabled !== false;
  const today = data.pagesHighlightedToday || 0;
  const total = data.pagesHighlightedTotal || 0;
  const opacity = data.dimOpacity != null ? data.dimOpacity : 0.25;

  toggleEl.checked = enabled;
  statusIcon.classList.toggle('paused', !enabled);
  statusText.textContent = enabled ? 'Active' : 'Paused';
  activateBtn.disabled = !enabled;

  dimSlider.value = Math.round(opacity * 100);
  dimValue.textContent = Math.round(opacity * 100) + '%';

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  prevToday = today;
  prevTotal = total;
}

toggleEl.addEventListener('change', () => {
  chrome.runtime.sendMessage({ type: 'SET_ENABLED', enabled: toggleEl.checked });
});

dimSlider.addEventListener('input', () => {
  const pct = parseInt(dimSlider.value, 10);
  dimValue.textContent = pct + '%';
  chrome.runtime.sendMessage({ type: 'SET_DIM_OPACITY', dimOpacity: pct / 100 });
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
