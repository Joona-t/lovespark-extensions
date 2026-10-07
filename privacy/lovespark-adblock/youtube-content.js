(function initYouTubeContentLayer() {
  'use strict';

  const logic = globalThis.LoveSparkYouTubeLogic;
  let active = false;
  let observer = null;
  let scanFrame = 0;

  function setPageState(enabled) {
    const root = document.documentElement;
    if (root) root.dataset.lovesparkAdblock = enabled ? 'on' : 'off';
  }

  function scan() {
    scanFrame = 0;
    if (!active) return;
    try {
      logic.skipActiveAd(document);
    } catch (error) {
      console.debug('[Pink Ad Blocker] YouTube fallback deferred:', error);
    }
  }

  function queueScan() {
    if (scanFrame || !active) return;
    scanFrame = requestAnimationFrame(scan);
  }

  function start() {
    if (observer) return;
    const root = document.documentElement;
    if (!root) {
      document.addEventListener('readystatechange', start, { once: true });
      return;
    }
    observer = new MutationObserver(queueScan);
    observer.observe(root, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    document.addEventListener('timeupdate', queueScan, true);
    document.addEventListener('loadedmetadata', queueScan, true);
    document.addEventListener('yt-navigate-finish', queueScan);
    queueScan();
  }

  function stop() {
    observer?.disconnect();
    observer = null;
    if (scanFrame) cancelAnimationFrame(scanFrame);
    scanFrame = 0;
    document.removeEventListener('timeupdate', queueScan, true);
    document.removeEventListener('loadedmetadata', queueScan, true);
    document.removeEventListener('yt-navigate-finish', queueScan);
  }

  async function refresh() {
    const settings = await chrome.storage.local.get(['isEnabled', 'whitelistedDomains']);
    active = logic.shouldActivate(location.hostname, settings);
    setPageState(active);
    if (active) start(); else stop();
  }

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && (changes.isEnabled || changes.whitelistedDomains)) refresh();
  });

  refresh().catch((error) => console.warn('[Pink Ad Blocker] YouTube layer unavailable:', error));
})();
