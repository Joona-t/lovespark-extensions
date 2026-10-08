'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  minutesToday: 0,
  minutesTotal: 0,
  sessionsToday: 0,
  sessionsTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  currentSession: null,
  sessionLog: [],
  theme: 'retro'
};

const ENCOURAGEMENTS = [
  "I'm right here with you.",
  "You're doing great. Keep going.",
  "One thing at a time. No rush.",
  "Still here. Still proud of you.",
  "Focus is a muscle. You're training it.",
  "Your brain is working hard. I see that.",
  "Almost there! Or not. That's okay too.",
  "You showed up. That's the hardest part.",
  "Deep breath. You've got this.",
  "I'm not going anywhere.",
  "Small progress is still progress.",
  "You don't have to be perfect right now.",
  "I believe in you, even when you don't.",
  "This moment counts. You're here for it.",
  "Rest when you need to. I'll wait.",
  "Your effort matters, even when it's invisible.",
];

const PRESETS = {
  sprint:   { minutes: 15, label: 'Sprint',  emoji: '\u{26A1}' },
  flow:     { minutes: 25, label: 'Flow',    emoji: '\u{1F33A}' },
  deep:     { minutes: 45, label: 'Deep',    emoji: '\u{1F30A}' },
  marathon: { minutes: 60, label: 'Marathon', emoji: '\u{1F525}' }
};

const stats = LoveSparkStats.createAccumulator('minutesToday', 'minutesTotal',
  () => LoveSparkBadge.update('isEnabled', 'minutesToday'));

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'minutesToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('minutesToday', 'sessionsToday');
  await LoveSparkBadge.update('isEnabled', 'minutesToday');
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'session-tick') {
    const data = await chrome.storage.local.get('currentSession');
    const session = data.currentSession;
    if (!session || !session.active) return;

    const elapsed = Math.floor((Date.now() - session.startedAt) / 60000);
    if (elapsed >= session.targetMinutes) {
      // Session complete
      session.active = false;
      session.completedAt = Date.now();
      session.actualMinutes = session.targetMinutes;
      await chrome.storage.local.set({ currentSession: session });
      await logSession(session);
      await stats.bump(session.targetMinutes);
      await bumpSessions();
      chrome.alarms.clear('session-tick');
    }
  }
  if (alarm.name === 'daily-reset') {
    await LoveSparkStats.checkDailyReset('minutesToday', 'sessionsToday');
  }
});

async function bumpSessions() {
  const data = await chrome.storage.local.get(['sessionsToday', 'sessionsTotal']);
  await chrome.storage.local.set({
    sessionsToday: (data.sessionsToday || 0) + 1,
    sessionsTotal: (data.sessionsTotal || 0) + 1
  });
}

async function logSession(session) {
  const data = await chrome.storage.local.get('sessionLog');
  const log = data.sessionLog || [];
  log.push({
    preset: session.preset,
    targetMinutes: session.targetMinutes,
    actualMinutes: session.actualMinutes || 0,
    date: LoveSparkStats.todayStr(),
    completedAt: session.completedAt || Date.now()
  });
  // Keep 30 days
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 30);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const pruned = log.filter(e => e.date >= cutoffStr);
  await chrome.storage.local.set({ sessionLog: pruned });
}

function getEncouragement() {
  return ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
}

function getSessionState(session) {
  if (!session || !session.active) {
    return { active: false, elapsed: 0, remaining: 0, progress: 0, encouragement: getEncouragement() };
  }
  const elapsed = Math.floor((Date.now() - session.startedAt) / 60000);
  const remaining = Math.max(0, session.targetMinutes - elapsed);
  const progress = Math.min(100, Math.round((elapsed / session.targetMinutes) * 100));
  return {
    active: true,
    preset: session.preset,
    targetMinutes: session.targetMinutes,
    elapsed,
    remaining,
    progress,
    encouragement: getEncouragement()
  };
}

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('minutesToday', 'sessionsToday');
      const data = await chrome.storage.local.get([
        'minutesToday', 'minutesTotal', 'sessionsToday', 'sessionsTotal',
        'isEnabled', 'currentSession', 'sessionLog'
      ]);
      const session = getSessionState(data.currentSession);
      const todaySessions = (data.sessionLog || []).filter(
        e => e.date === LoveSparkStats.todayStr()
      );
      return {
        minutesToday: data.minutesToday || 0,
        minutesTotal: data.minutesTotal || 0,
        sessionsToday: data.sessionsToday || 0,
        sessionsTotal: data.sessionsTotal || 0,
        isEnabled: data.isEnabled !== false,
        session,
        todaySessions,
        presets: PRESETS
      };
    }
    case 'START_SESSION': {
      const preset = PRESETS[msg.preset];
      if (!preset) return { error: 'Invalid preset' };
      const session = {
        preset: msg.preset,
        targetMinutes: preset.minutes,
        startedAt: Date.now(),
        active: true
      };
      await chrome.storage.local.set({ currentSession: session });
      chrome.alarms.create('session-tick', { periodInMinutes: 1 });
      return { ok: true, session: getSessionState(session) };
    }
    case 'STOP_SESSION': {
      const data = await chrome.storage.local.get('currentSession');
      const session = data.currentSession;
      if (session && session.active) {
        const elapsed = Math.floor((Date.now() - session.startedAt) / 60000);
        session.active = false;
        session.completedAt = Date.now();
        session.actualMinutes = elapsed;
        await chrome.storage.local.set({ currentSession: session });
        if (elapsed > 0) {
          await logSession(session);
          await stats.bump(elapsed);
          await bumpSessions();
        }
      }
      chrome.alarms.clear('session-tick');
      return { ok: true };
    }
    case 'GET_ENCOURAGEMENT': {
      return { encouragement: getEncouragement() };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'minutesToday');
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
