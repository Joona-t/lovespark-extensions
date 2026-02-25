// Pink Anti-Doomscroll — content.js
// NEVER write per-scroll metrics or timestamps to browser.storage.sync.
// Sync storage has a 100KB quota and write-rate limits.
// All tracking state (continuousScrollingMs, idleMs, velocity) stays in JS variables only.
'use strict';

// ── Default state & helpers ─────────────────────────────────────────────────

const DEFAULT_STATE = {
  enabled: true,
  sites: { 'x.com': true, 'twitter.com': true, 'reddit.com': true },
  mode: 'standard',
  sparkleEnabled: true,
  snoozeUntilTs: 0,
  continuousScrollMs: 45000,
  escalateMs: 90000,
  tintOpacity: 0.10,
  softenAfterIdleMs: 10000,
};

async function getState() {
  const stored = await browser.storage.sync.get(null);
  return { ...DEFAULT_STATE, ...stored };
}

const rawHostname = location.hostname.replace(/^www\./, '');

// ── Whisper messages ────────────────────────────────────────────────────────

const WHISPERS = [
  'Pause. Breathe.',
  'Is this still serving you?',
  'Return when you choose.',
  "You're allowed to stop. \u{1F338}",
];

// ── State ───────────────────────────────────────────────────────────────────

let state = null;
let overlayContainer = null;
let tintEl = null;
let whisperEl = null;
let gaugeEl = null;
let gaugeFillEl = null;

let lastScrollY = 0;
let lastScrollTs = 0;
let continuousScrollingMs = 0;
let overlayVisible = false;
let gaugeVisible = false;
let liveSparkles = 0;
let ticking = false;
let decayLoopId = 0;
let lastDecayTs = 0;

const SLOW_THRESHOLD_PX_PER_SEC = 120;
const MAX_SPARKLES = 12;

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

  gaugeEl.appendChild(gaugeFillEl);
  overlayContainer.appendChild(tintEl);
  overlayContainer.appendChild(whisperEl);
  overlayContainer.appendChild(gaugeEl);

  document.documentElement.appendChild(overlayContainer);
}

// ── Show / hide ─────────────────────────────────────────────────────────────

function showOverlay() {
  if (overlayVisible) return;
  overlayVisible = true;
  tintEl.style.opacity = state.tintOpacity;
  whisperEl.textContent = WHISPERS[Math.floor(Math.random() * WHISPERS.length)];
  whisperEl.style.opacity = '1';
  startDecayLoop();
}

function showGauge() {
  if (gaugeVisible) return;
  gaugeVisible = true;
  gaugeEl.style.opacity = '1';
}

function hideOverlay() {
  overlayVisible = false;
  gaugeVisible = false;
  continuousScrollingMs = 0;
  tintEl.style.opacity = '0';
  whisperEl.style.opacity = '0';
  gaugeEl.style.opacity = '0';
  gaugeFillEl.style.width = '0%';
}

function resetTracking() {
  hideOverlay();
  lastScrollY = window.scrollY;
  lastScrollTs = Date.now();
  stopDecayLoop();
}

// ── Sparkles ────────────────────────────────────────────────────────────────

function spawnSparkle() {
  if (liveSparkles >= MAX_SPARKLES) return;
  liveSparkles++;

  const sparkle = document.createElement('div');
  sparkle.className = 'ls-doomscroll-sparkle';
  sparkle.style.left = (Math.random() * 90 + 5) + '%';
  sparkle.style.top = (Math.random() * 60 + 20) + '%';

  sparkle.addEventListener('animationend', () => {
    sparkle.remove();
    liveSparkles--;
  });

  overlayContainer.appendChild(sparkle);
}

// ── rAF decay loop (fix #1) ────────────────────────────────────────────────

function startDecayLoop() {
  if (decayLoopId) return;
  lastDecayTs = Date.now();
  decayLoopId = requestAnimationFrame(decayTick);
}

function stopDecayLoop() {
  if (decayLoopId) {
    cancelAnimationFrame(decayLoopId);
    decayLoopId = 0;
  }
}

function decayTick() {
  decayLoopId = 0;

  if (!shouldBeActive(state)) {
    resetTracking();
    return;
  }

  const now = Date.now();
  const idleMs = now - lastScrollTs;
  const decayDelta = now - lastDecayTs;
  lastDecayTs = now;

  if (idleMs >= state.softenAfterIdleMs) {
    continuousScrollingMs = Math.max(0, continuousScrollingMs - decayDelta);

    // Fade tint proportionally as continuousScrollingMs decays
    if (continuousScrollingMs > 0 && state.continuousScrollMs > 0) {
      const ratio = Math.min(continuousScrollingMs / state.continuousScrollMs, 1);
      tintEl.style.opacity = (state.tintOpacity * ratio).toFixed(4);
      whisperEl.style.opacity = ratio.toFixed(4);
    }

    // Update gauge fill during decay
    if (gaugeVisible && state.escalateMs > 0) {
      const fill = Math.min((continuousScrollingMs / state.escalateMs) * 100, 100);
      gaugeFillEl.style.width = fill + '%';
    }

    if (continuousScrollingMs <= 0) {
      hideOverlay();
      // Don't request another frame — loop stops
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

    // Fix #3: ignore tiny scroll jitter
    if (dy < 4) {
      lastScrollTs = now;
      ticking = false;
      return;
    }

    const dtMs = now - lastScrollTs;

    // Fix #2: velocity in px/s
    const velocityPxPerSec = dtMs > 0 ? (dy / dtMs) * 1000 : 0;

    // Accumulate continuous scrolling time
    continuousScrollingMs += dtMs;

    // Update overlay state based on thresholds
    if (continuousScrollingMs >= state.continuousScrollMs && !overlayVisible) {
      showOverlay();
    }

    if (continuousScrollingMs >= state.escalateMs && !gaugeVisible) {
      showGauge();
    }

    // Update gauge fill
    if (gaugeVisible && state.escalateMs > 0) {
      const fill = Math.min((continuousScrollingMs / state.escalateMs) * 100, 100);
      gaugeFillEl.style.width = fill + '%';
    }

    // Sparkles on slow scroll while overlay visible
    if (overlayVisible && state.sparkleEnabled && velocityPxPerSec < SLOW_THRESHOLD_PX_PER_SEC) {
      spawnSparkle();
    }

    lastScrollY = window.scrollY;
    lastScrollTs = now;
    ticking = false;
  });
}

// ── Storage change listener ─────────────────────────────────────────────────

function onStorageChanged(changes, area) {
  if (area !== 'sync') return;
  for (const key of Object.keys(changes)) {
    if (key in DEFAULT_STATE) {
      state[key] = changes[key].newValue;
    }
  }

  if (!shouldBeActive(state)) {
    resetTracking();
    window.removeEventListener('scroll', onScroll);
  } else if (!ticking) {
    // Re-attach scroll listener if it was removed
    window.removeEventListener('scroll', onScroll);
    window.addEventListener('scroll', onScroll, { passive: true });
  }
}

// ── Init ────────────────────────────────────────────────────────────────────

function init() {
  // Fix #3: initialize from current scroll position
  lastScrollY = window.scrollY;
  lastScrollTs = Date.now();

  getState().then(s => {
    state = s;

    if (!shouldBeActive(state)) return;

    ensureOverlay();
    window.addEventListener('scroll', onScroll, { passive: true });
    browser.storage.onChanged.addListener(onStorageChanged);
  });
}

// Fix #6b: handle document_idle timing
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}
