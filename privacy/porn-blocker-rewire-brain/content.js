// ═══════════════════════════════════════════════════════════════════
// Porn Blocker Rewire Brain — Content Script (Safety Net)
// Runs at document_start as a fallback if DNR redirect didn't catch it
// ═══════════════════════════════════════════════════════════════════

(() => {
  'use strict';

  // Quick-check: if we're already on the blocked page, do nothing
  if (window.location.href.includes(chrome.runtime.getURL('blocked.html'))) return;

  // Immediately hide the page to prevent any flash of content
  // This is a synchronous operation at document_start
  const style = document.createElement('style');
  style.textContent = 'html{visibility:hidden!important;background:#fff0f5!important;}';
  (document.head || document.documentElement).appendChild(style);

  // Ask the background if this URL should be blocked
  chrome.runtime.sendMessage(
    { type: 'CHECK_BLOCKED', url: window.location.href },
    (response) => {
      if (chrome.runtime.lastError) {
        // Extension context invalidated — unhide
        style.remove();
        return;
      }

      if (response && response.blocked) {
        // Notify background of the block event
        chrome.runtime.sendMessage({
          type: 'SITE_BLOCKED',
          url: window.location.href
        });

        // Redirect to the blocked page
        const blockedUrl = chrome.runtime.getURL('blocked.html') +
          '?url=' + encodeURIComponent(window.location.href);
        window.location.replace(blockedUrl);
      } else {
        // Not blocked — remove the hiding style
        style.remove();
      }
    }
  );

  // Safety timeout: if we don't get a response in 500ms, unhide
  // This prevents the page from being permanently hidden if the
  // service worker is slow to wake up
  setTimeout(() => {
    if (document.querySelector('style') === style && style.parentNode) {
      style.remove();
    }
  }, 500);
})();
