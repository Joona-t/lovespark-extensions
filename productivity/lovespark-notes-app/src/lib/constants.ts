// LoveSpark Notes — Types, limits, palettes, templates, messages

// ── Types ────────────────────────────────────────────────────

export interface NoteEntry {
  id: string;
  title: string;
  pinned: boolean;
  tags: string[];
  wordCount: number;
  snippet: string;       // first 80 chars
  createdAt: number;
  updatedAt: number;
  deletedAt?: number;    // soft delete
}

export interface TagDefinition {
  name: string;          // normalized: lowercase, alphanum+hyphens, max 20
  colour: string;        // hex
  createdAt: number;
}

export interface NoteVersion {
  content: string;
  ts: number;
}

export type ContentFont = 'dm-mono' | 'atkinson' | 'opendyslexic';
export type SortOrder = 'updatedAt' | 'createdAt' | 'title';
export type DailyMode = 'blank' | 'structured';

export interface UserPrefs {
  contentFont: ContentFont;
  sortOrder: SortOrder;
  dailyMode: DailyMode;
  hasSeenWelcome: boolean;
  lastEditedId: string | null;
}

// ── Limits ───────────────────────────────────────────────────

export const MAX_VERSIONS = 20;
export const MAX_PINNED = 10;
export const MAX_TAG_LENGTH = 20;
export const MAX_TITLE_LENGTH = 200;
export const AUTO_TITLE_LENGTH = 50;
export const MAX_FREE_NOTES = 20;
export const DEBOUNCE_SAVE = 400;
export const DEBOUNCE_SEARCH = 150;
export const TRASH_RETENTION_DAYS = 30;

// ── Tag color palette ────────────────────────────────────────

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

// Colour picker swatches for custom tag colours
export const COLOUR_SWATCHES = [
  '#ff6eb4', '#a78bfa', '#34d399', '#fbbf24',
  '#60a5fa', '#f87171', '#c084fc', '#2dd4bf',
  '#f472b6', '#818cf8', '#6ee7b7', '#fcd34d',
  '#93c5fd', '#fca5a5', '#d8b4fe', '#5eead4',
];

// ── Font options ─────────────────────────────────────────────

export const FONTS: { id: ContentFont; label: string; pro: boolean }[] = [
  { id: 'dm-mono',      label: 'DM Mono',       pro: false },
  { id: 'atkinson',     label: 'Atkinson',       pro: true },
  { id: 'opendyslexic', label: 'OpenDyslexic',   pro: true },
];

// ── Templates ────────────────────────────────────────────────

export interface Template {
  id: string;
  label: string;
  emoji: string;
  content: string;
  pro: boolean;
}

export const TEMPLATES: Template[] = [
  { id: 'meeting',   label: 'Meeting Notes',  emoji: '📋', pro: false, content: '## Meeting Notes\n\n**Date:** {{date}}\n**Attendees:**\n\n---\n\n### Agenda\n1. \n\n### Notes\n- \n\n### Action Items\n- [ ] \n' },
  { id: 'idea',      label: 'Idea',           emoji: '💡', pro: false, content: '## 💡 Idea\n\n**Date:** {{date}}\n\n### What\n\n### Why\n\n### How\n\n### Next Steps\n- [ ] \n' },
  { id: 'braindump', label: 'Brain Dump',     emoji: '🧠', pro: false, content: '## 🧠 Brain Dump — {{date}}\n\nJust write. No structure needed.\n\n' },
  { id: 'bug',       label: 'Bug Report',     emoji: '🐛', pro: true,  content: '## Bug Report\n\n**Date:** {{date}}\n\n### Description\n\n### Steps to Reproduce\n1. \n\n### Expected Behavior\n\n### Actual Behavior\n\n### Environment\n- \n' },
  { id: 'journal',   label: 'Journal Entry',  emoji: '📝', pro: true,  content: '## Journal — {{date}}\n\n### How am I feeling?\n\n### What happened today?\n\n### What am I grateful for?\n- \n\n### Tomorrow I want to...\n- \n' },
  { id: 'reading',   label: 'Reading Notes',  emoji: '📖', pro: true,  content: '## Reading Notes\n\n**Title:** \n**Author:** \n**Date:** {{date}}\n\n### Key Ideas\n- \n\n### Quotes\n> \n\n### My Thoughts\n\n' },
];

// ── Daily brain dump templates ───────────────────────────────

export const DAILY_TEMPLATE_BLANK = (dateStr: string) =>
  `─── ${dateStr} ───────────────────\n\n`;

export const DAILY_TEMPLATE_STRUCTURED = (dateStr: string) =>
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

// ── Welcome note ─────────────────────────────────────────────

export const WELCOME_NOTE = {
  title: 'Welcome to LoveSpark Notes 💖',
  content: `Hey bestie! Your notes live here, safe and sound.\n\nEverything is saved automatically — no account, no tracking, no ads. Just your ideas.\n\nTap the + button to create a new note. Your work is always safe — version history keeps the last 20 snapshots of every note.\n\nNow go capture those ideas 🌸`,
  tags: ['welcome'],
};

// ── Motivational messages ────────────────────────────────────

export const MESSAGES = [
  'Your ideas live here 💕',
  'Writing is thinking ✨',
  'Stay sparkly, bestie 🌸',
  'Safe and sound 💖',
  'Capture everything 🦋',
  'You got this ✦',
];

export const CELEBRATE_MESSAGES = [
  'First note! You\'re on your way! 🎉',
  '5 notes! You\'re building something 💪',
  '10 notes! Look at you go! 🌟',
  '50 notes! You\'re unstoppable! 🚀',
];

export const UPSELL_MESSAGES = [
  'You\'re on fire, bestie! 🔥',
  'Your ideas deserve unlimited space 💕',
  'Unlock your full creative potential ✨',
];
