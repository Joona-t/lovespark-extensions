'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

var DEFAULTS = {
  noiseLevelToday: 0,
  noiseLevelTotal: 0,
  lastNoiseLevel: 0,
  noiseWeekData: {},
  lastResetDate: LoveSparkStats.todayStr(),
};

var stats = LoveSparkStats.createAccumulator('noiseLevelToday', 'noiseLevelTotal',
  function() { LoveSparkBadge.update('isEnabled', 'noiseLevelToday'); });

chrome.runtime.onInstalled.addListener(async function() {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'noiseLevelToday');
});

chrome.runtime.onStartup.addListener(async function() {
  await LoveSparkStats.checkDailyReset('noiseLevelToday');
  await LoveSparkBadge.update('isEnabled', 'noiseLevelToday');
});

LoveSparkLifecycle.setupMessageHandler(async function(msg) {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('noiseLevelToday');
      return chrome.storage.local.get([
        'noiseLevelToday', 'noiseLevelTotal', 'lastNoiseLevel', 'noiseWeekData'
      ]);
    }
    case 'LOG_NOISE': {
      var dayOfWeek = new Date().getDay();
      var data = await chrome.storage.local.get(['noiseWeekData']);
      var weekData = data.noiseWeekData || {};

      /* Running average for the day */
      var entry = weekData[dayOfWeek];
      if (entry && typeof entry === 'object') {
        entry.sum += msg.level;
        entry.count += 1;
      } else {
        entry = { sum: msg.level, count: 1 };
      }
      weekData[dayOfWeek] = entry;

      /* Store the average as the value for chart rendering */
      var weekAvg = {};
      for (var key in weekData) {
        if (weekData.hasOwnProperty(key)) {
          var e = weekData[key];
          weekAvg[key] = Math.round(e.sum / e.count * 10) / 10;
        }
      }

      await chrome.storage.local.set({
        lastNoiseLevel: msg.level,
        noiseWeekData: weekData,
      });

      stats.bump(1);
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
