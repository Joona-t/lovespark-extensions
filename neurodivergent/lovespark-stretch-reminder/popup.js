'use strict';

document.addEventListener('DOMContentLoaded', () => {
  LoveSparkTheme.init();

  const stretchEmoji = document.getElementById('stretchEmoji');
  const stretchText = document.getElementById('stretchText');
  const nextStretchBtn = document.getElementById('nextStretchBtn');
  const timerDisplay = document.getElementById('timerDisplay');
  const intervalSelect = document.getElementById('intervalSelect');
  const toggleEl = document.getElementById('enableToggle');
  const todayEl = document.getElementById('todayCount');
  const totalEl = document.getElementById('totalCount');

  let prevToday = 0;
  let prevTotal = 0;
  let countdownTimer = null;
  let nextAlarmTime = 0;

  function updateCountdown() {
    if (nextAlarmTime <= 0) {
      timerDisplay.textContent = '--m';
      return;
    }
    const remaining = Math.max(0, Math.ceil((nextAlarmTime - Date.now()) / 60000));
    timerDisplay.textContent = remaining + 'm';
    if (remaining <= 0) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
  }

  function startCountdownTimer() {
    if (countdownTimer) clearInterval(countdownTimer);
    updateCountdown();
    countdownTimer = setInterval(updateCountdown, 15000);
  }

  function updateUI(data) {
    const enabled = data.isEnabled !== false;
    const today = data.stretchToday || 0;
    const total = data.stretchTotal || 0;

    toggleEl.checked = enabled;

    if (data.intervalMinutes) {
      intervalSelect.value = String(data.intervalMinutes);
    }

    if (data.currentStretch) {
      stretchEmoji.textContent = data.currentStretch.emoji;
      stretchText.textContent = data.currentStretch.text;
    }

    if (enabled && data.nextAlarmTime) {
      nextAlarmTime = data.nextAlarmTime;
      startCountdownTimer();
    } else {
      timerDisplay.textContent = enabled ? '--m' : 'OFF';
      if (countdownTimer) {
        clearInterval(countdownTimer);
        countdownTimer = null;
      }
    }

    LoveSparkPopup.animateCount(todayEl, prevToday, today);
    LoveSparkPopup.animateCount(totalEl, prevTotal, total);
    if (today > prevToday && prevToday > 0) LoveSparkPopup.pop(todayEl);

    prevToday = today;
    prevTotal = total;
  }

  function refresh() {
    chrome.runtime.sendMessage({ type: 'GET_STATS' }).then(updateUI);
  }

  toggleEl.addEventListener('change', () => {
    chrome.runtime.sendMessage({ type: 'SET_ENABLED', enabled: toggleEl.checked }).then(refresh);
  });

  intervalSelect.addEventListener('change', () => {
    const mins = parseInt(intervalSelect.value, 10);
    chrome.runtime.sendMessage({ type: 'SET_INTERVAL', minutes: mins }).then(refresh);
  });

  nextStretchBtn.addEventListener('click', () => {
    chrome.runtime.sendMessage({ type: 'NEXT_STRETCH' }).then((res) => {
      if (res && res.stretch) {
        stretchEmoji.textContent = res.stretch.emoji;
        stretchText.textContent = res.stretch.text;
      }
    });
  });

  chrome.storage.onChanged.addListener(refresh);
  refresh();
});

/* ── Author / Ko-fi Footer ── */
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
