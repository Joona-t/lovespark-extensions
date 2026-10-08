'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  inputguardToday: 0,
  inputguardTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  inputGuardEntries: [],
  inputGuardSettings: {
    debounceMs: 1500,
    minLength: 10,
    maxEntries: 200,
    maxAgeDays: 7
  }
};

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'inputguardToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('inputguardToday');
  await LoveSparkBadge.update('isEnabled', 'inputguardToday');
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('inputguardToday');
      return chrome.storage.local.get(['inputguardToday', 'inputguardTotal', 'isEnabled']);
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'inputguardToday');
      return { ok: true };
    }
    case 'GET_ENTRIES': {
      const data = await chrome.storage.local.get(['inputGuardEntries']);
      return { entries: data.inputGuardEntries || [] };
    }
    case 'DELETE_ENTRY': {
      const data = await chrome.storage.local.get(['inputGuardEntries']);
      const entries = (data.inputGuardEntries || []).filter(e => e.id !== msg.entryId);
      await chrome.storage.local.set({ inputGuardEntries: entries });
      return { ok: true };
    }
    case 'DELETE_ALL': {
      await chrome.storage.local.set({ inputGuardEntries: [] });
      return { ok: true };
    }
    case 'CONTENT_SAVED': {
      await LoveSparkStats.checkDailyReset('inputguardToday');
      const data = await chrome.storage.local.get(['inputguardToday', 'inputguardTotal']);
      await chrome.storage.local.set({
        inputguardToday: (data.inputguardToday || 0) + 1,
        inputguardTotal: (data.inputguardTotal || 0) + 1,
      });
      await LoveSparkBadge.update('isEnabled', 'inputguardToday');
      return { ok: true };
    }
    case 'GET_SETTINGS': {
      const data = await chrome.storage.local.get(['inputGuardSettings']);
      return { settings: data.inputGuardSettings || DEFAULTS.inputGuardSettings };
    }
    case 'SAVE_SETTINGS': {
      await chrome.storage.local.set({ inputGuardSettings: msg.settings });
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
