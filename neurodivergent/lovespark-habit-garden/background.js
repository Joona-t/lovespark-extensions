'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  habits: [],
  completionsToday: 0,
  completionsTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  theme: 'retro'
};

const stats = LoveSparkStats.createAccumulator('completionsToday', 'completionsTotal',
  () => LoveSparkBadge.update('isEnabled', 'completionsToday'));

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'completionsToday');
  chrome.alarms.get('daily-reset', (existing) => {
    if (!existing) chrome.alarms.create('daily-reset', { periodInMinutes: 60 });
  });
});

chrome.runtime.onStartup.addListener(async () => {
  await processNewDay();
  await LoveSparkBadge.update('isEnabled', 'completionsToday');
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'daily-reset') await processNewDay();
});

async function processNewDay() {
  const data = await chrome.storage.local.get(['habits', 'lastResetDate']);
  const today = LoveSparkStats.todayStr();
  if (data.lastResetDate === today) return;

  const habits = data.habits || [];
  for (const habit of habits) {
    if (habit.completedToday) {
      habit.completedToday = false;
    } else if (habit.streak > 0) {
      habit.streak = 0;
    }
  }

  await chrome.storage.local.set({ habits, completionsToday: 0, lastResetDate: today });
  await LoveSparkBadge.update('isEnabled', 'completionsToday');
}

function getPlantStage(streak) {
  if (streak <= 0) return { emoji: '\u{1F331}', label: 'Seed', stage: 0 };
  if (streak <= 2) return { emoji: '\u{1F33E}', label: 'Sprout', stage: 1 };
  if (streak <= 6) return { emoji: '\u{1F33F}', label: 'Seedling', stage: 2 };
  if (streak <= 13) return { emoji: '\u{1F33B}', label: 'Flower', stage: 3 };
  if (streak <= 29) return { emoji: '\u{1F338}', label: 'Blossom', stage: 4 };
  return { emoji: '\u{1F333}', label: 'Tree', stage: 5 };
}

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await processNewDay();
      const data = await chrome.storage.local.get([
        'habits', 'completionsToday', 'completionsTotal', 'isEnabled'
      ]);
      const habits = (data.habits || []).map(h => ({
        ...h, plant: getPlantStage(h.streak)
      }));
      return {
        habits,
        completionsToday: data.completionsToday || 0,
        completionsTotal: data.completionsTotal || 0,
        isEnabled: data.isEnabled !== false
      };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'completionsToday');
      return { ok: true };
    }
    case 'ADD_HABIT': {
      const data = await chrome.storage.local.get('habits');
      const habits = data.habits || [];
      if (habits.length >= 12) return { error: 'Maximum 12 habits' };
      const newHabit = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: msg.name.trim().slice(0, 40),
        streak: 0, bestStreak: 0, completedToday: false, createdAt: Date.now()
      };
      habits.push(newHabit);
      await chrome.storage.local.set({ habits });
      return { ok: true, habit: { ...newHabit, plant: getPlantStage(0) } };
    }
    case 'COMPLETE_HABIT': {
      const data = await chrome.storage.local.get('habits');
      const habits = data.habits || [];
      const habit = habits.find(h => h.id === msg.id);
      if (!habit) return { error: 'Habit not found' };
      if (habit.completedToday) return { ok: true, already: true };
      habit.completedToday = true;
      habit.streak++;
      if (habit.streak > habit.bestStreak) habit.bestStreak = habit.streak;
      await chrome.storage.local.set({ habits });
      await stats.bump(1);
      return { ok: true, habit: { ...habit, plant: getPlantStage(habit.streak) } };
    }
    case 'UNCOMPLETE_HABIT': {
      const data = await chrome.storage.local.get('habits');
      const habits = data.habits || [];
      const habit = habits.find(h => h.id === msg.id);
      if (!habit || !habit.completedToday) return { ok: true };
      habit.completedToday = false;
      habit.streak = Math.max(0, habit.streak - 1);
      await chrome.storage.local.set({ habits });
      return { ok: true };
    }
    case 'DELETE_HABIT': {
      const data = await chrome.storage.local.get('habits');
      const habits = (data.habits || []).filter(h => h.id !== msg.id);
      await chrome.storage.local.set({ habits });
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
