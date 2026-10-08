'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  checkinsToday: 0,
  checkinsTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  moodLog: [],
  theme: 'retro'
};

const MOODS = {
  amazing:  { emoji: '\u{1F929}', flower: '\u{1F33B}', label: 'Amazing', value: 5 },
  good:     { emoji: '\u{1F60A}', flower: '\u{1F338}', label: 'Good', value: 4 },
  okay:     { emoji: '\u{1F642}', flower: '\u{1F33C}', label: 'Okay', value: 3 },
  low:      { emoji: '\u{1F614}', flower: '\u{1F33F}', label: 'Low', value: 2 },
  rough:    { emoji: '\u{1F62D}', flower: '\u{1F331}', label: 'Rough', value: 1 }
};

const stats = LoveSparkStats.createAccumulator('checkinsToday', 'checkinsTotal',
  () => LoveSparkBadge.update('isEnabled', 'checkinsToday'));

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'checkinsToday');
  chrome.alarms.get('daily-reset', (existing) => {
    if (!existing) chrome.alarms.create('daily-reset', { periodInMinutes: 60 });
  });
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('checkinsToday');
  await LoveSparkBadge.update('isEnabled', 'checkinsToday');
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'daily-reset') {
    await LoveSparkStats.checkDailyReset('checkinsToday');
  }
});

function getFlowerForStreak(streak) {
  if (streak <= 0) return { emoji: '\u{1F331}', label: 'Seed' };
  if (streak <= 2) return { emoji: '\u{1F33F}', label: 'Sprout' };
  if (streak <= 6) return { emoji: '\u{1F33C}', label: 'Daisy' };
  if (streak <= 13) return { emoji: '\u{1F338}', label: 'Cherry Blossom' };
  if (streak <= 29) return { emoji: '\u{1F33B}', label: 'Sunflower' };
  return { emoji: '\u{1F490}', label: 'Bouquet' };
}

function computeStreak(log) {
  if (log.length === 0) return 0;
  let streak = 0;
  const today = LoveSparkStats.todayStr();
  const sorted = [...log].sort((a, b) => b.date.localeCompare(a.date));
  const dates = [...new Set(sorted.map(e => e.date))];

  for (let i = 0; i < dates.length; i++) {
    const expected = new Date();
    expected.setDate(expected.getDate() - i);
    const expectedStr = expected.toISOString().slice(0, 10);
    if (dates[i] === expectedStr) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

function getWeekGarden(log) {
  const garden = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    const dayName = d.toLocaleDateString('en', { weekday: 'short' });
    const entries = log.filter(e => e.date === dateStr);
    const avgMood = entries.length > 0
      ? Math.round(entries.reduce((sum, e) => sum + e.value, 0) / entries.length)
      : 0;
    const moodEntry = Object.values(MOODS).find(m => m.value === avgMood);
    garden.push({
      date: dateStr,
      day: dayName,
      flower: moodEntry ? moodEntry.flower : '\u{2B1C}',
      mood: moodEntry ? moodEntry.label : 'No entry',
      count: entries.length,
      isToday: i === 0
    });
  }
  return garden;
}

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('checkinsToday');
      const data = await chrome.storage.local.get([
        'checkinsToday', 'checkinsTotal', 'isEnabled', 'moodLog'
      ]);
      const log = data.moodLog || [];
      const streak = computeStreak(log);
      const streakFlower = getFlowerForStreak(streak);
      const garden = getWeekGarden(log);
      const todayEntries = log.filter(e => e.date === LoveSparkStats.todayStr());
      return {
        checkinsToday: data.checkinsToday || 0,
        checkinsTotal: data.checkinsTotal || 0,
        isEnabled: data.isEnabled !== false,
        streak,
        streakFlower,
        garden,
        todayMood: todayEntries.length > 0 ? todayEntries[todayEntries.length - 1] : null,
        moods: MOODS
      };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'checkinsToday');
      return { ok: true };
    }
    case 'LOG_MOOD': {
      const mood = MOODS[msg.mood];
      if (!mood) return { error: 'Invalid mood' };
      const data = await chrome.storage.local.get('moodLog');
      const log = data.moodLog || [];
      const entry = {
        mood: msg.mood,
        emoji: mood.emoji,
        flower: mood.flower,
        label: mood.label,
        value: mood.value,
        note: (msg.note || '').trim().slice(0, 140),
        date: LoveSparkStats.todayStr(),
        time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' })
      };
      log.push(entry);
      // Keep max 90 days of entries
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 90);
      const cutoffStr = cutoff.toISOString().slice(0, 10);
      const pruned = log.filter(e => e.date >= cutoffStr);
      await chrome.storage.local.set({ moodLog: pruned });
      await stats.bump(1);
      const streak = computeStreak(pruned);
      return { ok: true, entry, streak, streakFlower: getFlowerForStreak(streak) };
    }
    case 'DELETE_LAST': {
      const data = await chrome.storage.local.get('moodLog');
      const log = data.moodLog || [];
      if (log.length > 0) log.pop();
      await chrome.storage.local.set({ moodLog: log });
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
