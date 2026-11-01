// LoveSpark Notes — Service Worker (MV3)
// Stateless. Handles: commands, alarms (version snapshots), tab registration, install.

import { KEY_VERSIONS_PREFIX, MAX_VERSIONS, SYNC_INTERVAL_MINUTES, SYNC_DEBOUNCE_AFTER_SAVE } from './shared/constants.js';

// ── Google Sync (lazy-loaded, Chrome-only) ────────────────────

let _sync = null;
let _syncDebounceTimer = null;

async function getSyncModule() {
  if (_sync) return _sync;
  try {
    const mod = await import('./shared/sync-google.js');
    if (mod.isGoogleSyncSupported()) {
      _sync = mod;
      return _sync;
    }
  } catch (err) {
    // Sync module unavailable (e.g. Firefox without chrome.identity) — sync is optional, run local-only.
    console.debug('[LoveSpark Notes] sync module not loaded:', err);
  }
  return null;
}

// ── Chrome Commands ───────────────────────────────────────────

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'open-popup') {
    // Default popup handles this automatically
    return;
  }

  if (command === 'open-app') {
    await openOrFocusApp();
  }
});

async function openOrFocusApp() {
  try {
    const result = await chrome.storage.session.get('appTab');
    const appTab = result.appTab;

    if (appTab && appTab.tabId) {
      try {
        await chrome.tabs.update(appTab.tabId, { active: true });
        await chrome.windows.update(appTab.windowId, { focused: true });
        return;
      } catch {
        // Tab no longer exists
        await chrome.storage.session.remove('appTab');
      }
    }

    // No existing tab — create new
    await chrome.tabs.create({ url: chrome.runtime.getURL('app/app.html') });
  } catch (err) {
    console.error('LoveSpark Notes: failed to open app', err);
    await chrome.tabs.create({ url: chrome.runtime.getURL('app/app.html') });
  }
}

// ── Message Handlers ──────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'register-app-tab' && sender.tab) {
    chrome.storage.session.set({
      appTab: { tabId: sender.tab.id, windowId: sender.tab.windowId },
    });
    sendResponse({ ok: true });
    return;
  }

  if (msg.type === 'open-app') {
    openOrFocusApp().then(() => sendResponse({ ok: true }));
    return true; // async response
  }

  if (msg.type === 'open-app-with-note') {
    chrome.storage.local.get('ls_prefs', (result) => {
      const prefs = result.ls_prefs || {};
      prefs.pendingFocusId = msg.noteId;
      chrome.storage.local.set({ ls_prefs: prefs }, () => {
        openOrFocusApp().then(() => sendResponse({ ok: true }));
      });
    });
    return true; // async response
  }

  // ── Sync Messages ──
  if (msg.type === 'sync.trigger') {
    handleSyncTrigger(msg).then(r => sendResponse(r));
    return true;
  }
  if (msg.type === 'sync.now') {
    handleSyncNow().then(r => sendResponse(r));
    return true;
  }
  if (msg.type === 'sync.status') {
    handleSyncStatus().then(r => sendResponse(r));
    return true;
  }
  if (msg.type === 'sync.signin') {
    handleSyncSignIn().then(r => sendResponse(r));
    return true;
  }
  if (msg.type === 'sync.signout') {
    handleSyncSignOut().then(r => sendResponse(r));
    return true;
  }
  if (msg.type === 'sync.tombstone') {
    handleSyncTombstone(msg.noteIds).then(r => sendResponse(r));
    return true;
  }
});

// ── Alarms — Version Snapshots ────────────────────────────────

chrome.alarms.create('version-snapshot', { periodInMinutes: 2 });
chrome.alarms.create('google-sync', { periodInMinutes: SYNC_INTERVAL_MINUTES });

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'google-sync') {
    try {
      const sync = await getSyncModule();
      if (!sync) return;
      const status = await sync.getSignInStatus();
      if (status.signedIn) await sync.fullSync();
    } catch (err) {
      console.error('LoveSpark Notes: periodic sync failed', err);
    }
    return;
  }

  if (alarm.name !== 'version-snapshot') return;

  try {
    const result = await chrome.storage.session.get('dirtyNote');
    const dirty = result.dirtyNote;
    if (!dirty || !dirty.id || !dirty.content) return;

    // Load existing versions
    const key = KEY_VERSIONS_PREFIX + dirty.id;
    const versionsResult = await chrome.storage.local.get(key);
    const versions = versionsResult[key] || [];

    // Skip if identical to last version
    if (versions.length > 0 && versions[versions.length - 1].content === dirty.content) {
      return;
    }

    // Append new version
    versions.push({ content: dirty.content, ts: Date.now() });
    if (versions.length > MAX_VERSIONS) versions.shift();

    await chrome.storage.local.set({ [key]: versions });
    await chrome.storage.session.remove('dirtyNote');
  } catch (err) {
    console.error('LoveSpark Notes: version snapshot failed', err);
  }
});

// ── Sync Handlers ────────────────────────────────────────────

async function handleSyncTrigger(msg) {
  const sync = await getSyncModule();
  if (!sync) return { ok: false };

  if (msg.reason === 'manual') {
    try { await sync.fullSync(); } catch (err) {
      // Manual sync failure is surfaced via sync state (lastError); the trigger itself still resolves ok.
      console.debug('[LoveSpark Notes] manual sync failed:', err);
    }
    return { ok: true };
  }

  // Debounced trigger (30s) for post-save syncs
  if (_syncDebounceTimer) clearTimeout(_syncDebounceTimer);
  _syncDebounceTimer = setTimeout(async () => {
    _syncDebounceTimer = null;
    try {
      const status = await sync.getSignInStatus();
      if (status.signedIn) await sync.fullSync();
    } catch (err) {
      console.error('LoveSpark Notes: debounced sync failed', err);
    }
  }, SYNC_DEBOUNCE_AFTER_SAVE);

  return { ok: true };
}

async function handleSyncNow() {
  try {
    const sync = await getSyncModule();
    if (!sync) return { ok: false };
    const result = await sync.fullSync();
    return { ok: true, ...result };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function handleSyncStatus() {
  try {
    const sync = await getSyncModule();
    if (!sync) return { supported: false };

    const status = await sync.getSignInStatus();
    const stateResult = await chrome.storage.local.get('ls_sync_state');
    const state = stateResult.ls_sync_state || {};

    return {
      supported: true,
      signedIn: status.signedIn,
      email: status.email || state.userEmail || null,
      lastSyncTime: state.lastSyncTime || 0,
      lastError: state.lastError || null,
      syncing: false,
    };
  } catch {
    return { supported: false };
  }
}

async function handleSyncSignIn() {
  try {
    const sync = await getSyncModule();
    if (!sync) return { signedIn: false };
    return sync.signIn();
  } catch (err) {
    return { signedIn: false, error: err.message };
  }
}

async function handleSyncSignOut() {
  try {
    const sync = await getSyncModule();
    if (!sync) return { ok: false };
    await sync.signOut();
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

async function handleSyncTombstone(noteIds) {
  try {
    const sync = await getSyncModule();
    if (!sync) return { ok: false };
    const ids = Array.isArray(noteIds) ? noteIds : [noteIds];
    for (const id of ids) {
      await sync.addTombstone(id);
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

// ── Context Menu Web Clipper ──────────────────────────────────

function createContextMenu() {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'save-to-lovespark',
      title: 'Save to LoveSpark Notes',
      contexts: ['selection'],
    });
  });
}

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId !== 'save-to-lovespark') return;

  const selectionText = info.selectionText || '';
  const pageUrl = info.pageUrl || '';
  const timestamp = new Date().toLocaleString('en', {
    weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });

  const content = `> ${selectionText}\n\n— Clipped from ${pageUrl}\n— ${timestamp}`;
  const title = selectionText.slice(0, 50).trim() + (selectionText.length > 50 ? '...' : '');

  // Create note using storage directly (background has no DOM)
  const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  const now = Date.now();

  const noteEntry = {
    id,
    title: title || 'Web Clip',
    category: 'idea',
    pinned: false,
    tags: ['clip'],
    wordCount: content.trim().split(/\s+/).length,
    snippet: content.replace(/\n/g, ' ').trim().slice(0, 80),
    createdAt: now,
    updatedAt: now,
  };

  try {
    // Save content locally
    const contentKey = 'note_' + id;
    await chrome.storage.local.set({ [contentKey]: { id, content } });

    // Update index
    const result = await chrome.storage.local.get('ls_notes_index');
    const index = result.ls_notes_index || { notes: [], version: 1 };
    index.notes.unshift(noteEntry);
    await chrome.storage.local.set({ ls_notes_index: index });
  } catch (err) {
    console.error('LoveSpark Notes: web clip failed', err);
  }
});

// ── Install / Update ──────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async (details) => {
  // Create context menu on install/update
  createContextMenu();

  if (details.reason === 'install') {
    // Create initial alarms
    chrome.alarms.create('version-snapshot', { periodInMinutes: 2 });
    chrome.alarms.create('google-sync', { periodInMinutes: SYNC_INTERVAL_MINUTES });

    // Seed welcome note (deferred to first app/popup open via notes-core.seedWelcomeNote)
    // Migration from localStorage also happens on first page load
  }
});
