'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  pagesRuledToday: 0,
  pagesRuledTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  rulerHeight: 40,
  rulerOpacity: 0.15,
  rulerColor: '#e8457c'
};

const injectedTabs = new Set();

const stats = LoveSparkStats.createAccumulator('pagesRuledToday', 'pagesRuledTotal',
  () => LoveSparkBadge.update('isEnabled', 'pagesRuledToday'));

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'pagesRuledToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('pagesRuledToday');
  await LoveSparkBadge.update('isEnabled', 'pagesRuledToday');
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
      await LoveSparkStats.checkDailyReset('pagesRuledToday');
      const data = await chrome.storage.local.get([
        'pagesRuledToday', 'pagesRuledTotal', 'isEnabled',
        'rulerHeight', 'rulerOpacity', 'rulerColor'
      ]);
      return {
        pagesRuledToday: data.pagesRuledToday || 0,
        pagesRuledTotal: data.pagesRuledTotal || 0,
        isEnabled: data.isEnabled !== false,
        rulerHeight: data.rulerHeight != null ? data.rulerHeight : DEFAULTS.rulerHeight,
        rulerOpacity: data.rulerOpacity != null ? data.rulerOpacity : DEFAULTS.rulerOpacity,
        rulerColor: data.rulerColor || DEFAULTS.rulerColor
      };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'pagesRuledToday');
      if (msg.enabled) {
        const prefs = await chrome.storage.local.get(['rulerHeight', 'rulerOpacity', 'rulerColor']);
        await sendToActiveTab({
          type: 'ENABLE_RULER',
          rulerHeight: prefs.rulerHeight != null ? prefs.rulerHeight : DEFAULTS.rulerHeight,
          rulerOpacity: prefs.rulerOpacity != null ? prefs.rulerOpacity : DEFAULTS.rulerOpacity,
          rulerColor: prefs.rulerColor || DEFAULTS.rulerColor
        });
        stats.bump(1);
      } else {
        await sendToActiveTab({ type: 'DISABLE_RULER' });
      }
      return { ok: true };
    }
    case 'SET_RULER_PREFS': {
      const updates = {};
      if (msg.rulerHeight != null) updates.rulerHeight = msg.rulerHeight;
      if (msg.rulerOpacity != null) updates.rulerOpacity = msg.rulerOpacity;
      if (msg.rulerColor != null) updates.rulerColor = msg.rulerColor;
      await chrome.storage.local.set(updates);
      await sendToActiveTab({ type: 'UPDATE_RULER', ...updates });
      return { ok: true };
    }
    case 'ACTIVATE_ON_PAGE': {
      const prefs = await chrome.storage.local.get(['isEnabled', 'rulerHeight', 'rulerOpacity', 'rulerColor']);
      if (prefs.isEnabled === false) return { ok: false };
      await sendToActiveTab({
        type: 'ENABLE_RULER',
        rulerHeight: prefs.rulerHeight != null ? prefs.rulerHeight : DEFAULTS.rulerHeight,
        rulerOpacity: prefs.rulerOpacity != null ? prefs.rulerOpacity : DEFAULTS.rulerOpacity,
        rulerColor: prefs.rulerColor || DEFAULTS.rulerColor
      });
      stats.bump(1);
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
