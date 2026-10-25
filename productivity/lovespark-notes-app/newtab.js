'use strict';

/* ── Helpers ───────────────────────────────────────── */
function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function wordCount(text) {
  if (!text || !text.trim()) return 0;
  return text.trim().split(/\s+/).filter(w => w !== '\u2022').length;
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

/* ── Categories ────────────────────────────────────── */
// The list lives in prefs.categories so users can add their own. Built-ins
// keep their original ids, so notes saved before custom categories existed
// still match. A note's category is just this id string.
const BUILTIN_CATEGORIES = [
  { id: 'idea',    label: 'Idea',    emoji: '\u{1F4A1}', color: '#fbbf24', builtin: true },
  { id: 'project', label: 'Project', emoji: '\u26A1',    color: '#60a5fa', builtin: true },
  { id: 'someday', label: 'Someday', emoji: '\u{1F319}', color: '#a78bfa', builtin: true },
  { id: 'daily',   label: 'Daily',   emoji: '\u{1F4C5}', color: '#34d399', builtin: true },
];

// Decorative card-stripe colours for custom categories (never behind text).
const CAT_PALETTE = [
  { color: '#fbbf24', name: 'Sunflower' }, { color: '#fb923c', name: 'Peach' },
  { color: '#f472b6', name: 'Pink' },      { color: '#a78bfa', name: 'Lavender' },
  { color: '#60a5fa', name: 'Sky' },       { color: '#2dd4bf', name: 'Mint' },
  { color: '#34d399', name: 'Leaf' },      { color: '#94a3b8', name: 'Pebble' },
];

function getCategories() {
  return state.prefs.categories || BUILTIN_CATEGORIES;
}

function catById(id) {
  return getCategories().find(c => c.id === id) || null;
}

function catText(c) {
  return c.emoji ? c.emoji + ' ' + c.label : c.label;
}

/* ── Themes ────────────────────────────────────────── */
// Notes keeps its own list: Bubblegum and Seoul Y2K are notes-only token
// blocks in newtab.css, the rest come from lib/lovespark-tokens.css.
// Stored under the shared 'theme' key; 'candy' was renamed 'bubblegum' on 2026-10-25.
const THEMES = [
  { id: 'bubblegum', name: 'Bubblegum' },
  { id: 'retro',     name: 'Retro Pink' },
  { id: 'dark',      name: 'Dark' },
  { id: 'beige',     name: 'Beige' },
  { id: 'slate',     name: 'Slate' },
  { id: 'seoul',     name: 'Seoul Y2K' },
];
const DEFAULT_THEME = 'bubblegum';

function applyTheme(id) {
  const theme = THEMES.find(t => t.id === id) || THEMES.find(t => t.id === DEFAULT_THEME);
  THEMES.forEach(t => document.body.classList.remove('theme-' + t.id));
  document.body.classList.add('theme-' + theme.id);
  document.getElementById('themeLabel').textContent = theme.name;
  document.querySelectorAll('#themeMenu .theme-option').forEach(opt => {
    const on = opt.dataset.theme === theme.id;
    opt.classList.toggle('active', on);
    opt.setAttribute('aria-checked', String(on));
  });
  return theme.id;
}

async function initThemes() {
  const toggle = document.getElementById('themeToggle');
  const menu = document.getElementById('themeMenu');

  THEMES.forEach(t => {
    const opt = el('button', 'theme-option', t.name);
    opt.type = 'button';
    opt.dataset.theme = t.id;
    opt.setAttribute('role', 'menuitemradio');
    opt.setAttribute('aria-checked', 'false');
    menu.appendChild(opt);
  });

  const setOpen = (open) => {
    menu.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
  };
  toggle.addEventListener('click', (e) => {
    e.stopPropagation();
    const open = !menu.classList.contains('open');
    setOpen(open);
    if (open) (menu.querySelector('.theme-option.active') || menu.querySelector('.theme-option')).focus();
  });
  menu.addEventListener('click', (e) => {
    const opt = e.target.closest('.theme-option');
    if (!opt) return;
    chrome.storage.local.set({ theme: applyTheme(opt.dataset.theme) });
    setOpen(false);
    toggle.focus();
  });
  menu.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); setOpen(false); toggle.focus(); }
  });
  document.addEventListener('click', () => setOpen(false));

  let { theme } = await chrome.storage.local.get('theme');
  if (theme === 'candy') {
    theme = 'bubblegum';
    await chrome.storage.local.set({ theme });
  }
  applyTheme(theme || DEFAULT_THEME);
}

/* ── Welcome Note ──────────────────────────────────── */
const WELCOME_NOTE = {
  title: 'Welcome to LoveSpark Notes',
  content: 'Hey bestie! Your notes live here, safe and sound.\n\nEverything is saved automatically \u2014 no account, no tracking, no ads. Just your ideas.\n\nUse the category tabs to organise your notes:\n  \u2022 Idea: for sparks of inspiration\n  \u2022 Project: for ongoing work\n  \u2022 Someday: for things you\'ll get to later\n  \u2022 Daily: for daily brain dumps\n\nNow go capture those ideas!',
  category: 'idea',
  tags: ['welcome'],
};

/* ── Boot ──────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', async () => {
  await initThemes();

  state.index = await DB.getIndex();
  state.prefs = await DB.getPrefs();
  if (!state.prefs.categories) {
    state.prefs.categories = BUILTIN_CATEGORIES;
    await DB.setPrefs({ categories: BUILTIN_CATEGORIES });
  }
  renderCategorySelect();

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

  if (state.prefs.activeCategory !== 'all' && !catById(state.prefs.activeCategory)) {
    state.prefs.activeCategory = 'all';
  }
  renderCategoryTabs();
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

  const cat = catById(note.category);
  if (cat) card.style.setProperty('--card-accent', cat.color);

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

  container.replaceChildren();

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
  container.replaceChildren();

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

/* ── Confirmation (safe DOM) ───────────────────────── */
function confirmAction({ title, desc, actionLabel, onConfirm }) {
  const returnFocus = document.activeElement;
  const overlay = el('div', 'confirm-overlay');
  const dialog = el('div', 'confirm-dialog');
  dialog.setAttribute('role', 'alertdialog');
  dialog.setAttribute('aria-modal', 'true');
  dialog.setAttribute('aria-labelledby', 'confirm-title');
  dialog.setAttribute('aria-describedby', 'confirm-desc');

  const titleEl = el('h3', null, title);
  titleEl.id = 'confirm-title';
  const descEl = el('p', null, desc);
  descEl.id = 'confirm-desc';

  const actions = el('div', 'confirm-actions');
  const close = () => {
    overlay.remove();
    if (returnFocus && document.contains(returnFocus)) returnFocus.focus();
  };
  const cancelBtn = el('button', 'confirm-btn', 'Cancel');
  cancelBtn.type = 'button';
  cancelBtn.addEventListener('click', close);
  const okBtn = el('button', 'confirm-btn confirm-btn-danger', actionLabel);
  okBtn.type = 'button';
  okBtn.addEventListener('click', async () => {
    await onConfirm();
    overlay.remove();
  });
  overlay.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { e.stopPropagation(); e.preventDefault(); close(); }
    if (e.key === 'Tab') {   // keep focus on the two buttons while open
      e.preventDefault();
      (document.activeElement === cancelBtn ? okBtn : cancelBtn).focus();
    }
  });

  actions.appendChild(cancelBtn);
  actions.appendChild(okBtn);
  dialog.appendChild(titleEl);
  dialog.appendChild(descEl);
  dialog.appendChild(actions);
  overlay.appendChild(dialog);
  overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });

  // Inside an open <dialog> (category editor), append there so it stays above the top layer.
  (document.querySelector('dialog[open]') || document.body).appendChild(overlay);
  cancelBtn.focus();
}

function confirmDelete(id) {
  const note = state.index.find(n => n.id === id);
  if (!note) return;
  confirmAction({
    title: 'Delete note?',
    desc: '“' + (note.title || 'Untitled').slice(0, 40) + '” will be permanently deleted.',
    actionLabel: 'Delete',
    onConfirm: () => deleteNote(id),
  });
}

/* ── Category UI (safe DOM) ────────────────────────── */
function renderCategoryTabs() {
  const nav = document.getElementById('categoryTabs');
  nav.replaceChildren();
  const tabs = [{ id: 'all', label: 'All' }, ...getCategories()];
  tabs.forEach(c => {
    const active = c.id === state.prefs.activeCategory;
    const tab = el('button', 'cat-tab' + (active ? ' active' : ''));
    tab.type = 'button';
    tab.dataset.cat = c.id;
    tab.setAttribute('role', 'tab');
    tab.setAttribute('aria-selected', String(active));
    if (c.id !== 'all' && !c.builtin) {
      const dot = el('span', 'cat-dot');
      dot.setAttribute('aria-hidden', 'true');
      dot.style.setProperty('--dot', c.color);
      tab.appendChild(dot);
    }
    tab.appendChild(document.createTextNode(c.id === 'all' ? c.label : catText(c)));
    nav.appendChild(tab);
  });
  const current = catById(state.prefs.activeCategory);
  document.getElementById('catEdit').classList.toggle('hidden', !current || current.builtin);
}

const NEW_CAT_VALUE = '__new__';

function renderCategorySelect() {
  const select = document.getElementById('editorCategory');
  const keep = select.value;
  select.replaceChildren();
  const add = (value, text) => {
    const opt = el('option', null, text);
    opt.value = value;
    select.appendChild(opt);
  };
  add('uncategorized', 'Uncategorized');
  getCategories().forEach(c => add(c.id, catText(c)));
  add(NEW_CAT_VALUE, '+ New category…');
  if (keep && keep !== NEW_CAT_VALUE && (keep === 'uncategorized' || catById(keep))) select.value = keep;
}

function renderCategories() {
  renderCategoryTabs();
  renderCategorySelect();
  renderList();
}

async function saveCategories(categories) {
  state.prefs.categories = categories;
  await DB.setPrefs({ categories });
}

// Opens the category dialog. editId = null for a new category. Resolves with
// the saved category's id, or null if cancelled / deleted.
function openCategoryDialog(editId) {
  const dialog = document.getElementById('catDialog');
  const form = document.getElementById('catForm');
  const nameInput = document.getElementById('catName');
  const emojiInput = document.getElementById('catEmoji');
  const colorsWrap = document.getElementById('catColors');
  const errorEl = document.getElementById('catError');
  const deleteBtn = document.getElementById('catDelete');
  const existing = editId ? catById(editId) : null;
  const returnFocus = document.activeElement;

  const titleEl = document.getElementById('catDialogTitle');
  titleEl.textContent = existing ? 'Edit category' : 'New category';
  nameInput.value = existing ? existing.label : '';
  emojiInput.value = existing ? (existing.emoji || '') : '';
  errorEl.textContent = '';
  deleteBtn.classList.toggle('hidden', !existing);

  const used = new Set(getCategories().map(c => c.color));
  const startColor = existing ? existing.color
    : (CAT_PALETTE.find(p => !used.has(p.color)) || CAT_PALETTE[0]).color;
  colorsWrap.replaceChildren();
  CAT_PALETTE.forEach(p => {
    const label = el('label');
    const radio = el('input');
    radio.type = 'radio';
    radio.name = 'catColor';
    radio.value = p.color;
    radio.checked = p.color === startColor;
    radio.setAttribute('aria-label', p.name);
    const sw = el('span', 'cat-swatch');
    sw.setAttribute('aria-hidden', 'true');
    sw.style.setProperty('--sw', p.color);
    label.appendChild(radio);
    label.appendChild(sw);
    colorsWrap.appendChild(label);
  });

  return new Promise(resolve => {
    let result = null;

    const onSubmit = async (e) => {
      e.preventDefault();
      const label = nameInput.value.trim().replace(/\s+/g, ' ').slice(0, 24);
      const emoji = Array.from(emojiInput.value.trim()).slice(0, 2).join('');
      const color = (form.querySelector('input[name="catColor"]:checked') || {}).value || CAT_PALETTE[0].color;
      const clash = ['all', 'uncategorized'].includes(label.toLowerCase())
        || getCategories().some(c => c.id !== editId && c.label.toLowerCase() === label.toLowerCase());
      if (!label) { errorEl.textContent = 'Give the category a name.'; nameInput.focus(); return; }
      if (clash) { errorEl.textContent = 'You already have a category called “' + label + '”.'; nameInput.focus(); return; }

      if (existing) {
        await saveCategories(getCategories().map(c => c.id === editId ? Object.assign({}, c, { label, emoji, color }) : c));
        result = editId;
      } else {
        const created = { id: 'c_' + genId(), label, emoji, color, builtin: false };
        await saveCategories([...getCategories(), created]);
        result = created.id;
      }
      dialog.close();
    };

    const onDelete = () => {
      confirmAction({
        title: 'Delete “' + existing.label + '”?',
        desc: 'Its notes are kept and move to Uncategorized.',
        actionLabel: 'Delete category',
        onConfirm: async () => {
          state.index.forEach(n => { if (n.category === editId) n.category = 'uncategorized'; });
          await DB.setIndex(state.index);
          await saveCategories(getCategories().filter(c => c.id !== editId));
          if (state.prefs.activeCategory === editId) {
            state.prefs.activeCategory = 'all';
            await DB.setPrefs({ activeCategory: 'all' });
          }
          dialog.close();
        },
      });
    };

    const onCancel = () => dialog.close();

    const onClose = () => {
      form.removeEventListener('submit', onSubmit);
      deleteBtn.removeEventListener('click', onDelete);
      document.getElementById('catCancel').removeEventListener('click', onCancel);
      dialog.removeEventListener('close', onClose);
      renderCategories();
      if (state.selectedId) {
        const note = state.index.find(n => n.id === state.selectedId);
        document.getElementById('editorCategory').value = note ? (note.category || 'uncategorized') : 'uncategorized';
      }
      if (returnFocus && document.contains(returnFocus)) returnFocus.focus();
      resolve(result);
    };

    form.addEventListener('submit', onSubmit);
    deleteBtn.addEventListener('click', onDelete);
    document.getElementById('catCancel').addEventListener('click', onCancel);
    dialog.addEventListener('close', onClose);
    dialog.showModal();
    nameInput.focus();
  });
}

/* ── Bullet points (plain text) ────────────────────── */
// Bullets are plain text: a line that starts with optional indent + "• ".
// Edits go through execCommand('insertText') so ⌘Z undo keeps working and
// the textarea fires its normal 'input' event (which saves the note).
const BULLET = '• ';
const BULLET_LINE = /^(\s*)• /;

function lineBounds(text, start, end) {
  const from = text.lastIndexOf('\n', start - 1) + 1;
  let to = text.indexOf('\n', end);
  if (to === -1) to = text.length;
  return { from, to };
}

function replaceRange(ta, from, to, text, selStart, selEnd) {
  ta.focus();
  ta.setSelectionRange(from, to);
  if (!document.execCommand('insertText', false, text)) {
    ta.setRangeText(text, from, to, 'end');
    ta.dispatchEvent(new Event('input', { bubbles: true }));
  }
  if (selStart !== undefined) ta.setSelectionRange(selStart, selEnd === undefined ? selStart : selEnd);
}

function caretOnBullet(ta) {
  const { from, to } = lineBounds(ta.value, ta.selectionStart, ta.selectionStart);
  return BULLET_LINE.test(ta.value.slice(from, to));
}

function syncBulletButton() {
  const ta = document.getElementById('editorContent');
  document.getElementById('editorBullet').setAttribute('aria-pressed', String(caretOnBullet(ta)));
}

// Toggle bullets on every line the selection touches. If every non-empty line
// is already a bullet, remove them; otherwise bullet the lines that aren't.
function toggleBullets() {
  const ta = document.getElementById('editorContent');
  const { from, to } = lineBounds(ta.value, ta.selectionStart, ta.selectionEnd);
  const lines = ta.value.slice(from, to).split('\n');
  const content = lines.filter(l => l.trim());
  const allBulleted = content.length > 0 && content.every(l => BULLET_LINE.test(l));
  const out = lines.map(l => {
    if (allBulleted) return l.replace(BULLET_LINE, '$1');
    if (BULLET_LINE.test(l) || (!l.trim() && lines.length > 1)) return l;
    return l.replace(/^(\s*)/, '$1' + BULLET);
  }).join('\n');
  const single = lines.length === 1;
  replaceRange(ta, from, to, out, single ? from + out.length : from, from + out.length);
  syncBulletButton();
}

// Enter continues a bullet list; Enter on an empty bullet ends it.
// Tab / Shift+Tab indent or outdent, but only on bullet lines and only until
// Esc is pressed, so keyboard users can always Tab out of the editor.
let bulletTabReleased = false;

function onEditorKeydown(e) {
  const ta = e.target;
  if (e.key === 'Escape') {
    if (!bulletTabReleased && caretOnBullet(ta)) {
      bulletTabReleased = true;   // first Esc on a bullet: next Tab leaves the editor
      e.stopPropagation();
    }
    return;
  }
  if (e.key !== 'Tab') bulletTabReleased = false;
  if (e.isComposing || e.altKey || e.metaKey || e.ctrlKey) return;
  if (ta.selectionStart !== ta.selectionEnd && e.key === 'Enter') return;

  const { from, to } = lineBounds(ta.value, ta.selectionStart, ta.selectionEnd);
  const line = ta.value.slice(from, to);
  const m = line.match(BULLET_LINE);
  if (!m) return;

  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    if (!line.slice(m[0].length).trim()) {
      replaceRange(ta, from, to, '', from);          // empty bullet: end the list
    } else {
      const caret = ta.selectionStart;
      replaceRange(ta, caret, caret, '\n' + m[1] + BULLET);
    }
    syncBulletButton();
    return;
  }

  if (e.key === 'Tab' && !bulletTabReleased && ta.selectionStart === ta.selectionEnd) {
    e.preventDefault();
    const caret = ta.selectionStart;
    if (e.shiftKey) {
      const remove = Math.min(2, m[1].length);
      if (remove) replaceRange(ta, from, from + remove, '', Math.max(from, caret - remove));
    } else {
      replaceRange(ta, from, from, '  ', caret + 2);
    }
  }
}

// "- " or "* " typed at the start of a line becomes "• ".
function onEditorInput(e) {
  if (e.inputType !== 'insertText' || e.data !== ' ') return;
  const ta = e.target;
  const caret = ta.selectionStart;
  const { from } = lineBounds(ta.value, caret, caret);
  const m = ta.value.slice(from, caret).match(/^(\s*)[-*] $/);
  if (m) replaceRange(ta, from + m[1].length, caret, BULLET);
}

/* ── How it works & FAQ ────────────────────────────── */
function bindHelp() {
  const btn = document.getElementById('helpBtn');
  const dialog = document.getElementById('helpDialog');
  btn.addEventListener('click', () => {
    dialog.showModal();
    document.getElementById('helpClose').focus();
  });
  document.getElementById('helpClose').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', (e) => { if (e.target === dialog) dialog.close(); });
  dialog.addEventListener('close', () => btn.focus());
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

  document.getElementById('categoryTabs').addEventListener('click', (e) => {
    const tab = e.target.closest('.cat-tab');
    if (!tab) return;
    state.prefs.activeCategory = tab.dataset.cat;
    DB.setPrefs({ activeCategory: state.prefs.activeCategory });
    applyPrefs();
    renderList();
  });

  // Right-click a custom category tab to edit it (also: the Edit category button).
  document.getElementById('categoryTabs').addEventListener('contextmenu', (e) => {
    const tab = e.target.closest('.cat-tab');
    const cat = tab && catById(tab.dataset.cat);
    if (!cat || cat.builtin) return;
    e.preventDefault();
    openCategoryDialog(cat.id);
  });

  document.getElementById('catAdd').addEventListener('click', async () => {
    const id = await openCategoryDialog(null);
    if (!id) return;
    state.prefs.activeCategory = id;
    await DB.setPrefs({ activeCategory: id });
    applyPrefs();
    renderList();
  });

  document.getElementById('catEdit').addEventListener('click', () => {
    openCategoryDialog(state.prefs.activeCategory);
  });

  bindHelp();

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
    if (document.querySelector('dialog[open], .confirm-overlay')) return;
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
  contentInput.addEventListener('input', (e) => {
    onEditorInput(e);
    debouncedContent(contentInput.value);
  });
  contentInput.addEventListener('keydown', onEditorKeydown);
  ['keyup', 'click', 'focus'].forEach(ev => contentInput.addEventListener(ev, syncBulletButton));
  document.getElementById('editorBullet').addEventListener('click', toggleBullets);

  // Editor: category
  document.getElementById('editorCategory').addEventListener('change', async (e) => {
    if (!state.selectedId) return;
    if (e.target.value === NEW_CAT_VALUE) {
      const noteId = state.selectedId;
      const id = await openCategoryDialog(null);
      if (id) {
        await updateNote(noteId, { category: id });
        document.getElementById('editorCategory').value = id;
      }
      return;
    }
    updateNote(state.selectedId, { category: e.target.value });
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
