'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  startsToday: 0,
  startsTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  theme: 'retro'
};

const ENCOURAGEMENTS = [
  "The hardest part is starting. You just did it.",
  "One tiny step. That's all it takes.",
  "You don't have to finish. Just begin.",
  "Your brain said 'no' but you said 'go'.",
  "Starting counts. Even if you stop after one step.",
  "The smallest action beats the biggest intention.",
  "You showed up. That IS the work.",
  "Task paralysis: 0. You: 1."
];

const stats = LoveSparkStats.createAccumulator('startsToday', 'startsTotal',
  () => LoveSparkBadge.update('isEnabled', 'startsToday'));

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'startsToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('startsToday');
  await LoveSparkBadge.update('isEnabled', 'startsToday');
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('startsToday');
      const data = await chrome.storage.local.get(['startsToday', 'startsTotal', 'isEnabled']);
      return {
        startsToday: data.startsToday || 0,
        startsTotal: data.startsTotal || 0,
        isEnabled: data.isEnabled !== false
      };
    }
    case 'LOG_START': {
      await stats.bump(1);
      const encouragement = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
      return { ok: true, encouragement };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'startsToday');
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
