'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  currentTask: '',
  taskanchorToday: 0,
  taskanchorTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  bannerPosition: 'top',
  autoHide: 0,
};

const stats = LoveSparkStats.createAccumulator('taskanchorToday', 'taskanchorTotal',
  () => LoveSparkBadge.update('isEnabled', 'taskanchorToday'));

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'taskanchorToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('taskanchorToday');
  await LoveSparkBadge.update('isEnabled', 'taskanchorToday');
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('taskanchorToday');
      return chrome.storage.local.get([
        'taskanchorToday', 'taskanchorTotal', 'isEnabled',
        'currentTask', 'bannerPosition', 'autoHide'
      ]);
    }
    case 'SET_TASK': {
      await chrome.storage.local.set({ currentTask: msg.task || '' });
      return { ok: true };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'taskanchorToday');
      return { ok: true };
    }
    case 'SET_SETTING': {
      await chrome.storage.local.set({ [msg.key]: msg.value });
      return { ok: true };
    }
    case 'NUDGE_SHOWN': {
      stats.bump(1);
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
