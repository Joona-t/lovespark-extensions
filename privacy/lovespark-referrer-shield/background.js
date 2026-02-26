'use strict';

// ── Constants ─────────────────────────────────────────────────────────────────

const RULE_IDS = { STRIP_REFERER: 1, SET_ORIGIN_POLICY: 2 };

const ALL_RESOURCE_TYPES = [
  'main_frame', 'sub_frame', 'stylesheet', 'script',
  'image', 'font', 'xmlhttprequest', 'ping',
  'media', 'websocket', 'other'
];

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ── Install & Startup ─────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    await chrome.storage.local.set({
      mode: 'origin',
      whitelistedDomains: [],
      currentStreakDays: 0,
      lastStreakCheck: todayStr(),
      activeSinceDateStr: todayStr()
    });
  } else {
    // Fill missing keys on update
    const existing = await chrome.storage.local.get(null);
    const defaults = {
      mode: 'origin',
      whitelistedDomains: [],
      currentStreakDays: 0,
      lastStreakCheck: todayStr(),
      activeSinceDateStr: todayStr()
    };
    const fill = {};
    for (const [k, v] of Object.entries(defaults)) {
      if (!(k in existing)) fill[k] = v;
    }
    if (Object.keys(fill).length) await chrome.storage.local.set(fill);
  }

  const { mode, whitelistedDomains } = await chrome.storage.local.get(['mode', 'whitelistedDomains']);
  await applyMode(mode || 'origin', whitelistedDomains || []);
  await updateBadge(mode || 'origin');
  scheduleAlarms();
});

chrome.runtime.onStartup.addListener(async () => {
  const { mode, whitelistedDomains } = await chrome.storage.local.get(['mode', 'whitelistedDomains']);
  await applyMode(mode || 'origin', whitelistedDomains || []);
  await updateBadge(mode || 'origin');
  scheduleAlarms();
});

// ── Alarms ────────────────────────────────────────────────────────────────────

function scheduleAlarms() {
  chrome.alarms.create('streakCheck', { periodInMinutes: 60 });
}

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'streakCheck') await updateStreak();
});

async function updateStreak() {
  const data = await chrome.storage.local.get(['mode', 'currentStreakDays', 'lastStreakCheck']);
  const today = todayStr();

  if (data.lastStreakCheck === today) return;
  if (data.mode === 'off') return;

  await chrome.storage.local.set({
    currentStreakDays: (data.currentStreakDays || 0) + 1,
    lastStreakCheck: today
  });
}

// ── Apply DNR Rules ───────────────────────────────────────────────────────────

async function applyMode(mode, whitelistedDomains) {
  const rules = [];

  if (mode === 'strip') {
    const condition = {
      resourceTypes: ALL_RESOURCE_TYPES,
      domainType: 'thirdParty'
    };
    if (whitelistedDomains.length) condition.excludedInitiatorDomains = whitelistedDomains;

    rules.push({
      id: RULE_IDS.STRIP_REFERER,
      priority: 1,
      action: {
        type: 'modifyHeaders',
        requestHeaders: [{ header: 'Referer', operation: 'remove' }]
      },
      condition
    });
  }

  if (mode === 'origin') {
    const condition = { resourceTypes: ['main_frame', 'sub_frame'] };
    if (whitelistedDomains.length) condition.excludedInitiatorDomains = whitelistedDomains;

    rules.push({
      id: RULE_IDS.SET_ORIGIN_POLICY,
      priority: 1,
      action: {
        type: 'modifyHeaders',
        responseHeaders: [{ header: 'Referrer-Policy', operation: 'set', value: 'origin' }]
      },
      condition
    });
  }

  // mode === 'off' → empty rules → all cleared
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map(r => r.id),
    addRules: rules
  });
}

// ── Badge ─────────────────────────────────────────────────────────────────────

async function updateBadge(mode) {
  if (mode === 'off') {
    chrome.action.setBadgeText({ text: '' });
    return;
  }

  const label = mode === 'strip' ? 'ALL' : 'ON';
  chrome.action.setBadgeText({ text: label });
  chrome.action.setBadgeBackgroundColor({
    color: mode === 'strip' ? '#D63466' : '#E8457C'
  });
}

// ── Message Handler ───────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  handle(msg).then(sendResponse).catch(e => sendResponse({ error: e.message }));
  return true;
});

async function handle(msg) {
  switch (msg.type) {

    case 'GET_STATE': {
      return chrome.storage.local.get([
        'mode', 'whitelistedDomains', 'currentStreakDays', 'activeSinceDateStr'
      ]);
    }

    case 'SET_MODE': {
      const { whitelistedDomains } = await chrome.storage.local.get('whitelistedDomains');
      await chrome.storage.local.set({ mode: msg.mode });
      await applyMode(msg.mode, whitelistedDomains || []);
      await updateBadge(msg.mode);

      if (msg.mode === 'off') {
        await chrome.storage.local.set({ currentStreakDays: 0, activeSinceDateStr: null });
      } else {
        const { activeSinceDateStr } = await chrome.storage.local.get('activeSinceDateStr');
        if (!activeSinceDateStr) {
          await chrome.storage.local.set({ activeSinceDateStr: todayStr() });
        }
      }
      return { ok: true };
    }

    case 'ADD_WHITELIST': {
      const { whitelistedDomains, mode } = await chrome.storage.local.get(['whitelistedDomains', 'mode']);
      const list = whitelistedDomains || [];
      if (!list.includes(msg.domain)) list.push(msg.domain);
      await chrome.storage.local.set({ whitelistedDomains: list });
      await applyMode(mode || 'origin', list);
      return { ok: true, domains: list };
    }

    case 'REMOVE_WHITELIST': {
      const { whitelistedDomains, mode } = await chrome.storage.local.get(['whitelistedDomains', 'mode']);
      const list = (whitelistedDomains || []).filter(d => d !== msg.domain);
      await chrome.storage.local.set({ whitelistedDomains: list });
      await applyMode(mode || 'origin', list);
      return { ok: true, domains: list };
    }

    default:
      return { error: 'Unknown message' };
  }
}
