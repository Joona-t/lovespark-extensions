'use strict';

LoveSparkTheme.init();

const CUTE_MSGS = [
  'Your brain deserves good fuel',
  'Healthy dopamine hits only',
  'Pick one and go!',
  'Small stims, big impact',
  'You are taking care of yourself'
];

const DONE_MSGS = [
  'Nice one! Dopamine delivered.',
  'Your brain says thank you.',
  'Stim complete! You rock.',
  'That counts. Well done.',
  'Healthy hit registered!'
];

const stimListEl = document.getElementById('stimList');
const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const doneMsgEl = document.getElementById('doneMsg');
const cuteMsg = document.getElementById('cuteMsg');
const footerMount = document.getElementById('footerMount');

let prevToday = 0;
let prevTotal = 0;
let todayDone = [];

if (typeof LoveSparkFooter !== 'undefined') {
  LoveSparkFooter.render(footerMount);
}

// -- Safe message to background ----------------
async function sendBg(msg) {
  try {
    return await chrome.runtime.sendMessage(msg);
  } catch (err) {
    console.warn('[LoveSpark Dopamine Menu] sendBg error:', err.message);
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

// -- Render stim list --------------------------
function renderStims(stims) {
  stimListEl.textContent = '';
  for (var stim of stims) {
    var isDone = todayDone.indexOf(stim.id) !== -1;
    var btn = el('button', {
      className: 'stim-item' + (isDone ? ' done' : ''),
      role: 'listitem',
      'aria-label': stim.label + (isDone ? ' (completed today)' : ''),
      'data-stim-id': stim.id
    }, [
      el('span', { className: 'stim-icon', 'aria-hidden': 'true', textContent: stim.icon }),
      el('span', { className: 'stim-label', textContent: stim.label }),
      el('span', { className: 'stim-check', 'aria-hidden': 'true', textContent: isDone ? '\u2713' : '' })
    ]);
    btn.addEventListener('click', handleStimClick);
    stimListEl.appendChild(btn);
  }
}

// -- Handle stim click -------------------------
async function handleStimClick(e) {
  var btn = e.currentTarget;
  var stimId = btn.getAttribute('data-stim-id');
  var result = await sendBg({ type: 'COMPLETE_STIM', stimId: stimId });
  if (result && result.ok) {
    todayDone.push(stimId);
    btn.classList.add('done');
    var check = btn.querySelector('.stim-check');
    if (check) check.textContent = '\u2713';
    doneMsgEl.textContent = DONE_MSGS[Math.floor(Math.random() * DONE_MSGS.length)];
    doneMsgEl.hidden = false;
    setTimeout(function() { doneMsgEl.hidden = true; }, 2000);
    await refreshData();
  }
}

// -- Update UI ---------------------------------
function updateUI(data) {
  if (!data) return;
  var today = data.stimsToday || 0;
  var total = data.stimsTotal || 0;

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  prevToday = today;
  prevTotal = total;

  todayDone = data.todayDone || [];
  if (data.stims) renderStims(data.stims);
}

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
