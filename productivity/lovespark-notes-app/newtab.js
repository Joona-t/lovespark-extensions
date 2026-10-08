'use strict';

/* ── Helpers ───────────────────────────────────────── */
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function wordCount(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).length;
}

function timeAgo(ts) {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm';
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return hrs + 'h';
  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 30) return days + 'd';
  return new Date(ts).toLocaleDateString();
}

function debounce(fn, ms) {
  let timer;
  return function (...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), ms);
  };
}

function el(tag, className, textContent) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (textContent !== undefined) node.textContent = textContent;
  return node;
}

/* ── Storage Layer ─────────────────────────────────── */
const DB = {
  async getIndex() {
    const { note_index } = await chrome.storage.local.get('note_index');
    return note_index || [];
  },

  async setIndex(index) {
    await chrome.storage.local.set({ note_index: index });
  },

  async getContent(id) {
    const key = 'note_' + id;
    const result = await chrome.storage.local.get(key);
    return result[key] || '';
  },

  async setContent(id, content) {
    await chrome.storage.local.set({ ['note_' + id]: content });
  },

  async deleteContent(id) {
    await chrome.storage.local.remove('note_' + id);
  },

  async getPrefs() {
    const { prefs } = await chrome.storage.local.get('prefs');
    return Object.assign({
      viewMode: 'list',
      sortOrder: 'updatedAt',
      activeCategory: 'all',
    }, prefs || {});
  },

  async setPrefs(patch) {
    const prefs = await DB.getPrefs();
    Object.assign(prefs, patch);
    await chrome.storage.local.set({ prefs });
    return prefs;
  },
};

/* ── State ─────────────────────────────────────────── */
const state = {
  index: [],
  prefs: {},
  selectedId: null,
  searchQuery: '',
};

/* ── Category Colors ───────────────────────────────── */
const CAT_COLORS = {
  idea: '#fbbf24',
  project: '#60a5fa',
  someday: '#a78bfa',
  daily: '#34d399',
  uncategorized: null,
};

/* ── Welcome Note ──────────────────────────────────── */
const WELCOME_NOTE = {
  title: 'Welcome to LoveSpark Notes',
  content: 'Hey bestie! Your notes live here, safe and sound.\n\nEverything is saved automatically \u2014 no account, no tracking, no ads. Just your ideas.\n\nUse the category tabs to organise your notes:\n  \u2022 Idea: for sparks of inspiration\n  \u2022 Project: for ongoing work\n  \u2022 Someday: for things you\'ll get to later\n  \u2022 Daily: for daily brain dumps\n\nNow go capture those ideas!',
  category: 'idea',
  tags: ['welcome'],
};

/* ── Boot ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  LoveSparkTheme.init();

  state.index = await DB.getIndex();
  state.prefs = await DB.getPrefs();

  if (state.index.length === 0) {
    await createNote(WELCOME_NOTE);
  }

  applyPrefs();
  renderList();
  bindEvents();
});

/* ── Apply Preferences ─────────────────────────────── */
function applyPrefs() {
  const listBtn = document.getElementById('viewList');
  const gridBtn = document.getElementById('viewGrid');
  listBtn.classList.toggle('active', state.prefs.viewMode === 'list');
  gridBtn.classList.toggle('active', state.prefs.viewMode === 'grid');
  listBtn.setAttribute('aria-checked', String(state.prefs.viewMode === 'list'));
  gridBtn.setAttribute('aria-checked', String(state.prefs.viewMode === 'grid'));

  document.getElementById('noteList').classList.toggle('grid', state.prefs.viewMode === 'grid');

  document.querySelectorAll('.cat-tab').forEach(tab => {
    const active = tab.dataset.cat === state.prefs.activeCategory;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-selected', String(active));
  });
}

/* ── Filtering & Sorting ───────────────────────────── */
function getFilteredNotes() {
  const cat = state.prefs.activeCategory;
  const q = state.searchQuery.toLowerCase();

  return state.index
    .filter(n => {
      if (n.deletedAt) return false;
      if (cat !== 'all' && n.category !== cat) return false;
      if (q) {
        const inTitle = (n.title || '').toLowerCase().includes(q);
        const inTags = n.tags.some(t => t.toLowerCase().includes(q));
        const inSnippet = (n.snippet || '').toLowerCase().includes(q);
        if (!inTitle && !inTags && !inSnippet) return false;
      }
      return true;
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      const key = state.prefs.sortOrder || 'updatedAt';
      if (key === 'title') return (a.title || '').localeCompare(b.title || '');
      return (b[key] || 0) - (a[key] || 0);
    });
}

/* ── Build Note Card (safe DOM) ────────────────────── */
function buildNoteCard(note) {
  const card = el('div', 'note-card');
  card.dataset.id = note.id;
  card.setAttribute('role', 'option');
  card.setAttribute('aria-selected', String(note.id === state.selectedId));

  if (note.id === state.selectedId) card.classList.add('selected');

  const accent = CAT_COLORS[note.category];
  if (accent) card.style.setProperty('--card-accent', accent);

  card.appendChild(el('div', 'note-card-title', note.title || 'Untitled'));

  const metaDiv = el('div', 'note-card-meta');
  if (note.pinned) metaDiv.appendChild(el('span', 'note-card-pin', 'PIN'));
  metaDiv.appendChild(el('span', null, timeAgo(note.updatedAt)));
  if (note.tags[0]) metaDiv.appendChild(el('span', 'note-card-tag', '#' + note.tags[0]));
  card.appendChild(metaDiv);

  if (note.snippet) card.appendChild(el('div', 'note-card-snippet', note.snippet));

  return card;
}

/* ── Render List ───────────────────────────────────── */
function renderList() {
  const container = document.getElementById('noteList');
  const countEl = document.getElementById('noteCount');
  const filtered = getFilteredNotes();

  container.textContent = '';

  if (filtered.length === 0) {
    const empty = el('div', 'editor-empty');
    empty.style.padding = '40px 0';
    empty.appendChild(el('p', 'editor-empty-text',
      state.searchQuery ? 'No notes match your search.' : 'No notes yet. Tap + to start!'));
    container.appendChild(empty);
    countEl.textContent = '';
    return;
  }

  const frag = document.createDocumentFragment();
  filtered.forEach(n => frag.appendChild(buildNoteCard(n)));
  container.appendChild(frag);

  const total = state.index.filter(n => !n.deletedAt).length;
  const showing = filtered.length;
  countEl.textContent = showing < total
    ? showing + ' of ' + total + ' notes'
    : total + ' note' + (total === 1 ? '' : 's');
}

/* ── Select Note ───────────────────────────────────── */
async function selectNote(id) {
  state.selectedId = id;
  renderList();

  const emptyEl = document.getElementById('editorEmpty');
  const activeEl = document.getElementById('editorActive');

  if (!id) {
    emptyEl.classList.remove('hidden');
    activeEl.classList.add('hidden');
    return;
  }

  const note = state.index.find(n => n.id === id);
  if (!note) return;

  const content = await DB.getContent(id);

  emptyEl.classList.add('hidden');
  activeEl.classList.remove('hidden');

  document.getElementById('editorTitle').value = note.title || '';
  document.getElementById('editorContent').value = content;
  document.getElementById('editorCategory').value = note.category || 'uncategorized';
  document.getElementById('editorWordCount').textContent = (note.wordCount || 0) + 'w';
  document.getElementById('editorTime').textContent = timeAgo(note.updatedAt);

  const pinBtn = document.getElementById('editorPin');
  pinBtn.classList.toggle('pinned', !!note.pinned);
  pinBtn.title = note.pinned ? 'Unpin' : 'Pin';

  renderEditorTags(note.tags);
}

/* ── Render Editor Tags (safe DOM) ─────────────────── */
function renderEditorTags(tags) {
  const container = document.getElementById('editorTags');
  container.textContent = '';

  tags.forEach(t => {
    const span = el('span', 'editor-tag', '#' + t);
    const removeBtn = el('button', 'editor-tag-remove', '\u00d7');
    removeBtn.dataset.tag = t;
    removeBtn.setAttribute('aria-label', 'Remove tag ' + t);
    span.appendChild(removeBtn);
    container.appendChild(span);
  });
}

/* ── CRUD ──────────────────────────────────────────── */
async function createNote(overrides) {
  const now = Date.now();
  const content = (overrides && overrides.content) || '';
  const activeCat = state.prefs.activeCategory;
  const defaultCat = activeCat === 'all' ? 'uncategorized' : activeCat;

  const note = {
    id: genId(),
    title: (overrides && overrides.title) || '',
    category: (overrides && overrides.category) || defaultCat,
    tags: (overrides && overrides.tags) || [],
    pinned: false,
    wordCount: wordCount(content),
    snippet: content.replace(/\n/g, ' ').trim().slice(0, 120),
    createdAt: now,
    updatedAt: now,
    deletedAt: null,
  };

  await DB.setContent(note.id, content);
  state.index.unshift(note);
  await DB.setIndex(state.index);

  renderList();
  await selectNote(note.id);
  document.getElementById('editorTitle').focus();
  return note;
}

async function updateNote(id, patch) {
  const note = state.index.find(n => n.id === id);
  if (!note) return;

  Object.assign(note, patch, { updatedAt: Date.now() });

  if (patch.content !== undefined) {
    note.wordCount = wordCount(patch.content);
    note.snippet = patch.content.replace(/\n/g, ' ').trim().slice(0, 120);
    await DB.setContent(id, patch.content);
  }

  await DB.setIndex(state.index);
  renderList();

  if (id === state.selectedId) {
    document.getElementById('editorWordCount').textContent = note.wordCount + 'w';
    document.getElementById('editorTime').textContent = timeAgo(note.updatedAt);
    const pinBtn = document.getElementById('editorPin');
    pinBtn.classList.toggle('pinned', !!note.pinned);
    pinBtn.title = note.pinned ? 'Unpin' : 'Pin';
  }
}

async function deleteNote(id) {
  state.index = state.index.filter(n => n.id !== id);
  await DB.deleteContent(id);
  await DB.setIndex(state.index);

  if (state.selectedId === id) {
    state.selectedId = null;
    selectNote(null);
  }
  renderList();
}

/* ── Delete Confirmation (safe DOM) ────────────────── */
function confirmDelete(id) {
  const note = state.index.find(n => n.id === id);
  if (!note) return;

  const overlay = el('div', 'confirm-overlay');
  const dialog = el('div', 'confirm-dialog');
  dialog.setAttribute('role', 'alertdialog');
  dialog.setAttribute('aria-labelledby', 'confirm-title');
  dialog.setAttribute('aria-describedby', 'confirm-desc');

  const title = el('h3', null, 'Delete note?');
  title.id = 'confirm-title';

  const desc = el('p', null, '\u201c' + (note.title || 'Untitled').slice(0, 40) + '\u201d will be permanently deleted.');
  desc.id = 'confirm-desc';

  const actions = el('div', 'confirm-actions');

  const cancelBtn = el('button', 'confirm-btn', 'Cancel');
  cancelBtn.addEventListener('click', () => overlay.remove());

  const deleteBtn = el('button', 'confirm-btn confirm-btn-danger', 'Delete');
  deleteBtn.addEventListener('click', async () => {
    await deleteNote(id);
    overlay.remove();
  });

  actions.appendChild(cancelBtn);
  actions.appendChild(deleteBtn);
  dialog.appendChild(title);
  dialog.appendChild(desc);
  dialog.appendChild(actions);
  overlay.appendChild(dialog);

  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);
  cancelBtn.focus();
}

/* ── Event Bindings ────────────────────────────────── */
function bindEvents() {
  document.getElementById('noteList').addEventListener('click', (e) => {
    const card = e.target.closest('.note-card');
    if (card) selectNote(card.dataset.id);
  });

  document.getElementById('fabNew').addEventListener('click', () => {
    const cat = state.prefs.activeCategory === 'all' ? 'uncategorized' : state.prefs.activeCategory;
    createNote({ category: cat });
  });

  document.querySelector('.category-tabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.cat-tab');
    if (!tab) return;
    state.prefs.activeCategory = tab.dataset.cat;
    DB.setPrefs({ activeCategory: state.prefs.activeCategory });
    applyPrefs();
    renderList();
  });

  document.getElementById('viewList').addEventListener('click', () => setViewMode('list'));
  document.getElementById('viewGrid').addEventListener('click', () => setViewMode('grid'));

  // Search
  const searchInput = document.getElementById('searchInput');
  const searchClear = document.getElementById('searchClear');

  const debouncedSearch = debounce((q) => {
    state.searchQuery = q;
    renderList();
  }, 150);

  searchInput.addEventListener('input', () => {
    const q = searchInput.value;
    searchClear.classList.toggle('hidden', !q);
    debouncedSearch(q);
  });

  searchClear.addEventListener('click', () => {
    searchInput.value = '';
    searchClear.classList.add('hidden');
    state.searchQuery = '';
    renderList();
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      searchInput.focus();
      searchInput.select();
    }
    if ((e.metaKey || e.ctrlKey) && e.key === 'n') {
      e.preventDefault();
      const cat = state.prefs.activeCategory === 'all' ? 'uncategorized' : state.prefs.activeCategory;
      createNote({ category: cat });
    }
    if (e.key === 'Escape') {
      if (document.activeElement === searchInput && searchInput.value) {
        searchInput.value = '';
        searchClear.classList.add('hidden');
        state.searchQuery = '';
        renderList();
      } else if (state.selectedId) {
        selectNote(null);
      }
    }
  });

  // Editor: title
  const titleInput = document.getElementById('editorTitle');
  const debouncedTitle = debounce((val) => {
    if (state.selectedId) updateNote(state.selectedId, { title: val });
  }, 400);
  titleInput.addEventListener('input', () => debouncedTitle(titleInput.value));

  // Editor: content
  const contentInput = document.getElementById('editorContent');
  const debouncedContent = debounce((val) => {
    if (state.selectedId) updateNote(state.selectedId, { content: val });
  }, 400);
  contentInput.addEventListener('input', () => debouncedContent(contentInput.value));

  // Editor: category
  document.getElementById('editorCategory').addEventListener('change', (e) => {
    if (state.selectedId) updateNote(state.selectedId, { category: e.target.value });
  });

  // Editor: pin
  document.getElementById('editorPin').addEventListener('click', () => {
    if (!state.selectedId) return;
    const note = state.index.find(n => n.id === state.selectedId);
    if (note) updateNote(state.selectedId, { pinned: !note.pinned });
  });

  // Editor: delete
  document.getElementById('editorDelete').addEventListener('click', () => {
    if (state.selectedId) confirmDelete(state.selectedId);
  });

  // Editor: tags
  const tagInput = document.getElementById('editorTagInput');
  tagInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTagFromInput(tagInput);
    }
    if (e.key === 'Backspace' && !tagInput.value) {
      const note = state.index.find(n => n.id === state.selectedId);
      if (note && note.tags.length > 0) {
        const newTags = note.tags.slice(0, -1);
        updateNote(state.selectedId, { tags: newTags });
        renderEditorTags(newTags);
      }
    }
  });

  document.getElementById('editorTags').addEventListener('click', (e) => {
    const btn = e.target.closest('.editor-tag-remove');
    if (!btn) return;
    const tag = btn.dataset.tag;
    const note = state.index.find(n => n.id === state.selectedId);
    if (!note) return;
    const newTags = note.tags.filter(t => t !== tag);
    updateNote(state.selectedId, { tags: newTags });
    renderEditorTags(newTags);
  });
}

/* ── Add Tag Helper ────────────────────────────────── */
function addTagFromInput(input) {
  const raw = input.value.trim().toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 20);
  input.value = '';
  if (!raw) return;

  const note = state.index.find(n => n.id === state.selectedId);
  if (!note || note.tags.includes(raw)) return;

  const newTags = [...note.tags, raw];
  updateNote(state.selectedId, { tags: newTags });
  renderEditorTags(newTags);
}

/* ── View Mode ─────────────────────────────────────── */
function setViewMode(mode) {
  state.prefs.viewMode = mode;
  DB.setPrefs({ viewMode: mode });
  applyPrefs();
  renderList();
}
