'use strict';

/* ── Guard: don't run on restricted pages ──────────────── */

if (window.location.protocol !== 'chrome:' &&
    window.location.protocol !== 'chrome-extension:' &&
    window.location.protocol !== 'about:' &&
    window.location.protocol !== 'edge:') {

  const LS_BADGE_ID = 'lovespark-gentle-timer-badge';
  const LS_BANNER_ID = 'lovespark-gentle-timer-banner';

  const NUDGE_MESSAGES = [
    'Hey, you\'ve been here a while \u2764\ufe0f',
    'Maybe a quick stretch?',
    'Just checking in \u2728',
    'Time flies! Take a breath \ud83c\udf38',
    'You\'re doing great \u2014 maybe a pause?'
  ];

  const BREAK_LABELS = {
    water: '\ud83d\udca7 Time for water!',
    food: '\ud83c\udf55 Time for a snack or meal!',
    movement: '\ud83c\udfc3 Time to move your body!'
  };

  let currentSeconds = 0;
  let nudgeShown = false;
  let badgeVisible = true;
  let badgeCollapsed = false;
  let nudgeThreshold = 30; // minutes, updated from settings

  /* ── Build floating badge ─────────────────────────────── */

  function buildBadge() {
    if (document.getElementById(LS_BADGE_ID)) return;

    const badge = document.createElement('div');
    badge.id = LS_BADGE_ID;
    badge.setAttribute('role', 'status');
    badge.setAttribute('aria-label', 'Time spent on this site');
    badge.setAttribute('aria-live', 'polite');

    const timeText = document.createElement('span');
    timeText.className = 'ls-timer-text';
    timeText.textContent = '0m';

    const domainText = document.createElement('span');
    domainText.className = 'ls-timer-domain';
    domainText.textContent = ' on ' + window.location.hostname.replace(/^www\./, '');

    badge.appendChild(timeText);
    badge.appendChild(domainText);

    badge.addEventListener('click', () => {
      badgeCollapsed = !badgeCollapsed;
      if (badgeCollapsed) {
        badge.classList.add('ls-collapsed');
        badge.setAttribute('aria-label', 'Time badge collapsed. Click to expand.');
      } else {
        badge.classList.remove('ls-collapsed');
        badge.setAttribute('aria-label', 'Time spent on this site');
      }
    });

    badge.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        badge.click();
      }
    });

    badge.setAttribute('tabindex', '0');
    document.body.appendChild(badge);
  }

  /* ── Update badge display ─────────────────────────────── */

  function updateBadge(seconds) {
    const badge = document.getElementById(LS_BADGE_ID);
    if (!badge) return;

    const mins = Math.floor(seconds / 60);
    const timeText = badge.querySelector('.ls-timer-text');
    if (timeText) {
      timeText.textContent = mins > 0 ? mins + 'm' : '<1m';
    }

    // Color gradient based on time
    badge.classList.remove('ls-time-green', 'ls-time-yellow', 'ls-time-pink');
    if (mins < 15) {
      badge.classList.add('ls-time-green');
    } else if (mins < 30) {
      badge.classList.add('ls-time-yellow');
    } else {
      badge.classList.add('ls-time-pink');
    }

    // Nudge check
    if (!nudgeShown && mins >= nudgeThreshold) {
      nudgeShown = true;
      showNudge();
    }
  }

  /* ── Nudge message ────────────────────────────────────── */

  function showNudge() {
    const msg = NUDGE_MESSAGES[Math.floor(Math.random() * NUDGE_MESSAGES.length)];

    const nudge = document.createElement('div');
    nudge.className = 'ls-gentle-nudge';
    nudge.setAttribute('role', 'status');
    nudge.setAttribute('aria-live', 'polite');
    nudge.textContent = msg;

    document.body.appendChild(nudge);

    // Force reflow then add visible class
    nudge.offsetHeight; // eslint-disable-line no-unused-expressions
    nudge.classList.add('ls-nudge-visible');

    setTimeout(() => {
      nudge.classList.remove('ls-nudge-visible');
      nudge.classList.add('ls-nudge-hiding');
      setTimeout(() => {
        if (nudge.parentNode) nudge.parentNode.removeChild(nudge);
      }, 500);
    }, 5000);
  }

  /* ── Break reminder banner ────────────────────────────── */

  function showBreakBanner(breakType) {
    // Don't stack banners of the same type
    const existing = document.querySelector('.ls-break-banner[data-break="' + breakType + '"]');
    if (existing) return;

    const banner = document.createElement('div');
    banner.className = 'ls-break-banner';
    banner.dataset.break = breakType;
    banner.setAttribute('role', 'alert');
    banner.setAttribute('aria-live', 'assertive');

    const label = document.createElement('span');
    label.className = 'ls-break-label';
    label.textContent = BREAK_LABELS[breakType] || 'Break time!';

    const actions = document.createElement('span');
    actions.className = 'ls-break-actions';

    const doneBtn = document.createElement('button');
    doneBtn.className = 'ls-break-btn ls-break-done';
    doneBtn.textContent = 'Done!';
    doneBtn.setAttribute('aria-label', 'Mark ' + breakType + ' break as done');
    doneBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'MARK_BREAK', breakType: breakType });
      removeBanner(banner);
    });

    const dismissBtn = document.createElement('button');
    dismissBtn.className = 'ls-break-btn ls-break-dismiss';
    dismissBtn.textContent = 'Later';
    dismissBtn.setAttribute('aria-label', 'Dismiss ' + breakType + ' reminder');
    dismissBtn.addEventListener('click', () => {
      chrome.runtime.sendMessage({ type: 'DISMISS_BREAK', breakType: breakType });
      removeBanner(banner);
    });

    actions.appendChild(doneBtn);
    actions.appendChild(dismissBtn);
    banner.appendChild(label);
    banner.appendChild(actions);
    document.body.appendChild(banner);

    // Animate in
    banner.offsetHeight; // eslint-disable-line no-unused-expressions
    banner.classList.add('ls-banner-visible');
  }

  function removeBanner(banner) {
    banner.classList.remove('ls-banner-visible');
    banner.classList.add('ls-banner-hiding');
    setTimeout(() => {
      if (banner.parentNode) banner.parentNode.removeChild(banner);
    }, 400);
  }

  /* ── Listen for messages from background ──────────────── */

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'TIME_UPDATE') {
      currentSeconds = msg.seconds;
      updateBadge(currentSeconds);
    }

    if (msg.type === 'BREAK_REMINDER') {
      showBreakBanner(msg.breakType);
    }
  });

  /* ── Init ────────────────────────────────────────────── */

  function init() {
    // Get settings and current time
    chrome.runtime.sendMessage({
      type: 'GET_CURRENT_TIME',
      domain: window.location.hostname.replace(/^www\./, '')
    }, (response) => {
      if (chrome.runtime.lastError) return; // extension context invalid
      if (!response) return;

      currentSeconds = response.seconds || 0;

      // Get settings to know if badge should be shown
      chrome.storage.local.get(['settings'], (data) => {
        if (chrome.runtime.lastError) return;
        const settings = data.settings || {};
        badgeVisible = settings.showBadge !== false;
        nudgeThreshold = settings.nudgeThreshold || 30;

        if (badgeVisible) {
          buildBadge();
          updateBadge(currentSeconds);
        }
      });
    });

    // Check for pending break reminders
    chrome.storage.local.get(['breakDue_water', 'breakDue_food', 'breakDue_movement'], (data) => {
      if (chrome.runtime.lastError) return;
      if (data.breakDue_water) showBreakBanner('water');
      if (data.breakDue_food) showBreakBanner('food');
      if (data.breakDue_movement) showBreakBanner('movement');
    });
  }

  // Wait for body to be ready
  if (document.body) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }

  // Listen for settings changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.settings) {
      const s = changes.settings.newValue || {};
      nudgeThreshold = s.nudgeThreshold || 30;
      const shouldShow = s.showBadge !== false;

      if (shouldShow && !badgeVisible) {
        badgeVisible = true;
        buildBadge();
        updateBadge(currentSeconds);
      } else if (!shouldShow && badgeVisible) {
        badgeVisible = false;
        const badge = document.getElementById(LS_BADGE_ID);
        if (badge && badge.parentNode) badge.parentNode.removeChild(badge);
      }
    }
  });
}
