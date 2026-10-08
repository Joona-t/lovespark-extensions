'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

var DEFAULTS = {
  socialBatteryToday: 0,
  socialBatteryTotal: 0,
  batteryLevel: 70,
  lastResetDate: LoveSparkStats.todayStr(),
};

var stats = LoveSparkStats.createAccumulator('socialBatteryToday', 'socialBatteryTotal',
  function() { LoveSparkBadge.update('isEnabled', 'socialBatteryToday'); });

chrome.runtime.onInstalled.addListener(async function() {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'socialBatteryToday');
});

chrome.runtime.onStartup.addListener(async function() {
  await LoveSparkStats.checkDailyReset('socialBatteryToday');
  await LoveSparkBadge.update('isEnabled', 'socialBatteryToday');
});

LoveSparkLifecycle.setupMessageHandler(async function(msg) {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('socialBatteryToday');
      return chrome.storage.local.get(['socialBatteryToday', 'socialBatteryTotal', 'batteryLevel']);
    }
    case 'ADJUST_BATTERY': {
      var data = await chrome.storage.local.get(['batteryLevel']);
      var current = data.batteryLevel !== undefined ? data.batteryLevel : 70;
      var newLevel = Math.max(0, Math.min(100, current + msg.amount));
      await chrome.storage.local.set({ batteryLevel: newLevel });
      stats.bump(1);
      return { ok: true, level: newLevel };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
