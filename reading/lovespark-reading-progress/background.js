'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  pagesReadToday: 0,
  pagesReadTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  positions: {},
  theme: 'retro'
};

const CONTENT_SCRIPTS = ['content/progress.js'];
const injectedTabs = new Set();

const stats = LoveSparkStats.createAccumulator('pagesReadToday', 'pagesReadTotal',
  () => LoveSparkBadge.update('isEnabled', 'pagesReadToday'));

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'pagesReadToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('pagesReadToday');
  await LoveSparkBadge.update('isEnabled', 'pagesReadToday');
});

chrome.tabs.onRemoved.addListener((tabId) => injectedTabs.delete(tabId));

// Auto-inject on tab update when enabled
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('about:')) return;
  const data = await chrome.storage.local.get('isEnabled');
  if (data.isEnabled === false) return;
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: CONTENT_SCRIPTS
    });
    injectedTabs.add(tabId);
  } catch (_) { /* restricted page */ }
});

async function savePosition(url, percent, title) {
  const data = await chrome.storage.local.get('positions');
  const positions = data.positions || {};
  positions[url] = { percent, title: (title || '').slice(0, 100), timestamp: Date.now() };

  // Prune: keep 200 entries, remove older than 30 days
  const maxAge = 30 * 24 * 60 * 60 * 1000;
  const now = Date.now();
  const pruned = {};
  const entries = Object.entries(positions)
    .filter(([, v]) => (now - v.timestamp) < maxAge)
    .sort((a, b) => b[1].timestamp - a[1].timestamp)
    .slice(0, 200);
  for (const [k, v] of entries) pruned[k] = v;
  await chrome.storage.local.set({ positions: pruned });
}

const completedPages = new Set();

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('pagesReadToday');
      const data = await chrome.storage.local.get([
        'pagesReadToday', 'pagesReadTotal', 'isEnabled', 'positions'
      ]);
      const positions = data.positions || {};
      const recentPages = Object.entries(positions)
        .sort((a, b) => b[1].timestamp - a[1].timestamp)
        .slice(0, 5)
        .map(([url, v]) => ({ url, ...v }));
      return {
        pagesReadToday: data.pagesReadToday || 0,
        pagesReadTotal: data.pagesReadTotal || 0,
        isEnabled: data.isEnabled !== false,
        recentPages,
        totalTracked: Object.keys(positions).length
      };
    }
    case 'SAVE_POSITION': {
      await savePosition(msg.url, msg.percent, msg.title);
      if (msg.percent >= 90 && !completedPages.has(msg.url)) {
        completedPages.add(msg.url);
        await stats.bump(1);
      }
      return { ok: true };
    }
    case 'PAGE_LOADED': {
      return { ok: true };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'pagesReadToday');
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
