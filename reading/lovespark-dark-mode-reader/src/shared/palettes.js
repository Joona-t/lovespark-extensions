/* Dark Mode Reader — palettes.js
   Lightness bands are in OKLCH L (0..1). The bands are chosen so that ANY text
   band value on ANY background band value clears WCAG AA 4.5:1 — tests/oklch.test.js
   proves it against the real sRGB conversion for every palette. Change a band,
   rerun the test. */
(function (root) {
  'use strict';
  const PALETTES = {
    noir: {
      id: 'noir', name: 'Noir', emoji: '🌑', desc: 'neutral, true dark',
      bg: [0.19, 0.30], text: [0.82, 0.96], border: [0.30, 0.46],
      accentBg: [0.24, 0.36], accentText: [0.78, 0.92],
      tint: { hue: 280, chroma: 0.004 },   // barely-there cool tint on neutrals
      chromaCap: 0.14,
    },
    plum: {
      id: 'plum', name: 'Plum', emoji: '💜', desc: 'LoveSpark brand dark',
      bg: [0.20, 0.30], text: [0.84, 0.96], border: [0.32, 0.46],
      accentBg: [0.24, 0.36], accentText: [0.78, 0.92],
      tint: { hue: 345, chroma: 0.03 },    // plum/rose cast on neutrals
      chromaCap: 0.14,
    },
    warm: {
      id: 'warm', name: 'Warm', emoji: '🕯️', desc: 'sepia dark for long reads',
      bg: [0.20, 0.31], text: [0.84, 0.95], border: [0.32, 0.46],
      accentBg: [0.24, 0.36], accentText: [0.78, 0.92],
      tint: { hue: 70, chroma: 0.025 },    // candlelight amber on neutrals
      chromaCap: 0.14,
    },
  };
  const DEFAULT_PALETTE = 'noir';
  const api = { PALETTES, DEFAULT_PALETTE, list: () => Object.values(PALETTES) };
  root.DMR = root.DMR || {};
  root.DMR.palettes = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
