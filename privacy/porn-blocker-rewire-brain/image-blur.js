// ═══════════════════════════════════════════════════════════════════
// Porn Blocker Rewire Brain — Image Blur Bridge (ISOLATED world)
// Reads settings, bridges to main-world classifier via DOM data + events
// ═══════════════════════════════════════════════════════════════════

(async () => {
  'use strict';

  // Skip extension's own pages
  if (window.location.protocol === 'chrome-extension:') return;

  // Read settings from chrome.storage.
  // FAIL-CLOSED: on any storage failure, default to ENABLED with strict settings.
  // Never let a storage error silently disable safety protection.
  let settings = { imageBlurEnabled: true, imageBlurSensitivity: 'strict', imageBlurThreshold: 0.6 };
  try {
    const stored = await chrome.storage.local.get([
      'imageBlurEnabled',
      'imageBlurSensitivity',
      'imageBlurThreshold',
    ]);
    Object.assign(settings, stored);
  } catch (err) {
    console.warn('[Rewire Brain] storage read failed — defaulting blur ON:', err);
  }

  // Explicit `false` = user-disabled; anything else = enabled
  if (settings.imageBlurEnabled === false) {
    document.documentElement.dataset.rbBlur = 'disabled';
    return;
  }

  // Expose settings to main-world classifier via data attributes + URLs
  const html = document.documentElement;
  html.dataset.rbBlur = 'enabled';
  html.dataset.rbBlurSensitivity = settings.imageBlurSensitivity || 'strict';
  html.dataset.rbBlurThreshold = String(
    typeof settings.imageBlurThreshold === 'number'
      ? settings.imageBlurThreshold
      : 0.6
  );
  html.dataset.rbBlurNsfwjsUrl = chrome.runtime.getURL('lib/nsfwjs/nsfwjs.min.js');
  html.dataset.rbBlurModelUrl = chrome.runtime.getURL('lib/nsfwjs/model/model.json');
  html.dataset.rbBlurCssUrl = chrome.runtime.getURL('image-blur.css');

  // Inject CSS from extension origin (so styles work in any document)
  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = chrome.runtime.getURL('image-blur.css');
  (document.head || document.documentElement).appendChild(link);

  // Listen for classifier events from main world; forward stats to background
  document.addEventListener('rb-image-blurred', () => {
    try {
      chrome.runtime.sendMessage({ type: 'IMAGE_BLURRED' }, () => {
        // No-op callback to silence "channel may have closed" warnings.
        // Lifetime count is best-effort — if extension context is invalidated,
        // we silently drop the increment.
        if (chrome.runtime.lastError) {
          // Already in catch-of-throw context; just observe and ignore.
        }
      });
    } catch (err) {
      // Extension context invalidated — best-effort counter, ignore.
    }
  });
})();
