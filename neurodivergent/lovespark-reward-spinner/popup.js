'use strict';

LoveSparkTheme.init();

var CUTE_MSGS = [
  'You earned this!',
  'Rewards make the brain go brrr',
  'Gamify your life!',
  'Spin to win!',
  'Every task deserves a treat'
];

var todayEl = document.getElementById('todayCount');
var totalEl = document.getElementById('totalCount');
var spinBtn = document.getElementById('spinBtn');
var spinnerDisplay = document.getElementById('spinnerDisplay');
var spinnerText = document.getElementById('spinnerText');
var resultSection = document.getElementById('resultSection');
var resultText = document.getElementById('resultText');
var rewardList = document.getElementById('rewardList');
var rewardCount = document.getElementById('rewardCount');
var rewardInput = document.getElementById('rewardInput');
var addBtn = document.getElementById('addBtn');
var cuteMsg = document.getElementById('cuteMsg');
var footerMount = document.getElementById('footerMount');

var prevToday = 0;
var prevTotal = 0;
var currentRewards = [];
var isSpinning = false;

if (typeof LoveSparkFooter !== 'undefined' && footerMount) {
  footerMount.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
}

// -- Safe message to background ----------------
async function sendBg(msg) {
  try {
    return await chrome.runtime.sendMessage(msg);
  } catch (err) {
    console.warn('[LoveSpark Reward Spinner] sendBg error:', err.message);
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

// -- Render reward list ------------------------
function renderRewards(rewards) {
  rewardList.textContent = '';
  currentRewards = rewards;
  rewardCount.textContent = rewards.length + '/20';

  for (var i = 0; i < rewards.length; i++) {
    var removeBtn = el('button', {
      className: 'reward-remove-btn',
      'aria-label': 'Remove reward: ' + rewards[i],
      'data-index': String(i),
      textContent: '\u00D7'
    });
    removeBtn.addEventListener('click', handleRemove);

    var item = el('div', { className: 'reward-item', role: 'listitem' }, [
      el('span', { className: 'reward-item-text', textContent: rewards[i], title: rewards[i] }),
      removeBtn
    ]);
    rewardList.appendChild(item);
  }
}

// -- Handle remove click -----------------------
async function handleRemove(e) {
  var idx = parseInt(e.currentTarget.getAttribute('data-index'), 10);
  var result = await sendBg({ type: 'REMOVE_REWARD', index: idx });
  if (result && result.ok) {
    renderRewards(result.rewards);
  }
}

// -- Spin animation ----------------------------
async function doSpin() {
  if (isSpinning) return;
  if (currentRewards.length === 0) {
    spinnerText.textContent = 'Add rewards first!';
    return;
  }

  isSpinning = true;
  spinBtn.disabled = true;
  resultSection.hidden = true;
  spinnerDisplay.classList.add('spinning');

  // Animate through random rewards quickly
  var ticks = 12 + Math.floor(Math.random() * 8);
  var delay = 80;
  for (var i = 0; i < ticks; i++) {
    spinnerText.textContent = currentRewards[Math.floor(Math.random() * currentRewards.length)];
    await new Promise(function(r) { setTimeout(r, delay); });
    delay += 15;
  }

  spinnerDisplay.classList.remove('spinning');

  // Get actual result from background
  var result = await sendBg({ type: 'SPIN' });
  if (result && result.ok) {
    spinnerText.textContent = result.reward;
    resultText.textContent = result.reward;
    resultSection.hidden = false;
    await refreshData();
  } else if (result && result.error) {
    spinnerText.textContent = result.error;
  }

  isSpinning = false;
  spinBtn.disabled = false;
}

// -- Add reward --------------------------------
async function addReward() {
  var text = rewardInput.value.trim();
  if (!text) return;
  var result = await sendBg({ type: 'ADD_REWARD', text: text });
  if (result && result.ok) {
    rewardInput.value = '';
    renderRewards(result.rewards);
  } else if (result && result.error) {
    rewardInput.value = '';
    spinnerText.textContent = result.error;
  }
}

// -- Update UI ---------------------------------
function updateUI(data) {
  if (!data) return;
  var today = data.spinsToday || 0;
  var total = data.spinsTotal || 0;

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  prevToday = today;
  prevTotal = total;

  if (data.rewards) renderRewards(data.rewards);
}

// -- Event listeners ---------------------------
spinBtn.addEventListener('click', doSpin);
addBtn.addEventListener('click', addReward);
rewardInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') addReward();
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
