'use strict';

LoveSparkTheme.init();

var CUTE_MSGS = [
  'Your knowledge base grows with you.',
  'Every bubble makes you stronger.',
  'Study smart, not hard.',
  'Spaced repetition is your superpower.',
  'You\u2019re building something beautiful.',
  'One bubble at a time.',
];

var masterToggle = document.getElementById('master-toggle');
var bubbleCountEl = document.getElementById('bubble-count');
var dueCountEl = document.getElementById('due-count');
var reviewCountEl = document.getElementById('review-count');
var cuteMsgEl = document.getElementById('cute-msg');

var studyFront = document.getElementById('study-front');
var studyBack = document.getElementById('study-back');
var studySource = document.getElementById('study-source');
var studyActions = document.getElementById('study-actions');
var revealBtn = document.getElementById('reveal-btn');
var ratingRow = document.getElementById('rating-row');

var bubbleListEl = document.getElementById('bubble-list');
var addFrontEl = document.getElementById('add-front');
var addBackEl = document.getElementById('add-back');
var addBubbleBtn = document.getElementById('add-bubble-btn');

var allBubbles = [];
var dueBubbles = [];
var currentStudyIdx = 0;

// ── Tabs ────────────────────────────────────────────────────────────────────
var tabBtns = document.querySelectorAll('.tab-btn');
var tabPanels = document.querySelectorAll('.tab-panel');

tabBtns.forEach(function(btn) {
  btn.addEventListener('click', function() {
    var tab = btn.dataset.tab;
    tabBtns.forEach(function(b) { b.classList.remove('active'); b.setAttribute('aria-selected', 'false'); });
    tabPanels.forEach(function(p) { p.classList.remove('active'); });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    document.querySelector('[data-panel="' + tab + '"]').classList.add('active');
  });
});

// ── Init ────────────────────────────────────────────────────────────────────
async function init() {
  var data = await chrome.storage.local.get(['bubbles', 'enabled', 'totalBubbles', 'totalReviews']);
  masterToggle.checked = data.enabled !== false;
  allBubbles = data.bubbles || [];
  reviewCountEl.textContent = data.totalReviews || 0;

  updateStats();
  loadStudyCard();
  renderBubbleList();
  rotateMsgs();
}

function updateStats() {
  bubbleCountEl.textContent = allBubbles.length;
  var now = Date.now();
  dueBubbles = allBubbles.filter(function(b) { return b.nextReview <= now; });
  dueCountEl.textContent = dueBubbles.length;
}

// ── Study ───────────────────────────────────────────────────────────────────
function loadStudyCard() {
  if (dueBubbles.length === 0) {
    studyFront.textContent = allBubbles.length === 0 ? 'No bubbles yet! Highlight text on any page to create one.' : 'All caught up! No bubbles due.';
    studyBack.classList.add('hidden');
    studySource.classList.add('hidden');
    studyActions.classList.add('hidden');
    return;
  }

  currentStudyIdx = 0;
  showCard(dueBubbles[0]);
}

function showCard(bubble) {
  studyFront.textContent = bubble.front;
  studyBack.textContent = bubble.back || '(no back defined \u2014 click All Bubbles to edit)';
  studySource.textContent = bubble.domain ? 'From: ' + bubble.domain : '';
  studyBack.classList.add('hidden');
  studySource.classList.add('hidden');
  studyActions.classList.remove('hidden');
  revealBtn.classList.remove('hidden');
  ratingRow.classList.add('hidden');
}

revealBtn.addEventListener('click', function() {
  studyBack.classList.remove('hidden');
  studySource.classList.remove('hidden');
  revealBtn.classList.add('hidden');
  ratingRow.classList.remove('hidden');
});

document.querySelectorAll('.btn-rate').forEach(function(btn) {
  btn.addEventListener('click', async function() {
    var quality = parseInt(btn.dataset.quality, 10);
    var bubble = dueBubbles[currentStudyIdx];
    await chrome.runtime.sendMessage({ type: 'REVIEW_BUBBLE', id: bubble.id, quality: quality });

    currentStudyIdx++;
    if (currentStudyIdx < dueBubbles.length) {
      showCard(dueBubbles[currentStudyIdx]);
    } else {
      studyFront.textContent = 'Session complete! Great work.';
      studyBack.classList.add('hidden');
      studySource.classList.add('hidden');
      studyActions.classList.add('hidden');
    }

    var d = await chrome.storage.local.get('totalReviews');
    reviewCountEl.textContent = d.totalReviews || 0;
    dueCountEl.textContent = Math.max(0, dueBubbles.length - currentStudyIdx - 1);
  });
});

// ── Bubble List ─────────────────────────────────────────────────────────────
function renderBubbleList() {
  bubbleListEl.textContent = '';
  if (allBubbles.length === 0) {
    var empty = document.createElement('p');
    empty.className = 'empty-msg';
    empty.textContent = 'No bubbles yet. Highlight text on any page!';
    bubbleListEl.appendChild(empty);
    return;
  }

  var sorted = allBubbles.slice().sort(function(a, b) { return b.created - a.created; });
  for (var i = 0; i < sorted.length; i++) {
    var b = sorted[i];
    var item = document.createElement('div');
    item.className = 'bubble-item';

    var front = document.createElement('div');
    front.className = 'bubble-front';
    front.textContent = b.front.length > 80 ? b.front.slice(0, 80) + '\u2026' : b.front;

    var meta = document.createElement('div');
    meta.className = 'bubble-meta';
    var daysUntil = Math.ceil((b.nextReview - Date.now()) / (1000 * 60 * 60 * 24));
    meta.textContent = (b.domain || 'manual') + ' \u00B7 ' + (daysUntil <= 0 ? 'due now' : 'due in ' + daysUntil + 'd');

    var delBtn = document.createElement('button');
    delBtn.className = 'bubble-delete';
    delBtn.textContent = '\u00D7';
    delBtn.title = 'Delete bubble';
    delBtn.dataset.id = b.id;
    delBtn.addEventListener('click', async function() {
      await chrome.runtime.sendMessage({ type: 'DELETE_BUBBLE', id: this.dataset.id });
      var data = await chrome.storage.local.get('bubbles');
      allBubbles = data.bubbles || [];
      updateStats();
      renderBubbleList();
    });

    item.appendChild(front);
    item.appendChild(meta);
    item.appendChild(delBtn);
    bubbleListEl.appendChild(item);
  }
}

// ── Add Bubble ──────────────────────────────────────────────────────────────
addBubbleBtn.addEventListener('click', async function() {
  var front = addFrontEl.value.trim();
  if (!front) return;
  var back = addBackEl.value.trim();

  await chrome.runtime.sendMessage({
    type: 'ADD_BUBBLE',
    front: front,
    back: back,
    source: '',
    domain: 'manual',
  });

  addFrontEl.value = '';
  addBackEl.value = '';

  var data = await chrome.storage.local.get('bubbles');
  allBubbles = data.bubbles || [];
  updateStats();
  loadStudyCard();
  renderBubbleList();
});

// ── Master Toggle ───────────────────────────────────────────────────────────
masterToggle.addEventListener('change', function() {
  chrome.storage.local.set({ enabled: masterToggle.checked });
});

// ── Cute Messages ───────────────────────────────────────────────────────────
function rotateMsgs() {
  var idx = 0;
  setInterval(function() {
    idx = (idx + 1) % CUTE_MSGS.length;
    cuteMsgEl.style.opacity = '0';
    setTimeout(function() {
      cuteMsgEl.textContent = CUTE_MSGS[idx];
      cuteMsgEl.style.opacity = '1';
    }, 200);
  }, 3500);
}

// ── Storage Sync ────────────────────────────────────────────────────────────
chrome.storage.onChanged.addListener(function(changes, area) {
  if (area !== 'local') return;
  if (changes.bubbles) {
    allBubbles = changes.bubbles.newValue || [];
    updateStats();
  }
  if (changes.enabled) masterToggle.checked = changes.enabled.newValue !== false;
});

init();

document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
