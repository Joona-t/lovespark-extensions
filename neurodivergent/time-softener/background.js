'use strict';

importScripts('lib/lovespark-lifecycle.js');

const DEFAULTS = {
  enabled: true,
  sites: [
    'reddit.com',
    'twitter.com',
    'x.com',
    'tiktok.com',
    'instagram.com',
    'facebook.com',
    'youtube.com',
    'twitch.tv',
  ],
  pauseDuration: 5,
  cooldownMinutes: 15,
  todaySoftened: 0,
  totalSoftened: 0,
};

chrome.runtime.onInstalled.addListener(() => {
  LoveSparkLifecycle.initDefaults(DEFAULTS);
});

chrome.runtime.onStartup.addListener(() => {
  LoveSparkLifecycle.initDefaults(DEFAULTS);
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  if (msg.type === 'GET_SETTINGS') {
    return chrome.storage.local.get(null);
  }
  if (msg.type === 'SOFTENED') {
    const data = await chrome.storage.local.get(['todaySoftened', 'totalSoftened']);
    await chrome.storage.local.set({
      todaySoftened: (data.todaySoftened || 0) + 1,
      totalSoftened: (data.totalSoftened || 0) + 1,
    });
    return { ok: true };
  }
  return {};
});
