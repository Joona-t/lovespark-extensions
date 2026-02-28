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

// --- Helpers ---

function today() {
  return new Date().toISOString().slice(0, 10);
}

function domainToRuleId(domain) {
  let hash = 0;
  for (let i = 0; i < domain.length; i++) {
    hash = ((hash << 5) - hash + domain.charCodeAt(i)) | 0;
  }
  // Rule IDs must be positive integers
  return (Math.abs(hash) % 2000000) + 1;
}

function calcStage(totalBlockedMs) {
  for (let i = GROWTH_STAGES.length - 1; i >= 0; i--) {
    if (totalBlockedMs >= GROWTH_STAGES[i].minMs) return i;
  }
  return 0;
}

async function getGardens() {
  const data = await chrome.storage.local.get("gardens");
  return data.gardens || {};
}

async function getStats() {
  const data = await chrome.storage.local.get("stats");
  return data.stats || { totalGardensGrown: 0, totalGardensDestroyed: 0, longestStreak: 0, totalBlockedTimeMs: 0 };
}

async function getSettings() {
  const data = await chrome.storage.local.get("settings");
  return data.settings || { isEnabled: true, showAffirmations: true, unblockFriction: "high" };
}

// --- Notifications ---

const STAGE_MESSAGES = [
  "A seed has been planted!",
  "Your garden is sprouting!",
  "Buds are forming!",
  "Your garden is in full bloom!",
  "A thriving garden!"
];

const STAGE_EMOJIS = ["\ud83c\udf31", "\ud83c\udf3f", "\ud83c\udf37", "\ud83c\udf38", "\ud83c\udf3a"];

async function notifyStageUp(domain, stage) {
  const settings = await getSettings();
  if (settings.showNotifications === false) return;

  chrome.notifications.create(`stage-${domain}-${stage}`, {
    type: "basic",
    iconUrl: "icons/icon-128.png",
    title: `${STAGE_EMOJIS[stage]} ${domain}`,
    message: STAGE_MESSAGES[stage] || "Your garden is growing!"
  });
}

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
  const ruleId = domainToRuleId(domain);

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

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: [domainToRuleId(domain)],
    addRules: []
  });

  stats.totalGardensDestroyed += 1;
  garden.isBlocked = false;
  garden.streak.currentDays = 0;

  // 50% decay — not full reset, not free pass
  garden.totalBlockedMs = Math.floor(garden.totalBlockedMs * 0.5);
  garden.growthStage = calcStage(garden.totalBlockedMs);

  await chrome.storage.local.set({ gardens, stats });
  updateBadge();
  return garden;
}

async function removeSite(domain) {
  const gardens = await getGardens();
  if (!gardens[domain]) return;

  if (gardens[domain].isBlocked) {
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: [domainToRuleId(domain)],
      addRules: []
    });
  }

  delete gardens[domain];
  await chrome.storage.local.set({ gardens });
  updateBadge();
}

// --- Growth ---

async function creditGrowth() {
  const gardens = await getGardens();
  const stats = await getStats();
  const now = Date.now();
  let changed = false;

  for (const domain of Object.keys(gardens)) {
    const garden = gardens[domain];
    if (!garden.isBlocked) continue;

    const elapsed = now - new Date(garden.lastGrowthTick).getTime();
    if (elapsed < 0) continue; // clock skew guard

    garden.totalBlockedMs += elapsed;
    garden.lastGrowthTick = new Date(now).toISOString();

    const newStage = calcStage(garden.totalBlockedMs);
    if (newStage > garden.growthStage) {
      garden.growthStage = newStage;
      if (newStage === 4) stats.totalGardensGrown += 1;
      notifyStageUp(domain, newStage);
    }

    stats.totalBlockedTimeMs += elapsed;
    changed = true;
  }

  if (changed) {
    await chrome.storage.local.set({ gardens, stats });
  }
}

async function updateStreaks() {
  const gardens = await getGardens();
  const stats = await getStats();
  const todayStr = today();
  let changed = false;

  for (const garden of Object.values(gardens)) {
    if (!garden.isBlocked) continue;
    if (garden.streak.lastCheckedDate === todayStr) continue;

    garden.streak.currentDays += 1;
    garden.streak.longestDays = Math.max(garden.streak.longestDays, garden.streak.currentDays);
    garden.streak.lastCheckedDate = todayStr;
    stats.longestStreak = Math.max(stats.longestStreak, garden.streak.currentDays);
    changed = true;
  }

  if (changed) {
    await chrome.storage.local.set({ gardens, stats });
  }
}

// --- Re-sync blocking rules on startup ---
// If the extension was updated or restarted, ensure dynamic rules match stored gardens

async function syncBlockingRules() {
  const gardens = await getGardens();
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const existingIds = new Set(existing.map(r => r.id));

  const addRules = [];
  const removeIds = [];

  for (const [domain, garden] of Object.entries(gardens)) {
    const ruleId = domainToRuleId(domain);
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

chrome.alarms.create("growthTick", { periodInMinutes: 5 });
chrome.alarms.create("dailyStreak", { periodInMinutes: 60 });

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
        // Credit real-time growth for display accuracy
        const now = Date.now();
        for (const g of Object.values(gardens)) {
          if (g.isBlocked) {
            const elapsed = now - new Date(g.lastGrowthTick).getTime();
            g._displayTotalMs = g.totalBlockedMs + Math.max(0, elapsed);
            g._displayStage = calcStage(g._displayTotalMs);
          } else {
            g._displayTotalMs = g.totalBlockedMs;
            g._displayStage = g.growthStage;
          }
        }
        sendResponse({ gardens });
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
