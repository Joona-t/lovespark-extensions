'use strict';

/**
 * Popup — reads/writes settings to chrome.storage.sync.
 * Content scripts react via storage.onChanged — no direct message passing needed.
 * Requests injection of content scripts via service worker on first toggle.
 */

const CUTE_MSGS = [
  'Browse in peace! \u{1F495}',
  'You got this! \u{2728}',
  'Looking good, bestie! \u{1F338}',
  'Stay sparkly! \u{1F496}',
  'Reading made cozy! \u{1F31F}',
  'Focus mode: activated! \u{2728}',
];

// Elements
const masterToggle = document.getElementById('master-toggle');
const fontToggle = document.getElementById('font-toggle');
const fontSelect = document.getElementById('font-select');
const fontPickerRow = document.getElementById('font-picker-row');
const rulerToggle = document.getElementById('ruler-toggle');
const focusToggle = document.getElementById('focus-toggle');
const distractionToggle = document.getElementById('distraction-toggle');
const cuteMsgEl = document.getElementById('cute-msg');
const siteDomainEl = document.getElementById('site-domain');
const siteDisableBtn = document.getElementById('site-disable-btn');
const settingsBtn = document.getElementById('settings-btn');
const popupContainer = document.querySelector('.popup-container');

let currentDomain = null;
let settings = null;
let msgIntervalId = null;

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  // Load settings
  const { settings: stored = {} } = await chrome.storage.sync.get('settings');
  settings = mergeDefaults(stored);

  applyToggles(settings);

  // Get current tab domain
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      try {
        currentDomain = new URL(tab.url).hostname.replace(/^www\./, '');
        siteDomainEl.textContent = currentDomain;

        const isDisabled = (settings.disabledSites || []).includes(currentDomain);
        updateSiteBtn(isDisabled);
      } catch (_) { /* non-URL tab (chrome://, etc.) */ }
    }
  } catch (_) {}

  // Disable site button on non-injectable tabs
  if (!currentDomain) {
    siteDisableBtn.disabled = true;
    siteDisableBtn.textContent = 'N/A';
    siteDisableBtn.title = 'Cannot modify this page';
  }

  // Rotate cute messages
  let msgIdx = 0;
  msgIntervalId = setInterval(() => {
    msgIdx = (msgIdx + 1) % CUTE_MSGS.length;
    cuteMsgEl.style.opacity = '0';
    setTimeout(() => {
      cuteMsgEl.textContent = CUTE_MSGS[msgIdx];
      cuteMsgEl.style.opacity = '1';
    }, 200);
  }, 3500);
}

// Clean up interval on popup close
window.addEventListener('beforeunload', () => {
  clearInterval(msgIntervalId);
});

function mergeDefaults(stored) {
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
  return deepMerge(defaults, stored);
}

function deepMerge(target, source) {
  const result = { ...target };
  for (const key of Object.keys(target)) {
    if (key in source) {
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
  }
  return result;
}

function applyToggles(s) {
  masterToggle.checked = s.enabled;
  fontToggle.checked = s.fontOverride.enabled;
  fontSelect.value = s.fontOverride.family || 'OpenDyslexic';
  fontPickerRow.classList.toggle('hidden', !s.fontOverride.enabled);
  rulerToggle.checked = s.ruler.enabled;
  focusToggle.checked = s.focus.enabled;
  distractionToggle.checked = s.distractions.enabled;

  popupContainer.classList.toggle('disabled', !s.enabled);
}

// ── Save + inject ─────────────────────────────────────────────────────────────

let saveTimer = null;
let lastWriteTime = 0;
const MIN_WRITE_GAP = 500;

function saveSettings() {
  clearTimeout(saveTimer);
  const now = Date.now();
  const delay = Math.max(200, MIN_WRITE_GAP - (now - lastWriteTime));
  saveTimer = setTimeout(async () => {
    lastWriteTime = Date.now();
    await chrome.storage.sync.set({ settings });
    await ensureInjected();
  }, delay);
}

async function ensureInjected() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) return;

    const resp = await chrome.runtime.sendMessage({ type: 'IS_INJECTED', tabId: tab.id });
    if (!resp?.injected) {
      await chrome.runtime.sendMessage({ type: 'INJECT_TAB', tabId: tab.id });
    }
  } catch (_) {}
}

// ── Event handlers ────────────────────────────────────────────────────────────

masterToggle.addEventListener('change', () => {
  settings.enabled = masterToggle.checked;
  popupContainer.classList.toggle('disabled', !settings.enabled);
  saveSettings();
});

fontToggle.addEventListener('change', () => {
  settings.fontOverride.enabled = fontToggle.checked;
  fontPickerRow.classList.toggle('hidden', !fontToggle.checked);
  saveSettings();
});

fontSelect.addEventListener('change', () => {
  settings.fontOverride.family = fontSelect.value;
  saveSettings();
});

rulerToggle.addEventListener('change', () => {
  settings.ruler.enabled = rulerToggle.checked;
  saveSettings();
});

focusToggle.addEventListener('change', () => {
  settings.focus.enabled = focusToggle.checked;
  saveSettings();
});

distractionToggle.addEventListener('change', () => {
  settings.distractions.enabled = distractionToggle.checked;
  saveSettings();
});

siteDisableBtn.addEventListener('click', () => {
  if (!currentDomain) return;

  const list = settings.disabledSites || [];
  const idx = list.indexOf(currentDomain);

  if (idx === -1) {
    list.push(currentDomain);
    updateSiteBtn(true);
  } else {
    list.splice(idx, 1);
    updateSiteBtn(false);
  }

  settings.disabledSites = list;
  saveSettings();
});

function updateSiteBtn(isDisabled) {
  if (isDisabled) {
    siteDisableBtn.textContent = '\u2714 Enable here';
    siteDisableBtn.classList.add('active');
  } else {
    siteDisableBtn.textContent = '\u2716 Disable here';
    siteDisableBtn.classList.remove('active');
  }
}

settingsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage();
});

// ── Storage change listener (sync with other tabs/windows) ────────────────────

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync' || !changes.settings) return;
  settings = mergeDefaults(changes.settings.newValue || {});
  applyToggles(settings);
});

// Start
init();
