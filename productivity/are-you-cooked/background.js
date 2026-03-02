// Are You Cooked? — background.js
// Two-tier escalation: mild once at 5, strict on every tab at 10+.
'use strict';

const MILD_THRESHOLD   = 5;
const STRICT_THRESHOLD = 10;

let hasWarnedAt5 = false;

function fireWarning(count, tabId, level) {
  chrome.notifications.create(`cooked-warn-${Date.now()}`, {
    type:    'basic',
    iconUrl: 'mascot.png',
    title:   level === 'strict'
      ? 'BESTIE STOP. You are COOKED. 🔥💀'
      : 'Homie are you cooked?! 🔥',
    message: `You just opened tab #${count}. Close some tabs bestie 💀`,
    priority: 2,
  });

  const params = new URLSearchParams({ count, level });
  if (tabId != null) params.set('tabId', tabId);

  chrome.windows.create({
    url:     `warning.html?${params}`,
    type:    'popup',
    width:   level === 'strict' ? 420 : 380,
    height:  level === 'strict' ? 400 : 340,
    focused: true,
  });
}

chrome.tabs.onCreated.addListener(async (tab) => {
  const tabs  = await chrome.tabs.query({});
  const count = tabs.length;

  // 10+ tabs: strict popup on EVERY new tab
  if (count >= STRICT_THRESHOLD) {
    hasWarnedAt5 = true;
    fireWarning(count, tab.id, 'strict');
    return;
  }

  // 5 tabs: mild popup once
  if (count >= MILD_THRESHOLD && !hasWarnedAt5) {
    hasWarnedAt5 = true;
    fireWarning(count, null, 'mild');
    return;
  }
});

chrome.tabs.onRemoved.addListener(async () => {
  const tabs = await chrome.tabs.query({});
  if (tabs.length < MILD_THRESHOLD) hasWarnedAt5 = false;
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'closeTab' && typeof msg.tabId === 'number') {
    chrome.tabs.remove(msg.tabId).catch(() => {});
  }
});
