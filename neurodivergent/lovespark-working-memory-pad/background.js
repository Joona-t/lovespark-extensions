'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  notesUsedToday: 0,
  notesUsedTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  pads: ['', '', ''],
  theme: 'retro'
};

const stats = LoveSparkStats.createAccumulator('notesUsedToday', 'notesUsedTotal',
  () => {
    chrome.storage.local.get('pads', (data) => {
      const active = (data.pads || []).filter(p => p.trim()).length;
      chrome.action.setBadgeText({ text: active > 0 ? String(active) : '' });
      chrome.action.setBadgeBackgroundColor({ color: '#D63466' });
    });
  });

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('notesUsedToday');
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('notesUsedToday');
      const data = await chrome.storage.local.get(['notesUsedToday', 'notesUsedTotal', 'isEnabled', 'pads']);
      return {
        notesUsedToday: data.notesUsedToday || 0,
        notesUsedTotal: data.notesUsedTotal || 0,
        isEnabled: data.isEnabled !== false,
        pads: data.pads || ['', '', '']
      };
    }
    case 'SAVE_PADS': {
      const pads = (msg.pads || ['', '', '']).slice(0, 3).map(p => String(p).slice(0, 200));
      await chrome.storage.local.set({ pads });
      const active = pads.filter(p => p.trim()).length;
      chrome.action.setBadgeText({ text: active > 0 ? String(active) : '' });
      chrome.action.setBadgeBackgroundColor({ color: '#D63466' });
      return { ok: true };
    }
    case 'LOG_USE': {
      await stats.bump(1);
      return { ok: true };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
