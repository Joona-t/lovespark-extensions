'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  scrollsToday: 0,
  scrollsTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  threshold: 300,
};

const stats = LoveSparkStats.createAccumulator('scrollsToday', 'scrollsTotal',
  () => LoveSparkBadge.update('isEnabled', 'scrollsToday'));

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'scrollsToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('scrollsToday');
  await LoveSparkBadge.update('isEnabled', 'scrollsToday');
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('scrollsToday');
      return chrome.storage.local.get(['scrollsToday', 'scrollsTotal', 'isEnabled', 'threshold']);
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'scrollsToday');
      return { ok: true };
    }
    case 'SET_THRESHOLD': {
      const val = Math.max(100, Math.min(2000, parseInt(msg.threshold, 10) || 300));
      await chrome.storage.local.set({ threshold: val });
      return { ok: true, threshold: val };
    }
    case 'SCROLL_USED': {
      stats.bump(1);
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
