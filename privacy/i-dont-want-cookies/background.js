'use strict';

const DEFAULTS = {
  bannersHiddenToday: 0,
  bannersHiddenTotal: 0,
  lastResetDate: todayStr(),
  whitelistedDomains: [],
  isEnabled: true,
  autoDecline: false,
  darkMode: false,
  domainStats: {}, // { "example.com": 42 }
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ── Init ──────────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    await chrome.storage.local.set(DEFAULTS);
  } else {
    const existing = await chrome.storage.local.get(null);
    const fill = {};
    for (const [k, v] of Object.entries(DEFAULTS)) {
      if (!(k in existing)) fill[k] = v;
    }
    if (Object.keys(fill).length) await chrome.storage.local.set(fill);
  }

  chrome.action.setBadgeBackgroundColor({ color: '#FF69B4' });
  scheduleAlarms();
});

chrome.runtime.onStartup.addListener(() => {
  scheduleAlarms();
  chrome.action.setBadgeBackgroundColor({ color: '#FF69B4' });
});

// ── Alarms ────────────────────────────────────────────────────────────────────

function scheduleAlarms() {
  chrome.alarms.create('dailyReset', { periodInMinutes: 60 });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'dailyReset') await checkDailyReset();
});

async function checkDailyReset() {
  const { lastResetDate } = await chrome.storage.local.get('lastResetDate');
  if (lastResetDate !== todayStr()) {
    await chrome.storage.local.set({ bannersHiddenToday: 0, lastResetDate: todayStr() });
    chrome.action.setBadgeText({ text: '0' });
  }
}

// ── Badge ─────────────────────────────────────────────────────────────────────

// Event-driven: the HIDDEN handler sets the badge right after persisting the
// new count. (Previously a 500ms setTimeout debounce, which can be dropped when
// the MV3 service worker suspends, and which re-added the queued count on top of
// the already-incremented stored total.)
function setBadgeCount(n) {
  chrome.action.setBadgeText({ text: n >= 1000 ? `${Math.floor(n / 1000)}k` : String(n) });
}

// ── Message handling ──────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  handle(msg, _sender).then(sendResponse).catch((e) => sendResponse({ error: e.message }));
  return true;
});

async function handle(msg, sender) {
  switch (msg.type) {

    case 'CHECK_SITE': {
      const data = await chrome.storage.local.get(['isEnabled', 'whitelistedDomains', 'autoDecline']);
      const whitelisted = (data.whitelistedDomains || []).includes(msg.domain);
      return {
        isEnabled: data.isEnabled !== false,
        whitelisted,
        autoDecline: !!data.autoDecline,
      };
    }

    case 'HIDDEN': {
      const data = await chrome.storage.local.get(['bannersHiddenToday', 'bannersHiddenTotal', 'domainStats']);
      const stats = data.domainStats || {};
      stats[msg.domain] = (stats[msg.domain] || 0) + msg.count;
      const newToday = (data.bannersHiddenToday || 0) + msg.count;
      const newTotal = (data.bannersHiddenTotal || 0) + msg.count;
      await chrome.storage.local.set({
        bannersHiddenToday: newToday,
        bannersHiddenTotal: newTotal,
        domainStats: stats,
      });
      setBadgeCount(newToday);
      return { ok: true };
    }

    case 'GET_STATS': {
      return chrome.storage.local.get([
        'bannersHiddenToday', 'bannersHiddenTotal', 'lastResetDate',
        'whitelistedDomains', 'isEnabled', 'autoDecline', 'darkMode', 'domainStats',
      ]);
    }

    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      return { ok: true };
    }

    case 'SET_AUTO_DECLINE': {
      await chrome.storage.local.set({ autoDecline: msg.autoDecline });
      return { ok: true };
    }

    case 'ADD_WHITELIST': {
      const { whitelistedDomains } = await chrome.storage.local.get('whitelistedDomains');
      const list = whitelistedDomains || [];
      if (!list.includes(msg.domain)) list.push(msg.domain);
      await chrome.storage.local.set({ whitelistedDomains: list });
      return { ok: true };
    }

    case 'REMOVE_WHITELIST': {
      const { whitelistedDomains } = await chrome.storage.local.get('whitelistedDomains');
      const list = (whitelistedDomains || []).filter((d) => d !== msg.domain);
      await chrome.storage.local.set({ whitelistedDomains: list });
      return { ok: true };
    }

    case 'SET_WHITELIST': {
      await chrome.storage.local.set({ whitelistedDomains: msg.domains });
      return { ok: true };
    }

    case 'RESET_STATS': {
      await chrome.storage.local.set({
        bannersHiddenToday: 0,
        bannersHiddenTotal: 0,
        domainStats: {},
        lastResetDate: todayStr(),
      });
      chrome.action.setBadgeText({ text: '0' });
      return { ok: true };
    }

    case 'SET_DARK_MODE': {
      await chrome.storage.local.set({ darkMode: msg.darkMode });
      return { ok: true };
    }

    default:
      return { error: 'Unknown message' };
  }
}

// Settings propagation handled via chrome.storage.onChanged in content scripts
