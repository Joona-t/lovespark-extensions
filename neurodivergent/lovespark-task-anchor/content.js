'use strict';

(function taskAnchorContentScript() {
  const BANNER_ID = 'ls-task-anchor-banner';
  const CLOSE_ID = 'ls-task-anchor-close';
  const TEXT_ID = 'ls-task-anchor-text';
  let autoHideTimer = null;
  let dismissed = false;
  let nudgeCounted = false;

  function createBanner() {
    if (document.getElementById(BANNER_ID)) return document.getElementById(BANNER_ID);

    const banner = document.createElement('div');
    banner.id = BANNER_ID;
    banner.setAttribute('role', 'status');
    banner.setAttribute('aria-label', 'Current task reminder');
    banner.setAttribute('aria-live', 'polite');

    const icon = document.createElement('span');
    icon.className = 'ls-task-anchor-icon';
    icon.textContent = '\ud83d\udccc';
    icon.setAttribute('aria-hidden', 'true');

    const textSpan = document.createElement('span');
    textSpan.id = TEXT_ID;
    textSpan.className = 'ls-task-anchor-text';

    const closeBtn = document.createElement('button');
    closeBtn.id = CLOSE_ID;
    closeBtn.className = 'ls-task-anchor-close';
    closeBtn.setAttribute('aria-label', 'Dismiss task banner');
    closeBtn.title = 'Dismiss';
    closeBtn.textContent = '\u00d7';

    banner.appendChild(icon);
    banner.appendChild(textSpan);
    banner.appendChild(closeBtn);
    document.body.appendChild(banner);

    closeBtn.addEventListener('click', () => {
      dismissed = true;
      hideBanner();
    });

    return banner;
  }

  function showBanner(task, position, autoHide) {
    if (dismissed) return;
    if (!task) return;

    const banner = createBanner();
    const textEl = document.getElementById(TEXT_ID);
    textEl.textContent = task;

    // Position
    banner.classList.remove('ls-task-anchor-top', 'ls-task-anchor-bottom');
    banner.classList.add('ls-task-anchor-' + (position || 'top'));

    // Show with animation
    banner.classList.add('ls-task-anchor-visible');

    // Count nudge only once per page load
    if (!nudgeCounted) {
      nudgeCounted = true;
      chrome.runtime.sendMessage({ type: 'NUDGE_SHOWN' }).catch(() => {});
    }

    // Auto-hide
    clearTimeout(autoHideTimer);
    if (autoHide && autoHide > 0) {
      autoHideTimer = setTimeout(hideBanner, autoHide * 1000);
    }
  }

  function hideBanner() {
    const banner = document.getElementById(BANNER_ID);
    if (banner) {
      banner.classList.remove('ls-task-anchor-visible');
    }
  }

  function removeBanner() {
    const banner = document.getElementById(BANNER_ID);
    if (banner) banner.remove();
  }

  function loadAndShow() {
    chrome.storage.local.get(['currentTask', 'isEnabled', 'bannerPosition', 'autoHide'], (data) => {
      if (chrome.runtime.lastError) return;

      if (data.isEnabled === false || !data.currentTask) {
        removeBanner();
        return;
      }

      showBanner(data.currentTask, data.bannerPosition, data.autoHide);
    });
  }

  // Listen for changes to task or settings
  chrome.storage.onChanged.addListener((changes) => {
    const relevant = ['currentTask', 'isEnabled', 'bannerPosition', 'autoHide'];
    if (relevant.some(key => key in changes)) {
      dismissed = false;
      loadAndShow();
    }
  });

  // Initial load
  loadAndShow();
})();
