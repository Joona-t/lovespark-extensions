'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  pomosToday: 0,
  pomosTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  session: null,
  preset: 'classic',
  todayRoses: [],
  theme: 'retro'
};

const PRESETS = {
  short:   { work: 15, rest: 5,  label: 'Short' },
  classic: { work: 25, rest: 5,  label: 'Classic' },
  long:    { work: 50, rest: 10, label: 'Long' }
};

const ROSE_STAGES = ['\u{1F331}', '\u{1F33F}', '\u{1F339}', '\u{1F33A}', '\u{1F490}'];

const stats = LoveSparkStats.createAccumulator('pomosToday', 'pomosTotal',
  () => updateBadge());

async function updateBadge() {
  const data = await chrome.storage.local.get(['isEnabled', 'session']);
  if (data.session && data.session.active) {
    const remaining = Math.max(0, data.session.endsAt - Date.now());
    const mins = Math.ceil(remaining / 60000);
    const isBreak = data.session.phase === 'break';
    chrome.action.setBadgeText({ text: mins > 0 ? String(mins) : '!' });
    chrome.action.setBadgeBackgroundColor({ color: isBreak ? '#00B894' : '#D63466' });
  } else {
    await LoveSparkBadge.update('isEnabled', 'pomosToday');
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await updateBadge();
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('pomosToday');
  await updateBadge();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'pomo-tick') {
    const data = await chrome.storage.local.get('session');
    const session = data.session;
    if (!session || !session.active) {
      chrome.alarms.clear('pomo-tick');
      return;
    }
    if (Date.now() >= session.endsAt) {
      if (session.phase === 'work') {
        // Work done — start break
        const preset = PRESETS[session.preset] || PRESETS.classic;
        session.phase = 'break';
        session.endsAt = Date.now() + preset.rest * 60000;
        await chrome.storage.local.set({ session });
        // Log the completed pomo
        await stats.bump(1);
        const roses = (await chrome.storage.local.get('todayRoses')).todayRoses || [];
        roses.push({ time: new Date().toLocaleTimeString('en', { hour: '2-digit', minute: '2-digit' }) });
        await chrome.storage.local.set({ todayRoses: roses });
      } else {
        // Break done — stop
        session.active = false;
        session.completed = true;
        await chrome.storage.local.set({ session });
        chrome.alarms.clear('pomo-tick');
      }
    }
    await updateBadge();
  }
});

function getSessionState(session) {
  if (!session || !session.active) {
    return { active: false, phase: 'idle', remaining: 0, progress: 0 };
  }
  const remaining = Math.max(0, session.endsAt - Date.now());
  const preset = PRESETS[session.preset] || PRESETS.classic;
  const totalMs = (session.phase === 'work' ? preset.work : preset.rest) * 60000;
  const elapsed = totalMs - remaining;
  const progress = totalMs > 0 ? Math.min(100, Math.round((elapsed / totalMs) * 100)) : 0;
  return {
    active: true,
    phase: session.phase,
    preset: session.preset,
    remaining: Math.ceil(remaining / 1000),
    remainingMin: Math.ceil(remaining / 60000),
    progress,
    totalMin: session.phase === 'work' ? preset.work : preset.rest
  };
}

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('pomosToday');
      const data = await chrome.storage.local.get([
        'pomosToday', 'pomosTotal', 'isEnabled', 'session', 'preset', 'todayRoses'
      ]);
      // Reset roses on new day
      const today = LoveSparkStats.todayStr();
      let roses = data.todayRoses || [];
      return {
        pomosToday: data.pomosToday || 0,
        pomosTotal: data.pomosTotal || 0,
        isEnabled: data.isEnabled !== false,
        session: getSessionState(data.session),
        preset: data.preset || 'classic',
        roses,
        presets: PRESETS
      };
    }
    case 'START_POMO': {
      const presetKey = msg.preset || 'classic';
      const preset = PRESETS[presetKey];
      if (!preset) return { error: 'Invalid preset' };
      const session = {
        preset: presetKey,
        phase: 'work',
        startedAt: Date.now(),
        endsAt: Date.now() + preset.work * 60000,
        active: true,
        completed: false
      };
      await chrome.storage.local.set({ session, preset: presetKey });
      chrome.alarms.create('pomo-tick', { periodInMinutes: 0.25 });
      await updateBadge();
      return { ok: true, session: getSessionState(session) };
    }
    case 'STOP_POMO': {
      await chrome.storage.local.set({ session: null });
      chrome.alarms.clear('pomo-tick');
      await updateBadge();
      return { ok: true };
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
