/* Dark Mode Reader — oklch.js
   Pure color math + the recolor mapping. No DOM. Unit-tested in tests/oklch.test.js.
   sRGB <-> OKLab per Björn Ottosson (2020). */
(function (root) {
  'use strict';

  // ── sRGB <-> linear ─────────────────────────────────────────────────────
  function srgbToLinear(c) { c /= 255; return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  function linearToSrgb(c) { const v = c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055; return Math.min(255, Math.max(0, Math.round(v * 255))); }

  // ── linear sRGB <-> OKLab ──────────────────────────────────────────────
  function rgbToOklab(r, g, b) {
    const lr = srgbToLinear(r), lg = srgbToLinear(g), lb = srgbToLinear(b);
    const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
    const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
    const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
    return {
      L: 0.2104542553 * l + 0.7936177850 * m - 0.0040720468 * s,
      a: 1.9779984951 * l - 2.4285922050 * m + 0.4505937099 * s,
      b: 0.0259040371 * l + 0.7827717662 * m - 0.8086757660 * s,
    };
  }
  function oklabToRgb(L, a, b) {
    const l = Math.pow(L + 0.3963377774 * a + 0.2158037573 * b, 3);
    const m = Math.pow(L - 0.1055613458 * a - 0.0638541728 * b, 3);
    const s = Math.pow(L - 0.0894841775 * a - 1.2914855480 * b, 3);
    const lr = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
    const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
    const lb = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
    return { r: linearToSrgb(lr), g: linearToSrgb(lg), b: linearToSrgb(lb), inGamut: inGamut(lr, lg, lb) };
  }
  function inGamut(lr, lg, lb) { const e = 0.002; return lr >= -e && lr <= 1 + e && lg >= -e && lg <= 1 + e && lb >= -e && lb <= 1 + e; }

  function rgbToOklch(r, g, b) {
    const { L, a, b: bb } = rgbToOklab(r, g, b);
    const C = Math.sqrt(a * a + bb * bb);
    let h = Math.atan2(bb, a) * 180 / Math.PI; if (h < 0) h += 360;
    return { L, C, h };
  }
  // Reduce chroma until the color fits sRGB (keeps hue + lightness exact).
  function oklchToRgb(L, C, h) {
    const rad = h * Math.PI / 180;
    let c = C;
    for (let i = 0; i < 12; i++) {
      const out = oklabToRgb(L, c * Math.cos(rad), c * Math.sin(rad));
      if (out.inGamut || c < 0.001) return out;
      c *= 0.8;
    }
    return oklabToRgb(L, 0, 0);
  }

  // ── WCAG contrast ───────────────────────────────────────────────────────
  function relLuminance(r, g, b) { return 0.2126 * srgbToLinear(r) + 0.7152 * srgbToLinear(g) + 0.0722 * srgbToLinear(b); }
  function contrast(c1, c2) {
    const y1 = relLuminance(c1.r, c1.g, c1.b), y2 = relLuminance(c2.r, c2.g, c2.b);
    const [hi, lo] = y1 > y2 ? [y1, y2] : [y2, y1];
    return (hi + 0.05) / (lo + 0.05);
  }

  // ── Mapping ─────────────────────────────────────────────────────────────
  // role: 'bg' | 'text' | 'border'. Returns {r,g,b} (alpha untouched by caller).
  const ACCENT_CHROMA = 0.07; // above this the colour is "a colour", not a grey
  function lerp(band, t) { return band[0] + (band[1] - band[0]) * Math.min(1, Math.max(0, t)); }

  function mapColor(rgb, role, palette) {
    const { L, C, h } = rgbToOklch(rgb.r, rgb.g, rgb.b);
    const accent = C > ACCENT_CHROMA;
    let L2, C2 = Math.min(C, palette.chromaCap), h2 = h;
    if (role === 'bg') {
      // light -> darkest, dark -> least dark (keeps header/body layering)
      // pow(…, 0.45) spreads the near-white range so white page vs light-grey card stay distinguishable
      L2 = accent ? lerp(palette.accentBg, L) : lerp(palette.bg, Math.pow(1 - L, 0.45));
    } else if (role === 'text') {
      // white text stays brightest, black text becomes light
      L2 = accent ? lerp(palette.accentText, L) : lerp(palette.text, L);
    } else { // border / shadow / divider
      L2 = accent ? lerp(palette.accentBg, L) + 0.05 : lerp(palette.border, 1 - L);
    }
    if (!accent) {
      // tint neutrals toward the palette hue (what makes Plum feel plum)
      C2 = palette.tint.chroma; h2 = palette.tint.hue;
    }
    return oklchToRgb(L2, C2, h2);
  }

  const api = { srgbToLinear, linearToSrgb, rgbToOklch, oklchToRgb, rgbToOklab, oklabToRgb, relLuminance, contrast, mapColor, ACCENT_CHROMA };
  root.DMR = root.DMR || {};
  root.DMR.oklch = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
