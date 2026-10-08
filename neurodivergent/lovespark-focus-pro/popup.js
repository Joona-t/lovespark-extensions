// LoveSpark Focus Pro — popup.js
// ALL DOM building uses createElement + textContent. Safe DOM API only.
'use strict';

// ── Constants ────────────────────────────────────────────────────────────────

const CIRCUMFERENCE = 2 * Math.PI * 52; // 326.73

const SESSION_LABELS = {
  focus: 'F O C U S',
  shortBreak: 'S H O R T  B R E A K',
  longBreak: 'L O N G  B R E A K',
};

const RING_GRADIENTS = {
  focus: 'url(#pinkGrad)',
  shortBreak: 'url(#purpleGrad)',
  longBreak: 'url(#tealGrad)',
};

const FREE_SITE_LIMIT = 3;

// ── DOM refs ─────────────────────────────────────────────────────────────────

const countdown = document.getElementById('countdown');
const ringProgress = document.getElementById('ring-progress');
const sessionLabel = document.getElementById('fp-session-label');
const btnStart = document.getElementById('btn-start');
const btnPause = document.getElementById('btn-pause');
const btnReset = document.getElementById('btn-reset');
const dotsRow = document.querySelector('.dots-row');
const statSessions = document.getElementById('stat-sessions');
const statMinutes = document.getElementById('stat-minutes');
const statStreak = document.getElementById('stat-streak');
const blockInput = document.getElementById('block-input');
const btnAddBlock = document.getElementById('btn-add-block');
const blockList = document.getElementById('block-list');
const blockLimitHint = document.getElementById('block-limit');
const upgradeLink = document.getElementById('upgrade-link');
const sparklesEl = document.getElementById('sparkles');
const sparkyEl = document.getElementById('sparky');
const tabs = document.querySelectorAll('.tab');
const soundBtns = document.querySelectorAll('.sound-btn');
const volumeSlider = document.getElementById('volume-slider');
const soundsSection = document.querySelector('.sounds-section');
const soundsProBadge = document.getElementById('sounds-pro-badge');
const proCta = document.getElementById('pro-cta');
const btnUpgrade = document.getElementById('btn-upgrade');

// ── State ────────────────────────────────────────────────────────────────────

let timerData = {};
let tickInterval = null;
let lastSessionType = null;
let lastTimerState = null;
let isPro = false;

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(seconds) {
  const s = Math.max(0, seconds);
  const mm = String(Math.floor(s / 60)).padStart(2, '0');
  const ss = String(s % 60).padStart(2, '0');
  return mm + ':' + ss;
}

function getDurationSeconds(data) {
  const key = {
    focus: 'focusDuration',
    shortBreak: 'shortBreakDuration',
    longBreak: 'longBreakDuration',
  }[data.sessionType] || 'focusDuration';
  return (data[key] || 25) * 60;
}

function getRemainingSeconds(data) {
  if (data.timerState === 'running' && data.endTime) {
    return Math.max(0, Math.ceil((data.endTime - Date.now()) / 1000));
  }
  if (data.timerState === 'paused' && data.remainingSeconds != null) {
    return data.remainingSeconds;
  }
  return getDurationSeconds(data);
}

async function safeSendMessage(msg) {
  try {
    return await chrome.runtime.sendMessage(msg);
  } catch (err) {
    console.warn('Focus Pro: sendMessage failed, retrying...', err.message);
    await new Promise(r => setTimeout(r, 500));
    try {
      return await chrome.runtime.sendMessage(msg);
    } catch (retryErr) {
      console.error('Focus Pro: sendMessage retry failed', retryErr.message);
      return null;
    }
  }
}

// Animated counter — rolls number up from current to target
function animateCount(el, target, suffix) {
  const current = parseInt(el.textContent, 10) || 0;
  if (current === target) {
    if (suffix) el.textContent = target + suffix;
    return;
  }
  const diff = target - current;
  const steps = Math.min(Math.abs(diff), 15);
  const stepSize = diff / steps;
  let step = 0;

  function tick() {
    step++;
    const val = step >= steps ? target : Math.round(current + stepSize * step);
    el.textContent = val + (suffix || '');
    if (step < steps) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}

// ── Ring update ──────────────────────────────────────────────────────────────

function updateRing(remaining, total) {
  const progress = total > 0 ? remaining / total : 1;
  const offset = CIRCUMFERENCE * (1 - progress);
  ringProgress.style.strokeDashoffset = offset;

  const sessionType = timerData.sessionType || 'focus';
  ringProgress.style.stroke = RING_GRADIENTS[sessionType] || RING_GRADIENTS.focus;
}

// ── UI render ────────────────────────────────────────────────────────────────

function render() {
  const data = timerData;
  const sessionType = data.sessionType || 'focus';
  const state = data.timerState || 'idle';
  const total = getDurationSeconds(data);
  const remaining = getRemainingSeconds(data);

  // Countdown
  countdown.textContent = formatTime(remaining);

  // Ring
  updateRing(remaining, total);

  // Session label
  sessionLabel.textContent = SESSION_LABELS[sessionType] || 'F O C U S';
  sessionLabel.className = 'session-label';
  if (sessionType === 'shortBreak') sessionLabel.classList.add('break');
  if (sessionType === 'longBreak') sessionLabel.classList.add('long');

  // Buttons
  if (state === 'running') {
    btnStart.hidden = true;
    btnPause.hidden = false;
    btnReset.hidden = false;
  } else if (state === 'paused') {
    btnStart.hidden = false;
    btnStart.textContent = 'Resume';
    btnPause.hidden = true;
    btnReset.hidden = false;
  } else {
    btnStart.hidden = false;
    btnStart.textContent = 'Start Focus';
    btnPause.hidden = true;
    btnReset.hidden = true;
  }

  // Session dots
  const cyclePos = data.currentCyclePosition || 0;
  const dots = dotsRow.querySelectorAll('.dot');
  dots.forEach(function(dot, i) {
    dot.classList.toggle('filled', i < cyclePos);
  });

  // Stats
  animateCount(statSessions, data.sessionsToday || 0, '');
  const mins = data.focusMinutesToday || 0;
  if (mins >= 60) {
    statMinutes.textContent = (mins / 60).toFixed(1) + 'h';
  } else {
    animateCount(statMinutes, mins, ' min');
  }
  animateCount(statStreak, data.currentStreak || 0, ' days');

  // Active tab
  tabs.forEach(function(tab) {
    const isActive = tab.dataset.type === sessionType;
    tab.classList.toggle('active', isActive);
    tab.setAttribute('aria-checked', isActive ? 'true' : 'false');
  });

  // Sparky reactions
  if (sparkyEl) {
    sparkyEl.className = 'sparky';
    if (state === 'running' && sessionType === 'focus') {
      sparkyEl.classList.add('sparky-focusing');
    } else if (state === 'running' && sessionType === 'shortBreak') {
      sparkyEl.classList.add('sparky-break');
    } else if (state === 'running' && sessionType === 'longBreak') {
      sparkyEl.classList.add('sparky-longbreak');
    }
  }

  // Detect session type change for sparkle effect
  if (lastSessionType !== null && lastSessionType !== sessionType &&
      lastTimerState !== 'idle') {
    triggerSparkles();
  }
  lastSessionType = sessionType;
  lastTimerState = state;
}

// ── Tick (1s polling while running) ──────────────────────────────────────────

function sendBadgeUpdate() {
  if (timerData.timerState !== 'running' || !timerData.endTime) return;
  const remaining = Math.max(0, Math.ceil((timerData.endTime - Date.now()) / 1000));
  const mm = Math.floor(remaining / 60);
  chrome.runtime.sendMessage({
    action: 'UPDATE_BADGE',
    text: remaining > 0 ? mm + 'm' : '',
    sessionType: timerData.sessionType,
  }).catch(function() {});
}

function startTick() {
  stopTick();
  tickInterval = setInterval(function() {
    render();
    sendBadgeUpdate();
  }, 1000);
}

function stopTick() {
  if (tickInterval) {
    clearInterval(tickInterval);
    tickInterval = null;
  }
}

// ── Sparkle animation ────────────────────────────────────────────────────────

function triggerSparkles() {
  var chars = ['*', '+', '*', '+', '*'];
  chars.forEach(function(char, i) {
    setTimeout(function() {
      var el = document.createElement('span');
      el.className = 'sparkle-char';
      el.textContent = char;
      el.style.left = (20 + Math.random() * 60) + '%';
      el.style.bottom = (20 + Math.random() * 40) + '%';
      sparklesEl.appendChild(el);
      el.addEventListener('animationend', function() { el.remove(); });
    }, i * 120);
  });
}

// ── Blocked sites rendering ──────────────────────────────────────────────────

function renderBlockedSites(sites) {
  // Clear existing list using DOM methods
  while (blockList.firstChild) {
    blockList.removeChild(blockList.firstChild);
  }

  for (var i = 0; i < sites.length; i++) {
    var site = sites[i];
    var li = document.createElement('li');
    li.className = 'block-item';

    var domainSpan = document.createElement('span');
    domainSpan.className = 'block-item-domain';
    domainSpan.textContent = site;
    li.appendChild(domainSpan);

    var removeBtn = document.createElement('button');
    removeBtn.className = 'block-remove-btn';
    removeBtn.textContent = '\u00D7'; // multiplication sign (x)
    removeBtn.setAttribute('aria-label', 'Remove ' + site + ' from block list');
    removeBtn.dataset.site = site;
    removeBtn.addEventListener('click', handleRemoveSite);
    li.appendChild(removeBtn);

    blockList.appendChild(li);
  }

  // Update limit hint visibility
  if (isPro) {
    blockLimitHint.style.display = 'none';
  } else {
    blockLimitHint.style.display = '';
    // Update text based on remaining slots
    var remaining = FREE_SITE_LIMIT - sites.length;
    if (remaining <= 0) {
      blockLimitHint.textContent = '';
      var limitText = document.createTextNode('Limit reached \u2014 ');
      blockLimitHint.appendChild(limitText);
      var link = document.createElement('a');
      link.href = '#';
      link.id = 'upgrade-link';
      link.textContent = 'Unlock unlimited';
      link.addEventListener('click', handleUpgradeClick);
      blockLimitHint.appendChild(link);
    } else {
      blockLimitHint.textContent = '';
      var slotText = document.createTextNode(remaining + ' of ' + FREE_SITE_LIMIT + ' free slots \u2014 ');
      blockLimitHint.appendChild(slotText);
      var link2 = document.createElement('a');
      link2.href = '#';
      link2.id = 'upgrade-link';
      link2.textContent = 'Unlock unlimited';
      link2.addEventListener('click', handleUpgradeClick);
      blockLimitHint.appendChild(link2);
    }
  }
}

async function handleRemoveSite(e) {
  var site = e.currentTarget.dataset.site;
  var result = await safeSendMessage({ action: 'REMOVE_BLOCKED_SITE', site: site });
  if (result && result.ok) {
    renderBlockedSites(result.sites);
  }
}

async function handleAddSite() {
  var site = blockInput.value.trim();
  if (!site) return;

  var result = await safeSendMessage({ action: 'ADD_BLOCKED_SITE', site: site });
  if (result && result.ok) {
    blockInput.value = '';
    renderBlockedSites(result.sites);
  } else if (result && result.error === 'free_limit') {
    // Flash the upgrade hint
    blockLimitHint.style.color = 'var(--ls-pink-accent)';
    setTimeout(function() {
      blockLimitHint.style.color = '';
    }, 2000);
  }
}

function handleUpgradeClick(e) {
  e.preventDefault();
  // Stub: will open ExtensionPay payment flow
  // For now, scroll to the pro CTA
  if (proCta) proCta.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

// ── Sound buttons ────────────────────────────────────────────────────────────

function updateSoundButtons() {
  var activeType = AmbientSounds.getActiveType();
  soundBtns.forEach(function(btn) {
    btn.classList.toggle('active', btn.dataset.sound === activeType);
  });
}

function handleSoundClick(e) {
  var type = e.currentTarget.dataset.sound;

  if (!isPro) {
    // Flash pro badge
    if (soundsProBadge) {
      soundsProBadge.style.transform = 'scale(1.3)';
      setTimeout(function() { soundsProBadge.style.transform = ''; }, 300);
    }
    return;
  }

  if (AmbientSounds.getActiveType() === type) {
    // Toggle off
    AmbientSounds.stop();
    chrome.storage.local.set({ activeSound: null });
  } else {
    AmbientSounds.play(type);
    chrome.storage.local.set({ activeSound: type });
  }
  updateSoundButtons();
}

function handleVolumeChange() {
  var vol = parseInt(volumeSlider.value, 10);
  AmbientSounds.setVolume(vol);
  chrome.storage.local.set({ soundVolume: vol });
}

// ── Pro status ───────────────────────────────────────────────────────────────

function applyProStatus(pro) {
  isPro = !!pro;

  if (isPro) {
    // Unlock everything
    if (soundsSection) soundsSection.classList.remove('locked');
    if (soundsProBadge) soundsProBadge.style.display = 'none';
    if (proCta) proCta.classList.add('hidden');
    if (blockLimitHint) blockLimitHint.style.display = 'none';
  } else {
    // Lock pro features
    if (soundsSection) soundsSection.classList.add('locked');
    if (soundsProBadge) soundsProBadge.style.display = '';
    if (proCta) proCta.classList.remove('hidden');
  }
}

// ── Load state ───────────────────────────────────────────────────────────────

async function loadState() {
  var result = await safeSendMessage({ action: 'GET_STATE' });
  if (!result) return;

  timerData = result;

  // Apply pro status
  applyProStatus(result.proStatus);

  // Render timer
  render();

  // Render blocked sites
  renderBlockedSites(result.blockedSites || []);

  // Restore sound state
  if (result.soundVolume != null) {
    volumeSlider.value = result.soundVolume;
    AmbientSounds.setVolume(result.soundVolume);
  }

  // If a sound was playing, restart it (popup re-open)
  if (isPro && result.activeSound) {
    AmbientSounds.play(result.activeSound);
    updateSoundButtons();
  }

  // Start tick if running
  if (result.timerState === 'running') {
    startTick();
    sendBadgeUpdate();
  }
}

// ── Event handlers ───────────────────────────────────────────────────────────

// Start button
btnStart.addEventListener('click', async function() {
  await safeSendMessage({ action: 'START_FOCUS' });
  var result = await safeSendMessage({ action: 'GET_STATE' });
  if (result) {
    timerData = result;
    render();
    startTick();
  }
});

// Pause button
btnPause.addEventListener('click', async function() {
  await safeSendMessage({ action: 'PAUSE_FOCUS' });
  var result = await safeSendMessage({ action: 'GET_STATE' });
  if (result) {
    timerData = result;
    render();
    stopTick();
  }
});

// Reset button
btnReset.addEventListener('click', async function() {
  stopTick();
  AmbientSounds.stop();
  updateSoundButtons();
  chrome.storage.local.set({ activeSound: null });
  await safeSendMessage({ action: 'RESET_FOCUS' });
  var result = await safeSendMessage({ action: 'GET_STATE' });
  if (result) {
    timerData = result;
    render();
  }
});

// Session type tabs (only in idle)
tabs.forEach(function(tab) {
  tab.addEventListener('click', async function() {
    if (timerData.timerState !== 'idle') return;
    var type = tab.dataset.type;
    await safeSendMessage({ action: 'SET_SESSION_TYPE', sessionType: type });
    timerData.sessionType = type;
    render();
  });
});

// Block site input
btnAddBlock.addEventListener('click', handleAddSite);
blockInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') handleAddSite();
});

// Sound buttons
soundBtns.forEach(function(btn) {
  btn.addEventListener('click', handleSoundClick);
});

// Volume slider
volumeSlider.addEventListener('input', handleVolumeChange);

// Upgrade button (stub)
if (btnUpgrade) {
  btnUpgrade.addEventListener('click', function() {
    // Stub: will open ExtensionPay payment flow
    // For now, open a placeholder
    chrome.tabs.create({ url: 'https://lovespark.love/focus-pro' });
  });
}

// Upgrade link in block section
if (upgradeLink) {
  upgradeLink.addEventListener('click', handleUpgradeClick);
}

// ── Storage change listener ──────────────────────────────────────────────────

chrome.storage.onChanged.addListener(function(changes, area) {
  if (area !== 'local') return;
  var needsRefresh = false;

  var watchKeys = [
    'timerState', 'sessionType', 'endTime', 'remainingSeconds',
    'currentCyclePosition', 'sessionsToday', 'focusMinutesToday',
    'currentStreak', 'blockedSites', 'proStatus'
  ];

  for (var i = 0; i < watchKeys.length; i++) {
    var key = watchKeys[i];
    if (changes[key]) {
      timerData[key] = changes[key].newValue;
      needsRefresh = true;
    }
  }

  // Pro status change
  if (changes.proStatus) {
    applyProStatus(changes.proStatus.newValue);
  }

  // Blocked sites change
  if (changes.blockedSites) {
    renderBlockedSites(changes.blockedSites.newValue || []);
  }

  // Sparky celebration on session complete
  if (changes.timerState &&
      changes.timerState.newValue === 'idle' &&
      changes.timerState.oldValue === 'running' &&
      sparkyEl) {
    sparkyEl.classList.add('sparky-complete');
    sparkyEl.addEventListener('animationend', function() {
      sparkyEl.classList.remove('sparky-complete');
    }, { once: true });
    triggerSparkles();
  }

  if (needsRefresh) {
    render();
    if (timerData.timerState === 'running') startTick();
    else stopTick();
  }
});

// ── Footer ───────────────────────────────────────────────────────────────────

(function renderFooter() {
  var mount = document.getElementById('footer-mount');
  if (!mount || typeof LoveSparkFooter === 'undefined') return;

  // Build footer with safe DOM API
  var footer = document.createElement('footer');
  footer.className = 'ls-footer';

  var suiteLabel = document.createElement('span');
  suiteLabel.className = 'ls-footer-suite';
  suiteLabel.textContent = 'LoveSpark Suite \u{1F495}';
  footer.appendChild(suiteLabel);

  var kofiLink = document.createElement('a');
  kofiLink.href = 'https://ko-fi.com/joonat';
  kofiLink.target = '_blank';
  kofiLink.rel = 'noopener noreferrer';
  kofiLink.className = 'ls-kofi-btn';
  kofiLink.textContent = '\u2615 Support on Ko-fi';
  footer.appendChild(kofiLink);

  var bugLink = document.createElement('a');
  bugLink.href = 'mailto:joona@lovespark.love?subject=Bug Report';
  bugLink.className = 'ls-bug-btn';
  bugLink.textContent = '\u{1F41E} Report a Bug';
  footer.appendChild(bugLink);

  var credit = document.createElement('span');
  credit.className = 'ls-footer-credit';
  credit.textContent = 'LoveSpark by Joona Tyrninoksa \u00B7 Crafted with intention \u{1F495}';
  footer.appendChild(credit);

  mount.appendChild(footer);
})();

// ── Theme init ───────────────────────────────────────────────────────────────

if (typeof LoveSparkTheme !== 'undefined') {
  LoveSparkTheme.init();
}

// ── Init ─────────────────────────────────────────────────────────────────────

loadState();
