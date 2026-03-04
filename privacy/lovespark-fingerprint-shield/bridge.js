// LoveSpark Fingerprint Shield — bridge.js
// ISOLATED world, document_start
// Bridges MAIN world (inject.js) <-> background service worker.
// Syncs enabled/disabled state via dataset attribute on <html>.

'use strict';

(function() {
  let enabled = true;

  // Load initial state from storage
  chrome.storage.local.get('isEnabled', function(data) {
    enabled = data.isEnabled !== false;
    if (!enabled) {
      document.documentElement.dataset.loveSparkFpDisabled = 'true';
    }
  });

  // Listen for live toggle changes from background
  chrome.runtime.onMessage.addListener(function(message) {
    if (message.action === 'enabledChanged') {
      enabled = message.enabled;
      if (enabled) {
        delete document.documentElement.dataset.loveSparkFpDisabled;
      } else {
        document.documentElement.dataset.loveSparkFpDisabled = 'true';
      }
    }
  });

  // Also listen for storage changes directly (more reliable than message passing)
  chrome.storage.onChanged.addListener(function(changes) {
    if (changes.isEnabled) {
      enabled = changes.isEnabled.newValue !== false;
      if (enabled) {
        delete document.documentElement.dataset.loveSparkFpDisabled;
      } else {
        document.documentElement.dataset.loveSparkFpDisabled = 'true';
      }
    }
  });

  // Receive spoof reports from MAIN world via postMessage
  window.addEventListener('message', function(event) {
    if (event.source !== window || !event.data || !event.data.__ls) return;

    if (event.data.__ls === 'fpSpoofed' && enabled) {
      chrome.runtime.sendMessage({
        action: 'fingerprintSpoofed',
        count: event.data.count || 1
      }).catch(function() {});
    }
  });
})();
