'use strict';

/* ── Helpers ───────────────────────────────────────────── */

function todayKey() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return 'time_' + y + '-' + m + '-' + day;
}

function domainFrom(url) {
  try {
    const u = new URL(url);
    if (u.protocol === 'chrome:' || u.protocol === 'chrome-extension:' ||
        u.protocol === 'about:' || u.protocol === 'edge:') return null;
    return u.hostname.replace(/^www\./, '');
  } catch (_) { return null; }
}

/* ── State ─────────────────────────────────────────────── */

let activeDomain = null;
let activeStart = null;     // timestamp ms
let activeTabId = null;

const DEFAULT_SETTINGS = {
  nudgeThreshold: 30,       // minutes
  breakWater: 45,            // minutes
  breakFood: 180,            // minutes
  breakMovement: 60,         // minutes
  allowlist: [],
  showBadge: true
};

/* ── Flush accumulated time to storage ─────────────────── */

async function flushTime() {
  if (!activeDomain || !activeStart) return;

  const elapsed = Math.round((Date.now() - activeStart) / 1000);
  if (elapsed < 1) return;

  const key = todayKey();
  const data = await chrome.storage.local.get([key]);
  const dayData = data[key] || {};
  dayData[activeDomain] = (dayData[activeDomain] || 0) + elapsed;
  await chrome.storage.local.set({ [key]: dayData });

  activeStart = Date.now(); // reset for next interval
  return dayData[activeDomain];
}

/* ── Start / stop tracking ─────────────────────────────── */

async function startTracking(tabId, url) {
  await flushTime(); // flush previous

  const domain = domainFrom(url);
  if (!domain) {
    activeDomain = null;
    activeStart = null;
    activeTabId = null;
    updateBadge(null, 0);
    return;
  }

  // Check allowlist
  const settings = await getSettings();
  if (settings.allowlist.indexOf(domain) !== -1) {
    activeDomain = null;
    activeStart = null;
    activeTabId = null;
    updateBadge(null, 0);
    return;
  }

  activeDomain = domain;
  activeStart = Date.now();
  activeTabId = tabId;

  // Read existing time for badge
  const key = todayKey();
  const data = await chrome.storage.local.get([key]);
  const dayData = data[key] || {};
  const totalSec = dayData[domain] || 0;
  updateBadge(domain, totalSec);
}

function stopTracking() {
  flushTime();
  activeDomain = null;
  activeStart = null;
  activeTabId = null;
}

/* ── Settings ──────────────────────────────────────────── */

async function getSettings() {
  const data = await chrome.storage.local.get(['settings']);
  return Object.assign({}, DEFAULT_SETTINGS, data.settings || {});
}

/* ── Badge ─────────────────────────────────────────────── */

function updateBadge(domain, totalSeconds) {
  if (!domain) {
    chrome.action.setBadgeText({ text: '' });
    return;
  }

  const mins = Math.floor(totalSeconds / 60);
  const text = mins > 0 ? mins + 'm' : '<1m';
  chrome.action.setBadgeText({ text: text });

  let color;
  if (mins < 15) {
    color = '#22c55e'; // green
  } else if (mins < 30) {
    color = '#eab308'; // yellow
  } else {
    color = '#E8457C'; // pink
  }
  chrome.action.setBadgeBackgroundColor({ color: color });
}

/* ── Tab events ────────────────────────────────────────── */

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  try {
    const tab = await chrome.tabs.get(activeInfo.tabId);
    if (tab.url) {
      startTracking(tab.id, tab.url);
    }
  } catch (_) { /* tab may not exist */ }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tabId === activeTabId && changeInfo.url) {
    startTracking(tabId, changeInfo.url);
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === activeTabId) {
    stopTracking();
  }
});

chrome.windows.onFocusChanged.addListener(async (windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    stopTracking();
    return;
  }
  try {
    const tabs = await chrome.tabs.query({ active: true, windowId: windowId });
    if (tabs[0] && tabs[0].url) {
      startTracking(tabs[0].id, tabs[0].url);
    }
  } catch (_) { /* ignore */ }
});

/* ── Periodic flush + content script updates ───────────── */

chrome.alarms.create('flush-time', { periodInMinutes: 1 });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'flush-time') {
    const totalSec = await flushTime();
    if (activeDomain && totalSec !== undefined) {
      updateBadge(activeDomain, totalSec);

      // Notify content script
      if (activeTabId) {
        try {
          await chrome.tabs.sendMessage(activeTabId, {
            type: 'TIME_UPDATE',
            domain: activeDomain,
            seconds: totalSec
          });
        } catch (_) { /* content script may not be ready */ }
      }
    }
    return;
  }

  // Break reminder alarms
  if (alarm.name.startsWith('break-')) {
    const breakType = alarm.name.replace('break-', '');
    await chrome.storage.local.set({ ['breakDue_' + breakType]: true });

    // Notify active tab
    if (activeTabId) {
      try {
        await chrome.tabs.sendMessage(activeTabId, {
          type: 'BREAK_REMINDER',
          breakType: breakType
        });
      } catch (_) { /* ignore */ }
    }
  }
});

/* ── Break alarms setup ───────────────────────────────── */

async function setupBreakAlarms() {
  const settings = await getSettings();

  await chrome.alarms.clear('break-water');
  await chrome.alarms.clear('break-food');
  await chrome.alarms.clear('break-movement');

  if (settings.breakWater > 0) {
    chrome.alarms.create('break-water', { periodInMinutes: settings.breakWater });
  }
  if (settings.breakFood > 0) {
    chrome.alarms.create('break-food', { periodInMinutes: settings.breakFood });
  }
  if (settings.breakMovement > 0) {
    chrome.alarms.create('break-movement', { periodInMinutes: settings.breakMovement });
  }
}

/* ── Message handler ───────────────────────────────────── */

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'GET_CURRENT_TIME') {
    (async () => {
      const key = todayKey();
      const data = await chrome.storage.local.get([key]);
      const dayData = data[key] || {};
      const domain = msg.domain || activeDomain;
      sendResponse({
        domain: domain,
        seconds: domain ? (dayData[domain] || 0) : 0
      });
    })();
    return true; // async
  }

  if (msg.type === 'GET_ALL_TODAY') {
    (async () => {
      const key = todayKey();
      const data = await chrome.storage.local.get([key, 'settings',
        'breakDue_water', 'breakDue_food', 'breakDue_movement',
        'lastBreak_water', 'lastBreak_food', 'lastBreak_movement']);
      const dayData = data[key] || {};

      // Include pending time for active domain
      if (activeDomain && activeStart) {
        const pending = Math.round((Date.now() - activeStart) / 1000);
        dayData[activeDomain] = (dayData[activeDomain] || 0) + pending;
      }

      sendResponse({
        today: dayData,
        settings: Object.assign({}, DEFAULT_SETTINGS, data.settings || {}),
        activeDomain: activeDomain,
        breakDue: {
          water: data.breakDue_water || false,
          food: data.breakDue_food || false,
          movement: data.breakDue_movement || false
        },
        lastBreak: {
          water: data.lastBreak_water || null,
          food: data.lastBreak_food || null,
          movement: data.lastBreak_movement || null
        }
      });
    })();
    return true;
  }

  if (msg.type === 'SAVE_SETTINGS') {
    (async () => {
      await chrome.storage.local.set({ settings: msg.settings });
      await setupBreakAlarms();
      sendResponse({ ok: true });
    })();
    return true;
  }

  if (msg.type === 'MARK_BREAK') {
    (async () => {
      await chrome.storage.local.set({
        ['breakDue_' + msg.breakType]: false,
        ['lastBreak_' + msg.breakType]: Date.now()
      });
      sendResponse({ ok: true });
    })();
    return true;
  }

  if (msg.type === 'DISMISS_BREAK') {
    (async () => {
      await chrome.storage.local.set({
        ['breakDue_' + msg.breakType]: false
      });
      sendResponse({ ok: true });
    })();
    return true;
  }
});

/* ── Init ──────────────────────────────────────────────── */

chrome.runtime.onInstalled.addListener(async () => {
  await setupBreakAlarms();

  // Start tracking active tab
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0] && tabs[0].url) {
      startTracking(tabs[0].id, tabs[0].url);
    }
  } catch (_) { /* ignore */ }
});

// Also start on service worker wake
(async () => {
  await setupBreakAlarms();
  try {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0] && tabs[0].url) {
      startTracking(tabs[0].id, tabs[0].url);
    }
  } catch (_) { /* ignore */ }
})();
