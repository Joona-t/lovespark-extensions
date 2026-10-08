'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  checklistsToday: 0,
  checklistsTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  customPrompts: null,
  theme: 'retro'
};

const DEFAULT_PROMPTS = [
  { id: 'materials', text: 'Do I have everything I need?', emoji: '\u{1F4E6}' },
  { id: 'first-step', text: 'Do I know the very first step?', emoji: '\u{1F463}' },
  { id: 'time', text: 'How long will this realistically take?', emoji: '\u{23F0}' },
  { id: 'distractions', text: 'What might distract me?', emoji: '\u{1F6E1}' },
  { id: 'energy', text: 'Do I have enough energy for this right now?', emoji: '\u{26A1}' },
  { id: 'reward', text: 'What will I do when I finish?', emoji: '\u{1F3C6}' }
];

const stats = LoveSparkStats.createAccumulator('checklistsToday', 'checklistsTotal',
  () => LoveSparkBadge.update('isEnabled', 'checklistsToday'));

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'checklistsToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('checklistsToday');
  await LoveSparkBadge.update('isEnabled', 'checklistsToday');
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('checklistsToday');
      const data = await chrome.storage.local.get([
        'checklistsToday', 'checklistsTotal', 'isEnabled', 'customPrompts'
      ]);
      return {
        checklistsToday: data.checklistsToday || 0,
        checklistsTotal: data.checklistsTotal || 0,
        isEnabled: data.isEnabled !== false,
        prompts: data.customPrompts || DEFAULT_PROMPTS
      };
    }
    case 'COMPLETE_CHECKLIST': {
      await stats.bump(1);
      return { ok: true };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'checklistsToday');
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
