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
    const setOpen = (open) => {
      menu.classList.toggle('open', open);
      toggle.setAttribute('aria-expanded', String(open));
    };
    toggle.addEventListener('click', (e) => { e.stopPropagation(); setOpen(!menu.classList.contains('open')); });
    menu.addEventListener('click', (e) => {
      const opt = e.target.closest('.theme-option');
      if (!opt) return;
      const theme = opt.dataset.theme;
      applyTheme(theme);
      chrome.storage.local.set({ theme });
      setOpen(false);
    });
    document.addEventListener('click', () => setOpen(false));
  }
  chrome.storage.local.get(['theme', 'darkMode'], ({ theme, darkMode }) => {
    if (!theme && darkMode) theme = 'dark';
    applyTheme(theme || 'retro');
  });
})();

// ── DOM refs ──────────────────────────────────────────────────────────────────

const toggleEnabled  = document.getElementById('toggle-enabled');
const intensityRadios = document.querySelectorAll('input[name="intensity"]');
const statToday      = document.getElementById('stat-today');
const statTotal      = document.getElementById('stat-total');
const exportCsvBtn   = document.getElementById('export-csv');
const resetStatsBtn  = document.getElementById('reset-stats');
const wlInput        = document.getElementById('wl-input');
const wlAddBtn       = document.getElementById('wl-add');
const wlList         = document.getElementById('wl-list');
const wlImportBtn    = document.getElementById('wl-import');
const wlExportBtn    = document.getElementById('wl-export');
const wlFile         = document.getElementById('wl-file');

let whitelistedDomains = [];
let cachedStats = {};

// ── Init ──────────────────────────────────────────────────────────────────────

async function init() {
  const data = await sendMsg({ type: 'GET_STATS' });
  cachedStats = data;
  applyLoadedState(data);
}

function applyLoadedState(data) {
  // Enable toggle
  toggleEnabled.checked = data.isEnabled !== false;

  // Intensity radio
  const intensity = data.filterIntensity || 'medium';
  const radio = document.querySelector(`input[name="intensity"][value="${intensity}"]`);
  if (radio) radio.checked = true;
  highlightIntensity(intensity);

  // Stats
  statToday.textContent = (data.adsBlockedToday || 0).toLocaleString();
  statTotal.textContent = (data.adsBlockedTotal || 0).toLocaleString();

  // Whitelist
  whitelistedDomains = data.whitelistedDomains || [];
  renderWhitelist();
}

// ── Enable toggle ─────────────────────────────────────────────────────────────

toggleEnabled.addEventListener('change', async () => {
  await sendMsg({ type: 'SET_ENABLED', enabled: toggleEnabled.checked });
});

// ── Intensity ─────────────────────────────────────────────────────────────────

intensityRadios.forEach((radio) => {
  radio.addEventListener('change', async () => {
    if (radio.checked) {
      await sendMsg({ type: 'SET_INTENSITY', intensity: radio.value });
      highlightIntensity(radio.value);
    }
  });
});

function highlightIntensity(level) {
  document.querySelectorAll('.intensity-opt').forEach((el) => {
    const active = el.dataset.level === level;
    el.querySelector('.opt-card').style.setProperty(
      'border-color', active ? 'var(--ls-pink-accent)' : ''
    );
  });
}

// ── Stats: export + reset ─────────────────────────────────────────────────────

exportCsvBtn.addEventListener('click', () => {
  const rows = [
    ['Metric', 'Value'],
    ['Blocked Today',  cachedStats.adsBlockedToday  || 0],
    ['Blocked Total',  cachedStats.adsBlockedTotal  || 0],
    ['Last Reset',     cachedStats.lastResetDate    || '—'],
    ['Filter Intensity', cachedStats.filterIntensity || 'medium'],
  ];
  const csv = rows.map((r) => r.join(',')).join('\n');
  downloadText('lovespark-adblock-stats.csv', csv, 'text/csv');
});

resetStatsBtn.addEventListener('click', async () => {
  if (!confirm('Reset all stats? This cannot be undone.')) return;
  await sendMsg({ type: 'RESET_STATS' });
  statToday.textContent = '0';
  statTotal.textContent = '0';
  cachedStats.adsBlockedToday = 0;
  cachedStats.adsBlockedTotal = 0;
});

// ── Whitelist ─────────────────────────────────────────────────────────────────

function renderWhitelist() {
  wlList.replaceChildren();
  if (!whitelistedDomains.length) {
    const li = document.createElement('li');
    li.className = 'wl-empty';
    li.textContent = 'No whitelisted sites yet 🩷';
    wlList.appendChild(li);
    return;
  }
  whitelistedDomains.forEach((domain) => {
    const li = document.createElement('li');
    li.className = 'wl-item';
    const span = document.createElement('span');
    span.className = 'wl-domain';
    span.textContent = domain;
    const btn = document.createElement('button');
    btn.className = 'wl-remove';
    btn.dataset.domain = domain;
    btn.setAttribute('aria-label', 'Remove ' + domain);
    btn.textContent = '✕';
    li.appendChild(span);
    li.appendChild(btn);
    wlList.appendChild(li);
  });
}

wlList.addEventListener('click', async (e) => {
  const btn = e.target.closest('.wl-remove');
  if (!btn) return;
  const domain = btn.dataset.domain;
  await sendMsg({ type: 'REMOVE_WHITELIST', domain });
  whitelistedDomains = whitelistedDomains.filter((d) => d !== domain);
  renderWhitelist();
});

wlAddBtn.addEventListener('click', addDomain);
wlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addDomain(); });

// Conservative hostname check (labels, valid TLD, no protocol/path).
const DOMAIN_RE = /^(?=.{1,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,}$/;

function setWlError(msg) {
  wlInput.setCustomValidity(msg || '');
  if (msg) wlInput.reportValidity();
}

async function addDomain() {
  const raw = wlInput.value.trim().toLowerCase();
  if (!raw) return;

  // Normalize: strip protocol, www., trailing slash/path.
  const domain = raw.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  if (!DOMAIN_RE.test(domain)) {
    setWlError('Enter a valid domain like example.com');
    return;
  }
  setWlError('');

  if (!whitelistedDomains.includes(domain)) {
    const res = await sendMsg({ type: 'ADD_WHITELIST', domain });
    if (res && res.error) { setWlError('Could not add: ' + res.error); return; }
    whitelistedDomains.push(domain);
    renderWhitelist();
  }
  wlInput.value = '';
}

// Import / export whitelist

wlImportBtn.addEventListener('click', () => wlFile.click());

wlFile.addEventListener('change', async () => {
  const file = wlFile.files[0];
  if (!file) return;
  const text = await file.text();
  let domains = [];
  try {
    // Try JSON array
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) domains = parsed.filter((d) => typeof d === 'string');
  } catch (_) {
    // Treat as newline-separated list
    domains = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  }
  const merged = [...new Set([...whitelistedDomains, ...domains])];
  await sendMsg({ type: 'SET_WHITELIST', domains: merged });
  whitelistedDomains = merged;
  renderWhitelist();
  wlFile.value = '';
});

wlExportBtn.addEventListener('click', () => {
  downloadText('lovespark-whitelist.json', JSON.stringify(whitelistedDomains, null, 2), 'application/json');
});

// ── Helpers ───────────────────────────────────────────────────────────────────

async function sendMsg(msg) {
  try {
    return await chrome.runtime.sendMessage(msg);
  } catch (err) {
    console.warn('[lovespark-adblock] message failed:', err);
    return { error: err.message };
  }
}

function downloadText(filename, content, mime) {
  const blob = new Blob([content], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// React to storage changes instead of polling — zero CPU when idle, instant updates.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return;
  if (changes.adsBlockedToday) {
    const val = changes.adsBlockedToday.newValue || 0;
    statToday.textContent = val.toLocaleString();
    cachedStats.adsBlockedToday = val;
  }
  if (changes.adsBlockedTotal) {
    const val = changes.adsBlockedTotal.newValue || 0;
    statTotal.textContent = val.toLocaleString();
    cachedStats.adsBlockedTotal = val;
  }
  if (changes.whitelistedDomains) {
    whitelistedDomains = changes.whitelistedDomains.newValue || [];
    renderWhitelist();
  }
  if (changes.isEnabled) {
    toggleEnabled.checked = changes.isEnabled.newValue !== false;
  }
});

// Render the real version into the footer (was hardcoded to v1.0.0).
const verEl = document.getElementById('app-version');
if (verEl) verEl.textContent = 'v' + chrome.runtime.getManifest().version;

init();
