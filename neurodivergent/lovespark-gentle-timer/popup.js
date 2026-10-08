'use strict';

/* ── Helpers ───────────────────────────────────────────── */

function formatTime(seconds) {
  if (seconds < 60) return '<1m';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return h + 'h ' + m + 'm';
  return m + 'm';
}

function formatTimeSince(timestamp) {
  if (!timestamp) return '--';
  const diff = Math.round((Date.now() - timestamp) / 60000);
  if (diff < 1) return 'just now';
  if (diff < 60) return diff + 'm ago';
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return h + 'h ' + m + 'm ago';
}

/* ── Render site list ──────────────────────────────────── */

function renderSites(todayData, activeDomain) {
  var siteList = document.getElementById('siteList');
  var totalEl = document.getElementById('totalTime');

  // Clear existing
  while (siteList.firstChild) {
    siteList.removeChild(siteList.firstChild);
  }

  var entries = Object.entries(todayData);
  if (entries.length === 0) {
    var empty = document.createElement('div');
    empty.className = 'empty-state';
    empty.setAttribute('role', 'listitem');
    empty.textContent = 'No browsing tracked yet today';
    siteList.appendChild(empty);
    totalEl.textContent = '0m total';
    return;
  }

  // Sort by time descending
  entries.sort(function(a, b) { return b[1] - a[1]; });

  var totalSeconds = 0;

  entries.forEach(function(entry) {
    var domain = entry[0];
    var seconds = entry[1];
    totalSeconds += seconds;

    var row = document.createElement('div');
    row.className = 'site-row';
    row.setAttribute('role', 'listitem');

    var domainSpan = document.createElement('span');
    domainSpan.className = 'site-domain';
    if (domain === activeDomain) {
      domainSpan.classList.add('site-active');
    }
    domainSpan.textContent = domain;

    var timeSpan = document.createElement('span');
    timeSpan.className = 'site-time';
    timeSpan.textContent = formatTime(seconds);

    row.appendChild(domainSpan);
    row.appendChild(timeSpan);
    siteList.appendChild(row);
  });

  totalEl.textContent = formatTime(totalSeconds) + ' total';
}

/* ── Render break status ───────────────────────────────── */

function renderBreaks(breakDue, lastBreak) {
  var types = ['water', 'food', 'movement'];
  var capitalNames = { water: 'Water', food: 'Food', movement: 'Movement' };

  types.forEach(function(type) {
    var statusEl = document.getElementById('break' + capitalNames[type] + 'Status');
    if (!statusEl) return;

    if (breakDue[type]) {
      statusEl.textContent = 'Due now!';
      statusEl.classList.add('break-due');
    } else if (lastBreak[type]) {
      statusEl.textContent = formatTimeSince(lastBreak[type]);
      statusEl.classList.remove('break-due');
    } else {
      statusEl.textContent = 'Not yet';
      statusEl.classList.remove('break-due');
    }
  });
}

/* ── Load settings into UI ─────────────────────────────── */

function loadSettings(settings) {
  var nudge = document.getElementById('nudgeThreshold');
  var waterInt = document.getElementById('breakWaterInterval');
  var foodInt = document.getElementById('breakFoodInterval');
  var movementInt = document.getElementById('breakMovementInterval');
  var showBadge = document.getElementById('showBadge');
  var allowlist = document.getElementById('allowlist');

  if (nudge) nudge.value = String(settings.nudgeThreshold || 30);
  if (waterInt) waterInt.value = String(settings.breakWater || 45);
  if (foodInt) foodInt.value = String(settings.breakFood || 180);
  if (movementInt) movementInt.value = String(settings.breakMovement || 60);
  if (showBadge) showBadge.checked = settings.showBadge !== false;
  if (allowlist) allowlist.value = (settings.allowlist || []).join('\n');
}

/* ── Save settings ─────────────────────────────────────── */

function saveSettings() {
  var nudge = document.getElementById('nudgeThreshold');
  var waterInt = document.getElementById('breakWaterInterval');
  var foodInt = document.getElementById('breakFoodInterval');
  var movementInt = document.getElementById('breakMovementInterval');
  var showBadge = document.getElementById('showBadge');
  var allowlist = document.getElementById('allowlist');

  var allowlistArr = (allowlist.value || '')
    .split('\n')
    .map(function(s) { return s.trim().toLowerCase(); })
    .filter(function(s) { return s.length > 0; });

  var settings = {
    nudgeThreshold: parseInt(nudge.value, 10) || 30,
    breakWater: parseInt(waterInt.value, 10) || 45,
    breakFood: parseInt(foodInt.value, 10) || 180,
    breakMovement: parseInt(movementInt.value, 10) || 60,
    showBadge: showBadge.checked,
    allowlist: allowlistArr
  };

  try {
    chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', settings: settings }, function() {
      var btn = document.getElementById('saveSettings');
      btn.textContent = 'Saved!';
      btn.classList.add('saved');
      setTimeout(function() {
        btn.textContent = 'Save Settings';
        btn.classList.remove('saved');
      }, 1500);
    });
  } catch (err) {
    // Extension context invalidated (e.g. after a reload) — nothing to do.
  }
}

/* ── Break done buttons ────────────────────────────────── */

function setupBreakButtons() {
  var types = ['water', 'food', 'movement'];
  var capitalNames = { water: 'Water', food: 'Food', movement: 'Movement' };

  types.forEach(function(type) {
    var btn = document.getElementById('break' + capitalNames[type] + 'Done');
    if (!btn) return;

    btn.addEventListener('click', function() {
      try {
        chrome.runtime.sendMessage({ type: 'MARK_BREAK', breakType: type }, function() {
          // Refresh display
          loadData();
        });
      } catch (err) {
        // Extension context invalidated (e.g. after a reload) — nothing to do.
      }
    });
  });
}

/* ── Load all data ─────────────────────────────────────── */

function loadData() {
  try {
    chrome.runtime.sendMessage({ type: 'GET_ALL_TODAY' }, function(response) {
      if (chrome.runtime.lastError || !response) return;

      renderSites(response.today || {}, response.activeDomain);
      renderBreaks(response.breakDue || {}, response.lastBreak || {});
      loadSettings(response.settings || {});
    });
  } catch (err) {
    // Extension context invalidated (e.g. after a reload) — nothing to do.
  }
}

/* ── Init ──────────────────────────────────────────────── */

document.addEventListener('DOMContentLoaded', function() {
  // Theme
  if (typeof LoveSparkTheme !== 'undefined') {
    LoveSparkTheme.init();
  }

  // Footer (LoveSpark Suite / Ko-fi / Report a Bug)
  var footerMount = document.getElementById('footerMount');
  if (typeof LoveSparkFooter !== 'undefined' && footerMount) {
    footerMount.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
  }

  // Load data
  loadData();

  // Setup break buttons
  setupBreakButtons();

  // Save button
  var saveBtn = document.getElementById('saveSettings');
  if (saveBtn) {
    saveBtn.addEventListener('click', saveSettings);
  }

  // Toggle track click handler (for accessibility with label)
  var toggleTracks = document.querySelectorAll('.toggle-track');
  toggleTracks.forEach(function(track) {
    track.addEventListener('click', function() {
      var input = track.previousElementSibling;
      if (input && input.type === 'checkbox') {
        input.checked = !input.checked;
        input.dispatchEvent(new Event('change'));
      }
    });
  });
});
