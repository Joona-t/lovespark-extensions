'use strict';

// ── Theme ───────────────────────────────────────────────────────────────────────
LoveSparkTheme.init();

// ── Settings ────────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  _version: 2, enabled: true, activePreset: 'custom',
  typography: { enabled: false, family: 'OpenDyslexic', size: 18, lineHeight: 1.8, letterSpacing: 0.05, wordSpacing: 0.1, weight: 'normal' },
  overlay: { enabled: false, tintColor: '#FDCFE1', tintOpacity: 0.15, brightness: 1.0, contrast: 1.0, temperature: 0, colorFilter: 'none' },
  ruler: { enabled: false, height: 80, opacity: 0.5, color: '#000000' },
  bionic: { enabled: false, intensity: 2 },
  focus: { enabled: false, dimLevel: 0.7, lockOnClick: true },
  sensory: { enabled: false, freezeAnimations: true, hideGifs: true, reduceMotion: true, pauseAutoplay: true, largeCursor: false },
  distractions: { enabled: false, hideSidebars: true, hideAds: true, hideCookieBanners: true, hideFloating: true, hideComments: false, hideSocial: false },
  tts: { enabled: false, speed: 1.0, voice: '', highlightMode: 'sentence' },
  writing: { enabled: false, fontInForms: true, spacingInForms: true },
  readingMode: { enabled: false, maxWidth: 680, bgColor: '#FFF8F0' },
};

function deepMerge(target, source) {
  if (!source || typeof source !== 'object') return { ...target };
  const result = { ...target };
  for (const key of Object.keys(target)) {
    if (!(key in source)) continue;
    if (typeof target[key] === 'object' && target[key] !== null && !Array.isArray(target[key]) &&
        typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
      result[key] = deepMerge(target[key], source[key]);
    } else {
      result[key] = source[key];
    }
  }
  return result;
}

const enabledToggle = document.getElementById('toggle-enabled');
const disabledList = document.getElementById('disabled-sites-list');
const noDisabledHint = document.getElementById('no-disabled-hint');

let globalSettings = {};
let disabledSites = [];

async function init() {
  const storage = await chrome.storage.local.get(['globalSettings', 'disabledSites']);
  globalSettings = deepMerge(DEFAULT_SETTINGS, storage.globalSettings || {});
  disabledSites = storage.disabledSites || [];

  enabledToggle.checked = globalSettings.enabled;
  renderDisabledSites();

  // Version
  const manifest = chrome.runtime.getManifest();
  document.getElementById('version').textContent = manifest.version;
}

function renderDisabledSites() {
  disabledList.textContent = '';
  noDisabledHint.style.display = disabledSites.length === 0 ? '' : 'none';

  for (const site of disabledSites) {
    const item = document.createElement('div');
    item.className = 'site-item';

    const label = document.createElement('span');
    label.textContent = site;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'site-remove';
    removeBtn.textContent = '\u2715';
    removeBtn.title = 'Remove';
    removeBtn.addEventListener('click', () => {
      disabledSites = disabledSites.filter(s => s !== site);
      chrome.storage.local.set({ disabledSites });
      renderDisabledSites();
    });

    item.appendChild(label);
    item.appendChild(removeBtn);
    disabledList.appendChild(item);
  }
}

// ── Master toggle ───────────────────────────────────────────────────────────────

enabledToggle.addEventListener('change', () => {
  globalSettings.enabled = enabledToggle.checked;
  chrome.storage.local.set({ globalSettings });
});

// ── Export ───────────────────────────────────────────────────────────────────────

document.getElementById('export-btn').addEventListener('click', async () => {
  const storage = await chrome.storage.local.get(['globalSettings', 'siteSettings', 'disabledSites']);
  const blob = new Blob([JSON.stringify(storage, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'cozy-toolkit-settings.json';
  a.click();
  URL.revokeObjectURL(url);
});

// ── Import ──────────────────────────────────────────────────────────────────────

const importFile = document.getElementById('import-file');

document.getElementById('import-btn').addEventListener('click', () => {
  importFile.click();
});

importFile.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);

    if (data.globalSettings) {
      const merged = deepMerge(DEFAULT_SETTINGS, data.globalSettings);
      await chrome.storage.local.set({
        globalSettings: merged,
        siteSettings: data.siteSettings || {},
        disabledSites: data.disabledSites || [],
      });
      globalSettings = merged;
      disabledSites = data.disabledSites || [];
      enabledToggle.checked = globalSettings.enabled;
      renderDisabledSites();
    }
  } catch (err) {
    console.error('[Cozy] Import failed:', err);
  }

  importFile.value = '';
});

// ── Reset ───────────────────────────────────────────────────────────────────────

document.getElementById('reset-btn').addEventListener('click', async () => {
  if (!confirm('Reset all Cozy settings to defaults? This cannot be undone.')) return;

  await chrome.storage.local.set({
    globalSettings: { ...DEFAULT_SETTINGS },
    siteSettings: {},
    disabledSites: [],
  });
  globalSettings = { ...DEFAULT_SETTINGS };
  disabledSites = [];
  enabledToggle.checked = true;
  renderDisabledSites();
});

// ── Storage listener ────────────────────────────────────────────────────────────

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.globalSettings) {
    globalSettings = deepMerge(DEFAULT_SETTINGS, changes.globalSettings.newValue || {});
    enabledToggle.checked = globalSettings.enabled;
  }
  if (changes.disabledSites) {
    disabledSites = changes.disabledSites.newValue || [];
    renderDisabledSites();
  }
});

init();

document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
