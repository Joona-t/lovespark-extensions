'use strict';

/* ── LoveSpark Hub — New Tab Dashboard Logic ──────────────────────
   NO innerHTML — createElement/textContent only.
   All state stored in chrome.storage.local. */

/* ── Helpers ──────────────────────────────────────────────────────── */

function todayKey() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return yyyy + '-' + mm + '-' + dd;
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date) {
  return date.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function elapsedStr(ms) {
  const totalMin = Math.floor(ms / 60000);
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  if (h > 0) return h + 'h ' + m + 'm';
  return m + 'm';
}

function agoStr(timestamp) {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  const hrs = Math.floor(mins / 60);
  const remMins = mins % 60;
  return hrs + 'h ' + remMins + 'm ago';
}

/* ── Clock ────────────────────────────────────────────────────────── */

function initClock() {
  const clockEl = document.getElementById('headerClock');
  const dateEl = document.getElementById('currentDate');

  function tick() {
    const now = new Date();
    clockEl.textContent = formatTime(now);
    dateEl.textContent = formatDate(now);
  }

  tick();
  setInterval(tick, 10000);
}

/* ── Session Time ─────────────────────────────────────────────────── */

function initSessionTime() {
  const sessionEl = document.getElementById('sessionTime');
  const ringFill = document.getElementById('timeRingFill');
  const MAX_HOURS = 8;

  function update() {
    chrome.storage.local.get(['sessionStart'], function(data) {
      if (!data.sessionStart) return;
      var elapsed = Date.now() - data.sessionStart;
      sessionEl.textContent = 'Browsing: ' + elapsedStr(elapsed);

      var hours = elapsed / 3600000;
      var pct = Math.min(100, (hours / MAX_HOURS) * 100);
      ringFill.setAttribute('stroke-dasharray', pct.toFixed(1) + ' 100');
    });
  }

  update();
  setInterval(update, 30000);
}

/* ── Daily Tasks ──────────────────────────────────────────────────── */

var tasks = [];

function saveTasks() {
  var obj = {};
  obj['tasks-' + todayKey()] = tasks;
  chrome.storage.local.set(obj);
}

function updateTaskBadge() {
  var badge = document.getElementById('taskBadge');
  var remaining = tasks.filter(function(t) { return !t.done; }).length;
  badge.textContent = String(remaining);
  badge.setAttribute('aria-label', remaining + ' tasks remaining');
}

function renderTasks() {
  var list = document.getElementById('taskList');

  while (list.firstChild) {
    list.removeChild(list.firstChild);
  }

  tasks.forEach(function(task, idx) {
    var li = document.createElement('li');
    li.className = 'task-item' + (task.done ? ' done' : '');
    li.setAttribute('role', 'listitem');

    var cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.className = 'task-checkbox';
    cb.checked = task.done;
    cb.setAttribute('aria-label', 'Mark "' + task.text + '" as ' + (task.done ? 'not done' : 'done'));
    cb.addEventListener('change', function() {
      tasks[idx].done = cb.checked;
      saveTasks();
      renderTasks();
      updateSparkyMood();
    });

    var span = document.createElement('span');
    span.className = 'task-text';
    span.textContent = task.text;

    var del = document.createElement('button');
    del.className = 'task-delete-btn';
    del.setAttribute('aria-label', 'Delete task: ' + task.text);
    del.textContent = '\u00D7';
    del.addEventListener('click', function() {
      tasks.splice(idx, 1);
      saveTasks();
      renderTasks();
      updateSparkyMood();
    });

    li.appendChild(cb);
    li.appendChild(span);
    li.appendChild(del);
    list.appendChild(li);
  });

  updateTaskBadge();
}

function initTasks() {
  var key = 'tasks-' + todayKey();
  chrome.storage.local.get([key], function(data) {
    tasks = data[key] || [];
    renderTasks();
  });

  var form = document.getElementById('taskForm');
  var input = document.getElementById('taskInput');

  form.addEventListener('submit', function(e) {
    e.preventDefault();
    var text = input.value.trim();
    if (!text) return;
    tasks.push({ text: text, done: false });
    saveTasks();
    renderTasks();
    updateSparkyMood();
    input.value = '';
    input.focus();
  });

  document.getElementById('clearDoneBtn').addEventListener('click', function() {
    tasks = tasks.filter(function(t) { return !t.done; });
    saveTasks();
    renderTasks();
    updateSparkyMood();
  });
}

/* ── Focus Mode ───────────────────────────────────────────────────── */

var focusInterval = null;

function updateFocusDisplay() {
  chrome.storage.local.get(['focusMode', 'focusStart'], function(data) {
    var toggle = document.getElementById('focusToggle');
    var label = document.getElementById('focusLabel');
    var elapsed = document.getElementById('focusElapsed');
    var isOn = !!data.focusMode;

    toggle.setAttribute('aria-checked', String(isOn));
    label.textContent = isOn ? 'ON' : 'OFF';

    if (isOn && data.focusStart) {
      elapsed.textContent = elapsedStr(Date.now() - data.focusStart);
    } else {
      elapsed.textContent = '';
    }
  });
}

function initFocus() {
  var toggle = document.getElementById('focusToggle');

  toggle.addEventListener('click', function() {
    chrome.storage.local.get(['focusMode'], function(data) {
      var isOn = !data.focusMode;
      var update = { focusMode: isOn };
      if (isOn) {
        update.focusStart = Date.now();
      }
      chrome.storage.local.set(update, function() {
        updateFocusDisplay();
        updateSparkyMood();

        if (focusInterval) clearInterval(focusInterval);
        if (isOn) {
          focusInterval = setInterval(updateFocusDisplay, 10000);
        }
      });
    });
  });

  updateFocusDisplay();

  chrome.storage.local.get(['focusMode'], function(data) {
    if (data.focusMode) {
      focusInterval = setInterval(updateFocusDisplay, 10000);
    }
  });
}

/* ── Break Reminders ──────────────────────────────────────────────── */

function updateReminders() {
  chrome.storage.local.get(['reminders'], function(data) {
    var reminders = data.reminders || {};
    var types = ['water', 'food', 'move', 'meds'];

    types.forEach(function(type) {
      var r = reminders[type];
      if (!r) return;

      var timerEl = document.getElementById('timer-' + type);
      var itemEl = timerEl ? timerEl.closest('.reminder-item') : null;

      if (timerEl) {
        timerEl.textContent = agoStr(r.lastDone);
      }

      if (itemEl) {
        if (r.overdue) {
          itemEl.classList.add('overdue');
        } else {
          itemEl.classList.remove('overdue');
        }
      }
    });
  });
}

function initReminders() {
  var buttons = document.querySelectorAll('.reminder-btn');

  buttons.forEach(function(btn) {
    btn.addEventListener('click', function() {
      var type = btn.getAttribute('data-type');
      try {
        chrome.runtime.sendMessage({ action: 'markReminderDone', type: type }, function() {
          if (chrome.runtime.lastError) {
            console.warn('[LoveSpark Hub] sendMessage error:', chrome.runtime.lastError.message);
          }
          updateReminders();
          updateSparkyMood();
        });
      } catch (err) {
        console.warn('[LoveSpark Hub] sendMessage threw:', err.message);
        updateReminders();
        updateSparkyMood();
      }
    });
  });

  updateReminders();
  setInterval(updateReminders, 15000);
}

/* ── Sparky Mood ──────────────────────────────────────────────────── */

var MESSAGES_HAPPY = [
  'You\'re doing amazing! Keep it up!',
  'Tasks checked off AND breaks taken? Champion!',
  'Your brain thanks you for those breaks!',
  'Look at you being productive AND healthy!',
  'Sparky is proud of you today!',
  'You\'re on fire (the good kind)!',
  'Hydrated, fed, and focused. Triple threat!',
  'This is what peak ADHD management looks like!'
];

var MESSAGES_ENCOURAGE = [
  'Ready when you are! Try adding a task.',
  'A fresh day awaits! What\'s on the agenda?',
  'Small steps count. Add one tiny task!',
  'Hey friend, Sparky believes in you!',
  'No pressure, just possibilities.',
  'Take a breath. Then take a step.',
  'Every expert was once a beginner!'
];

var MESSAGES_NUDGE = [
  'Hey, you might be overdue for a break!',
  'Your body called -- it wants water!',
  'Time to stretch those legs maybe?',
  'Break reminders are glowing... hint hint!',
  'Self-care isn\'t optional, friend!',
  'Even Sparky takes breaks!',
  'A quick break makes focus sharper!'
];

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function updateSparkyMood() {
  chrome.storage.local.get(['reminders'], function(data) {
    var reminders = data.reminders || {};
    var avatar = document.getElementById('sparkyAvatar');
    var msgEl = document.getElementById('sparkyMessage');

    var overdueCount = 0;
    var types = ['water', 'food', 'move', 'meds'];
    types.forEach(function(type) {
      if (reminders[type] && reminders[type].overdue) {
        overdueCount++;
      }
    });

    var doneCount = tasks.filter(function(t) { return t.done; }).length;
    var totalTasks = tasks.length;

    avatar.classList.remove('happy', 'nudge');

    if (overdueCount >= 2) {
      avatar.classList.add('nudge');
      msgEl.textContent = pickRandom(MESSAGES_NUDGE);
    } else if (doneCount >= 2 && overdueCount === 0) {
      avatar.classList.add('happy');
      msgEl.textContent = pickRandom(MESSAGES_HAPPY);
    } else if (totalTasks === 0) {
      msgEl.textContent = pickRandom(MESSAGES_ENCOURAGE);
    } else if (doneCount > 0) {
      msgEl.textContent = pickRandom(MESSAGES_HAPPY);
    } else {
      msgEl.textContent = pickRandom(MESSAGES_ENCOURAGE);
    }
  });
}

/* ── Theme ────────────────────────────────────────────────────────── */

function initTheme() {
  if (typeof LoveSparkTheme !== 'undefined') {
    LoveSparkTheme.init();
  }
}

/* ── Init ─────────────────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', function() {
  initTheme();
  initClock();
  initSessionTime();
  initTasks();
  initFocus();
  initReminders();

  setTimeout(updateSparkyMood, 500);
  setInterval(updateSparkyMood, 60000);
});
