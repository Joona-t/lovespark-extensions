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

  let responded = false;

  // Ask the background if this URL should be blocked.
  // Wrap in try/catch — sendMessage can throw synchronously if the
  // extension context is invalidated (reload during dev).
  try {
    chrome.runtime.sendMessage(
      { type: 'CHECK_BLOCKED', url: window.location.href },
      (response) => {
        responded = true;

        if (chrome.runtime.lastError) {
          // Extension context invalidated — unhide
          if (style.parentNode) style.remove();
          return;
        }

        if (response && response.blocked) {
          // Notify background of the block event
          try {
            chrome.runtime.sendMessage({
              type: 'SITE_BLOCKED',
              url: window.location.href
            });
          } catch (e) {
            console.warn('[Rewire Brain] SITE_BLOCKED notify failed:', e);
          }

          // Redirect to the blocked page
          const blockedUrl = chrome.runtime.getURL('blocked.html') +
            '?url=' + encodeURIComponent(window.location.href);
          window.location.replace(blockedUrl);
        } else {
          // Not blocked — remove the hiding style
          if (style.parentNode) style.remove();
        }
      }
    );
  } catch (e) {
    console.warn('[Rewire Brain] CHECK_BLOCKED sendMessage threw:', e);
    responded = true;
    if (style.parentNode) style.remove();
  }

  // Safety timeout: if we don't get a response in 1500ms, unhide.
  // This prevents the page from being permanently hidden if the
  // service worker is dead. 1500ms is the SW cold-start budget headroom.
  // FAIL-CLOSED: if we already received a "blocked" response, do NOT unhide.
  setTimeout(() => {
    if (!responded && style.parentNode) style.remove();
  }, 1500);
})();
