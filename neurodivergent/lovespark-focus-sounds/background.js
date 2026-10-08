'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  sessionsToday: 0,
  sessionsTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  lastSound: 'white',
  lastVolume: 0.5,
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
        'sessionsToday', 'sessionsTotal', 'isEnabled', 'lastSound', 'lastVolume'
      ]);
      return {
        sessionsToday: data.sessionsToday || 0,
        sessionsTotal: data.sessionsTotal || 0,
        isEnabled: data.isEnabled !== false,
        lastSound: data.lastSound || 'white',
        lastVolume: data.lastVolume || 0.5
      };
    }
    case 'LOG_SESSION': {
      await stats.bump(1);
      return { ok: true };
    }
    case 'SAVE_PREFS': {
      const toSave = {};
      if (msg.sound) toSave.lastSound = msg.sound;
      if (msg.volume !== undefined) toSave.lastVolume = msg.volume;
      await chrome.storage.local.set(toSave);
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
