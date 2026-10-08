// LoveSpark Focus Pro — settings.js
// All DOM via createElement/textContent. Safe DOM API only.
'use strict';

// ── DOM refs ─────────────────────────────────────────────────────────────────

var inpFocus = document.getElementById('inp-focus');
var inpShort = document.getElementById('inp-short');
var inpLong = document.getElementById('inp-long');
var togAutoBreak = document.getElementById('tog-auto-break');
var togAutoFocus = document.getElementById('tog-auto-focus');
var togNotifSound = document.getElementById('tog-notif-sound');
var togNotifDesktop = document.getElementById('tog-notif-desktop');
var selSound = document.getElementById('sel-sound');
var inpVolume = document.getElementById('inp-volume');
var volumeDisplay = document.getElementById('volume-display');
var inpAddSite = document.getElementById('inp-add-site');
var btnAddSite = document.getElementById('btn-add-site');
var siteList = document.getElementById('site-list');
var btnImportSites = document.getElementById('btn-import-sites');
var btnExportSites = document.getElementById('btn-export-sites');
var btnExportData = document.getElementById('btn-export-data');
var btnClearData = document.getElementById('btn-clear-data');
var proStatusLabel = document.getElementById('pro-status-label');
var btnManageSub = document.getElementById('btn-manage-sub');
var versionLabel = document.getElementById('version-label');

// ── Save debounce ────────────────────────────────────────────────────────────

var saveTimer = null;

function debounceSave(key, value) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(function() {
    var obj = {};
    obj[key] = value;
    chrome.storage.local.set(obj);
  }, 300);
}

function saveImmediate(key, value) {
  var obj = {};
  obj[key] = value;
  chrome.storage.local.set(obj);
}

// ── Toggle helpers ───────────────────────────────────────────────────────────

function toggleState(btn) {
  var current = btn.getAttribute('aria-checked') === 'true';
  var next = !current;
  btn.setAttribute('aria-checked', String(next));
  return next;
}

function setToggle(btn, val) {
  btn.setAttribute('aria-checked', val ? 'true' : 'false');
}

// ── Load settings ────────────────────────────────────────────────────────────

async function loadSettings() {
  var data = await chrome.runtime.sendMessage({ action: 'GET_STATE' });
  if (!data) return;

  inpFocus.value = data.focusDuration || 25;
  inpShort.value = data.shortBreakDuration || 5;
  inpLong.value = data.longBreakDuration || 15;

  setToggle(togAutoBreak, data.autoStartBreaks !== false);
  setToggle(togAutoFocus, !!data.autoStartFocus);
  setToggle(togNotifSound, data.notifSound !== false);
  setToggle(togNotifDesktop, data.notifDesktop !== false);

  selSound.value = data.activeSound || '';
  inpVolume.value = data.soundVolume != null ? data.soundVolume : 50;
  volumeDisplay.textContent = inpVolume.value + '%';

  renderSiteList(data.blockedSites || []);

  // Pro status
  var isPro = !!data.proStatus;
  proStatusLabel.textContent = isPro ? 'Pro' : 'Free';
  if (isPro) proStatusLabel.classList.add('pro');
  else proStatusLabel.classList.remove('pro');

  // Version from manifest
  var manifest = chrome.runtime.getManifest();
  if (manifest && manifest.version) {
    versionLabel.textContent = manifest.version;
  }
}

// ── Timer inputs ─────────────────────────────────────────────────────────────

inpFocus.addEventListener('change', function() {
  var val = Math.max(1, Math.min(120, parseInt(inpFocus.value, 10) || 25));
  inpFocus.value = val;
  debounceSave('focusDuration', val);
});

inpShort.addEventListener('change', function() {
  var val = Math.max(1, Math.min(30, parseInt(inpShort.value, 10) || 5));
  inpShort.value = val;
  debounceSave('shortBreakDuration', val);
});

inpLong.addEventListener('change', function() {
  var val = Math.max(1, Math.min(60, parseInt(inpLong.value, 10) || 15));
  inpLong.value = val;
  debounceSave('longBreakDuration', val);
});

// ── Toggles ──────────────────────────────────────────────────────────────────

togAutoBreak.addEventListener('click', function() {
  saveImmediate('autoStartBreaks', toggleState(togAutoBreak));
});

togAutoFocus.addEventListener('click', function() {
  saveImmediate('autoStartFocus', toggleState(togAutoFocus));
});

togNotifSound.addEventListener('click', function() {
  saveImmediate('notifSound', toggleState(togNotifSound));
});

togNotifDesktop.addEventListener('click', function() {
  saveImmediate('notifDesktop', toggleState(togNotifDesktop));
});

// ── Sound settings ───────────────────────────────────────────────────────────

selSound.addEventListener('change', function() {
  saveImmediate('activeSound', selSound.value || null);
});

inpVolume.addEventListener('input', function() {
  volumeDisplay.textContent = inpVolume.value + '%';
  debounceSave('soundVolume', parseInt(inpVolume.value, 10));
});

// ── Block list ───────────────────────────────────────────────────────────────

function renderSiteList(sites) {
  while (siteList.firstChild) siteList.removeChild(siteList.firstChild);

  for (var i = 0; i < sites.length; i++) {
    var li = document.createElement('li');
    li.className = 'site-item';

    var span = document.createElement('span');
    span.textContent = sites[i];
    li.appendChild(span);

    var btn = document.createElement('button');
    btn.className = 'site-remove-btn';
    btn.textContent = '\u00D7';
    btn.setAttribute('aria-label', 'Remove ' + sites[i] + ' from block list');
    btn.dataset.site = sites[i];
    btn.addEventListener('click', handleRemoveSite);
    li.appendChild(btn);

    siteList.appendChild(li);
  }
}

async function handleRemoveSite(e) {
  var site = e.currentTarget.dataset.site;
  var result = await chrome.runtime.sendMessage({ action: 'REMOVE_BLOCKED_SITE', site: site });
  if (result && result.ok) {
    renderSiteList(result.sites);
  }
}

async function handleAddSite() {
  var site = inpAddSite.value.trim();
  if (!site) return;

  var result = await chrome.runtime.sendMessage({ action: 'ADD_BLOCKED_SITE', site: site });
  if (result && result.ok) {
    inpAddSite.value = '';
    renderSiteList(result.sites);
  }
}

btnAddSite.addEventListener('click', handleAddSite);
inpAddSite.addEventListener('keydown', function(e) {
  if (e.key === 'Enter') handleAddSite();
});

// ── Import / export block list ───────────────────────────────────────────────

btnExportSites.addEventListener('click', async function() {
  var result = await chrome.runtime.sendMessage({ action: 'GET_BLOCKED_SITES' });
  if (!result) return;
  var text = (result.sites || []).join('\n');
  var blob = new Blob([text], { type: 'text/plain' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'focus-pro-blocklist.txt';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

btnImportSites.addEventListener('click', function() {
  var input = document.createElement('input');
  input.type = 'file';
  input.accept = '.txt,.csv';
  input.addEventListener('change', async function() {
    if (!input.files || !input.files[0]) return;
    var text = await input.files[0].text();
    var lines = text.split(/[\n,;]+/).map(function(s) { return s.trim(); }).filter(Boolean);
    for (var i = 0; i < lines.length; i++) {
      await chrome.runtime.sendMessage({ action: 'ADD_BLOCKED_SITE', site: lines[i] });
    }
    // Reload the list
    var result = await chrome.runtime.sendMessage({ action: 'GET_BLOCKED_SITES' });
    if (result) renderSiteList(result.sites || []);
  });
  input.click();
});

// ── Data export ──────────────────────────────────────────────────────────────

btnExportData.addEventListener('click', async function() {
  var data = await chrome.runtime.sendMessage({ action: 'GET_STATE' });
  if (!data) return;
  var json = JSON.stringify(data, null, 2);
  var blob = new Blob([json], { type: 'application/json' });
  var url = URL.createObjectURL(blob);
  var a = document.createElement('a');
  a.href = url;
  a.download = 'focus-pro-data-' + new Date().toISOString().slice(0, 10) + '.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

// ── Data clear with confirm ──────────────────────────────────────────────────

btnClearData.addEventListener('click', function() {
  showConfirmDialog(
    'Clear All Data?',
    'This will permanently delete all focus history, stats, and settings. This cannot be undone.',
    function() {
      chrome.storage.local.clear(function() {
        loadSettings();
      });
    }
  );
});

function showConfirmDialog(title, text, onConfirm) {
  var overlay = document.createElement('div');
  overlay.className = 'confirm-overlay';
  overlay.setAttribute('role', 'alertdialog');
  overlay.setAttribute('aria-labelledby', 'confirm-title');
  overlay.setAttribute('aria-describedby', 'confirm-text');

  var card = document.createElement('div');
  card.className = 'confirm-card';

  var h2 = document.createElement('h2');
  h2.className = 'confirm-title';
  h2.id = 'confirm-title';
  h2.textContent = title;
  card.appendChild(h2);

  var p = document.createElement('p');
  p.className = 'confirm-text';
  p.id = 'confirm-text';
  p.textContent = text;
  card.appendChild(p);

  var actions = document.createElement('div');
  actions.className = 'confirm-actions';

  var cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn btn-outline';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.addEventListener('click', function() {
    document.body.removeChild(overlay);
  });
  actions.appendChild(cancelBtn);

  var confirmBtn = document.createElement('button');
  confirmBtn.className = 'btn btn-danger';
  confirmBtn.textContent = 'Clear Everything';
  confirmBtn.addEventListener('click', function() {
    document.body.removeChild(overlay);
    onConfirm();
  });
  actions.appendChild(confirmBtn);

  card.appendChild(actions);
  overlay.appendChild(card);
  document.body.appendChild(overlay);

  // Focus the cancel button for keyboard accessibility
  cancelBtn.focus();

  // Close on Escape
  overlay.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      document.body.removeChild(overlay);
    }
  });
}

// ── Account / subscription ───────────────────────────────────────────────────

btnManageSub.addEventListener('click', function() {
  Paywall.showUpgrade();
});

// ── Init ─────────────────────────────────────────────────────────────────────

(function init() {
  if (typeof LoveSparkTheme !== 'undefined') {
    LoveSparkTheme.init();
  }
  loadSettings();
})();
