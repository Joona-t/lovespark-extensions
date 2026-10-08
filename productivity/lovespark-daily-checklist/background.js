'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

const DEFAULTS = {
  checklistDate: todayStr(),
  checklistItems: [],
  checklistCompletedToday: 0,
  checklistCompletedTotal: 0,
  lastResetDate: todayStr(),
  isEnabled: true,
};

const stats = LoveSparkStats.createAccumulator('checklistCompletedToday', 'checklistCompletedTotal',
  () => updateBadge());

async function updateBadge() {
  const data = await chrome.storage.local.get(['isEnabled', 'checklistItems', 'checklistDate']);
  if (data.isEnabled === false) {
    chrome.action.setBadgeText({ text: 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: '#666666' });
    return;
  }

  const today = todayStr();
  const items = (data.checklistDate === today) ? (data.checklistItems || []) : [];
  const total = items.length;
  const done = items.filter(i => i.done).length;

  if (total === 0) {
    chrome.action.setBadgeText({ text: '' });
  } else if (done === total) {
    chrome.action.setBadgeText({ text: '100%' });
    chrome.action.setBadgeBackgroundColor({ color: '#0d9488' });
  } else {
    const pct = Math.round((done / total) * 100);
    chrome.action.setBadgeText({ text: pct + '%' });
    chrome.action.setBadgeBackgroundColor({ color: '#FF69B4' });
  }

  try {
    chrome.action.setBadgeTextColor({ color: '#FFFFFF' });
  } catch (err) { /* Firefox compat */ }
}

async function ensureTodayReset() {
  const data = await chrome.storage.local.get(['checklistDate', 'checklistItems']);
  const today = todayStr();
  if (data.checklistDate !== today) {
    await chrome.storage.local.set({
      checklistDate: today,
      checklistItems: [],
    });
    await LoveSparkStats.checkDailyReset('checklistCompletedToday');
  }
  return today;
}

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await ensureTodayReset();
  await updateBadge();
});

chrome.runtime.onStartup.addListener(async () => {
  await ensureTodayReset();
  await updateBadge();
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await ensureTodayReset();
      const data = await chrome.storage.local.get([
        'checklistItems', 'checklistDate', 'checklistCompletedToday',
        'checklistCompletedTotal', 'isEnabled'
      ]);
      return data;
    }
    case 'ADD_ITEM': {
      const text = (msg.text || '').trim();
      if (!text) return { error: 'Empty text' };
      await ensureTodayReset();
      const data = await chrome.storage.local.get(['checklistItems']);
      const items = data.checklistItems || [];
      const item = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        text: text,
        done: false,
      };
      items.push(item);
      await chrome.storage.local.set({ checklistItems: items });
      await updateBadge();
      return { ok: true, item };
    }
    case 'TOGGLE_ITEM': {
      const data = await chrome.storage.local.get(['checklistItems']);
      const items = data.checklistItems || [];
      const target = items.find(i => i.id === msg.id);
      if (!target) return { error: 'Item not found' };
      const wasDone = target.done;
      target.done = !target.done;
      await chrome.storage.local.set({ checklistItems: items });
      if (target.done && !wasDone) {
        stats.bump(1);
      }
      await updateBadge();
      return { ok: true };
    }
    case 'DELETE_ITEM': {
      const data = await chrome.storage.local.get(['checklistItems']);
      const items = (data.checklistItems || []).filter(i => i.id !== msg.id);
      await chrome.storage.local.set({ checklistItems: items });
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
