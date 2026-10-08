'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  pagesStyledToday: 0,
  pagesStyledTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  boldRatio: 0.5
};

const injectedTabs = new Set();

const stats = LoveSparkStats.createAccumulator('pagesStyledToday', 'pagesStyledTotal',
  () => LoveSparkBadge.update('isEnabled', 'pagesStyledToday'));

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'pagesStyledToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('pagesStyledToday');
  await LoveSparkBadge.update('isEnabled', 'pagesStyledToday');
});

chrome.tabs.onRemoved.addListener((tabId) => injectedTabs.delete(tabId));

async function injectIfNeeded(tabId) {
  if (injectedTabs.has(tabId)) return true;
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });
    injectedTabs.add(tabId);
    return true;
  } catch (_) {
    return false;
  }
}

async function sendToActiveTab(message) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab) return { error: 'No active tab' };
  const injected = await injectIfNeeded(tab.id);
  if (!injected) return { error: 'Cannot inject into this page' };
  try {
    return await chrome.tabs.sendMessage(tab.id, message);
  } catch (err) {
    return { error: err.message };
  }
}

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('pagesStyledToday');
      const data = await chrome.storage.local.get([
        'pagesStyledToday', 'pagesStyledTotal', 'isEnabled', 'boldRatio'
      ]);
      return {
        pagesStyledToday: data.pagesStyledToday || 0,
        pagesStyledTotal: data.pagesStyledTotal || 0,
        isEnabled: data.isEnabled !== false,
        boldRatio: data.boldRatio != null ? data.boldRatio : DEFAULTS.boldRatio
      };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'pagesStyledToday');
      if (!msg.enabled) {
        await sendToActiveTab({ type: 'DISABLE_BIONIC' });
      }
      return { ok: true };
    }
    case 'SET_BOLD_RATIO': {
      await chrome.storage.local.set({ boldRatio: msg.boldRatio });
      return { ok: true };
    }
    case 'ACTIVATE_ON_PAGE': {
      const prefs = await chrome.storage.local.get(['isEnabled', 'boldRatio']);
      if (prefs.isEnabled === false) return { ok: false };
      const result = await sendToActiveTab({
        type: 'ENABLE_BIONIC',
        boldRatio: prefs.boldRatio != null ? prefs.boldRatio : DEFAULTS.boldRatio
      });
      if (result && result.wordsProcessed > 0) {
        stats.bump(1);
      }
      return result;
    }
    default:
      return { error: 'Unknown message type' };
  }
});
