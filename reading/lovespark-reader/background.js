/**
 * LoveSpark Reader — background.js (Service Worker)
 * Badge management only. All injection is static via manifest.
 */
'use strict';

const BADGE_ICON = { sakura: '🌸', hotpink: '💖', starlight: '✨' };

async function updateBadge() {
  const data = await chrome.storage.local.get(['enabled', 'mode']);
  const enabled = data.enabled !== false;
  const mode = data.mode || 'sakura';

  chrome.action.setBadgeText({ text: enabled ? (BADGE_ICON[mode] || '') : '' });
  chrome.action.setBadgeBackgroundColor({ color: enabled ? '#FF69B4' : '#555555' });
}

chrome.storage.onChanged.addListener((changes, areaName) => {
  if (areaName === 'local') updateBadge();
});

chrome.runtime.onInstalled.addListener(async () => {
  const defaults = { enabled: true, mode: 'sakura', disabledSites: [] };
  const data = await chrome.storage.local.get(Object.keys(defaults));
  await chrome.storage.local.set({ ...defaults, ...data });
  await updateBadge();
});

chrome.runtime.onStartup.addListener(() => updateBadge());
