'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  sessionsToday: 0,
  sessionsTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  garden: [],
  theme: 'retro'
};

const stats = LoveSparkStats.createAccumulator('sessionsToday', 'sessionsTotal',
  () => LoveSparkBadge.update('isEnabled', 'sessionsToday'));

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'sessionsToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('sessionsToday');
  await LoveSparkBadge.update('isEnabled', 'sessionsToday');
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('sessionsToday');
      const data = await chrome.storage.local.get([
        'sessionsToday', 'sessionsTotal', 'isEnabled', 'garden'
      ]);
      return {
        sessionsToday: data.sessionsToday || 0,
        sessionsTotal: data.sessionsTotal || 0,
        isEnabled: data.isEnabled !== false,
        garden: data.garden || []
      };
    }
    case 'SAVE_GARDEN': {
      const garden = (msg.garden || []).slice(0, 30);
      await chrome.storage.local.set({ garden });
      return { ok: true };
    }
    case 'CLEAR_GARDEN': {
      await chrome.storage.local.set({ garden: [] });
      return { ok: true };
    }
    case 'LOG_SESSION': {
      await stats.bump(1);
      return { ok: true };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'sessionsToday');
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
