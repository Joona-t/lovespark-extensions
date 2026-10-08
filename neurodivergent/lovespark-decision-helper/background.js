'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

var DEFAULTS = {
  decisionHelperToday: 0,
  decisionHelperTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
};

var stats = LoveSparkStats.createAccumulator('decisionHelperToday', 'decisionHelperTotal',
  function() { LoveSparkBadge.update('isEnabled', 'decisionHelperToday'); });

chrome.runtime.onInstalled.addListener(async function() {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'decisionHelperToday');
});

chrome.runtime.onStartup.addListener(async function() {
  await LoveSparkStats.checkDailyReset('decisionHelperToday');
  await LoveSparkBadge.update('isEnabled', 'decisionHelperToday');
});

LoveSparkLifecycle.setupMessageHandler(async function(msg) {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('decisionHelperToday');
      return chrome.storage.local.get(['decisionHelperToday', 'decisionHelperTotal']);
    }
    case 'DECISION_MADE': {
      stats.bump(1);
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
