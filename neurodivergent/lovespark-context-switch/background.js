'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  switchesToday: 0,
  switchesTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  switchLog: [],
  theme: 'retro'
};

const stats = LoveSparkStats.createAccumulator('switchesToday', 'switchesTotal',
  () => LoveSparkBadge.update('isEnabled', 'switchesToday'));

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'switchesToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('switchesToday');
  await LoveSparkBadge.update('isEnabled', 'switchesToday');
});

function computeWeeklyAvg(log) {
  var now = new Date();
  var dayCounts = {};
  for (var i = 0; i < 7; i++) {
    var d = new Date(now);
    d.setDate(d.getDate() - i);
    dayCounts[d.toISOString().slice(0, 10)] = 0;
  }
  for (var entry of log) {
    if (dayCounts.hasOwnProperty(entry.date)) {
      dayCounts[entry.date]++;
    }
  }
  var vals = Object.values(dayCounts);
  var sum = vals.reduce(function(a, b) { return a + b; }, 0);
  return Math.round(sum / 7 * 10) / 10;
}

function getLast5(log) {
  var today = LoveSparkStats.todayStr();
  var todayEntries = log.filter(function(e) { return e.date === today; });
  return todayEntries.slice(-5).reverse();
}

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('switchesToday');
      const data = await chrome.storage.local.get([
        'switchesToday', 'switchesTotal', 'isEnabled', 'switchLog'
      ]);
      const log = data.switchLog || [];
      return {
        switchesToday: data.switchesToday || 0,
        switchesTotal: data.switchesTotal || 0,
        isEnabled: data.isEnabled !== false,
        weeklyAvg: computeWeeklyAvg(log),
        recentSwitches: getLast5(log)
      };
    }
    case 'LOG_SWITCH': {
      const data = await chrome.storage.local.get('switchLog');
      const log = data.switchLog || [];
      const entry = {
        date: LoveSparkStats.todayStr(),
        time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
        ts: Date.now()
      };
      log.push(entry);
      const pruned = log.slice(-1000);
      await chrome.storage.local.set({ switchLog: pruned });
      await stats.bump(1);
      return { ok: true, entry: entry };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'switchesToday');
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
