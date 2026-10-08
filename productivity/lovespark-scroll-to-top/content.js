'use strict';

(function() {
  if (document.getElementById('ls-scroll-to-top-btn')) return;

  var btn = document.createElement('button');
  btn.id = 'ls-scroll-to-top-btn';
  btn.setAttribute('aria-label', 'Scroll to top');
  btn.setAttribute('title', 'Back to top');

  var arrow = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  arrow.setAttribute('width', '20');
  arrow.setAttribute('height', '20');
  arrow.setAttribute('viewBox', '0 0 24 24');
  arrow.setAttribute('fill', 'none');
  arrow.setAttribute('stroke', 'currentColor');
  arrow.setAttribute('stroke-width', '2.5');
  arrow.setAttribute('stroke-linecap', 'round');
  arrow.setAttribute('stroke-linejoin', 'round');
  arrow.setAttribute('aria-hidden', 'true');

  var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  path.setAttribute('d', 'M18 15l-6-6-6 6');
  arrow.appendChild(path);
  btn.appendChild(arrow);

  var style = document.createElement('style');
  style.textContent = [
    '#ls-scroll-to-top-btn {',
    '  position: fixed;',
    '  bottom: 24px;',
    '  right: 24px;',
    '  z-index: 2147483647;',
    '  width: 44px;',
    '  height: 44px;',
    '  border: none;',
    '  border-radius: 50%;',
    '  background: rgba(232, 69, 124, 0.85);',
    '  color: #ffffff;',
    '  cursor: pointer;',
    '  display: flex;',
    '  align-items: center;',
    '  justify-content: center;',
    '  box-shadow: 0 2px 12px rgba(232, 69, 124, 0.35);',
    '  opacity: 0;',
    '  visibility: hidden;',
    '  transform: translateY(12px);',
    '  transition: opacity 0.25s ease, visibility 0.25s ease, transform 0.25s ease, background 0.2s ease;',
    '}',
    '#ls-scroll-to-top-btn.ls-visible {',
    '  opacity: 1;',
    '  visibility: visible;',
    '  transform: translateY(0);',
    '}',
    '#ls-scroll-to-top-btn:hover {',
    '  background: rgba(214, 52, 102, 0.95);',
    '  box-shadow: 0 4px 20px rgba(232, 69, 124, 0.5);',
    '}',
    '#ls-scroll-to-top-btn:focus-visible {',
    '  outline: 2px solid #d63466;',
    '  outline-offset: 2px;',
    '}',
    '@media (prefers-reduced-motion: reduce) {',
    '  #ls-scroll-to-top-btn {',
    '    transition: none !important;',
    '  }',
    '}',
  ].join('\n');

  document.documentElement.appendChild(style);
  document.body.appendChild(btn);

  var threshold = 300;
  var enabled = true;

  function loadSettings() {
    chrome.storage.local.get(['isEnabled', 'threshold'], function(data) {
      enabled = data.isEnabled !== false;
      threshold = data.threshold || 300;
      updateVisibility();
    });
  }

  function updateVisibility() {
    if (!enabled) {
      btn.classList.remove('ls-visible');
      return;
    }
    if (window.scrollY > threshold) {
      btn.classList.add('ls-visible');
    } else {
      btn.classList.remove('ls-visible');
    }
  }

  var scrollTimer = null;
  window.addEventListener('scroll', function() {
    if (scrollTimer) return;
    scrollTimer = setTimeout(function() {
      scrollTimer = null;
      updateVisibility();
    }, 100);
  }, { passive: true });

  btn.addEventListener('click', function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    try {
      chrome.runtime.sendMessage({ type: 'SCROLL_USED' });
    } catch (e) {
      /* extension context may be invalidated */
    }
  });

  chrome.storage.onChanged.addListener(function(changes) {
    if (changes.isEnabled || changes.threshold) {
      loadSettings();
    }
  });

  loadSettings();
  updateVisibility();
})();
