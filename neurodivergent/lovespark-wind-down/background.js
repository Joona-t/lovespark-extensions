'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  remindersToday: 0,
  remindersTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  bedtimeHour: 22,
  bedtimeMinute: 0,
  windDownMinutes: 60,
  theme: 'retro'
};

const stats = LoveSparkStats.createAccumulator('remindersToday', 'remindersTotal',
  () => {});

function getMinutesUntilBed(bedH, bedM) {
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const bedMins = bedH * 60 + bedM;
  let diff = bedMins - nowMins;
  if (diff < -120) diff += 1440; // next day
  return diff;
}

function getWarmth(minutesUntilBed, windDownMinutes) {
  if (minutesUntilBed > windDownMinutes) return 0;
  if (minutesUntilBed <= 0) return 100;
  return Math.round(((windDownMinutes - minutesUntilBed) / windDownMinutes) * 100);
}

async function applyWarmFilter(tabId) {
  const data = await chrome.storage.local.get(['isEnabled', 'bedtimeHour', 'bedtimeMinute', 'windDownMinutes']);
  if (data.isEnabled === false) return;
  const minsUntil = getMinutesUntilBed(data.bedtimeHour || 22, data.bedtimeMinute || 0);
  const warmth = getWarmth(minsUntil, data.windDownMinutes || 60);
  if (warmth <= 0) return;
  const sepia = Math.round(warmth * 0.4);
  const brightness = 100 - Math.round(warmth * 0.15);
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (s, b) => {
        document.documentElement.style.filter = 'sepia(' + s + '%) brightness(' + b + '%)';
      },
      args: [sepia, brightness]
    });
  } catch (err) { console.warn('[lovespark-wind-down] func:', err); }
}

async function updateBadge() {
  const data = await chrome.storage.local.get(['isEnabled', 'bedtimeHour', 'bedtimeMinute']);
  if (data.isEnabled === false) {
    chrome.action.setBadgeText({ text: '' });
    return;
  }
  const minsUntil = getMinutesUntilBed(data.bedtimeHour || 22, data.bedtimeMinute || 0);
  if (minsUntil > 0 && minsUntil <= 180) {
    const h = Math.floor(minsUntil / 60);
    const m = minsUntil % 60;
    chrome.action.setBadgeText({ text: h > 0 ? h + 'h' : m + 'm' });
    chrome.action.setBadgeBackgroundColor({ color: minsUntil <= 30 ? '#E8457C' : '#D63466' });
  } else if (minsUntil <= 0) {
    chrome.action.setBadgeText({ text: 'BED' });
    chrome.action.setBadgeBackgroundColor({ color: '#E8457C' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  chrome.alarms.create('wind-check', { periodInMinutes: 5 });
  await updateBadge();
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('remindersToday');
  chrome.alarms.create('wind-check', { periodInMinutes: 5 });
  await updateBadge();
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'wind-check') await updateBadge();
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status === 'complete') await applyWarmFilter(tabId);
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('remindersToday');
      const data = await chrome.storage.local.get(['remindersToday', 'remindersTotal', 'isEnabled', 'bedtimeHour', 'bedtimeMinute', 'windDownMinutes']);
      const minsUntil = getMinutesUntilBed(data.bedtimeHour || 22, data.bedtimeMinute || 0);
      const warmth = getWarmth(minsUntil, data.windDownMinutes || 60);
      return {
        remindersToday: data.remindersToday || 0,
        remindersTotal: data.remindersTotal || 0,
        isEnabled: data.isEnabled !== false,
        bedtimeHour: data.bedtimeHour || 22,
        bedtimeMinute: data.bedtimeMinute || 0,
        windDownMinutes: data.windDownMinutes || 60,
        minutesUntilBed: minsUntil,
        warmth
      };
    }
    case 'SET_BEDTIME': {
      const h = Math.max(0, Math.min(23, parseInt(msg.hour) || 22));
      const m = Math.max(0, Math.min(59, parseInt(msg.minute) || 0));
      await chrome.storage.local.set({ bedtimeHour: h, bedtimeMinute: m });
      await updateBadge();
      return { ok: true };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      if (!msg.enabled) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        if (tab) {
          try {
            await chrome.scripting.executeScript({
              target: { tabId: tab.id },
              func: () => { document.documentElement.style.filter = ''; }
            });
          } catch (err) { console.warn('[lovespark-wind-down] func:', err); }
        }
      }
      await updateBadge();
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
