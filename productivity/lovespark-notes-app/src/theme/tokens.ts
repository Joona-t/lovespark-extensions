// Ported from lovespark-base.css — all 4 theme palettes as TS objects

export type ThemeId = 'retro' | 'dark' | 'beige' | 'slate';

export interface ThemePalette {
  id: ThemeId;
  label: string;
  bgGradient: [string, string, string]; // start, mid, end
  glass: string;
  glassLight: string;
  glassBorder: string;
  glassStrong: string;
  pinkAccent: string;
  pinkDeep: string;
  white: string;
  textDark: string;
  textMuted: string;
  textWhite: string;
  radius: number;
  radiusSm: number;
  titleColor?: string; // override for theme-specific title color
  isDark: boolean;
}

export const THEMES: Record<ThemeId, ThemePalette> = {
  retro: {
    id: 'retro',
    label: 'Retro Pink',
    bgGradient: ['#FDCFE1', '#F9A8C9', '#F48CAF'],
    glass: 'rgba(255, 255, 255, 0.45)',
    glassLight: 'rgba(255, 255, 255, 0.25)',
    glassBorder: 'rgba(255, 255, 255, 0.4)',
    glassStrong: 'rgba(255, 255, 255, 0.6)',
    pinkAccent: '#E8457C',
    pinkDeep: '#D63466',
    white: '#FFFFFF',
    textDark: '#5C1A36',
    textMuted: '#9E4D6E',
    textWhite: '#FFFFFF',
    radius: 14,
    radiusSm: 10,
    isDark: false,
  },
  dark: {
    id: 'dark',
    label: 'Dark',
    bgGradient: ['#1a1128', '#110d1a', '#0a0812'],
    glass: 'rgba(26, 15, 46, 0.85)',
    glassLight: 'rgba(26, 15, 46, 0.5)',
    glassBorder: 'rgba(255, 110, 180, 0.13)',
    glassStrong: 'rgba(26, 15, 46, 0.95)',
    pinkAccent: '#ff6eb4',
    pinkDeep: '#c2185b',
    white: '#f0e6f6',
    textDark: '#f0e6f6',
    textMuted: '#9b7aac',
    textWhite: '#ffffff',
    radius: 14,
    radiusSm: 10,
    isDark: true,
  },
  beige: {
    id: 'beige',
    label: 'Beige',
    bgGradient: ['#f5efe0', '#f5efe0', '#ede4ce'],
    glass: '#ede4ce',
    glassLight: 'rgba(237, 228, 206, 0.6)',
    glassBorder: '#d4c4a0',
    glassStrong: '#e5dbc4',
    pinkAccent: '#c4806a',
    pinkDeep: '#a86c56',
    white: '#5c4a2a',
    textDark: '#5c4a2a',
    textMuted: '#8b6f47',
    textWhite: '#f5efe0',
    radius: 2,
    radiusSm: 2,
    titleColor: '#4a7c59',
    isDark: false,
  },
  slate: {
    id: 'slate',
    label: 'Slate',
    bgGradient: ['#1e1e1e', '#1e1e1e', '#252525'],
    glass: '#252525',
    glassLight: '#2d2d2d',
    glassBorder: '#4a4a4a',
    glassStrong: '#383838',
    pinkAccent: '#d4714e',
    pinkDeep: '#e8926e',
    white: '#ececec',
    textDark: '#ececec',
    textMuted: '#9a9a9a',
    textWhite: '#ececec',
    radius: 5,
    radiusSm: 4,
    titleColor: '#d4714e',
    isDark: true,
  },
};

export const THEME_LIST: ThemeId[] = ['retro', 'dark', 'beige', 'slate'];
