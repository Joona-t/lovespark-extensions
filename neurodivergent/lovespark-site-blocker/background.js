'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  blocksToday: 0,
  blocksTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  blocklist: ['reddit.com', 'twitter.com', 'x.com', 'tiktok.com', 'instagram.com', 'facebook.com', 'youtube.com'],
  theme: 'retro'
};

const stats = LoveSparkStats.createAccumulator('blocksToday', 'blocksTotal',
  () => LoveSparkBadge.update('isEnabled', 'blocksToday'));

async function updateRules() {
  const data = await chrome.storage.local.get(['blocklist', 'isEnabled']);
  const blocklist = data.blocklist || [];
  const enabled = data.isEnabled !== false;

  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  const removeIds = existing.map(r => r.id);
  const addRules = [];

  if (enabled) {
    for (let i = 0; i < blocklist.length; i++) {
      const domain = blocklist[i].trim().toLowerCase();
      if (!domain) continue;
      addRules.push({
        id: i + 1,
        priority: 1,
        action: { type: 'redirect', redirect: { extensionPath: '/blocked.html' } },
        condition: { urlFilter: '||' + domain, resourceTypes: ['main_frame'] }
      });
    }
  }

  await chrome.declarativeNetRequest.updateDynamicRules({ removeRuleIds: removeIds, addRules });
}

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'blocksToday');
  await updateRules();
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('blocksToday');
  await LoveSparkBadge.update('isEnabled', 'blocksToday');
  await updateRules();
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('blocksToday');
      const data = await chrome.storage.local.get(['blocksToday', 'blocksTotal', 'isEnabled', 'blocklist']);
      return {
        blocksToday: data.blocksToday || 0,
        blocksTotal: data.blocksTotal || 0,
        isEnabled: data.isEnabled !== false,
        blocklist: data.blocklist || []
      };
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'blocksToday');
      await updateRules();
      return { ok: true };
    }
    case 'ADD_SITE': {
      const data = await chrome.storage.local.get('blocklist');
      const list = data.blocklist || [];
      const site = (msg.site || '').trim().toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').replace(/\/.*$/, '');
      if (!site || list.includes(site)) return { ok: true, blocklist: list };
      if (list.length >= 50) return { error: 'Maximum 50 sites' };
      list.push(site);
      await chrome.storage.local.set({ blocklist: list });
      await updateRules();
      return { ok: true, blocklist: list };
    }
    case 'REMOVE_SITE': {
      const data = await chrome.storage.local.get('blocklist');
      const list = (data.blocklist || []).filter(s => s !== msg.site);
      await chrome.storage.local.set({ blocklist: list });
      await updateRules();
      return { ok: true, blocklist: list };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
