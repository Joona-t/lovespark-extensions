'use strict';
importScripts('lib/lovespark-stats.js', 'lib/lovespark-badge.js', 'lib/lovespark-lifecycle.js');

const DEFAULTS = {
  blockedToday: 0,
  blockedTotal: 0,
  lastResetDate: LoveSparkStats.todayStr(),
  isEnabled: true,
};

const stats = LoveSparkStats.createAccumulator('blockedToday', 'blockedTotal',
  () => LoveSparkBadge.update('isEnabled', 'blockedToday'));

/* Suspicious file extensions */
const SUSPICIOUS_EXTS = [
  '.exe', '.bat', '.cmd', '.scr', '.vbs', '.vbe',
  '.js', '.jse', '.wsf', '.wsh', '.ps1', '.pif',
  '.msi', '.com', '.hta', '.cpl', '.reg',
];

function getFileExtension(filename) {
  if (!filename) return '';
  var dot = filename.lastIndexOf('.');
  if (dot === -1) return '';
  return filename.slice(dot).toLowerCase();
}

function isSuspicious(downloadItem) {
  var filename = downloadItem.filename || '';
  var ext = getFileExtension(filename);
  if (!ext) {
    /* Try URL as fallback */
    try {
      var url = new URL(downloadItem.url || '');
      ext = getFileExtension(url.pathname);
    } catch (e) { /* ignore */ }
  }
  return SUSPICIOUS_EXTS.indexOf(ext) !== -1;
}

chrome.runtime.onInstalled.addListener(async () => {
  await LoveSparkLifecycle.initDefaults(DEFAULTS);
  LoveSparkBadge.init();
  await LoveSparkBadge.update('isEnabled', 'blockedToday');
});

chrome.runtime.onStartup.addListener(async () => {
  await LoveSparkStats.checkDailyReset('blockedToday');
  await LoveSparkBadge.update('isEnabled', 'blockedToday');
});

/* Intercept downloads */
chrome.downloads.onDeterminingFilename.addListener((downloadItem, suggest) => {
  chrome.storage.local.get(['isEnabled'], (data) => {
    if (data.isEnabled === false) {
      suggest();
      return;
    }

    if (isSuspicious(downloadItem)) {
      /* Pause the download — let user decide */
      chrome.downloads.pause(downloadItem.id, () => {
        stats.bump(1);
        /* Store pending download info for the popup to show */
        chrome.storage.local.set({
          pendingDownload: {
            id: downloadItem.id,
            filename: downloadItem.filename,
            url: downloadItem.url,
            ext: getFileExtension(downloadItem.filename) || getFileExtension(new URL(downloadItem.url).pathname),
            timestamp: Date.now(),
          },
        });
      });
      suggest();
    } else {
      suggest();
    }
  });
  return true; /* async response */
});

LoveSparkLifecycle.setupMessageHandler(async (msg) => {
  switch (msg.type) {
    case 'GET_STATS': {
      await LoveSparkStats.checkDailyReset('blockedToday');
      return chrome.storage.local.get(['blockedToday', 'blockedTotal', 'isEnabled', 'pendingDownload']);
    }
    case 'SET_ENABLED': {
      await chrome.storage.local.set({ isEnabled: msg.enabled });
      await LoveSparkBadge.update('isEnabled', 'blockedToday');
      return { ok: true };
    }
    case 'RESUME_DOWNLOAD': {
      if (msg.downloadId) {
        try { chrome.downloads.resume(msg.downloadId); } catch (e) { /* already gone */ }
      }
      await chrome.storage.local.remove('pendingDownload');
      return { ok: true };
    }
    case 'CANCEL_DOWNLOAD': {
      if (msg.downloadId) {
        try { chrome.downloads.cancel(msg.downloadId); } catch (e) { /* already gone */ }
      }
      await chrome.storage.local.remove('pendingDownload');
      return { ok: true };
    }
    default:
      return { error: 'Unknown message type' };
  }
});
