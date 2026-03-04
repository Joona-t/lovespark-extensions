'use strict';

// Dark mode
chrome.storage.local.get(['darkMode'], ({ darkMode }) => {
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  const btn = document.getElementById('btnDarkMode');
  if (btn) btn.textContent = darkMode ? '☀️' : '🌙';
});
function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  chrome.storage.local.set({ darkMode: !isDark });
  const btn = document.getElementById('btnDarkMode');
  if (btn) btn.textContent = isDark ? '🌙' : '☀️';
}
document.getElementById('btnDarkMode').addEventListener('click', toggleTheme);

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
  wlList.innerHTML = '';
  if (!whitelistedDomains.length) {
    wlList.innerHTML = '<li class="wl-empty">No whitelisted sites yet 🩷</li>';
    return;
  }
  whitelistedDomains.forEach((domain) => {
    const li = document.createElement('li');
    li.className = 'wl-item';
    li.innerHTML = `
      <span class="wl-domain">${escHtml(domain)}</span>
      <button class="wl-remove" data-domain="${escHtml(domain)}" aria-label="Remove ${escHtml(domain)}">✕</button>
    `;
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

async function addDomain() {
  const raw = wlInput.value.trim().toLowerCase();
  if (!raw) return;

  // Normalize: strip protocol, www., trailing slash
  let domain = raw.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  if (!domain) return;

  if (!whitelistedDomains.includes(domain)) {
    await sendMsg({ type: 'ADD_WHITELIST', domain });
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

function sendMsg(msg) {
  return chrome.runtime.sendMessage(msg);
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

const HTML_ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
function escHtml(str) {
  return str.replace(/[&<>"']/g, (c) => HTML_ESC[c]);
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

init();
