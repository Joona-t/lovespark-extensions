// LoveSpark Notes — Popup (Quick Capture)
// Auto-focused textarea, category pills, auto-save, CMD+Enter→full app.

import { initStorage, getStorage } from '../shared/storage-init.js';
import { createNote, updateNote, loadNoteContent } from '../shared/notes-core.js';
import { autoTitle } from '../shared/formatters.js';
import { CATEGORIES, DEBOUNCE_LOCAL, DEFAULT_CATEGORY, KEY_SYNC_STATE } from '../shared/constants.js';

// Theme dropdown — apply() comes from the shared lib (lib/lovespark-theme.js);
// init stays local to keep the legacy `darkMode` fallback.
const applyTheme = (t) => LoveSparkTheme.apply(t);

// Keep a trigger's aria-expanded in sync with its menu's open state, whatever
// code path opens/closes it (class toggle or inline display).
function syncExpanded(trigger, menu) {
  if (!trigger || !menu) return;
  const update = () => {
    const open = menu.classList.contains('open') && menu.style.display !== 'none';
    trigger.setAttribute('aria-expanded', open ? 'true' : 'false');
  };
  new MutationObserver(update).observe(menu, { attributes: true, attributeFilter: ['class', 'style'] });
  update();
}

(function initThemeDropdown() {
  const toggle = document.getElementById('themeToggle');
  const menu = document.getElementById('themeMenu');
  if (toggle && menu) {
    syncExpanded(toggle, menu);
    toggle.addEventListener('click', (e) => { e.stopPropagation(); menu.classList.toggle('open'); });
    menu.addEventListener('click', (e) => {
      const opt = e.target.closest('.theme-option');
      if (!opt) return;
      const theme = opt.dataset.theme;
      applyTheme(theme);
      chrome.storage.local.set({ theme });
      menu.classList.remove('open');
    });
    document.addEventListener('click', () => menu.classList.remove('open'));
  }
  chrome.storage.local.get(['theme', 'darkMode'], ({ theme, darkMode }) => {
    if (!theme && darkMode) theme = 'dark';
    applyTheme(theme || 'retro');
  });
})();

// ── Sync Feature Detection ────────────────────────────────────

function isSyncSupported() {
  return typeof chrome !== 'undefined' && !!chrome.identity &&
    typeof chrome.identity.getAuthToken === 'function';
}

let syncSignedIn = false;

// ── State ──────────────────────────────────────────────────────

let currentNoteId = null;
let selectedCategory = DEFAULT_CATEGORY;
let saveTimer = null;
let prefs = {};

// ── DOM ────────────────────────────────────────────────────────

const $ = (id) => document.getElementById(id);

// ── Init ───────────────────────────────────────────────────────

async function init() {
  const storage = await initStorage();

  prefs = await storage.loadPrefs();
  selectedCategory = prefs.lastCategory || DEFAULT_CATEGORY;

  // Theme is applied by the top-level theme system code

  renderCategoryPills();

  // Check if we should resume a recent popup note
  await resumeOrCreate();

  bindEvents();

  // Sync UI init
  if (isSyncSupported()) {
    $('syncArea').style.display = '';
    initSyncUI();
  }

  // Auto-focus textarea
  $('noteContent').focus();
}

// ── Resume or Create ───────────────────────────────────────────

async function resumeOrCreate() {
  const storage = getStorage();

  // Check for recent popup note (< 5 min, still untitled)
  if (prefs.lastPopupNoteId) {
    const index = await storage.loadIndex();
    const entry = index.notes.find(n => n.id === prefs.lastPopupNoteId);

    if (entry && !entry.title && (Date.now() - entry.updatedAt < 300000)) {
      currentNoteId = entry.id;
      selectedCategory = entry.category;
      const content = await loadNoteContent(entry.id);
      $('noteContent').value = content;
      renderCategoryPills();
      return;
    }
  }

  // Create new note
  const entry = await createNote({ category: selectedCategory });
  currentNoteId = entry.id;
  await storage.setPref('lastPopupNoteId', currentNoteId);
}

// ── Category Pills ─────────────────────────────────────────────

function renderCategoryPills() {
  const pills = [];
  for (const cat of CATEGORIES) {
    const active = selectedCategory === cat.id;
    const btn = document.createElement('button');
    btn.className = 'cat-pill' + (active ? ' active' : '');
    btn.dataset.cat = cat.id;
    btn.setAttribute('style', active ? `color:${cat.color};border-color:${cat.color};background:${cat.bg}` : '');
    btn.setAttribute('aria-pressed', active ? 'true' : 'false');
    btn.textContent = `${cat.emoji} ${cat.label}`;
    pills.push(btn);
  }
  $('categoryPills').replaceChildren(...pills);
}

// ── Save ───────────────────────────────────────────────────────

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    if (!currentNoteId) return;

    const content = $('noteContent').value;
    const titleEl = $('noteTitle');
    const title = titleEl.style.display !== 'none' ? titleEl.value : '';
    const effectiveTitle = title || autoTitle(content);

    await updateNote(currentNoteId, {
      content,
      title: effectiveTitle,
      category: selectedCategory,
    });

    showSaved();

    // Trigger sync if signed in
    if (syncSignedIn) {
      chrome.runtime.sendMessage({ type: 'sync.trigger', reason: 'save', source: 'popup' }).catch(() => {});
    }
  }, DEBOUNCE_LOCAL);
}

function flushSave() {
  if (!saveTimer) return;
  clearTimeout(saveTimer);
  saveTimer = null;

  if (!currentNoteId) return;
  const content = $('noteContent').value;
  const titleEl = $('noteTitle');
  const title = titleEl.style.display !== 'none' ? titleEl.value : '';
  const effectiveTitle = title || autoTitle(content);

  updateNote(currentNoteId, {
    content,
    title: effectiveTitle,
    category: selectedCategory,
  });
}

function showSaved() {
  const el = $('saveStatus');
  el.textContent = '✦ saved';
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 1300);
}

// ── Events ─────────────────────────────────────────────────────

function bindEvents() {
  // Content input
  $('noteContent').addEventListener('input', scheduleSave);

  // Title input
  $('noteTitle').addEventListener('input', scheduleSave);

  // Title toggle
  $('btnTitle').addEventListener('click', () => {
    const titleInput = $('noteTitle');
    const btn = $('btnTitle');
    titleInput.style.display = '';
    btn.style.display = 'none';
    titleInput.focus();
  });

  // Category pills
  $('categoryPills').addEventListener('click', async (e) => {
    const pill = e.target.closest('.cat-pill');
    if (!pill) return;

    selectedCategory = pill.dataset.cat;
    renderCategoryPills();

    if (currentNoteId) {
      await updateNote(currentNoteId, { category: selectedCategory });
    }

    getStorage().setPref('lastCategory', selectedCategory);
  });

  // Open full app
  $('btnOpen').addEventListener('click', openFullApp);

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    const isMeta = e.metaKey || e.ctrlKey;

    // CMD+Enter → save and open full app
    if (isMeta && e.key === 'Enter') {
      e.preventDefault();
      flushSave();
      openFullApp();
      return;
    }

    // Escape → save and close
    if (e.key === 'Escape') {
      flushSave();
      window.close();
    }
  });

  // Flush on popup close
  window.addEventListener('beforeunload', flushSave);
}

// ── Open Full App ──────────────────────────────────────────────

async function openFullApp() {
  flushSave();

  if (chrome.runtime && chrome.runtime.sendMessage) {
    try {
      await chrome.runtime.sendMessage({
        type: 'open-app-with-note',
        noteId: currentNoteId,
      });
      window.close();
      return;
    } catch {}
  }

  // Fallback: open directly
  const url = chrome.runtime.getURL('app/app.html');
  chrome.tabs.create({ url });
  window.close();
}

// ── Sync UI ───────────────────────────────────────────────────

async function initSyncUI() {
  try {
    const status = await chrome.runtime.sendMessage({ type: 'sync.status' });
    if (!status || !status.supported) {
      $('syncArea').style.display = 'none';
      return;
    }
    updateSyncUI(status);
  } catch {
    $('syncArea').style.display = 'none';
  }

  // Wire click handlers
  $('syncSignIn').addEventListener('click', async () => {
    try {
      const result = await chrome.runtime.sendMessage({ type: 'sync.signin' });
      if (result.signedIn) {
        syncSignedIn = true;
        $('syncSignIn').style.display = 'none';
        $('syncUser').style.display = '';
        $('syncAvatarInitial').textContent = (result.email || '?')[0].toUpperCase();
        $('syncEmail').textContent = result.email || '';
        // Trigger initial sync
        chrome.runtime.sendMessage({ type: 'sync.trigger', reason: 'manual', source: 'popup' }).catch(() => {});
      }
    } catch {}
  });

  syncExpanded($('syncAvatarBtn'), $('syncDropdown'));

  $('syncAvatarBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    $('syncDropdown').classList.toggle('open');
  });

  document.addEventListener('click', () => {
    $('syncDropdown').classList.remove('open');
  });

  $('syncNowBtn').addEventListener('click', async () => {
    $('syncPulse').className = 'sync-pulse syncing';
    $('syncDropdown').classList.remove('open');
    try {
      const result = await chrome.runtime.sendMessage({ type: 'sync.now' });
      if (result.ok) {
        $('syncPulse').className = 'sync-pulse synced';
        $('syncLast').textContent = 'Just now';
      } else {
        $('syncPulse').className = 'sync-pulse error';
        $('syncLast').textContent = result.error || 'Sync failed';
      }
    } catch {
      $('syncPulse').className = 'sync-pulse error';
    }
  });

  $('syncSignOutBtn').addEventListener('click', async () => {
    $('syncDropdown').classList.remove('open');
    try {
      await chrome.runtime.sendMessage({ type: 'sync.signout' });
      syncSignedIn = false;
      $('syncUser').style.display = 'none';
      $('syncSignIn').style.display = '';
      $('syncPulse').className = 'sync-pulse';
    } catch {}
  });

  // Listen for sync state changes
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local' || !changes[KEY_SYNC_STATE]) return;
    const state = changes[KEY_SYNC_STATE].newValue || {};
    updateSyncPulse(state);
    if (state.lastSyncTime) {
      $('syncLast').textContent = formatSyncTime(state.lastSyncTime);
    }
    if (state.lastError) {
      $('syncPulse').className = 'sync-pulse error';
    }
  });
}

function updateSyncUI(status) {
  syncSignedIn = status.signedIn;
  if (status.signedIn) {
    $('syncSignIn').style.display = 'none';
    $('syncUser').style.display = '';
    $('syncAvatarInitial').textContent = (status.email || '?')[0].toUpperCase();
    $('syncEmail').textContent = status.email || '';
    $('syncLast').textContent = status.lastSyncTime ? formatSyncTime(status.lastSyncTime) : 'Never synced';
    updateSyncPulse(status);
  } else {
    $('syncSignIn').style.display = '';
    $('syncUser').style.display = 'none';
  }
}

function updateSyncPulse(state) {
  if (state.syncing) {
    $('syncPulse').className = 'sync-pulse syncing';
  } else if (state.lastError) {
    $('syncPulse').className = 'sync-pulse error';
  } else if (state.lastSyncTime) {
    $('syncPulse').className = 'sync-pulse synced';
  } else {
    $('syncPulse').className = 'sync-pulse';
  }
}

function formatSyncTime(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return new Date(ts).toLocaleDateString();
}

// ── Start ──────────────────────────────────────────────────────

init();

/* ── Author / Ko-fi Footer ── */
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
