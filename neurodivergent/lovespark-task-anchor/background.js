'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  currentTask: '',
  isEnabled: true,
  bannerPosition: 'top',
  autoHide: 0,
  taskanchorToday: 0,
  taskanchorTotal: 0,
  tasksCompleted: 0,
  lastResetDate: LoveSparkStats.todayStr(),
};

// Direct-write nudge counter (no deferred accumulator — KI-020)
async function bumpNudge() {
  const data = await chrome.storage.local.get(['taskanchorToday', 'taskanchorTotal']);
  await chrome.storage.local.set({
    taskanchorToday: (data.taskanchorToday || 0) + 1,
    taskanchorTotal: (data.taskanchorTotal || 0) + 1,
  });
  await LoveSparkBadge.update('isEnabled', 'taskanchorToday');
}

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
        'taskanchorToday', 'taskanchorTotal', 'tasksCompleted',
        'isEnabled', 'currentTask',
      ]);
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'taskanchorToday');
      return { ok: true };
    }
    case 'SET_TASK': {
      const task = (msg.task || '').trim();
      await chrome.storage.local.set({ currentTask: task });
      return { ok: true };
    }
    case 'CLEAR_TASK': {
      await chrome.storage.local.set({ currentTask: '' });
      return { ok: true };
    }
    case 'COMPLETE_TASK': {
      const data = await chrome.storage.local.get(['tasksCompleted']);
      await chrome.storage.local.set({
        currentTask: '',
        tasksCompleted: (data.tasksCompleted || 0) + 1,
      });
      return { ok: true };
    }
    case 'NUDGE_SHOWN': {
      await bumpNudge();
      return { ok: true };
    }
    case 'GET_SETTINGS': {
      return chrome.storage.local.get(['bannerPosition', 'autoHide']);
    }
    case 'SAVE_SETTINGS': {
      const updates = {};
      if (msg.bannerPosition !== undefined) updates.bannerPosition = msg.bannerPosition;
      if (msg.autoHide !== undefined) updates.autoHide = Number(msg.autoHide);
      await chrome.storage.local.set(updates);
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
