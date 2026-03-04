// LoveSpark Notes — Core business logic
// INTEGRATION POINT: all note operations go through Storage abstraction
// No DOM code. Pure data transformations + storage calls.

import { getStorage } from './storage-init.js';
import { genId, wordCount, autoTitle, formatToday, todayISO } from './formatters.js';
import {
  DEFAULT_CATEGORY, CATEGORIES, MAX_PINNED,
  DAILY_TEMPLATE_BLANK, DAILY_TEMPLATE_STRUCTURED,
  WELCOME_NOTE, TRASH_RETENTION_DAYS, TEMPLATES,
} from './constants.js';

// ── Note CRUD ─────────────────────────────────────────────────

/**
 * Create a new note.
 * INTEGRATION POINT: Storage.saveContent + Storage.saveIndex
 * @returns {object} The new note's index entry
 */
export async function createNote(overrides = {}) {
  const storage = getStorage();
  const now = Date.now();

  const content = overrides.content || '';
  const note = {
    id: genId(),
    title: overrides.title || '',
    category: overrides.category || DEFAULT_CATEGORY,
    pinned: false,
    tags: overrides.tags || [],
    wordCount: wordCount(content),
    snippet: content.replace(/\n/g, ' ').trim().slice(0, 80),
    createdAt: now,
    updatedAt: now,
  };

  // Save content first (local) — if this fails, index stays clean
  await storage.saveContent(note.id, content);

  // Then update index
  const index = await storage.loadIndex();
  index.notes.unshift(note);
  await storage.saveIndex(index);

  return note;
}

/**
 * Update an existing note's metadata and/or content.
 * INTEGRATION POINT: Storage.saveContent + Storage.saveIndex
 * @param {string} id — note ID
 * @param {object} patch — fields to update { title?, content?, category?, tags?, pinned? }
 * @returns {object|null} Updated index entry, or null if not found
 */
export async function updateNote(id, patch) {
  const storage = getStorage();
  const index = await storage.loadIndex();
  const entry = index.notes.find(n => n.id === id);
  if (!entry) return null;

  const now = Date.now();

  if (patch.content !== undefined) {
    await storage.saveContent(id, patch.content);
    entry.wordCount = wordCount(patch.content);
    entry.snippet = patch.content.replace(/\n/g, ' ').trim().slice(0, 80);
  }

  if (patch.title !== undefined) entry.title = patch.title;
  if (patch.category !== undefined) entry.category = patch.category;
  if (patch.tags !== undefined) entry.tags = patch.tags;
  if (patch.pinned !== undefined) entry.pinned = patch.pinned;

  entry.updatedAt = now;
  await storage.saveIndex(index);

  return entry;
}

/**
 * Soft-delete a note (move to trash). Sets deletedAt + originalCategory.
 * INTEGRATION POINT: Storage.saveIndex
 */
export async function deleteNote(id) {
  const storage = getStorage();
  const index = await storage.loadIndex();
  const entry = index.notes.find(n => n.id === id);
  if (!entry) return;

  entry.deletedAt = Date.now();
  entry.originalCategory = entry.category;
  entry.category = 'trash';
  entry.pinned = false;
  await storage.saveIndex(index);
}

/**
 * Restore a note from trash.
 */
export async function restoreNote(id) {
  const storage = getStorage();
  const index = await storage.loadIndex();
  const entry = index.notes.find(n => n.id === id);
  if (!entry || !entry.deletedAt) return null;

  entry.category = entry.originalCategory || DEFAULT_CATEGORY;
  delete entry.deletedAt;
  delete entry.originalCategory;
  entry.updatedAt = Date.now();
  await storage.saveIndex(index);
  return entry;
}

/**
 * Permanently delete a note and all associated data.
 */
export async function permanentlyDeleteNote(id) {
  const storage = getStorage();
  const index = await storage.loadIndex();
  index.notes = index.notes.filter(n => n.id !== id);
  await storage.saveIndex(index);
  await storage.deleteNoteData(id);
}

/**
 * Empty all trashed notes.
 */
export async function emptyTrash() {
  const storage = getStorage();
  const index = await storage.loadIndex();
  const trashed = index.notes.filter(n => n.deletedAt);

  for (const note of trashed) {
    await storage.deleteNoteData(note.id);
  }

  index.notes = index.notes.filter(n => !n.deletedAt);
  await storage.saveIndex(index);
  return trashed.length;
}

/**
 * Load full note content by ID.
 * INTEGRATION POINT: Storage.loadContent
 */
export async function loadNoteContent(id) {
  const storage = getStorage();
  return storage.loadContent(id);
}

// ── Pin / Favourite ───────────────────────────────────────────

/**
 * Toggle pin state on a note.
 * @returns {{ success: boolean, pinned?: boolean, error?: string }}
 */
export async function togglePin(id) {
  const storage = getStorage();
  const index = await storage.loadIndex();
  const entry = index.notes.find(n => n.id === id);
  if (!entry) return { success: false, error: 'Note not found' };

  if (!entry.pinned) {
    const pinnedCount = index.notes.filter(n => n.pinned).length;
    if (pinnedCount >= MAX_PINNED) {
      return { success: false, error: `Unpin a note to pin another (max ${MAX_PINNED})` };
    }
  }

  entry.pinned = !entry.pinned;
  entry.updatedAt = Date.now();
  await storage.saveIndex(index);

  return { success: true, pinned: entry.pinned };
}

// ── Tags ──────────────────────────────────────────────────────

/**
 * Add a tag to a note. Returns false if tag already exists.
 */
export async function addTag(id, tag) {
  const storage = getStorage();
  const index = await storage.loadIndex();
  const entry = index.notes.find(n => n.id === id);
  if (!entry) return false;

  if (!entry.tags) entry.tags = [];
  if (entry.tags.includes(tag)) return false;

  entry.tags.push(tag);
  entry.updatedAt = Date.now();
  await storage.saveIndex(index);
  return true;
}

/**
 * Remove a tag from a note.
 */
export async function removeTag(id, tag) {
  const storage = getStorage();
  const index = await storage.loadIndex();
  const entry = index.notes.find(n => n.id === id);
  if (!entry || !entry.tags) return false;

  entry.tags = entry.tags.filter(t => t !== tag);
  entry.updatedAt = Date.now();
  await storage.saveIndex(index);
  return true;
}

// ── Daily Brain Dump ──────────────────────────────────────────

/**
 * Create or open today's daily brain dump note.
 * INTEGRATION POINT: Storage operations
 * @returns {{ entry: object, isNew: boolean }}
 */
export async function createOrOpenDaily(mode = 'blank') {
  const storage = getStorage();
  const index = await storage.loadIndex();
  const today = todayISO();
  const dateStr = formatToday();

  // Check if a daily note for today already exists
  const existing = index.notes.find(n =>
    n.category === 'daily' &&
    new Date(n.createdAt).toISOString().slice(0, 10) === today
  );

  if (existing) {
    return { entry: existing, isNew: false };
  }

  const content = mode === 'structured'
    ? DAILY_TEMPLATE_STRUCTURED(dateStr)
    : DAILY_TEMPLATE_BLANK(dateStr);

  const entry = await createNote({
    title: `Daily — ${dateStr}`,
    content,
    category: 'daily',
  });

  return { entry, isNew: true };
}

// ── Templates ────────────────────────────────────────────────

/**
 * Create a note from a template.
 */
export async function createFromTemplate(templateId) {
  const template = TEMPLATES.find(t => t.id === templateId);
  if (!template) return null;

  const dateStr = formatToday();
  const content = template.content.replace(/\{\{date\}\}/g, dateStr);

  return createNote({
    title: template.label + ' — ' + dateStr,
    content,
    category: 'idea',
  });
}

// ── Version History ───────────────────────────────────────────

/**
 * Take a version snapshot of a note.
 * INTEGRATION POINT: Storage.pushVersion
 * @returns {boolean} true if snapshot was saved, false if skipped (no changes)
 */
export async function snapshotVersion(noteId, content) {
  const storage = getStorage();
  await storage.pushVersion(noteId, {
    content,
    ts: Date.now(),
  });
  return true;
}

/**
 * Load version history for a note.
 * INTEGRATION POINT: Storage.loadVersions
 */
export async function loadVersions(noteId) {
  const storage = getStorage();
  return storage.loadVersions(noteId);
}

/**
 * Restore a note to a specific version.
 * Creates a new version snapshot before restoring (restore is versioned).
 * INTEGRATION POINT: Storage operations
 */
export async function restoreVersion(noteId, versionContent) {
  const storage = getStorage();

  // Snapshot current state before restoring
  const currentContent = await storage.loadContent(noteId);
  if (currentContent !== versionContent) {
    await storage.pushVersion(noteId, {
      content: currentContent,
      ts: Date.now(),
    });
  }

  // Write the restored content
  await storage.saveContent(noteId, versionContent);

  // Update index metadata
  const index = await storage.loadIndex();
  const entry = index.notes.find(n => n.id === noteId);
  if (entry) {
    entry.wordCount = wordCount(versionContent);
    entry.updatedAt = Date.now();
    await storage.saveIndex(index);
  }

  return versionContent;
}

// ── Welcome Note ──────────────────────────────────────────────

/**
 * Seed the welcome note on first use.
 * INTEGRATION POINT: Storage operations
 */
export async function seedWelcomeNote() {
  const storage = getStorage();
  const prefs = await storage.loadPrefs();
  if (prefs.hasSeenWelcome) return false;

  const index = await storage.loadIndex();
  if (index.notes.length > 0) {
    // Notes exist (maybe from migration) — skip welcome, mark as seen
    await storage.setPref('hasSeenWelcome', true);
    return false;
  }

  await createNote({
    title: WELCOME_NOTE.title,
    content: WELCOME_NOTE.content,
    category: WELCOME_NOTE.category,
    tags: WELCOME_NOTE.tags,
  });

  await storage.setPref('hasSeenWelcome', true);
  return true;
}

// ── Export / Import ───────────────────────────────────────────

/**
 * Export a single note as text.
 * INTEGRATION POINT: replace with Tauri file dialog for Core
 */
export async function exportNote(id, format = 'md') {
  const storage = getStorage();
  const index = await storage.loadIndex();
  const entry = index.notes.find(n => n.id === id);
  if (!entry) return null;

  const content = await storage.loadContent(id);
  const title = entry.title || 'Untitled';

  if (format === 'md' || format === 'txt') {
    return {
      filename: `${title.replace(/[^a-z0-9\s-]/gi, '').trim().replace(/\s+/g, '-')}.${format}`,
      content: `# ${title}\n\n${content}`,
      type: format === 'md' ? 'text/markdown' : 'text/plain',
    };
  }

  return null;
}

/**
 * Export all notes as JSON backup.
 * INTEGRATION POINT: replace with Tauri file dialog for Core
 */
export async function exportAllNotes() {
  const storage = getStorage();
  const index = await storage.loadIndex();
  const exported = [];

  for (const entry of index.notes) {
    const content = await storage.loadContent(entry.id);
    exported.push({ ...entry, content });
  }

  return {
    filename: `lovespark-notes-backup-${todayISO()}.json`,
    content: JSON.stringify(exported, null, 2),
    type: 'application/json',
  };
}

/**
 * Import notes from JSON backup.
 * INTEGRATION POINT: replace with Tauri file dialog for Core
 * @returns {{ imported: number, errors: number }}
 */
export async function importNotes(jsonText) {
  let parsed;
  try {
    parsed = JSON.parse(jsonText);
  } catch {
    throw new Error('Invalid JSON file');
  }

  if (!Array.isArray(parsed)) {
    throw new Error('Expected array of notes');
  }

  const storage = getStorage();
  const index = await storage.loadIndex();
  const existingIds = new Set(index.notes.map(n => n.id));
  const validCategories = new Set(CATEGORIES.map(c => c.id));

  let imported = 0;
  let errors = 0;

  for (const raw of parsed) {
    try {
      if (!raw.content && !raw.title) { errors++; continue; }

      const id = existingIds.has(raw.id) ? genId() : (raw.id || genId());
      existingIds.add(id);

      const entry = {
        id,
        title: String(raw.title || '').slice(0, 200),
        category: validCategories.has(raw.category) ? raw.category : 'idea',
        pinned: false,
        tags: Array.isArray(raw.tags) ? raw.tags.slice(0, 10) : [],
        wordCount: wordCount(raw.content || ''),
        createdAt: raw.createdAt || Date.now(),
        updatedAt: raw.updatedAt || Date.now(),
      };

      await storage.saveContent(id, String(raw.content || ''));
      index.notes.push(entry);
      imported++;
    } catch {
      errors++;
    }
  }

  await storage.saveIndex(index);
  return { imported, errors };
}

// ── Export as ZIP ─────────────────────────────────────────────

/**
 * Export all notes as a ZIP file (STORE method, no compression).
 * Vanilla implementation — no dependencies.
 */
export async function exportAllAsZip() {
  const storage = getStorage();
  const index = await storage.loadIndex();
  const activeNotes = index.notes.filter(n => !n.deletedAt);
  const files = [];

  for (const entry of activeNotes) {
    const content = await storage.loadContent(entry.id);
    const title = (entry.title || 'Untitled').replace(/[^a-z0-9\s-]/gi, '').trim().replace(/\s+/g, '-');
    const filename = `${title}.md`;
    const body = `# ${entry.title || 'Untitled'}\n\n${content}`;
    files.push({ name: filename, data: new TextEncoder().encode(body) });
  }

  const zip = buildZip(files);
  return {
    filename: `lovespark-notes-${todayISO()}.zip`,
    content: zip,
    type: 'application/zip',
  };
}

function buildZip(files) {
  const localHeaders = [];
  const centralHeaders = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = new TextEncoder().encode(file.name);
    const crc = crc32(file.data);
    const size = file.data.length;

    // Local file header (30 + name + data)
    const local = new Uint8Array(30 + nameBytes.length + size);
    const lv = new DataView(local.buffer);
    lv.setUint32(0, 0x04034b50, true); // sig
    lv.setUint16(4, 20, true);          // version
    lv.setUint16(6, 0, true);           // flags
    lv.setUint16(8, 0, true);           // compression (STORE)
    lv.setUint16(10, 0, true);          // mod time
    lv.setUint16(12, 0, true);          // mod date
    lv.setUint32(14, crc, true);        // crc32
    lv.setUint32(18, size, true);       // compressed size
    lv.setUint32(22, size, true);       // uncompressed size
    lv.setUint16(26, nameBytes.length, true);
    lv.setUint16(28, 0, true);          // extra field length
    local.set(nameBytes, 30);
    local.set(file.data, 30 + nameBytes.length);
    localHeaders.push(local);

    // Central directory header (46 + name)
    const central = new Uint8Array(46 + nameBytes.length);
    const cv = new DataView(central.buffer);
    cv.setUint32(0, 0x02014b50, true); // sig
    cv.setUint16(4, 20, true);          // version made by
    cv.setUint16(6, 20, true);          // version needed
    cv.setUint16(8, 0, true);           // flags
    cv.setUint16(10, 0, true);          // compression
    cv.setUint16(12, 0, true);          // mod time
    cv.setUint16(14, 0, true);          // mod date
    cv.setUint32(16, crc, true);
    cv.setUint32(20, size, true);
    cv.setUint32(24, size, true);
    cv.setUint16(28, nameBytes.length, true);
    cv.setUint16(30, 0, true);          // extra
    cv.setUint16(32, 0, true);          // comment
    cv.setUint16(34, 0, true);          // disk start
    cv.setUint16(36, 0, true);          // internal attrs
    cv.setUint32(38, 0, true);          // external attrs
    cv.setUint32(42, offset, true);     // local header offset
    central.set(nameBytes, 46);
    centralHeaders.push(central);

    offset += local.length;
  }

  const centralSize = centralHeaders.reduce((sum, c) => sum + c.length, 0);
  const eocd = new Uint8Array(22);
  const ev = new DataView(eocd.buffer);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, files.length, true);
  ev.setUint16(10, files.length, true);
  ev.setUint32(12, centralSize, true);
  ev.setUint32(16, offset, true);
  ev.setUint16(20, 0, true);

  const total = offset + centralSize + 22;
  const result = new Uint8Array(total);
  let pos = 0;
  for (const lh of localHeaders) { result.set(lh, pos); pos += lh.length; }
  for (const ch of centralHeaders) { result.set(ch, pos); pos += ch.length; }
  result.set(eocd, pos);

  return result;
}

function crc32(data) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ── Import Markdown ──────────────────────────────────────────

/**
 * Import a single .md file as a note.
 */
export async function importMarkdownFile(filename, content) {
  const title = filename.replace(/\.md$/i, '').replace(/[-_]/g, ' ');
  return createNote({ title, content, category: 'idea' });
}

// ── Storage Stats ────────────────────────────────────────────

/**
 * Get storage usage statistics.
 */
export async function getStorageStats() {
  const storage = getStorage();
  const index = await storage.loadIndex();
  const active = index.notes.filter(n => !n.deletedAt);
  let totalWords = 0;

  for (const entry of active) {
    totalWords += entry.wordCount || 0;
  }

  // Calculate writing streak (consecutive days with edits)
  const editDates = new Set();
  for (const n of active) {
    editDates.add(new Date(n.updatedAt).toISOString().slice(0, 10));
    editDates.add(new Date(n.createdAt).toISOString().slice(0, 10));
  }

  let streak = 0;
  const d = new Date();
  while (true) {
    const ds = d.toISOString().slice(0, 10);
    if (editDates.has(ds)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    totalNotes: active.length,
    trashedNotes: index.notes.length - active.length,
    totalWords,
    categories: categoryCounts(index.notes),
    tags: allTags(index.notes).length,
    streak,
  };
}

// ── Bi-directional Linking ────────────────────────────────────

/**
 * Extract [[wiki links]] from note content.
 * @returns {string[]} array of link targets
 */
export function extractLinks(content) {
  if (!content) return [];
  const matches = content.match(/\[\[([^\]]+)\]\]/g);
  if (!matches) return [];
  return matches.map(m => m.slice(2, -2).trim());
}

/**
 * Resolve a link target to a note ID by fuzzy title match.
 */
export function resolveLink(title, notes) {
  const lower = title.toLowerCase();
  // Exact match first
  const exact = notes.find(n => !n.deletedAt && (n.title || '').toLowerCase() === lower);
  if (exact) return exact.id;
  // Prefix match
  const prefix = notes.find(n => !n.deletedAt && (n.title || '').toLowerCase().startsWith(lower));
  if (prefix) return prefix.id;
  return null;
}

/**
 * Build a backlinks map: noteId → [{ fromId, fromTitle }]
 * Scans all notes for [[links]] and builds reverse index.
 */
export async function buildBacklinks(indexData) {
  const storage = getStorage();
  const backlinks = {};
  const notes = indexData.notes.filter(n => !n.deletedAt);

  for (const note of notes) {
    const content = await storage.loadContent(note.id);
    const links = extractLinks(content);

    for (const linkTarget of links) {
      const targetId = resolveLink(linkTarget, notes);
      if (!targetId || targetId === note.id) continue;

      if (!backlinks[targetId]) backlinks[targetId] = [];
      const exists = backlinks[targetId].some(b => b.fromId === note.id);
      if (!exists) {
        backlinks[targetId].push({ fromId: note.id, fromTitle: note.title || 'Untitled' });
      }
    }
  }

  return backlinks;
}

// ── Garbage Collection ────────────────────────────────────────

/**
 * Clean up orphaned version data and prune old versions.
 * Run on extension startup, max once per 24h.
 */
export async function garbageCollect() {
  const storage = getStorage();
  const prefs = await storage.loadPrefs();
  const lastGC = prefs.lastGCDate || 0;
  const now = Date.now();

  // Only run once per 24 hours
  if (now - lastGC < 86400000) return;

  const index = await storage.loadIndex();
  const thirtyDaysAgo = now - (TRASH_RETENTION_DAYS * 86400000);

  // Auto-purge trashed notes older than 30 days
  const expired = index.notes.filter(n => n.deletedAt && n.deletedAt < thirtyDaysAgo);
  for (const note of expired) {
    await storage.deleteNoteData(note.id);
  }
  if (expired.length > 0) {
    index.notes = index.notes.filter(n => !(n.deletedAt && n.deletedAt < thirtyDaysAgo));
    await storage.saveIndex(index);
  }

  // For each note, prune versions older than 30 days (keep first + last)
  for (const entry of index.notes) {
    const versions = await storage.loadVersions(entry.id);
    if (versions.length <= 2) continue;

    const pruned = versions.filter((v, i) => {
      if (i === 0) return true; // keep first (original)
      if (i === versions.length - 1) return true; // keep last (most recent)
      return v.ts > thirtyDaysAgo; // keep recent
    });

    if (pruned.length !== versions.length) {
      await storage.saveVersions(entry.id, pruned);
    }
  }

  await storage.setPref('lastGCDate', now);
}

// ── Filtering & Sorting ───────────────────────────────────────

/**
 * Filter and sort notes from index. Pure function — no storage calls.
 * @param {Array} notes - index entries
 * @param {object} filters - { category: string|'all', search: string, showPinned: boolean }
 * @returns {Array} filtered + sorted notes
 */
export function filterNotes(notes, { category = 'all', search = '', includeTrash = false } = {}) {
  const q = search.toLowerCase();

  return notes.filter(n => {
    // Exclude trashed notes unless viewing trash
    if (category === 'trash') return !!n.deletedAt;
    if (n.deletedAt && !includeTrash) return false;

    const matchCategory = category === 'all' || n.category === category;
    const matchSearch = !q ||
      (n.title || '').toLowerCase().includes(q) ||
      (n.tags || []).some(t => t.toLowerCase().includes(q));
    return matchCategory && matchSearch;
  }).sort((a, b) => {
    if (category === 'trash') return (b.deletedAt || 0) - (a.deletedAt || 0);
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return b.updatedAt - a.updatedAt;
  });
}

/**
 * Get category counts from index.
 */
export function categoryCounts(notes) {
  const active = notes.filter(n => !n.deletedAt);
  const counts = { all: active.length };
  for (const cat of CATEGORIES) counts[cat.id] = 0;
  counts.pinned = 0;
  counts.trash = notes.filter(n => n.deletedAt).length;

  for (const n of active) {
    if (counts[n.category] !== undefined) counts[n.category]++;
    if (n.pinned) counts.pinned++;
  }

  return counts;
}

/**
 * Get all unique tags from index.
 */
export function allTags(notes) {
  const set = new Set();
  for (const n of notes) {
    if (!n.deletedAt && n.tags) n.tags.forEach(t => set.add(t));
  }
  return [...set].sort();
}
