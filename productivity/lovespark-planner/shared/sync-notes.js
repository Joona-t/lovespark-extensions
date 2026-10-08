// LoveSpark Planner — Notes Extension Sync
'use strict';

const SyncNotes = (() => {
  async function pull(notesExtensionId) {
    if (!notesExtensionId) throw new Error('No Notes extension ID configured');

    return new Promise((resolve, reject) => {
      chrome.runtime.sendMessage(notesExtensionId, { action: 'EXPORT_NOTES' }, (response) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!response) {
          reject(new Error('No response from Notes extension'));
          return;
        }
        resolve(response);
      });
    });
  }

  function transformNotes(notesData) {
    const events = [];
    const notes = notesData.notes || [];

    for (const note of notes) {
      // Daily notes have a date in their title or are category 'daily'
      if (note.category !== 'daily') continue;

      // Try to extract date from title or use creation date
      let date = null;
      const titleMatch = note.title?.match(/(\d{4}-\d{2}-\d{2})/);
      if (titleMatch) {
        date = titleMatch[1];
      } else if (note.createdAt) {
        date = new Date(note.createdAt).toISOString().slice(0, 10);
      }
      if (!date) continue;

      events.push({
        id: 'note_' + note.id,
        date,
        type: 'daily-note',
        title: note.title || 'Daily note',
        metadata: {
          noteId: note.id,
          wordCount: note.wordCount || 0,
          snippet: note.snippet || '',
          category: note.category,
        },
      });
    }

    return events;
  }

  async function syncAll(notesExtensionId) {
    const data = await pull(notesExtensionId);

    // Replace note events
    const existingEvents = await PlannerCore.getEvents();
    const nonNoteEvents = existingEvents.filter(e => e.type !== 'daily-note');
    const noteEvents = transformNotes(data);
    await PlannerCore.saveEvents([...nonNoteEvents, ...noteEvents]);

    // Update sync timestamp
    const sync = await PlannerCore.getSync();
    sync.lastNotesSync = Date.now();
    await PlannerCore.saveSync(sync);

    return {
      notesImported: noteEvents.length,
    };
  }

  return { pull, syncAll, transformNotes };
})();

if (typeof globalThis !== 'undefined') globalThis.SyncNotes = SyncNotes;
