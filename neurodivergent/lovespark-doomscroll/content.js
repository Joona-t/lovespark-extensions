// Pink Anti-Doomscroll — content.js
// NEVER write per-scroll metrics or timestamps to chrome.storage.local.
// Sync storage has a 100KB quota and write-rate limits.
// All tracking state (continuousScrollingMs, idleMs, velocity) stays in JS variables only.
// Only write discrete event counts (nudges, pauses) on state transitions.
'use strict';

// ── Default state & helpers ─────────────────────────────────────────────────

const DEFAULT_STATE = {
  enabled: true,
  sites: { 'x.com': true, 'twitter.com': true, 'reddit.com': true, 'facebook.com': true },
  mode: 'standard',
  sparkleEnabled: true,
  snoozeUntilTs: 0,
  continuousScrollMs: 45000,
  escalateMs: 90000,
  tintOpacity: 0.10,
  softenAfterIdleMs: 10000,
};

async function getState() {
  const stored = await chrome.storage.local.get(null);
  const sites = { ...DEFAULT_STATE.sites, ...(stored.sites || {}) };
  return { ...DEFAULT_STATE, ...stored, sites };
}

function todayStr() { return new Date().toISOString().slice(0, 10); }

const rawHostname = location.hostname.replace(/^www\./, '');

// ── Whisper messages ────────────────────────────────────────────────────────

const WHISPERS = [
  'Pause. Breathe.',
  'Is this still serving you?',
  'Return when you choose.',
  "You're allowed to stop. \u{1F338}",
  'Take a gentle break. \u{2728}',
  'Your eyes deserve a rest.',
  'The feed will wait for you.',
  'One deep breath. \u{1F495}',
];

// ── State ───────────────────────────────────────────────────────────────────

let state = null;
let overlayContainer = null;
let tintEl = null;
let whisperEl = null;
let gaugeEl = null;
let gaugeFillEl = null;
let mascotEl = null;

let lastScrollY = 0;
let lastScrollTs = 0;
let continuousScrollingMs = 0;
let overlayVisible = false;
let gaugeVisible = false;
let liveSparkles = 0;
let ticking = false;
let decayLoopId = 0;
let decayRunning = false;
let lastDecayTs = 0;
let overlayCooldownUntil = 0;
let didInit = false;

const MAX_SPARKLES = 12;
const MAX_SCROLL_DELTA_MS = 500;

// ── Guard ───────────────────────────────────────────────────────────────────

function shouldBeActive(s) {
  if (!s.enabled) return false;
  if (!s.sites[rawHostname]) return false;
  if (Date.now() < s.snoozeUntilTs) return false;
  return true;
}

// ── Overlay DOM ─────────────────────────────────────────────────────────────

function ensureOverlay() {
  overlayContainer = document.querySelector('[data-lovespark="doomscroll-overlay"]');
  if (overlayContainer) {
    tintEl = overlayContainer.querySelector('.ls-doomscroll-tint');
    whisperEl = overlayContainer.querySelector('.ls-doomscroll-whisper');
    gaugeEl = overlayContainer.querySelector('.ls-doomscroll-gauge');
    gaugeFillEl = overlayContainer.querySelector('.ls-doomscroll-gauge-fill');
    mascotEl = overlayContainer.querySelector('.ls-doomscroll-mascot');
    return;
  }

  overlayContainer = document.createElement('div');
  overlayContainer.setAttribute('data-lovespark', 'doomscroll-overlay');

  tintEl = document.createElement('div');
  tintEl.className = 'ls-doomscroll-tint';

  whisperEl = document.createElement('div');
  whisperEl.className = 'ls-doomscroll-whisper';

  gaugeEl = document.createElement('div');
  gaugeEl.className = 'ls-doomscroll-gauge';

  gaugeFillEl = document.createElement('div');
  gaugeFillEl.className = 'ls-doomscroll-gauge-fill';

  mascotEl = document.createElement('img');
  mascotEl.className = 'ls-doomscroll-mascot';
  mascotEl.src = chrome.runtime.getURL('media/mascot.png');
  mascotEl.alt = '';

  gaugeEl.appendChild(gaugeFillEl);
  overlayContainer.appendChild(tintEl);
  overlayContainer.appendChild(whisperEl);
  overlayContainer.appendChild(mascotEl);
  overlayContainer.appendChild(gaugeEl);

  document.documentElement.appendChild(overlayContainer);
}

// ── Stats ───────────────────────────────────────────────────────────────────

async function checkDailyReset() {
  const data = await chrome.storage.local.get(['lastResetDate']);
  const today = todayStr();
  if (data.lastResetDate !== today) {
    await chrome.storage.local.set({
      nudgesToday: 0,
      pausesToday: 0,
      lastResetDate: today,
    });
  }
}

async function bumpNudge() {
  const data = await chrome.storage.local.get(['nudgesToday', 'nudgesTotal']);
  await chrome.storage.local.set({
    nudgesToday: (data.nudgesToday || 0) + 1,
    nudgesTotal: (data.nudgesTotal || 0) + 1,
  });
}

async function bumpPause() {
  const data = await chrome.storage.local.get(['pausesToday', 'pausesTotal']);
  await chrome.storage.local.set({
    pausesToday: (data.pausesToday || 0) + 1,
    pausesTotal: (data.pausesTotal || 0) + 1,
  });
}

// ── Show / hide ─────────────────────────────────────────────────────────────

function showOverlay() {
  if (overlayVisible) return;
  if (Date.now() < overlayCooldownUntil) return;
  overlayVisible = true;
  tintEl.style.opacity = state.tintOpacity;
  whisperEl.textContent = WHISPERS[Math.floor(Math.random() * WHISPERS.length)];
  whisperEl.style.opacity = '1';
  mascotEl.classList.add('visible');
  bumpNudge();
  startDecayLoop();
}

function showGauge() {
  if (gaugeVisible) return;
  gaugeVisible = true;
  gaugeEl.style.opacity = '1';
}

function hideOverlay(fromDecay) {
  if (!overlayVisible) return;
  overlayCooldownUntil = Date.now() + 600;
  overlayVisible = false;
  gaugeVisible = false;
  tintEl.style.opacity = '0';
  whisperEl.style.opacity = '0';
  mascotEl.classList.remove('visible');
  mascotEl.style.opacity = '';
  gaugeEl.style.opacity = '0';
  gaugeFillEl.style.width = '0%';

  if (fromDecay) {
    if (state.sparkleEnabled) {
      for (let i = 0; i < 6; i++) {
        setTimeout(() => spawnSparkle(), i * 80);
      }
    }
    bumpPause();
  }
}

function resetTracking() {
  hideOverlay(false);
  continuousScrollingMs = 0;
  lastScrollY = window.scrollY;
  lastScrollTs = Date.now();
  stopDecayLoop();
}

// ── Sparkles ────────────────────────────────────────────────────────────────

function spawnSparkle() {
  if (liveSparkles >= MAX_SPARKLES || !overlayContainer) return;
  liveSparkles++;

  const sparkle = document.createElement('div');
  sparkle.className = 'ls-doomscroll-sparkle';
  sparkle.style.left = (Math.random() * 90 + 5) + '%';
  sparkle.style.top = (Math.random() * 60 + 20) + '%';

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    sparkle.remove();
    liveSparkles--;
  };

  sparkle.addEventListener('animationend', cleanup);
  setTimeout(cleanup, 2000);

  overlayContainer.appendChild(sparkle);
}

// ── rAF decay loop ──────────────────────────────────────────────────────────

function startDecayLoop() {
  if (decayRunning) return;
  decayRunning = true;
  lastDecayTs = Date.now();
  decayLoopId = requestAnimationFrame(decayTick);
}

function stopDecayLoop() {
  decayRunning = false;
  if (decayLoopId) {
    cancelAnimationFrame(decayLoopId);
    decayLoopId = 0;
  }
}

function decayTick() {
  decayLoopId = 0;
  if (!decayRunning) return;

  if (!shouldBeActive(state)) {
    resetTracking();
    return;
  }

  const now = Date.now();
  const idleMs = now - lastScrollTs;
  const decayDelta = Math.min(now - lastDecayTs, 100);
  lastDecayTs = now;

  if (idleMs >= state.softenAfterIdleMs) {
    continuousScrollingMs = Math.max(0, continuousScrollingMs - decayDelta);

    if (continuousScrollingMs > 0 && state.continuousScrollMs > 0) {
      const ratio = Math.min(continuousScrollingMs / state.continuousScrollMs, 1);
      tintEl.style.opacity = (state.tintOpacity * ratio).toFixed(4);
      whisperEl.style.opacity = ratio.toFixed(4);
      mascotEl.style.opacity = ratio.toFixed(4);
    }

    if (gaugeVisible && state.escalateMs > 0) {
      const fill = Math.min((continuousScrollingMs / state.escalateMs) * 100, 100);
      gaugeFillEl.style.width = fill + '%';
    }

    if (continuousScrollingMs <= 0) {
      hideOverlay(true);
      return;
    }
  }

  decayLoopId = requestAnimationFrame(decayTick);
}

// ── Scroll handler ──────────────────────────────────────────────────────────

function onScroll() {
  if (ticking) return;
  ticking = true;

  requestAnimationFrame(() => {
    const now = Date.now();
    const dy = Math.abs(window.scrollY - lastScrollY);

    if (dy < 4) {
      lastScrollTs = now;
      ticking = false;
      return;
    }

    const dtMs = now - lastScrollTs;

    // 1.1 fix: cap scroll contribution, decay idle gaps
    const scrollDelta = Math.min(dtMs, MAX_SCROLL_DELTA_MS);
    const idleGap = dtMs - scrollDelta;
    if (idleGap > 0) {
      continuousScrollingMs = Math.max(0, continuousScrollingMs - idleGap);
    }
    continuousScrollingMs += scrollDelta;

    if (continuousScrollingMs >= state.continuousScrollMs && !overlayVisible) {
      showOverlay();
    }

    if (continuousScrollingMs >= state.escalateMs && !gaugeVisible) {
      showGauge();
    }

    if (gaugeVisible && state.escalateMs > 0) {
      const fill = Math.min((continuousScrollingMs / state.escalateMs) * 100, 100);
      gaugeFillEl.style.width = fill + '%';
    }

    lastScrollY = window.scrollY;
    lastScrollTs = now;
    ticking = false;
  });
}

// ── Storage change listener ─────────────────────────────────────────────────

function onStorageChanged(changes, area) {
  if (area !== 'local') return;
  for (const key of Object.keys(changes)) {
    if (key in DEFAULT_STATE) {
      state[key] = changes[key].newValue;
    }
  }

  if (!shouldBeActive(state)) {
    resetTracking();
    window.removeEventListener('scroll', onScroll);
  } else {
    window.removeEventListener('scroll', onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });
  }
}

// ── SPA navigation ──────────────────────────────────────────────────────────

function reinit() {
  if (!shouldBeActive(state)) {
    resetTracking();
    return;
  }

  continuousScrollingMs = 0;
  overlayVisible = false;
  gaugeVisible = false;
  lastScrollY = window.scrollY;
  lastScrollTs = Date.now();
  stopDecayLoop();

  const existing = document.querySelector('[data-lovespark="doomscroll-overlay"]');
  if (!existing) {
    overlayContainer = null;
    ensureOverlay();
  } else {
    tintEl.style.opacity = '0';
    whisperEl.style.opacity = '0';
    mascotEl.classList.remove('visible');
    mascotEl.style.opacity = '';
    gaugeEl.style.opacity = '0';
    gaugeFillEl.style.width = '0%';
  }
}

// ── Init ────────────────────────────────────────────────────────────────────

function init() {
  if (didInit) return;
  didInit = true;

  lastScrollY = window.scrollY;
  lastScrollTs = Date.now();

  getState().then(s => {
    state = s;

    if (!shouldBeActive(state)) return;

    checkDailyReset();
    ensureOverlay();
    window.addEventListener('scroll', onScroll, { passive: true });
    chrome.storage.onChanged.addListener(onStorageChanged);

    // SPA navigation support
    window.addEventListener('popstate', reinit);
    const _pushState = history.pushState;
    history.pushState = function() {
      _pushState.apply(this, arguments);
      reinit();
    };
    const _replaceState = history.replaceState;
    history.replaceState = function() {
      _replaceState.apply(this, arguments);
      reinit();
    };
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
