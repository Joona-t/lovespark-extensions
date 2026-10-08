'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  shieldsToday: 0,
  shieldsTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  theme: 'retro'
};

const RSD_AFFIRMATIONS = [
  "Rejection sensitivity lies. You are loved and valued.",
  "This feeling is intense, but it is not the truth.",
  "Your brain is amplifying the pain. It will fade.",
  "You are not too much. The right people will stay.",
  "One comment does not define your worth.",
  "RSD is a neurological response, not a character flaw.",
  "You have survived every RSD episode before this one.",
  "The story your brain is telling you right now is not accurate.",
  "You deserve the same compassion you give to others.",
  "This is your nervous system in overdrive. It will calm down.",
  "No one is thinking about you as harshly as you think they are.",
  "Your sensitivity is also your superpower. It lets you feel deeply.",
  "You are not being rejected. Your brain is misinterpreting signals.",
  "In 20 minutes this feeling will be much less intense.",
  "You are safe. You are here. You are enough."
];

const stats = LoveSparkStats.createAccumulator('shieldsToday', 'shieldsTotal',
  () => LoveSparkBadge.update('isEnabled', 'shieldsToday'));

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'shieldsToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('shieldsToday');
  await LoveSparkBadge.update('isEnabled', 'shieldsToday');
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('shieldsToday');
      const data = await chrome.storage.local.get(['shieldsToday', 'shieldsTotal', 'isEnabled']);
      const affirmation = RSD_AFFIRMATIONS[Math.floor(Math.random() * RSD_AFFIRMATIONS.length)];
      await stats.bump(1);
      return {
        shieldsToday: (data.shieldsToday || 0) + 1,
        shieldsTotal: (data.shieldsTotal || 0) + 1,
        isEnabled: data.isEnabled !== false,
        affirmation
      };
    }
    case 'GET_NEW': {
      return { affirmation: RSD_AFFIRMATIONS[Math.floor(Math.random() * RSD_AFFIRMATIONS.length)] };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'shieldsToday');
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
