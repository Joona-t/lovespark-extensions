// LoveSpark Notes — Constants
// INTEGRATION POINT: these values are shared across all environments

export const MAX_VERSIONS = 20;
export const MAX_PINNED = 10;
export const MAX_TAG_LENGTH = 20;
export const MAX_TITLE_LENGTH = 200;
export const AUTO_TITLE_LENGTH = 50;
export const STORAGE_VERSION = 1;

// Debounce intervals (ms)
export const DEBOUNCE_LOCAL = 800;
export const DEBOUNCE_SYNC = 3000;
export const DEBOUNCE_LOCALSTORAGE = 400;
export const DEBOUNCE_SEARCH = 150;

// Storage keys
export const KEY_INDEX = 'ls_notes_index';
export const KEY_PREFS = 'ls_prefs';
export const KEY_CONTENT_PREFIX = 'note_';
export const KEY_VERSIONS_PREFIX = 'versions_';
export const KEY_LEGACY = 'lovespark_notes_v1';

// Categories
export const CATEGORIES = [
  { id: 'idea',    emoji: '💡', label: 'Idea',    color: '#fbbf24', bg: '#fbbf2422' },
  { id: 'project', emoji: '🛠',  label: 'Project', color: '#a78bfa', bg: '#a78bfa22' },
  { id: 'someday', emoji: '🌙', label: 'Someday', color: '#60a5fa', bg: '#60a5fa22' },
  { id: 'daily',   emoji: '📋', label: 'Daily',   color: '#34d399', bg: '#34d39922' },
];

export const DEFAULT_CATEGORY = 'idea';

// Tag color palette (for hash-based assignment)
export const TAG_PALETTE = [
  { color: '#ff6eb4', bg: '#ff6eb422' },
  { color: '#a78bfa', bg: '#a78bfa22' },
  { color: '#34d399', bg: '#34d39922' },
  { color: '#fbbf24', bg: '#fbbf2422' },
  { color: '#60a5fa', bg: '#60a5fa22' },
  { color: '#f87171', bg: '#f8717122' },
  { color: '#c084fc', bg: '#c084fc22' },
  { color: '#2dd4bf', bg: '#2dd4bf22' },
];

// Font options
export const FONTS = [
  { id: 'dm-mono',       label: 'DM Mono',       shortLabel: 'Aa', family: "'DM Mono', monospace",              size: '14px', lineHeight: '1.8' },
  { id: 'atkinson',      label: 'Atkinson',       shortLabel: 'Ah', family: "'Atkinson Hyperlegible', sans-serif", size: '15px', lineHeight: '1.8' },
  { id: 'opendyslexic',  label: 'OpenDyslexic',   shortLabel: 'Dy', family: "'OpenDyslexic', sans-serif",         size: '15px', lineHeight: '1.9' },
];

export const DEFAULT_FONT = 'dm-mono';

// Trash retention
export const TRASH_RETENTION_DAYS = 30;

// Storage keys (additional)
export const KEY_BACKLINKS = 'ls_backlinks';

// Google Drive sync
export const SYNC_INTERVAL_MINUTES = 5;
export const SYNC_DEBOUNCE_AFTER_SAVE = 30000;
export const SYNC_LOCK_TTL = 120000;
export const SYNC_TOMBSTONE_RETENTION_DAYS = 30;
export const SYNC_CLOCK_SKEW_THRESHOLD = 60000;
export const DRIVE_INDEX_FILENAME = 'lovespark-notes-index.json';
export const DRIVE_NOTE_PREFIX = 'lovespark-note-';
export const KEY_SYNC_STATE = 'ls_sync_state';
export const KEY_SYNC_LOCK = 'ls_sync_lock';

// Default preferences
export const DEFAULT_PREFS = {
  lastEditedId: null,
  brainDumpMode: 'blank',
  sortOrder: 'updatedAt',
  hasSeenWelcome: false,
  contentFont: DEFAULT_FONT,
  lastCategory: DEFAULT_CATEGORY,
  darkMode: false,
  typingSound: false,
};

// Templates
export const TEMPLATES = [
  { id: 'meeting',  label: 'Meeting Notes',  emoji: '📋', content: '## Meeting Notes\n\n**Date:** {{date}}\n**Attendees:**\n\n---\n\n### Agenda\n1. \n\n### Notes\n- \n\n### Action Items\n- [ ] \n' },
  { id: 'bug',      label: 'Bug Report',      emoji: '🐛', content: '## Bug Report\n\n**Date:** {{date}}\n\n### Description\n\n### Steps to Reproduce\n1. \n\n### Expected Behavior\n\n### Actual Behavior\n\n### Environment\n- \n' },
  { id: 'idea',     label: 'Idea',            emoji: '💡', content: '## 💡 Idea\n\n**Date:** {{date}}\n\n### What\n\n### Why\n\n### How\n\n### Next Steps\n- [ ] \n' },
  { id: 'journal',  label: 'Journal Entry',   emoji: '📝', content: '## Journal — {{date}}\n\n### How am I feeling?\n\n### What happened today?\n\n### What am I grateful for?\n- \n\n### Tomorrow I want to...\n- \n' },
  { id: 'braindump', label: 'Brain Dump',     emoji: '🧠', content: '## 🧠 Brain Dump — {{date}}\n\nJust write. No structure needed.\n\n' },
  { id: 'reading',  label: 'Reading Notes',   emoji: '📖', content: '## Reading Notes\n\n**Title:** \n**Author:** \n**Date:** {{date}}\n\n### Key Ideas\n- \n\n### Quotes\n> \n\n### My Thoughts\n\n' },
];

// Daily brain dump template
export const DAILY_TEMPLATE_BLANK = (dateStr) =>
  `─── ${dateStr} ───────────────────\n\n`;

export const DAILY_TEMPLATE_STRUCTURED = (dateStr) =>
  `─── ${dateStr} ───────────────────

## 🔥 Top 3 priorities
1.
2.
3.

## 💡 Ideas
-

## 🌀 On my mind
-

## 🌸 Gratitude
-
`;

// Welcome note
export const WELCOME_NOTE = {
  title: 'Welcome to LoveSpark Notes 💖',
  content: `Hey bestie! Your notes live here, safe and sound.\n\nEverything is saved automatically — no account, no tracking, no ads. Just your ideas.\n\n✦ CMD+N — create a new note\n✦ CMD+D — daily brain dump\n✦ CMD+P — toggle markdown preview\n✦ CMD+Shift+F — distraction-free mode\n✦ CMD+Enter (popup) — save and open full app\n\nYour work is always safe. Version history keeps the last 20 snapshots of every note, automatically.\n\nNow go capture those ideas 🌸`,
  category: 'idea',
  tags: ['welcome'],
};

// Motivational messages
export const MESSAGES = [
  'Your ideas live here 💕',
  'Writing is thinking ✨',
  'Stay sparkly, bestie 🌸',
  'Safe and sound 💖',
  'Capture everything 🦋',
  'You got this ✦',
];
