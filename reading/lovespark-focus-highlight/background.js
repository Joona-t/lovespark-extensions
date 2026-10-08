'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  pagesHighlightedToday: 0,
  pagesHighlightedTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  dimOpacity: 0.25
};

const injectedTabs = new Set();

const stats = LoveSparkStats.createAccumulator('pagesHighlightedToday', 'pagesHighlightedTotal',
  () => LoveSparkBadge.update('isEnabled', 'pagesHighlightedToday'));

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'pagesHighlightedToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('pagesHighlightedToday');
  await LoveSparkBadge.update('isEnabled', 'pagesHighlightedToday');
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
      await LoveSparkStats.checkDailyReset('pagesHighlightedToday');
      const data = await chrome.storage.local.get([
        'pagesHighlightedToday', 'pagesHighlightedTotal', 'isEnabled', 'dimOpacity'
      ]);
      return {
        pagesHighlightedToday: data.pagesHighlightedToday || 0,
        pagesHighlightedTotal: data.pagesHighlightedTotal || 0,
        isEnabled: data.isEnabled !== false,
        dimOpacity: data.dimOpacity != null ? data.dimOpacity : DEFAULTS.dimOpacity
      };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'pagesHighlightedToday');
      if (msg.enabled) {
        const prefs = await chrome.storage.local.get(['dimOpacity']);
        await sendToActiveTab({
          type: 'ENABLE_HIGHLIGHT',
          dimOpacity: prefs.dimOpacity != null ? prefs.dimOpacity : DEFAULTS.dimOpacity
        });
        stats.bump(1);
      } else {
        await sendToActiveTab({ type: 'DISABLE_HIGHLIGHT' });
      }
      return { ok: true };
    }
    case 'SET_DIM_OPACITY': {
      await chrome.storage.local.set({ dimOpacity: msg.dimOpacity });
      await sendToActiveTab({ type: 'SET_DIM_OPACITY', dimOpacity: msg.dimOpacity });
      return { ok: true };
    }
    case 'ACTIVATE_ON_PAGE': {
      const prefs = await chrome.storage.local.get(['dimOpacity', 'isEnabled']);
      if (prefs.isEnabled === false) return { ok: false };
      await sendToActiveTab({
        type: 'ENABLE_HIGHLIGHT',
        dimOpacity: prefs.dimOpacity != null ? prefs.dimOpacity : DEFAULTS.dimOpacity
      });
      stats.bump(1);
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
