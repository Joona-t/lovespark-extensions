'use strict';

// ── Helpers ───────────────────────────────────────────────────

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const DEFAULTS = {
  adsMutedToday: 0,
  adsMutedTotal: 0,
  timeSavedTotalSeconds: 0,
  lastResetDate: todayStr(),
  isEnabled: true,
};

// ── Install / Update ──────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    await chrome.storage.local.set(DEFAULTS);
  } else if (reason === 'update') {
    // Merge new defaults without overwriting existing values
    const existing = await chrome.storage.local.get(null);
    const toSet = {};
    for (const [k, v] of Object.entries(DEFAULTS)) {
      if (!(k in existing)) toSet[k] = v;
    }
    if (Object.keys(toSet).length) await chrome.storage.local.set(toSet);
  }
  chrome.action.setBadgeBackgroundColor({ color: '#E8457C' });
  scheduleAlarms();
  updateBadge();
});

chrome.runtime.onStartup.addListener(() => {
  chrome.action.setBadgeBackgroundColor({ color: '#E8457C' });
  scheduleAlarms();
  updateBadge();
});

// ── Alarms ────────────────────────────────────────────────────

function scheduleAlarms() {
  chrome.alarms.create('dailyReset', { periodInMinutes: 60 });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'dailyReset') await checkDailyReset();
});

async function checkDailyReset() {
  const data = await chrome.storage.local.get(['lastResetDate']);
  const today = todayStr();
  if (data.lastResetDate !== today) {
    await chrome.storage.local.set({
      adsMutedToday: 0,
      lastResetDate: today,
    });
    updateBadge();
  }
}

// ── Badge ─────────────────────────────────────────────────────

async function updateBadge() {
  const data = await chrome.storage.local.get(['adsMutedToday', 'isEnabled']);
  if (data.isEnabled === false) {
    chrome.action.setBadgeText({ text: 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: '#666666' });
    return;
  }
  const count = data.adsMutedToday || 0;
  chrome.action.setBadgeText({ text: count > 999 ? '999+' : count > 0 ? String(count) : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#E8457C' });
}

// ── Serial queue for stat mutations ──────────────────────────
// Prevents read-modify-write races when multiple AD_MUTED messages
// arrive concurrently (each awaits the previous before running).

let statQueue = Promise.resolve();

function serialStatUpdate(fn) {
  statQueue = statQueue.then(fn, fn);
  return statQueue;
}

// ── Messages ──────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  handleMessage(msg).then(sendResponse).catch(e => sendResponse({ error: e.message }));
  return true; // async
});

async function handleMessage(msg) {
  switch (msg.type) {
    case 'GET_STATS': {
      await checkDailyReset();
      return chrome.storage.local.get([
        'adsMutedToday', 'adsMutedTotal', 'timeSavedTotalSeconds',
        'lastResetDate', 'isEnabled',
      ]);
    }

    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      updateBadge();
      return { ok: true };
    }

    case 'AD_MUTED': {
      return serialStatUpdate(async function() {
        const data = await chrome.storage.local.get([
          'adsMutedToday', 'adsMutedTotal', 'timeSavedTotalSeconds', 'lastResetDate',
        ]);
        const today = todayStr();
        const needsReset = data.lastResetDate !== today;
        await chrome.storage.local.set({
          adsMutedToday: needsReset ? 1 : (data.adsMutedToday || 0) + 1,
          adsMutedTotal: (data.adsMutedTotal || 0) + 1,
          timeSavedTotalSeconds: (data.timeSavedTotalSeconds || 0) + (msg.duration || 0),
          lastResetDate: today,
        });
        updateBadge();
        return { ok: true };
      });
    }

    case 'RESET_STATS': {
      return serialStatUpdate(async function() {
        await chrome.storage.local.set({
          adsMutedToday: 0,
          adsMutedTotal: 0,
          timeSavedTotalSeconds: 0,
          lastResetDate: todayStr(),
        });
        updateBadge();
        return { ok: true };
      });
    }

    default:
      return { error: 'Unknown message type' };
  }
}
