'use strict';

LoveSparkTheme.init();

var CUTE_MSGS = [
  'Guarding your words!',
  'Your text is safe!',
  'Never lose your work!',
  'Type freely, bestie!'
];

var todayEl = document.getElementById('todayCount');
var totalEl = document.getElementById('totalCount');
var toggleEl = document.getElementById('enableToggle');
var statusIcon = document.getElementById('statusIcon');
var statusText = document.getElementById('statusText');
var cuteMsg = document.getElementById('cuteMsg');
var entriesList = document.getElementById('entriesList');
var clearAllBtn = document.getElementById('clearAllBtn');

var prevToday = 0;
var prevTotal = 0;
var clearConfirm = false;

function safeSend(msg) {
  try {
    return chrome.runtime.sendMessage(msg);
  } catch (_err) {
    return Promise.resolve(null);
  }
}

function relativeTime(ts) {
  var diff = Date.now() - ts;
  var mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  var hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h ago';
  var days = Math.floor(hrs / 24);
  return days + 'd ago';
}

function truncate(text, len) {
  if (text.length <= len) return text;
  return text.slice(0, len) + '\u2026';
}

function updateUI(data) {
  if (!data) return;
  var enabled = data.isEnabled !== false;
  var today = data.inputguardToday || 0;
  var total = data.inputguardTotal || 0;

  toggleEl.checked = enabled;
  statusIcon.classList.toggle('paused', !enabled);
  statusText.textContent = enabled ? 'Active' : 'Paused';

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);
  if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

  prevToday = today;
  prevTotal = total;
}

function renderEntries(entries) {
  while (entriesList.firstChild) {
    entriesList.removeChild(entriesList.firstChild);
  }

  if (!entries || entries.length === 0) {
    var empty = document.createElement('div');
    empty.className = 'empty-state';

    var icon = document.createElement('div');
    icon.className = 'empty-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '\uD83D\uDCDD';

    var text = document.createElement('div');
    text.className = 'empty-text';
    text.textContent = 'Start typing anywhere \u2014 Input Guard saves automatically';

    empty.appendChild(icon);
    empty.appendChild(text);
    entriesList.appendChild(empty);
    return;
  }

  var sorted = entries.slice().sort(function (a, b) { return b.timestamp - a.timestamp; }).slice(0, 15);

  sorted.forEach(function (entry) {
    var card = document.createElement('div');
    card.className = 'entry-card';

    var top = document.createElement('div');
    top.className = 'entry-top';

    var site = document.createElement('span');
    site.className = 'entry-site';
    site.textContent = entry.hostname || 'Unknown';

    var time = document.createElement('span');
    time.className = 'entry-time';
    time.textContent = relativeTime(entry.timestamp);

    top.appendChild(site);
    top.appendChild(time);

    var preview = document.createElement('div');
    preview.className = 'entry-preview';
    preview.textContent = truncate(entry.text.replace(/\n/g, ' '), 100);

    var actions = document.createElement('div');
    actions.className = 'entry-actions';

    var copyBtn = document.createElement('button');
    copyBtn.className = 'btn-copy';
    copyBtn.textContent = 'Copy';
    copyBtn.setAttribute('aria-label', 'Copy saved text from ' + entry.hostname);
    copyBtn.addEventListener('click', function () {
      navigator.clipboard.writeText(entry.text).then(function () {
        copyBtn.textContent = 'Copied!';
        copyBtn.classList.add('copied');
        setTimeout(function () {
          copyBtn.textContent = 'Copy';
          copyBtn.classList.remove('copied');
        }, 1500);
      });
    });

    var delBtn = document.createElement('button');
    delBtn.className = 'btn-delete';
    delBtn.textContent = 'Remove';
    delBtn.setAttribute('aria-label', 'Remove saved text from ' + entry.hostname);
    delBtn.addEventListener('click', function () {
      safeSend({ type: 'DELETE_ENTRY', entryId: entry.id }).then(loadEntries);
    });

    actions.appendChild(copyBtn);
    actions.appendChild(delBtn);

    card.appendChild(top);
    card.appendChild(preview);
    card.appendChild(actions);
    entriesList.appendChild(card);
  });
}

function loadEntries() {
  safeSend({ type: 'GET_ENTRIES' }).then(function (result) {
    if (result) renderEntries(result.entries);
  });
}

toggleEl.addEventListener('change', function () {
  safeSend({ type: 'SET_ENABLED', enabled: toggleEl.checked });
});

clearAllBtn.addEventListener('click', function () {
  if (!clearConfirm) {
    clearConfirm = true;
    clearAllBtn.textContent = 'Are you sure?';
    clearAllBtn.classList.add('confirm');
    setTimeout(function () {
      clearConfirm = false;
      clearAllBtn.textContent = 'Clear All';
      clearAllBtn.classList.remove('confirm');
    }, 3000);
    return;
  }
  clearConfirm = false;
  clearAllBtn.textContent = 'Clear All';
  clearAllBtn.classList.remove('confirm');
  safeSend({ type: 'DELETE_ALL' }).then(loadEntries);
});

chrome.storage.onChanged.addListener(function () {
  safeSend({ type: 'GET_STATS' }).then(updateUI);
});

var themeToggle = document.getElementById('themeToggle');
var themeMenu = document.getElementById('themeMenu');
if (themeToggle && themeMenu) {
  new MutationObserver(function () {
    themeToggle.setAttribute('aria-expanded', themeMenu.classList.contains('open'));
  }).observe(themeMenu, { attributes: true, attributeFilter: ['class'] });
}

document.getElementById('settingsBtn').addEventListener('click', function () {
  chrome.runtime.openOptionsPage();
});

LoveSparkPopup.rotateMessages(cuteMsg, CUTE_MSGS);
safeSend({ type: 'GET_STATS' }).then(updateUI);
loadEntries();
