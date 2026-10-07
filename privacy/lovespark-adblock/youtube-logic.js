(function initLoveSparkYouTubeLogic(scope) {
  'use strict';

  const SKIP_SELECTORS = [
    '.ytp-ad-skip-button-modern',
    '.ytp-ad-skip-button',
    '.ytp-skip-ad-button',
    'button[class*="ytp-ad-skip-button"]',
  ];

  function isAllowlisted(hostname, domains) {
    const host = String(hostname || '').toLowerCase();
    return (domains || []).some((domain) => {
      const normalized = String(domain || '').trim().toLowerCase();
      return normalized && (host === normalized || host.endsWith(`.${normalized}`));
    });
  }

  function shouldActivate(hostname, settings) {
    return settings?.isEnabled !== false && !isAllowlisted(hostname, settings?.whitelistedDomains);
  }

  function findPlayer(root) {
    return root.querySelector('.html5-video-player.ad-showing, #movie_player.ad-showing');
  }

  function skipActiveAd(root) {
    const player = findPlayer(root);
    if (!player) return { action: 'none' };

    for (const selector of SKIP_SELECTORS) {
      const button = player.querySelector(selector);
      if (button && !button.disabled) {
        button.click();
        return { action: 'button' };
      }
    }

    const video = player.querySelector('video.html5-main-video, video');
    if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return { action: 'waiting' };
    if (video.currentTime + 0.25 < video.duration) video.currentTime = video.duration;
    return { action: 'seek' };
  }

  scope.LoveSparkYouTubeLogic = { isAllowlisted, shouldActivate, skipActiveAd };
})(globalThis);
