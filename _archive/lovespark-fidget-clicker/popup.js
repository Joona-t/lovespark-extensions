'use strict';

LoveSparkTheme.init();

var CUTE_MSGS = [
  'Click away, bestie!',
  'Fidget is focus!',
  'Keep those hands busy!',
  'Sparky loves clicks!'
];

var todayEl = document.getElementById('todayCount');
var totalEl = document.getElementById('totalCount');
var cuteMsg = document.getElementById('cuteMsg');
var sessionCountEl = document.getElementById('sessionCount');
var clickBtn = document.getElementById('clickBtn');
var clickRipple = document.getElementById('clickRipple');
var resetBtn = document.getElementById('resetBtn');
var modeButtons = document.querySelectorAll('.mode-btn');

var prevToday = 0;
var prevTotal = 0;
var sessionClicks = 0;
var currentMode = 'single';
var holdInterval = null;
var lastClickTime = 0;

/* -- Mode switching -- */
modeButtons.forEach(function(btn) {
  btn.addEventListener('click', function() {
    modeButtons.forEach(function(b) {
      b.classList.remove('active');
      b.setAttribute('aria-checked', 'false');
    });
    btn.classList.add('active');
    btn.setAttribute('aria-checked', 'true');
    currentMode = btn.getAttribute('data-mode');
  });
});

/* -- Click logic -- */
function doClick(amount) {
  sessionClicks += amount;
  sessionCountEl.textContent = sessionClicks.toLocaleString();

  /* Bump animation */
  sessionCountEl.classList.remove('bump');
  void sessionCountEl.offsetWidth;
  sessionCountEl.classList.add('bump');
  setTimeout(function() { sessionCountEl.classList.remove('bump'); }, 150);

  /* Ripple */
  clickRipple.classList.remove('active');
  void clickRipple.offsetWidth;
  clickRipple.classList.add('active');

  /* Float number */
  var floatEl = document.createElement('div');
  floatEl.className = 'float-num';
  floatEl.textContent = '+' + amount;
  floatEl.style.left = (Math.random() * 60 + 20) + '%';
  floatEl.style.top = '30%';
  clickBtn.parentNode.appendChild(floatEl);
  floatEl.addEventListener('animationend', function() {
    if (floatEl.parentNode) floatEl.parentNode.removeChild(floatEl);
  });

  chrome.runtime.sendMessage({ type: 'CLICK', count: amount });
}

/* Single click */
clickBtn.addEventListener('click', function() {
  if (currentMode === 'single') {
    doClick(1);
  } else if (currentMode === 'double') {
    var now = Date.now();
    if (now - lastClickTime < 400) {
      doClick(2);
      lastClickTime = 0;
    } else {
      lastClickTime = now;
    }
  }
});

/* Hold mode */
clickBtn.addEventListener('mousedown', function() {
  if (currentMode !== 'hold') return;
  doClick(1);
  holdInterval = setInterval(function() {
    doClick(1);
  }, 100);
});

clickBtn.addEventListener('mouseup', function() {
  if (holdInterval) { clearInterval(holdInterval); holdInterval = null; }
});

clickBtn.addEventListener('mouseleave', function() {
  if (holdInterval) { clearInterval(holdInterval); holdInterval = null; }
});

/* Reset session */
resetBtn.addEventListener('click', function() {
  sessionClicks = 0;
  sessionCountEl.textContent = '0';
});

/* -- Stats -- */
function updateUI(data) {
  var today = data.fidgetClickerToday || 0;
  var total = data.fidgetClickerTotal || 0;

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  prevToday = today;
  prevTotal = total;
}

chrome.storage.onChanged.addListener(function() {
  chrome.runtime.sendMessage({ type: 'GET_STATS' }).then(updateUI);
});

LoveSparkPopup.rotateMessages(cuteMsg, CUTE_MSGS);
chrome.runtime.sendMessage({ type: 'GET_STATS' }).then(updateUI);
