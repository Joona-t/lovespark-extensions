'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  analysesToday: 0,
  analysesTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  lastInputMode: 'fen',
  theme: 'retro',
};

async function ensureFreshDailyStats() {
  await LoveSparkStats.checkDailyReset('analysesToday');
}

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  await ensureFreshDailyStats();
});

chrome.runtime.onStartup.addListener(async () => {
  await ensureFreshDailyStats();
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await ensureFreshDailyStats();
      const data = await chrome.storage.local.get([
        'analysesToday',
        'analysesTotal',
        'lastInputMode',
      ]);
      return {
        analysesToday: data.analysesToday || 0,
        analysesTotal: data.analysesTotal || 0,
        lastInputMode: data.lastInputMode || 'fen',
      };
    }
    case 'LOG_ANALYSIS': {
      await ensureFreshDailyStats();
      const data = await chrome.storage.local.get(['analysesToday', 'analysesTotal']);
      await chrome.storage.local.set({
        analysesToday: (data.analysesToday || 0) + 1,
        analysesTotal: (data.analysesTotal || 0) + 1,
      });
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
