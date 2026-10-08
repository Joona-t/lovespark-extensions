'use strict';

LoveSparkTheme.init();

const CUTE_MSGS = [
  'Track your lines!', 'Read smoothly!', 'Stay sparkly!', 'No line skipping!'
];

const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const toggleEl = document.getElementById('enableToggle');
const statusIcon = document.getElementById('statusIcon');
const statusText = document.getElementById('statusText');
const cuteMsg = document.getElementById('cuteMsg');
const heightSlider = document.getElementById('heightSlider');
const heightValue = document.getElementById('heightValue');
const opacitySlider = document.getElementById('opacitySlider');
const opacityValue = document.getElementById('opacityValue');
const colorPicker = document.getElementById('colorPicker');
const rulerPreview = document.getElementById('rulerPreview');
const activateBtn = document.getElementById('activateBtn');

let prevToday = 0;
let prevTotal = 0;

function updatePreview() {
  const h = parseInt(heightSlider.value, 10);
  const o = parseInt(opacitySlider.value, 10) / 100;
  const c = colorPicker.value;
  // Scale preview height proportionally (max 30px in preview)
  const previewH = Math.max(6, Math.round(h * 0.3));
  rulerPreview.style.height = previewH + 'px';
  rulerPreview.style.opacity = o;
  rulerPreview.style.background = c;
}

function updateUI(data) {
  const enabled = data.isEnabled !== false;
  const today = data.pagesRuledToday || 0;
  const total = data.pagesRuledTotal || 0;

  toggleEl.checked = enabled;
  statusIcon.classList.toggle('paused', !enabled);
  statusText.textContent = enabled ? 'Active' : 'Paused';
  activateBtn.disabled = !enabled;

  heightSlider.value = data.rulerHeight != null ? data.rulerHeight : 40;
  heightValue.textContent = heightSlider.value + 'px';

  const opacPct = Math.round((data.rulerOpacity != null ? data.rulerOpacity : 0.15) * 100);
  opacitySlider.value = opacPct;
  opacityValue.textContent = opacPct + '%';

  colorPicker.value = data.rulerColor || '#e8457c';

  updatePreview();

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  prevToday = today;
  prevTotal = total;
}

function sendPrefs() {
  chrome.runtime.sendMessage({
    type: 'SET_RULER_PREFS',
    rulerHeight: parseInt(heightSlider.value, 10),
    rulerOpacity: parseInt(opacitySlider.value, 10) / 100,
    rulerColor: colorPicker.value
  });
}

toggleEl.addEventListener('change', () => {
  chrome.runtime.sendMessage({ type: 'SET_ENABLED', enabled: toggleEl.checked });
});

heightSlider.addEventListener('input', () => {
  heightValue.textContent = heightSlider.value + 'px';
  updatePreview();
  sendPrefs();
});

opacitySlider.addEventListener('input', () => {
  opacityValue.textContent = opacitySlider.value + '%';
  updatePreview();
  sendPrefs();
});

colorPicker.addEventListener('input', () => {
  updatePreview();
  sendPrefs();
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
