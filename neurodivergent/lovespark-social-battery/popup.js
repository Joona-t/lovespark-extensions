'use strict';

LoveSparkTheme.init();

var CUTE_MSGS = [
  "How's your social energy?",
  "It's okay to recharge!",
  'Boundaries are self-care!',
  'Sparky believes in you!'
];

var todayEl = document.getElementById('todayCount');
var totalEl = document.getElementById('totalCount');
var cuteMsg = document.getElementById('cuteMsg');
var batteryFill = document.getElementById('batteryFill');
var batteryLabel = document.getElementById('batteryLabel');
var batteryStatus = document.getElementById('batteryStatus');

var prevToday = 0;
var prevTotal = 0;

var STATUS_MAP = [
  { max: 10, text: 'Completely drained', icon: 'low' },
  { max: 25, text: 'Very low energy', icon: 'low' },
  { max: 50, text: 'Running low', icon: 'medium' },
  { max: 75, text: 'Doing okay', icon: '' },
  { max: 90, text: 'Feeling social', icon: '' },
  { max: 100, text: 'Fully charged!', icon: '' }
];

function getStatus(level) {
  for (var i = 0; i < STATUS_MAP.length; i++) {
    if (level <= STATUS_MAP[i].max) return STATUS_MAP[i];
  }
  return STATUS_MAP[STATUS_MAP.length - 1];
}

function updateBattery(level) {
  level = Math.max(0, Math.min(100, level));
  batteryFill.style.height = level + '%';
  batteryFill.setAttribute('aria-valuenow', String(level));
  batteryLabel.textContent = level + '%';

  batteryFill.classList.remove('low', 'medium');
  var status = getStatus(level);
  if (status.icon) batteryFill.classList.add(status.icon);
  batteryStatus.textContent = status.text;
}

/* Adjust buttons */
document.querySelectorAll('.btn-adjust').forEach(function(btn) {
  btn.addEventListener('click', function() {
    var amount = parseInt(btn.getAttribute('data-amount'), 10);
    chrome.runtime.sendMessage({ type: 'ADJUST_BATTERY', amount: amount });
  });
});

function updateUI(data) {
  var today = data.socialBatteryToday || 0;
  var total = data.socialBatteryTotal || 0;
  var level = data.batteryLevel;
  if (level === undefined) level = 70;

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  prevToday = today;
  prevTotal = total;

  updateBattery(level);
}

chrome.storage.onChanged.addListener(function() {
  chrome.runtime.sendMessage({ type: 'GET_STATS' }).then(updateUI);
});

LoveSparkPopup.rotateMessages(cuteMsg, CUTE_MSGS);
chrome.runtime.sendMessage({ type: 'GET_STATS' }).then(updateUI);

/* ── Author / Ko-fi Footer ── */
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
