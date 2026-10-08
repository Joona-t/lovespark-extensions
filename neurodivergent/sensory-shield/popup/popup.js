'use strict';

// Theme dropdown — shared lib (lib/lovespark-theme.js). Also keeps the
// trigger's aria-expanded in sync with the menu's open/closed state for
// screen readers (A11Y-EXPANDED).
LoveSparkTheme.init();
(function syncThemeExpandedState() {
  const toggle = document.getElementById('themeToggle');
  const menu = document.getElementById('themeMenu');
  if (!toggle || !menu) return;
  const sync = () => toggle.setAttribute('aria-expanded', menu.classList.contains('open') ? 'true' : 'false');
  toggle.addEventListener('click', () => setTimeout(sync, 0));
  document.addEventListener('click', () => setTimeout(sync, 0));
})();


/**
 * Sensory Shield — Popup
 *
 * Reads/writes per-domain settings to browser.storage.local.
 * Content scripts react via storage.onChanged — no direct message passing needed for features.
 * Uses background messages for GET_DOMAIN_SETTINGS and GET_PRESETS.
 */

const CUTE_MSGS = [
  'Your brain deserves calm. \u{1F495}',
  'Sensory peace, activated! \u{2728}',
  'You\u2019re doing amazing! \u{1F338}',
  'A calmer internet, just for you. \u{1F496}',
  'Breathe easy, bestie. \u{1F31F}',
  'Shield up! \u{1F6E1}\uFE0F',
];

const PRESETS = {
  calm:  { reduceMotion: true, tintEnabled: true, tintColor: '#FDCFE1', tintOpacity: 0.1, hideGifs: true, focusRuler: false, cursorSize: false, fontComfort: false },
  focus: { reduceMotion: true, tintEnabled: false, tintColor: '#FDCFE1', tintOpacity: 0.1, hideGifs: false, focusRuler: true, cursorSize: false, fontComfort: true },
  full:  { reduceMotion: true, tintEnabled: true, tintColor: '#FDCFE1', tintOpacity: 0.1, hideGifs: true, focusRuler: true, cursorSize: true, fontComfort: true },
};

const FEATURE_KEYS = ['reduceMotion', 'tintEnabled', 'hideGifs', 'focusRuler', 'cursorSize', 'fontComfort'];
const TOGGLE_MAP = {
  reduceMotion: 'toggle-reduce-motion',
  tintEnabled: 'toggle-tint',
  hideGifs: 'toggle-gifs',
  focusRuler: 'toggle-ruler',
  cursorSize: 'toggle-cursor',
  fontComfort: 'toggle-font',
};

// Elements
const domainEl = document.getElementById('current-domain');
const presetBtns = document.querySelectorAll('.preset-btn');
const tintControls = document.getElementById('tint-controls');
const tintColor = document.getElementById('tint-color');
const tintOpacity = document.getElementById('tint-opacity');
const tintOpacityLabel = document.getElementById('tint-opacity-label');
const saveBtn = document.getElementById('save-preset-btn');
const cuteMsgEl = document.getElementById('cute-msg');
const settingsLink = document.getElementById('settings-link');
const sparkleContainer = document.getElementById('sparkle-container');

let currentDomain = null;
let domainSettings = null;
let msgTimer = null;

// ── Init ────────────────────────────────────────────────────────────────────

async function init() {
  // Get current tab domain
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab && tab.url) {
      try {
        currentDomain = new URL(tab.url).hostname.replace(/^www\./, '');
        domainEl.textContent = currentDomain;
      } catch (err) { console.warn('[popup] unknown:', err); }
    }
  } catch (err) { console.warn('[popup] unknown:', err); }

  if (!currentDomain) {
    domainEl.textContent = 'N/A';
    saveBtn.disabled = true;
    return;
  }

  // Load domain settings
  const data = await browser.storage.local.get([currentDomain, 'globalEnabled']);
  domainSettings = data[currentDomain] || null;

  if (domainSettings) {
    applyUI(domainSettings);
  }

  rotateCuteMsg();
}

function applyUI(settings) {
  // Set toggles
  for (const key of FEATURE_KEYS) {
    const el = document.getElementById(TOGGLE_MAP[key]);
    if (el) {
      const on = !!settings[key];
      el.classList.toggle('active', on);
      el.setAttribute('aria-checked', String(on));
    }
  }

  // Tint controls
  tintControls.classList.toggle('hidden', !settings.tintEnabled);
  tintColor.value = settings.tintColor || '#FDCFE1';
  tintOpacity.value = Math.round((settings.tintOpacity || 0.1) * 100);
  tintOpacityLabel.textContent = tintOpacity.value + '%';

  // Highlight active preset
  highlightPreset(settings.preset || detectPreset(settings));
}

function detectPreset(settings) {
  for (const [name, preset] of Object.entries(PRESETS)) {
    const match = FEATURE_KEYS.every(function(key) {
      return !!settings[key] === !!preset[key];
    });
    if (match) return name;
  }
  return 'custom';
}

function highlightPreset(name) {
  for (const btn of presetBtns) {
    btn.classList.toggle('active', btn.dataset.preset === name);
  }
}

function getCurrentSettings() {
  const settings = {
    preset: 'custom',
    tintColor: tintColor.value,
    tintOpacity: parseInt(tintOpacity.value, 10) / 100,
  };

  for (const key of FEATURE_KEYS) {
    const el = document.getElementById(TOGGLE_MAP[key]);
    settings[key] = el ? el.classList.contains('active') : false;
  }

  settings.preset = detectPreset(settings);
  return settings;
}

// ── Event Handlers ──────────────────────────────────────────────────────────

// Toggle switches
for (const key of FEATURE_KEYS) {
  const el = document.getElementById(TOGGLE_MAP[key]);
  if (!el) continue;

  el.addEventListener('click', function() {
    const on = !el.classList.contains('active');
    el.classList.toggle('active', on);
    el.setAttribute('aria-checked', String(on));

    // Show/hide tint controls
    if (key === 'tintEnabled') {
      tintControls.classList.toggle('hidden', !on);
    }

    saveToDomain();
  });

  // Keyboard accessibility
  el.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      el.click();
    }
  });
}

// Preset buttons
for (const btn of presetBtns) {
  btn.addEventListener('click', function() {
    const name = btn.dataset.preset;

    if (name === 'custom') {
      // Load user's custom preset
      browser.storage.local.get('customPreset').then(function(data) {
        const custom = data.customPreset;
        if (custom) {
          applyUI(custom);
        }
        highlightPreset('custom');
        saveToDomain();
        spawnSparkles(btn);
      });
      return;
    }

    const preset = PRESETS[name];
    if (!preset) return;

    const settings = { ...preset, preset: name };
    applyUI(settings);
    saveToDomain();
    spawnSparkles(btn);
  });
}

// Tint colour picker
tintColor.addEventListener('input', function() {
  saveToDomain();
});

// Tint opacity slider
tintOpacity.addEventListener('input', function() {
  tintOpacityLabel.textContent = tintOpacity.value + '%';
  saveToDomain();
});

// Save as custom preset
saveBtn.addEventListener('click', function() {
  const settings = getCurrentSettings();
  settings.preset = 'custom';
  browser.storage.local.set({ customPreset: settings });
  highlightPreset('custom');
  spawnSparkles(saveBtn);
});

// Settings link
settingsLink.addEventListener('click', function(e) {
  e.preventDefault();
  browser.runtime.openOptionsPage();
});

// ── Save to Domain ──────────────────────────────────────────────────────────

let saveTimer = null;

function saveToDomain() {
  if (!currentDomain) return;

  clearTimeout(saveTimer);
  saveTimer = setTimeout(function() {
    const settings = getCurrentSettings();
    domainSettings = settings;
    browser.storage.local.set({ [currentDomain]: settings });
  }, 200);
}

// ── Sparkles ────────────────────────────────────────────────────────────────

function spawnSparkles(anchor) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const rect = anchor.getBoundingClientRect();
  for (let i = 0; i < 6; i++) {
    const spark = document.createElement('div');
    spark.className = 'sparkle';
    spark.style.left = (rect.left + Math.random() * rect.width) + 'px';
    spark.style.top = (rect.top + Math.random() * rect.height) + 'px';
    sparkleContainer.appendChild(spark);
    spark.addEventListener('animationend', function() { spark.remove(); });
  }
}

// ── Cute Message Rotation ───────────────────────────────────────────────────

function rotateCuteMsg() {
  let idx = 0;
  msgTimer = setInterval(function() {
    idx = (idx + 1) % CUTE_MSGS.length;
    cuteMsgEl.style.opacity = '0';
    setTimeout(function() {
      cuteMsgEl.textContent = CUTE_MSGS[idx];
      cuteMsgEl.style.opacity = '1';
    }, 200);
  }, 3500);
}

window.addEventListener('beforeunload', function() {
  clearInterval(msgTimer);
});

// ── Storage Sync ────────────────────────────────────────────────────────────

browser.storage.onChanged.addListener(function(changes, area) {
  if (area !== 'local' || !currentDomain) return;
  if (changes[currentDomain]) {
    const newSettings = changes[currentDomain].newValue;
    if (newSettings) {
      domainSettings = newSettings;
      applyUI(newSettings);
    }
  }
});

// Start
init();

/* ── Author / Ko-fi Footer ── */
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
