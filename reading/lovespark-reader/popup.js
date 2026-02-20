// LoveSpark Reader — popup.js
'use strict';

const pills       = document.querySelectorAll('.mode-pill');
const toggle      = document.getElementById('toggle-enabled');
const statusText  = document.getElementById('status-text');
const siteBtn     = document.getElementById('site-toggle');

const STATUS = {
  on:      'pinkifying the internet',
  off:     'paused',
  site:    'disabled on this site',
};

// ── State ──────────────────────────────────────────────────────────────────

let currentHostname = '';
let siteIsDisabled  = false;

// ── UI helpers ─────────────────────────────────────────────────────────────

function setActiveMode(mode) {
  pills.forEach(pill => {
    const isActive = pill.dataset.mode === mode;
    pill.setAttribute('aria-pressed', String(isActive));
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

// ── Init: load state ────────────────────────────────────────────────────────

chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs[0];
  if (tab?.url) {
    try { currentHostname = new URL(tab.url).hostname; } catch (_) {}
  }

  chrome.runtime.sendMessage({ action: 'getState' }, (state) => {
    if (chrome.runtime.lastError || !state) return;

    setActiveMode(state.mode);
    setEnabled(state.enabled);

    const disabled = (state.disabledSites || []).includes(currentHostname);
    setSiteDisabled(disabled);
  });
});

// ── Mode pill clicks ────────────────────────────────────────────────────────

pills.forEach(pill => {
  pill.addEventListener('click', () => {
    const mode = pill.dataset.mode;
    setActiveMode(mode);

    // Re-enable if currently toggled off
    if (!toggle.checked) {
      toggle.checked = true;
      document.body.classList.remove('disabled');
    }
    statusText.textContent = siteIsDisabled ? STATUS.site : STATUS.on;

    chrome.runtime.sendMessage({ action: 'setMode', mode });
  });
});

// ── Enable/disable toggle ───────────────────────────────────────────────────

toggle.addEventListener('change', () => {
  const enabled = toggle.checked;
  setEnabled(enabled);
  chrome.runtime.sendMessage({ action: 'setEnabled', enabled });
});

// ── Disable on this site ────────────────────────────────────────────────────

siteBtn.addEventListener('click', () => {
  if (!currentHostname) return;

  chrome.runtime.sendMessage(
    { action: 'toggleSite', hostname: currentHostname },
    (response) => {
      if (chrome.runtime.lastError || !response) return;
      setSiteDisabled(response.disabled);
    }
  );
});
