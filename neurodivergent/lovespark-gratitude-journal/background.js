'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  entriestoday: 0,
  entriesTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  entries: [],
  theme: 'retro'
};

const PROMPTS = [
  "Something that made you smile today",
  "A person you're grateful for",
  "Something your body did for you today",
  "A small comfort you enjoyed",
  "Something you learned recently",
  "A sound that made you feel calm",
  "Something you're looking forward to",
  "A skill you have that you appreciate",
  "A moment of peace you experienced",
  "Something in nature you noticed"
];

const stats = LoveSparkStats.createAccumulator('entriesToday', 'entriesTotal',
  () => LoveSparkBadge.update('isEnabled', 'entriesToday'));

function computeStreak(entries) {
  const dates = [...new Set(entries.map(e => e.date))].sort().reverse();
  let streak = 0;
  for (let i = 0; i < dates.length; i++) {
    const expected = new Date();
    expected.setDate(expected.getDate() - i);
    if (dates[i] === expected.toISOString().slice(0, 10)) {
      streak++;
    } else break;
  }
  return streak;
}

function getGardenFlower(streak) {
  if (streak <= 0) return { emoji: '\u{1F331}', label: 'Seed' };
  if (streak <= 2) return { emoji: '\u{1F33F}', label: 'Sprout' };
  if (streak <= 6) return { emoji: '\u{1F33C}', label: 'Daisy' };
  if (streak <= 13) return { emoji: '\u{1F338}', label: 'Blossom' };
  if (streak <= 29) return { emoji: '\u{1F33B}', label: 'Sunflower' };
  return { emoji: '\u{1F490}', label: 'Bouquet' };
}

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'entriesToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('entriesToday');
  await LoveSparkBadge.update('isEnabled', 'entriesToday');
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('entriesToday');
      const data = await chrome.storage.local.get([
        'entriesToday', 'entriesTotal', 'isEnabled', 'entries'
      ]);
      const entries = data.entries || [];
      const today = LoveSparkStats.todayStr();
      const todayEntries = entries.filter(e => e.date === today);
      const streak = computeStreak(entries);
      const prompt = PROMPTS[Math.floor(Math.random() * PROMPTS.length)];
      return {
        entriesToday: data.entriesToday || 0,
        entriesTotal: data.entriesTotal || 0,
        isEnabled: data.isEnabled !== false,
        todayEntries,
        todayCount: todayEntries.length,
        streak,
        flower: getGardenFlower(streak),
        prompt,
        totalEntries: entries.length
      };
    }
    case 'ADD_ENTRY': {
      const text = (msg.text || '').trim().slice(0, 200);
      if (!text) return { error: 'Empty entry' };
      const data = await chrome.storage.local.get('entries');
      const entries = data.entries || [];
      const today = LoveSparkStats.todayStr();
      const todayCount = entries.filter(e => e.date === today).length;
      if (todayCount >= 3) return { error: 'Maximum 3 entries per day' };
      const entry = {
        text,
        date: today,
        time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
      };
      entries.push(entry);
      // Keep 90 days
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 90);
      const pruned = entries.filter(e => e.date >= cutoff.toISOString().slice(0, 10));
      await chrome.storage.local.set({ entries: pruned });
      await stats.bump(1);
      const streak = computeStreak(pruned);
      return { ok: true, entry, streak, flower: getGardenFlower(streak), todayCount: todayCount + 1 };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'entriesToday');
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
