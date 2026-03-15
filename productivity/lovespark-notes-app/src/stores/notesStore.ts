import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMMKVStorage, storage } from './mmkv';
import { genId, wordCount } from '../lib/formatters';
import {
  MAX_PINNED, MAX_VERSIONS, TRASH_RETENTION_DAYS,
  type NoteEntry, type NoteVersion,
} from '../lib/constants';

interface NotesState {
  notes: NoteEntry[];

  // CRUD
  createNote: (overrides?: Partial<Pick<NoteEntry, 'title' | 'tags'> & { content: string }>) => NoteEntry;
  updateNote: (id: string, patch: { title?: string; content?: string; tags?: string[]; pinned?: boolean }) => NoteEntry | null;
  deleteNote: (id: string) => void;
  restoreNote: (id: string) => void;
  permanentlyDelete: (id: string) => void;
  emptyTrash: () => void;
  togglePin: (id: string) => boolean;

  // Content (stored separately in MMKV by key)
  loadContent: (id: string) => string;
  saveContent: (id: string, content: string) => void;

  // Versions (Pro)
  pushVersion: (id: string) => void;
  loadVersions: (id: string) => NoteVersion[];
  restoreVersion: (id: string, version: NoteVersion) => void;

  // Filtering
  filterNotes: (opts?: { tags?: string[]; search?: string; showTrash?: boolean; sortOrder?: 'updatedAt' | 'createdAt' | 'title' }) => NoteEntry[];

  // Counts
  activeNoteCount: () => number;

  // Maintenance
  garbageCollect: () => void;
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: [],

      createNote: (overrides = {}) => {
        const now = Date.now();
        const content = overrides.content || '';
        const note: NoteEntry = {
          id: genId(),
          title: overrides.title || '',
          pinned: false,
          tags: overrides.tags || [],
          wordCount: wordCount(content),
          snippet: content.replace(/\n/g, ' ').trim().slice(0, 80),
          createdAt: now,
          updatedAt: now,
        };

        storage.set('note_' + note.id, content);
        set((state) => ({ notes: [note, ...state.notes] }));
        return note;
      },

      updateNote: (id, patch) => {
        const { notes } = get();
        const idx = notes.findIndex(n => n.id === id);
        if (idx === -1) return null;

        const updated = { ...notes[idx], updatedAt: Date.now() };

        if (patch.content !== undefined) {
          storage.set('note_' + id, patch.content);
          updated.wordCount = wordCount(patch.content);
          updated.snippet = patch.content.replace(/\n/g, ' ').trim().slice(0, 80);
        }
        if (patch.title !== undefined) updated.title = patch.title;
        if (patch.tags !== undefined) updated.tags = patch.tags;
        if (patch.pinned !== undefined) updated.pinned = patch.pinned;

        const newNotes = [...notes];
        newNotes[idx] = updated;
        set({ notes: newNotes });
        return updated;
      },

      deleteNote: (id) => {
        set((state) => ({
          notes: state.notes.map(n =>
            n.id === id ? { ...n, deletedAt: Date.now(), pinned: false } : n
          ),
        }));
      },

      restoreNote: (id) => {
        set((state) => ({
          notes: state.notes.map(n => {
            if (n.id !== id || !n.deletedAt) return n;
            const { deletedAt: _, ...rest } = n;
            return { ...rest, updatedAt: Date.now() };
          }),
        }));
      },

      permanentlyDelete: (id) => {
        storage.remove('note_' + id);
        storage.remove('versions_' + id);
        set((state) => ({
          notes: state.notes.filter(n => n.id !== id),
        }));
      },

      emptyTrash: () => {
        const { notes } = get();
        const trashed = notes.filter(n => n.deletedAt);
        trashed.forEach(n => {
          storage.remove('note_' + n.id);
          storage.remove('versions_' + n.id);
        });
        set({ notes: notes.filter(n => !n.deletedAt) });
      },

      togglePin: (id) => {
        const { notes } = get();
        const note = notes.find(n => n.id === id);
        if (!note) return false;

        const newPinned = !note.pinned;
        if (newPinned && notes.filter(n => n.pinned && !n.deletedAt).length >= MAX_PINNED) return false;

        set((state) => ({
          notes: state.notes.map(n =>
            n.id === id ? { ...n, pinned: newPinned, updatedAt: Date.now() } : n
          ),
        }));
        return newPinned;
      },

      loadContent: (id) => {
        return storage.getString('note_' + id) || '';
      },

      saveContent: (id, content) => {
        storage.set('note_' + id, content);
      },

      pushVersion: (id) => {
        const content = storage.getString('note_' + id);
        if (!content) return;

        const key = 'versions_' + id;
        const raw = storage.getString(key);
        const versions: NoteVersion[] = raw ? JSON.parse(raw) : [];

        versions.push({ content, ts: Date.now() });
        if (versions.length > MAX_VERSIONS) versions.shift();
        storage.set(key, JSON.stringify(versions));
      },

      loadVersions: (id) => {
        const raw = storage.getString('versions_' + id);
        return raw ? JSON.parse(raw) : [];
      },

      restoreVersion: (id, version) => {
        storage.set('note_' + id, version.content);
        const { notes } = get();
        const idx = notes.findIndex(n => n.id === id);
        if (idx === -1) return;

        const updated = {
          ...notes[idx],
          updatedAt: Date.now(),
          wordCount: wordCount(version.content),
          snippet: version.content.replace(/\n/g, ' ').trim().slice(0, 80),
        };
        const newNotes = [...notes];
        newNotes[idx] = updated;
        set({ notes: newNotes });
      },

      filterNotes: (opts = {}) => {
        const { tags = [], search = '', showTrash = false, sortOrder = 'updatedAt' } = opts;
        const { notes } = get();
        const q = search.toLowerCase();

        const filtered = notes.filter(n => {
          if (showTrash) return !!n.deletedAt;
          if (n.deletedAt) return false;

          const matchTags = tags.length === 0 || tags.every(t => n.tags.includes(t));
          const matchSearch = !q ||
            n.title.toLowerCase().includes(q) ||
            n.tags.some(t => t.toLowerCase().includes(q)) ||
            n.snippet.toLowerCase().includes(q);
          return matchTags && matchSearch;
        });

        return filtered.sort((a, b) => {
          if (a.pinned && !b.pinned) return -1;
          if (!a.pinned && b.pinned) return 1;
          if (sortOrder === 'title') return a.title.localeCompare(b.title);
          if (sortOrder === 'createdAt') return b.createdAt - a.createdAt;
          return b.updatedAt - a.updatedAt;
        });
      },

      activeNoteCount: () => {
        return get().notes.filter(n => !n.deletedAt).length;
      },

      garbageCollect: () => {
        const cutoff = Date.now() - TRASH_RETENTION_DAYS * 86400000;
        const { notes } = get();
        const expired = notes.filter(n => n.deletedAt && n.deletedAt < cutoff);
        expired.forEach(n => {
          storage.remove('note_' + n.id);
          storage.remove('versions_' + n.id);
        });
        if (expired.length > 0) {
          set({ notes: notes.filter(n => !n.deletedAt || n.deletedAt >= cutoff) });
        }
      },
    }),
    {
      name: 'notes-store',
      storage: createJSONStorage(() => zustandMMKVStorage),
      partialize: (state) => ({ notes: state.notes }),
    },
  ),
);
