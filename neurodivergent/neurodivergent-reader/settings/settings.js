'use strict';

/**
 * Settings page — full control over all Neurodivergent Reader features.
 * Writes to chrome.storage.sync, content scripts react via storage.onChanged.
 * Debounces slider changes at 300ms to stay within sync write rate limits.
 */

let settings = null;
let saveTimer = null;
let lastWriteTime = 0;
const MIN_WRITE_GAP = 500;

// ── Elements ──────────────────────────────────────────────────────────────────

const els = {
  enabled:        document.getElementById('toggle-enabled'),
  font:           document.getElementById('toggle-font'),
  fontFamily:     document.getElementById('font-family'),
  fontSize:       document.getElementById('font-size'),
  fontSizeVal:    document.getElementById('font-size-val'),
  lineHeight:     document.getElementById('line-height'),
  lineHeightVal:  document.getElementById('line-height-val'),
  letterSpacing:  document.getElementById('letter-spacing'),
  letterSpacingVal: document.getElementById('letter-spacing-val'),
  wordSpacing:    document.getElementById('word-spacing'),
  wordSpacingVal: document.getElementById('word-spacing-val'),
  ruler:          document.getElementById('toggle-ruler'),
  rulerHeight:    document.getElementById('ruler-height'),
  rulerHeightVal: document.getElementById('ruler-height-val'),
  rulerOpacity:   document.getElementById('ruler-opacity'),
  rulerOpacityVal: document.getElementById('ruler-opacity-val'),
  rulerColor:     document.getElementById('ruler-color'),
  focus:          document.getElementById('toggle-focus'),
  focusDim:       document.getElementById('focus-dim'),
  focusDimVal:    document.getElementById('focus-dim-val'),
  lock:           document.getElementById('toggle-lock'),
  distractions:   document.getElementById('toggle-distractions'),
  sidebars:       document.getElementById('toggle-sidebars'),
  ads:            document.getElementById('toggle-ads'),
  cookies:        document.getElementById('toggle-cookies'),
  floating:       document.getElementById('toggle-floating'),
  siteInput:      document.getElementById('site-input'),
  siteAdd:        document.getElementById('site-add'),
  siteList:       document.getElementById('site-list'),
};

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  const { settings: stored = {} } = await chrome.storage.sync.get('settings');
  settings = mergeDefaults(stored);
  applyState(settings);
  bindEvents();
}

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

// ── Apply state to UI ────────────────────────────────────────────────────────

function applyState(s) {
  els.enabled.checked = s.enabled;

  // Font
  els.font.checked = s.fontOverride.enabled;
  els.fontFamily.value = s.fontOverride.family || 'OpenDyslexic';
  els.fontSize.value = s.fontOverride.size;
  els.fontSizeVal.textContent = s.fontOverride.size;
  els.lineHeight.value = s.fontOverride.lineHeight;
  els.lineHeightVal.textContent = s.fontOverride.lineHeight;
  els.letterSpacing.value = s.fontOverride.letterSpacing;
  els.letterSpacingVal.textContent = s.fontOverride.letterSpacing;
  els.wordSpacing.value = s.fontOverride.wordSpacing;
  els.wordSpacingVal.textContent = s.fontOverride.wordSpacing;

  // Ruler
  els.ruler.checked = s.ruler.enabled;
  els.rulerHeight.value = s.ruler.height;
  els.rulerHeightVal.textContent = s.ruler.height;
  els.rulerOpacity.value = s.ruler.opacity;
  els.rulerOpacityVal.textContent = s.ruler.opacity;
  els.rulerColor.value = s.ruler.color;

  // Focus
  els.focus.checked = s.focus.enabled;
  els.focusDim.value = s.focus.dimLevel;
  els.focusDimVal.textContent = s.focus.dimLevel;
  els.lock.checked = s.focus.lockOnClick;

  // Distractions
  els.distractions.checked = s.distractions.enabled;
  els.sidebars.checked = s.distractions.hideSidebars;
  els.ads.checked = s.distractions.hideAds;
  els.cookies.checked = s.distractions.hideCookieBanners;
  els.floating.checked = s.distractions.hideFloating;

  // Sites
  renderSiteList();
}

// ── Save ──────────────────────────────────────────────────────────────────────

function save() {
  clearTimeout(saveTimer);
  const now = Date.now();
  const delay = Math.max(300, MIN_WRITE_GAP - (now - lastWriteTime));
  saveTimer = setTimeout(async () => {
    lastWriteTime = Date.now();
    await chrome.storage.sync.set({ settings });
  }, delay);
}

// ── Bind events ───────────────────────────────────────────────────────────────

function bindEvents() {
  // Toggles
  els.enabled.addEventListener('change', () => { settings.enabled = els.enabled.checked; save(); });
  els.font.addEventListener('change', () => { settings.fontOverride.enabled = els.font.checked; save(); });
  els.fontFamily.addEventListener('change', () => { settings.fontOverride.family = els.fontFamily.value; save(); });
  els.ruler.addEventListener('change', () => { settings.ruler.enabled = els.ruler.checked; save(); });
  els.focus.addEventListener('change', () => { settings.focus.enabled = els.focus.checked; save(); });
  els.lock.addEventListener('change', () => { settings.focus.lockOnClick = els.lock.checked; save(); });
  els.distractions.addEventListener('change', () => { settings.distractions.enabled = els.distractions.checked; save(); });
  els.sidebars.addEventListener('change', () => { settings.distractions.hideSidebars = els.sidebars.checked; save(); });
  els.ads.addEventListener('change', () => { settings.distractions.hideAds = els.ads.checked; save(); });
  els.cookies.addEventListener('change', () => { settings.distractions.hideCookieBanners = els.cookies.checked; save(); });
  els.floating.addEventListener('change', () => { settings.distractions.hideFloating = els.floating.checked; save(); });

  // Sliders
  bindSlider(els.fontSize, els.fontSizeVal, (v) => { settings.fontOverride.size = parseInt(v, 10); });
  bindSlider(els.lineHeight, els.lineHeightVal, (v) => { settings.fontOverride.lineHeight = parseFloat(v); });
  bindSlider(els.letterSpacing, els.letterSpacingVal, (v) => { settings.fontOverride.letterSpacing = parseFloat(v); });
  bindSlider(els.wordSpacing, els.wordSpacingVal, (v) => { settings.fontOverride.wordSpacing = parseFloat(v); });
  bindSlider(els.rulerHeight, els.rulerHeightVal, (v) => { settings.ruler.height = parseInt(v, 10); });
  bindSlider(els.rulerOpacity, els.rulerOpacityVal, (v) => { settings.ruler.opacity = parseFloat(v); });
  bindSlider(els.focusDim, els.focusDimVal, (v) => { settings.focus.dimLevel = parseFloat(v); });

  // Color
  els.rulerColor.addEventListener('input', () => {
    settings.ruler.color = els.rulerColor.value;
    save();
  });

  // Site management
  els.siteAdd.addEventListener('click', addSite);
  els.siteInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addSite();
  });
  els.siteList.addEventListener('click', (e) => {
    const btn = e.target.closest('.site-remove');
    if (!btn) return;
    const domain = btn.dataset.domain;
    settings.disabledSites = (settings.disabledSites || []).filter((d) => d !== domain);
    renderSiteList();
    save();
  });
}

function bindSlider(slider, valEl, setter) {
  slider.addEventListener('input', () => {
    valEl.textContent = slider.value;
    setter(slider.value);
    save();
  });
}

// ── Site list ─────────────────────────────────────────────────────────────────

function addSite() {
  const raw = els.siteInput.value.trim().toLowerCase();
  let domain = raw.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  if (!domain) return;

  if (!(settings.disabledSites || []).includes(domain)) {
    settings.disabledSites = settings.disabledSites || [];
    settings.disabledSites.push(domain);
    renderSiteList();
    save();
  }
  els.siteInput.value = '';
}

function renderSiteList() {
  const list = settings.disabledSites || [];
  els.siteList.textContent = '';

  if (!list.length) {
    const empty = document.createElement('li');
    empty.className = 'site-empty';
    empty.textContent = 'No disabled sites';
    els.siteList.appendChild(empty);
    return;
  }

  list.forEach((domain) => {
    const li = document.createElement('li');
    li.className = 'site-item';

    const span = document.createElement('span');
    span.textContent = domain;

    const btn = document.createElement('button');
    btn.className = 'site-remove';
    btn.dataset.domain = domain;
    btn.title = 'Remove';
    btn.textContent = '\u2715';

    li.appendChild(span);
    li.appendChild(btn);
    els.siteList.appendChild(li);
  });
}

// ── Live sync from other contexts ─────────────────────────────────────────────

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync' || !changes.settings) return;
  settings = mergeDefaults(changes.settings.newValue || {});
  applyState(settings);
});

// Start
init();
