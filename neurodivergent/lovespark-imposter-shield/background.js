'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const COUNTER_THOUGHTS = [
  "You are here because you earned it. Not luck. Work.",
  "Feeling like a fraud is common among high-achievers. It's a sign you care, not that you're fake.",
  "If you were truly incompetent, you wouldn't worry about being incompetent.",
  "Your accomplishments are real. Your brain is lying about them.",
  "You don't need to know everything. Nobody does. Learning on the job is normal.",
  "Compare yourself to where you started, not to everyone else's highlight reel.",
  "The people who hired/chose/trusted you were not fooled. They made an informed decision.",
  "Imposter syndrome hits hardest in people who actually care about quality.",
  "You are allowed to take up space and be visible.",
  "Being nervous doesn't mean you're not ready. It means you're paying attention.",
  "Your ADHD brain amplifies self-doubt. That's neurology, not truth.",
  "Look at the evidence vault below. Those are YOUR accomplishments."
];

const DEFAULTS = {
  shieldsToday: 0,
  shieldsTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  vault: [],
  theme: 'retro'
};

const stats = LoveSparkStats.createAccumulator('shieldsToday', 'shieldsTotal',
  () => LoveSparkBadge.update('isEnabled', 'shieldsToday'));

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('shieldsToday');
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('shieldsToday');
      const data = await chrome.storage.local.get(['shieldsToday', 'shieldsTotal', 'isEnabled', 'vault']);
      const thought = COUNTER_THOUGHTS[Math.floor(Math.random() * COUNTER_THOUGHTS.length)];
      await stats.bump(1);
      return {
        shieldsToday: (data.shieldsToday || 0) + 1,
        shieldsTotal: (data.shieldsTotal || 0) + 1,
        isEnabled: data.isEnabled !== false,
        vault: data.vault || [],
        thought
      };
    }
    case 'ADD_EVIDENCE': {
      const text = (msg.text || '').trim().slice(0, 200);
      if (!text) return { error: 'Empty entry' };
      const data = await chrome.storage.local.get('vault');
      const vault = data.vault || [];
      if (vault.length >= 100) return { error: 'Vault full (100 max)' };
      vault.push({ text, date: LoveSparkStats.todayStr(), id: Date.now().toString(36) });
      await chrome.storage.local.set({ vault });
      return { ok: true, vault };
    }
    case 'SHAKE_VAULT': {
      const data = await chrome.storage.local.get('vault');
      const vault = data.vault || [];
      if (vault.length === 0) return { error: 'Your vault is empty. Add some evidence first!' };
      return { evidence: vault[Math.floor(Math.random() * vault.length)] };
    }
    case 'GET_THOUGHT': {
      return { thought: COUNTER_THOUGHTS[Math.floor(Math.random() * COUNTER_THOUGHTS.length)] };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
