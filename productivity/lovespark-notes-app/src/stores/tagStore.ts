import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMMKVStorage } from './mmkv';
import { sanitizeTag, getDefaultTagColour } from '../lib/formatters';
import type { TagDefinition } from '../lib/constants';

interface TagState {
  tags: TagDefinition[];

  createTag: (name: string, colour?: string) => TagDefinition | null;
  deleteTag: (name: string) => void;
  renameTag: (oldName: string, newName: string) => string | null;
  mergeTag: (from: string, into: string) => void;
  setColour: (name: string, colour: string) => void;
  getTag: (name: string) => TagDefinition | undefined;
  getOrCreateTag: (name: string) => TagDefinition;
}

export const useTagStore = create<TagState>()(
  persist(
    (set, get) => ({
      tags: [],

      createTag: (rawName, colour) => {
        const name = sanitizeTag(rawName);
        if (!name) return null;
        if (get().tags.some(t => t.name === name)) return get().tags.find(t => t.name === name)!;

        const tag: TagDefinition = {
          name,
          colour: colour || getDefaultTagColour(name).color,
          createdAt: Date.now(),
        };
        set((state) => ({ tags: [...state.tags, tag] }));
        return tag;
      },

      deleteTag: (name) => {
        set((state) => ({ tags: state.tags.filter(t => t.name !== name) }));
      },

      renameTag: (oldName, rawNew) => {
        const newName = sanitizeTag(rawNew);
        if (!newName || newName === oldName) return null;
        if (get().tags.some(t => t.name === newName)) return null; // already exists

        set((state) => ({
          tags: state.tags.map(t =>
            t.name === oldName ? { ...t, name: newName } : t
          ),
        }));
        return newName;
      },

      mergeTag: (from, into) => {
        // Keep 'into', remove 'from' — caller must update notes
        set((state) => ({
          tags: state.tags.filter(t => t.name !== from),
        }));
      },

      setColour: (name, colour) => {
        set((state) => ({
          tags: state.tags.map(t =>
            t.name === name ? { ...t, colour } : t
          ),
        }));
      },

      getTag: (name) => {
        return get().tags.find(t => t.name === name);
      },

      getOrCreateTag: (name) => {
        const existing = get().getTag(name);
        if (existing) return existing;
        return get().createTag(name)!;
      },
    }),
    {
      name: 'tag-store',
      storage: createJSONStorage(() => zustandMMKVStorage),
      partialize: (state) => ({ tags: state.tags }),
    },
  ),
);
