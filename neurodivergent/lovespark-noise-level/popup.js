'use strict';

LoveSparkTheme.init();

var CUTE_MSGS = [
  'How noisy is it right now?',
  'Track your environment!',
  'Find your focus zone!',
  'Sparky is listening!'
];

var DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

var todayEl = document.getElementById('todayCount');
var totalEl = document.getElementById('totalCount');
var cuteMsg = document.getElementById('cuteMsg');
var meterFill = document.getElementById('meterFill');
var weekChart = document.getElementById('weekChart');
var noiseButtons = document.querySelectorAll('.noise-btn');

var prevToday = 0;
var prevTotal = 0;

/* -- Noise rating buttons -- */
noiseButtons.forEach(function(btn) {
  btn.addEventListener('click', function() {
    var level = parseInt(btn.getAttribute('data-level'), 10);
    noiseButtons.forEach(function(b) {
      b.classList.remove('selected');
      b.setAttribute('aria-checked', 'false');
    });
    btn.classList.add('selected');
    btn.setAttribute('aria-checked', 'true');
    meterFill.style.width = (level * 20) + '%';
    chrome.runtime.sendMessage({ type: 'LOG_NOISE', level: level });
  });
});

/* -- Weekly chart -- */
function renderWeekChart(weekData) {
  while (weekChart.firstChild) {
    weekChart.removeChild(weekChart.firstChild);
  }

  var today = new Date().getDay();

  for (var i = 0; i < 7; i++) {
    var dayIdx = (today - 6 + i + 7) % 7;
    var avg = weekData[dayIdx] || 0;

    var col = document.createElement('div');
    col.className = 'day-col';

    var barWrap = document.createElement('div');
    barWrap.className = 'day-bar-wrap';

    var bar = document.createElement('div');
    bar.className = 'day-bar';
    if (avg > 0) {
      bar.style.height = (avg / 5 * 100) + '%';
    } else {
      bar.classList.add('empty');
    }
    barWrap.appendChild(bar);
    col.appendChild(barWrap);

    var label = document.createElement('div');
    label.className = 'day-label';
    label.textContent = DAY_NAMES[dayIdx];
    col.appendChild(label);

    weekChart.appendChild(col);
  }
}

/* -- UI update -- */
function updateUI(data) {
  var today = data.noiseLevelToday || 0;
  var total = data.noiseLevelTotal || 0;
  var lastLevel = data.lastNoiseLevel || 0;
  var weekData = data.noiseWeekData || {};

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  prevToday = today;
  prevTotal = total;

  if (lastLevel > 0) {
    meterFill.style.width = (lastLevel * 20) + '%';
    noiseButtons.forEach(function(btn) {
      var lvl = parseInt(btn.getAttribute('data-level'), 10);
      btn.classList.toggle('selected', lvl === lastLevel);
      btn.setAttribute('aria-checked', String(lvl === lastLevel));
    });
  }

  renderWeekChart(weekData);
}

chrome.storage.onChanged.addListener(function() {
  chrome.runtime.sendMessage({ type: 'GET_STATS' }).then(updateUI);
});

LoveSparkPopup.rotateMessages(cuteMsg, CUTE_MSGS);
chrome.runtime.sendMessage({ type: 'GET_STATS' }).then(updateUI);

/* ── Author / Ko-fi Footer ── */
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
