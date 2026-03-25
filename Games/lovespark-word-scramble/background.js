'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  wordsSolvedToday: 0,
  wordsSolvedTotal: 0,
  currentStreak: 0,
  bestStreak: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  theme: 'retro'
};

const stats = LoveSparkStats.createAccumulator('wordsSolvedToday', 'wordsSolvedTotal',
  () => LoveSparkBadge.update('isEnabled', 'wordsSolvedToday'));

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'wordsSolvedToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('wordsSolvedToday');
  await LoveSparkBadge.update('isEnabled', 'wordsSolvedToday');
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('wordsSolvedToday');
      const data = await chrome.storage.local.get([
        'wordsSolvedToday', 'wordsSolvedTotal', 'currentStreak', 'bestStreak', 'isEnabled'
      ]);
      return {
        wordsSolvedToday: data.wordsSolvedToday || 0,
        wordsSolvedTotal: data.wordsSolvedTotal || 0,
        currentStreak: data.currentStreak || 0,
        bestStreak: data.bestStreak || 0,
        isEnabled: data.isEnabled !== false
      };
    }
    case 'WORD_SOLVED': {
      await stats.bump(1);
      const cur = await chrome.storage.local.get(['currentStreak', 'bestStreak']);
      const streak = (cur.currentStreak || 0) + 1;
      const best = Math.max(streak, cur.bestStreak || 0);
      await chrome.storage.local.set({ currentStreak: streak, bestStreak: best });
      return { ok: true, streak, bestStreak: best };
    }
    case 'STREAK_BROKEN': {
      await chrome.storage.local.set({ currentStreak: 0 });
      return { ok: true };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'wordsSolvedToday');
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
