'use strict';

/**
 * Sensory Shield — Content Script
 *
 * Reads per-domain settings from browser.storage.local.
 * Applies features via data-sensory-shield-* attributes on <html>.
 * Manages tint overlay, focus ruler (Shadow DOM), and GIF observer.
 */

const SS_PREFIX = 'data-sensory-shield';

const PRESETS = {
  calm:  { reduceMotion: true, tintEnabled: true, tintColor: '#FDCFE1', tintOpacity: 0.1, hideGifs: true, focusRuler: false, cursorSize: false, fontComfort: false },
  focus: { reduceMotion: true, tintEnabled: false, tintColor: '#FDCFE1', tintOpacity: 0.1, hideGifs: false, focusRuler: true, cursorSize: false, fontComfort: true },
  full:  { reduceMotion: true, tintEnabled: true, tintColor: '#FDCFE1', tintOpacity: 0.1, hideGifs: true, focusRuler: true, cursorSize: true, fontComfort: true },
};

const domain = location.hostname.replace(/^www\./, '');

let fontStyleEl = null;
let observer = null;
let tintOverlay = null;
let rulerHost = null;
let rulerRAF = null;
let rulerMouseY = 0;
let rulerCurrentY = 0;
let onMouseMove = null;
let onKeyDown = null;

// ── Init ────────────────────────────────────────────────────────────────────

async function init() {
  const data = await browser.storage.local.get(['globalEnabled', 'whitelistedDomains', domain]);

  if (data.globalEnabled === false) return;
  if ((data.whitelistedDomains || []).includes(domain)) return;

  const siteSettings = data[domain];
  if (!siteSettings) return;

  apply(siteSettings);
}

function apply(settings) {
  teardown();

  if (settings.reduceMotion) {
    document.documentElement.setAttribute(SS_PREFIX + '-reduce-motion', '');
  }
  if (settings.hideGifs) {
    document.documentElement.setAttribute(SS_PREFIX + '-hide-gifs', '');
    startGifObserver();
  }
  if (settings.cursorSize) {
    document.documentElement.setAttribute(SS_PREFIX + '-cursor', '');
  }
  if (settings.fontComfort) {
    document.documentElement.setAttribute(SS_PREFIX + '-font', '');
    injectFontFace();
  }
  if (settings.tintEnabled) {
    createTintOverlay(settings.tintColor || '#FDCFE1', settings.tintOpacity || 0.1);
  }
  if (settings.focusRuler) {
    createFocusRuler();
  }
}

// ── Teardown ────────────────────────────────────────────────────────────────

function teardown() {
  const attrs = document.documentElement.getAttributeNames().filter(function(a) {
    return a.startsWith(SS_PREFIX);
  });
  for (const attr of attrs) {
    document.documentElement.removeAttribute(attr);
  }

  if (fontStyleEl) {
    fontStyleEl.remove();
    fontStyleEl = null;
  }

  if (tintOverlay) {
    tintOverlay.remove();
    tintOverlay = null;
  }

  if (rulerRAF) {
    cancelAnimationFrame(rulerRAF);
    rulerRAF = null;
  }
  if (onMouseMove) {
    document.removeEventListener('mousemove', onMouseMove);
    onMouseMove = null;
  }
  if (onKeyDown) {
    document.removeEventListener('keydown', onKeyDown);
    onKeyDown = null;
  }
  if (rulerHost) {
    rulerHost.remove();
    rulerHost = null;
  }

  if (observer) {
    observer.disconnect();
    observer = null;
  }

  // Restore hidden GIFs
  const hiddenGifs = document.querySelectorAll('img[data-sensory-shield-hidden]');
  for (const img of hiddenGifs) {
    img.style.visibility = '';
    img.removeAttribute('data-sensory-shield-hidden');
  }
}

// ── Font Face Injection ─────────────────────────────────────────────────────

function injectFontFace() {
  if (fontStyleEl) return;
  const fontUrl = browser.runtime.getURL('fonts/OpenDyslexic-Regular.woff');
  fontStyleEl = document.createElement('style');
  fontStyleEl.setAttribute(SS_PREFIX, 'font-face');
  fontStyleEl.textContent =
    "@font-face{font-family:'SensoryShield-OpenDyslexic';src:url('" + fontUrl + "') format('woff');font-weight:normal;font-style:normal;font-display:swap}";
  document.documentElement.appendChild(fontStyleEl);
}

// ── Tint Overlay ────────────────────────────────────────────────────────────

function createTintOverlay(color, opacity) {
  tintOverlay = document.createElement('div');
  tintOverlay.setAttribute(SS_PREFIX, 'tint-overlay');
  tintOverlay.style.cssText =
    'position:fixed;inset:0;pointer-events:none;z-index:2147483640;transition:opacity 0.3s ease;' +
    'background:' + color + ';opacity:' + Math.min(opacity, 0.5) + ';';
  document.documentElement.appendChild(tintOverlay);
}

// ── Focus Ruler (Shadow DOM) ────────────────────────────────────────────────

function createFocusRuler() {
  rulerHost = document.createElement('div');
  rulerHost.setAttribute(SS_PREFIX, 'ruler-host');
  rulerHost.style.cssText = 'position:fixed;inset:0;z-index:2147483641;pointer-events:none;';

  const shadow = rulerHost.attachShadow({ mode: 'closed' });

  const RULER_HEIGHT = 80;
  const DIM_COLOR = 'rgba(0, 0, 0, 0.35)';
  const LINE_COLOR = 'rgba(232, 69, 124, 0.6)';

  // Build ruler DOM safely (no innerHTML)
  const style = document.createElement('style');
  style.textContent = [
    ':host{position:fixed;inset:0;pointer-events:none}',
    '.dimmer-top,.dimmer-bottom{position:fixed;left:0;right:0;background:' + DIM_COLOR + ';will-change:transform,height}',
    '.dimmer-top{top:0}',
    '.dimmer-bottom{bottom:0}',
    '.ruler-line,.ruler-line-bottom{position:fixed;left:0;right:0;height:2px;background:' + LINE_COLOR + ';will-change:transform}',
    '@media(prefers-reduced-motion:reduce){.dimmer-top,.dimmer-bottom,.ruler-line,.ruler-line-bottom{transition:none!important}}',
  ].join('');

  const dimTop = document.createElement('div');
  dimTop.className = 'dimmer-top';

  const lineTop = document.createElement('div');
  lineTop.className = 'ruler-line';

  const lineBottom = document.createElement('div');
  lineBottom.className = 'ruler-line-bottom';

  const dimBottom = document.createElement('div');
  dimBottom.className = 'dimmer-bottom';

  shadow.appendChild(style);
  shadow.appendChild(dimTop);
  shadow.appendChild(lineTop);
  shadow.appendChild(lineBottom);
  shadow.appendChild(dimBottom);

  rulerCurrentY = window.innerHeight / 2;
  rulerMouseY = rulerCurrentY;

  function updateRuler() {
    rulerCurrentY += (rulerMouseY - rulerCurrentY) * 0.15;

    const halfRuler = RULER_HEIGHT / 2;
    const topEdge = Math.max(0, rulerCurrentY - halfRuler);
    const bottomEdge = Math.min(window.innerHeight, rulerCurrentY + halfRuler);

    dimTop.style.height = topEdge + 'px';
    dimBottom.style.height = (window.innerHeight - bottomEdge) + 'px';
    lineTop.style.transform = 'translateY(' + topEdge + 'px)';
    lineBottom.style.transform = 'translateY(' + (bottomEdge - 2) + 'px)';

    rulerRAF = requestAnimationFrame(updateRuler);
  }

  onMouseMove = function(e) {
    rulerMouseY = e.clientY;
  };

  onKeyDown = function(e) {
    if (e.key === 'ArrowUp') {
      rulerMouseY = Math.max(0, rulerMouseY - 20);
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      rulerMouseY = Math.min(window.innerHeight, rulerMouseY + 20);
      e.preventDefault();
    }
  };

  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('keydown', onKeyDown);

  document.documentElement.appendChild(rulerHost);
  rulerRAF = requestAnimationFrame(updateRuler);
}

// ── GIF Observer ────────────────────────────────────────────────────────────

function startGifObserver() {
  hideGifImages(document.querySelectorAll('img'));

  observer = new MutationObserver(function(mutations) {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.tagName === 'IMG') {
          hideGifImages([node]);
        } else if (node.querySelectorAll) {
          hideGifImages(node.querySelectorAll('img'));
        }
      }
    }
  });

  observer.observe(document.documentElement, { childList: true, subtree: true });
}

function hideGifImages(imgs) {
  for (const img of imgs) {
    const src = (img.src || img.dataset.src || '').toLowerCase();
    if (src.includes('.gif')) {
      img.style.visibility = 'hidden';
      img.setAttribute('data-sensory-shield-hidden', '');
    }
  }
}

// ── Storage Change Listener ─────────────────────────────────────────────────

browser.storage.onChanged.addListener(function(changes, area) {
  if (area !== 'local') return;

  if (changes.globalEnabled && changes.globalEnabled.newValue === false) {
    teardown();
    return;
  }

  if (changes.whitelistedDomains) {
    const list = changes.whitelistedDomains.newValue || [];
    if (list.includes(domain)) {
      teardown();
      return;
    }
  }

  if (changes[domain]) {
    const newSettings = changes[domain].newValue;
    if (newSettings) {
      apply(newSettings);
    } else {
      teardown();
    }
    return;
  }

  if (changes.globalEnabled && changes.globalEnabled.newValue === true) {
    init();
  }
});

// ── Start ───────────────────────────────────────────────────────────────────

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
