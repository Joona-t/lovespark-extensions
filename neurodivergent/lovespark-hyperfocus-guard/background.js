'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  alertsToday: 0,
  alertsTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  thresholdMin: 30,
  currentSite: null,
  siteStartedAt: null,
  alerted: false,
  theme: 'retro'
};

const stats = LoveSparkStats.createAccumulator('alertsToday', 'alertsTotal',
  () => {});

async function getHostname(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);
    if (!tab || !tab.url) return null;
    return new URL(tab.url).hostname.replace(/^www\./, '');
  } catch (_) { return null; }
}

async function updateSiteTracking() {
  const data = await chrome.storage.local.get(['isEnabled', 'currentSite', 'siteStartedAt', 'thresholdMin', 'alerted']);
  if (data.isEnabled === false) {
    chrome.action.setBadgeText({ text: '' });
    return;
  }

  if (!data.currentSite || !data.siteStartedAt) {
    chrome.action.setBadgeText({ text: '' });
    return;
  }

  const elapsed = Math.floor((Date.now() - data.siteStartedAt) / 60000);
  const threshold = data.thresholdMin || 30;

  if (elapsed >= threshold && !data.alerted) {
    // Threshold reached — alert via badge
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#E8457C' });
    await chrome.storage.local.set({ alerted: true });
    await stats.bump(1);
  } else if (elapsed > 0) {
    chrome.action.setBadgeText({ text: elapsed + 'm' });
    chrome.action.setBadgeBackgroundColor({ color: elapsed >= threshold ? '#E8457C' : '#D63466' });
  }
}

async function onTabChange(tabId) {
  const data = await chrome.storage.local.get(['isEnabled', 'currentSite']);
  if (data.isEnabled === false) return;

  const hostname = await getHostname(tabId);
  if (!hostname) return;

  if (hostname !== data.currentSite) {
    await chrome.storage.local.set({
      currentSite: hostname,
      siteStartedAt: Date.now(),
      alerted: false
    });
  }
  await updateSiteTracking();
}

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  chrome.alarms.create('site-check', { periodInMinutes: 1 });
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('alertsToday');
  chrome.alarms.create('site-check', { periodInMinutes: 1 });
});

chrome.tabs.onActivated.addListener((info) => onTabChange(info.tabId));
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (changeInfo.status === 'complete') onTabChange(tabId);
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'site-check') {
    await updateSiteTracking();
  }
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('alertsToday');
      const data = await chrome.storage.local.get([
        'alertsToday', 'alertsTotal', 'isEnabled', 'thresholdMin',
        'currentSite', 'siteStartedAt', 'alerted'
      ]);
      const elapsed = data.siteStartedAt ? Math.floor((Date.now() - data.siteStartedAt) / 60000) : 0;
      return {
        alertsToday: data.alertsToday || 0,
        alertsTotal: data.alertsTotal || 0,
        isEnabled: data.isEnabled !== false,
        thresholdMin: data.thresholdMin || 30,
        currentSite: data.currentSite || null,
        elapsed,
        alerted: data.alerted || false
      };
    }
    case 'SET_THRESHOLD': {
      const min = Math.max(5, Math.min(180, parseInt(msg.minutes) || 30));
      await chrome.storage.local.set({ thresholdMin: min, alerted: false });
      await updateSiteTracking();
      return { ok: true };
    }
    case 'DISMISS_ALERT': {
      await chrome.storage.local.set({ alerted: false, siteStartedAt: Date.now() });
      await updateSiteTracking();
      return { ok: true };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      if (!msg.enabled) chrome.action.setBadgeText({ text: '' });
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
