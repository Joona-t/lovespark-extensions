'use strict';

LoveSparkTheme.init();

const CUTE_MSGS = [
  'Pick those colors!', 'Every color tells a story!', 'Stay sparkly!', 'Design with love!'
];

const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const toggleEl = document.getElementById('enableToggle');
const statusIcon = document.getElementById('statusIcon');
const statusText = document.getElementById('statusText');
const cuteMsg = document.getElementById('cuteMsg');
const pickBtn = document.getElementById('pickBtn');
const colorResult = document.getElementById('colorResult');
const colorPreview = document.getElementById('colorPreview');
const hexValue = document.getElementById('hexValue');
const rgbValue = document.getElementById('rgbValue');
const hslValue = document.getElementById('hslValue');
const copyHex = document.getElementById('copyHex');
const copyRgb = document.getElementById('copyRgb');
const copyHsl = document.getElementById('copyHsl');
const copyFeedback = document.getElementById('copyFeedback');
const historyGrid = document.getElementById('historyGrid');
const clearHistoryBtn = document.getElementById('clearHistoryBtn');

let prevToday = 0;
let prevTotal = 0;

function updateStats(data) {
  var enabled = data.isEnabled !== false;
  var today = data.picksToday || 0;
  var total = data.picksTotal || 0;

  toggleEl.checked = enabled;
  statusIcon.classList.toggle('paused', !enabled);

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  prevToday = today;
  prevTotal = total;
}

function showCopyFeedback(text) {
  copyFeedback.textContent = text;
  setTimeout(function() { copyFeedback.textContent = ''; }, 1500);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(function() {
    showCopyFeedback('Copied: ' + text);
  });
}

function showColorResult(entry) {
  colorResult.style.display = 'block';
  colorPreview.style.backgroundColor = entry.hex;
  hexValue.textContent = entry.hex;
  rgbValue.textContent = entry.rgb;
  hslValue.textContent = entry.hsl;
  statusText.textContent = 'Color picked!';
}

function renderHistory(history) {
  while (historyGrid.firstChild) {
    historyGrid.removeChild(historyGrid.firstChild);
  }

  if (!history || history.length === 0) {
    var emptyEl = document.createElement('span');
    emptyEl.className = 'history-empty';
    emptyEl.textContent = 'No colors yet';
    historyGrid.appendChild(emptyEl);
    return;
  }

  history.forEach(function(entry) {
    var swatch = document.createElement('button');
    swatch.className = 'history-swatch';
    swatch.style.backgroundColor = entry.hex;
    swatch.setAttribute('aria-label', 'Color ' + entry.hex + ', click to copy');
    swatch.setAttribute('title', entry.hex);
    swatch.addEventListener('click', function() {
      showColorResult(entry);
      copyToClipboard(entry.hex);
    });
    historyGrid.appendChild(swatch);
  });
}

pickBtn.addEventListener('click', function() {
  statusText.textContent = 'Picking...';
  chrome.runtime.sendMessage({ type: 'PICK_COLOR' }).then(function(result) {
    if (!result || result.error) {
      statusText.textContent = (result && result.error) || 'Pick failed';
      return;
    }
    showColorResult(result);
    chrome.runtime.sendMessage({ type: 'GET_HISTORY' }).then(function(r) {
      renderHistory(r.history);
    });
  });
});

copyHex.addEventListener('click', function() {
  if (hexValue.textContent !== '--') copyToClipboard(hexValue.textContent);
});

copyRgb.addEventListener('click', function() {
  if (rgbValue.textContent !== '--') copyToClipboard(rgbValue.textContent);
});

copyHsl.addEventListener('click', function() {
  if (hslValue.textContent !== '--') copyToClipboard(hslValue.textContent);
});

clearHistoryBtn.addEventListener('click', function() {
  chrome.runtime.sendMessage({ type: 'CLEAR_HISTORY' }).then(function() {
    renderHistory([]);
    colorResult.style.display = 'none';
    showCopyFeedback('History cleared');
  });
});

toggleEl.addEventListener('change', function() {
  chrome.runtime.sendMessage({ type: 'SET_ENABLED', enabled: toggleEl.checked });
});

chrome.storage.onChanged.addListener(function() {
  chrome.runtime.sendMessage({ type: 'GET_STATS' }).then(updateStats);
});

LoveSparkPopup.rotateMessages(cuteMsg, CUTE_MSGS);
chrome.runtime.sendMessage({ type: 'GET_STATS' }).then(updateStats);
chrome.runtime.sendMessage({ type: 'GET_HISTORY' }).then(function(r) {
  renderHistory(r.history);
});

/* ── Author / Ko-fi Footer ── */
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
