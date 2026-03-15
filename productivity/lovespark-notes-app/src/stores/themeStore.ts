import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandMMKVStorage } from './mmkv';
import type { ThemeId } from '../theme/tokens';

interface ThemeState {
  themeId: ThemeId;
  setTheme: (id: ThemeId) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      themeId: 'retro',
      setTheme: (themeId) => set({ themeId }),
    }),
    {
      name: 'theme-store',
      storage: createJSONStorage(() => zustandMMKVStorage),
    },
  ),
);
