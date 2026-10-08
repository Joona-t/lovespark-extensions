'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  noiseBlockedToday: 0,
  noiseBlockedTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
};

const stats = LoveSparkStats.createAccumulator('noiseBlockedToday', 'noiseBlockedTotal',
  () => LoveSparkBadge.update('isEnabled', 'noiseBlockedToday'));

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'noiseBlockedToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('noiseBlockedToday');
  await LoveSparkBadge.update('isEnabled', 'noiseBlockedToday');
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('noiseBlockedToday');
      return chrome.storage.local.get([
        'noiseBlockedToday', 'noiseBlockedTotal', 'isEnabled'
      ]);
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'noiseBlockedToday');
      return { ok: true };
    }
    case 'MEDIA_BLOCKED': {
      const count = msg.count || 1;
      stats.bump(count);
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
