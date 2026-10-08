/**
 * Theme definitions + pure math color conversion.
 *
 * Each theme maps 8 token types to hex colors. LAB conversion uses
 * sRGB → XYZ (D65) → CIE L*a*b* → Pillow LAB encoding (0-255).
 * Zero dependencies.
 */

// ── Hex / Color Conversion ──────────────────────────────────────────

function hexToRgb(h) {
  h = h.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function _srgbToLinear(c) {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function _labF(t) {
  const delta = 6.0 / 29.0;
  return t > delta * delta * delta
    ? Math.pow(t, 1.0 / 3.0)
    : t / (3.0 * delta * delta) + 4.0 / 29.0;
}

// D65 reference white
const _XN = 0.95047;
const _YN = 1.00000;
const _ZN = 1.08883;

/**
 * Convert hex color to Pillow LAB encoding (0-255 each channel).
 * sRGB → linear → XYZ (D65) → CIE L*a*b* → Pillow LAB.
 */
function hexToLab(h) {
  const [r8, g8, b8] = hexToRgb(h);

  const rl = _srgbToLinear(r8 / 255.0);
  const gl = _srgbToLinear(g8 / 255.0);
  const bl = _srgbToLinear(b8 / 255.0);

  const x = 0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl;
  const y = 0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl;
  const z = 0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl;

  const fx = _labF(x / _XN);
  const fy = _labF(y / _YN);
  const fz = _labF(z / _ZN);

  const Lstar = 116.0 * fy - 16.0;
  const astar = 500.0 * (fx - fy);
  const bstar = 200.0 * (fy - fz);

  // CIE L*a*b* → Pillow LAB encoding
  const Lp = Math.round(Lstar * 255.0 / 100.0);
  const ap = Math.round(astar + 128.0);
  const bp = Math.round(bstar + 128.0);

  return [
    Math.max(0, Math.min(255, Lp)),
    Math.max(0, Math.min(255, ap)),
    Math.max(0, Math.min(255, bp)),
  ];
}

/**
 * Convert sRGB (0-255) to Pillow LAB encoding (0-255).
 * Hot path — called per pixel during image conversion.
 */
function srgbToLab(r8, g8, b8) {
  const rl = _srgbToLinear(r8 / 255.0);
  const gl = _srgbToLinear(g8 / 255.0);
  const bl = _srgbToLinear(b8 / 255.0);

  const x = 0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl;
  const y = 0.2126729 * rl + 0.7151522 * gl + 0.0721750 * bl;
  const z = 0.0193339 * rl + 0.1191920 * gl + 0.9503041 * bl;

  const fx = _labF(x / _XN);
  const fy = _labF(y / _YN);
  const fz = _labF(z / _ZN);

  const Lstar = 116.0 * fy - 16.0;
  const astar = 500.0 * (fx - fy);
  const bstar = 200.0 * (fy - fz);

  return [
    Math.max(0, Math.min(255, Math.round(Lstar * 255.0 / 100.0))),
    Math.max(0, Math.min(255, Math.round(astar + 128.0))),
    Math.max(0, Math.min(255, Math.round(bstar + 128.0))),
  ];
}


// ── Theme Definitions ───────────────────────────────────────────────

const THEMES = {
  dracula: {
    name: 'dracula',
    background: '#282A36',
    tokenColors: {
      keyword:  '#FF79C6',
      string:   '#F1FA8C',
      number:   '#BD93F9',
      operator: '#FFB86C',
      function: '#50FA7B',
      comment:  '#6272A4',
      variable: '#F8F8F2',
      type:     '#8BE9FD',
    },
  },

  monokai: {
    name: 'monokai',
    background: '#272822',
    tokenColors: {
      keyword:  '#F92672',
      string:   '#E6DB74',
      number:   '#AE81FF',
      operator: '#FD971F',
      function: '#A6E22E',
      comment:  '#75715E',
      variable: '#F8F8F2',
      type:     '#66D9EF',
    },
  },

  lovespark: {
    name: 'lovespark',
    background: '#1A0A12',
    tokenColors: {
      keyword:  '#FF6B9D',
      string:   '#C084FC',
      number:   '#F9A8D4',
      operator: '#FFA07A',
      function: '#A78BFA',
      comment:  '#9CA3AF',
      variable: '#FDF2F8',
      type:     '#E879F9',
    },
  },

  'github-light': {
    name: 'github-light',
    background: '#FFFFFF',
    tokenColors: {
      keyword:  '#D73A49',
      string:   '#032F62',
      number:   '#005CC5',
      operator: '#E36209',
      function: '#6F42C1',
      comment:  '#6A737D',
      variable: '#24292E',
      type:     '#22863A',
    },
  },
};
