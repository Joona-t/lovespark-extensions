'use strict';

/**
 * ISOLATED world content script — relays caption data from MAIN world
 * to the background service worker. Handles SPA navigation.
 */

(function () {
  const CHANNEL = 'lovespark-yt-digest';
  let currentVideoId = null;

  // ── Utility ─────────────────────────────────────────────────────
  function getVideoId() {
    const params = new URLSearchParams(window.location.search);
    return params.get('v') || null;
  }

  function isWatchPage() {
    return window.location.pathname === '/watch' && !!getVideoId();
  }

  // ── Listen for caption data from MAIN world ─────────────────────
  window.addEventListener('message', (event) => {
    if (event.source !== window) return;
    if (event.data?.source !== CHANNEL) return;

    if (event.data.type === 'captionTracks') {
      const videoId = event.data.videoDetails?.videoId || getVideoId();
      if (!videoId) return;

      currentVideoId = videoId;

      chrome.runtime.sendMessage({
        action: 'captionData',
        videoId,
        tracks: event.data.tracks,
        videoDetails: event.data.videoDetails,
      }).catch(() => {});
    }
  });

  // ── SPA navigation handling ─────────────────────────────────────
  function onNavigate() {
    const vid = getVideoId();
    if (!vid || vid === currentVideoId) return;

    currentVideoId = vid;

    // Notify background about navigation — captions will arrive
    // separately via JSON.parse intercept when player response loads
    chrome.runtime.sendMessage({
      action: 'videoChanged',
      videoId: vid,
      url: window.location.href,
    }).catch(() => {});
  }

  // YouTube fires this on SPA navigation
  document.addEventListener('yt-navigate-finish', onNavigate);
  window.addEventListener('popstate', onNavigate);

  // ── Listen for messages from background/popup ───────────────────
  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.action === 'getVideoId') {
      sendResponse({ videoId: getVideoId(), isWatchPage: isWatchPage() });
      return true;
    }

    if (msg.action === 'getPageInfo') {
      const title = document.querySelector(
        'yt-formatted-string.ytd-watch-metadata, h1.ytd-watch-metadata'
      )?.textContent?.trim() || document.title.replace(' - YouTube', '');

      const channel = document.querySelector(
        'ytd-channel-name yt-formatted-string a, #channel-name a'
      )?.textContent?.trim() || '';

      sendResponse({
        videoId: getVideoId(),
        title,
        channel,
        isWatchPage: isWatchPage(),
      });
      return true;
    }
  });

  // ── Initial check ───────────────────────────────────────────────
  if (isWatchPage()) {
    currentVideoId = getVideoId();
  }
})();
