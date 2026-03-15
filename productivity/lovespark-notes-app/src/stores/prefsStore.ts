import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMMKVStorage } from './mmkv';
import type { ContentFont, SortOrder, DailyMode, UserPrefs } from '../lib/constants';

interface PrefsState extends UserPrefs {
  setContentFont: (font: ContentFont) => void;
  setSortOrder: (order: SortOrder) => void;
  setDailyMode: (mode: DailyMode) => void;
  setHasSeenWelcome: (seen: boolean) => void;
  setLastEditedId: (id: string | null) => void;
}

export const usePrefsStore = create<PrefsState>()(
  persist(
    (set) => ({
      contentFont: 'dm-mono',
      sortOrder: 'updatedAt',
      dailyMode: 'blank',
      hasSeenWelcome: false,
      lastEditedId: null,

      setContentFont: (contentFont) => set({ contentFont }),
      setSortOrder: (sortOrder) => set({ sortOrder }),
      setDailyMode: (dailyMode) => set({ dailyMode }),
      setHasSeenWelcome: (hasSeenWelcome) => set({ hasSeenWelcome }),
      setLastEditedId: (lastEditedId) => set({ lastEditedId }),
    }),
    {
      name: 'prefs-store',
      storage: createJSONStorage(() => zustandMMKVStorage),
      partialize: (state) => ({
        contentFont: state.contentFont,
        sortOrder: state.sortOrder,
        dailyMode: state.dailyMode,
        hasSeenWelcome: state.hasSeenWelcome,
        lastEditedId: state.lastEditedId,
      }),
    },
  ),
);
