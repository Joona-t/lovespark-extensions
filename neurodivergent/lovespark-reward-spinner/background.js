'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

var DEFAULT_REWARDS = [
  '5 min social media break',
  'Watch one funny video',
  'Eat a treat',
  'Play a quick game',
  'Take a walk outside',
  'Listen to a favorite song'
];

var DEFAULTS = {
  spinsToday: 0,
  spinsTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  rewards: DEFAULT_REWARDS,
  theme: 'retro'
};

var stats = LoveSparkStats.createAccumulator('spinsToday', 'spinsTotal',
  function() { LoveSparkBadge.update('isEnabled', 'spinsToday'); });

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'spinsToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('spinsToday');
  await LoveSparkBadge.update('isEnabled', 'spinsToday');
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('spinsToday');
      var data = await chrome.storage.local.get([
        'spinsToday', 'spinsTotal', 'isEnabled', 'rewards'
      ]);
      return {
        spinsToday: data.spinsToday || 0,
        spinsTotal: data.spinsTotal || 0,
        isEnabled: data.isEnabled !== false,
        rewards: data.rewards || DEFAULT_REWARDS
      };
    }
    case 'SPIN': {
      var data = await chrome.storage.local.get('rewards');
      var rewards = data.rewards || DEFAULT_REWARDS;
      if (rewards.length === 0) return { error: 'No rewards on the wheel!' };
      var idx = Math.floor(Math.random() * rewards.length);
      await stats.bump(1);
      return { ok: true, reward: rewards[idx], index: idx };
    }
    case 'ADD_REWARD': {
      var text = (msg.text || '').trim().slice(0, 100);
      if (!text) return { error: 'Empty reward' };
      var data = await chrome.storage.local.get('rewards');
      var rewards = data.rewards || [];
      if (rewards.length >= 20) return { error: 'Maximum 20 rewards' };
      rewards.push(text);
      await chrome.storage.local.set({ rewards: rewards });
      return { ok: true, rewards: rewards };
    }
    case 'REMOVE_REWARD': {
      var idx = msg.index;
      var data = await chrome.storage.local.get('rewards');
      var rewards = data.rewards || [];
      if (idx < 0 || idx >= rewards.length) return { error: 'Invalid index' };
      rewards.splice(idx, 1);
      await chrome.storage.local.set({ rewards: rewards });
      return { ok: true, rewards: rewards };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'spinsToday');
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
