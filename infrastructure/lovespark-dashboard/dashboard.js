'use strict';

// ── Constants ─────────────────────────────────────────────────────────────────

const SELF_ID = chrome.runtime.id;

const LOVESPARK_KNOWN_NAMES = new Set([
  'porn blocker rewire brain',
  "i don't want cookies",
  'anti brainrot',
  'are you cooked',
]);

const CATEGORIES = [
  { id: 'lovespark',    label: '\u2728 LoveSpark Suite',  match: ext => isLoveSpark(ext) },
  { id: 'adblock',      label: 'Ad Blockers',         keywords: ['adblock', 'ad block', 'ublock', 'ads', 'blocker', 'adguard'] },
  { id: 'privacy',      label: 'Privacy & Security',  keywords: ['privacy', 'vpn', 'cookie', 'tracker', 'https', 'password', 'security', 'encrypt', 'referrer', 'fingerprint', 'metadata'] },
  { id: 'productivity', label: 'Productivity',         keywords: ['todo', 'tab', 'bookmark', 'focus', 'timer', 'pomodoro', 'notes', 'clipboard', 'manager'] },
  { id: 'devtools',     label: 'Dev Tools',            keywords: ['devtool', 'react', 'vue', 'redux', 'json', 'debug', 'inspect', 'lighthouse', 'wappalyzer', 'console'] },
  { id: 'media',        label: 'Media & Content',      keywords: ['video', 'youtube', 'image', 'screenshot', 'download', 'music', 'spotify', 'reader', 'dark mode'] },
  { id: 'shopping',     label: 'Shopping',             keywords: ['coupon', 'price', 'deal', 'cashback', 'honey', 'shop', 'amazon'] },
  { id: 'other',        label: 'Other',                match: () => true },
];

// ── State ─────────────────────────────────────────────────────────────────────

let allExtensions = [];
let activeCategory = 'all';
let searchQuery = '';

// ── DOM refs ──────────────────────────────────────────────────────────────────

const activeCountEl = document.getElementById('active-count');
const totalCountEl  = document.getElementById('total-count');
const searchInput   = document.getElementById('search');
const tabsEl        = document.getElementById('tabs');
const gridEl        = document.getElementById('grid');
const toastsEl      = document.getElementById('toasts');

// ── Utilities ─────────────────────────────────────────────────────────────────

function escapeHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function isLoveSpark(ext) {
  const name = ext.name.toLowerCase();
  const homepage = (ext.homepageUrl || '').toLowerCase();
  return name.startsWith('lovespark') ||
         name.startsWith('love spark') ||
         LOVESPARK_KNOWN_NAMES.has(name) ||
         homepage.includes('lovespark');
}

function categorize(ext) {
  const haystack = (ext.name + ' ' + (ext.description || '')).toLowerCase();
  for (const cat of CATEGORIES) {
    if (cat.match && cat.match(ext)) return cat.id;
    if (cat.keywords && cat.keywords.some(kw => haystack.includes(kw))) return cat.id;
  }
  return 'other';
}

function getExtIcon(ext) {
  if (!ext.icons || !ext.icons.length) return null;
  // Prefer size closest to 48, then largest
  const sorted = [...ext.icons].sort((a, b) => {
    const ad = Math.abs(a.size - 48);
    const bd = Math.abs(b.size - 48);
    return ad !== bd ? ad - bd : b.size - a.size;
  });
  return sorted[0].url;
}

// ── Data ──────────────────────────────────────────────────────────────────────

async function loadExtensions() {
  try {
    const all = await chrome.management.getAll();
    allExtensions = all.filter(ext => ext.type === 'extension');
    render();
  } catch (err) {
    gridEl.innerHTML = '<div class="empty-state">Error: ' + escapeHtml(err.message) + '</div>';
  }
}

// ── Rendering ─────────────────────────────────────────────────────────────────

function render() {
  updateStats();
  updateCategoryTabs();
  renderGrid();
}

function updateStats() {
  const nonSelf = allExtensions.filter(e => e.id !== SELF_ID);
  activeCountEl.textContent = nonSelf.filter(e => e.enabled).length;
  totalCountEl.textContent = nonSelf.length;
}

function updateCategoryTabs() {
  const counts = {};
  for (const ext of allExtensions) {
    const cat = categorize(ext);
    counts[cat] = (counts[cat] || 0) + 1;
  }

  let html = '<button class="cat-tab' + (activeCategory === 'all' ? ' active' : '') + '" data-cat="all">All</button>';
  for (const cat of CATEGORIES) {
    if (!counts[cat.id]) continue;
    html += '<button class="cat-tab' + (activeCategory === cat.id ? ' active' : '') + '" data-cat="' + cat.id + '">' + cat.label + '</button>';
  }
  tabsEl.innerHTML = html;
}

function renderGrid() {
  let filtered = allExtensions;

  // Category filter
  if (activeCategory !== 'all') {
    filtered = filtered.filter(ext => categorize(ext) === activeCategory);
  }

  // Search filter
  if (searchQuery) {
    filtered = filtered.filter(ext => {
      const hay = (ext.name + ' ' + (ext.description || '')).toLowerCase();
      return hay.includes(searchQuery);
    });
  }

  // Sort: LoveSpark first, enabled before disabled, then alphabetical
  filtered.sort((a, b) => {
    const aLS = isLoveSpark(a) ? 0 : 1;
    const bLS = isLoveSpark(b) ? 0 : 1;
    if (aLS !== bLS) return aLS - bLS;
    if (a.enabled !== b.enabled) return a.enabled ? -1 : 1;
    return a.name.localeCompare(b.name);
  });

  // Empty state
  if (!filtered.length) {
    gridEl.innerHTML = '<div class="empty-state">' +
      (searchQuery ? 'No extensions match your search \u2728' : 'Just you and me \u2728 \u2014 install some extensions!') +
      '</div>';
    return;
  }

  gridEl.innerHTML = filtered.map(createCard).join('');

  // Toggle listeners
  gridEl.querySelectorAll('.toggle-input:not([disabled])').forEach(input => {
    input.addEventListener('change', e => {
      toggleExtension(e.target.dataset.extId, e.target.checked, e.target.dataset.extName);
    });
  });

  // Icon error fallbacks
  gridEl.querySelectorAll('.card-icon img').forEach(img => {
    img.addEventListener('error', () => {
      img.style.display = 'none';
      img.parentElement.classList.add('fallback-icon');
    });
  });
}

function createCard(ext) {
  const cat = categorize(ext);
  const catObj = CATEGORIES.find(c => c.id === cat);
  const isLS = isLoveSpark(ext);
  const isSelf = ext.id === SELF_ID;
  const iconUrl = getExtIcon(ext);

  const iconHtml = iconUrl
    ? '<img src="' + iconUrl + '" alt="" width="48" height="48">'
    : '';

  let toggleHtml;
  if (isSelf) {
    toggleHtml = '<span class="self-badge">That\'s me! \u2728</span>';
  } else if (!ext.mayDisable) {
    toggleHtml = '<label class="toggle-wrap disabled" title="Managed by your organization">' +
      '<input type="checkbox" class="toggle-input" checked disabled>' +
      '<span class="toggle-track"><span class="toggle-knob"></span></span></label>';
  } else {
    toggleHtml = '<label class="toggle-wrap">' +
      '<input type="checkbox" class="toggle-input" data-ext-id="' + ext.id + '" data-ext-name="' + escapeHtml(ext.name) + '"' + (ext.enabled ? ' checked' : '') + '>' +
      '<span class="toggle-track"><span class="toggle-knob"></span></span></label>';
  }

  return '<div class="ext-card' + (isLS ? ' ls-card' : '') + (!ext.enabled ? ' disabled-card' : '') + '">' +
    '<div class="card-top">' +
      '<div class="card-icon' + (!iconUrl ? ' fallback-icon' : '') + '">' + iconHtml + '</div>' +
      '<div class="card-info">' +
        '<div class="card-name">' + (isLS ? '<span class="ls-sparkle">\u2728</span> ' : '') + escapeHtml(ext.name) + '</div>' +
        '<div class="card-version">v' + escapeHtml(ext.version) + '</div>' +
      '</div>' +
      toggleHtml +
    '</div>' +
    '<div class="card-desc">' + escapeHtml(ext.description || 'No description') + '</div>' +
    '<span class="cat-badge badge-' + cat + '">' + catObj.label + '</span>' +
  '</div>';
}

// ── Actions ───────────────────────────────────────────────────────────────────

async function toggleExtension(extId, newState, extName) {
  try {
    await chrome.management.setEnabled(extId, newState);
    showToast(extName + (newState ? ' enabled \u2728' : ' disabled'), 'success');
  } catch (err) {
    showToast('Failed: ' + err.message, 'error');
    const cb = gridEl.querySelector('.toggle-input[data-ext-id="' + extId + '"]');
    if (cb) cb.checked = !newState;
  }
}

function showToast(message, type) {
  const el = document.createElement('div');
  el.className = 'toast toast-' + type;
  el.textContent = message;
  toastsEl.appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.add('hide');
    el.addEventListener('transitionend', () => el.remove());
  }, 2500);
}

// ── Events ────────────────────────────────────────────────────────────────────

searchInput.addEventListener('input', e => {
  searchQuery = e.target.value.trim().toLowerCase();
  render();
});

tabsEl.addEventListener('click', e => {
  const tab = e.target.closest('.cat-tab');
  if (!tab) return;
  activeCategory = tab.dataset.cat;
  render();
});

chrome.management.onInstalled.addListener(loadExtensions);
chrome.management.onUninstalled.addListener(loadExtensions);
chrome.management.onEnabled.addListener(loadExtensions);
chrome.management.onDisabled.addListener(loadExtensions);

// ── Init ──────────────────────────────────────────────────────────────────────

loadExtensions();
