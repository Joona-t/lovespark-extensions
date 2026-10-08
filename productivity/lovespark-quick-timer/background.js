'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  timersToday: 0,
  timersTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  activeTimer: null,
  theme: 'retro'
};

const stats = LoveSparkStats.createAccumulator('timersToday', 'timersTotal',
  () => updateBadge());

async function updateBadge() {
  const data = await chrome.storage.local.get(['isEnabled', 'activeTimer']);
  if (data.activeTimer && data.activeTimer.running) {
    const remaining = Math.max(0, data.activeTimer.endsAt - Date.now());
    const mins = Math.ceil(remaining / 60000);
    chrome.action.setBadgeText({ text: mins > 0 ? String(mins) : '!' });
    chrome.action.setBadgeBackgroundColor({ color: mins > 0 ? '#D63466' : '#00B894' });
  } else {
    await LoveSparkBadge.update('isEnabled', 'timersToday');
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await updateBadge();
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('timersToday');
  await updateBadge();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'timer-tick') {
    const data = await chrome.storage.local.get('activeTimer');
    const timer = data.activeTimer;
    if (!timer || !timer.running) {
      chrome.alarms.clear('timer-tick');
      return;
    }
    const remaining = timer.endsAt - Date.now();
    if (remaining <= 0) {
      timer.running = false;
      timer.completed = true;
      await chrome.storage.local.set({ activeTimer: timer });
      await stats.bump(1);
      chrome.alarms.clear('timer-tick');
      chrome.action.setBadgeText({ text: '!' });
      chrome.action.setBadgeBackgroundColor({ color: '#00B894' });
    } else {
      await updateBadge();
    }
  }
});

function getTimerState(timer) {
  if (!timer) return { running: false, remaining: 0, progress: 0, totalMinutes: 0 };
  if (!timer.running && timer.completed) {
    return { running: false, completed: true, remaining: 0, progress: 100, totalMinutes: timer.totalMinutes };
  }
  if (!timer.running) return { running: false, remaining: 0, progress: 0, totalMinutes: 0 };
  const remaining = Math.max(0, timer.endsAt - Date.now());
  const total = timer.totalMinutes * 60000;
  const elapsed = total - remaining;
  const progress = total > 0 ? Math.min(100, Math.round((elapsed / total) * 100)) : 0;
  return {
    running: true,
    remaining: Math.ceil(remaining / 1000),
    remainingMinutes: Math.ceil(remaining / 60000),
    progress,
    totalMinutes: timer.totalMinutes
  };
}

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('timersToday');
      const data = await chrome.storage.local.get([
        'timersToday', 'timersTotal', 'isEnabled', 'activeTimer'
      ]);
      return {
        timersToday: data.timersToday || 0,
        timersTotal: data.timersTotal || 0,
        isEnabled: data.isEnabled !== false,
        timer: getTimerState(data.activeTimer)
      };
    }
    case 'START_TIMER': {
      const minutes = Math.max(1, Math.min(120, parseInt(msg.minutes) || 0));
      const timer = {
        totalMinutes: minutes,
        startedAt: Date.now(),
        endsAt: Date.now() + minutes * 60000,
        running: true,
        completed: false
      };
      await chrome.storage.local.set({ activeTimer: timer });
      chrome.alarms.create('timer-tick', { periodInMinutes: 0.25 });
      await updateBadge();
      return { ok: true, timer: getTimerState(timer) };
    }
    case 'STOP_TIMER': {
      await chrome.storage.local.set({ activeTimer: null });
      chrome.alarms.clear('timer-tick');
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
