'use strict';

// ── Configuration ─────────────────────────────────────────────

const AD_SELECTORS = [
  '[data-a-target="video-ad-label"]',
  '[data-a-target="video-ad-countdown"]',
  '[data-test-selector="ad-banner-default-id"]',
  '[data-a-target="video-ad-product-link"]',
  '[data-a-target="video-ad-cta-button"]',
  '[data-a-target="ad-cta-button"]',
  '[data-a-target="video-ad-subscribe-button"]',
];

const PLAYER_SELECTORS = [
  '.video-player__container',
  '[data-a-target="video-player"]',
  '.video-player',
];

const MESSAGES = [
  'No ads here, bestie! \u{1F495}',
  'Muted with love! \u{1F496}',
  'Ad-free vibes! \u2728',
  'Keeping your stream sparkly! \u{1F338}',
  'Protecting your ears! \u{1F6E1}\uFE0F\u{1F495}',
  'Silence the ads, keep the sparkle! \u2728',
  'Browse streamers in peace! \u{1F338}',
  'Your digital bodyguard \u{1F6E1}\uFE0F\u{1F495}',
];

// ── State ─────────────────────────────────────────────────────

let isEnabled = true;
let isAdPlaying = false;
let adStartTime = 0;
let wasMuted = false;
let overlayHost = null;
let observer = null;
let spaInitialized = false;
let locationHref = location.href;
let strippedByInterceptor = false;
let cosmeticStyleEl = null;

// Cosmetic filter CSS — injected/removed dynamically so the toggle works
const COSMETIC_CSS = [
  '[data-a-target="video-ad-label"]{display:none!important}',
  '[data-a-target="video-ad-countdown"]{display:none!important}',
  '[data-test-selector="ad-banner-default-id"]{display:none!important}',
  '[data-a-target="video-ad-product-link"]{display:none!important}',
  '[data-a-target="video-ad-cta-button"]{display:none!important}',
  '[data-a-target="ad-cta-button"]{display:none!important}',
  '[data-a-target="video-ad-subscribe-button"]{display:none!important}',
  '.video-player__ad-banner{display:none!important}',
  '.video-ads-container{display:none!important}',
].join('');

// ── Listen for m3u8 interception events from intercept.js ─────

document.addEventListener('lovespark-ad-stripped', function() {
  if (!isEnabled) return;
  strippedByInterceptor = true;
  browser.runtime.sendMessage({ type: 'AD_MUTED', duration: 0 }).catch(function() {});
});

// ── DOM flag bridge (communicates enabled state to MAIN world) ─

function setDOMFlag(enabled) {
  if (enabled) {
    document.documentElement.dataset.lovesparkEnabled = 'true';
  } else {
    document.documentElement.dataset.lovesparkEnabled = 'false';
  }
}

// ── Dynamic cosmetic CSS injection ───────────────────────────

function injectCosmeticCSS() {
  if (cosmeticStyleEl) return;
  cosmeticStyleEl = document.createElement('style');
  cosmeticStyleEl.setAttribute('data-lovespark', 'cosmetic-filters');
  cosmeticStyleEl.textContent = COSMETIC_CSS;
  (document.head || document.documentElement).appendChild(cosmeticStyleEl);
}

function removeCosmeticCSS() {
  if (cosmeticStyleEl) {
    cosmeticStyleEl.remove();
    cosmeticStyleEl = null;
  }
}

// ── Storage: load enabled state ───────────────────────────────

browser.storage.local.get('isEnabled').then(data => {
  isEnabled = data.isEnabled !== false;
  setDOMFlag(isEnabled);
  if (isEnabled) {
    injectCosmeticCSS();
    init();
  }
});

browser.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.isEnabled) {
    isEnabled = changes.isEnabled.newValue !== false;
    setDOMFlag(isEnabled);
    if (!isEnabled) {
      removeCosmeticCSS();
      cleanup();
    } else {
      injectCosmeticCSS();
      init();
    }
  }
});

// ── Init ──────────────────────────────────────────────────────

function init() {
  if (observer) return;
  waitForElement(PLAYER_SELECTORS, setupAdDetection);
}

function waitForElement(selectors, callback, attempts) {
  attempts = attempts || 0;
  for (const sel of selectors) {
    const el = document.querySelector(sel);
    if (el) { callback(el); return; }
  }
  if (attempts < 20) {
    setTimeout(function() { waitForElement(selectors, callback, attempts + 1); }, 500);
  }
}

// ── Ad Detection ──────────────────────────────────────────────

function setupAdDetection(playerContainer) {
  observer = new MutationObserver(checkAdState);
  observer.observe(playerContainer, { childList: true, subtree: true });

  // Initial checks for pre-roll ads already playing
  checkAdState();
  setTimeout(checkAdState, 500);
  setTimeout(checkAdState, 1500);

  setupSPANavigation();
}

function countSelectorMatches() {
  let count = 0;
  for (var i = 0; i < AD_SELECTORS.length; i++) {
    if (document.querySelector(AD_SELECTORS[i])) count++;
  }
  return count;
}

function hasAdFallbackSignal() {
  // Fallback signals: ad text in overlay or ad-showing class on player
  var overlays = document.querySelectorAll('.video-player__overlay, .video-player__default-player');
  for (var i = 0; i < overlays.length; i++) {
    var text = overlays[i].textContent;
    // Match standalone "Ad" (not part of other words) or "Advertisement"
    if (/\bAd\b/.test(text) || /Advertisement/i.test(text)) return true;
  }
  // Also check the player container itself for ad-showing class
  var player = document.querySelector('.video-player');
  if (player && player.classList.contains('ad-showing')) return true;
  return false;
}

function isAdDetected() {
  // Two-layer detection: require 2+ signals to prevent false positives
  var selectorHits = countSelectorMatches();
  var textHit = hasAdFallbackSignal();

  // 2+ selector matches = confident
  if (selectorHits >= 2) return true;
  // 1 selector + text fallback = confident
  if (selectorHits >= 1 && textHit) return true;
  return false;
}

function isAdGone() {
  // Explicit end condition: ALL selectors zero AND no text match
  return countSelectorMatches() === 0 && !hasAdFallbackSignal();
}

function checkAdState() {
  if (!isEnabled) return;

  if (!isAdPlaying && isAdDetected()) {
    onAdStart();
  } else if (isAdPlaying && isAdGone()) {
    onAdEnd();
  }
}

// ── Ad Start / End ────────────────────────────────────────────

function onAdStart() {
  isAdPlaying = true;
  adStartTime = Date.now();

  var video = document.querySelector('video');
  if (video) {
    wasMuted = video.muted;
    video.muted = true;
  }

  showOverlay();
}

function onAdEnd() {
  var duration = Math.round((Date.now() - adStartTime) / 1000);
  isAdPlaying = false;

  var video = document.querySelector('video');
  if (video && !wasMuted) {
    video.muted = false;
  }

  hideOverlay();

  // Only report if intercept.js didn't already count this ad break
  if (!strippedByInterceptor) {
    browser.runtime.sendMessage({ type: 'AD_MUTED', duration: duration }).catch(function() {});
  }
  strippedByInterceptor = false;
}

// ── Shadow DOM Overlay ────────────────────────────────────────

function showOverlay() {
  if (overlayHost) return;

  var playerContainer = null;
  for (var i = 0; i < PLAYER_SELECTORS.length; i++) {
    playerContainer = document.querySelector(PLAYER_SELECTORS[i]);
    if (playerContainer) break;
  }
  if (!playerContainer) return;

  // Ensure player has positioning context
  if (getComputedStyle(playerContainer).position === 'static') {
    playerContainer.style.position = 'relative';
  }

  overlayHost = document.createElement('div');
  overlayHost.setAttribute('data-lovespark', 'twitch-ad-overlay');
  overlayHost.style.cssText = 'position:absolute;inset:0;z-index:9999;pointer-events:none;';

  var shadow = overlayHost.attachShadow({ mode: 'closed' });
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var msg = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];

  var style = document.createElement('style');
  style.textContent = [
    ':host { all: initial; }',
    '.overlay {',
    '  position: absolute; inset: 0;',
    '  display: flex; flex-direction: column;',
    '  align-items: center; justify-content: center;',
    '  background: linear-gradient(165deg, rgba(253,207,225,0.94) 0%, rgba(249,168,201,0.94) 40%, rgba(244,140,175,0.94) 100%);',
    '  font-family: "DM Mono", system-ui, -apple-system, monospace;',
    '}',
    '.card {',
    '  background: rgba(255,255,255,0.45);',
    '  border: 1px solid rgba(255,255,255,0.4);',
    '  border-radius: 14px;',
    '  padding: 28px 36px;',
    '  backdrop-filter: blur(8px);',
    '  text-align: center;',
    '  box-shadow: 0 0 16px rgba(232,69,124,0.3);',
    '  max-width: 340px;',
    '}',
    '.icon {',
    '  font-size: 40px;',
    '  margin-bottom: 10px;',
    reducedMotion ? '' : '  animation: pulse 2s ease-in-out infinite;',
    '}',
    '.title {',
    '  font-family: "Press Start 2P", monospace;',
    '  font-size: 11px;',
    '  color: #ffffff;',
    '  text-shadow: 0 1px 4px rgba(0,0,0,0.12);',
    '  margin-bottom: 10px;',
    '}',
    '.message {',
    '  font-size: 14px;',
    '  color: #5C1A36;',
    '  line-height: 1.4;',
    '}',
    '.submsg {',
    '  font-size: 11px;',
    '  color: #9E4D6E;',
    '  margin-top: 8px;',
    '}',
    '@keyframes pulse {',
    '  0%, 100% { transform: scale(1); }',
    '  50% { transform: scale(1.08); }',
    '}',
  ].join('\n');

  var overlay = document.createElement('div');
  overlay.className = 'overlay';
  var card = document.createElement('div');
  card.className = 'card';

  var icon = document.createElement('div');
  icon.className = 'icon';
  icon.textContent = '\u{1F6E1}\uFE0F';

  var title = document.createElement('div');
  title.className = 'title';
  title.textContent = 'Ad Muted!';

  var message = document.createElement('div');
  message.className = 'message';
  message.textContent = msg;

  var submsg = document.createElement('div');
  submsg.className = 'submsg';
  submsg.textContent = 'Stream will resume shortly\u2026 \u2728';

  card.append(icon, title, message, submsg);
  overlay.appendChild(card);

  shadow.appendChild(style);
  shadow.appendChild(overlay);
  playerContainer.appendChild(overlayHost);
}

function hideOverlay() {
  if (overlayHost) {
    overlayHost.remove();
    overlayHost = null;
  }
}

// ── SPA Navigation ────────────────────────────────────────────

function setupSPANavigation() {
  if (spaInitialized) return;
  spaInitialized = true;

  // Watch <title> mutations for URL changes (Twitch updates title on nav)
  var titleEl = document.querySelector('title');
  if (titleEl) {
    new MutationObserver(function() {
      if (location.href !== locationHref) {
        locationHref = location.href;
        onNavigate();
      }
    }).observe(titleEl, { childList: true, characterData: true, subtree: true });
  }

  window.addEventListener('popstate', onNavigate);
}

function onNavigate() {
  if (isAdPlaying) onAdEnd();

  if (observer) {
    observer.disconnect();
    observer = null;
  }

  // waitForElement already handles "not yet rendered" — no artificial delay needed
  setTimeout(init, 100);
}

// ── Cleanup ───────────────────────────────────────────────────

function cleanup() {
  if (observer) {
    observer.disconnect();
    observer = null;
  }
  if (isAdPlaying) {
    var video = document.querySelector('video');
    if (video && !wasMuted) video.muted = false;
    hideOverlay();
    isAdPlaying = false;
  }
}
