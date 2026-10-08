'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const MAX_SAVED = 50;

const DEFAULTS = {
  savedLinks: [],
  quickSaveToday: 0,
  quickSaveTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
};

const stats = LoveSparkStats.createAccumulator('quickSaveToday', 'quickSaveTotal',
  () => LoveSparkBadge.update('isEnabled', 'quickSaveToday'));

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'quickSaveToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('quickSaveToday');
  await LoveSparkBadge.update('isEnabled', 'quickSaveToday');
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('quickSaveToday');
      return chrome.storage.local.get([
        'quickSaveToday', 'quickSaveTotal', 'isEnabled', 'savedLinks'
      ]);
    }
    case 'SAVE_LINK': {
      const data = await chrome.storage.local.get(['savedLinks']);
      const links = data.savedLinks || [];
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
      await LoveSparkBadge.update('isEnabled', 'quickSaveToday');
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
