'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  tocsGeneratedToday: 0,
  tocsGeneratedTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  tocPosition: 'right'
};

const injectedTabs = new Set();

const stats = LoveSparkStats.createAccumulator('tocsGeneratedToday', 'tocsGeneratedTotal',
  () => LoveSparkBadge.update('isEnabled', 'tocsGeneratedToday'));

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'tocsGeneratedToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('tocsGeneratedToday');
  await LoveSparkBadge.update('isEnabled', 'tocsGeneratedToday');
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
      await LoveSparkStats.checkDailyReset('tocsGeneratedToday');
      const data = await chrome.storage.local.get([
        'tocsGeneratedToday', 'tocsGeneratedTotal', 'isEnabled', 'tocPosition'
      ]);
      return {
        tocsGeneratedToday: data.tocsGeneratedToday || 0,
        tocsGeneratedTotal: data.tocsGeneratedTotal || 0,
        isEnabled: data.isEnabled !== false,
        tocPosition: data.tocPosition || DEFAULTS.tocPosition
      };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'tocsGeneratedToday');
      if (!msg.enabled) {
        await sendToActiveTab({ type: 'REMOVE_TOC' });
      }
      return { ok: true };
    }
    case 'SET_POSITION': {
      await chrome.storage.local.set({ tocPosition: msg.position });
      await sendToActiveTab({ type: 'SET_POSITION', position: msg.position });
      return { ok: true };
    }
    case 'GENERATE_TOC': {
      const prefs = await chrome.storage.local.get(['isEnabled', 'tocPosition']);
      if (prefs.isEnabled === false) return { ok: false };
      const result = await sendToActiveTab({
        type: 'GENERATE_TOC',
        position: prefs.tocPosition || DEFAULTS.tocPosition
      });
      if (result && result.headingCount > 0) {
        stats.bump(1);
      }
      return result;
    }
    default:
      return { error: 'Unknown message type' };
  }
});
