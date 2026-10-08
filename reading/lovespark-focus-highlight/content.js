'use strict';

(() => {
  if (window.__lsFocusHighlightInit) return;
  window.__lsFocusHighlightInit = true;

  const BLOCK_SELECTORS = 'p, li, td, th, blockquote, pre, dd, dt, figcaption, h1, h2, h3, h4, h5, h6';
  let overlay = null;
  let active = false;
  let dimOpacity = 0.25;

  function createOverlay() {
    if (overlay) return;
    overlay = document.createElement('div');
    overlay.setAttribute('data-ls-focus-overlay', '');
    overlay.style.cssText = [
      'position: fixed',
      'inset: 0',
      'z-index: 2147483646',
      'pointer-events: none',
      'transition: opacity 0.15s ease',
      'opacity: 0'
    ].join(';');

    // Use box-shadow inset trick: a massive shadow covers everything,
    // then we punch a hole via clip-path
    overlay.style.background = 'rgba(0, 0, 0, ' + dimOpacity + ')';
    document.documentElement.appendChild(overlay);
  }

  function removeOverlay() {
    if (!overlay) return;
    overlay.style.opacity = '0';
    const el = overlay;
    setTimeout(() => { if (el.parentNode) el.parentNode.removeChild(el); }, 160);
    overlay = null;
  }

  function updateClipHole(rect) {
    if (!overlay) return;
    const pad = 6;
    const top = Math.max(0, rect.top - pad);
    const left = Math.max(0, rect.left - pad);
    const bottom = Math.min(window.innerHeight, rect.bottom + pad);
    const right = Math.min(window.innerWidth, rect.right + pad);
    const radius = '6px';

    // Polygon that covers the whole viewport minus a rounded-ish rectangle
    // Using clip-path: path() is not widely supported, so use polygon approximation
    // Actually, we use the "inverted rectangle" technique with clip-path polygon
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    overlay.style.clipPath =
      'polygon(' +
      // Outer rectangle (full viewport) clockwise
      '0% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 0%, ' +
      // Inner rectangle (hole) counter-clockwise
      left + 'px ' + top + 'px, ' +
      left + 'px ' + bottom + 'px, ' +
      right + 'px ' + bottom + 'px, ' +
      right + 'px ' + top + 'px, ' +
      left + 'px ' + top + 'px' +
      ')';
    overlay.style.opacity = '1';
  }

  function clearClipHole() {
    if (!overlay) return;
    overlay.style.clipPath = '';
    overlay.style.opacity = '0';
  }

  function handleMouseMove(e) {
    const el = e.target.closest(BLOCK_SELECTORS);
    if (el) {
      updateClipHole(el.getBoundingClientRect());
    } else {
      clearClipHole();
    }
  }

  function enable(opacity) {
    if (typeof opacity === 'number') dimOpacity = opacity;
    if (active) {
      // Just update opacity
      if (overlay) overlay.style.background = 'rgba(0, 0, 0, ' + dimOpacity + ')';
      return;
    }
    active = true;
    createOverlay();
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
    document.addEventListener('scroll', handleScroll, { passive: true });
  }

  function disable() {
    active = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('scroll', handleScroll);
    removeOverlay();
  }

  function handleScroll() {
    // Re-trigger based on element under cursor during scroll
    clearClipHole();
  }

  // Respect prefers-reduced-motion
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  function applyMotionPref() {
    if (overlay) {
      overlay.style.transition = motionQuery.matches ? 'none' : 'opacity 0.15s ease';
    }
  }
  motionQuery.addEventListener('change', applyMotionPref);

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    switch (msg.type) {
      case 'ENABLE_HIGHLIGHT':
        enable(msg.dimOpacity);
        applyMotionPref();
        sendResponse({ active: true });
        break;
      case 'DISABLE_HIGHLIGHT':
        disable();
        sendResponse({ active: false });
        break;
      case 'SET_DIM_OPACITY':
        dimOpacity = msg.dimOpacity;
        if (overlay) overlay.style.background = 'rgba(0, 0, 0, ' + dimOpacity + ')';
        sendResponse({ ok: true });
        break;
      case 'GET_STATUS':
        sendResponse({ active });
        break;
      default:
        sendResponse({ error: 'Unknown message' });
    }
  });
})();
