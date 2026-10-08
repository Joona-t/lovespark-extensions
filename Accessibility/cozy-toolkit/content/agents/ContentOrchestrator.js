'use strict';

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

class ContentOrchestrator {
  constructor(bus) {
    this._bus = bus;
    this._agents = [];
    this._settings = null;
    this._hostname = location.hostname.replace(/^www\./, '');
    this._rawGlobal = {};
    this._rawSite = {};
    this._disabledSites = [];
    this._onStorageChanged = this._handleStorageChanged.bind(this);
    this._onMessage = this._handleMessage.bind(this);
  }

  registerAgent(agent) {
    this._agents.push(agent);
  }

  async init() {
    for (const agent of this._agents) {
      agent.init();
    }

    this._bus.on(MSG.FEATURE_TOGGLED, (data) => this._handleFeatureToggled(data));

    try {
      const storage = await chrome.storage.local.get([
        'globalSettings', 'siteSettings', 'disabledSites'
      ]);
      this._rawGlobal = storage.globalSettings || {};
      this._rawSite = (storage.siteSettings || {})[this._hostname] || {};
      this._disabledSites = storage.disabledSites || [];

      this._settings = this._resolve();
      this._applyToAllAgents();
    } catch (err) {
      console.warn('[Cozy] Failed to read settings:', err.message);
    }

    chrome.storage.onChanged.addListener(this._onStorageChanged);
    chrome.runtime.onMessage.addListener(this._onMessage);
  }

  _resolve() {
    const merged = deepMerge(DEFAULT_SETTINGS, this._rawGlobal);
    return deepMerge(merged, this._rawSite);
  }

  _applyToAllAgents() {
    if (!this._settings) return;

    const disabled = this._disabledSites.includes(this._hostname);
    const effective = (disabled || !this._settings.enabled)
      ? { ...this._settings, enabled: false }
      : this._settings;

    this._bus.emit(MSG.SETTINGS_UPDATED, effective);

    for (const agent of this._agents) {
      agent.apply(effective);
    }
  }

  _handleStorageChanged(changes, area) {
    if (area !== 'local') return;
    let needsReapply = false;

    if (changes.globalSettings) {
      this._rawGlobal = changes.globalSettings.newValue || {};
      needsReapply = true;
    }
    if (changes.siteSettings) {
      const allSites = changes.siteSettings.newValue || {};
      this._rawSite = allSites[this._hostname] || {};
      needsReapply = true;
    }
    if (changes.disabledSites) {
      this._disabledSites = changes.disabledSites.newValue || [];
      needsReapply = true;
    }

    if (needsReapply) {
      this._settings = this._resolve();
      this._applyToAllAgents();
    }
  }

  _handleFeatureToggled(data) {
    if (!data || !data.feature) return;
    const { feature, enabled } = data;

    const featureMap = {
      ruler: 'ruler', focus: 'focus', typography: 'typography',
      overlay: 'overlay', bionic: 'bionic', sensory: 'sensory',
      distractions: 'distractions', tts: 'tts', writing: 'writing',
      readingMode: 'readingMode',
    };
    const key = featureMap[feature];
    if (!key || !this._settings[key]) return;

    this._settings[key].enabled = !!enabled;
    this._applyToAllAgents();

    const globalCopy = deepMerge(DEFAULT_SETTINGS, this._rawGlobal);
    if (globalCopy[key]) {
      globalCopy[key].enabled = !!enabled;
    }
    chrome.storage.local.set({ globalSettings: globalCopy }).catch(() => {});
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

  destroy() {
    this._bus.emit(MSG.DESTROY_ALL);
    chrome.storage.onChanged.removeListener(this._onStorageChanged);
    chrome.runtime.onMessage.removeListener(this._onMessage);
  }
}
