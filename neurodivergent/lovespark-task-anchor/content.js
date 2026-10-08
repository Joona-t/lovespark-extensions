'use strict';

(async () => {
  // Skip extension/internal pages
  const proto = location.protocol;
  if (proto === 'chrome-extension:' || proto === 'chrome:' || proto === 'about:' || proto === 'moz-extension:') return;

  const BANNER_ID = 'ls-task-anchor-banner';
  let dismissed = false;
  let autoHideTimer = null;
  let nudgeSent = false;

  function getBanner() {
    return document.getElementById(BANNER_ID);
  }

  function buildBanner() {
    if (getBanner()) return getBanner();

    const banner = document.createElement('div');
    banner.id = BANNER_ID;
    banner.setAttribute('data-lovespark', 'task-anchor');
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-live', 'polite');
    banner.setAttribute('aria-label', 'Task reminder');

    const icon = document.createElement('span');
    icon.className = 'ls-task-anchor-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.textContent = '\uD83D\uDCCC';
    banner.appendChild(icon);

    const text = document.createElement('span');
    text.className = 'ls-task-anchor-text';
    banner.appendChild(text);

    const doneBtn = document.createElement('button');
    doneBtn.className = 'ls-task-anchor-done';
    doneBtn.setAttribute('aria-label', 'Mark task as done');
    doneBtn.textContent = '\u2713 Done';
    doneBtn.addEventListener('click', () => {
      try {
        chrome.runtime.sendMessage({ type: 'COMPLETE_TASK' }).catch(err => {
          console.warn('[LoveSpark Task Anchor] complete:', err);
        });
      } catch (err) {
        console.warn('[LoveSpark Task Anchor] complete:', err);
      }
    });
    banner.appendChild(doneBtn);

    const closeBtn = document.createElement('button');
    closeBtn.className = 'ls-task-anchor-close';
    closeBtn.setAttribute('aria-label', 'Dismiss reminder');
    closeBtn.textContent = '\u00D7';
    closeBtn.addEventListener('click', () => {
      dismissed = true;
      hide();
    });
    banner.appendChild(closeBtn);

    document.body.appendChild(banner);
    return banner;
  }

  function show(task, position, autoHide) {
    if (dismissed || !task) return;

    const banner = buildBanner();
    const textEl = banner.querySelector('.ls-task-anchor-text');
    if (textEl) textEl.textContent = task;

    // Position
    banner.classList.remove('ls-task-anchor-top', 'ls-task-anchor-bottom');
    banner.classList.add('ls-task-anchor-' + (position || 'top'));

    // Animate in
    requestAnimationFrame(() => {
      banner.classList.add('ls-task-anchor-visible');
    });

    // Auto-hide
    if (autoHideTimer) {
      clearTimeout(autoHideTimer);
      autoHideTimer = null;
    }
    if (autoHide > 0) {
      autoHideTimer = setTimeout(hide, autoHide * 1000);
    }

    // Send nudge stat (once per page load)
    if (!nudgeSent) {
      nudgeSent = true;
      try {
        chrome.runtime.sendMessage({ type: 'NUDGE_SHOWN' }).catch(() => {});
      } catch (err) {
        // SW may be asleep — non-critical
      }
    }
  }

  function hide() {
    const banner = getBanner();
    if (banner) {
      banner.classList.remove('ls-task-anchor-visible');
    }
    if (autoHideTimer) {
      clearTimeout(autoHideTimer);
      autoHideTimer = null;
    }
  }

  // Initial load
  try {
    const data = await chrome.storage.local.get(['currentTask', 'isEnabled', 'bannerPosition', 'autoHide']);
    if (data.isEnabled !== false && data.currentTask) {
      show(data.currentTask, data.bannerPosition, data.autoHide || 0);
    }
  } catch (err) {
    console.warn('[LoveSpark Task Anchor] init:', err);
  }

  // React to storage changes
  chrome.storage.onChanged.addListener((changes) => {
    const relevant = changes.currentTask || changes.isEnabled || changes.bannerPosition || changes.autoHide;
    if (!relevant) return;

    // Reset dismiss if task changed
    if (changes.currentTask) {
      dismissed = false;
      nudgeSent = false;
    }

    chrome.storage.local.get(['currentTask', 'isEnabled', 'bannerPosition', 'autoHide']).then(data => {
      if (data.isEnabled === false || !data.currentTask) {
        hide();
        return;
      }
      show(data.currentTask, data.bannerPosition, data.autoHide || 0);
    }).catch(err => console.warn('[LoveSpark Task Anchor] update:', err));
  });
})();
