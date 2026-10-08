'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

var DEFAULTS = {
  emotionWheelToday: 0,
  emotionWheelTotal: 0,
  recentEmotions: [],
  lastResetDate: LoveSparkStats.todayStr(),
};

var stats = LoveSparkStats.createAccumulator('emotionWheelToday', 'emotionWheelTotal',
  function() { LoveSparkBadge.update('isEnabled', 'emotionWheelToday'); });

chrome.runtime.onInstalled.addListener(async function() {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'emotionWheelToday');
});

chrome.runtime.onStartup.addListener(async function() {
  await LoveSparkStats.checkDailyReset('emotionWheelToday');
  await LoveSparkBadge.update('isEnabled', 'emotionWheelToday');
});

LoveSparkLifecycle.setupMessageHandler(async function(msg) {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('emotionWheelToday');
      return chrome.storage.local.get(['emotionWheelToday', 'emotionWheelTotal', 'recentEmotions']);
    }
    case 'LOG_EMOTION': {
      var data = await chrome.storage.local.get(['recentEmotions']);
      var recent = data.recentEmotions || [];
      recent.push(msg.emotion);
      /* Keep last 20 */
      if (recent.length > 20) recent = recent.slice(-20);
      await chrome.storage.local.set({ recentEmotions: recent });
      stats.bump(1);
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
