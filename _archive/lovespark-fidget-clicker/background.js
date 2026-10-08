'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

var DEFAULTS = {
  fidgetClickerToday: 0,
  fidgetClickerTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
};

var stats = LoveSparkStats.createAccumulator('fidgetClickerToday', 'fidgetClickerTotal',
  function() { LoveSparkBadge.update('isEnabled', 'fidgetClickerToday'); });

chrome.runtime.onInstalled.addListener(async function() {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'fidgetClickerToday');
});

chrome.runtime.onStartup.addListener(async function() {
  await LoveSparkStats.checkDailyReset('fidgetClickerToday');
  await LoveSparkBadge.update('isEnabled', 'fidgetClickerToday');
});

LoveSparkLifecycle.setupMessageHandler(async function(msg) {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('fidgetClickerToday');
      return chrome.storage.local.get(['fidgetClickerToday', 'fidgetClickerTotal']);
    }
    case 'CLICK': {
      stats.bump(msg.count || 1);
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
