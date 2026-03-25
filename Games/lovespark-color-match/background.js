'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  gamesWonToday: 0,
  gamesWonTotal: 0,
  bestTime: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  theme: 'retro'
};

const stats = LoveSparkStats.createAccumulator('gamesWonToday', 'gamesWonTotal',
  () => LoveSparkBadge.update('isEnabled', 'gamesWonToday'));

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'gamesWonToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('gamesWonToday');
  await LoveSparkBadge.update('isEnabled', 'gamesWonToday');
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('gamesWonToday');
      const data = await chrome.storage.local.get([
        'gamesWonToday', 'gamesWonTotal', 'bestTime', 'isEnabled'
      ]);
      return {
        gamesWonToday: data.gamesWonToday || 0,
        gamesWonTotal: data.gamesWonTotal || 0,
        bestTime: data.bestTime || 0,
        isEnabled: data.isEnabled !== false
      };
    }
    case 'GAME_WON': {
      await stats.bump(1);
      const cur = await chrome.storage.local.get(['bestTime']);
      const best = cur.bestTime || 0;
      if (msg.time > 0 && (best === 0 || msg.time < best)) {
        await chrome.storage.local.set({ bestTime: msg.time });
      }
      return { ok: true };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'gamesWonToday');
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
