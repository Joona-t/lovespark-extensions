// LoveSpark Reader — background.js (Service Worker)
'use strict';

// ── Constants ──────────────────────────────────────────────────────────────

const MODES       = ['sakura', 'hotpink', 'starlight'];
const BADGE_ICON  = { sakura: '🌸', hotpink: '💖', starlight: '✨' };

// Hostnames mapped to their site-specific CSS override file
const SITE_CSS = {
  'www.youtube.com':   'filters/youtube.css',
  'youtube.com':       'filters/youtube.css',
  'm.youtube.com':     'filters/youtube.css',
  'www.google.com':    'filters/google.css',
  'mail.google.com':   'filters/google.css',
  'drive.google.com':  'filters/google.css',
  'docs.google.com':   'filters/google.css',
  'www.reddit.com':    'filters/reddit.css',
  'old.reddit.com':    'filters/reddit.css',
  'www.twitter.com':   'filters/twitter.css',
  'twitter.com':       'filters/twitter.css',
  'x.com':             'filters/twitter.css',
  'github.com':        'filters/github.css',
};

const BASE_CSS_FILES = ['filters/base-filter.css', 'filters/overrides.css'];

// ── Storage helpers ────────────────────────────────────────────────────────

const DEFAULT_STATE = {
  enabled:       true,
  mode:          'sakura',
  disabledSites: [],
};

async function getState() {
  const data = await chrome.storage.local.get(Object.keys(DEFAULT_STATE));
  return { ...DEFAULT_STATE, ...data };
}

async function setState(patch) {
  await chrome.storage.local.set(patch);
}

// ── URL guards ─────────────────────────────────────────────────────────────

function isInjectable(url) {
  if (!url) return false;
  try {
    const { protocol } = new URL(url);
    return protocol === 'http:' || protocol === 'https:';
  } catch {
    return false;
  }
}

function getHostname(url) {
  try { return new URL(url).hostname; } catch { return ''; }
}

// ── Badge ──────────────────────────────────────────────────────────────────

async function updateBadge(state) {
  const s = state || await getState();
  if (!s.enabled) {
    chrome.action.setBadgeText({ text: '' });
    chrome.action.setBadgeBackgroundColor({ color: '#555555' });
  } else {
    chrome.action.setBadgeText({ text: BADGE_ICON[s.mode] || '' });
    chrome.action.setBadgeBackgroundColor({ color: '#FF69B4' });
  }
}

// ── Injection ──────────────────────────────────────────────────────────────

async function injectIntoTab(tabId, tabUrl) {
  if (!isInjectable(tabUrl)) return;

  const hostname = getHostname(tabUrl);

  // 1. Inject base CSS (all three modes live here; class on <html> activates one)
  const cssFiles = [...BASE_CSS_FILES];
  const siteFile = SITE_CSS[hostname];
  if (siteFile) cssFiles.push(siteFile);

  try {
    await chrome.scripting.insertCSS({ target: { tabId }, files: cssFiles });
  } catch (_) {
    return; // Tab not ready / restricted page
  }

  // 2. Inject content.js (sets class on <html>, listens for messages)
  try {
    await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
  } catch (_) {}
}

// ── Message from content.js / popup ───────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    const state = await getState();

    switch (message.action) {

      case 'getState': {
        sendResponse(state);
        break;
      }

      case 'setMode': {
        if (!MODES.includes(message.mode)) { sendResponse({ ok: false }); break; }
        await setState({ mode: message.mode, enabled: true });
        const newState = await getState();
        await updateBadge(newState);
        // Push to all injectable tabs
        await broadcastToTabs({ action: 'apply', mode: message.mode });
        sendResponse({ ok: true });
        break;
      }

      case 'setEnabled': {
        await setState({ enabled: message.enabled });
        const newState = await getState();
        await updateBadge(newState);
        if (message.enabled) {
          await broadcastToTabs({ action: 'apply', mode: newState.mode });
        } else {
          await broadcastToTabs({ action: 'remove' });
        }
        sendResponse({ ok: true });
        break;
      }

      case 'toggleSite': {
        // Add or remove hostname from disabledSites
        const sites = new Set(state.disabledSites || []);
        const host  = message.hostname;
        if (sites.has(host)) {
          sites.delete(host);
        } else {
          sites.add(host);
        }
        await setState({ disabledSites: [...sites] });
        // Tell the requesting tab to apply or remove
        if (sender.tab?.id) {
          if (sites.has(host)) {
            chrome.tabs.sendMessage(sender.tab.id, { action: 'remove' }).catch(() => {});
          } else if (state.enabled) {
            chrome.tabs.sendMessage(sender.tab.id, { action: 'apply', mode: state.mode }).catch(() => {});
          }
        }
        sendResponse({ disabled: sites.has(host) });
        break;
      }

      default:
        sendResponse({ ok: false, error: 'Unknown action' });
    }
  })();
  return true;
});

// ── Broadcast to all open tabs ─────────────────────────────────────────────

async function broadcastToTabs(message) {
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    if (isInjectable(tab.url)) {
      chrome.tabs.sendMessage(tab.id, message).catch(() => {});
    }
  }
}

// ── Tab navigation: inject on page load ───────────────────────────────────

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status !== 'complete') return;
  if (!isInjectable(tab.url)) return;
  injectIntoTab(tabId, tab.url);
});

// ── Startup ────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async () => {
  const data = await chrome.storage.local.get(Object.keys(DEFAULT_STATE));
  const merged = { ...DEFAULT_STATE, ...data };
  await chrome.storage.local.set(merged);
  await updateBadge(merged);
});

chrome.runtime.onStartup.addListener(async () => {
  await updateBadge();
});
