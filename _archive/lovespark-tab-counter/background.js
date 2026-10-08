'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  tabThreshold: 20,
  isEnabled: true,
};

const PINK = '#FF69B4';
const WARN_ORANGE = '#FF8C00';
const WARN_RED = '#DC3545';

async function updateBadge() {
  const data = await chrome.storage.local.get(['isEnabled', 'tabThreshold']);
  if (data.isEnabled === false) {
    chrome.action.setBadgeText({ text: 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: '#666666' });
    return;
  }

  const tabs = await chrome.tabs.query({});
  const count = tabs.length;
  const threshold = data.tabThreshold || 20;

  chrome.action.setBadgeText({ text: String(count) });

  if (count >= threshold * 1.5) {
    chrome.action.setBadgeBackgroundColor({ color: WARN_RED });
  } else if (count >= threshold) {
    chrome.action.setBadgeBackgroundColor({ color: WARN_ORANGE });
  } else {
    chrome.action.setBadgeBackgroundColor({ color: PINK });
  }

  try {
    chrome.action.setBadgeTextColor({ color: '#FFFFFF' });
  } catch (err) { /* Firefox compat */ }
}

async function getWindowCounts() {
  const windows = await chrome.windows.getAll({ populate: true });
  const result = [];
  for (const win of windows) {
    result.push({
      windowId: win.id,
      focused: win.focused,
      tabCount: win.tabs ? win.tabs.length : 0,
    });
  }
  return result;
}

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  updateBadge();
});

chrome.runtime.onStartup.addListener(updateBadge);

chrome.tabs.onCreated.addListener(updateBadge);
chrome.tabs.onRemoved.addListener(updateBadge);
chrome.tabs.onAttached.addListener(updateBadge);
chrome.tabs.onDetached.addListener(updateBadge);

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      const data = await chrome.storage.local.get(['isEnabled', 'tabThreshold']);
      const tabs = await chrome.tabs.query({});
      const windowCounts = await getWindowCounts();
      return {
        isEnabled: data.isEnabled !== false,
        tabThreshold: data.tabThreshold || 20,
        totalTabs: tabs.length,
        windowCounts: windowCounts,
      };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await updateBadge();
      return { ok: true };
    }
    case 'SET_THRESHOLD': {
      const val = Math.max(1, Math.min(999, parseInt(msg.threshold, 10) || 20));
      await chrome.storage.local.set({ tabThreshold: val });
      await updateBadge();
      return { ok: true, tabThreshold: val };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
