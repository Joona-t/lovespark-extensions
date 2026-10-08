'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

var DEFAULTS = {
  scrollToday: 0,
  scrollTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
  disabledSites: [],
};

var stats = LoveSparkStats.createAccumulator('scrollToday', 'scrollTotal',
  function() { LoveSparkBadge.update('isEnabled', 'scrollToday'); });

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'scrollToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('scrollToday');
  await LoveSparkBadge.update('isEnabled', 'scrollToday');
});

function getHostname(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return '';
  }
}

async function isSiteDisabled(hostname) {
  var data = await chrome.storage.local.get(['disabledSites']);
  var sites = data.disabledSites || [];
  return sites.indexOf(hostname) !== -1;
}

async function applyMinimalScroll(tabId, url) {
  var data = await chrome.storage.local.get(['isEnabled']);
  if (data.isEnabled === false) return;

  var hostname = getHostname(url || '');
  if (hostname && await isSiteDisabled(hostname)) return;

  try {
    await chrome.scripting.insertCSS({
      target: { tabId: tabId },
      css: [
        '/* LoveSpark Minimal Scroll */',
        '::-webkit-scrollbar { width: 4px !important; height: 4px !important; }',
        '::-webkit-scrollbar-track { background: transparent !important; }',
        '::-webkit-scrollbar-thumb { background: rgba(150, 150, 150, 0.35) !important; border-radius: 4px !important; }',
        '::-webkit-scrollbar-thumb:hover { background: rgba(150, 150, 150, 0.55) !important; }',
        '* { scrollbar-width: thin !important; scrollbar-color: rgba(150, 150, 150, 0.35) transparent !important; }'
      ].join('\n')
    });
    stats.bump(1);
  } catch (err) {
    // Restricted tab
  }
}

async function removeMinimalScroll(tabId) {
  try {
    await chrome.scripting.removeCSS({
      target: { tabId: tabId },
      css: [
        '/* LoveSpark Minimal Scroll */',
        '::-webkit-scrollbar { width: 4px !important; height: 4px !important; }',
        '::-webkit-scrollbar-track { background: transparent !important; }',
        '::-webkit-scrollbar-thumb { background: rgba(150, 150, 150, 0.35) !important; border-radius: 4px !important; }',
        '::-webkit-scrollbar-thumb:hover { background: rgba(150, 150, 150, 0.55) !important; }',
        '* { scrollbar-width: thin !important; scrollbar-color: rgba(150, 150, 150, 0.35) transparent !important; }'
      ].join('\n')
    });
  } catch (err) {
    // ignore
  }
}

// Apply on page load
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;
  await applyMinimalScroll(tabId, tab.url);
});

// Apply on tab switch
chrome.tabs.onActivated.addListener(async (activeInfo) => {
  var tab = await chrome.tabs.get(activeInfo.tabId);
  await applyMinimalScroll(activeInfo.tabId, tab.url);
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('scrollToday');
      return chrome.storage.local.get([
        'scrollToday', 'scrollTotal', 'isEnabled', 'disabledSites'
      ]);
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'scrollToday');
      var tabs = await chrome.tabs.query({});
      for (var i = 0; i < tabs.length; i++) {
        var tab = tabs[i];
        if (tab.id && tab.url && !tab.url.startsWith('chrome://')) {
          if (msg.enabled) {
            await applyMinimalScroll(tab.id, tab.url);
          } else {
            await removeMinimalScroll(tab.id);
          }
        }
      }
      return { ok: true };
    }
    case 'TOGGLE_SITE': {
      var data = await chrome.storage.local.get(['disabledSites']);
      var sites = data.disabledSites || [];
      var hostname = msg.hostname;
      var idx = sites.indexOf(hostname);
      if (idx === -1) {
        sites.push(hostname);
      } else {
        sites.splice(idx, 1);
      }
      await chrome.storage.local.set({ disabledSites: sites });
      // Re-apply or remove on active tab
      var activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTabs[0] && activeTabs[0].id) {
        if (idx === -1) {
          // Was enabled, now disabled for this site
          await removeMinimalScroll(activeTabs[0].id);
        } else {
          // Was disabled, now re-enabled
          await applyMinimalScroll(activeTabs[0].id, activeTabs[0].url);
        }
      }
      return { ok: true, disabledSites: sites };
    }
    case 'GET_CURRENT_SITE': {
      var activeTabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (activeTabs[0] && activeTabs[0].url) {
        return { hostname: getHostname(activeTabs[0].url) };
      }
      return { hostname: '' };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
