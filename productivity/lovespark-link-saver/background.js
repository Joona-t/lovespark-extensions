'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const MAX_SAVED = 100;

const DEFAULTS = {
  savedLinks: [],
  linkSaverToday: 0,
  linkSaverTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
};

const stats = LoveSparkStats.createAccumulator('linkSaverToday', 'linkSaverTotal',
  () => LoveSparkBadge.update('isEnabled', 'linkSaverToday'));

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'linkSaverToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('linkSaverToday');
  await LoveSparkBadge.update('isEnabled', 'linkSaverToday');
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('linkSaverToday');
      return chrome.storage.local.get([
        'linkSaverToday', 'linkSaverTotal', 'isEnabled', 'savedLinks'
      ]);
    }
    case 'SAVE_LINK': {
      const data = await chrome.storage.local.get(['savedLinks']);
      const links = data.savedLinks || [];
      // Deduplicate by URL
      const exists = links.some(l => l.url === msg.url);
      if (exists) return { ok: false, reason: 'duplicate' };
      const entry = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        url: msg.url,
        title: msg.title || msg.url,
        savedAt: new Date().toISOString(),
      };
      links.unshift(entry);
      if (links.length > MAX_SAVED) links.length = MAX_SAVED;
      await chrome.storage.local.set({ savedLinks: links });
      stats.bump(1);
      return { ok: true, entry };
    }
    case 'DELETE_LINK': {
      const data = await chrome.storage.local.get(['savedLinks']);
      const links = (data.savedLinks || []).filter(l => l.id !== msg.id);
      await chrome.storage.local.set({ savedLinks: links });
      return { ok: true };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'linkSaverToday');
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
