// LoveSpark Ad Blocker — Background Service Worker
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
  // Local calendar date (YYYY-MM-DD) so "today" rolls over at the user's midnight, not UTC.
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Chrome auto-displays the per-tab block count in the toolbar badge via
// declarativeNetRequest.setExtensionActionOptions. Firefox doesn't implement it and throws
// synchronously — isolate + feature-detect so an unsupported API can NEVER abort the rest of
// blocking/whitelist initialization (regression class: Firefox init abort).
function enableBadgeCount() {
  try {
    if (typeof chrome.declarativeNetRequest.setExtensionActionOptions === 'function') {
      chrome.declarativeNetRequest.setExtensionActionOptions({ displayActionCountAsBadgeText: true });
    }
    chrome.action.setBadgeBackgroundColor({ color: '#FF69B4' });
  } catch (err) {
    console.warn('[LoveSpark Ad Blocker] badge count unavailable (Firefox):', err);
  }
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

  // Show block count in badge automatically (Chromium-only; guarded so Firefox install can't abort).
  enableBadgeCount();

  // Apply saved state
  const data = await chrome.storage.local.get(['isEnabled', 'filterIntensity', 'whitelistedDomains']);
  await applyIntensity(data.filterIntensity || 'medium', data.isEnabled !== false);
  await syncWhitelist(data.whitelistedDomains || []);

  // Schedule daily reset alarm
  scheduleResetAlarm();

  // Reconcile the day boundary before the first poll so "today" never reflects a stale day.
  await checkDailyReset();

  // Immediate poll so stats appear without waiting for the 1-minute alarm
  pollMatchedRules();
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
chrome.runtime.onStartup.addListener(async () => {
  scheduleResetAlarm();
  enableBadgeCount();
  // Reconcile the day boundary on cold start before polling.
  await checkDailyReset();
  pollMatchedRules();
});

// ── Stats tracking ────────────────────────────────────────────────────────────

// onRuleMatchedDebug fires in developer/unpacked mode (best accuracy).
// The API object exists even in packed extensions but never fires — so we
// track whether it has actually fired to decide which stats path to use.
let _debugListenerFired = false;

// onRuleMatchedDebug only fires in unpacked/dev mode. Register it inside try/catch
// rather than a conditional guard (see ls-check MV3-DEBUG-GUARD): the event object can be
// absent in packed/older contexts, and accessing addListener there would throw.
try {
  chrome.declarativeNetRequest.onRuleMatchedDebug.addListener(async () => {
    if (!_debugListenerFired) {
      _debugListenerFired = true;
      // Persist the chosen stats mode so a service-worker restart can't reopen a
      // poll-vs-debug double-count window (dev/unpacked only).
      await chrome.storage.local.set({ _statsMode: 'debug' });
    }
    await writeStats(1);
  });
} catch (_) {
  // Packed extension: no debug events — the getMatchedRules poll is the stats source.
}

// Fallback: poll getMatchedRules (works in packed extensions with declarativeNetRequestFeedback).
// NOTE: this counter is a best-effort LOWER BOUND — Chrome only retains matched-rule records for
// a short rolling window, so blocks that occur while the service worker is asleep past that window
// are lost. The badge (Chrome's own displayActionCountAsBadgeText) is the authoritative per-tab count.
let _pollInFlight = null;

async function pollMatchedRules() {
  if (_debugListenerFired) return;
  // If a debug event ever fired (even in a prior SW lifetime), that's the stats source — never poll.
  const { _statsMode } = await chrome.storage.local.get('_statsMode');
  if (_statsMode === 'debug') return;
  // Coalesce concurrent callers (the 1-min alarm + GET_STATS) so the same window isn't processed twice.
  if (_pollInFlight) return _pollInFlight;

  _pollInFlight = (async () => {
    try {
      const { _lastPollTs: stored } = await chrome.storage.local.get('_lastPollTs');
      const since = stored || 0;
      const result = await chrome.declarativeNetRequest.getMatchedRules({ minTimeStamp: since });
      const infos = result.rulesMatchedInfo || [];
      // Count only matches strictly newer than the cursor, and advance the cursor to the newest
      // timestamp seen. Re-polling an overlapping window is therefore idempotent — no double-count,
      // no read→write gap (the old code advanced to Date.now() AFTER the await, dropping matches).
      let maxTs = since;
      let count = 0;
      for (const info of infos) {
        if (info.timeStamp > since) {
          count++;
          if (info.timeStamp > maxTs) maxTs = info.timeStamp;
        }
      }
      if (count > 0) await writeStats(count);
      if (maxTs > since) await chrome.storage.local.set({ _lastPollTs: maxTs });
    } catch (err) {
      console.warn('[LoveSpark Ad Blocker] pollMatchedRules failed:', err);
    } finally {
      _pollInFlight = null;
    }
  })();
  return _pollInFlight;
}

// Write stats directly to storage. No debounce — service workers can die
// at any moment, so every write must be durable immediately.
async function writeStats(n) {
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

// Dynamic rule IDs for whitelist: 50000–50999 (1000 max)
const WHITELIST_ID_BASE = 50000;

// Conservative hostname check — reject protocol/path/empty so a malformed entry can't
// reject the whole updateDynamicRules() batch.
const DOMAIN_RE = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

// Returns the validated/deduped domain list that was actually applied, so callers can
// keep storage in sync with the rules that exist.
async function syncWhitelist(domains) {
  const valid = [...new Set((domains || [])
    .map((d) => String(d).trim().toLowerCase())
    .filter((d) => DOMAIN_RE.test(d)))].slice(0, 1000);

  // Remove all existing whitelist rules
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const oldIds = existing
    .filter((r) => r.id >= WHITELIST_ID_BASE && r.id < WHITELIST_ID_BASE + 1000)
    .map((r) => r.id);

  const newRules = valid.map((domain, i) => ({
    id: WHITELIST_ID_BASE + i,
    priority: 2, // Beats all blocking rules (priority 1)
    // allowAllRequests exempts the ENTIRE page (including 3rd-party ad iframes whose
    // initiator is the iframe origin, not the page) when the top-level/sub-frame URL is on
    // a whitelisted domain — a true per-site allow, unlike an `allow` keyed on initiatorDomains.
    action: { type: 'allowAllRequests' },
    condition: { requestDomains: [domain], resourceTypes: ['main_frame', 'sub_frame'] },
  }));

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: oldIds,
    addRules: newRules,
  });
  return valid;
}

// ── Message passing (from popup / settings) ───────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  handleMessage(msg).then(sendResponse).catch((err) => sendResponse({ error: err.message }));
  return true; // keep channel open for async response
});

async function handleMessage(msg) {
  switch (msg.type) {
    case 'GET_STATS': {
      // Reconcile the day boundary first so "today" reflects the current calendar day.
      await checkDailyReset();
      // Poll for latest matched rules so popup shows fresh data immediately
      await pollMatchedRules();
      const data = await chrome.storage.local.get([
        'adsBlockedToday',
        'adsBlockedTotal',
        'lastResetDate',
        'isEnabled',
        'filterIntensity',
        'whitelistedDomains',
      ]);
      // Chrome gates live block counts behind getMatchedRules (declarativeNetRequestFeedback);
      // Firefox has no such API, so signal the UI to show an honest placeholder, not a frozen 0.
      data.statsSupported = typeof chrome.declarativeNetRequest.getMatchedRules === 'function';
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
      const domain = String(msg.domain || '').trim().toLowerCase();
      if (!DOMAIN_RE.test(domain)) return { error: 'Invalid domain' };
      const { whitelistedDomains: list = [] } = await chrome.storage.local.get('whitelistedDomains');
      if (!list.includes(domain)) {
        // Sync first; if updateDynamicRules throws it propagates to onMessage's catch as {error},
        // and storage is only written once the rules actually applied.
        const valid = await syncWhitelist([...list, domain]);
        await chrome.storage.local.set({ whitelistedDomains: valid });
      }
      return { ok: true };
    }

    case 'REMOVE_WHITELIST': {
      const { whitelistedDomains: list = [] } = await chrome.storage.local.get('whitelistedDomains');
      const valid = await syncWhitelist(list.filter((d) => d !== msg.domain));
      await chrome.storage.local.set({ whitelistedDomains: valid });
      return { ok: true };
    }

    case 'SET_WHITELIST': {
      const valid = await syncWhitelist(msg.domains);
      await chrome.storage.local.set({ whitelistedDomains: valid });
      return { ok: true };
    }

    case 'RESET_STATS': {
      await chrome.storage.local.set({
        adsBlockedToday: 0,
        adsBlockedTotal: 0,
        lastResetDate: todayStr(),
        _lastPollTs: Date.now(), // don't re-count matches still in the retention window
      });
      return { ok: true };
    }

    default:
      return { error: 'Unknown message type' };
  }
}
