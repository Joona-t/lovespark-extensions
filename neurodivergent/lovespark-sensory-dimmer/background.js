'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  dimsToday: 0,
  dimsTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  brightness: 70,
  contrast: 85,
  saturation: 60,
  theme: 'retro'
};

const stats = LoveSparkStats.createAccumulator('dimsToday', 'dimsTotal',
  () => LoveSparkBadge.update('isEnabled', 'dimsToday'));

async function applyDim(tabId) {
  const data = await chrome.storage.local.get(['isEnabled', 'brightness', 'contrast', 'saturation']);
  if (data.isEnabled === false) return;
  const b = data.brightness || 70;
  const c = data.contrast || 85;
  const s = data.saturation || 60;
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (brightness, contrast, saturation) => {
        document.documentElement.style.filter = 'brightness(' + brightness + '%) contrast(' + contrast + '%) saturate(' + saturation + '%)';
      },
      args: [b, c, s]
    });
  } catch (err) { console.warn('[lovespark-sensory-dimmer] unknown:', err); }
}

async function removeDim(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => { document.documentElement.style.filter = ''; }
    });
  } catch (err) { console.warn('[lovespark-sensory-dimmer] func:', err); }
}

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'dimsToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('dimsToday');
  await LoveSparkBadge.update('isEnabled', 'dimsToday');
});

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status !== 'complete') return;
  const data = await chrome.storage.local.get('isEnabled');
  if (data.isEnabled !== false) await applyDim(tabId);
});

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-dim') {
    const data = await chrome.storage.local.get('isEnabled');
    const newState = data.isEnabled === false;
    await chrome.storage.local.set({ isEnabled: newState });
    await LoveSparkBadge.update('isEnabled', 'dimsToday');
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      if (newState) { await applyDim(tab.id); await stats.bump(1); }
      else await removeDim(tab.id);
    }
  }
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('dimsToday');
      const data = await chrome.storage.local.get(['dimsToday', 'dimsTotal', 'isEnabled', 'brightness', 'contrast', 'saturation']);
      return { dimsToday: data.dimsToday || 0, dimsTotal: data.dimsTotal || 0, isEnabled: data.isEnabled !== false, brightness: data.brightness || 70, contrast: data.contrast || 85, saturation: data.saturation || 60 };
    }
    case 'SET_LEVELS': {
      const toSave = {};
      if (msg.brightness !== undefined) toSave.brightness = Math.max(20, Math.min(100, msg.brightness));
      if (msg.contrast !== undefined) toSave.contrast = Math.max(20, Math.min(100, msg.contrast));
      if (msg.saturation !== undefined) toSave.saturation = Math.max(0, Math.min(100, msg.saturation));
      await chrome.storage.local.set(toSave);
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) await applyDim(tab.id);
      return { ok: true };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'dimsToday');
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tab) {
        if (msg.enabled) { await applyDim(tab.id); await stats.bump(1); }
        else await removeDim(tab.id);
      }
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
