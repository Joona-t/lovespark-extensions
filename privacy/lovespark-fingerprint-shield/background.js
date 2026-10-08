// LoveSpark Fingerprint Shield — background.js
// Service worker: stats tracking, badge, daily reset, toggle broadcast.

'use strict';

const TODAY = () => new Date().toISOString().slice(0, 10);

// ── Daily reset check ─────────────────────────────────────────────────
async function checkDailyReset() {
  const data = await chrome.storage.local.get([
    'lastResetDate',
    'fingerprintsSpoofedToday'
  ]);
  const today = TODAY();
  if (data.lastResetDate !== today) {
    await chrome.storage.local.set({
      lastResetDate: today,
      fingerprintsSpoofedToday: 0
    });
  }
}

// ── Badge update ──────────────────────────────────────────────────────
async function updateBadge() {
  const data = await chrome.storage.local.get([
    'fingerprintsSpoofedToday',
    'isEnabled'
  ]);
  const enabled = data.isEnabled !== false;
  const count = data.fingerprintsSpoofedToday || 0;

  if (!enabled) {
    chrome.action.setBadgeText({ text: 'OFF' });
    chrome.action.setBadgeBackgroundColor({ color: '#999999' });
    return;
  }

  let text = '';
  if (count > 0) {
    text = count >= 10000 ? Math.floor(count / 1000) + 'k' :
           count >= 1000 ? (count / 1000).toFixed(1) + 'k' :
           String(count);
  }
  chrome.action.setBadgeText({ text });
  chrome.action.setBadgeBackgroundColor({ color: '#FF69B4' });
}

// ── Message handler ───────────────────────────────────────────────────
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.action === 'fingerprintSpoofed') {
    const count = message.count || 1;
    chrome.storage.local.get([
      'fingerprintsSpoofedToday',
      'fingerprintsSpoofedTotal',
      'lastResetDate'
    ], function(data) {
      const today = TODAY();
      let todayCount = data.fingerprintsSpoofedToday || 0;
      let totalCount = data.fingerprintsSpoofedTotal || 0;

      // Daily reset if needed
      if (data.lastResetDate !== today) {
        todayCount = 0;
      }

      todayCount += count;
      totalCount += count;

      chrome.storage.local.set({
        fingerprintsSpoofedToday: todayCount,
        fingerprintsSpoofedTotal: totalCount,
        lastResetDate: today
      }, updateBadge);
    });
    return false;
  }

  if (message.action === 'getStats') {
    checkDailyReset().then(function() {
      chrome.storage.local.get([
        'fingerprintsSpoofedToday',
        'fingerprintsSpoofedTotal',
        'isEnabled'
      ], function(data) {
        sendResponse({
          today: data.fingerprintsSpoofedToday || 0,
          total: data.fingerprintsSpoofedTotal || 0,
          isEnabled: data.isEnabled !== false
        });
      });
    });
    return true; // async sendResponse
  }

  if (message.action === 'setEnabled') {
    const enabled = message.enabled;
    chrome.storage.local.set({ isEnabled: enabled }, function() {
      updateBadge();
      // Broadcast to all tabs
      chrome.tabs.query({}, function(tabs) {
        for (const tab of tabs) {
          chrome.tabs.sendMessage(tab.id, {
            action: 'enabledChanged',
            enabled: enabled
          }).catch(function() {
            // Expected: tabs without our content script (chrome://, store pages, unloaded tabs) reject; nothing to update there.
          });
        }
      });
      sendResponse({ ok: true });
    });
    return true;
  }

  return false;
});

// ── Startup ───────────────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.local.get(['isEnabled'], function(data) {
    if (data.isEnabled === undefined) {
      chrome.storage.local.set({ isEnabled: true });
    }
  });
  checkDailyReset().then(updateBadge);
});

chrome.runtime.onStartup.addListener(function() {
  checkDailyReset().then(updateBadge);
});
