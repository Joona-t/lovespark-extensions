'use strict';

/**
 * Sensory Shield — Settings Page
 *
 * Manages global toggle, whitelist, and reset functionality.
 */

const globalToggle = document.getElementById('global-toggle');
const whitelistInput = document.getElementById('whitelist-input');
const whitelistAddBtn = document.getElementById('whitelist-add-btn');
const whitelistList = document.getElementById('whitelist-list');
const resetBtn = document.getElementById('reset-btn');
const resetConfirm = document.getElementById('reset-confirm');
const resetYes = document.getElementById('reset-yes');
const resetNo = document.getElementById('reset-no');

// ── Init ────────────────────────────────────────────────────────────────────

async function init() {
  const data = await browser.storage.local.get(['globalEnabled', 'whitelistedDomains']);

  const enabled = data.globalEnabled !== false;
  globalToggle.classList.toggle('active', enabled);
  globalToggle.setAttribute('aria-checked', String(enabled));

  renderWhitelist(data.whitelistedDomains || []);
}

// ── Global Toggle ───────────────────────────────────────────────────────────

globalToggle.addEventListener('click', function() {
  const on = !globalToggle.classList.contains('active');
  globalToggle.classList.toggle('active', on);
  globalToggle.setAttribute('aria-checked', String(on));
  browser.storage.local.set({ globalEnabled: on });
});

globalToggle.addEventListener('keydown', function(e) {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    globalToggle.click();
  }
});

// ── Whitelist ───────────────────────────────────────────────────────────────

function renderWhitelist(domains) {
  whitelistList.textContent = '';

  if (domains.length === 0) {
    const empty = document.createElement('li');
    empty.className = 'whitelist-empty';
    empty.textContent = 'No whitelisted sites yet';
    whitelistList.appendChild(empty);
    return;
  }

  for (const domain of domains) {
    const li = document.createElement('li');
    li.className = 'whitelist-item';

    const span = document.createElement('span');
    span.textContent = domain;

    const btn = document.createElement('button');
    btn.className = 'whitelist-remove';
    btn.textContent = '\u00D7';
    btn.title = 'Remove ' + domain;
    btn.addEventListener('click', function() {
      removeDomain(domain);
    });

    li.appendChild(span);
    li.appendChild(btn);
    whitelistList.appendChild(li);
  }
}

whitelistAddBtn.addEventListener('click', addDomain);
whitelistInput.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') addDomain();
});

async function addDomain() {
  const raw = whitelistInput.value.trim().toLowerCase();
  if (!raw) return;

  // Strip protocol and path
  let domain = raw;
  try {
    if (raw.includes('://')) {
      domain = new URL(raw).hostname;
    }
  } catch (_) {}
  domain = domain.replace(/^www\./, '');

  if (!domain || domain.indexOf('.') === -1) return;

  const data = await browser.storage.local.get('whitelistedDomains');
  const list = data.whitelistedDomains || [];

  if (list.includes(domain)) {
    whitelistInput.value = '';
    return;
  }

  list.push(domain);
  await browser.storage.local.set({ whitelistedDomains: list });
  whitelistInput.value = '';
  renderWhitelist(list);
}

async function removeDomain(domain) {
  const data = await browser.storage.local.get('whitelistedDomains');
  const list = (data.whitelistedDomains || []).filter(function(d) { return d !== domain; });
  await browser.storage.local.set({ whitelistedDomains: list });
  renderWhitelist(list);
}

// ── Reset ───────────────────────────────────────────────────────────────────

resetBtn.addEventListener('click', function() {
  resetConfirm.classList.remove('hidden');
});

resetNo.addEventListener('click', function() {
  resetConfirm.classList.add('hidden');
});

resetYes.addEventListener('click', async function() {
  // Get all keys, keep only global ones
  const data = await browser.storage.local.get(null);
  const keysToRemove = [];

  for (const key of Object.keys(data)) {
    if (key !== 'globalEnabled' && key !== 'whitelistedDomains' && key !== 'customPreset') {
      keysToRemove.push(key);
    }
  }

  if (keysToRemove.length > 0) {
    await browser.storage.local.remove(keysToRemove);
  }

  // Reset custom preset to defaults
  await browser.storage.local.set({
    customPreset: {
      preset: 'custom',
      reduceMotion: true,
      tintEnabled: true,
      tintColor: '#FDCFE1',
      tintOpacity: 0.1,
      hideGifs: true,
      focusRuler: false,
      cursorSize: false,
      fontComfort: false,
    }
  });

  resetConfirm.classList.add('hidden');
});

// ── Storage Sync ────────────────────────────────────────────────────────────

browser.storage.onChanged.addListener(function(changes, area) {
  if (area !== 'local') return;

  if (changes.globalEnabled) {
    const on = changes.globalEnabled.newValue !== false;
    globalToggle.classList.toggle('active', on);
    globalToggle.setAttribute('aria-checked', String(on));
  }

  if (changes.whitelistedDomains) {
    renderWhitelist(changes.whitelistedDomains.newValue || []);
  }
});

// Start
init();
