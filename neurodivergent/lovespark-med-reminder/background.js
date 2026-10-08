'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  takenToday: 0,
  takenTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  reminders: [
    { id: 'morning', label: 'Morning meds', time: '08:00', taken: false },
    { id: 'evening', label: 'Evening meds', time: '20:00', taken: false }
  ],
  theme: 'retro'
};

const stats = LoveSparkStats.createAccumulator('takenToday', 'takenTotal',
  () => updateBadge());

async function updateBadge() {
  const data = await chrome.storage.local.get(['isEnabled', 'reminders']);
  if (data.isEnabled === false) { chrome.action.setBadgeText({ text: '' }); return; }
  const reminders = data.reminders || [];
  const pending = reminders.filter(r => !r.taken).length;
  if (pending > 0) {
    chrome.action.setBadgeText({ text: String(pending) });
    chrome.action.setBadgeBackgroundColor({ color: '#E8457C' });
  } else {
    chrome.action.setBadgeText({ text: '\u2713' });
    chrome.action.setBadgeBackgroundColor({ color: '#00B894' });
  }
}

async function checkDailyReset() {
  const data = await chrome.storage.local.get(['lastResetDate', 'reminders']);
  const today = LoveSparkStats.todayStr();
  if (data.lastResetDate !== today) {
    const reminders = (data.reminders || []).map(r => ({ ...r, taken: false }));
    await chrome.storage.local.set({ lastResetDate: today, reminders, takenToday: 0 });
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  chrome.alarms.create('med-check', { periodInMinutes: 15 });
  await updateBadge();
});

chrome.runtime.onStartup.addListener(async () => {
  await checkDailyReset();
  chrome.alarms.create('med-check', { periodInMinutes: 15 });
  await updateBadge();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'med-check') {
    await checkDailyReset();
    await updateBadge();
  }
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await checkDailyReset();
      const data = await chrome.storage.local.get(['takenToday', 'takenTotal', 'isEnabled', 'reminders']);
      return {
        takenToday: data.takenToday || 0,
        takenTotal: data.takenTotal || 0,
        isEnabled: data.isEnabled !== false,
        reminders: data.reminders || []
      };
    }
    case 'TAKE_MED': {
      const data = await chrome.storage.local.get('reminders');
      const reminders = data.reminders || [];
      const r = reminders.find(rem => rem.id === msg.id);
      if (r && !r.taken) {
        r.taken = true;
        await chrome.storage.local.set({ reminders });
        await stats.bump(1);
      }
      await updateBadge();
      return { ok: true, reminders };
    }
    case 'UNDO_MED': {
      const data = await chrome.storage.local.get('reminders');
      const reminders = data.reminders || [];
      const r = reminders.find(rem => rem.id === msg.id);
      if (r) { r.taken = false; await chrome.storage.local.set({ reminders }); }
      await updateBadge();
      return { ok: true, reminders };
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
