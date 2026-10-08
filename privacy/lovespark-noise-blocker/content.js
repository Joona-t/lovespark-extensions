'use strict';

(function() {
  let blockedCount = 0;

  function isEnabled() {
    return new Promise((resolve) => {
      chrome.storage.local.get(['isEnabled'], (data) => {
        resolve(data.isEnabled !== false);
      });
    });
  }

  function pauseMedia(el) {
    if (!el) return false;
    let blocked = false;

    // Pause the element if it is playing
    if (!el.paused) {
      el.pause();
      blocked = true;
    }

    // Remove autoplay attribute to prevent future auto-starts
    if (el.hasAttribute('autoplay')) {
      el.removeAttribute('autoplay');
      blocked = true;
    }

    // Mute as fallback safety
    if (!el.muted && el.hasAttribute('autoplay') === false) {
      // Only mute elements we caught autoplaying
    }

    return blocked;
  }

  function scanAndBlock() {
    const mediaElements = document.querySelectorAll('video, audio');
    let count = 0;

    mediaElements.forEach((el) => {
      if (pauseMedia(el)) {
        count++;
      }
    });

    if (count > 0) {
      blockedCount += count;
      try {
        chrome.runtime.sendMessage({ type: 'MEDIA_BLOCKED', count: count });
      } catch (e) {
        // Extension context may be invalidated
      }
    }
  }

  // Observe DOM for dynamically added media elements
  function startObserver() {
    const observer = new MutationObserver((mutations) => {
      let found = false;
      for (const mutation of mutations) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType !== 1) continue;
          if (node.tagName === 'VIDEO' || node.tagName === 'AUDIO') {
            found = true;
          }
          // Check children of added nodes
          if (node.querySelectorAll) {
            const nested = node.querySelectorAll('video, audio');
            if (nested.length > 0) found = true;
          }
        }
      }
      if (found) {
        isEnabled().then((enabled) => {
          if (enabled) scanAndBlock();
        });
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    return observer;
  }

  // Listen for enable/disable changes
  chrome.storage.onChanged.addListener((changes) => {
    if (changes.isEnabled && changes.isEnabled.newValue === true) {
      scanAndBlock();
    }
  });

  // Initial scan once DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      isEnabled().then((enabled) => {
        if (enabled) scanAndBlock();
      });
    });
  } else {
    isEnabled().then((enabled) => {
      if (enabled) scanAndBlock();
    });
  }

  // Start observing for dynamic media
  isEnabled().then((enabled) => {
    if (enabled) startObserver();
  });
})();
