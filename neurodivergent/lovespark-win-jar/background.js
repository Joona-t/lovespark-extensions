'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  winsToday: 0,
  winsTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  wins: [],
  theme: 'retro'
};

const JAR_LEVELS = [
  { min: 0,   emoji: '\u{1FAD9}', label: 'Empty jar' },
  { min: 5,   emoji: '\u{1F36C}', label: 'A few wins' },
  { min: 15,  emoji: '\u{1F36D}', label: 'Getting full' },
  { min: 30,  emoji: '\u{1F370}', label: 'Half full' },
  { min: 50,  emoji: '\u{1F382}', label: 'Nearly full' },
  { min: 100, emoji: '\u{1F3C6}', label: 'Overflowing!' }
];

const CELEBRATIONS = [
  "Look at you go!",
  "That's a real win!",
  "Into the jar it goes!",
  "Your brain might forget, but the jar won't.",
  "Win collected! You're building proof.",
  "Noted. You did that.",
  "Another one for the collection!",
  "Small win? No. A win is a win.",
];

const stats = LoveSparkStats.createAccumulator('winsToday', 'winsTotal',
  () => LoveSparkBadge.update('isEnabled', 'winsToday'));

function getJarLevel(count) {
  let level = JAR_LEVELS[0];
  for (const l of JAR_LEVELS) {
    if (count >= l.min) level = l;
  }
  return level;
}

function getCelebration() {
  return CELEBRATIONS[Math.floor(Math.random() * CELEBRATIONS.length)];
}

function computeStreak(wins) {
  if (wins.length === 0) return 0;
  const dates = [...new Set(wins.map(w => w.date))].sort().reverse();
  let streak = 0;
  for (let i = 0; i < dates.length; i++) {
    const expected = new Date();
    expected.setDate(expected.getDate() - i);
    if (dates[i] === expected.toISOString().slice(0, 10)) {
      streak++;
    } else {
      break;
    }
  }
  return streak;
}

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'winsToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('winsToday');
  await LoveSparkBadge.update('isEnabled', 'winsToday');
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('winsToday');
      const data = await chrome.storage.local.get([
        'winsToday', 'winsTotal', 'isEnabled', 'wins'
      ]);
      const wins = data.wins || [];
      const jarLevel = getJarLevel(wins.length);
      const streak = computeStreak(wins);
      const todayWins = wins.filter(w => w.date === LoveSparkStats.todayStr());
      return {
        winsToday: data.winsToday || 0,
        winsTotal: data.winsTotal || 0,
        isEnabled: data.isEnabled !== false,
        jarLevel,
        totalWins: wins.length,
        streak,
        todayWins: todayWins.slice(-5),
        recentWins: wins.slice(-3)
      };
    }
    case 'ADD_WIN': {
      const text = (msg.text || '').trim().slice(0, 200);
      if (!text) return { error: 'Empty win' };
      const data = await chrome.storage.local.get('wins');
      const wins = data.wins || [];
      const win = {
        text,
        date: LoveSparkStats.todayStr(),
        time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }),
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
      };
      wins.push(win);
      // Keep max 500 wins
      const pruned = wins.slice(-500);
      await chrome.storage.local.set({ wins: pruned });
      await stats.bump(1);
      return {
        ok: true,
        win,
        celebration: getCelebration(),
        jarLevel: getJarLevel(pruned.length),
        totalWins: pruned.length
      };
    }
    case 'SHAKE_JAR': {
      const data = await chrome.storage.local.get('wins');
      const wins = data.wins || [];
      if (wins.length === 0) return { error: 'Jar is empty!' };
      const randomWin = wins[Math.floor(Math.random() * wins.length)];
      return { win: randomWin };
    }
    case 'DELETE_WIN': {
      const data = await chrome.storage.local.get('wins');
      const wins = (data.wins || []).filter(w => w.id !== msg.id);
      await chrome.storage.local.set({ wins });
      return { ok: true, totalWins: wins.length, jarLevel: getJarLevel(wins.length) };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'winsToday');
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
