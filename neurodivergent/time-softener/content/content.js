'use strict';

(async function timeSoftener() {
  const data = await browser.storage.local.get(['enabled', 'sites', 'pauseDuration', 'cooldownMinutes']);
  if (data.enabled === false) return;

  const hostname = location.hostname.replace(/^www\./, '');
  const sites = data.sites || [];
  const matched = sites.some(function(s) { return hostname === s || hostname.endsWith('.' + s); });
  if (!matched) return;

  const cooldownKey = 'ts_cooldown_' + hostname;
  const cooldownData = await browser.storage.local.get(cooldownKey);
  const lastShown = cooldownData[cooldownKey] || 0;
  const cooldownMs = (data.cooldownMinutes || 15) * 60 * 1000;

  if (Date.now() - lastShown < cooldownMs) return;

  const pauseSec = data.pauseDuration || 5;
  const mascotUrl = browser.runtime.getURL('mascot.png');

  const MESSAGES = [
    'Hey, just checking in.',
    'Take a breath before diving in.',
    'Is this where you meant to be?',
    'You have the power to choose.',
    'A moment of pause, just for you.',
    'No judgement \u2014 just a gentle nudge.',
  ];
  const msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

  // Build overlay using safe DOM methods
  var overlay = document.createElement('div');
  overlay.id = 'time-softener-overlay';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-label', 'Time Softener pause screen');

  var card = document.createElement('div');
  card.className = 'ts-card';

  var mascot = document.createElement('img');
  mascot.src = mascotUrl;
  mascot.alt = 'Sparky';
  mascot.className = 'ts-mascot';
  mascot.width = 64;
  mascot.height = 64;

  var ring = document.createElement('div');
  ring.className = 'ts-breathing-ring';

  var msgEl = document.createElement('p');
  msgEl.className = 'ts-message';
  msgEl.textContent = msg;

  var timerEl = document.createElement('p');
  timerEl.className = 'ts-timer';
  timerEl.textContent = 'Pause for ';
  var countdownEl = document.createElement('span');
  countdownEl.id = 'ts-countdown';
  countdownEl.textContent = pauseSec;
  timerEl.appendChild(countdownEl);
  var timerSuffix = document.createTextNode('s');
  timerEl.appendChild(timerSuffix);

  var actions = document.createElement('div');
  actions.className = 'ts-actions';

  var continueBtn = document.createElement('button');
  continueBtn.className = 'ts-btn ts-btn-continue';
  continueBtn.id = 'ts-continue';
  continueBtn.disabled = true;
  continueBtn.textContent = 'Continue browsing';

  var leaveBtn = document.createElement('button');
  leaveBtn.className = 'ts-btn ts-btn-leave';
  leaveBtn.id = 'ts-leave';
  leaveBtn.textContent = 'Switch to intention';

  actions.appendChild(continueBtn);
  actions.appendChild(leaveBtn);

  var brand = document.createElement('p');
  brand.className = 'ts-brand';
  brand.textContent = 'Time-Softener by LoveSpark';

  card.appendChild(mascot);
  card.appendChild(ring);
  card.appendChild(msgEl);
  card.appendChild(timerEl);
  card.appendChild(actions);
  card.appendChild(brand);
  overlay.appendChild(card);

  document.documentElement.appendChild(overlay);
  document.documentElement.style.overflow = 'hidden';

  var remaining = pauseSec;
  var countdownStart = Date.now();
  var countdownActive = true;

  // Drift-corrected countdown: recompute remaining from wall-clock elapsed
  // time on each tick rather than blindly decrementing, so a throttled/
  // backgrounded tab (MV3 content scripts can still be deprioritized) never
  // leaves the countdown stuck behind — it self-corrects the moment it runs.
  function countdownTick() {
    if (!countdownActive) return;
    var elapsedSec = Math.floor((Date.now() - countdownStart) / 1000);
    var next = Math.max(0, pauseSec - elapsedSec);
    if (next !== remaining) {
      remaining = next;
      countdownEl.textContent = remaining;
    }
    if (remaining <= 0) {
      countdownActive = false;
      continueBtn.disabled = false;
      continueBtn.classList.add('ts-ready');
      timerEl.textContent = 'Ready when you are';
      return;
    }
    setTimeout(countdownTick, 250);
  }
  setTimeout(countdownTick, 250);

  function dismiss() {
    countdownActive = false;
    overlay.classList.add('ts-fade-out');
    document.documentElement.style.overflow = '';
    setTimeout(function() { overlay.remove(); }, 300);
    browser.storage.local.set({ [cooldownKey]: Date.now() });
    browser.runtime.sendMessage({ type: 'SOFTENED' });
  }

  continueBtn.addEventListener('click', dismiss);

  leaveBtn.addEventListener('click', function() {
    dismiss();
    if (document.referrer && new URL(document.referrer).hostname !== hostname) {
      history.back();
    } else {
      window.close();
    }
  });

  document.addEventListener('keydown', function escHandler(e) {
    if (e.key === 'Escape' && remaining <= 0) {
      dismiss();
      document.removeEventListener('keydown', escHandler);
    }
  });
})();
