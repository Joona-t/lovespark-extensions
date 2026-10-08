'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  attemptsToday: 0,
  attemptsTotal: 0,
  bestTime: 0,
  todayTimes: [],
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  theme: 'retro'
};

const stats = LoveSparkStats.createAccumulator('attemptsToday', 'attemptsTotal',
  () => LoveSparkBadge.update('isEnabled', 'attemptsToday'));

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'attemptsToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('attemptsToday');
  const data = await chrome.storage.local.get(['lastResetDate']);
  const today = LoveSparkStats.todayStr();
  if (data.lastResetDate !== today) {
    await chrome.storage.local.set({ todayTimes: [] });
  }
  await LoveSparkBadge.update('isEnabled', 'attemptsToday');
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('attemptsToday');
      const data = await chrome.storage.local.get([
        'attemptsToday', 'attemptsTotal', 'bestTime', 'todayTimes', 'isEnabled'
      ]);
      const times = data.todayTimes || [];
      const avg = times.length > 0
        ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
        : 0;
      return {
        attemptsToday: data.attemptsToday || 0,
        attemptsTotal: data.attemptsTotal || 0,
        bestTime: data.bestTime || 0,
        dailyAvg: avg,
        isEnabled: data.isEnabled !== false
      };
    }
    case 'LOG_ATTEMPT': {
      await stats.bump(1);
      const time = msg.time;
      if (time > 0 && time < 5000) {
        const cur = await chrome.storage.local.get(['bestTime', 'todayTimes']);
        const best = cur.bestTime || 0;
        const times = (cur.todayTimes || []).slice(-49);
        times.push(time);
        const updates = { todayTimes: times };
        if (best === 0 || time < best) {
          updates.bestTime = time;
        }
        await chrome.storage.local.set(updates);
      }
      return { ok: true };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'attemptsToday');
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
