'use strict';

// LoveSparkTheme: this dashboard ships a custom embedded dark retro theme
// instead of the shared LoveSparkTheme switcher — all styles are in
// dashboard.css and the inline <style> block of dashboard.html.

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

function makeEl(tag, opts = {}) {
  const el = document.createElement(tag);
  if (opts.class) el.className = opts.class;
  if (opts.text != null) el.textContent = opts.text;
  if (opts.attrs) {
    for (const [k, v] of Object.entries(opts.attrs)) el.setAttribute(k, v);
  }
  if (opts.data) {
    for (const [k, v] of Object.entries(opts.data)) el.dataset[k] = v;
  }
  return el;
}

function clearChildren(el) {
  while (el.firstChild) el.removeChild(el.firstChild);
}

function emptyStateEl(text) {
  return makeEl('div', { class: 'empty-state', text });
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
    clearChildren(gridEl);
    gridEl.appendChild(emptyStateEl('Error: ' + err.message));
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

  clearChildren(tabsEl);
  tabsEl.appendChild(makeEl('button', {
    class: 'cat-tab' + (activeCategory === 'all' ? ' active' : ''),
    text: 'All',
    data: { cat: 'all' },
  }));
  for (const cat of CATEGORIES) {
    if (!counts[cat.id]) continue;
    tabsEl.appendChild(makeEl('button', {
      class: 'cat-tab' + (activeCategory === cat.id ? ' active' : ''),
      text: cat.label,
      data: { cat: cat.id },
    }));
  }
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

  clearChildren(gridEl);

  // Empty state
  if (!filtered.length) {
    gridEl.appendChild(emptyStateEl(
      searchQuery ? 'No extensions match your search \u2728' : 'Just you and me \u2728 \u2014 install some extensions!'
    ));
    return;
  }

  for (const ext of filtered) gridEl.appendChild(createCard(ext));
}

function buildToggle(ext, isSelf) {
  if (isSelf) {
    return makeEl('span', { class: 'self-badge', text: "That's me! \u2728" });
  }

  const label = makeEl('label', {
    class: ext.mayDisable ? 'toggle-wrap' : 'toggle-wrap disabled',
    attrs: ext.mayDisable ? {} : { title: 'Managed by your organization' },
  });
  const input = makeEl('input', { class: 'toggle-input', attrs: { type: 'checkbox' } });
  if (ext.enabled || !ext.mayDisable) input.checked = true;
  if (!ext.mayDisable) {
    input.disabled = true;
  } else {
    input.dataset.extId = ext.id;
    input.dataset.extName = ext.name;
    input.addEventListener('change', e => {
      toggleExtension(e.target.dataset.extId, e.target.checked, e.target.dataset.extName);
    });
  }
  const track = makeEl('span', { class: 'toggle-track' });
  track.appendChild(makeEl('span', { class: 'toggle-knob' }));
  label.appendChild(input);
  label.appendChild(track);
  return label;
}

function createCard(ext) {
  const cat = categorize(ext);
  const catObj = CATEGORIES.find(c => c.id === cat);
  const isLS = isLoveSpark(ext);
  const isSelf = ext.id === SELF_ID;
  const iconUrl = getExtIcon(ext);

  let cardClass = 'ext-card';
  if (isLS) cardClass += ' ls-card';
  if (!ext.enabled) cardClass += ' disabled-card';
  const card = makeEl('div', { class: cardClass });

  // Top row: icon + info + toggle
  const top = makeEl('div', { class: 'card-top' });
  const iconBox = makeEl('div', { class: iconUrl ? 'card-icon' : 'card-icon fallback-icon' });
  if (iconUrl) {
    const img = makeEl('img', { attrs: { src: iconUrl, alt: '', width: '48', height: '48' } });
    img.addEventListener('error', () => {
      img.style.display = 'none';
      iconBox.classList.add('fallback-icon');
    });
    iconBox.appendChild(img);
  }
  top.appendChild(iconBox);

  const info = makeEl('div', { class: 'card-info' });
  const name = makeEl('div', { class: 'card-name' });
  if (isLS) {
    name.appendChild(makeEl('span', { class: 'ls-sparkle', text: '\u2728' }));
    name.appendChild(document.createTextNode(' '));
  }
  name.appendChild(document.createTextNode(ext.name));
  info.appendChild(name);
  info.appendChild(makeEl('div', { class: 'card-version', text: 'v' + ext.version }));
  top.appendChild(info);

  top.appendChild(buildToggle(ext, isSelf));
  card.appendChild(top);

  card.appendChild(makeEl('div', { class: 'card-desc', text: ext.description || 'No description' }));
  card.appendChild(makeEl('span', { class: 'cat-badge badge-' + cat, text: catObj.label }));
  return card;
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
