// LoveSpark AdBlock — Background Service Worker
// Uses declarativeNetRequest for blocking + stats tracking

'use strict';

const DEFAULTS = {
  adsBlockedToday: 0,
  adsBlockedTotal: 0,
  lastResetDate: todayStr(),
  whitelistedDomains: [],
  isEnabled: true,
  filterIntensity: 'medium',
};

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ── Init ──────────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    await chrome.storage.local.set(DEFAULTS);
  } else if (reason === 'update') {
    // Fill in any missing keys without overwriting existing data
    const existing = await chrome.storage.local.get(null);
    const toSet = {};
    for (const [k, v] of Object.entries(DEFAULTS)) {
      if (!(k in existing)) toSet[k] = v;
    }
    if (Object.keys(toSet).length) await chrome.storage.local.set(toSet);
  }

  // Show block count in badge automatically
  chrome.declarativeNetRequest.setExtensionActionOptions({
    displayActionCountAsBadgeText: true,
  });

  // Set badge background color
  chrome.action.setBadgeBackgroundColor({ color: '#FF69B4' });

  // Apply saved state
  const data = await chrome.storage.local.get(['isEnabled', 'filterIntensity', 'whitelistedDomains']);
  await applyIntensity(data.filterIntensity || 'medium', data.isEnabled !== false);
  await syncWhitelist(data.whitelistedDomains || []);

  // Schedule daily reset alarm
  scheduleResetAlarm();
});

// ── Alarms ────────────────────────────────────────────────────────────────────

function scheduleResetAlarm() {
  chrome.alarms.create('dailyReset', { periodInMinutes: 60 });
  chrome.alarms.create('pollStats', { periodInMinutes: 1 });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'dailyReset') {
    await checkDailyReset();
  }
  if (alarm.name === 'pollStats') {
    await pollMatchedRules();
  }
});

// Re-register alarms when service worker wakes up
chrome.runtime.onStartup.addListener(() => {
  scheduleResetAlarm();
  chrome.declarativeNetRequest.setExtensionActionOptions({
    displayActionCountAsBadgeText: true,
  });
  chrome.action.setBadgeBackgroundColor({ color: '#FF69B4' });
});

// ── Stats tracking ────────────────────────────────────────────────────────────

// onRuleMatchedDebug fires in developer/unpacked mode (best accuracy)
if (chrome.declarativeNetRequest.onRuleMatchedDebug) {
  chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(async () => {
    await bumpStats(1);
  });
}

// Fallback: poll getMatchedRules (works in packed extensions with declarativeNetRequestFeedback).
// _lastPollTs is persisted in storage so service worker restarts don't create gaps.
async function pollMatchedRules() {
  if (chrome.declarativeNetRequest.onRuleMatchedDebug) return;

  try {
    const { _lastPollTs: stored } = await chrome.storage.local.get('_lastPollTs');
    const ts = stored || Date.now();
    const result = await chrome.declarativeNetRequest.getMatchedRules({
      minTimeStamp: ts,
    });
    const count = result.matchedRules ? result.matchedRules.length : 0;
    if (count > 0) bumpStats(count);
  } catch (_) {
    // Permission not granted or not supported — silent fail
  }
  await chrome.storage.local.set({ _lastPollTs: Date.now() });
}

// Accumulate counts in memory, flush to storage on a debounce.
// Eliminates the read-modify-write race when onRuleMatchedDebug
// fires many times in quick succession.
let _pendingBump = 0;
let _flushTimer = null;

function bumpStats(n) {
  _pendingBump += n;
  if (!_flushTimer) {
    _flushTimer = setTimeout(flushStats, 500);
  }
}

async function flushStats() {
  _flushTimer = null;
  const n = _pendingBump;
  if (n === 0) return;
  _pendingBump = 0;
  const data = await chrome.storage.local.get(['adsBlockedToday', 'adsBlockedTotal']);
  await chrome.storage.local.set({
    adsBlockedToday: (data.adsBlockedToday || 0) + n,
    adsBlockedTotal: (data.adsBlockedTotal || 0) + n,
  });
}

async function checkDailyReset() {
  const data = await chrome.storage.local.get(['lastResetDate', 'adsBlockedToday']);
  const today = todayStr();
  if (data.lastResetDate !== today) {
    await chrome.storage.local.set({
      adsBlockedToday: 0,
      lastResetDate: today,
    });
  }
}

// ── Enable / Disable ──────────────────────────────────────────────────────────

async function setEnabled(enabled) {
  const data = await chrome.storage.local.get('filterIntensity');
  const intensity = data.filterIntensity || 'medium';

  if (enabled) {
    await applyIntensity(intensity, true);
  } else {
    // Disable all rulesets
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      disableRulesetIds: ['ruleset_ads', 'ruleset_tracking', 'ruleset_annoyances'],
    });
  }
  await chrome.storage.local.set({ isEnabled: enabled });
}

// ── Filter intensity ──────────────────────────────────────────────────────────

async function applyIntensity(intensity, enabled = true) {
  if (!enabled) {
    await chrome.declarativeNetRequest.updateEnabledRulesets({
      disableRulesetIds: ['ruleset_ads', 'ruleset_tracking', 'ruleset_annoyances'],
    });
    return;
  }

  const enable = [];
  const disable = [];

  if (intensity === 'light') {
    enable.push('ruleset_ads');
    disable.push('ruleset_tracking', 'ruleset_annoyances');
  } else if (intensity === 'medium') {
    enable.push('ruleset_ads', 'ruleset_tracking');
    disable.push('ruleset_annoyances');
  } else {
    // strong
    enable.push('ruleset_ads', 'ruleset_tracking', 'ruleset_annoyances');
  }

  // Only pass IDs for rulesets that actually exist
  await chrome.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: enable,
    disableRulesetIds: disable,
  });
}

// ── Whitelist (dynamic allow rules) ──────────────────────────────────────────

// Dynamic rule IDs for whitelist: 50000–59999
const WHITELIST_ID_BASE = 50000;

async function syncWhitelist(domains) {
  // Remove all existing whitelist rules
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const oldIds = existing
    .filter((r) => r.id >= WHITELIST_ID_BASE && r.id < WHITELIST_ID_BASE + 1000)
    .map((r) => r.id);

  const newRules = domains.map((domain, i) => ({
    id: WHITELIST_ID_BASE + i,
    priority: 2, // Beats all blocking rules (priority 1)
    action: { type: 'allow' },
    condition: {
      initiatorDomains: [domain],
    },
  }));

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: oldIds,
    addRules: newRules,
  });
}

// ── Message passing (from popup / settings) ───────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  handleMessage(msg).then(sendResponse).catch((err) => sendResponse({ error: err.message }));
  return true; // keep channel open for async response
});

async function handleMessage(msg) {
  switch (msg.type) {
    case 'GET_STATS': {
      const data = await chrome.storage.local.get([
        'adsBlockedToday',
        'adsBlockedTotal',
        'lastResetDate',
        'isEnabled',
        'filterIntensity',
        'whitelistedDomains',
      ]);
      return data;
    }

    case 'SET_ENABLED': {
      await setEnabled(msg.enabled);
      return { ok: true };
    }

    case 'SET_INTENSITY': {
      const { isEnabled } = await chrome.storage.local.get('isEnabled');
      await applyIntensity(msg.intensity, isEnabled !== false);
      await chrome.storage.local.set({ filterIntensity: msg.intensity });
      return { ok: true };
    }

    case 'ADD_WHITELIST': {
      const data = await chrome.storage.local.get('whitelistedDomains');
      const list = data.whitelistedDomains || [];
      if (!list.includes(msg.domain)) {
        list.push(msg.domain);
        await chrome.storage.local.set({ whitelistedDomains: list });
        await syncWhitelist(list);
      }
      return { ok: true };
    }

    case 'REMOVE_WHITELIST': {
      const data = await chrome.storage.local.get('whitelistedDomains');
      const list = (data.whitelistedDomains || []).filter((d) => d !== msg.domain);
      await chrome.storage.local.set({ whitelistedDomains: list });
      await syncWhitelist(list);
      return { ok: true };
    }

    case 'SET_WHITELIST': {
      await chrome.storage.local.set({ whitelistedDomains: msg.domains });
      await syncWhitelist(msg.domains);
      return { ok: true };
    }

    case 'RESET_STATS': {
      await chrome.storage.local.set({
        adsBlockedToday: 0,
        adsBlockedTotal: 0,
        lastResetDate: todayStr(),
      });
      return { ok: true };
    }

    default:
      return { error: 'Unknown message type' };
  }
}
