'use strict';

/**
 * ContentOrchestrator — Coordinates all content-side agents.
 *
 * Responsibilities:
 *   - Reads settings from chrome.storage.sync on init
 *   - Listens to chrome.storage.onChanged for live updates
 *   - Dispatches SETTINGS_UPDATED to all agents via MessageBus
 *   - Handles per-domain disable list
 *   - Owns no DOM — purely coordination
 *
 * Pattern mirrors lovespark-reader/content.js but delegates to agents
 * instead of toggling CSS classes directly.
 */

class ContentOrchestrator {
  constructor(bus) {
    this._bus = bus;
    this._agents = [];
    this._settings = null;
    this._hostname = location.hostname.replace(/^www\./, '');

    this._onStorageChanged = this._handleStorageChanged.bind(this);
    this._onMessage = this._handleMessage.bind(this);
  }

  registerAgent(agent) {
    this._agents.push(agent);
  }

  async init() {
    // Initialize all agents
    for (const agent of this._agents) {
      agent.init();
    }

    // Handle FEATURE_TOGGLED from agents (Escape key, etc.) — persist to storage
    this._bus.on(MSG.FEATURE_TOGGLED, (data) => this._handleFeatureToggled(data));

    // Read current settings
    const storage = chrome.storage || (typeof browser !== 'undefined' && browser.storage);
    if (!storage) {
      console.warn('[NR] No storage API available');
      return;
    }

    try {
      const { settings = {} } = await storage.sync.get('settings');
      this._settings = this._mergeDefaults(settings);
      this._applySettings();
    } catch (err) {
      console.warn('[NR] Failed to read settings:', err.message);
    }

    // Listen for live updates
    storage.onChanged.addListener(this._onStorageChanged);

    // Listen for messages from popup (hostname requests, etc.)
    chrome.runtime.onMessage.addListener(this._onMessage);
  }

  _handleFeatureToggled(data) {
    if (!this._settings || !data || !data.feature) return;

    const { feature, enabled } = data;
    const map = { ruler: 'ruler', focus: 'focus', font: 'fontOverride', distractions: 'distractions' };
    const key = map[feature];
    if (!key || !this._settings[key]) return;

    this._settings[key].enabled = !!enabled;
    this._applySettings();

    // Persist to storage
    const storage = chrome.storage || (typeof browser !== 'undefined' && browser.storage);
    if (storage) {
      storage.sync.set({ settings: this._settings }).catch(() => {});
    }
  }

  _mergeDefaults(stored) {
    // Inline defaults matching service-worker.js SettingsAgent
    const defaults = {
      _version: 1,
      enabled: true,
      fontOverride: {
        enabled: false, family: 'OpenDyslexic', size: 18,
        lineHeight: 1.8, letterSpacing: 0.05, wordSpacing: 0.1,
      },
      ruler: { enabled: false, height: 80, opacity: 0.5, color: '#000000', smoothing: 0.15 },
      focus: { enabled: false, dimLevel: 0.7, lockOnClick: true },
      distractions: {
        enabled: false, hideSidebars: true, hideAds: true,
        hideCookieBanners: true, hideFloating: true,
      },
      disabledSites: [],
    };

    return this._deepMerge(defaults, stored);
  }

  _deepMerge(target, source) {
    const result = { ...target };
    for (const key of Object.keys(target)) {
      if (key in source) {
        if (
          typeof target[key] === 'object' && target[key] !== null &&
          !Array.isArray(target[key]) &&
          typeof source[key] === 'object' && source[key] !== null &&
          !Array.isArray(source[key])
        ) {
          result[key] = this._deepMerge(target[key], source[key]);
        } else {
          result[key] = source[key];
        }
      }
    }
    return result;
  }

  _handleStorageChanged(changes, area) {
    if (area !== 'sync') return;
    if (!changes.settings) return;

    this._settings = this._mergeDefaults(changes.settings.newValue || {});
    this._applySettings();
  }

  _handleMessage(message, sender, sendResponse) {
    if (message.action === 'getHostname') {
      sendResponse({ hostname: this._hostname });
      return;
    }
    if (message.action === 'ping') {
      sendResponse({ alive: true });
      return;
    }
  }

  _applySettings() {
    if (!this._settings) return;

    // Check per-domain disable list
    const disabled = (this._settings.disabledSites || []).includes(this._hostname);

    const effective = (disabled || !this._settings.enabled)
      ? { ...this._settings, enabled: false }
      : this._settings;
    this._bus.emit(MSG.SETTINGS_UPDATED, effective);
  }

  destroy() {
    this._bus.emit(MSG.DESTROY_ALL);

    const storage = chrome.storage || (typeof browser !== 'undefined' && browser.storage);
    if (storage) {
      storage.onChanged.removeListener(this._onStorageChanged);
    }
    chrome.runtime.onMessage.removeListener(this._onMessage);
  }
}
