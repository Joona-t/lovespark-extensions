'use strict';

document.addEventListener('DOMContentLoaded', () => {
  LoveSparkTheme.init();

  const CUTE_MSGS = [
    'Browse in peace!',
    'No surprise sounds!',
    'Silence is golden!',
    'Your ears thank you!',
    'Quiet browsing mode!',
  ];

  const statusIcon = document.getElementById('statusIcon');
  const statusText = document.getElementById('statusText');
  const cuteMsg = document.getElementById('cuteMsg');
  const toggleEl = document.getElementById('enableToggle');
  const todayEl = document.getElementById('todayCount');
  const totalEl = document.getElementById('totalCount');

  let prevToday = 0;
  let prevTotal = 0;

  function updateUI(data) {
    const enabled = data.isEnabled !== false;
    const today = data.noiseBlockedToday || 0;
    const total = data.noiseBlockedTotal || 0;

    toggleEl.checked = enabled;
    statusIcon.textContent = enabled ? '\uD83D\uDD07' : '\uD83D\uDD0A';
    statusIcon.classList.toggle('paused', !enabled);
    statusText.textContent = enabled ? 'Blocking Autoplay' : 'Paused';

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

  LoveSparkPopup.rotateMessages(cuteMsg, CUTE_MSGS);
  chrome.storage.onChanged.addListener(refresh);
  refresh();
});

/* ── Author / Ko-fi Footer ── */
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
