'use strict';

// ── Theme ─────────────────────────────────────────────────────────
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
  if (!toggle || !menu) return;

  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded', isOpen);
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

  document.addEventListener('keydown', (e) => {
    if (!menu.classList.contains('open')) return;
    const opts = [...menu.querySelectorAll('.theme-option')];
    const focused = document.activeElement;
    const idx = opts.indexOf(focused);

    if (e.key === 'Escape') {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.focus();
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      const next = idx < opts.length - 1 ? idx + 1 : 0;
      opts[next].focus();
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      const prev = idx > 0 ? idx - 1 : opts.length - 1;
      opts[prev].focus();
      e.preventDefault();
    }
  });

  chrome.storage.local.get(['theme'], ({ theme }) => {
    applyTheme(theme || 'retro');
  });
})();

// ── DOM refs ──────────────────────────────────────────────────────
const $ = (id) => document.getElementById(id);

const apiKeyInput       = $('apiKeyInput');
const toggleKeyVis      = $('toggleKeyVisibility');
const btnTestKey        = $('btnTestKey');
const keyStatus         = $('keyStatus');
const modelSelect       = $('modelSelect');
const styleSelect       = $('styleSelect');
const lengthSelect      = $('lengthSelect');
const cacheDaysSelect   = $('cacheDaysSelect');
const cacheCount        = $('cacheCount');
const btnClearCache     = $('btnClearCache');
const statToday         = $('statToday');
const statTotal         = $('statTotal');
const saveStatus        = $('saveStatus');

let saveTimeout = null;

// ── Load settings ─────────────────────────────────────────────────
function loadSettings() {
  chrome.storage.local.get(
    ['apiKey', 'model', 'summaryStyle', 'summaryLength', 'cacheDurationDays', 'digestsToday', 'digestsTotal'],
    (data) => {
      if (data.apiKey) apiKeyInput.value = data.apiKey;
      if (data.model) modelSelect.value = data.model;
      if (data.summaryStyle) styleSelect.value = data.summaryStyle;
      if (data.summaryLength) lengthSelect.value = data.summaryLength;
      if (data.cacheDurationDays) cacheDaysSelect.value = String(data.cacheDurationDays);
      statToday.textContent = data.digestsToday || 0;
      statTotal.textContent = data.digestsTotal || 0;
    }
  );

  // Cache count
  chrome.runtime.sendMessage({ action: 'getCacheStats' }, (resp) => {
    if (resp) cacheCount.textContent = resp.count + ' summaries cached';
  });
}

// ── Save helper ───────────────────────────────────────────────────
function showSaved() {
  saveStatus.textContent = 'Saved!';
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => { saveStatus.textContent = ''; }, 2000);
}

function saveField(key, value) {
  chrome.storage.local.set({ [key]: value }, showSaved);
}

// ── API Key ───────────────────────────────────────────────────────
let keyDebounce = null;
apiKeyInput.addEventListener('input', () => {
  if (keyDebounce) clearTimeout(keyDebounce);
  keyDebounce = setTimeout(() => {
    saveField('apiKey', apiKeyInput.value.trim());
  }, 500);
});

toggleKeyVis.addEventListener('click', () => {
  const isPassword = apiKeyInput.type === 'password';
  apiKeyInput.type = isPassword ? 'text' : 'password';
  toggleKeyVis.textContent = isPassword ? 'Hide' : 'Show';
});

btnTestKey.addEventListener('click', () => {
  const key = apiKeyInput.value.trim();
  if (!key) {
    keyStatus.textContent = 'Enter a key first.';
    keyStatus.className = 'key-status error';
    return;
  }

  keyStatus.textContent = 'Testing...';
  keyStatus.className = 'key-status testing';
  btnTestKey.disabled = true;

  chrome.runtime.sendMessage({ action: 'testApiKey', apiKey: key }, (resp) => {
    btnTestKey.disabled = false;
    if (resp?.valid) {
      keyStatus.textContent = 'Key is valid!';
      keyStatus.className = 'key-status success';
    } else {
      keyStatus.textContent = 'Invalid: ' + (resp?.error || 'Unknown error');
      keyStatus.className = 'key-status error';
    }
  });
});

// ── Selects ───────────────────────────────────────────────────────
modelSelect.addEventListener('change', () => saveField('model', modelSelect.value));
styleSelect.addEventListener('change', () => saveField('summaryStyle', styleSelect.value));
lengthSelect.addEventListener('change', () => saveField('summaryLength', lengthSelect.value));
cacheDaysSelect.addEventListener('change', () => saveField('cacheDurationDays', parseInt(cacheDaysSelect.value, 10)));

// ── Clear cache ───────────────────────────────────────────────────
btnClearCache.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'clearCache' }, (resp) => {
    if (resp) {
      cacheCount.textContent = '0 summaries cached';
      saveStatus.textContent = 'Cleared ' + resp.cleared + ' cached summaries.';
      if (saveTimeout) clearTimeout(saveTimeout);
      saveTimeout = setTimeout(() => { saveStatus.textContent = ''; }, 3000);
    }
  });
});

// ── Footer ────────────────────────────────────────────────────────
LoveSparkFooter.appendTo(document.getElementById('footerArea'));

// ── Init ──────────────────────────────────────────────────────────
loadSettings();
