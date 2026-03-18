'use strict';

/* ── Constants ──────────────────────────────────────── */
const ALARM_NAME = 'tab-garden-check';
const ALARM_INTERVAL = 5; // minutes
const DEFAULT_SETTINGS = {
  idleThreshold: 1800000, // 30 min in ms
  maxGarden: 100,
  autoArchive: true,
  excludedDomains: ['localhost', 'mail.google.com']
};
const DEFAULT_STATS = {
  totalArchived: 0,
  totalRestored: 0,
  memoryEstimate: 0
};

/* ── Helpers ────────────────────────────────────────── */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function getDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

function isExcluded(url, excludedDomains) {
  const domain = getDomain(url);
  return excludedDomains.some(d => domain === d || domain.endsWith('.' + d));
}

/* ── Badge Update ───────────────────────────────────── */
async function updateBadge() {
  try {
    const tabs = await chrome.tabs.query({});
    const count = tabs.length;
    const text = String(count);

    let color;
    if (count < 10) {
      color = '#22c55e'; // green
    } else if (count <= 20) {
      color = '#eab308'; // yellow
    } else {
      color = '#E8457C'; // pink
    }

    await chrome.action.setBadgeText({ text });
    await chrome.action.setBadgeBackgroundColor({ color });
  } catch {
    // tabs API may fail during startup, ignore
  }
}

/* ── Tab Activity Tracking ──────────────────────────── */
async function recordActivity(tabId) {
  if (tabId < 0) return; // ignore special tab IDs
  const data = await chrome.storage.local.get('tab_activity');
  const activity = data.tab_activity || {};
  activity[String(tabId)] = { lastActiveAt: Date.now() };
  await chrome.storage.local.set({ tab_activity: activity });
}

// Track when user switches tabs
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  await recordActivity(activeInfo.tabId);
  await updateBadge();
});

// Track when a tab updates (navigation, loading)
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo) => {
  if (changeInfo.status === 'complete' || changeInfo.url) {
    await recordActivity(tabId);
  }
  await updateBadge();
});

// Clean up activity data when tab closes
chrome.tabs.onRemoved.addListener(async (tabId) => {
  const data = await chrome.storage.local.get('tab_activity');
  const activity = data.tab_activity || {};
  delete activity[String(tabId)];
  await chrome.storage.local.set({ tab_activity: activity });
  await updateBadge();
});

// Track new tabs
chrome.tabs.onCreated.addListener(async (tab) => {
  if (tab.id !== undefined) {
    await recordActivity(tab.id);
  }
  await updateBadge();
});

/* ── Archive Logic ──────────────────────────────────── */
async function archiveIdleTabs() {
  const data = await chrome.storage.local.get(['tab_activity', 'settings', 'garden', 'stats']);
  const settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}) };
  const garden = data.garden || [];
  const stats = { ...DEFAULT_STATS, ...(data.stats || {}) };
  const activity = data.tab_activity || {};

  if (!settings.autoArchive) return;

  const now = Date.now();
  const threshold = settings.idleThreshold;

  // Get all tabs
  const allTabs = await chrome.tabs.query({});

  // Find the active tab in the current window
  const activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const activeTabId = activeTabs.length > 0 ? activeTabs[0].id : -1;

  const tabsToArchive = [];

  for (const tab of allTabs) {
    // Skip: active tab, pinned, audible, chrome:// pages, excluded domains
    if (tab.id === activeTabId) continue;
    if (tab.pinned) continue;
    if (tab.audible) continue;
    if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) continue;
    if (tab.url.startsWith('about:') || tab.url.startsWith('edge://')) continue;
    if (isExcluded(tab.url, settings.excludedDomains)) continue;

    const lastActive = activity[String(tab.id)]?.lastActiveAt || 0;
    const idleTime = now - lastActive;

    if (lastActive > 0 && idleTime >= threshold) {
      tabsToArchive.push(tab);
    }
  }

  // Respect max garden size
  const maxNew = settings.maxGarden === -1
    ? tabsToArchive.length
    : Math.max(0, settings.maxGarden - garden.length);
  const toArchive = tabsToArchive.slice(0, maxNew);

  if (toArchive.length === 0) return;

  const newEntries = [];
  const tabIdsToClose = [];

  for (const tab of toArchive) {
    newEntries.push({
      id: generateId(),
      url: tab.url,
      title: tab.title || 'Untitled',
      domain: getDomain(tab.url),
      favicon: tab.favIconUrl || '',
      archivedAt: now
    });
    tabIdsToClose.push(tab.id);

    // Clean up activity
    delete activity[String(tab.id)];
  }

  // Estimate memory saved (~50MB per tab is rough average)
  const memorySaved = toArchive.length * 50;

  garden.push(...newEntries);
  stats.totalArchived += toArchive.length;
  stats.memoryEstimate += memorySaved;

  await chrome.storage.local.set({
    garden,
    tab_activity: activity,
    stats
  });

  // Close archived tabs
  try {
    await chrome.tabs.remove(tabIdsToClose);
  } catch {
    // Some tabs may already be closed
  }

  await updateBadge();
}

/* ── Alarm Setup ────────────────────────────────────── */
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) {
    archiveIdleTabs();
  }
});

/* ── Install / Startup ──────────────────────────────── */
chrome.runtime.onInstalled.addListener(async () => {
  // Set defaults if not present
  const data = await chrome.storage.local.get(['settings', 'garden', 'stats']);
  if (!data.settings) {
    await chrome.storage.local.set({ settings: DEFAULT_SETTINGS });
  }
  if (!data.garden) {
    await chrome.storage.local.set({ garden: [] });
  }
  if (!data.stats) {
    await chrome.storage.local.set({ stats: DEFAULT_STATS });
  }

  // Create alarm
  await chrome.alarms.create(ALARM_NAME, { periodInMinutes: ALARM_INTERVAL });

  // Initialize activity for all existing tabs
  const tabs = await chrome.tabs.query({});
  const activity = {};
  const now = Date.now();
  for (const tab of tabs) {
    if (tab.id !== undefined && tab.id >= 0) {
      activity[String(tab.id)] = { lastActiveAt: now };
    }
  }
  await chrome.storage.local.set({ tab_activity: activity });

  await updateBadge();
});

chrome.runtime.onStartup.addListener(async () => {
  await chrome.alarms.create(ALARM_NAME, { periodInMinutes: ALARM_INTERVAL });
  await updateBadge();
});

/* ── Message Handling (from popup) ──────────────────── */
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === 'restoreTab') {
    handleRestore(msg.id).then(sendResponse);
    return true; // async response
  }
  if (msg.action === 'removeFromGarden') {
    handleRemove(msg.id).then(sendResponse);
    return true;
  }
  if (msg.action === 'clearGarden') {
    handleClearGarden().then(sendResponse);
    return true;
  }
  if (msg.action === 'updateSettings') {
    handleUpdateSettings(msg.settings).then(sendResponse);
    return true;
  }
  if (msg.action === 'getState') {
    handleGetState().then(sendResponse);
    return true;
  }
  if (msg.action === 'forceArchiveCheck') {
    archiveIdleTabs().then(() => sendResponse({ ok: true }));
    return true;
  }
});

async function handleRestore(entryId) {
  const data = await chrome.storage.local.get(['garden', 'stats']);
  const garden = data.garden || [];
  const stats = { ...DEFAULT_STATS, ...(data.stats || {}) };

  const index = garden.findIndex(e => e.id === entryId);
  if (index === -1) return { ok: false, error: 'not found' };

  const entry = garden[index];
  garden.splice(index, 1);
  stats.totalRestored += 1;

  await chrome.storage.local.set({ garden, stats });

  try {
    await chrome.tabs.create({ url: entry.url });
  } catch {
    return { ok: false, error: 'failed to create tab' };
  }

  await updateBadge();
  return { ok: true };
}

async function handleRemove(entryId) {
  const data = await chrome.storage.local.get('garden');
  const garden = data.garden || [];
  const index = garden.findIndex(e => e.id === entryId);
  if (index === -1) return { ok: false, error: 'not found' };

  garden.splice(index, 1);
  await chrome.storage.local.set({ garden });
  return { ok: true };
}

async function handleClearGarden() {
  await chrome.storage.local.set({ garden: [] });
  return { ok: true };
}

async function handleUpdateSettings(newSettings) {
  const data = await chrome.storage.local.get('settings');
  const settings = { ...DEFAULT_SETTINGS, ...(data.settings || {}), ...newSettings };
  await chrome.storage.local.set({ settings });
  return { ok: true, settings };
}

async function handleGetState() {
  const data = await chrome.storage.local.get(['garden', 'settings', 'stats', 'tab_activity']);
  const tabs = await chrome.tabs.query({});
  return {
    garden: data.garden || [],
    settings: { ...DEFAULT_SETTINGS, ...(data.settings || {}) },
    stats: { ...DEFAULT_STATS, ...(data.stats || {}) },
    activeTabs: tabs.map(t => ({
      id: t.id,
      title: t.title || 'Untitled',
      url: t.url || '',
      domain: getDomain(t.url || ''),
      favicon: t.favIconUrl || '',
      pinned: t.pinned,
      audible: t.audible
    })),
    tabCount: tabs.length
  };
}
