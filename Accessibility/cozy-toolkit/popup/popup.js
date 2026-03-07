'use strict';

// Theme dropdown
const THEMES = ['retro', 'dark', 'beige', 'slate'];
const THEME_NAMES = { retro: 'Retro Pink', dark: 'Dark', beige: 'Beige', slate: 'Slate' };
function applyTheme(t) {
  THEMES.forEach(n => document.body.classList.remove('theme-' + n));
  document.body.classList.add('theme-' + t);
  const label = document.getElementById('themeLabel');
  if (label) label.textContent = THEME_NAMES[t] || t;
  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.theme === t);
  });
}
(function initThemeDropdown() {
  const toggle = document.getElementById('themeToggle');
  const menu = document.getElementById('themeMenu');
  if (toggle && menu) {
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
    menu.addEventListener('click', (e) => {
      const opt = e.target.closest('.theme-option');
      if (!opt) return;
      const theme = opt.dataset.theme;
      applyTheme(theme);
      chrome.storage.local.set({ theme });
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
    document.addEventListener('click', () => {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
    toggle.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        menu.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }
    });
  }
  chrome.storage.local.get(['theme', 'darkMode'], ({ theme, darkMode }) => {
    if (!theme && darkMode) theme = 'dark';
    applyTheme(theme || 'retro');
  });
})();

// ── Constants ───────────────────────────────────────────────────────────────────

const DEFAULT_SETTINGS = {
  _version: 2,
  enabled: true,
  activePreset: 'custom',
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

const CUTE_MSGS = [
  'The internet, made cozy \u{1F495}',
  'You got this! \u{2728}',
  'Looking good, bestie! \u{1F338}',
  'Stay sparkly! \u{1F496}',
  'Reading made cozy! \u{1F31F}',
  'Focus mode: activated! \u{2728}',
];

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

// ── Element references ──────────────────────────────────────────────────────────

const $ = (id) => document.getElementById(id);
const masterToggle = $('master-toggle');
const cuteMsgEl = $('cute-msg');
const siteDomainEl = $('site-domain');
const siteDisableBtn = $('site-disable-btn');
const popupContainer = document.querySelector('.popup-container');

let currentDomain = null;
let settings = null;
let disabledSites = [];
let siteSettings = {};

// ── Tab switching ───────────────────────────────────────────────────────────────

const tabBtns = Array.from(document.querySelectorAll('.tab-btn'));

function activateTab(btn) {
  tabBtns.forEach(b => {
    b.classList.remove('active');
    b.setAttribute('aria-selected', 'false');
    b.setAttribute('tabindex', '-1');
  });
  document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));

  btn.classList.add('active');
  btn.setAttribute('aria-selected', 'true');
  btn.setAttribute('tabindex', '0');
  btn.focus();
  const panel = document.querySelector(`[data-panel="${btn.dataset.tab}"]`);
  if (panel) panel.classList.add('active');
}

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => activateTab(btn));
  btn.addEventListener('keydown', (e) => {
    const idx = tabBtns.indexOf(btn);
    let next;
    if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
      e.preventDefault();
      next = tabBtns[(idx + 1) % tabBtns.length];
    } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
      e.preventDefault();
      next = tabBtns[(idx - 1 + tabBtns.length) % tabBtns.length];
    } else if (e.key === 'Home') {
      e.preventDefault();
      next = tabBtns[0];
    } else if (e.key === 'End') {
      e.preventDefault();
      next = tabBtns[tabBtns.length - 1];
    }
    if (next) activateTab(next);
  });
});

// ── Sub-control visibility ──────────────────────────────────────────────────────

function syncSubControls() {
  const pairs = [
    ['overlay-toggle', 'overlay-controls'],
    ['bionic-toggle', 'bionic-controls'],
    ['reading-mode-toggle', 'reading-controls'],
    ['font-toggle', 'font-controls'],
    ['writing-toggle', 'writing-controls'],
    ['sensory-toggle', 'sensory-controls'],
    ['focus-toggle', 'focus-controls'],
    ['ruler-toggle', 'ruler-controls'],
    ['distraction-toggle', 'distraction-controls'],
    ['tts-toggle', 'tts-controls'],
  ];
  for (const [toggleId, controlId] of pairs) {
    const toggle = $(toggleId);
    const controls = $(controlId);
    if (toggle && controls) {
      controls.classList.toggle('open', toggle.checked);
    }
  }
}

// ── Init ────────────────────────────────────────────────────────────────────────

async function init() {
  const storage = await chrome.storage.local.get(['globalSettings', 'siteSettings', 'disabledSites']);
  settings = deepMerge(DEFAULT_SETTINGS, storage.globalSettings || {});
  siteSettings = storage.siteSettings || {};
  disabledSites = storage.disabledSites || [];

  applyToUI(settings);

  // Get current tab domain
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab?.url) {
      try {
        currentDomain = new URL(tab.url).hostname.replace(/^www\./, '');
        siteDomainEl.textContent = currentDomain;
        updateSiteBtn(disabledSites.includes(currentDomain));
      } catch (_) {}
    }
  } catch (_) {}

  if (!currentDomain) {
    siteDisableBtn.disabled = true;
    siteDisableBtn.textContent = 'N/A';
  }

  // Populate TTS voices
  populateVoices();
  if (speechSynthesis.onvoiceschanged !== undefined) {
    speechSynthesis.onvoiceschanged = populateVoices;
  }

  // Cute message rotation
  let msgIdx = 0;
  setInterval(() => {
    msgIdx = (msgIdx + 1) % CUTE_MSGS.length;
    cuteMsgEl.style.opacity = '0';
    setTimeout(() => {
      cuteMsgEl.textContent = CUTE_MSGS[msgIdx];
      cuteMsgEl.style.opacity = '1';
    }, 200);
  }, 3500);
}

function populateVoices() {
  const voiceSelect = $('tts-voice');
  const voices = speechSynthesis.getVoices();
  voiceSelect.length = 1; // Keep "Default"
  for (const v of voices) {
    const opt = document.createElement('option');
    opt.value = v.name;
    opt.textContent = `${v.name} (${v.lang})`;
    voiceSelect.appendChild(opt);
  }
  if (settings?.tts?.voice) {
    voiceSelect.value = settings.tts.voice;
  }
}

// ── Apply settings to UI ────────────────────────────────────────────────────────

function applyToUI(s) {
  masterToggle.checked = s.enabled;
  popupContainer.classList.toggle('disabled', !s.enabled);

  // Typography
  $('font-toggle').checked = s.typography.enabled;
  $('font-select').value = s.typography.family;
  $('font-size').value = s.typography.size;
  $('font-size-val').textContent = s.typography.size + 'px';
  $('line-height').value = Math.round(s.typography.lineHeight * 10);
  $('line-height-val').textContent = s.typography.lineHeight.toFixed(1);
  $('letter-spacing').value = Math.round(s.typography.letterSpacing * 100);
  $('word-spacing').value = Math.round(s.typography.wordSpacing * 100);
  $('font-weight').value = s.typography.weight;

  // Overlay
  $('overlay-toggle').checked = s.overlay.enabled;
  $('tint-color').value = s.overlay.tintColor;
  $('tint-opacity').value = Math.round(s.overlay.tintOpacity * 100);
  $('brightness').value = Math.round(s.overlay.brightness * 100);
  $('contrast').value = Math.round(s.overlay.contrast * 100);
  $('temperature').value = Math.round(s.overlay.temperature * 100);
  $('color-filter').value = s.overlay.colorFilter;

  // Ruler
  $('ruler-toggle').checked = s.ruler.enabled;
  $('ruler-height').value = s.ruler.height;
  $('ruler-opacity').value = Math.round(s.ruler.opacity * 100);
  $('ruler-color').value = s.ruler.color;

  // Bionic
  $('bionic-toggle').checked = s.bionic.enabled;
  $('bionic-intensity').value = s.bionic.intensity;

  // Focus
  $('focus-toggle').checked = s.focus.enabled;
  $('dim-level').value = Math.round(s.focus.dimLevel * 100);
  $('lock-on-click').checked = s.focus.lockOnClick;

  // Sensory
  $('sensory-toggle').checked = s.sensory.enabled;
  $('freeze-animations').checked = s.sensory.freezeAnimations;
  $('hide-gifs').checked = s.sensory.hideGifs;
  $('reduce-motion').checked = s.sensory.reduceMotion;
  $('pause-autoplay').checked = s.sensory.pauseAutoplay;
  $('large-cursor').checked = s.sensory.largeCursor;

  // Distractions
  $('distraction-toggle').checked = s.distractions.enabled;
  $('hide-sidebars').checked = s.distractions.hideSidebars;
  $('hide-ads').checked = s.distractions.hideAds;
  $('hide-cookies').checked = s.distractions.hideCookieBanners;
  $('hide-floating').checked = s.distractions.hideFloating;
  $('hide-comments').checked = s.distractions.hideComments;
  $('hide-social').checked = s.distractions.hideSocial;

  // TTS
  $('tts-toggle').checked = s.tts.enabled;
  $('tts-speed').value = Math.round(s.tts.speed * 100);
  $('tts-speed-val').textContent = s.tts.speed.toFixed(1) + 'x';

  // Writing
  $('writing-toggle').checked = s.writing.enabled;
  $('writing-font').checked = s.writing.fontInForms;
  $('writing-spacing').checked = s.writing.spacingInForms;

  // Reading Mode
  $('reading-mode-toggle').checked = s.readingMode.enabled;
  $('reading-width').value = s.readingMode.maxWidth;
  $('reading-bg').value = s.readingMode.bgColor;

  // Preset highlight
  document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.preset === s.activePreset);
  });

  syncSubControls();
}

// ── Read settings from UI ───────────────────────────────────────────────────────

function readFromUI() {
  settings.enabled = masterToggle.checked;

  settings.typography.enabled = $('font-toggle').checked;
  settings.typography.family = $('font-select').value;
  settings.typography.size = parseInt($('font-size').value, 10);
  settings.typography.lineHeight = parseInt($('line-height').value, 10) / 10;
  settings.typography.letterSpacing = parseInt($('letter-spacing').value, 10) / 100;
  settings.typography.wordSpacing = parseInt($('word-spacing').value, 10) / 100;
  settings.typography.weight = $('font-weight').value;

  settings.overlay.enabled = $('overlay-toggle').checked;
  settings.overlay.tintColor = $('tint-color').value;
  settings.overlay.tintOpacity = parseInt($('tint-opacity').value, 10) / 100;
  settings.overlay.brightness = parseInt($('brightness').value, 10) / 100;
  settings.overlay.contrast = parseInt($('contrast').value, 10) / 100;
  settings.overlay.temperature = parseInt($('temperature').value, 10) / 100;
  settings.overlay.colorFilter = $('color-filter').value;

  settings.ruler.enabled = $('ruler-toggle').checked;
  settings.ruler.height = parseInt($('ruler-height').value, 10);
  settings.ruler.opacity = parseInt($('ruler-opacity').value, 10) / 100;
  settings.ruler.color = $('ruler-color').value;

  settings.bionic.enabled = $('bionic-toggle').checked;
  settings.bionic.intensity = parseInt($('bionic-intensity').value, 10);

  settings.focus.enabled = $('focus-toggle').checked;
  settings.focus.dimLevel = parseInt($('dim-level').value, 10) / 100;
  settings.focus.lockOnClick = $('lock-on-click').checked;

  settings.sensory.enabled = $('sensory-toggle').checked;
  settings.sensory.freezeAnimations = $('freeze-animations').checked;
  settings.sensory.hideGifs = $('hide-gifs').checked;
  settings.sensory.reduceMotion = $('reduce-motion').checked;
  settings.sensory.pauseAutoplay = $('pause-autoplay').checked;
  settings.sensory.largeCursor = $('large-cursor').checked;

  settings.distractions.enabled = $('distraction-toggle').checked;
  settings.distractions.hideSidebars = $('hide-sidebars').checked;
  settings.distractions.hideAds = $('hide-ads').checked;
  settings.distractions.hideCookieBanners = $('hide-cookies').checked;
  settings.distractions.hideFloating = $('hide-floating').checked;
  settings.distractions.hideComments = $('hide-comments').checked;
  settings.distractions.hideSocial = $('hide-social').checked;

  settings.tts.enabled = $('tts-toggle').checked;
  settings.tts.speed = parseInt($('tts-speed').value, 10) / 100;
  settings.tts.voice = $('tts-voice').value;

  settings.writing.enabled = $('writing-toggle').checked;
  settings.writing.fontInForms = $('writing-font').checked;
  settings.writing.spacingInForms = $('writing-spacing').checked;

  settings.readingMode.enabled = $('reading-mode-toggle').checked;
  settings.readingMode.maxWidth = parseInt($('reading-width').value, 10);
  settings.readingMode.bgColor = $('reading-bg').value;

  settings.activePreset = 'custom';
}

// ── Save ────────────────────────────────────────────────────────────────────────

let saveTimer = null;
let lastWriteTime = 0;
const MIN_WRITE_GAP = 500;

function saveSettings() {
  clearTimeout(saveTimer);
  const now = Date.now();
  const delay = Math.max(200, MIN_WRITE_GAP - (now - lastWriteTime));
  saveTimer = setTimeout(async () => {
    lastWriteTime = Date.now();
    await chrome.storage.local.set({ globalSettings: settings });
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

// ── Event handler setup ─────────────────────────────────────────────────────────

function onAnyChange() {
  readFromUI();
  syncSubControls();
  saveSettings();
}

// Master toggle
masterToggle.addEventListener('change', () => {
  settings.enabled = masterToggle.checked;
  popupContainer.classList.toggle('disabled', !settings.enabled);
  saveSettings();
});

// All toggle checkboxes (except master)
document.querySelectorAll('.tab-panel input[type="checkbox"]').forEach(cb => {
  cb.addEventListener('change', onAnyChange);
});

// All sliders
document.querySelectorAll('.slider').forEach(slider => {
  slider.addEventListener('input', () => {
    // Update value labels
    if (slider.id === 'font-size') $('font-size-val').textContent = slider.value + 'px';
    if (slider.id === 'line-height') $('line-height-val').textContent = (parseInt(slider.value, 10) / 10).toFixed(1);
    if (slider.id === 'tts-speed') $('tts-speed-val').textContent = (parseInt(slider.value, 10) / 100).toFixed(1) + 'x';
    onAnyChange();
  });
});

// All selects
document.querySelectorAll('.font-select, .color-input').forEach(el => {
  el.addEventListener('change', onAnyChange);
  el.addEventListener('input', onAnyChange);
});

// Presets
document.querySelectorAll('.preset-btn').forEach(btn => {
  btn.addEventListener('click', async () => {
    const preset = btn.dataset.preset;
    const resp = await chrome.runtime.sendMessage({ type: 'APPLY_PRESET', preset });
    if (resp?.globalSettings) {
      settings = deepMerge(DEFAULT_SETTINGS, resp.globalSettings);
      applyToUI(settings);
      await ensureInjected();
    }
  });
});

// Site disable
siteDisableBtn.addEventListener('click', () => {
  if (!currentDomain) return;
  const idx = disabledSites.indexOf(currentDomain);
  if (idx === -1) {
    disabledSites.push(currentDomain);
    updateSiteBtn(true);
  } else {
    disabledSites.splice(idx, 1);
    updateSiteBtn(false);
  }
  chrome.storage.local.set({ disabledSites });
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

// Reset
$('reset-btn').addEventListener('click', async () => {
  settings = { ...DEFAULT_SETTINGS };
  await chrome.storage.local.set({ globalSettings: settings });
  applyToUI(settings);
});

// Settings page
$('settings-btn').addEventListener('click', () => chrome.runtime.openOptionsPage());

// Guide & Bug Report
$('guide-btn').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('guide/guide.html') });
});
$('bug-btn').addEventListener('click', () => {
  chrome.tabs.create({ url: 'mailto:joona@lovespark.love?subject=Bug Report — Cozy Accessibility' });
});

// ── Storage change listener ─────────────────────────────────────────────────────

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.globalSettings) {
    settings = deepMerge(DEFAULT_SETTINGS, changes.globalSettings.newValue || {});
    applyToUI(settings);
  }
  if (changes.disabledSites) {
    disabledSites = changes.disabledSites.newValue || [];
    if (currentDomain) {
      updateSiteBtn(disabledSites.includes(currentDomain));
    }
  }
});

// ── Start ───────────────────────────────────────────────────────────────────────

init();

/* ── Author / Ko-fi Footer ── */
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
