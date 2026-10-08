'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  countsToday: 0,
  countsTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
};

const stats = LoveSparkStats.createAccumulator('countsToday', 'countsTotal',
  () => LoveSparkBadge.update('isEnabled', 'countsToday'));

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'countsToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('countsToday');
  await LoveSparkBadge.update('isEnabled', 'countsToday');
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('countsToday');
      return chrome.storage.local.get(['countsToday', 'countsTotal', 'isEnabled']);
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'countsToday');
      return { ok: true };
    }
    case 'COUNT_SELECTION': {
      const data = await chrome.storage.local.get(['isEnabled']);
      if (data.isEnabled === false) return { error: 'disabled' };
      stats.bump(1);
      return { ok: true };
    }
    case 'GET_SELECTION': {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab || !tab.id) return { words: 0, chars: 0, readTime: '0 sec' };
      try {
        const results = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
            const sel = window.getSelection();
            return sel ? sel.toString() : '';
          },
        });
        const text = (results && results[0] && results[0].result) || '';
        const trimmed = text.trim();
        if (!trimmed) return { words: 0, chars: 0, readTime: '0 sec' };
        const words = trimmed.split(/\s+/).filter(w => w.length > 0).length;
        const chars = trimmed.length;
        const minutes = words / 200;
        let readTime;
        if (minutes < 1) {
          readTime = Math.max(1, Math.round(minutes * 60)) + ' sec';
        } else {
          readTime = Math.round(minutes) + ' min';
        }
        return { words, chars, readTime };
      } catch (e) {
        return { words: 0, chars: 0, readTime: '0 sec', error: 'Cannot access page' };
      }
    }
    default:
      return { error: 'Unknown message type' };
  }
});
