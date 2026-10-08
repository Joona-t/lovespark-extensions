'use strict';

LoveSparkTheme.init();

var CUTE_MSGS = [
  'Back to the top!', 'Smooth scrolling!', 'Stay sparkly!', 'Up, up, and away!'
];

var todayEl = document.getElementById('todayCount');
var totalEl = document.getElementById('totalCount');
var toggleEl = document.getElementById('enableToggle');
var statusIcon = document.getElementById('statusIcon');
var statusText = document.getElementById('statusText');
var cuteMsg = document.getElementById('cuteMsg');
var thresholdSlider = document.getElementById('thresholdSlider');
var thresholdInput = document.getElementById('thresholdInput');
var settingStatus = document.getElementById('settingStatus');

var prevToday = 0;
var prevTotal = 0;
var saveTimer = null;

function updateStats(data) {
  var enabled = data.isEnabled !== false;
  var today = data.scrollsToday || 0;
  var total = data.scrollsTotal || 0;
  var threshold = data.threshold || 300;

  toggleEl.checked = enabled;
  statusIcon.classList.toggle('paused', !enabled);
  statusText.textContent = enabled ? 'Active' : 'Paused';

  thresholdSlider.value = threshold;
  thresholdInput.value = threshold;

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  prevToday = today;
  prevTotal = total;
}

function showSettingStatus(text) {
  settingStatus.textContent = text;
  setTimeout(function() { settingStatus.textContent = ''; }, 1500);
}

function saveThreshold(val) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(function() {
    chrome.runtime.sendMessage({ type: 'SET_THRESHOLD', threshold: val }).then(function(result) {
      if (result && result.ok) {
        showSettingStatus('Threshold: ' + result.threshold + 'px');
      }
    });
  }, 400);
}

thresholdSlider.addEventListener('input', function() {
  thresholdInput.value = thresholdSlider.value;
  saveThreshold(thresholdSlider.value);
});

thresholdInput.addEventListener('change', function() {
  var val = Math.max(100, Math.min(2000, parseInt(thresholdInput.value, 10) || 300));
  thresholdInput.value = val;
  thresholdSlider.value = val;
  saveThreshold(val);
});

toggleEl.addEventListener('change', function() {
  chrome.runtime.sendMessage({ type: 'SET_ENABLED', enabled: toggleEl.checked });
});

chrome.storage.onChanged.addListener(function() {
  chrome.runtime.sendMessage({ type: 'GET_STATS' }).then(updateStats);
});

LoveSparkPopup.rotateMessages(cuteMsg, CUTE_MSGS);
chrome.runtime.sendMessage({ type: 'GET_STATS' }).then(updateStats);

/* ── Author / Ko-fi Footer ── */
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
