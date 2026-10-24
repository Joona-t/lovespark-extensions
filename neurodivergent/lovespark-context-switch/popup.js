'use strict';

LoveSparkTheme.init();

var CUTE_MSGS = [
  'Awareness is the first step',
  'No judgment, just data',
  'Track the pattern, own the pattern',
  'ADHD brains switch a lot. That is okay.',
  'Knowledge is power'
];

var FEEDBACK_MSGS = [
  'Logged! No judgment.',
  'Switch noted.',
  'Tracked. You are building awareness.',
  'Got it. Every data point helps.',
  'Noted. Patterns will emerge.'
];

var todayEl = document.getElementById('todayCount');
var totalEl = document.getElementById('totalCount');
var weeklyAvgEl = document.getElementById('weeklyAvg');
var switchBtn = document.getElementById('switchBtn');
var switchFeedback = document.getElementById('switchFeedback');
var recentSection = document.getElementById('recentSection');
var recentList = document.getElementById('recentList');
var cuteMsg = document.getElementById('cuteMsg');
var footerMount = document.getElementById('footerMount');

var prevToday = 0;
var prevTotal = 0;

if (typeof LoveSparkFooter !== 'undefined') {
  footerMount.innerHTML = LoveSparkFooter.render();
}

// -- Safe message to background ----------------
async function sendBg(msg) {
  try {
    return await chrome.runtime.sendMessage(msg);
  } catch (err) {
    console.warn('[LoveSpark Context Switch] sendBg error:', err.message);
    return null;
  }
}

// -- DOM helper (NO innerHTML) -----------------
function el(tag, attrs, children) {
  var node = document.createElement(tag);
  if (attrs) {
    for (var key of Object.keys(attrs)) {
      var val = attrs[key];
      if (key === 'textContent') node.textContent = val;
      else if (key === 'className') node.className = val;
      else node.setAttribute(key, val);
    }
  }
  if (children) {
    for (var child of children) {
      if (typeof child === 'string') node.appendChild(document.createTextNode(child));
      else if (child) node.appendChild(child);
    }
  }
  return node;
}

// -- Render recent switches --------------------
function renderRecent(switches) {
  recentList.textContent = '';
  if (!switches || switches.length === 0) {
    recentSection.hidden = true;
    return;
  }
  recentSection.hidden = false;
  for (var s of switches) {
    var item = el('div', { className: 'recent-item', role: 'listitem' }, [
      el('span', { className: 'recent-dot', 'aria-hidden': 'true' }),
      el('span', { textContent: 'Switched tasks' }),
      el('span', { className: 'recent-time', textContent: s.time })
    ]);
    recentList.appendChild(item);
  }
}

// -- Update UI ---------------------------------
function updateUI(data) {
  if (!data) return;
  var today = data.switchesToday || 0;
  var total = data.switchesTotal || 0;

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  prevToday = today;
  prevTotal = total;

  weeklyAvgEl.textContent = data.weeklyAvg > 0 ? String(data.weeklyAvg) : '--';
  renderRecent(data.recentSwitches);
}

// -- Switch button click -----------------------
switchBtn.addEventListener('click', async function() {
  var result = await sendBg({ type: 'LOG_SWITCH' });
  if (result && result.ok) {
    switchFeedback.textContent = FEEDBACK_MSGS[Math.floor(Math.random() * FEEDBACK_MSGS.length)];
    switchFeedback.hidden = false;
    setTimeout(function() { switchFeedback.hidden = true; }, 2000);
    await refreshData();
  }
});

// -- Refresh -----------------------------------
async function refreshData() {
  var data = await sendBg({ type: 'GET_STATS' });
  if (data) updateUI(data);
}

// -- Listen for storage changes ----------------
chrome.storage.onChanged.addListener(function() { refreshData(); });

// -- Init --------------------------------------
LoveSparkPopup.rotateMessages(cuteMsg, CUTE_MSGS);
refreshData();
