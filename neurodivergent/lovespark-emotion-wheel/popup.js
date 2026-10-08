'use strict';

LoveSparkTheme.init();

var CUTE_MSGS = [
  'How are you feeling?',
  'All feelings are valid!',
  'Name it to tame it!',
  'Sparky cares about you!'
];

/* Emotion tree: basic -> nuanced */
var EMOTIONS = {
  root: [
    { id: 'happy', icon: '\u{1F60A}', label: 'Happy' },
    { id: 'sad', icon: '\u{1F622}', label: 'Sad' },
    { id: 'angry', icon: '\u{1F621}', label: 'Angry' },
    { id: 'anxious', icon: '\u{1F630}', label: 'Anxious' },
    { id: 'tired', icon: '\u{1F634}', label: 'Tired' },
    { id: 'calm', icon: '\u{1F60C}', label: 'Calm' }
  ],
  happy: [
    { id: 'joyful', icon: '\u{1F929}', label: 'Joyful' },
    { id: 'grateful', icon: '\u{1F64F}', label: 'Grateful' },
    { id: 'proud', icon: '\u{1F4AA}', label: 'Proud' },
    { id: 'excited', icon: '\u{1F389}', label: 'Excited' },
    { id: 'content', icon: '\u{263A}\uFE0F', label: 'Content' },
    { id: 'hopeful', icon: '\u{1F31F}', label: 'Hopeful' }
  ],
  sad: [
    { id: 'lonely', icon: '\u{1F614}', label: 'Lonely' },
    { id: 'disappointed', icon: '\u{1F61E}', label: 'Disappointed' },
    { id: 'grief', icon: '\u{1F62D}', label: 'Grieving' },
    { id: 'empty', icon: '\u{1FAE5}', label: 'Empty' },
    { id: 'homesick', icon: '\u{1F3E0}', label: 'Homesick' },
    { id: 'melancholy', icon: '\u{1F327}\uFE0F', label: 'Melancholy' }
  ],
  angry: [
    { id: 'frustrated', icon: '\u{1F624}', label: 'Frustrated' },
    { id: 'irritated', icon: '\u{1F612}', label: 'Irritated' },
    { id: 'resentful', icon: '\u{1F620}', label: 'Resentful' },
    { id: 'overwhelmed', icon: '\u{1F4A5}', label: 'Overwhelmed' },
    { id: 'jealous', icon: '\u{1F49A}', label: 'Jealous' },
    { id: 'betrayed', icon: '\u{1F494}', label: 'Betrayed' }
  ],
  anxious: [
    { id: 'worried', icon: '\u{1F627}', label: 'Worried' },
    { id: 'nervous', icon: '\u{1F628}', label: 'Nervous' },
    { id: 'restless', icon: '\u{1F4A8}', label: 'Restless' },
    { id: 'panicked', icon: '\u{1F631}', label: 'Panicked' },
    { id: 'insecure', icon: '\u{1F625}', label: 'Insecure' },
    { id: 'dread', icon: '\u{1F636}\u200D\u{1F32B}\uFE0F', label: 'Dread' }
  ],
  tired: [
    { id: 'exhausted', icon: '\u{1F62B}', label: 'Exhausted' },
    { id: 'burned-out', icon: '\u{1F525}', label: 'Burned out' },
    { id: 'sleepy', icon: '\u{1F971}', label: 'Sleepy' },
    { id: 'drained', icon: '\u{1FAAB}', label: 'Drained' },
    { id: 'numb', icon: '\u{1F636}', label: 'Numb' },
    { id: 'foggy', icon: '\u{1F32B}\uFE0F', label: 'Brain fog' }
  ],
  calm: [
    { id: 'peaceful', icon: '\u{1F54A}\uFE0F', label: 'Peaceful' },
    { id: 'relaxed', icon: '\u{1F9D8}', label: 'Relaxed' },
    { id: 'mindful', icon: '\u{1F33F}', label: 'Mindful' },
    { id: 'safe', icon: '\u{1F9F8}', label: 'Safe' },
    { id: 'balanced', icon: '\u{2696}\uFE0F', label: 'Balanced' },
    { id: 'grounded', icon: '\u{1F333}', label: 'Grounded' }
  ]
};

var todayEl = document.getElementById('todayCount');
var totalEl = document.getElementById('totalCount');
var cuteMsg = document.getElementById('cuteMsg');
var emotionGrid = document.getElementById('emotionGrid');
var breadcrumb = document.getElementById('breadcrumb');
var backBtn = document.getElementById('backBtn');
var selectedBox = document.getElementById('selectedBox');
var selectedEmotion = document.getElementById('selectedEmotion');
var logBtn = document.getElementById('logBtn');
var recentList = document.getElementById('recentList');

var prevToday = 0;
var prevTotal = 0;
var currentPath = [];
var currentSelection = null;

function renderGrid(key) {
  var items = EMOTIONS[key] || [];
  while (emotionGrid.firstChild) {
    emotionGrid.removeChild(emotionGrid.firstChild);
  }

  items.forEach(function(item) {
    var btn = document.createElement('button');
    btn.className = 'emotion-btn';
    btn.setAttribute('aria-label', item.label);

    var iconSpan = document.createElement('span');
    iconSpan.className = 'emotion-btn-icon';
    iconSpan.setAttribute('aria-hidden', 'true');
    iconSpan.textContent = item.icon;
    btn.appendChild(iconSpan);

    var labelSpan = document.createElement('span');
    labelSpan.className = 'emotion-btn-label';
    labelSpan.textContent = item.label;
    btn.appendChild(labelSpan);

    btn.addEventListener('click', function() {
      if (EMOTIONS[item.id]) {
        /* Has sub-emotions */
        currentPath.push({ key: key, label: item.label });
        renderGrid(item.id);
        renderBreadcrumb();
        backBtn.classList.remove('hidden');
        selectedBox.classList.add('hidden');
      } else {
        /* Leaf emotion — select it */
        emotionGrid.querySelectorAll('.emotion-btn').forEach(function(b) {
          b.classList.remove('selected');
        });
        btn.classList.add('selected');
        currentSelection = item.label;
        selectedEmotion.textContent = item.icon + ' ' + item.label;
        selectedBox.classList.remove('hidden');
      }
    });

    emotionGrid.appendChild(btn);
  });
}

function renderBreadcrumb() {
  while (breadcrumb.firstChild) {
    breadcrumb.removeChild(breadcrumb.firstChild);
  }

  currentPath.forEach(function(step, i) {
    if (i > 0) {
      var sep = document.createElement('span');
      sep.className = 'crumb-sep';
      sep.textContent = '>';
      breadcrumb.appendChild(sep);
    }
    var crumb = document.createElement('span');
    crumb.className = 'crumb';
    crumb.textContent = step.label;
    breadcrumb.appendChild(crumb);
  });
}

backBtn.addEventListener('click', function() {
  if (currentPath.length > 0) {
    currentPath.pop();
    var key = currentPath.length > 0 ? getKeyFromPath() : 'root';
    renderGrid(key);
    renderBreadcrumb();
    selectedBox.classList.add('hidden');
    if (currentPath.length === 0) backBtn.classList.add('hidden');
  }
});

function getKeyFromPath() {
  if (currentPath.length === 0) return 'root';
  var lastLabel = currentPath[currentPath.length - 1].label;
  /* Find the emotion ID matching this label */
  for (var key in EMOTIONS) {
    if (EMOTIONS.hasOwnProperty(key)) {
      var items = EMOTIONS[key];
      for (var i = 0; i < items.length; i++) {
        if (items[i].label === lastLabel && EMOTIONS[items[i].id]) {
          return items[i].id;
        }
      }
    }
  }
  return 'root';
}

logBtn.addEventListener('click', function() {
  if (!currentSelection) return;
  chrome.runtime.sendMessage({ type: 'LOG_EMOTION', emotion: currentSelection });
  selectedBox.classList.add('hidden');
  currentPath = [];
  currentSelection = null;
  renderGrid('root');
  renderBreadcrumb();
  backBtn.classList.add('hidden');
});

function renderRecent(recentEmotions) {
  while (recentList.firstChild) {
    recentList.removeChild(recentList.firstChild);
  }
  var list = recentEmotions || [];
  var display = list.slice(-5).reverse();
  display.forEach(function(em) {
    var chip = document.createElement('span');
    chip.className = 'recent-chip';
    chip.textContent = em;
    recentList.appendChild(chip);
  });
}

function updateUI(data) {
  var today = data.emotionWheelToday || 0;
  var total = data.emotionWheelTotal || 0;

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  prevToday = today;
  prevTotal = total;

  renderRecent(data.recentEmotions);
}

chrome.storage.onChanged.addListener(function() {
  chrome.runtime.sendMessage({ type: 'GET_STATS' }).then(updateUI);
});

LoveSparkPopup.rotateMessages(cuteMsg, CUTE_MSGS);
chrome.runtime.sendMessage({ type: 'GET_STATS' }).then(updateUI);
renderGrid('root');

/* ── Author / Ko-fi Footer ── */
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
