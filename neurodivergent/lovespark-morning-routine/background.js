'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULT_STEPS = [
  { id: 'meds', text: 'Take meds', emoji: '\u{1F48A}' },
  { id: 'water', text: 'Drink water', emoji: '\u{1F4A7}' },
  { id: 'breakfast', text: 'Eat something', emoji: '\u{1F373}' },
  { id: 'hygiene', text: 'Brush teeth / wash face', emoji: '\u{1FAA5}' },
  { id: 'plan', text: 'Plan your day (3 things)', emoji: '\u{1F4DD}' },
  { id: 'move', text: 'Move your body (stretch / walk)', emoji: '\u{1F3C3}' }
];

const DEFAULTS = {
  routinesCompleted: 0,
  routinesTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  steps: DEFAULT_STEPS,
  todayChecked: [],
  streak: 0,
  theme: 'retro'
};

const stats = LoveSparkStats.createAccumulator('routinesCompleted', 'routinesTotal',
  () => updateBadge());

async function updateBadge() {
  const data = await chrome.storage.local.get(['isEnabled', 'todayChecked', 'steps']);
  const steps = data.steps || DEFAULT_STEPS;
  const checked = data.todayChecked || [];
  const pct = steps.length > 0 ? Math.round((checked.length / steps.length) * 100) : 0;
  if (pct >= 100) {
    chrome.action.setBadgeText({ text: '\u2713' });
    chrome.action.setBadgeBackgroundColor({ color: '#00B894' });
  } else if (pct > 0) {
    chrome.action.setBadgeText({ text: pct + '%' });
    chrome.action.setBadgeBackgroundColor({ color: '#D63466' });
  } else {
    await LoveSparkBadge.update('isEnabled', 'routinesCompleted');
  }
}

async function checkDailyReset() {
  const data = await chrome.storage.local.get(['lastResetDate', 'todayChecked', 'steps', 'streak']);
  const today = LoveSparkStats.todayStr();
  if (data.lastResetDate !== today) {
    const steps = data.steps || DEFAULT_STEPS;
    const wasComplete = (data.todayChecked || []).length >= steps.length;
    const newStreak = wasComplete ? (data.streak || 0) + 1 : 0;
    await chrome.storage.local.set({
      lastResetDate: today,
      todayChecked: [],
      streak: newStreak,
      routinesCompleted: 0
    });
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await updateBadge();
});

chrome.runtime.onStartup.addListener(async () => {
  await checkDailyReset();
  await updateBadge();
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await checkDailyReset();
      const data = await chrome.storage.local.get([
        'routinesCompleted', 'routinesTotal', 'isEnabled', 'steps', 'todayChecked', 'streak'
      ]);
      return {
        routinesCompleted: data.routinesCompleted || 0,
        routinesTotal: data.routinesTotal || 0,
        isEnabled: data.isEnabled !== false,
        steps: data.steps || DEFAULT_STEPS,
        todayChecked: data.todayChecked || [],
        streak: data.streak || 0
      };
    }
    case 'CHECK_STEP': {
      const data = await chrome.storage.local.get(['todayChecked', 'steps']);
      const checked = data.todayChecked || [];
      const steps = data.steps || DEFAULT_STEPS;
      if (!checked.includes(msg.stepId)) {
        checked.push(msg.stepId);
        await chrome.storage.local.set({ todayChecked: checked });
        if (checked.length >= steps.length) {
          await stats.bump(1);
        }
      }
      await updateBadge();
      return { ok: true, todayChecked: checked };
    }
    case 'UNCHECK_STEP': {
      const data = await chrome.storage.local.get('todayChecked');
      const checked = (data.todayChecked || []).filter(id => id !== msg.stepId);
      await chrome.storage.local.set({ todayChecked: checked });
      await updateBadge();
      return { ok: true, todayChecked: checked };
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
