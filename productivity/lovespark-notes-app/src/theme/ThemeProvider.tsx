import React, { createContext, useContext, useMemo } from 'react';
import { useThemeStore } from '../stores/themeStore';
import { THEMES, type ThemeId, type ThemePalette } from './tokens';

interface ThemeContextValue {
  theme: ThemePalette;
  themeId: ThemeId;
  setTheme: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeId = useThemeStore(s => s.themeId);
  const setTheme = useThemeStore(s => s.setTheme);

  const value = useMemo(() => ({
    theme: THEMES[themeId],
    themeId,
    setTheme,
  }), [themeId, setTheme]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}
