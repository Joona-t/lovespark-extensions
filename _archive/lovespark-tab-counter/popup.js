'use strict';

document.addEventListener('DOMContentLoaded', () => {
  LoveSparkTheme.init();

  const bigCount = document.getElementById('bigCount');
  const warnMsg = document.getElementById('warnMsg');
  const toggleEl = document.getElementById('enableToggle');
  const thresholdInput = document.getElementById('thresholdInput');
  const windowList = document.getElementById('windowList');

  let debounceTimer = null;

  function renderWindows(windowCounts) {
    windowList.textContent = '';
    for (let i = 0; i < windowCounts.length; i++) {
      const win = windowCounts[i];
      const item = document.createElement('div');
      item.className = 'window-item';
      item.setAttribute('role', 'listitem');

      const name = document.createElement('span');
      name.className = 'window-name' + (win.focused ? ' focused' : '');
      name.textContent = 'Window ' + (i + 1) + (win.focused ? ' (active)' : '');

      const count = document.createElement('span');
      count.className = 'window-count';
      count.textContent = win.tabCount + ' tab' + (win.tabCount !== 1 ? 's' : '');

      item.append(name, count);
      windowList.appendChild(item);
    }
  }

  function updateUI(data) {
    const enabled = data.isEnabled !== false;
    const total = data.totalTabs || 0;
    const threshold = data.tabThreshold || 20;

    toggleEl.checked = enabled;
    thresholdInput.value = threshold;

    bigCount.textContent = String(total);
    bigCount.classList.remove('warn', 'danger');

    if (total >= threshold * 1.5) {
      bigCount.classList.add('danger');
      warnMsg.textContent = 'Way too many tabs! Close some to stay focused.';
      warnMsg.classList.remove('hidden');
    } else if (total >= threshold) {
      bigCount.classList.add('warn');
      warnMsg.textContent = 'You have ' + total + ' tabs open (threshold: ' + threshold + ')';
      warnMsg.classList.remove('hidden');
    } else {
      warnMsg.classList.add('hidden');
      warnMsg.textContent = '';
    }

    renderWindows(data.windowCounts || []);
  }

  function refresh() {
    chrome.runtime.sendMessage({ type: 'GET_STATS' }).then(updateUI);
  }

  toggleEl.addEventListener('change', () => {
    chrome.runtime.sendMessage({ type: 'SET_ENABLED', enabled: toggleEl.checked });
  });

  thresholdInput.addEventListener('input', () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      const val = parseInt(thresholdInput.value, 10);
      if (val > 0) {
        chrome.runtime.sendMessage({ type: 'SET_THRESHOLD', threshold: val }).then(refresh);
      }
    }, 400);
  });

  chrome.storage.onChanged.addListener(refresh);
  refresh();
});
