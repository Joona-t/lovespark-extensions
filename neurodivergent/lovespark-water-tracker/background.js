'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DAILY_GOAL = 8;

const DEFAULTS = {
  waterToday: 0,
  waterTotal: 0,
  waterGoal: DAILY_GOAL,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
};

const stats = LoveSparkStats.createAccumulator('waterToday', 'waterTotal',
  () => updateBadge());

async function updateBadge() {
  const data = await chrome.storage.local.get(['isEnabled', 'waterToday', 'waterGoal']);
  if (data.isEnabled === false) {
    chrome.action.setBadgeText({ text: 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: '#666666' });
    return;
  }
  const cups = data.waterToday || 0;
  const goal = data.waterGoal || DAILY_GOAL;
  const text = cups >= goal ? '\u2713' : String(cups) + '/' + String(goal);
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: cups >= goal ? '#0d9488' : '#FF69B4' });
  try { chrome.action.setBadgeTextColor({ color: '#FFFFFF' }); } catch (e) { /* Firefox */ }
}

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await updateBadge();
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('waterToday');
  await updateBadge();
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('waterToday');
      return chrome.storage.local.get([
        'waterToday', 'waterTotal', 'waterGoal', 'isEnabled'
      ]);
    }
    case 'LOG_WATER': {
      stats.bump(1);
      return { ok: true };
    }
    case 'UNDO_WATER': {
      const data = await chrome.storage.local.get(['waterToday', 'waterTotal']);
      const today = data.waterToday || 0;
      const total = data.waterTotal || 0;
      if (today > 0) {
        await chrome.storage.local.set({
          waterToday: today - 1,
          waterTotal: Math.max(0, total - 1),
        });
        await updateBadge();
      }
      return { ok: true };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await updateBadge();
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
