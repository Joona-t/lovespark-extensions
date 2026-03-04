// Are You Cooked? — background.js
// Two-tier escalation: mild once at 5, strict on every tab at 10+.
// Zero permissions: no tabs, no notifications.
'use strict';

const MILD_THRESHOLD      = 5;
const STRICT_THRESHOLD    = 10;
const WARNING_COOLDOWN_MS = 3000;

let mildWarningDelivered = false;
let lastWarningTime      = 0;

// Restore persisted state on service worker wake
chrome.storage.session.get('mildWarningDelivered').then(data => {
  mildWarningDelivered = data.mildWarningDelivered || false;
}).catch(() => {});

function fireWarning(count, tabId, level) {
  const params = new URLSearchParams({ count, level });
  if (tabId != null) params.set('tabId', tabId);

  chrome.windows.create({
    url:     `warning.html?${params}`,
    type:    'popup',
    width:   level === 'strict' ? 400 : 380,
    height:  level === 'strict' ? 460 : 340,
    focused: true,
  }).catch(() => {});
}

async function updateBadge(count) {
  const text  = count > 0 ? String(count) : '';
  const color = count >= STRICT_THRESHOLD ? '#D63466'
              : count >= MILD_THRESHOLD   ? '#E8457C'
              : '#9E4D6E';
  chrome.action.setBadgeText({ text }).catch(() => {});
  chrome.action.setBadgeBackgroundColor({ color }).catch(() => {});
}

chrome.tabs.onCreated.addListener(async (tab) => {
  let tabs;
  try { tabs = await chrome.tabs.query({ windowType: 'normal' }); } catch { return; }
  const count = tabs.length;

  updateBadge(count);

  // Cooldown: skip if a warning was just shown
  const now = Date.now();
  if (now - lastWarningTime < WARNING_COOLDOWN_MS) return;

  // 10+ tabs: strict popup on EVERY new tab
  if (count >= STRICT_THRESHOLD) {
    mildWarningDelivered = true;
    chrome.storage.session.set({ mildWarningDelivered: true }).catch(() => {});
    lastWarningTime = now;
    fireWarning(count, tab.id, 'strict');
    return;
  }

  // 5 tabs: mild popup once
  if (count >= MILD_THRESHOLD && !mildWarningDelivered) {
    mildWarningDelivered = true;
    chrome.storage.session.set({ mildWarningDelivered: true }).catch(() => {});
    lastWarningTime = now;
    fireWarning(count, null, 'mild');
    return;
  }
});

chrome.tabs.onRemoved.addListener(async () => {
  let tabs;
  try { tabs = await chrome.tabs.query({ windowType: 'normal' }); } catch { return; }
  const count = tabs.length;

  updateBadge(count);

  if (count < MILD_THRESHOLD) {
    mildWarningDelivered = false;
    chrome.storage.session.set({ mildWarningDelivered: false }).catch(() => {});
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'closeTab' && typeof msg.tabId === 'number' && msg.tabId > 0) {
    chrome.tabs.remove(msg.tabId).catch(() => {});
  }
});
