'use strict';

(() => {
  if (window.__lsPageRulerInit) return;
  window.__lsPageRulerInit = true;

  let ruler = null;
  let active = false;
  let rulerHeight = 40;
  let rulerOpacity = 0.15;
  let rulerColor = '#e8457c';

  function createRuler() {
    if (ruler) return;
    ruler = document.createElement('div');
    ruler.setAttribute('data-ls-page-ruler', '');
    ruler.setAttribute('aria-hidden', 'true');
    ruler.style.cssText = [
      'position: fixed',
      'left: 0',
      'width: 100%',
      'height: ' + rulerHeight + 'px',
      'background: ' + rulerColor,
      'opacity: ' + rulerOpacity,
      'z-index: 2147483646',
      'pointer-events: none',
      'top: -100px',
      'transition: top 0.05s linear',
      'border-top: 1px solid ' + rulerColor,
      'border-bottom: 1px solid ' + rulerColor
    ].join(';');
    document.documentElement.appendChild(ruler);
  }

  function removeRuler() {
    if (!ruler) return;
    if (ruler.parentNode) {
      ruler.parentNode.removeChild(ruler);
    }
    ruler = null;
  }

  function handleMouseMove(e) {
    if (!ruler) return;
    // Position ruler centered on cursor Y
    const top = e.clientY - (rulerHeight / 2);
    ruler.style.top = top + 'px';
  }

  function enable(opts) {
    if (opts) {
      if (typeof opts.rulerHeight === 'number') rulerHeight = opts.rulerHeight;
      if (typeof opts.rulerOpacity === 'number') rulerOpacity = opts.rulerOpacity;
      if (typeof opts.rulerColor === 'string') rulerColor = opts.rulerColor;
    }

    if (active) {
      // Just update existing ruler
      updateRulerStyle();
      return;
    }

    active = true;
    createRuler();
    applyMotionPref();
    document.addEventListener('mousemove', handleMouseMove, { passive: true });
  }

  function disable() {
    active = false;
    document.removeEventListener('mousemove', handleMouseMove);
    removeRuler();
  }

  function updateRulerStyle() {
    if (!ruler) return;
    ruler.style.height = rulerHeight + 'px';
    ruler.style.opacity = rulerOpacity;
    ruler.style.background = rulerColor;
    ruler.style.borderTopColor = rulerColor;
    ruler.style.borderBottomColor = rulerColor;
  }

  // Respect prefers-reduced-motion
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  function applyMotionPref() {
    if (ruler) {
      ruler.style.transition = motionQuery.matches ? 'none' : 'top 0.05s linear';
    }
  }
  motionQuery.addEventListener('change', applyMotionPref);

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    switch (msg.type) {
      case 'ENABLE_RULER':
        enable(msg);
        sendResponse({ active: true });
        break;
      case 'DISABLE_RULER':
        disable();
        sendResponse({ active: false });
        break;
      case 'UPDATE_RULER':
        if (typeof msg.rulerHeight === 'number') rulerHeight = msg.rulerHeight;
        if (typeof msg.rulerOpacity === 'number') rulerOpacity = msg.rulerOpacity;
        if (typeof msg.rulerColor === 'string') rulerColor = msg.rulerColor;
        updateRulerStyle();
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
