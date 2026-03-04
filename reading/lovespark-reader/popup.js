/**
 * LoveSpark Reader — popup.js
 * Direct storage reads/writes. Content scripts react via storage.onChanged.
 */
'use strict';

// Dark mode
browser.storage.local.get(['darkMode']).then(({ darkMode }) => {
  document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
  const btn = document.getElementById('btnDarkMode');
  if (btn) btn.textContent = darkMode ? '☀️' : '🌙';
});
function toggleTheme() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  document.documentElement.setAttribute('data-theme', isDark ? 'light' : 'dark');
  browser.storage.local.set({ darkMode: !isDark });
  const btn = document.getElementById('btnDarkMode');
  if (btn) btn.textContent = isDark ? '🌙' : '☀️';
}
document.getElementById('btnDarkMode').addEventListener('click', toggleTheme);

const pills      = document.querySelectorAll('.mode-pill');
const toggle     = document.getElementById('toggle-enabled');
const statusText = document.getElementById('status-text');
const siteBtn    = document.getElementById('site-toggle');

const STATUS = {
  on:   'pinkifying the internet',
  off:  'paused',
  site: 'disabled on this site',
};

let currentHostname = '';
let siteIsDisabled  = false;

// ── UI helpers ──────────────────────────────────────────────────────────────

function setActiveMode(mode) {
  pills.forEach(pill => {
    pill.setAttribute('aria-pressed', String(pill.dataset.mode === mode));
  });
}

function setEnabled(enabled) {
  toggle.checked = enabled;
  document.body.classList.toggle('disabled', !enabled);
  statusText.textContent = enabled
    ? (siteIsDisabled ? STATUS.site : STATUS.on)
    : STATUS.off;
}

function setSiteDisabled(disabled) {
  siteIsDisabled = disabled;
  siteBtn.textContent = disabled ? 'Re-enable on this site' : 'Disable on this site';
  siteBtn.classList.toggle('site-disabled', disabled);
  if (toggle.checked) {
    statusText.textContent = disabled ? STATUS.site : STATUS.on;
  }
}

// ── Init ────────────────────────────────────────────────────────────────────

async function init() {
  // Get hostname from the active tab's content script
  try {
    const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
    if (tab?.id) {
      const response = await browser.tabs.sendMessage(tab.id, { action: 'getHostname' });
      if (response?.hostname) currentHostname = response.hostname;
    }
  } catch (_) {
    // Restricted page — content script not available
  }

  // Hide site toggle if we couldn't get a hostname (restricted page)
  if (!currentHostname) {
    siteBtn.style.display = 'none';
  }

  // Load state from storage
  const state = await browser.storage.local.get(['enabled', 'mode', 'disabledSites']);
  const enabled = state.enabled !== false;
  const mode = state.mode || 'sakura';
  const disabledSites = state.disabledSites || [];

  setActiveMode(mode);
  setEnabled(enabled);
  setSiteDisabled(disabledSites.includes(currentHostname));
}

// ── Mode pill clicks ────────────────────────────────────────────────────────

pills.forEach(pill => {
  pill.addEventListener('click', async () => {
    const mode = pill.dataset.mode;
    setActiveMode(mode);

    if (!toggle.checked) {
      toggle.checked = true;
      document.body.classList.remove('disabled');
    }
    statusText.textContent = siteIsDisabled ? STATUS.site : STATUS.on;

    await browser.storage.local.set({ mode, enabled: true });
  });
});

// ── Enable/disable toggle ───────────────────────────────────────────────────

toggle.addEventListener('change', async () => {
  const enabled = toggle.checked;
  setEnabled(enabled);
  await browser.storage.local.set({ enabled });
});

// ── Disable on this site ────────────────────────────────────────────────────

siteBtn.addEventListener('click', async () => {
  if (!currentHostname) return;

  const data = await browser.storage.local.get(['disabledSites']);
  const sites = new Set(data.disabledSites || []);

  if (sites.has(currentHostname)) {
    sites.delete(currentHostname);
  } else {
    sites.add(currentHostname);
  }

  const disabledSites = [...sites];
  await browser.storage.local.set({ disabledSites });
  setSiteDisabled(sites.has(currentHostname));
});

init();
