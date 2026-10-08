// LoveSpark Planner — Constants & Storage Keys
'use strict';

const LSP = {
  // Storage keys
  KEY_TODOS: 'lsp_todos',
  KEY_EVENTS: 'lsp_events',
  KEY_SYNC: 'lsp_sync',
  KEY_PREFS: 'lsp_prefs',

  // Defaults
  DEFAULT_SYNC: {
    focusExtensionId: null,
    notesExtensionId: null,
    lastFocusSync: null,
    lastNotesSync: null,
  },

  DEFAULT_PREFS: {
    theme: 'retro',
    weekStartsOn: 1, // Monday
    defaultView: 'today',
    showCompletedTasks: true,
  },

  // Priority display
  PRIORITY: {
    high:   { label: 'High',   dot: '\u{1F534}', sortOrder: 0 },
    normal: { label: 'Normal', dot: '\u25CF',     sortOrder: 1 },
    low:    { label: 'Low',    dot: '\u25CB',     sortOrder: 2 },
  },

  // Motivational messages
  MESSAGES: [
    'Plan with love!',
    'You got this, bestie!',
    'Stay sparkly!',
    'One step at a time!',
    'Browse in peace!',
    'Looking good!',
  ],
};

if (typeof globalThis !== 'undefined') globalThis.LSP = LSP;
