'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  stimsToday: 0,
  stimsTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  clickerCount: 0,
  theme: 'retro'
};

const stats = LoveSparkStats.createAccumulator('stimsToday', 'stimsTotal',
  () => LoveSparkBadge.update('isEnabled', 'stimsToday'));

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'stimsToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('stimsToday');
  await LoveSparkBadge.update('isEnabled', 'stimsToday');
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('stimsToday');
      const data = await chrome.storage.local.get([
        'stimsToday', 'stimsTotal', 'isEnabled', 'clickerCount'
      ]);
      return {
        stimsToday: data.stimsToday || 0,
        stimsTotal: data.stimsTotal || 0,
        isEnabled: data.isEnabled !== false,
        clickerCount: data.clickerCount || 0
      };
    }
    case 'STIM': {
      await stats.bump(1);
      return { ok: true };
    }
    case 'CLICK': {
      const data = await chrome.storage.local.get('clickerCount');
      const count = (data.clickerCount || 0) + 1;
      await chrome.storage.local.set({ clickerCount: count });
      await stats.bump(1);
      return { ok: true, count };
    }
    case 'RESET_CLICKER': {
      await chrome.storage.local.set({ clickerCount: 0 });
      return { ok: true, count: 0 };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'stimsToday');
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
