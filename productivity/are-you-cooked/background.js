// Are You Cooked? — background.js
// Two-tier escalation: mild (5 tabs) and strict (10+ tabs).
// Milestone notifications at 15, 20, 25, 30+.
'use strict';

const MILD_THRESHOLD   = 5;
const STRICT_THRESHOLD = 10;

let hasWarnedAt5  = false;
let hasWarnedAt10 = false;

const MILESTONE_MESSAGES = {
  15: "ok we need to talk. this is getting concerning 🤨",
  20: "you're getting cooked bestie. close some tabs pls 🔥",
  25: "BESTIE. PUT THE TABS DOWN. 💀",
};

const MSG_30_PLUS = "call 911. we are fully cooked. there is no saving us. 💀🔥";

function getMilestoneMessage(count) {
  if (count < 15 || count % 5 !== 0) return null;
  if (count >= 30) return MSG_30_PLUS;
  return MILESTONE_MESSAGES[count] || null;
}

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

  if (count >= STRICT_THRESHOLD && !hasWarnedAt10) {
    hasWarnedAt10 = true;
    hasWarnedAt5  = true;
    fireWarning(count, tab.id, 'strict');
    return;
  }

  if (count >= MILD_THRESHOLD && !hasWarnedAt5) {
    hasWarnedAt5 = true;
    fireWarning(count, null, 'mild');
    return;
  }

  const message = getMilestoneMessage(count);
  if (message) {
    chrome.notifications.create(`cooked-${count}-${Date.now()}`, {
      type:    'basic',
      iconUrl: 'mascot.png',
      title:   'are you cooked? 🔥',
      message,
      priority: 1,
    });
  }
});

chrome.tabs.onRemoved.addListener(async () => {
  const tabs  = await chrome.tabs.query({});
  const count = tabs.length;
  if (count < MILD_THRESHOLD)   hasWarnedAt5  = false;
  if (count < STRICT_THRESHOLD) hasWarnedAt10 = false;
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'closeTab' && typeof msg.tabId === 'number') {
    chrome.tabs.remove(msg.tabId).catch(() => {});
  }
});
