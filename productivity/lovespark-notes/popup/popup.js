// LoveSpark Notes — Popup (Quick Capture)
// Auto-focused textarea, category pills, auto-save, CMD+Enter→full app.

import { initStorage, getStorage } from '../shared/storage-init.js';
import { createNote, updateNote, loadNoteContent } from '../shared/notes-core.js';
import { autoTitle } from '../shared/formatters.js';
import { CATEGORIES, DEBOUNCE_LOCAL, DEFAULT_CATEGORY } from '../shared/constants.js';

// ── Theme System ──────────────────────────────────────────────
const THEMES = ['dark', 'retro', 'beige', 'slate'];
function applyTheme(t) {
  THEMES.forEach(n => document.body.classList.remove('theme-' + n));
  document.body.classList.add('theme-' + t);
  const btn = document.getElementById('themeTab');
  if (btn) btn.textContent = 'Toggle: ' + t;
}
function cycleTheme() {
  const cur = THEMES.find(t => document.body.classList.contains('theme-' + t)) || 'retro';
  const next = THEMES[(THEMES.indexOf(cur) + 1) % THEMES.length];
  applyTheme(next);
  chrome.storage.local.set({ theme: next });
}
chrome.storage.local.get(['theme', 'darkMode'], ({ theme, darkMode }) => {
  if (!theme && darkMode) theme = 'dark';
  applyTheme(theme || 'retro');
});
document.getElementById('themeTab').addEventListener('click', cycleTheme);

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
  let html = '';
  for (const cat of CATEGORIES) {
    const active = selectedCategory === cat.id;
    html += `<button class="cat-pill${active ? ' active' : ''}" data-cat="${cat.id}"
      style="${active ? `color:${cat.color};border-color:${cat.color};background:${cat.bg}` : ''}"
    >${cat.emoji} ${cat.label}</button>`;
  }
  $('categoryPills').innerHTML = html;
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

// ── Start ──────────────────────────────────────────────────────

init();
