// Focus Blossom — Service Worker
// Authority on blocking, growth tracking, and streak management

const GROWTH_STAGES = [
  { stage: 0, name: "seed",   minMs: 0 },
  { stage: 1, name: "sprout", minMs: 1 * 60 * 60 * 1000 },
  { stage: 2, name: "bud",    minMs: 6 * 60 * 60 * 1000 },
  { stage: 3, name: "bloom",  minMs: 24 * 60 * 60 * 1000 },
  { stage: 4, name: "garden", minMs: 7 * 24 * 60 * 60 * 1000 }
];

const FLOWER_TYPE_COUNT = 5;

// Growth speed multiplier: more blocked sites = faster growth for all gardens
// 1 site = 1.0x, 2 = 1.1x, 5 = 1.4x, 10 = 1.9x, 16+ capped at 2.5x
const MULTIPLIER_PER_EXTRA_SITE = 0.10;
const MULTIPLIER_CAP = 2.5;

function calcMultiplier(gardens) {
  const blockedCount = Object.values(gardens).filter(g => g.isBlocked).length;
  if (blockedCount <= 0) return 1;
  return Math.min(MULTIPLIER_CAP, 1 + (blockedCount - 1) * MULTIPLIER_PER_EXTRA_SITE);
}

// --- Helpers ---

function today() {
  // Local date in YYYY-MM-DD (en-CA always outputs ISO format in local time)
  return new Date().toLocaleDateString("en-CA");
}

// Collision-free rule ID allocator: sequential IDs persisted per-domain in storage.
// Legacy gardens (pre-1.0.34) relied on a hash → collision-prone; a migration step in
// syncBlockingRules() rewrites their rules to allocated IDs on first startup.
async function getRuleIdMap() {
  const { ruleIds } = await chrome.storage.local.get("ruleIds");
  return ruleIds || {};
}

async function assignRuleId(domain) {
  const data = await chrome.storage.local.get(["ruleIds", "nextRuleId"]);
  const ruleIds = data.ruleIds || {};
  if (ruleIds[domain]) return ruleIds[domain];
  const nextRuleId = data.nextRuleId || 1;
  ruleIds[domain] = nextRuleId;
  await chrome.storage.local.set({ ruleIds, nextRuleId: nextRuleId + 1 });
  return nextRuleId;
}

async function releaseRuleId(domain) {
  const { ruleIds } = await chrome.storage.local.get("ruleIds");
  if (!ruleIds || !ruleIds[domain]) return;
  delete ruleIds[domain];
  await chrome.storage.local.set({ ruleIds });
}

// Legacy hash (kept only so we can find and remove old-style rules during migration)
function legacyHashRuleId(domain) {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = ((hash << 5) - hash + domain.charCodeAt(i)) | 0;
  }
  return (Math.abs(hash) % 2000000) + 1;
}

function calcStage(totalBlockedMs) {
  for (let i = GROWTH_STAGES.length - 1; i >= 0; i--) {
    if (totalBlockedMs >= GROWTH_STAGES[i].minMs) return i;
  }
  return 0;
}

async function getGardens() {
  const data = await chrome.storage.local.get(["gardens"]);
  return data.gardens || {};
}

async function getStats() {
  const data = await chrome.storage.local.get(["stats"]);
  return data.stats || { totalGardensGrown: 0, totalGardensDestroyed: 0, longestStreak: 0, totalBlockedTimeMs: 0 };
}

async function getSettings() {
  const data = await chrome.storage.local.get(["settings"]);
  return data.settings || { isEnabled: true, showAffirmations: true, unblockFriction: "high" };
}

// --- Notifications ---

const STAGE_EMOJIS = ["\ud83c\udf31", "\ud83c\udf3f", "\ud83c\udf37", "\ud83c\udf38", "\ud83c\udf3a"];

function stageMessage(stage) {
  // Maps growth stage → localized notification body via _locales messages.json
  const key = `notifyStage${stage}`;
  const msg = chrome.i18n.getMessage(key);
  return msg && msg.length ? msg : chrome.i18n.getMessage("notifyFallback");
}

async function notifyStageUp(domain, stage) {
  const settings = await getSettings();
  if (settings.showNotifications === false) return;

  chrome.notifications.create(`stage-${domain}-${stage}`, {
    type: "basic",
    iconUrl: "icons/icon-128.png",
    title: `${STAGE_EMOJIS[stage]} ${domain}`,
    message: stageMessage(stage)
  });
}

// Clicking a stage-up notification opens the garden for that domain
chrome.notifications.onClicked.addListener((notificationId) => {
  const match = notificationId.match(/^stage-(.+)-(\d+)$/);
  if (match) {
    const domain = match[1];
    chrome.tabs.create({
      url: chrome.runtime.getURL(`blocked.html?domain=${encodeURIComponent(domain)}`)
    });
  }
  chrome.notifications.clear(notificationId);
});

// --- Badge ---

async function updateBadge() {
  const gardens = await getGardens();
  const count = Object.values(gardens).filter(g => g.isBlocked).length;
  chrome.action.setBadgeText({ text: count > 0 ? String(count) : "" });
  chrome.action.setBadgeBackgroundColor({ color: "#E8457C" });
}

// --- Blocking ---

async function blockSite(domain) {
  const gardens = await getGardens();
  const ruleId = await assignRuleId(domain);

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [ruleId],
    addRules: [{
      id: ruleId,
      priority: 1,
      action: {
        type: "redirect",
        redirect: {
          extensionPath: `/blocked.html?domain=${encodeURIComponent(domain)}`
        }
      },
      condition: {
        urlFilter: `||${domain}`,
        resourceTypes: ["main_frame"]
      }
    }]
  });

  const now = new Date().toISOString();
  if (!gardens[domain]) {
    gardens[domain] = {
      domain,
      blockedSince: now,
      totalBlockedMs: 0,
      lastGrowthTick: now,
      growthStage: 0,
      flowerType: Math.floor(Math.random() * FLOWER_TYPE_COUNT),
      isBlocked: true,
      streak: { currentDays: 0, longestDays: 0, lastCheckedDate: today() }
    };
  } else {
    gardens[domain].isBlocked = true;
    gardens[domain].lastGrowthTick = now;
  }

  await chrome.storage.local.set({ gardens });
  updateBadge();
  return gardens[domain];
}

async function unblockSite(domain) {
  const gardens = await getGardens();
  const stats = await getStats();
  const garden = gardens[domain];
  if (!garden) return;

  const ruleIdMap = await getRuleIdMap();
  const ruleId = ruleIdMap[domain] || legacyHashRuleId(domain);
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [ruleId],
    addRules: []
  });

  stats.totalGardensDestroyed += 1;
  garden.isBlocked = false;
  // Lazy-init streak for gardens created before the streak feature existed
  garden.streak ??= { currentDays: 0, longestDays: 0, lastCheckedDate: today() };
  garden.streak.currentDays = 0;

  // 50% decay — not full reset, not free pass
  garden.totalBlockedMs = Math.floor(garden.totalBlockedMs * 0.5);
  garden.growthStage = calcStage(garden.totalBlockedMs);

  await chrome.storage.local.set({ gardens: gardens, stats: stats });
  updateBadge();
  return garden;
}

async function removeSite(domain) {
  const gardens = await getGardens();
  if (!gardens[domain]) return;

  if (gardens[domain].isBlocked) {
    const ruleIdMap = await getRuleIdMap();
    const ruleId = ruleIdMap[domain] || legacyHashRuleId(domain);
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [ruleId],
      addRules: []
    });
  }

  delete gardens[domain];
  await releaseRuleId(domain);
  await chrome.storage.local.set({ gardens });
  updateBadge();
}

// --- Growth ---

// Cap credit per tick at ~25h so forward clock skew, VM snapshot restores, or multi-day
// browser closures can't instantly vault a garden through every stage. Normal overnight
// closes (<25h) still credit in full; longer gaps cap at this value.
const MAX_TICK_CREDIT_MS = 25 * 60 * 60 * 1000;

async function creditGrowth() {
  const gardens = await getGardens();
  const stats = await getStats();
  const now = Date.now();
  const multiplier = calcMultiplier(gardens);
  let changed = false;

  for (const domain of Object.keys(gardens)) {
    const garden = gardens[domain];
    if (!garden.isBlocked) continue;

    const rawElapsed = now - new Date(garden.lastGrowthTick).getTime();
    if (rawElapsed < 0) continue; // clock skew backwards → skip
    const elapsed = Math.min(rawElapsed, MAX_TICK_CREDIT_MS); // forward-skew / long-close cap

    const boosted = Math.floor(elapsed * multiplier);
    garden.totalBlockedMs += boosted;
    garden.lastGrowthTick = new Date(now).toISOString();

    const newStage = calcStage(garden.totalBlockedMs);
    if (newStage > garden.growthStage) {
      garden.growthStage = newStage;
      if (newStage === 4) stats.totalGardensGrown += 1;
      notifyStageUp(domain, newStage);
    }

    stats.totalBlockedTimeMs += boosted;
    changed = true;
  }

  if (changed) {
    await chrome.storage.local.set({ gardens: gardens, stats: stats });
  }
}

async function updateStreaks() {
  const gardens = await getGardens();
  const stats = await getStats();
  const todayStr = today();
  let changed = false;

  for (const garden of Object.values(gardens)) {
    if (!garden.isBlocked) continue;
    // Lazy-init streak for gardens predating the streak feature
    garden.streak ??= { currentDays: 0, longestDays: 0, lastCheckedDate: todayStr };
    if (garden.streak.lastCheckedDate === todayStr) continue;

    garden.streak.currentDays += 1;
    garden.streak.longestDays = Math.max(garden.streak.longestDays, garden.streak.currentDays);
    garden.streak.lastCheckedDate = todayStr;
    stats.longestStreak = Math.max(stats.longestStreak, garden.streak.currentDays);
    changed = true;
  }

  if (changed) {
    await chrome.storage.local.set({ gardens: gardens, stats: stats });
  }
}

// Renamed-host aliases: a blocked garden for one side must also block the other
// (e.g. "twitter.com" gardens predating the rename to "x.com").
const ALIASES = {
  "twitter.com": ["x.com"],
  "x.com": ["twitter.com"]
};

// One-shot migration: ensure every blocked garden's aliases are also blocked.
// Adds them via blockSite() so rule + garden state stay in sync.
async function migrateAliases() {
  const gardens = await getGardens();
  for (const [domain, garden] of Object.entries(gardens)) {
    if (!garden.isBlocked) continue;
    for (const alias of ALIASES[domain] || []) {
      if (!gardens[alias] || !gardens[alias].isBlocked) {
        await blockSite(alias);
      }
    }
  }
}

// --- Re-sync blocking rules on startup ---
// If the extension was updated or restarted, ensure dynamic rules match stored gardens

async function syncBlockingRules() {
  await migrateAliases();
  const gardens = await getGardens();
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const existingIds = new Set(existing.map(r => r.id));

  const addRules = [];
  const removeIds = [];

  for (const [domain, garden] of Object.entries(gardens)) {
    const ruleId = await assignRuleId(domain); // allocates on first call, idempotent thereafter
    const legacyId = legacyHashRuleId(domain);

    // Remove any stale legacy rule that doesn't match the allocated ID (one-time migration)
    if (legacyId !== ruleId && existingIds.has(legacyId)) {
      removeIds.push(legacyId);
    }

    if (garden.isBlocked && !existingIds.has(ruleId)) {
      addRules.push({
        id: ruleId,
        priority: 1,
        action: {
          type: "redirect",
          redirect: { extensionPath: `/blocked.html?domain=${encodeURIComponent(domain)}` }
        },
        condition: {
          urlFilter: `||${domain}`,
          resourceTypes: ["main_frame"]
        }
      });
    }
    if (!garden.isBlocked && existingIds.has(ruleId)) {
      removeIds.push(ruleId);
    }
  }

  if (addRules.length || removeIds.length) {
    await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: removeIds, addRules });
  }
}

// --- Alarms ---

// Guard: only create alarms if they don't already exist (MV3 SW restarts)
chrome.alarms.get("growthTick", (existing) => {
  if (!existing) chrome.alarms.create("growthTick", { periodInMinutes: 5 });
});
chrome.alarms.get("dailyStreak", (existing) => {
  if (!existing) chrome.alarms.create("dailyStreak", { periodInMinutes: 60 });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "growthTick") await creditGrowth();
  if (alarm.name === "dailyStreak") await updateStreaks();
});

// --- Install / Startup ---

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    await chrome.storage.local.set({
      gardens: {},
      settings: { isEnabled: true, showAffirmations: true, unblockFriction: "high" },
      stats: { totalGardensGrown: 0, totalGardensDestroyed: 0, longestStreak: 0, totalBlockedTimeMs: 0 }
    });
  }
  await syncBlockingRules();
  await updateBadge();
});

chrome.runtime.onStartup.addListener(async () => {
  await syncBlockingRules();
  await creditGrowth();
  await updateStreaks();
  await updateBadge();
});

// --- Message handling from popup + blocked page ---

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    switch (msg.type) {
      case "blockSite": {
        const garden = await blockSite(msg.domain);
        sendResponse({ ok: true, garden });
        break;
      }
      case "unblockSite": {
        const garden = await unblockSite(msg.domain);
        sendResponse({ ok: true, garden });
        break;
      }
      case "removeSite": {
        await removeSite(msg.domain);
        sendResponse({ ok: true });
        break;
      }
      case "getGardens": {
        const gardens = await getGardens();
        // Credit real-time growth for display accuracy, including speed multiplier
        const now = Date.now();
        const multiplier = calcMultiplier(gardens);
        for (const g of Object.values(gardens)) {
          if (g.isBlocked) {
            const elapsed = now - new Date(g.lastGrowthTick).getTime();
            g._displayTotalMs = g.totalBlockedMs + Math.floor(Math.max(0, elapsed) * multiplier);
            g._displayStage = calcStage(g._displayTotalMs);
          } else {
            g._displayTotalMs = g.totalBlockedMs;
            g._displayStage = g.growthStage;
          }
        }
        sendResponse({ gardens, multiplier });
        break;
      }
      case "getStats": {
        const stats = await getStats();
        sendResponse({ stats });
        break;
      }
      case "getSettings": {
        const settings = await getSettings();
        sendResponse({ settings });
        break;
      }
      case "updateSettings": {
        await chrome.storage.local.set({ settings: msg.settings });
        sendResponse({ ok: true });
        break;
      }
      default:
        sendResponse({ error: "unknown message type" });
    }
  })();
  return true; // keep channel open for async response
});
