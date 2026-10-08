'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  clearedToday: 0,
  clearedTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
};

const stats = LoveSparkStats.createAccumulator('clearedToday', 'clearedTotal',
  () => LoveSparkBadge.update('isEnabled', 'clearedToday'));

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'clearedToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('clearedToday');
  await LoveSparkBadge.update('isEnabled', 'clearedToday');
});

/* Time ranges in milliseconds */
const RANGES = {
  hour: 60 * 60 * 1000,
  day:  24 * 60 * 60 * 1000,
  week: 7 * 24 * 60 * 60 * 1000,
};

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('clearedToday');
      return chrome.storage.local.get(['clearedToday', 'clearedTotal', 'isEnabled']);
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'clearedToday');
      return { ok: true };
    }
    case 'GET_HISTORY_COUNT': {
      const range = RANGES[msg.range] || RANGES.hour;
      const since = Date.now() - range;
      const results = await chrome.history.search({
        text: '',
        startTime: since,
        maxResults: 10000,
      });
      return { count: results.length };
    }
    case 'CLEAR_HISTORY': {
      const range = RANGES[msg.range] || RANGES.hour;
      const since = Date.now() - range;
      await chrome.browsingData.removeHistory({ since });
      stats.bump(1);
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
