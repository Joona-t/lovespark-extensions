// Dopamine Control — Popup Script
// Polls background every second for status, manages timer/settings views.

let pollInterval = null;
let lastStatus = null;
let activeSlider = 'weekday'; // tracks which slider presets apply to

// ============================================================
// STATUS DISPLAY
// ============================================================

function updateDisplay(status) {
  lastStatus = status;

  const remaining = Math.max(0, status.limit - status.watchTime);
  const pct = Math.min(100, status.percentage || 0);

  // Time remaining display
  const timeEl = document.getElementById('time-remaining');
  const labelEl = document.getElementById('time-label');
  if (status.isBlocked && !status.isOverriding) {
    timeEl.textContent = "Time's up!";
    timeEl.style.color = 'var(--danger-deep)';
    labelEl.textContent = 'come back tomorrow';
  } else if (status.isOverriding) {
    const overrideLeft = Math.max(0, Math.floor((status.overrideExpiresAt - Date.now()) / 1000));
    timeEl.textContent = formatTime(overrideLeft);
    timeEl.style.color = 'var(--caution)';
    labelEl.textContent = 'override time left';
  } else {
    timeEl.textContent = formatTime(remaining);
    timeEl.style.color = '';
    labelEl.textContent = 'remaining today';
  }

  // Progress bar
  const fill = document.getElementById('progress-fill');
  fill.style.width = pct + '%';
  fill.className = 'progress-fill';
  if (pct >= 95) fill.classList.add('p-danger-deep');
  else if (pct >= 80) fill.classList.add('p-danger');
  else if (pct >= 60) fill.classList.add('p-caution');
  else fill.classList.add('p-safe');

  document.getElementById('progress-pct').textContent = Math.round(pct) + '%';

  // Stats
  document.getElementById('time-used').textContent = formatTime(status.watchTime);
  document.getElementById('time-limit').textContent = formatTime(status.limit);

  if (status.whitelistTime > 0) {
    document.getElementById('whitelist-row').style.display = 'block';
    document.getElementById('whitelist-time').textContent = formatTime(status.whitelistTime);
  }

  // Streak + level
  document.getElementById('streak-count').textContent = status.streak || 0;
  document.getElementById('level-num').textContent = status.level || 1;

  // Override bar
  const overrideBar = document.getElementById('override-bar');
  if (status.isOverriding && status.overrideExpiresAt) {
    const left = Math.max(0, Math.floor((status.overrideExpiresAt - Date.now()) / 1000));
    const m = Math.floor(left / 60);
    const s = left % 60;
    document.getElementById('override-time').textContent =
      `${m}:${String(s).padStart(2, '0')}`;
    overrideBar.style.display = 'block';
  } else {
    overrideBar.style.display = 'none';
  }

  // Blocked bar
  document.getElementById('blocked-bar').style.display =
    (status.isBlocked && !status.isOverriding) ? 'block' : 'none';

  // Dopa mascot
  updateDopa(pct, status.isBlocked);
}

function updateDopa(pct, isBlocked) {
  const dopa = document.getElementById('dopa');
  dopa.classList.remove('dopa-alarm');

  if (isBlocked) {
    dopa.textContent = '😴';
  } else if (pct >= 85) {
    dopa.textContent = '😰';
    dopa.classList.add('dopa-alarm');
  } else if (pct >= 70) {
    dopa.textContent = '😟';
  } else if (pct >= 50) {
    dopa.textContent = '😐';
  } else {
    dopa.textContent = '😊';
  }
}

function fetchStatus() {
  chrome.runtime.sendMessage({ type: 'GET_FULL_STATUS' }, (status) => {
    if (chrome.runtime.lastError) return;
    if (status) updateDisplay(status);
  });
}

// ============================================================
// NAVIGATION
// ============================================================

function showTimer() {
  document.getElementById('view-timer').style.display = 'flex';
  document.getElementById('view-settings').style.display = 'none';
  if (!pollInterval) {
    pollInterval = setInterval(fetchStatus, 1000);
  }
}

function showSettings() {
  document.getElementById('view-timer').style.display = 'none';
  document.getElementById('view-settings').style.display = 'flex';
  clearInterval(pollInterval);
  pollInterval = null;
  loadSettingsIntoUI();
}

// ============================================================
// SETTINGS
// ============================================================

function loadSettingsIntoUI() {
  chrome.runtime.sendMessage({ type: 'GET_FULL_STATUS' }, (status) => {
    if (!status) return;

    const wdSlider = document.getElementById('weekday-slider');
    const weSlider = document.getElementById('weekend-slider');
    wdSlider.value = status.weekdayLimit;
    weSlider.value = status.weekendLimit;
    document.getElementById('weekday-label').textContent = formatTime(status.weekdayLimit);
    document.getElementById('weekend-label').textContent = formatTime(status.weekendLimit);
  });
}

function saveSettings() {
  const weekdayLimit = parseInt(document.getElementById('weekday-slider').value, 10);
  const weekendLimit = parseInt(document.getElementById('weekend-slider').value, 10);
  const floatingTimerVisible = document.getElementById('toggle-floating').checked;

  chrome.runtime.sendMessage({
    type: 'UPDATE_SETTINGS',
    payload: { weekdayLimit, weekendLimit, floatingTimerVisible }
  });
}

// ============================================================
// INIT
// ============================================================

document.addEventListener('DOMContentLoaded', () => {

  // Initial fetch + start polling
  fetchStatus();
  pollInterval = setInterval(fetchStatus, 1000);

  // Nav
  document.getElementById('btn-settings').addEventListener('click', showSettings);

  document.getElementById('btn-back').addEventListener('click', () => {
    saveSettings();
    showTimer();
  });

  document.getElementById('btn-stats').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard/stats.html') });
  });

  // Sliders — live label update
  document.getElementById('weekday-slider').addEventListener('input', (e) => {
    document.getElementById('weekday-label').textContent = formatTime(parseInt(e.target.value, 10));
    activeSlider = 'weekday';
  });
  document.getElementById('weekend-slider').addEventListener('input', (e) => {
    document.getElementById('weekend-label').textContent = formatTime(parseInt(e.target.value, 10));
    activeSlider = 'weekend';
  });

  document.getElementById('weekday-slider').addEventListener('focus', () => { activeSlider = 'weekday'; });
  document.getElementById('weekend-slider').addEventListener('focus', () => { activeSlider = 'weekend'; });

  // Quick presets — apply to whichever slider was last focused
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const seconds = parseInt(btn.dataset.seconds, 10);
      const slider = document.getElementById(`${activeSlider}-slider`);
      const label = document.getElementById(`${activeSlider}-label`);
      slider.value = seconds;
      label.textContent = formatTime(seconds);

      document.querySelectorAll('.preset-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
    });
  });

  // Reset data
  document.getElementById('btn-reset').addEventListener('click', () => {
    if (confirm('Reset ALL data? This cannot be undone.')) {
      chrome.runtime.sendMessage({ type: 'RESET_DATA' }, () => {
        showTimer();
        fetchStatus();
      });
    }
  });

  // Cleanup on popup close
  window.addEventListener('unload', () => {
    clearInterval(pollInterval);
  });
});
