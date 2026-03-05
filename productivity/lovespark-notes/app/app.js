// LoveSpark Notes — Full App
// State management, rendering, event binding, keyboard shortcuts.

import { initStorage, getStorage } from '../shared/storage-init.js';
import {
  createNote, updateNote, deleteNote, loadNoteContent,
  togglePin, addTag, removeTag,
  createOrOpenDaily, seedWelcomeNote,
  snapshotVersion, loadVersions, restoreVersion,
  exportNote, exportAllNotes, importNotes, importMarkdownFile,
  garbageCollect, filterNotes, categoryCounts, allTags,
  restoreNote, permanentlyDeleteNote, emptyTrash,
  createFromTemplate,
  exportAllAsZip, getStorageStats,
  extractLinks, buildBacklinks,
} from '../shared/notes-core.js';
import { renderMarkdown } from '../shared/markdown.js';
import {
  formatDate, wordCount, escapeHtml, sanitizeTag, tagColor, autoTitle,
} from '../shared/formatters.js';
import {
  CATEGORIES, FONTS, DEBOUNCE_LOCAL, DEBOUNCE_SYNC,
  DEBOUNCE_LOCALSTORAGE, DEBOUNCE_SEARCH, TEMPLATES,
  KEY_SYNC_STATE,
} from '../shared/constants.js';

// ── State ──────────────────────────────────────────────────────

let index = { notes: [] };
let activeNoteId = null;
let activeContent = '';
let currentCategory = 'all';
let currentSearch = '';
let currentTagFilter = null;
let showPreview = false;
let distractionFree = false;
let contentFont = 'dm-mono';
let versionDrawerOpen = false;
let guideOpen = false;
let previewingVersion = null;
let darkMode = false;
let backlinksCache = {};
let prefs = {};
let isChrome = false;
let syncSignedIn = false;

// Timers
let saveContentTimer = null;
let searchTimer = null;
let covenantTimer = null;
let lastSaveTime = 0;

// ── DOM Cache ──────────────────────────────────────────────────

const $ = (id) => document.getElementById(id);
const dom = {};

function cacheDom() {
  dom.searchInput = $('searchInput');
  dom.categoryNav = $('categoryNav');
  dom.sidebarTags = $('sidebarTags');
  dom.tagFilterList = $('tagFilterList');
  dom.notesList = $('notesList');
  dom.noSelection = $('noSelection');
  dom.editorWrap = $('editorWrap');
  dom.noteTitle = $('noteTitle');
  dom.categoryPills = $('categoryPills');
  dom.currentTags = $('currentTags');
  dom.tagInput = $('tagInput');
  dom.fontSwitcher = $('fontSwitcher');
  dom.btnPin = $('btnPin');
  dom.btnVersions = $('btnVersions');
  dom.versionCount = $('versionCount');
  dom.btnPreview = $('btnPreview');
  dom.btnExport = $('btnExport');
  dom.btnDistraction = $('btnDistraction');
  dom.noteContent = $('noteContent');
  dom.markdownPreview = $('markdownPreview');
  dom.versionDrawer = $('versionDrawer');
  dom.versionList = $('versionList');
  dom.btnCloseVersions = $('btnCloseVersions');
  dom.wordCount = $('wordCount');
  dom.saveCovenant = $('saveCovenant');
  dom.saveIndicator = $('saveIndicator');
  dom.importInput = $('importInput');
  dom.btnNew = $('btnNew');
  dom.btnDaily = $('btnDaily');
  dom.btnExportAll = $('btnExportAll');
  dom.btnImport = $('btnImport');
  dom.themeToggle = $('themeToggle');
  dom.btnHelp = $('btnHelp');
  dom.btnGuideLink = $('btnGuideLink');
  dom.guideOverlay = $('guideOverlay');
  dom.btnCloseGuide = $('btnCloseGuide');
  dom.syncArea = $('syncArea');
  dom.syncSignIn = $('syncSignIn');
  dom.syncUser = $('syncUser');
  dom.syncAvatarBtn = $('syncAvatarBtn');
  dom.syncAvatarInitial = $('syncAvatarInitial');
  dom.syncPulse = $('syncPulse');
  dom.syncDropdown = $('syncDropdown');
  dom.syncEmail = $('syncEmail');
  dom.syncNowBtn = $('syncNowBtn');
  dom.syncLast = $('syncLast');
  dom.syncSignOutBtn = $('syncSignOutBtn');
}

// ── Init ───────────────────────────────────────────────────────

async function init() {
  cacheDom();

  const storage = await initStorage();
  isChrome = typeof chrome !== 'undefined' && !!chrome.storage;

  // Register app tab with service worker
  if (isChrome && chrome.runtime && chrome.runtime.sendMessage) {
    try { chrome.runtime.sendMessage({ type: 'register-app-tab' }); } catch {}
  }

  // Migration + welcome seed
  await storage.migrate();
  await seedWelcomeNote();

  // Phase 1: load index + prefs
  index = await storage.loadIndex();
  prefs = await storage.loadPrefs();
  contentFont = prefs.contentFont || 'dm-mono';
  // Theme: migrate old darkMode pref to new theme system
  let theme = prefs.theme || null;
  if (!theme && prefs.darkMode) theme = 'dark';
  applyTheme(theme || 'retro');
  typingSoundEnabled = prefs.typingSound || false;

  // Determine initial note
  let initialNoteId = null;
  if (prefs.pendingFocusId) {
    initialNoteId = prefs.pendingFocusId;
    await storage.setPref('pendingFocusId', null);
  } else if (prefs.lastEditedId && index.notes.find(n => n.id === prefs.lastEditedId)) {
    initialNoteId = prefs.lastEditedId;
  }

  // Render chrome
  renderCategoryNav();
  renderFontSwitcher();
  renderNotesList();
  renderTagFilters();

  // Phase 2: load active note content
  if (initialNoteId) {
    await selectNote(initialNoteId);
  }

  bindEvents();
  listenForChanges();
  startCovenantTimer();
  garbageCollect().catch(() => {});

  // Sync UI init (Chrome only)
  if (isChrome && typeof chrome.identity !== 'undefined' &&
      typeof chrome.identity.getAuthToken === 'function') {
    dom.syncArea.style.display = '';
    initSyncUI();
  }
}

// ── Rendering: Category Nav ────────────────────────────────────

function renderCategoryNav() {
  const counts = categoryCounts(index.notes);
  let html = `<button class="cat-item${currentCategory === 'all' ? ' active' : ''}" data-cat="all">
    <span class="cat-emoji">📝</span><span>All</span>
    <span class="cat-count">${counts.all}</span>
  </button>`;

  for (const cat of CATEGORIES) {
    html += `<button class="cat-item${currentCategory === cat.id ? ' active' : ''}" data-cat="${cat.id}">
      <span class="cat-emoji">${cat.emoji}</span><span>${cat.label}</span>
      <span class="cat-count">${counts[cat.id] || 0}</span>
    </button>`;
  }

  if (counts.pinned > 0) {
    html += `<div class="cat-divider"></div>`;
    html += `<button class="cat-item${currentCategory === 'pinned' ? ' active' : ''}" data-cat="pinned">
      <span class="cat-emoji">💖</span><span>Pinned</span>
      <span class="cat-count">${counts.pinned}</span>
    </button>`;
  }

  if (counts.trash > 0) {
    html += `<div class="cat-divider"></div>`;
    html += `<button class="cat-item${currentCategory === 'trash' ? ' active' : ''}" data-cat="trash">
      <span class="cat-emoji">🗑️</span><span>Trash</span>
      <span class="cat-count">${counts.trash}</span>
    </button>`;
  }

  dom.categoryNav.innerHTML = html;
}

// ── Rendering: Notes List ──────────────────────────────────────

function getFilteredNotes() {
  let notes = index.notes;

  // Trash view
  if (currentCategory === 'trash') {
    return notes.filter(n => n.deletedAt).sort((a, b) => (b.deletedAt || 0) - (a.deletedAt || 0));
  }

  // Exclude trashed notes
  notes = notes.filter(n => !n.deletedAt);

  if (currentCategory === 'pinned') {
    notes = notes.filter(n => n.pinned);
  } else if (currentCategory !== 'all') {
    notes = notes.filter(n => n.category === currentCategory);
  }

  if (currentSearch) {
    const q = currentSearch;
    notes = notes
      .map(n => {
        const titleScore = fuzzyScore(q, n.title || '');
        const snippetScore = fuzzyScore(q, n.snippet || '');
        const tagScore = Math.max(0, ...(n.tags || []).map(t => fuzzyScore(q, t)));
        const score = Math.max(titleScore, snippetScore, tagScore);
        return { ...n, _searchScore: score };
      })
      .filter(n => n._searchScore > 0);

    // Sort by search score when searching
    return notes.sort((a, b) => b._searchScore - a._searchScore);
  }

  if (currentTagFilter) {
    notes = notes.filter(n => (n.tags || []).includes(currentTagFilter));
  }

  return notes.sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.updatedAt - a.updatedAt;
  });
}

function renderNotesList() {
  const filtered = getFilteredNotes();
  const isTrash = currentCategory === 'trash';

  if (filtered.length === 0) {
    dom.notesList.innerHTML = `<div class="empty-state">
      <span class="emoji">${isTrash ? '🗑️' : '🌸'}</span>
      <span>${currentSearch ? 'No notes match your search' : isTrash ? 'Trash is empty' : 'No notes yet'}</span>
    </div>`;
    return;
  }

  let html = '';

  if (isTrash) {
    html += `<div style="padding:6px 8px;margin-bottom:4px">
      <button class="btn-empty-trash" id="btnEmptyTrash" style="width:100%;padding:6px;background:transparent;border:1px solid var(--ls-glass-border);border-radius:var(--ls-radius-sm);color:var(--ls-text-muted);font-family:var(--ls-font-body);font-size:11px;cursor:pointer">🗑️ Empty Trash</button>
    </div>`;
  }

  for (const note of filtered) {
    const origCat = isTrash ? CATEGORIES.find(c => c.id === note.originalCategory) : CATEGORIES.find(c => c.id === note.category);
    const isActive = note.id === activeNoteId;

    const displayTitle = currentSearch
      ? fuzzyHighlight(currentSearch, note.title || 'Untitled')
      : escapeHtml(note.title || 'Untitled');

    html += `<div class="note-item${isActive ? ' active' : ''}" data-id="${note.id}"${!isTrash && !currentSearch ? ' draggable="true"' : ''}>
      <div class="note-item-title">
        ${note.pinned ? '<span class="note-item-pin">💖</span>' : ''}
        ${displayTitle}
      </div>
      ${note.snippet ? `<div class="note-item-preview">${escapeHtml(note.snippet)}</div>` : ''}
      <div class="note-item-meta">
        <span class="note-item-date">${isTrash ? 'Deleted ' + formatDate(note.deletedAt) : formatDate(note.updatedAt)}</span>
        ${origCat ? `<span class="note-item-cat" style="color:${origCat.color};background:${origCat.bg}">${origCat.emoji} ${origCat.label}</span>` : ''}
      </div>
      ${isTrash
        ? `<button class="note-item-restore" data-id="${note.id}" title="Restore">↩</button>`
        : ''}
      <button class="note-item-delete" data-id="${note.id}" title="${isTrash ? 'Delete forever' : 'Delete'}">×</button>
    </div>`;
  }

  dom.notesList.innerHTML = html;

  // Bind empty trash
  if (isTrash) {
    const emptyBtn = document.getElementById('btnEmptyTrash');
    if (emptyBtn) emptyBtn.addEventListener('click', handleEmptyTrash);
  }
}

function updateActiveNoteInList(entry) {
  if (!entry) return;
  const el = dom.notesList.querySelector(`.note-item[data-id="${entry.id}"]`);
  if (!el) return;

  const titleEl = el.querySelector('.note-item-title');
  if (titleEl) {
    titleEl.innerHTML = `${entry.pinned ? '<span class="note-item-pin">💖</span>' : ''}${escapeHtml(entry.title || 'Untitled')}`;
  }

  const previewEl = el.querySelector('.note-item-preview');
  if (previewEl && entry.snippet) {
    previewEl.textContent = entry.snippet;
  }

  const dateEl = el.querySelector('.note-item-date');
  if (dateEl) dateEl.textContent = formatDate(entry.updatedAt);
}

// ── Rendering: Tag Filters ─────────────────────────────────────

function renderTagFilters() {
  const tags = allTags(index.notes);

  if (tags.length === 0) {
    dom.sidebarTags.style.display = 'none';
    return;
  }

  dom.sidebarTags.style.display = '';
  let html = '';
  for (const tag of tags) {
    const tc = tagColor(tag);
    const active = currentTagFilter === tag;
    html += `<button class="tag-filter${active ? ' active' : ''}" data-tag="${escapeHtml(tag)}"
      style="${active ? `border-color:${tc.color};color:${tc.color}` : ''}"
    >${escapeHtml(tag)}</button>`;
  }

  dom.tagFilterList.innerHTML = html;
}

// ── Rendering: Font Switcher ───────────────────────────────────

function renderFontSwitcher() {
  let html = '';
  for (const font of FONTS) {
    html += `<button class="font-btn${contentFont === font.id ? ' active' : ''}" data-font="${font.id}" title="${font.label}">${font.shortLabel}</button>`;
  }
  dom.fontSwitcher.innerHTML = html;
}

function applyFont(fontId) {
  contentFont = fontId;
  dom.noteContent.setAttribute('data-font', fontId);
  dom.markdownPreview.setAttribute('data-font', fontId);
  renderFontSwitcher();
  getStorage().setPref('contentFont', fontId);
}

// ── Rendering: Category Pills (editor) ─────────────────────────

function renderCategoryPills() {
  const entry = activeNoteId ? index.notes.find(n => n.id === activeNoteId) : null;
  const activeCat = entry ? entry.category : '';

  let html = '';
  for (const cat of CATEGORIES) {
    const active = activeCat === cat.id;
    html += `<button class="cat-pill${active ? ' active' : ''}" data-cat="${cat.id}"
      style="${active ? `color:${cat.color};border-color:${cat.color};background:${cat.bg}` : ''}"
    >${cat.emoji} ${cat.label}</button>`;
  }
  dom.categoryPills.innerHTML = html;
}

// ── Rendering: Current Tags (editor) ───────────────────────────

function renderCurrentTags() {
  const entry = activeNoteId ? index.notes.find(n => n.id === activeNoteId) : null;
  if (!entry || !entry.tags || entry.tags.length === 0) {
    dom.currentTags.innerHTML = '';
    return;
  }

  let html = '';
  for (const tag of entry.tags) {
    const tc = tagColor(tag);
    html += `<span class="tag-chip-removable" data-tag="${escapeHtml(tag)}" style="color:${tc.color};background:${tc.bg}">
      ${escapeHtml(tag)} ×</span>`;
  }
  dom.currentTags.innerHTML = html;
}

// ── Note Selection ─────────────────────────────────────────────

async function selectNote(id) {
  flushPendingSaves();

  activeNoteId = id;
  previewingVersion = null;

  dom.noSelection.style.display = 'none';
  dom.editorWrap.style.display = 'flex';

  // Phase 2 load
  activeContent = await loadNoteContent(id);
  const entry = index.notes.find(n => n.id === id);
  if (!entry) { showNoSelection(); return; }

  dom.noteTitle.value = entry.title || '';
  dom.noteContent.value = activeContent;
  dom.noteContent.setAttribute('data-font', contentFont);
  dom.markdownPreview.setAttribute('data-font', contentFont);

  dom.btnPin.classList.toggle('active', entry.pinned);
  renderCategoryPills();
  renderCurrentTags();
  updateWordCount();
  updateVersionCount();

  // Preview state
  if (showPreview) {
    dom.markdownPreview.innerHTML = renderMarkdown(activeContent);
    dom.markdownPreview.style.display = '';
    dom.noteContent.style.display = 'none';
    dom.btnPreview.classList.add('active');
  } else {
    dom.markdownPreview.style.display = 'none';
    dom.noteContent.style.display = '';
    dom.btnPreview.classList.remove('active');
  }

  closeVersionDrawer();
  renderNotesList();
  renderBacklinks();

  getStorage().setPref('lastEditedId', id);
  markDirty();
}

function showNoSelection() {
  activeNoteId = null;
  activeContent = '';
  previewingVersion = null;
  dom.noSelection.style.display = '';
  dom.editorWrap.style.display = 'none';
  closeVersionDrawer();
}

// ── Save Logic ─────────────────────────────────────────────────

function scheduleContentSave() {
  clearTimeout(saveContentTimer);
  const delay = isChrome ? DEBOUNCE_LOCAL : DEBOUNCE_LOCALSTORAGE;

  saveContentTimer = setTimeout(async () => {
    if (!activeNoteId) return;

    const content = dom.noteContent.value;
    const title = dom.noteTitle.value || autoTitle(content);

    await updateNote(activeNoteId, { content, title });
    index = await getStorage().loadIndex();

    const updated = index.notes.find(n => n.id === activeNoteId);
    updateActiveNoteInList(updated);
    renderCategoryNav();

    flashSaveIndicator();
    lastSaveTime = Date.now();
    markDirty();

    // Trigger sync if signed in
    if (syncSignedIn) {
      chrome.runtime.sendMessage({ type: 'sync.trigger', reason: 'save', source: 'app' }).catch(() => {});
    }
  }, delay);
}

function flushPendingSaves() {
  if (!saveContentTimer) return;
  clearTimeout(saveContentTimer);
  saveContentTimer = null;

  if (activeNoteId) {
    const content = dom.noteContent.value;
    const title = dom.noteTitle.value || autoTitle(content);
    // Fire-and-forget synchronous flush
    updateNote(activeNoteId, { content, title }).then(async () => {
      index = await getStorage().loadIndex();
    });
  }
}

// ── Dirty Note Tracking (version snapshots) ────────────────────

function markDirty() {
  if (!activeNoteId || !isChrome) return;
  try {
    chrome.storage.session.set({
      dirtyNote: { id: activeNoteId, content: dom.noteContent.value, ts: Date.now() },
    });
  } catch {}
}

// ── UI Helpers ─────────────────────────────────────────────────

function updateWordCount() {
  const text = dom.noteContent.value;
  const words = wordCount(text);
  const chars = text.length;
  const readMin = Math.max(1, Math.ceil(words / 200));

  if (distractionFree) {
    dom.wordCount.textContent = `${words} words · ${chars.toLocaleString()} chars · ${readMin} min read`;
  } else {
    dom.wordCount.textContent = `${words} word${words !== 1 ? 's' : ''}`;
  }
}

async function updateVersionCount() {
  if (!activeNoteId) return;
  const versions = await loadVersions(activeNoteId);
  dom.versionCount.textContent = versions.length > 0 ? `v${versions.length}` : '';
}

function flashSaveIndicator() {
  dom.saveIndicator.classList.add('show');
  setTimeout(() => dom.saveIndicator.classList.remove('show'), 1300);
}

function startCovenantTimer() {
  covenantTimer = setInterval(() => {
    if (!lastSaveTime) return;
    const diff = Date.now() - lastSaveTime;
    if (diff < 5000) {
      dom.saveCovenant.textContent = '✦ all notes saved locally';
    } else if (diff < 60000) {
      dom.saveCovenant.textContent = `✦ saved ${Math.floor(diff / 1000)}s ago`;
    } else {
      dom.saveCovenant.textContent = `✦ saved ${Math.floor(diff / 60000)}m ago`;
    }
  }, 3000);
}

function toast(msg) {
  let el = document.querySelector('.toast');
  if (!el) {
    el = document.createElement('div');
    el.className = 'toast';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.classList.remove('show');
  void el.offsetWidth;
  el.classList.add('show');
  setTimeout(() => el.classList.remove('show'), 2500);
}

function downloadFile(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

// ── Version History Drawer ─────────────────────────────────────

async function openVersionDrawer() {
  if (!activeNoteId) return;

  const versions = await loadVersions(activeNoteId);
  versionDrawerOpen = true;
  dom.versionDrawer.style.display = 'flex';
  dom.btnVersions.classList.add('active');

  dom.noteContent.style.opacity = '0.4';
  dom.noteContent.readOnly = true;

  if (versions.length === 0) {
    dom.versionList.innerHTML = `<div class="empty-state">
      <span class="emoji">🕐</span>
      <span>No versions yet</span>
      <span style="font-size:10px">Snapshots are saved every 2 minutes</span>
    </div>`;
    return;
  }

  let html = '';
  for (let i = versions.length - 1; i >= 0; i--) {
    const v = versions[i];
    const wc = wordCount(v.content);
    html += `<div class="version-item" data-idx="${i}">
      <div class="version-item-label">Version ${i + 1}</div>
      <div class="version-item-meta">${formatDate(v.ts)} · ${wc} words</div>
    </div>`;
  }

  dom.versionList.innerHTML = html;
}

function closeVersionDrawer() {
  if (!versionDrawerOpen) return;
  versionDrawerOpen = false;
  dom.versionDrawer.style.display = 'none';
  dom.btnVersions.classList.remove('active');
  dom.noteContent.style.opacity = '';
  dom.noteContent.readOnly = false;

  // Restore content if was previewing a version
  if (previewingVersion !== null && activeNoteId) {
    dom.noteContent.value = activeContent;
    updateWordCount();
    if (showPreview) {
      dom.markdownPreview.innerHTML = renderMarkdown(activeContent);
    }
  }
  previewingVersion = null;
}

async function previewVersion(idx) {
  const versions = await loadVersions(activeNoteId);
  if (idx < 0 || idx >= versions.length) return;

  previewingVersion = idx;
  const v = versions[idx];

  dom.noteContent.value = v.content;
  updateWordCount();
  if (showPreview) {
    dom.markdownPreview.innerHTML = renderMarkdown(v.content);
  }

  // Highlight
  dom.versionList.querySelectorAll('.version-item').forEach(el => {
    el.classList.toggle('active', parseInt(el.dataset.idx) === idx);
  });

  // Restore button
  let restoreBtn = dom.versionList.querySelector('.version-restore');
  if (!restoreBtn) {
    restoreBtn = document.createElement('button');
    restoreBtn.className = 'version-restore';
    dom.versionList.appendChild(restoreBtn);
  }
  restoreBtn.textContent = 'Restore this version';
  restoreBtn.onclick = async () => {
    await restoreVersion(activeNoteId, v.content);
    activeContent = v.content;
    index = await getStorage().loadIndex();
    closeVersionDrawer();
    renderNotesList();
    renderCategoryNav();
    await updateVersionCount();
    toast('Version restored 💖');
  };
}

// ── Markdown Preview ───────────────────────────────────────────

function togglePreview() {
  showPreview = !showPreview;
  if (showPreview) {
    dom.markdownPreview.innerHTML = renderMarkdown(dom.noteContent.value);
    dom.markdownPreview.style.display = '';
    dom.noteContent.style.display = 'none';
    dom.btnPreview.classList.add('active');
  } else {
    dom.markdownPreview.style.display = 'none';
    dom.noteContent.style.display = '';
    dom.btnPreview.classList.remove('active');
  }
}

// ── Distraction-Free Mode ──────────────────────────────────────

function toggleDistractionFree() {
  distractionFree = !distractionFree;
  document.body.classList.toggle('distraction-free', distractionFree);
  dom.btnDistraction.classList.toggle('active', distractionFree);
  updateWordCount();
}

// ── Guide Overlay ──────────────────────────────────────────────

async function openGuide() {
  guideOpen = true;
  dom.guideOverlay.style.display = 'flex';
  dom.btnHelp.classList.add('active');

  // Load storage stats
  const statsEl = document.getElementById('guideStats');
  if (statsEl) {
    try {
      const stats = await getStorageStats();
      statsEl.textContent = `${stats.totalNotes} notes · ${stats.totalWords.toLocaleString()} words · ${stats.tags} tags · ${stats.streak} day streak 🔥${stats.trashedNotes ? ` · ${stats.trashedNotes} in trash` : ''}`;
    } catch {
      statsEl.textContent = '';
    }
  }
}

function closeGuide() {
  if (!guideOpen) return;
  guideOpen = false;
  dom.guideOverlay.style.display = 'none';
  dom.btnHelp.classList.remove('active');
}

// ── Fuzzy Search ─────────────────────────────────────────────

function fuzzyScore(query, text) {
  if (!query || !text) return 0;
  const q = query.toLowerCase();
  const t = text.toLowerCase();

  // Exact substring match scores highest
  if (t.includes(q)) return 100;

  // Fuzzy character matching
  let qi = 0;
  let score = 0;
  let lastIdx = -1;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      score += 10;
      if (lastIdx >= 0 && ti - lastIdx === 1) score += 5; // consecutive bonus
      if (ti === 0 || t[ti - 1] === ' ' || t[ti - 1] === '-') score += 3; // word boundary bonus
      lastIdx = ti;
      qi++;
    }
  }

  return qi === q.length ? score : 0;
}

function fuzzyHighlight(query, text) {
  if (!query || !text) return escapeHtml(text);
  const q = query.toLowerCase();
  const t = text.toLowerCase();

  // For exact substring, highlight the substring
  const idx = t.indexOf(q);
  if (idx >= 0) {
    return escapeHtml(text.slice(0, idx)) +
      '<span class="fuzzy-match">' + escapeHtml(text.slice(idx, idx + q.length)) + '</span>' +
      escapeHtml(text.slice(idx + q.length));
  }

  // Character-by-character fuzzy highlight
  let qi = 0;
  let result = '';
  for (let i = 0; i < text.length; i++) {
    if (qi < q.length && t[i] === q[qi]) {
      result += '<span class="fuzzy-match">' + escapeHtml(text[i]) + '</span>';
      qi++;
    } else {
      result += escapeHtml(text[i]);
    }
  }
  return result;
}

// ── Sparkle Effect ───────────────────────────────────────────

function emitSparkles(x, y) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return;

  const emojis = ['✨', '💖', '🌸', '✦'];
  for (let i = 0; i < 5; i++) {
    const el = document.createElement('span');
    el.className = 'sparkle-particle';
    el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
    el.style.left = (x + (Math.random() - 0.5) * 60) + 'px';
    el.style.top = (y + (Math.random() - 0.5) * 20) + 'px';
    document.body.appendChild(el);
    setTimeout(() => el.remove(), 900);
  }
}

// ── Typing Sound ─────────────────────────────────────────────

let audioCtx = null;
let typingSoundEnabled = false;

function playTypingTick() {
  if (!typingSoundEnabled) return;
  if (!audioCtx) audioCtx = new AudioContext();
  const osc = audioCtx.createOscillator();
  const gain = audioCtx.createGain();
  osc.connect(gain);
  gain.connect(audioCtx.destination);
  osc.frequency.value = 800 + Math.random() * 200;
  osc.type = 'sine';
  gain.gain.value = 0.02;
  gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.05);
  osc.start();
  osc.stop(audioCtx.currentTime + 0.05);
}

// ── Formatting Shortcuts ──────────────────────────────────────

function wrapSelection(textarea, before, after) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selected = text.slice(start, end);

  if (selected) {
    textarea.value = text.slice(0, start) + before + selected + after + text.slice(end);
    textarea.selectionStart = start + before.length;
    textarea.selectionEnd = end + before.length;
  } else {
    textarea.value = text.slice(0, start) + before + after + text.slice(end);
    textarea.selectionStart = textarea.selectionEnd = start + before.length;
  }

  textarea.focus();
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

function insertLink(textarea) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selected = text.slice(start, end);

  if (selected) {
    textarea.value = text.slice(0, start) + '[' + selected + '](url)' + text.slice(end);
    textarea.selectionStart = start + selected.length + 3;
    textarea.selectionEnd = start + selected.length + 6;
  } else {
    textarea.value = text.slice(0, start) + '[text](url)' + text.slice(end);
    textarea.selectionStart = start + 1;
    textarea.selectionEnd = start + 5;
  }

  textarea.focus();
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
}

// ── Floating Format Bar ───────────────────────────────────────

let formatBar = null;

function createFormatBar() {
  formatBar = document.createElement('div');
  formatBar.className = 'format-bar';

  // Build buttons with safe DOM methods (no innerHTML with untrusted content)
  const buttons = [
    { fmt: 'bold', label: 'B', title: 'Bold (Cmd+B)', bold: true },
    { fmt: 'italic', label: 'I', title: 'Italic (Cmd+I)', italic: true },
    { fmt: 'code', label: '</>', title: 'Code' },
    { fmt: 'link', label: '\u{1F517}', title: 'Link (Cmd+K)' },
  ];

  for (const b of buttons) {
    const btn = document.createElement('button');
    btn.dataset.fmt = b.fmt;
    btn.title = b.title;
    btn.textContent = b.label;
    if (b.bold) btn.style.fontWeight = '700';
    if (b.italic) btn.style.fontStyle = 'italic';
    formatBar.appendChild(btn);
  }

  document.body.appendChild(formatBar);

  formatBar.addEventListener('mousedown', (e) => {
    e.preventDefault();
    const btn = e.target.closest('button');
    if (!btn) return;
    const fmt = btn.dataset.fmt;
    if (fmt === 'bold') wrapSelection(dom.noteContent, '**', '**');
    else if (fmt === 'italic') wrapSelection(dom.noteContent, '*', '*');
    else if (fmt === 'code') wrapSelection(dom.noteContent, '`', '`');
    else if (fmt === 'link') insertLink(dom.noteContent);
    hideFormatBar();
  });
}

function showFormatBar() {
  if (!formatBar) createFormatBar();
  const textarea = dom.noteContent;
  if (textarea.selectionStart === textarea.selectionEnd) { hideFormatBar(); return; }

  const rect = textarea.getBoundingClientRect();
  const textBefore = textarea.value.slice(0, textarea.selectionStart);
  const lines = textBefore.split('\n');
  const lineNum = lines.length - 1;
  const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 24;
  const paddingTop = parseInt(getComputedStyle(textarea).paddingTop) || 20;
  const paddingLeft = parseInt(getComputedStyle(textarea).paddingLeft) || 28;

  const top = rect.top + paddingTop + (lineNum * lineHeight) - textarea.scrollTop - 36;
  const left = rect.left + paddingLeft + Math.min(lines[lineNum].length * 8, 200);

  formatBar.style.top = Math.max(rect.top, top) + 'px';
  formatBar.style.left = Math.min(left, rect.right - 160) + 'px';
  formatBar.classList.add('visible');
}

function hideFormatBar() {
  if (formatBar) formatBar.classList.remove('visible');
}

// ── Wiki Link Autocomplete ────────────────────────────────────

let linkDropdown = null;
let linkFilterText = '';

function handleLinkAutocomplete(e) {
  const textarea = dom.noteContent;
  const pos = textarea.selectionStart;
  const text = textarea.value;

  // Check for [[ trigger before cursor
  const before = text.slice(Math.max(0, pos - 50), pos);
  const match = before.match(/\[\[([^\]]*?)$/);

  if (!match) { hideLinkDropdown(); return; }

  linkFilterText = match[1].toLowerCase();
  const notes = index.notes.filter(n =>
    !n.deletedAt && n.id !== activeNoteId &&
    (n.title || '').toLowerCase().includes(linkFilterText)
  ).slice(0, 6);

  if (notes.length === 0) { hideLinkDropdown(); return; }

  if (!linkDropdown) {
    linkDropdown = document.createElement('div');
    linkDropdown.className = 'link-autocomplete';
    document.body.appendChild(linkDropdown);
  }

  linkDropdown.textContent = '';
  for (const note of notes) {
    const item = document.createElement('div');
    item.className = 'link-ac-item';
    item.textContent = note.title || 'Untitled';
    item.dataset.title = note.title || 'Untitled';
    linkDropdown.appendChild(item);
  }

  // Position near caret
  const rect = textarea.getBoundingClientRect();
  const textBefore = text.slice(0, pos);
  const lines = textBefore.split('\n');
  const lineNum = lines.length - 1;
  const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 24;
  const paddingTop = parseInt(getComputedStyle(textarea).paddingTop) || 20;
  const paddingLeft = parseInt(getComputedStyle(textarea).paddingLeft) || 28;

  linkDropdown.style.top = (rect.top + paddingTop + ((lineNum + 1) * lineHeight) - textarea.scrollTop) + 'px';
  linkDropdown.style.left = (rect.left + paddingLeft) + 'px';
  linkDropdown.style.display = 'block';

  // Click handler
  linkDropdown.onclick = (ev) => {
    const item = ev.target.closest('.link-ac-item');
    if (!item) return;
    insertLinkCompletion(item.dataset.title);
  };
}

function insertLinkCompletion(title) {
  const textarea = dom.noteContent;
  const pos = textarea.selectionStart;
  const text = textarea.value;
  const before = text.slice(0, pos);
  const bracketStart = before.lastIndexOf('[[');
  if (bracketStart === -1) return;

  textarea.value = text.slice(0, bracketStart) + '[[' + title + ']]' + text.slice(pos);
  textarea.selectionStart = textarea.selectionEnd = bracketStart + title.length + 4;
  textarea.focus();
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  hideLinkDropdown();
}

function hideLinkDropdown() {
  if (linkDropdown) linkDropdown.style.display = 'none';
}

// ── Backlinks Panel ──────────────────────────────────────────

async function renderBacklinks() {
  let panel = document.getElementById('backlinksPanel');
  if (!activeNoteId) {
    if (panel) panel.style.display = 'none';
    return;
  }

  // Build backlinks on demand
  backlinksCache = await buildBacklinks(index);
  const links = backlinksCache[activeNoteId] || [];

  if (!panel) {
    panel = document.createElement('div');
    panel.id = 'backlinksPanel';
    panel.className = 'backlinks-panel';
    const editorFooter = document.getElementById('editorFooter');
    if (editorFooter) editorFooter.parentNode.insertBefore(panel, editorFooter);
  }

  if (links.length === 0) {
    panel.style.display = 'none';
    return;
  }

  panel.style.display = '';
  panel.textContent = '';

  const header = document.createElement('div');
  header.className = 'backlinks-header';
  header.textContent = `Linked from (${links.length})`;
  panel.appendChild(header);

  for (const bl of links) {
    const item = document.createElement('div');
    item.className = 'backlink-item';
    item.textContent = bl.fromTitle;
    item.dataset.id = bl.fromId;
    item.addEventListener('click', () => selectNote(bl.fromId));
    panel.appendChild(item);
  }
}

// Theme dropdown
const THEMES = ['retro', 'dark', 'beige', 'slate'];
const THEME_NAMES = { retro: 'Retro Pink', dark: 'Dark', beige: 'Beige', slate: 'Slate' };
function applyTheme(t) {
  THEMES.forEach(n => document.body.classList.remove('theme-' + n));
  document.body.classList.add('theme-' + t);
  const label = document.getElementById('themeLabel');
  if (label) label.textContent = THEME_NAMES[t] || t;
  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.theme === t);
  });
}
(function initThemeDropdown() {
  const toggle = document.getElementById('themeToggle');
  const menu = document.getElementById('themeMenu');
  if (toggle && menu) {
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

// ── Mini Calendar ────────────────────────────────────────────

let calYear = new Date().getFullYear();
let calMonth = new Date().getMonth();

function renderCalendar() {
  const wrap = document.getElementById('calendarWrap');
  const cal = document.getElementById('miniCalendar');
  if (!wrap || !cal) return;

  // Only show when viewing daily category
  if (currentCategory !== 'daily') {
    wrap.style.display = 'none';
    return;
  }
  wrap.style.display = '';

  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  const monthName = new Date(calYear, calMonth).toLocaleString('en', { month: 'long', year: 'numeric' });

  // Find daily notes in this month
  const dailyDates = new Set();
  for (const n of index.notes) {
    if (n.category === 'daily' && !n.deletedAt) {
      const d = new Date(n.createdAt).toISOString().slice(0, 10);
      if (d.startsWith(`${calYear}-${String(calMonth + 1).padStart(2, '0')}`)) {
        dailyDates.add(d);
      }
    }
  }

  cal.textContent = '';

  // Header
  const header = document.createElement('div');
  header.className = 'cal-header';

  const prev = document.createElement('button');
  prev.className = 'cal-nav';
  prev.textContent = '‹';
  prev.addEventListener('click', () => { calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; } renderCalendar(); });

  const monthLabel = document.createElement('span');
  monthLabel.className = 'cal-month';
  monthLabel.textContent = monthName;

  const next = document.createElement('button');
  next.className = 'cal-nav';
  next.textContent = '›';
  next.addEventListener('click', () => { calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; } renderCalendar(); });

  header.appendChild(prev);
  header.appendChild(monthLabel);
  header.appendChild(next);
  cal.appendChild(header);

  // Day-of-week headers
  const dows = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  for (const dow of dows) {
    const el = document.createElement('div');
    el.className = 'cal-dow';
    el.textContent = dow;
    cal.appendChild(el);
  }

  // Empty cells before first day
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    empty.className = 'cal-day empty';
    cal.appendChild(empty);
  }

  // Day cells
  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${calYear}-${String(calMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    const el = document.createElement('div');
    el.className = 'cal-day';
    el.textContent = d;

    if (dateStr === todayStr) el.classList.add('today');
    if (dailyDates.has(dateStr)) {
      el.classList.add('has-note');
      el.addEventListener('click', () => {
        // Find and select the daily note for this date
        const note = index.notes.find(n =>
          n.category === 'daily' && !n.deletedAt &&
          new Date(n.createdAt).toISOString().slice(0, 10) === dateStr
        );
        if (note) selectNote(note.id);
      });
    }

    cal.appendChild(el);
  }
}

// ── Template Dropdown ────────────────────────────────────────

let templateDropdownOpen = false;

function toggleTemplateDropdown() {
  templateDropdownOpen = !templateDropdownOpen;
  const dd = document.getElementById('templateDropdown');
  if (!dd) return;

  if (!templateDropdownOpen) { dd.style.display = 'none'; return; }

  dd.textContent = '';
  dd.style.display = 'block';

  for (const t of TEMPLATES) {
    const item = document.createElement('div');
    item.className = 'template-item';

    const emoji = document.createElement('span');
    emoji.className = 'template-item-emoji';
    emoji.textContent = t.emoji;

    const label = document.createElement('span');
    label.textContent = t.label;

    item.appendChild(emoji);
    item.appendChild(label);

    item.addEventListener('click', async () => {
      dd.style.display = 'none';
      templateDropdownOpen = false;
      const entry = await createFromTemplate(t.id);
      if (entry) {
        index = await getStorage().loadIndex();
        renderCategoryNav();
        renderNotesList();
        await selectNote(entry.id);
      }
    });

    dd.appendChild(item);
  }
}

// ── Command Palette + Slash Commands ──────────────────────────

const COMMANDS = [
  { id: 'new-note',     emoji: '✦', label: 'New Note',           shortcut: 'Cmd+N',       action: () => handleNewNote() },
  { id: 'daily',        emoji: '📋', label: 'Daily Brain Dump',  shortcut: 'Cmd+D',       action: () => handleDaily() },
  { id: 'preview',      emoji: '👁', label: 'Toggle Preview',    shortcut: 'Cmd+P',       action: () => { if (activeNoteId) togglePreview(); } },
  { id: 'focus',        emoji: '🧘', label: 'Distraction Free',  shortcut: 'Cmd+Shift+F', action: () => { if (activeNoteId) toggleDistractionFree(); } },
  { id: 'cycle-theme',  emoji: '🎨', label: 'Change Theme',        shortcut: '',             action: () => { const m = document.getElementById('themeMenu'); if (m) m.classList.toggle('open'); } },
  { id: 'export-note',  emoji: '📄', label: 'Export Note',       shortcut: 'Cmd+E',       action: () => handleExportNote() },
  { id: 'export-all',   emoji: '📦', label: 'Export All as ZIP', shortcut: '',             action: () => handleExportAll() },
  { id: 'import',       emoji: '📥', label: 'Import Notes',      shortcut: '',             action: () => dom.importInput.click() },
  { id: 'pin',          emoji: '💖', label: 'Toggle Pin',        shortcut: '',             action: () => handleTogglePin() },
  { id: 'guide',        emoji: '❓', label: 'Show Guide',        shortcut: '',             action: () => openGuide() },
  { id: 'save',         emoji: '💾', label: 'Force Save',        shortcut: 'Cmd+S',       action: () => { flushPendingSaves(); flashSaveIndicator(); lastSaveTime = Date.now(); } },
];

// Template commands
for (const t of TEMPLATES) {
  COMMANDS.push({
    id: 'tpl-' + t.id, emoji: t.emoji, label: 'Template: ' + t.label, shortcut: '',
    action: async () => {
      const entry = await createFromTemplate(t.id);
      if (entry) {
        index = await getStorage().loadIndex();
        renderCategoryNav();
        renderNotesList();
        await selectNote(entry.id);
      }
    },
  });
}

let paletteOpen = false;
let paletteIndex = 0;
let paletteFiltered = [];

function openCommandPalette() {
  paletteOpen = true;
  paletteIndex = 0;
  const overlay = document.getElementById('commandPalette');
  const search = document.getElementById('commandSearch');
  overlay.style.display = 'flex';
  search.value = '';
  search.focus();
  renderCommandList('');
}

function closeCommandPalette() {
  paletteOpen = false;
  document.getElementById('commandPalette').style.display = 'none';
}

function renderCommandList(query) {
  const q = query.toLowerCase();
  paletteFiltered = q
    ? COMMANDS.filter(c => c.label.toLowerCase().includes(q) || c.id.includes(q))
    : COMMANDS;

  paletteIndex = Math.min(paletteIndex, Math.max(0, paletteFiltered.length - 1));

  const list = document.getElementById('commandList');
  list.textContent = '';

  for (let i = 0; i < paletteFiltered.length; i++) {
    const cmd = paletteFiltered[i];
    const item = document.createElement('div');
    item.className = 'command-item' + (i === paletteIndex ? ' active' : '');

    const emoji = document.createElement('span');
    emoji.className = 'command-item-emoji';
    emoji.textContent = cmd.emoji;

    const label = document.createElement('span');
    label.className = 'command-item-label';
    label.textContent = cmd.label;

    item.appendChild(emoji);
    item.appendChild(label);

    if (cmd.shortcut) {
      const shortcut = document.createElement('span');
      shortcut.className = 'command-item-shortcut';
      shortcut.textContent = cmd.shortcut;
      item.appendChild(shortcut);
    }

    item.addEventListener('click', () => {
      closeCommandPalette();
      cmd.action();
    });

    list.appendChild(item);
  }
}

function handlePaletteKeydown(e) {
  if (!paletteOpen) return;

  if (e.key === 'Escape') { closeCommandPalette(); e.preventDefault(); return; }

  if (e.key === 'ArrowDown') {
    e.preventDefault();
    paletteIndex = Math.min(paletteIndex + 1, paletteFiltered.length - 1);
    renderCommandList(document.getElementById('commandSearch').value);
    return;
  }

  if (e.key === 'ArrowUp') {
    e.preventDefault();
    paletteIndex = Math.max(paletteIndex - 1, 0);
    renderCommandList(document.getElementById('commandSearch').value);
    return;
  }

  if (e.key === 'Enter') {
    e.preventDefault();
    if (paletteFiltered[paletteIndex]) {
      closeCommandPalette();
      paletteFiltered[paletteIndex].action();
    }
    return;
  }
}

// Slash commands
const SLASH_COMMANDS = [
  { cmd: '/h1',       emoji: 'H1',  label: 'Heading 1',   insert: '# ' },
  { cmd: '/h2',       emoji: 'H2',  label: 'Heading 2',   insert: '## ' },
  { cmd: '/h3',       emoji: 'H3',  label: 'Heading 3',   insert: '### ' },
  { cmd: '/todo',     emoji: '☐',   label: 'Todo',        insert: '- [ ] ' },
  { cmd: '/code',     emoji: '</>',  label: 'Code Block',  insert: '```\n\n```' },
  { cmd: '/quote',    emoji: '>',   label: 'Blockquote',  insert: '> ' },
  { cmd: '/divider',  emoji: '─',   label: 'Divider',     insert: '\n---\n' },
  { cmd: '/date',     emoji: '📅',  label: 'Insert Date',  insert: null }, // handled specially
  { cmd: '/link',     emoji: '🔗',  label: 'Wiki Link',   insert: '[[]]' },
];

let slashMenu = null;

function handleSlashCommand() {
  const textarea = dom.noteContent;
  const pos = textarea.selectionStart;
  const text = textarea.value;

  // Get text from start of current line to cursor
  const lineStart = text.lastIndexOf('\n', pos - 1) + 1;
  const lineText = text.slice(lineStart, pos);

  // Must be at start of line (optionally with whitespace) followed by /
  const match = lineText.match(/^(\s*)\/(\w*)$/);
  if (!match) { hideSlashMenu(); return; }

  const filter = match[2].toLowerCase();
  const matches = SLASH_COMMANDS.filter(c => c.cmd.slice(1).startsWith(filter));

  if (matches.length === 0) { hideSlashMenu(); return; }

  if (!slashMenu) {
    slashMenu = document.createElement('div');
    slashMenu.className = 'slash-menu';
    document.body.appendChild(slashMenu);
  }

  slashMenu.textContent = '';
  for (const sc of matches) {
    const item = document.createElement('div');
    item.className = 'slash-item';
    const emojiSpan = document.createElement('span');
    emojiSpan.className = 'slash-item-emoji';
    emojiSpan.textContent = sc.emoji;
    item.appendChild(emojiSpan);
    const labelSpan = document.createElement('span');
    labelSpan.textContent = sc.label;
    item.appendChild(labelSpan);

    item.addEventListener('mousedown', (e) => {
      e.preventDefault();
      executeSlashCommand(sc, lineStart, pos);
    });
    slashMenu.appendChild(item);
  }

  // Position
  const rect = textarea.getBoundingClientRect();
  const textBefore = text.slice(0, pos);
  const lines = textBefore.split('\n');
  const lineNum = lines.length - 1;
  const lineHeight = parseInt(getComputedStyle(textarea).lineHeight) || 24;
  const paddingTop = parseInt(getComputedStyle(textarea).paddingTop) || 20;
  const paddingLeft = parseInt(getComputedStyle(textarea).paddingLeft) || 28;

  slashMenu.style.top = (rect.top + paddingTop + ((lineNum + 1) * lineHeight) - textarea.scrollTop) + 'px';
  slashMenu.style.left = (rect.left + paddingLeft) + 'px';
  slashMenu.style.display = 'block';
}

function executeSlashCommand(sc, lineStart, pos) {
  const textarea = dom.noteContent;
  const text = textarea.value;

  let insert = sc.insert;
  if (sc.cmd === '/date') {
    insert = new Date().toLocaleDateString('en', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  }

  // Replace /command with insert text
  const before = text.slice(0, lineStart);
  const after = text.slice(pos);
  textarea.value = before + insert + after;

  // Position cursor
  const cursorPos = lineStart + insert.length;
  if (sc.cmd === '/code') {
    textarea.selectionStart = textarea.selectionEnd = lineStart + 4; // after first ```\n
  } else if (sc.cmd === '/link') {
    textarea.selectionStart = textarea.selectionEnd = cursorPos - 2; // inside [[]]
  } else {
    textarea.selectionStart = textarea.selectionEnd = cursorPos;
  }

  textarea.focus();
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  hideSlashMenu();
}

function hideSlashMenu() {
  if (slashMenu) slashMenu.style.display = 'none';
}

// ── Event Binding ──────────────────────────────────────────────

function bindEvents() {
  // Header
  dom.btnNew.addEventListener('click', handleNewNote);
  dom.btnDaily.addEventListener('click', handleDaily);
  dom.btnExportAll.addEventListener('click', handleExportAll);
  dom.btnImport.addEventListener('click', () => dom.importInput.click());
  dom.importInput.addEventListener('change', handleImport);

  // Template dropdown
  document.getElementById('btnNewDropdown').addEventListener('click', toggleTemplateDropdown);
  document.addEventListener('click', (e) => {
    if (templateDropdownOpen && !e.target.closest('.btn-new-wrap')) {
      templateDropdownOpen = false;
      document.getElementById('templateDropdown').style.display = 'none';
    }
  });

  // Theme dropdown is handled by initThemeDropdown() IIFE above

  // Guide
  dom.btnHelp.addEventListener('click', openGuide);
  dom.btnGuideLink.addEventListener('click', openGuide);
  dom.btnCloseGuide.addEventListener('click', closeGuide);
  dom.guideOverlay.addEventListener('click', (e) => {
    if (e.target === dom.guideOverlay) closeGuide();
  });

  // Search
  dom.searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      currentSearch = dom.searchInput.value.trim();
      renderNotesList();
    }, DEBOUNCE_SEARCH);
  });

  // Category nav
  dom.categoryNav.addEventListener('click', (e) => {
    const item = e.target.closest('.cat-item');
    if (!item) return;
    currentCategory = item.dataset.cat;
    currentTagFilter = null;
    renderCategoryNav();
    renderTagFilters();
    renderNotesList();
    renderCalendar();
  });

  // Tag filters
  dom.tagFilterList.addEventListener('click', (e) => {
    const btn = e.target.closest('.tag-filter');
    if (!btn) return;
    const tag = btn.dataset.tag;
    currentTagFilter = currentTagFilter === tag ? null : tag;
    renderTagFilters();
    renderNotesList();
  });

  // Notes list
  dom.notesList.addEventListener('click', async (e) => {
    const restoreBtn = e.target.closest('.note-item-restore');
    if (restoreBtn) {
      e.stopPropagation();
      await handleRestoreNote(restoreBtn.dataset.id);
      return;
    }
    const delBtn = e.target.closest('.note-item-delete');
    if (delBtn) {
      e.stopPropagation();
      await handleDeleteNote(delBtn.dataset.id);
      return;
    }
    const item = e.target.closest('.note-item');
    if (item) {
      // In trash, clicking a note shows it read-only
      if (currentCategory === 'trash') {
        await selectNote(item.dataset.id);
        dom.noteContent.readOnly = true;
        dom.noteTitle.readOnly = true;
        return;
      }
      await selectNote(item.dataset.id);
    }
  });

  // Drag-and-drop reordering
  dom.notesList.addEventListener('dragstart', (e) => {
    const item = e.target.closest('.note-item');
    if (!item) return;
    item.classList.add('dragging');
    e.dataTransfer.setData('text/plain', item.dataset.id);
    e.dataTransfer.effectAllowed = 'move';
  });

  dom.notesList.addEventListener('dragend', (e) => {
    const item = e.target.closest('.note-item');
    if (item) item.classList.remove('dragging');
    dom.notesList.querySelectorAll('.note-item').forEach(el => el.classList.remove('drag-over'));
  });

  dom.notesList.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    const item = e.target.closest('.note-item');
    dom.notesList.querySelectorAll('.note-item').forEach(el => el.classList.remove('drag-over'));
    if (item && !item.classList.contains('dragging')) item.classList.add('drag-over');
  });

  dom.notesList.addEventListener('drop', async (e) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('text/plain');
    const dropTarget = e.target.closest('.note-item');
    if (!dropTarget || dropTarget.dataset.id === draggedId) return;

    const targetId = dropTarget.dataset.id;
    const dragIdx = index.notes.findIndex(n => n.id === draggedId);
    const targetIdx = index.notes.findIndex(n => n.id === targetId);
    if (dragIdx < 0 || targetIdx < 0) return;

    // Move the note in the index
    const [moved] = index.notes.splice(dragIdx, 1);
    index.notes.splice(targetIdx, 0, moved);
    await getStorage().saveIndex(index);

    renderNotesList();
    dom.notesList.querySelectorAll('.note-item').forEach(el => el.classList.remove('drag-over'));
  });

  // Title
  dom.noteTitle.addEventListener('input', scheduleContentSave);

  // Content input — save + slash + wiki
  dom.noteContent.addEventListener('input', () => {
    if (previewingVersion !== null) return;
    activeContent = dom.noteContent.value;
    updateWordCount();
    scheduleContentSave();
    handleSlashCommand();
    handleLinkAutocomplete();
    playTypingTick();
  });
  dom.noteContent.addEventListener('keydown', (e) => {
    if (linkDropdown && linkDropdown.style.display === 'block') {
      if (e.key === 'Escape') { hideLinkDropdown(); e.preventDefault(); return; }
      if (e.key === 'Tab' || e.key === 'Enter') {
        const first = linkDropdown.querySelector('.link-ac-item');
        if (first) { insertLinkCompletion(first.dataset.title); e.preventDefault(); return; }
      }
    }
  });

  // Wiki link clicks in preview
  dom.markdownPreview.addEventListener('click', (e) => {
    const wikiLink = e.target.closest('.wiki-link');
    if (!wikiLink) return;
    const linkTarget = wikiLink.dataset.link;
    const { resolveLink } = { resolveLink: (title, notes) => {
      const lower = title.toLowerCase();
      const exact = notes.find(n => !n.deletedAt && (n.title || '').toLowerCase() === lower);
      if (exact) return exact.id;
      const prefix = notes.find(n => !n.deletedAt && (n.title || '').toLowerCase().startsWith(lower));
      return prefix ? prefix.id : null;
    }};
    const targetId = resolveLink(linkTarget, index.notes);
    if (targetId) selectNote(targetId);
    else toast(`Note "${linkTarget}" not found`);
  });

  // Format bar on text selection
  dom.noteContent.addEventListener('mouseup', () => {
    if (!showPreview) setTimeout(showFormatBar, 10);
  });
  dom.noteContent.addEventListener('keyup', (e) => {
    if (e.shiftKey && !showPreview) showFormatBar();
    else hideFormatBar();
  });
  document.addEventListener('mousedown', (e) => {
    if (formatBar && !formatBar.contains(e.target)) hideFormatBar();
  });

  // Category pills
  dom.categoryPills.addEventListener('click', async (e) => {
    const pill = e.target.closest('.cat-pill');
    if (!pill || !activeNoteId) return;
    await updateNote(activeNoteId, { category: pill.dataset.cat });
    index = await getStorage().loadIndex();
    renderCategoryPills();
    renderCategoryNav();
    renderNotesList();
    // Remember last category
    getStorage().setPref('lastCategory', pill.dataset.cat);
  });

  // Tag input
  dom.tagInput.addEventListener('keydown', async (e) => {
    if ((e.key === 'Enter' || e.key === ',') && activeNoteId) {
      e.preventDefault();
      const tag = sanitizeTag(dom.tagInput.value);
      if (!tag) return;
      await addTag(activeNoteId, tag);
      dom.tagInput.value = '';
      index = await getStorage().loadIndex();
      renderCurrentTags();
      renderTagFilters();
    }
  });

  // Remove tag
  dom.currentTags.addEventListener('click', async (e) => {
    const chip = e.target.closest('.tag-chip-removable');
    if (!chip || !activeNoteId) return;
    await removeTag(activeNoteId, chip.dataset.tag);
    index = await getStorage().loadIndex();
    renderCurrentTags();
    renderTagFilters();
    renderNotesList();
  });

  // Font switcher
  dom.fontSwitcher.addEventListener('click', (e) => {
    const btn = e.target.closest('.font-btn');
    if (btn) applyFont(btn.dataset.font);
  });

  // Toolbar buttons
  dom.btnPin.addEventListener('click', handleTogglePin);
  dom.btnVersions.addEventListener('click', () => {
    versionDrawerOpen ? closeVersionDrawer() : openVersionDrawer();
  });
  dom.btnCloseVersions.addEventListener('click', closeVersionDrawer);
  dom.btnPreview.addEventListener('click', togglePreview);
  dom.btnExport.addEventListener('click', handleExportNote);
  dom.btnDistraction.addEventListener('click', toggleDistractionFree);

  // Version list
  dom.versionList.addEventListener('click', (e) => {
    const item = e.target.closest('.version-item');
    if (item) previewVersion(parseInt(item.dataset.idx));
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', handleKeydown);

  // Flush on tab hide
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && activeNoteId) {
      flushPendingSaves();
      if (activeContent) {
        snapshotVersion(activeNoteId, activeContent).catch(() => {});
      }
    }
  });

  // Command palette
  document.getElementById('commandSearch').addEventListener('input', (e) => {
    renderCommandList(e.target.value);
  });
  document.getElementById('commandSearch').addEventListener('keydown', handlePaletteKeydown);
  document.getElementById('commandPalette').addEventListener('click', (e) => {
    if (e.target === e.currentTarget) closeCommandPalette();
  });

  // Flush on unload
  window.addEventListener('beforeunload', () => {
    flushPendingSaves();
  });
}

// ── Action Handlers ────────────────────────────────────────────

async function handleNewNote() {
  flushPendingSaves();
  const entry = await createNote({ category: prefs.lastCategory || 'idea' });
  index = await getStorage().loadIndex();
  renderCategoryNav();
  renderNotesList();
  await selectNote(entry.id);
  dom.noteTitle.focus();

  // Sparkle on new note
  const rect = dom.btnNew.getBoundingClientRect();
  emitSparkles(rect.left + rect.width / 2, rect.top + rect.height / 2);
}

async function handleDaily() {
  flushPendingSaves();
  const { entry } = await createOrOpenDaily(prefs.brainDumpMode || 'blank');
  index = await getStorage().loadIndex();
  renderCategoryNav();
  renderNotesList();
  await selectNote(entry.id);
  dom.noteContent.focus();
  dom.noteContent.setSelectionRange(dom.noteContent.value.length, dom.noteContent.value.length);
}

async function handleDeleteNote(id) {
  const entry = index.notes.find(n => n.id === id);
  if (!entry) return;

  if (entry.deletedAt) {
    // Already in trash — permanent delete
    if (!confirm('Permanently delete this note? This cannot be undone.')) return;
    await permanentlyDeleteNote(id);
    // Register tombstone for sync
    chrome.runtime.sendMessage({ type: 'sync.tombstone', noteIds: [id] }).catch(() => {});
  } else {
    // Soft delete to trash
    await deleteNote(id);
    // Register tombstone for sync (soft-delete still needs tombstone to propagate)
    chrome.runtime.sendMessage({ type: 'sync.tombstone', noteIds: [id] }).catch(() => {});
    toast('Moved to trash 🗑️');
  }

  index = await getStorage().loadIndex();
  if (activeNoteId === id) showNoSelection();
  renderCategoryNav();
  renderTagFilters();
  renderNotesList();
}

async function handleRestoreNote(id) {
  await restoreNote(id);
  index = await getStorage().loadIndex();
  if (activeNoteId === id) showNoSelection();
  renderCategoryNav();
  renderTagFilters();
  renderNotesList();
  toast('Note restored 💖');
}

async function handleEmptyTrash() {
  if (!confirm('Permanently delete all trashed notes? This cannot be undone.')) return;
  // Collect trashed note IDs before emptying (for tombstone registration)
  const trashedIds = index.notes.filter(n => n.deletedAt).map(n => n.id);
  const count = await emptyTrash();
  // Register tombstones for all emptied notes
  if (trashedIds.length > 0) {
    chrome.runtime.sendMessage({ type: 'sync.tombstone', noteIds: trashedIds }).catch(() => {});
  }
  index = await getStorage().loadIndex();
  if (activeNoteId) {
    const still = index.notes.find(n => n.id === activeNoteId);
    if (!still) showNoSelection();
  }
  renderCategoryNav();
  renderTagFilters();
  renderNotesList();
  toast(`${count} notes permanently deleted`);
}

async function handleTogglePin() {
  if (!activeNoteId) return;
  const result = await togglePin(activeNoteId);
  if (!result.success) { toast(result.error); return; }
  index = await getStorage().loadIndex();
  dom.btnPin.classList.toggle('active', result.pinned);
  renderCategoryNav();
  renderNotesList();
}

async function handleExportNote() {
  if (!activeNoteId) return;
  const data = await exportNote(activeNoteId, 'md');
  if (data) {
    downloadFile(data.filename, data.content, data.type);
    toast('Note exported 💖');
  }
}

async function handleExportAll() {
  const data = await exportAllAsZip();
  const blob = new Blob([data.content], { type: data.type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = data.filename;
  a.click();
  URL.revokeObjectURL(url);
  const activeCount = index.notes.filter(n => !n.deletedAt).length;
  toast(`Exported ${activeCount} notes as ZIP 📦`);
}

async function handleImport(e) {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const text = await file.text();

    if (file.name.endsWith('.md')) {
      const entry = await importMarkdownFile(file.name, text);
      index = await getStorage().loadIndex();
      renderCategoryNav();
      renderTagFilters();
      renderNotesList();
      await selectNote(entry.id);
      toast('Imported markdown note 💖');
    } else {
      const result = await importNotes(text);
      index = await getStorage().loadIndex();
      renderCategoryNav();
      renderTagFilters();
      renderNotesList();
      toast(`Imported ${result.imported} notes 💖${result.errors ? ` (${result.errors} errors)` : ''}`);
    }
  } catch (err) {
    toast(`Import failed: ${err.message}`);
  }
  dom.importInput.value = '';
}

function handleKeydown(e) {
  const isMeta = e.metaKey || e.ctrlKey;

  if (isMeta && e.key === 'n') {
    e.preventDefault();
    handleNewNote();
    return;
  }

  if (isMeta && e.key === 'd') {
    e.preventDefault();
    handleDaily();
    return;
  }

  if (isMeta && e.key === 'p') {
    e.preventDefault();
    if (activeNoteId) togglePreview();
    return;
  }

  if (isMeta && e.shiftKey && (e.key === 'f' || e.key === 'F')) {
    e.preventDefault();
    if (activeNoteId) toggleDistractionFree();
    return;
  }

  if (isMeta && e.shiftKey && (e.key === 'p' || e.key === 'P')) {
    e.preventDefault();
    paletteOpen ? closeCommandPalette() : openCommandPalette();
    return;
  }

  if (isMeta && e.key === 'e') {
    e.preventDefault();
    handleExportNote();
    return;
  }

  if (isMeta && e.key === 'b') {
    e.preventDefault();
    if (activeNoteId && !showPreview) wrapSelection(dom.noteContent, '**', '**');
    return;
  }

  if (isMeta && e.key === 'i') {
    e.preventDefault();
    if (activeNoteId && !showPreview) wrapSelection(dom.noteContent, '*', '*');
    return;
  }

  if (isMeta && e.key === 'k') {
    e.preventDefault();
    if (activeNoteId && !showPreview) insertLink(dom.noteContent);
    return;
  }

  if (isMeta && e.key === 's') {
    e.preventDefault();
    flushPendingSaves();
    flashSaveIndicator();
    lastSaveTime = Date.now();
    return;
  }

  if (e.key === 'Escape') {
    if (paletteOpen) { closeCommandPalette(); return; }
    if (distractionFree) { toggleDistractionFree(); return; }
    if (guideOpen) { closeGuide(); return; }
    if (versionDrawerOpen) { closeVersionDrawer(); return; }
  }
}

// ── Cross-Context Sync ─────────────────────────────────────────

function listenForChanges() {
  const storage = getStorage();
  if (!storage.onChange) return;

  storage.onChange(async (key, newValue, area) => {
    if (key === 'ls_notes_index' && newValue) {
      index = newValue;
      renderCategoryNav();
      renderTagFilters();
      renderNotesList();

      // If active note was updated externally (sync pulled new data), refresh content
      if (activeNoteId) {
        const entry = index.notes.find(n => n.id === activeNoteId);
        if (entry) {
          const content = await loadNoteContent(activeNoteId);
          if (content !== dom.noteContent.value && !saveContentTimer) {
            dom.noteContent.value = content;
            activeContent = content;
          }
        }
      }
    }

    if (key === 'ls_prefs' && newValue && newValue.pendingFocusId) {
      selectNote(newValue.pendingFocusId);
      getStorage().setPref('pendingFocusId', null);
    }

    // Sync state changes — update sync UI
    if (key === KEY_SYNC_STATE && newValue) {
      updateSyncPulse(newValue);
      if (newValue.lastSyncTime && dom.syncLast) {
        dom.syncLast.textContent = formatSyncTime(newValue.lastSyncTime);
      }
    }
  });
}

// ── Sync UI ───────────────────────────────────────────────────

async function initSyncUI() {
  try {
    const status = await chrome.runtime.sendMessage({ type: 'sync.status' });
    if (!status || !status.supported) {
      dom.syncArea.style.display = 'none';
      return;
    }
    updateSyncUIState(status);
  } catch {
    dom.syncArea.style.display = 'none';
    return;
  }

  // Wire click handlers
  dom.syncSignIn.addEventListener('click', async () => {
    try {
      const result = await chrome.runtime.sendMessage({ type: 'sync.signin' });
      if (result.signedIn) {
        syncSignedIn = true;
        dom.syncSignIn.style.display = 'none';
        dom.syncUser.style.display = '';
        dom.syncAvatarInitial.textContent = (result.email || '?')[0].toUpperCase();
        dom.syncEmail.textContent = result.email || '';
        chrome.runtime.sendMessage({ type: 'sync.trigger', reason: 'manual', source: 'app' }).catch(() => {});
      }
    } catch {}
  });

  dom.syncAvatarBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    dom.syncDropdown.classList.toggle('open');
  });

  document.addEventListener('click', () => {
    dom.syncDropdown.classList.remove('open');
  });

  dom.syncNowBtn.addEventListener('click', async () => {
    dom.syncPulse.className = 'sync-pulse syncing';
    dom.syncDropdown.classList.remove('open');
    try {
      const result = await chrome.runtime.sendMessage({ type: 'sync.now' });
      if (result.ok) {
        dom.syncPulse.className = 'sync-pulse synced';
        dom.syncLast.textContent = 'Just now';
      } else {
        dom.syncPulse.className = 'sync-pulse error';
        dom.syncLast.textContent = result.error || 'Sync failed';
      }
    } catch {
      dom.syncPulse.className = 'sync-pulse error';
    }
  });

  dom.syncSignOutBtn.addEventListener('click', async () => {
    dom.syncDropdown.classList.remove('open');
    try {
      await chrome.runtime.sendMessage({ type: 'sync.signout' });
      syncSignedIn = false;
      dom.syncUser.style.display = 'none';
      dom.syncSignIn.style.display = '';
      dom.syncPulse.className = 'sync-pulse';
    } catch {}
  });
}

function updateSyncUIState(status) {
  syncSignedIn = status.signedIn;
  if (status.signedIn) {
    dom.syncSignIn.style.display = 'none';
    dom.syncUser.style.display = '';
    dom.syncAvatarInitial.textContent = (status.email || '?')[0].toUpperCase();
    dom.syncEmail.textContent = status.email || '';
    dom.syncLast.textContent = status.lastSyncTime ? formatSyncTime(status.lastSyncTime) : 'Never synced';
    updateSyncPulse(status);
  } else {
    dom.syncSignIn.style.display = '';
    dom.syncUser.style.display = 'none';
  }
}

function updateSyncPulse(state) {
  if (!dom.syncPulse) return;
  if (state.syncing) {
    dom.syncPulse.className = 'sync-pulse syncing';
  } else if (state.lastError) {
    dom.syncPulse.className = 'sync-pulse error';
  } else if (state.lastSyncTime) {
    dom.syncPulse.className = 'sync-pulse synced';
  } else {
    dom.syncPulse.className = 'sync-pulse';
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
