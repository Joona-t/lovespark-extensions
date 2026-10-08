'use strict';

// ── DOM refs ──────────────────────────────────────────────────────────────────
const toggleEnabled   = document.getElementById('toggle-enabled');
const toggleAutoDecl  = document.getElementById('toggle-auto-decline');
const toggleDark      = document.getElementById('toggle-dark');
const statToday       = document.getElementById('stat-today');
const statTotal       = document.getElementById('stat-total');
const domainTbody     = document.getElementById('domain-tbody');
const exportCsvBtn    = document.getElementById('export-csv');
const resetStatsBtn   = document.getElementById('reset-stats');
const wlInput         = document.getElementById('wl-input');
const wlAddBtn        = document.getElementById('wl-add');
const wlList          = document.getElementById('wl-list');
const wlImportBtn     = document.getElementById('wl-import');
const wlExportBtn     = document.getElementById('wl-export');
const wlFile          = document.getElementById('wl-file');

let whitelistedDomains = [];
let cachedStats = {};

// ── Init ──────────────────────────────────────────────────────────────────────
async function init() {
  const data = await chrome.runtime.sendMessage({ type: 'GET_STATS' });
  cachedStats = data;
  applyState(data);
}

function applyState(data) {
  toggleEnabled.checked  = data.isEnabled !== false;
  toggleAutoDecl.checked = !!data.autoDecline;
  toggleDark.checked     = !!data.darkMode;

  statToday.textContent = (data.bannersHiddenToday || 0).toLocaleString();
  statTotal.textContent = (data.bannersHiddenTotal || 0).toLocaleString();

  renderDomainTable(data.domainStats || {});

  whitelistedDomains = data.whitelistedDomains || [];
  renderWhitelist();
}

// ── Enable toggle ─────────────────────────────────────────────────────────────
toggleEnabled.addEventListener('change', () =>
  chrome.runtime.sendMessage({ type: 'SET_ENABLED', enabled: toggleEnabled.checked })
);

// ── Auto-decline toggle ───────────────────────────────────────────────────────
toggleAutoDecl.addEventListener('change', () =>
  chrome.runtime.sendMessage({ type: 'SET_AUTO_DECLINE', autoDecline: toggleAutoDecl.checked })
);

// ── Dark mode ─────────────────────────────────────────────────────────────────
toggleDark.addEventListener('change', () =>
  chrome.runtime.sendMessage({ type: 'SET_DARK_MODE', darkMode: toggleDark.checked })
);

// ── Domain stats table ────────────────────────────────────────────────────────
function renderDomainTable(domainStats) {
  const entries = Object.entries(domainStats)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  domainTbody.replaceChildren();

  if (!entries.length) {
    const tr = document.createElement('tr');
    const td = document.createElement('td');
    td.colSpan = 2;
    td.className = 'empty-row';
    td.textContent = 'No data yet 🌸';
    tr.appendChild(td);
    domainTbody.appendChild(tr);
    return;
  }

  for (const [domain, count] of entries) {
    const tr = document.createElement('tr');
    const tdDomain = document.createElement('td');
    tdDomain.textContent = domain;
    const tdCount = document.createElement('td');
    tdCount.textContent = count.toLocaleString();
    tr.appendChild(tdDomain);
    tr.appendChild(tdCount);
    domainTbody.appendChild(tr);
  }
}

// ── Stats: export + reset ─────────────────────────────────────────────────────
exportCsvBtn.addEventListener('click', () => {
  const rows = [['Metric', 'Value'],
    ['Banners Hidden Today', cachedStats.bannersHiddenToday || 0],
    ['Banners Hidden Total', cachedStats.bannersHiddenTotal || 0],
    ['Last Reset', cachedStats.lastResetDate || '—'],
    ['', ''],
    ['Domain', 'Banners Hidden'],
    ...Object.entries(cachedStats.domainStats || {}).sort((a, b) => b[1] - a[1]),
  ];
  downloadText('idwc-stats.csv', rows.map((r) => r.join(',')).join('\n'), 'text/csv');
});

resetStatsBtn.addEventListener('click', async () => {
  if (!confirm('Reset all stats? This cannot be undone.')) return;
  await chrome.runtime.sendMessage({ type: 'RESET_STATS' });
  statToday.textContent = '0';
  statTotal.textContent = '0';
  cachedStats.bannersHiddenToday = 0;
  cachedStats.bannersHiddenTotal = 0;
  cachedStats.domainStats = {};
  renderDomainTable({});
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
  await chrome.runtime.sendMessage({ type: 'REMOVE_WHITELIST', domain });
  whitelistedDomains = whitelistedDomains.filter((d) => d !== domain);
  renderWhitelist();
});

wlAddBtn.addEventListener('click', addDomain);
wlInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addDomain(); });

async function addDomain() {
  const raw = wlInput.value.trim().toLowerCase();
  if (!raw) return;
  const domain = raw.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
  if (!domain) return;

  if (!whitelistedDomains.includes(domain)) {
    await chrome.runtime.sendMessage({ type: 'ADD_WHITELIST', domain });
    whitelistedDomains.push(domain);
    renderWhitelist();
  }
  wlInput.value = '';
}

wlImportBtn.addEventListener('click', () => wlFile.click());

wlFile.addEventListener('change', async () => {
  const file = wlFile.files[0];
  if (!file) return;
  const text = await file.text();
  let domains = [];
  try {
    const parsed = JSON.parse(text);
    if (Array.isArray(parsed)) domains = parsed.filter((d) => typeof d === 'string');
  } catch (_) {
    domains = text.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  }
  const merged = [...new Set([...whitelistedDomains, ...domains])];
  await chrome.runtime.sendMessage({ type: 'SET_WHITELIST', domains: merged });
  whitelistedDomains = merged;
  renderWhitelist();
  wlFile.value = '';
});

wlExportBtn.addEventListener('click', () =>
  downloadText('idwc-whitelist.json', JSON.stringify(whitelistedDomains, null, 2), 'application/json')
);

// ── Helpers ───────────────────────────────────────────────────────────────────
function downloadText(filename, content, mime) {
  const a = Object.assign(document.createElement('a'), {
    href: URL.createObjectURL(new Blob([content], { type: mime })),
    download: filename,
  });
  a.click();
  URL.revokeObjectURL(a.href);
}

function escHtml(str) {
  return str.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c])
  );
}

// Refresh stats every 5s
setInterval(async () => {
  const data = await chrome.runtime.sendMessage({ type: 'GET_STATS' });
  statToday.textContent = (data.bannersHiddenToday || 0).toLocaleString();
  statTotal.textContent = (data.bannersHiddenTotal || 0).toLocaleString();
  renderDomainTable(data.domainStats || {});
  cachedStats = data;
}, 5000);

init();
