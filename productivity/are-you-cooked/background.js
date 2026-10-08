// Are You Cooked? — background.js
// Two-tier escalation: mild once at 5, strict on every tab at 10+.
// Zero permissions: no tabs, no notifications.
'use strict';

importScripts('lib/lovespark-stats.js');

const MILD_THRESHOLD      = 5;
const STRICT_THRESHOLD    = 10;
const WARNING_COOLDOWN_MS = 3000;

let mildWarningDelivered = false;
let lastWarningTime      = 0;

// Restore persisted state on service worker wake
chrome.storage.session.get('mildWarningDelivered').then(data => {
  mildWarningDelivered = data.mildWarningDelivered || false;
}).catch(err => console.warn('[AYC] session restore', err));

// Daily reset on wake — keeps "worst today" + "mindful help today" honest.
LoveSparkStats.checkDailyReset('worstToday',       'ayc_worstResetDate')
  .catch(err => console.warn('[AYC] worstToday reset', err));
LoveSparkStats.checkDailyReset('mindfulHelpToday', 'ayc_mindfulResetDate')
  .catch(err => console.warn('[AYC] mindful reset', err));

function fireWarning(count, tabId, level) {
  const params = new URLSearchParams({ count, level });
  if (tabId != null) params.set('tabId', tabId);

  chrome.windows.create({
    url:     `warning.html?${params}`,
    type:    'popup',
    width:   level === 'strict' ? 400 : 380,
    height:  level === 'strict' ? 460 : 340,
    focused: true,
  }).catch(err => console.warn('[AYC] window create', err));
}

function updateBadge(count) {
  const text  = count > 0 ? String(count) : '';
  const color = count >= STRICT_THRESHOLD ? '#D63466'
              : count >= MILD_THRESHOLD   ? '#E8457C'
              : '#9E4D6E';
  chrome.action.setBadgeText({ text })
    .catch(err => console.warn('[AYC] badge text', err));
  chrome.action.setBadgeBackgroundColor({ color })
    .catch(err => console.warn('[AYC] badge color', err));
}

async function bumpWorstToday(count) {
  try {
    await LoveSparkStats.checkDailyReset('worstToday', 'ayc_worstResetDate');
    const { worstToday } = await chrome.storage.local.get('worstToday');
    if (count > (worstToday || 0)) {
      await chrome.storage.local.set({ worstToday: count });
    }
  } catch (err) {
    console.warn('[AYC] worstToday update', err);
  }
}

async function bumpMindfulHelp() {
  try {
    await LoveSparkStats.checkDailyReset('mindfulHelpToday', 'ayc_mindfulResetDate');
    const { mindfulHelpToday, mindfulHelpTotal } = await chrome.storage.local.get([
      'mindfulHelpToday', 'mindfulHelpTotal',
    ]);
    await chrome.storage.local.set({
      mindfulHelpToday: (mindfulHelpToday || 0) + 1,
      mindfulHelpTotal: (mindfulHelpTotal || 0) + 1,
    });
  } catch (err) {
    console.warn('[AYC] mindful counter', err);
  }
}

chrome.tabs.onCreated.addListener(async (tab) => {
  let tabs;
  try { tabs = await chrome.tabs.query({ windowType: 'normal' }); } catch { return; }
  const count = tabs.length;

  updateBadge(count);
  bumpWorstToday(count);

  // Cooldown: skip if a warning was just shown
  const now = Date.now();
  if (now - lastWarningTime < WARNING_COOLDOWN_MS) return;

  // 10+ tabs: strict popup on EVERY new tab
  if (count >= STRICT_THRESHOLD) {
    mildWarningDelivered = true;
    chrome.storage.session.set({ mildWarningDelivered: true })
      .catch(err => console.warn('[AYC] session set', err));
    lastWarningTime = now;
    fireWarning(count, tab.id, 'strict');
    return;
  }

  // 5 tabs: mild popup once
  if (count >= MILD_THRESHOLD && !mildWarningDelivered) {
    mildWarningDelivered = true;
    chrome.storage.session.set({ mildWarningDelivered: true })
      .catch(err => console.warn('[AYC] session set', err));
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
    chrome.storage.session.set({ mildWarningDelivered: false })
      .catch(err => console.warn('[AYC] session set', err));
  }
});

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === 'closeTab' && typeof msg.tabId === 'number' && msg.tabId > 0) {
    chrome.tabs.remove(msg.tabId)
      .catch(err => console.warn('[AYC] tabs.remove', err));
    bumpMindfulHelp();
  }
});
