'use strict';

/**
 * Neurodivergent Reader — Service Worker (Background)
 *
 * Three agent roles live here:
 *   SettingsAgent     — defaults, onInstalled init/migration, schema validation
 *   OrchestratorAgent — routes messages from popup, updates badge
 *   InjectionAgent    — chrome.scripting.executeScript / insertCSS calls
 *
 * All state lives in chrome.storage.local. Service worker variables are transient.
 */

// ── SettingsAgent ─────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  _version: 1,
  enabled: true,

  fontOverride: {
    enabled: false,
    family: 'OpenDyslexic',  // 'OpenDyslexic' | 'Lexend' | 'Atkinson Hyperlegible' | 'system'
    size: 18,
    lineHeight: 1.8,
    letterSpacing: 0.05,
    wordSpacing: 0.1,
  },

  ruler: {
    enabled: false,
    height: 80,
    opacity: 0.5,
    color: '#000000',
    smoothing: 0.15,
  },

  focus: {
    enabled: false,
    dimLevel: 0.7,
    lockOnClick: true,
  },

  distractions: {
    enabled: false,
    hideSidebars: true,
    hideAds: true,
    hideCookieBanners: true,
    hideFloating: true,
  },

  disabledSites: [],
};

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(target)) {
    if (key in source) {
      if (
        typeof target[key] === 'object' &&
        target[key] !== null &&
        !Array.isArray(target[key]) &&
        typeof source[key] === 'object' &&
        source[key] !== null &&
        !Array.isArray(source[key])
      ) {
        result[key] = deepMerge(target[key], source[key]);
      } else {
        result[key] = source[key];
      }
    }
  }
  return result;
}

async function getSettings() {
  const { settings = {} } = await chrome.storage.local.get(['settings']);
  return deepMerge(DEFAULT_SETTINGS, settings);
}

async function saveSettings(settings) {
  await chrome.storage.local.set({ settings });
}

// Init defaults on install, merge on update
chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    await saveSettings({ ...DEFAULT_SETTINGS });
  } else if (reason === 'update') {
    const current = await getSettings();
    if (current._version < DEFAULT_SETTINGS._version) {
      // Future migration logic goes here
    }
    await saveSettings(current);
  }

  chrome.action.setBadgeBackgroundColor({ color: '#E8457C' });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.action.setBadgeBackgroundColor({ color: '#E8457C' });
});

// ── InjectionAgent ────────────────────────────────────────────────────────────

// Track which tabs have been injected (transient — lost on SW restart, re-inject on demand)
const injectedTabs = new Set();

async function injectContentScripts(tabId) {
  if (injectedTabs.has(tabId)) return;

  try {
    // Inject CSS files first
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ['styles/distraction-rules.css', 'styles/focus-mode.css'],
    });

    // Inject JS modules in order: message-bus → agents → bootstrap
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [
        'lib/browser-polyfill.min.js',
        'content/message-bus.js',
        'content/agents/StyleAgent.js',
        'content/agents/RulerAgent.js',
        'content/agents/FocusAgent.js',
        'content/agents/DistractionAgent.js',
        'content/agents/TelemetryAgent.js',
        'content/agents/ContentOrchestrator.js',
        'content/bootstrap.js',
      ],
    });

    injectedTabs.add(tabId);
  } catch (err) {
    // Tab may not be injectable (chrome://, edge://, etc.)
    console.warn('[NR] Injection failed for tab', tabId, err.message);
  }
}

// Clean up when tabs close
chrome.tabs.onRemoved.addListener((tabId) => {
  injectedTabs.delete(tabId);
});

// ── OrchestratorAgent ─────────────────────────────────────────────────────────

// Update badge to reflect enabled state
async function updateBadge(enabled) {
  const text = enabled ? 'ON' : '';
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    chrome.action.setBadgeText({ text, tabId: tab.id }).catch(() => {});
  }
}

// Listen for settings changes to update badge
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (!changes.settings) return;

  const newSettings = changes.settings.newValue;
  if (newSettings && 'enabled' in newSettings) {
    updateBadge(newSettings.enabled);
  }
});

// Message handler — popup and settings page communicate through here
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  handleMessage(msg, sender)
    .then(sendResponse)
    .catch((err) => sendResponse({ error: err.message }));
  return true;
});

async function handleMessage(msg, sender) {
  switch (msg.type) {
    case 'GET_SETTINGS': {
      return await getSettings();
    }

    case 'UPDATE_SETTINGS': {
      const current = await getSettings();
      const updated = deepMerge(current, msg.changes);
      await saveSettings(updated);
      return { ok: true, settings: updated };
    }

    case 'INJECT_TAB': {
      const tabId = msg.tabId;
      if (!tabId) return { error: 'No tabId provided' };
      await injectContentScripts(tabId);
      return { ok: true };
    }

    case 'IS_INJECTED': {
      return { injected: injectedTabs.has(msg.tabId) };
    }

    default:
      return { error: 'Unknown message type: ' + msg.type };
  }
}
