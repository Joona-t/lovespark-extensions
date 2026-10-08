'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  checksToday: 0,
  checksTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
};

const stats = LoveSparkStats.createAccumulator('checksToday', 'checksTotal',
  () => LoveSparkBadge.update('isEnabled', 'checksToday'));

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'checksToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('checksToday');
  await LoveSparkBadge.update('isEnabled', 'checksToday');
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('checksToday');
      return chrome.storage.local.get(['checksToday', 'checksTotal', 'isEnabled']);
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'checksToday');
      return { ok: true };
    }
    case 'LOG_CHECK': {
      stats.bump(1);
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
