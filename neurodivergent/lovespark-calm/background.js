'use strict';

/* ── Badge helpers ──────────────────────────────────── */
function setBadgeActive() {
  chrome.action.setBadgeText({ text: 'C' });
  chrome.action.setBadgeBackgroundColor({ color: '#7C3AED' });
}

function setBadgeInactive() {
  chrome.action.setBadgeText({ text: '' });
}

/* ── Inject / Remove calm mode ──────────────────────── */
async function injectCalm(tabId, intensity) {
  try {
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ['content.css']
    });
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });
    await chrome.scripting.executeScript({
      target: { tabId },
      func: (level) => {
        if (typeof window.__lovesparkCalm !== 'undefined') {
          window.__lovesparkCalm.apply(level);
        }
      },
      args: [intensity]
    });
  } catch (err) {
    /* Tab may be a chrome:// page or otherwise restricted */
    console.warn('LoveSpark Calm: cannot inject into tab', tabId, err.message);
  }
}

async function removeCalm(tabId) {
  try {
    await chrome.scripting.removeCSS({
      target: { tabId },
      files: ['content.css']
    });
    await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        if (typeof window.__lovesparkCalm !== 'undefined') {
          window.__lovesparkCalm.remove();
        }
      }
    });
  } catch (err) {
    console.warn('LoveSpark Calm: cannot remove from tab', tabId, err.message);
  }
}

/* ── Domain helpers ─────────────────────────────────── */
function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

function parseDomainList(str) {
  if (!str) return [];
  return str.split('\n').map(s => s.trim().toLowerCase()).filter(Boolean);
}

/* ── Check auto-enable / auto-disable for a domain ─── */
async function shouldAutoCalm(domain) {
  const data = await chrome.storage.local.get([
    'autoEnableDomains', 'autoDisableDomains', 'siteOverrides'
  ]);

  const overrides = data.siteOverrides || {};
  if (overrides[domain] === 'always') return 'always';
  if (overrides[domain] === 'never') return 'never';

  const enableList = parseDomainList(data.autoEnableDomains);
  const disableList = parseDomainList(data.autoDisableDomains);

  if (disableList.some(d => domain.includes(d))) return 'never';
  if (enableList.some(d => domain.includes(d))) return 'always';
  return 'default';
}

/* ── Track calmed sites count ──────────────────────── */
const calmedTabs = new Set();

function updateSiteCount() {
  chrome.storage.local.set({ calmedSiteCount: calmedTabs.size });
}

/* ── Message handler ────────────────────────────────── */
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.action === 'toggleCalm') {
    handleToggle(msg.enabled, msg.intensity);
    sendResponse({ ok: true });
  } else if (msg.action === 'changeIntensity') {
    handleIntensityChange(msg.intensity);
    sendResponse({ ok: true });
  } else if (msg.action === 'getState') {
    chrome.storage.local.get(
      ['calmEnabled', 'intensity', 'calmedSiteCount', 'siteOverrides'],
      (data) => {
        sendResponse({
          enabled: data.calmEnabled || false,
          intensity: data.intensity || 'medium',
          siteCount: data.calmedSiteCount || 0,
          siteOverrides: data.siteOverrides || {}
        });
      }
    );
    return true; /* async sendResponse */
  } else if (msg.action === 'setSiteOverride') {
    handleSiteOverride(msg.domain, msg.mode);
    sendResponse({ ok: true });
  }
});

async function handleToggle(enabled, intensity) {
  await chrome.storage.local.set({ calmEnabled: enabled, intensity });

  if (enabled) {
    setBadgeActive();
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      await injectCalm(tab.id, intensity);
      calmedTabs.add(tab.id);
      updateSiteCount();
    }
  } else {
    setBadgeInactive();
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.id) {
      await removeCalm(tab.id);
      calmedTabs.delete(tab.id);
      updateSiteCount();
    }
  }
}

async function handleIntensityChange(intensity) {
  await chrome.storage.local.set({ intensity });

  const data = await chrome.storage.local.get(['calmEnabled']);
  if (!data.calmEnabled) return;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab && tab.id) {
    await injectCalm(tab.id, intensity);
  }
}

async function handleSiteOverride(domain, mode) {
  const data = await chrome.storage.local.get(['siteOverrides']);
  const overrides = data.siteOverrides || {};

  if (mode === 'default') {
    delete overrides[domain];
  } else {
    overrides[domain] = mode;
  }

  await chrome.storage.local.set({ siteOverrides: overrides });
}

/* ── Tab navigation: re-inject if calm mode is on ──── */
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete' || !tab.url) return;

  const domain = extractDomain(tab.url);
  if (!domain) return;

  const data = await chrome.storage.local.get(['calmEnabled', 'intensity']);
  const autoStatus = await shouldAutoCalm(domain);

  if (autoStatus === 'never') {
    calmedTabs.delete(tabId);
    updateSiteCount();
    setBadgeInactive();
    return;
  }

  const shouldInject = autoStatus === 'always' || data.calmEnabled;

  if (shouldInject) {
    const intensity = data.intensity || 'medium';
    await injectCalm(tabId, intensity);
    calmedTabs.add(tabId);
    updateSiteCount();
    setBadgeActive();
  }
});

/* ── Tab removed: clean up tracking ────────────────── */
chrome.tabs.onRemoved.addListener((tabId) => {
  calmedTabs.delete(tabId);
  updateSiteCount();
});

/* ── Restore badge state on startup ────────────────── */
chrome.storage.local.get(['calmEnabled'], (data) => {
  if (data.calmEnabled) {
    setBadgeActive();
  }
});
