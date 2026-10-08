'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  escapesToday: 0,
  escapesTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  theme: 'retro'
};

const MESSAGES = [
  "You are safe. You are here.",
  "This moment will pass.",
  "Breathe. Nothing is required of you right now.",
  "You survived every hard moment before this one.",
  "Close your eyes. Soften your jaw. Drop your shoulders.",
  "One breath at a time. That's all.",
  "You don't have to fix anything right now.",
  "Let the world wait. You come first.",
  "Your nervous system is trying to protect you. Thank it.",
  "Stillness is not laziness. Rest is productive.",
  "You are more than this moment.",
  "Ground yourself: feel your feet on the floor."
];

const stats = LoveSparkStats.createAccumulator('escapesToday', 'escapesTotal',
  () => LoveSparkBadge.update('isEnabled', 'escapesToday'));

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'escapesToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('escapesToday');
  await LoveSparkBadge.update('isEnabled', 'escapesToday');
});

chrome.commands.onCommand.addListener((command) => {
  if (command === 'panic') {
    chrome.action.openPopup();
  }
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('escapesToday');
      const data = await chrome.storage.local.get(['escapesToday', 'escapesTotal', 'isEnabled']);
      return {
        ...data,
        escapesToday: data.escapesToday || 0,
        escapesTotal: data.escapesTotal || 0,
        isEnabled: data.isEnabled !== false,
        message: MESSAGES[Math.floor(Math.random() * MESSAGES.length)]
      };
    }
    case 'LOG_ESCAPE': {
      await stats.bump(1);
      return { ok: true };
    }
    case 'GET_MESSAGE': {
      return { message: MESSAGES[Math.floor(Math.random() * MESSAGES.length)] };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'escapesToday');
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
