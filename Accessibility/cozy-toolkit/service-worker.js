'use strict';

// ── DEFAULT_SETTINGS (source of truth) ─────────────────────────────────────────

const DEFAULT_SETTINGS = {
  _version: 2,
  enabled: true,
  activePreset: 'custom',

  typography: {
    enabled: false, family: 'OpenDyslexic', size: 18,
    lineHeight: 1.8, letterSpacing: 0.05, wordSpacing: 0.1, weight: 'normal',
  },
  overlay: {
    enabled: false, tintColor: '#FDCFE1', tintOpacity: 0.15,
    brightness: 1.0, contrast: 1.0, temperature: 0, colorFilter: 'none',
  },
  ruler:        { enabled: false, height: 80, opacity: 0.5, color: '#000000' },
  bionic:       { enabled: false, intensity: 2 },
  focus:        { enabled: false, dimLevel: 0.7, lockOnClick: true },
  sensory: {
    enabled: false, freezeAnimations: true, hideGifs: true,
    reduceMotion: true, pauseAutoplay: true, largeCursor: false,
  },
  distractions: {
    enabled: false, hideSidebars: true, hideAds: true,
    hideCookieBanners: true, hideFloating: true, hideComments: false, hideSocial: false,
  },
  tts:          { enabled: false, speed: 1.0, voice: '', highlightMode: 'sentence' },
  writing:      { enabled: false, fontInForms: true, spacingInForms: true },
  readingMode:  { enabled: false, maxWidth: 680, bgColor: '#FFF8F0' },
};

const PRESETS = {
  dyslexia: {
    typography: { enabled: true, family: 'OpenDyslexic', size: 18, lineHeight: 1.8, letterSpacing: 0.05, wordSpacing: 0.15, weight: 'normal' },
    ruler: { enabled: true, height: 80, opacity: 0.4, color: '#000000' },
    overlay: { enabled: true, tintColor: '#FFF5E6', tintOpacity: 0.1, brightness: 1.0, contrast: 1.0, temperature: 0, colorFilter: 'none' },
  },
  adhd: {
    focus: { enabled: true, dimLevel: 0.6, lockOnClick: true },
    distractions: { enabled: true, hideSidebars: true, hideAds: true, hideCookieBanners: true, hideFloating: true, hideComments: true, hideSocial: false },
    sensory: { enabled: true, freezeAnimations: true, hideGifs: false, reduceMotion: false, pauseAutoplay: true, largeCursor: false },
    bionic: { enabled: true, intensity: 2 },
  },
  sensory: {
    sensory: { enabled: true, freezeAnimations: true, hideGifs: true, reduceMotion: true, pauseAutoplay: true, largeCursor: false },
    overlay: { enabled: true, tintColor: '#E8D5C4', tintOpacity: 0.15, brightness: 1.0, contrast: 1.0, temperature: 0, colorFilter: 'none' },
    distractions: { enabled: true, hideSidebars: false, hideAds: false, hideCookieBanners: false, hideFloating: true, hideComments: false, hideSocial: true },
  },
  lowvision: {
    typography: { enabled: true, family: 'Atkinson Hyperlegible', size: 22, lineHeight: 2.0, letterSpacing: 0.08, wordSpacing: 0.2, weight: 'normal' },
    overlay: { enabled: true, tintColor: '#FDCFE1', tintOpacity: 0, brightness: 1.1, contrast: 1.3, temperature: 0, colorFilter: 'none' },
    sensory: { enabled: true, freezeAnimations: false, hideGifs: false, reduceMotion: false, pauseAutoplay: false, largeCursor: true },
  },
};

// ── Utility ────────────────────────────────────────────────────────────────────

function deepMerge(target, source) {
  if (!source || typeof source !== 'object') return { ...target };
  const result = { ...target };
  for (const key of Object.keys(target)) {
    if (!(key in source)) continue;
    if (
      typeof target[key] === 'object' && target[key] !== null &&
      !Array.isArray(target[key]) &&
      typeof source[key] === 'object' && source[key] !== null &&
      !Array.isArray(source[key])
    ) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

// ── SettingsAgent ──────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason === 'install') {
    await chrome.storage.local.set({
      globalSettings: { ...DEFAULT_SETTINGS },
      siteSettings: {},
      disabledSites: [],
      theme: 'retro',
    });
  } else if (reason === 'update') {
    const { globalSettings = {} } = await chrome.storage.local.get('globalSettings');
    const merged = deepMerge(DEFAULT_SETTINGS, globalSettings);
    await chrome.storage.local.set({ globalSettings: merged });
  }
  chrome.action.setBadgeBackgroundColor({ color: '#E8457C' });
});

chrome.runtime.onStartup.addListener(() => {
  chrome.action.setBadgeBackgroundColor({ color: '#E8457C' });
});

// ── InjectionAgent ─────────────────────────────────────────────────────────────

const injectedTabs = new Set();

async function injectContentScripts(tabId) {
  if (injectedTabs.has(tabId)) return;

  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: [
        'lib/browser-polyfill.min.js',
        'content/message-bus.js',
        'content/agents/TypographyAgent.js',
        'content/agents/OverlayAgent.js',
        'content/agents/RulerAgent.js',
        'content/agents/BionicAgent.js',
        'content/agents/FocusAgent.js',
        'content/agents/SensoryAgent.js',
        'content/agents/DistractionAgent.js',
        'content/agents/TTSAgent.js',
        'content/agents/WritingAgent.js',
        'content/agents/ReadingModeAgent.js',
        'content/agents/TelemetryAgent.js',
        'content/agents/ContentOrchestrator.js',
        'content/bootstrap.js',
      ],
    });
    injectedTabs.add(tabId);
  } catch (err) {
    console.warn('[Cozy] Injection failed for tab', tabId, err.message);
  }
}

chrome.tabs.onRemoved.addListener((tabId) => injectedTabs.delete(tabId));

chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    injectedTabs.delete(tabId);
    return;
  }

  if (changeInfo.status !== 'complete') return;
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) return;

  try {
    const { globalSettings, disabledSites } = await chrome.storage.local.get(['globalSettings', 'disabledSites']);
    if (!globalSettings?.enabled) return;

    const hostname = new URL(tab.url).hostname.replace(/^www\./, '');
    if ((disabledSites || []).includes(hostname)) return;

    injectContentScripts(tabId);
  } catch (err) { console.warn('[cozy-toolkit] unknown:', err); }
});

// ── OrchestratorAgent ──────────────────────────────────────────────────────────

async function updateBadge(enabled) {
  const text = enabled ? 'ON' : '';
  const tabs = await chrome.tabs.query({});
  for (const tab of tabs) {
    chrome.action.setBadgeText({ text, tabId: tab.id }).catch(() => {});
  }
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (!changes.globalSettings) return;

  const newSettings = changes.globalSettings.newValue;
  if (newSettings && 'enabled' in newSettings) {
    updateBadge(newSettings.enabled);
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  handleMessage(msg, sender)
    .then(sendResponse)
    .catch((err) => sendResponse({ error: err.message }));
  return true;
});

async function handleMessage(msg) {
  switch (msg.type) {
    case 'GET_SETTINGS': {
      const { globalSettings = {}, siteSettings = {}, disabledSites = [] } =
        await chrome.storage.local.get(['globalSettings', 'siteSettings', 'disabledSites']);
      return { globalSettings: deepMerge(DEFAULT_SETTINGS, globalSettings), siteSettings, disabledSites };
    }

    case 'UPDATE_GLOBAL': {
      const { globalSettings: current = {} } = await chrome.storage.local.get('globalSettings');
      const updated = deepMerge(deepMerge(DEFAULT_SETTINGS, current), msg.changes);
      await chrome.storage.local.set({ globalSettings: updated });
      return { ok: true, globalSettings: updated };
    }

    case 'UPDATE_SITE': {
      const { siteSettings = {} } = await chrome.storage.local.get('siteSettings');
      if (msg.overrides && Object.keys(msg.overrides).length > 0) {
        siteSettings[msg.hostname] = msg.overrides;
      } else {
        delete siteSettings[msg.hostname];
      }
      await chrome.storage.local.set({ siteSettings });
      return { ok: true };
    }

    case 'APPLY_PRESET': {
      const preset = PRESETS[msg.preset];
      if (!preset) return { error: 'Unknown preset: ' + msg.preset };
      const { globalSettings: current = {} } = await chrome.storage.local.get('globalSettings');
      const base = deepMerge(DEFAULT_SETTINGS, current);
      const updated = deepMerge(base, preset);
      updated.activePreset = msg.preset;
      await chrome.storage.local.set({ globalSettings: updated });
      return { ok: true, globalSettings: updated };
    }

    case 'INJECT_TAB': {
      if (!msg.tabId) return { error: 'No tabId provided' };
      await injectContentScripts(msg.tabId);
      return { ok: true };
    }

    case 'IS_INJECTED': {
      return { injected: injectedTabs.has(msg.tabId) };
    }

    default:
      return { error: 'Unknown message type: ' + msg.type };
  }
}
