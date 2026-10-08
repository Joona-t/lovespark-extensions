'use strict';

/* LoveSpark Calm — Content Script
   Injected by background.js via chrome.scripting.executeScript
   Sets data-ls-calm attribute on <html> and pauses autoplay videos. */

(function () {
  /* Prevent double-init */
  if (window.__lovesparkCalm) return;

  const LEVELS = ['light', 'medium', 'full'];

  function applyLevel(level) {
    if (!LEVELS.includes(level)) level = 'medium';
    document.documentElement.setAttribute('data-ls-calm', level);
    pauseAutoplayVideos();
    if (level === 'medium' || level === 'full') {
      hideSidebarElements();
    }
  }

  function removeCalm() {
    document.documentElement.removeAttribute('data-ls-calm');
  }

  function pauseAutoplayVideos() {
    var videos = document.querySelectorAll('video[autoplay], video[data-autoplay]');
    for (var i = 0; i < videos.length; i++) {
      try {
        videos[i].pause();
        videos[i].removeAttribute('autoplay');
      } catch (e) {
        /* cross-origin iframe videos can't be paused */
      }
    }
  }

  function hideSidebarElements() {
    /* For full calm: additional JS-based hiding for dynamic elements
       CSS handles most of this, but some sites load these late */
    var selectors = [
      '[class*="chat-widget"]',
      '[class*="intercom"]',
      '[class*="drift-"]',
      '[class*="crisp-"]'
    ];
    for (var s = 0; s < selectors.length; s++) {
      var els = document.querySelectorAll(selectors[s]);
      for (var i = 0; i < els.length; i++) {
        els[i].style.setProperty('display', 'none', 'important');
      }
    }
  }

  /* Listen for messages from background (intensity changes) */
  chrome.runtime.onMessage.addListener(function (msg) {
    if (msg.action === 'updateIntensity') {
      applyLevel(msg.intensity);
    } else if (msg.action === 'removeCalm') {
      removeCalm();
    }
  });

  /* Expose API for background script func injection */
  window.__lovesparkCalm = {
    apply: applyLevel,
    remove: removeCalm
  };

  /* Auto-apply on load: read current intensity from storage */
  chrome.storage.local.get(['intensity', 'calmEnabled'], function (data) {
    if (data.calmEnabled) {
      applyLevel(data.intensity || 'medium');
    }
  });
})();
