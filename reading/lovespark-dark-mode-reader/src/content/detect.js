/* Dark Mode Reader — detect.js
   Is this page already dark on its own? If yes we stand aside (B3).
   Measures the page's OWN colours by disabling our sheets for one sync style
   recalc; no paint happens in between. */
(function (root) {
  'use strict';
  const ok = (root.DMR && root.DMR.oklch) || require('./recolor/oklch.js');

  function parseRgb(str) {
    const m = /rgba?\(\s*([\d.]+)[,\s]+([\d.]+)[,\s]+([\d.]+)(?:[,\s/]+([\d.]+%?))?/.exec(str || '');
    if (!m) return null;
    let a = m[4] === undefined ? 1 : parseFloat(m[4]); if (m[4] && m[4].endsWith('%')) a /= 100;
    return { r: +m[1], g: +m[2], b: +m[3], a };
  }

  function metaHint() {
    const meta = document.querySelector('meta[name="color-scheme"]');
    if (!meta) return null;
    const v = (meta.getAttribute('content') || '').toLowerCase();
    if (v.includes('dark') && !v.includes('light')) return 'dark';
    if (v.includes('light') && !v.includes('dark')) return 'light';
    return null;
  }

  // disableFn/enableFn toggle our own styles; returns { nativeDark, bgLum, reason }
  function measure(disableFn, enableFn) {
    const html = document.documentElement, body = document.body;
    if (!body) return { nativeDark: false, reason: 'no-body' };
    disableFn();
    let bg = null, fg = null;
    try {
      const bs = getComputedStyle(body), hs = getComputedStyle(html);
      const bb = parseRgb(bs.backgroundColor), hb = parseRgb(hs.backgroundColor);
      bg = (bb && bb.a > 0.5) ? bb : (hb && hb.a > 0.5) ? hb : null;
      fg = parseRgb(bs.color);
    } finally {
      enableFn();
    }
    return classify(bg, fg, metaHint());
  }

  // Pure decision, unit-tested in tests/detect.test.js.
  // Near-black background is dark on its own (YouTube: html #0f0f0f, body color black
  // because text colour lives on inner elements). Mid-dark needs lighter text to agree.
  function classify(bg, fg, hint) {
    if (!bg) {
      // transparent everywhere → UA canvas → white unless the page asked for dark
      return { nativeDark: hint === 'dark', bgLum: 1, reason: hint === 'dark' ? 'meta-dark' : 'transparent' };
    }
    const bgLum = ok.relLuminance(bg.r, bg.g, bg.b);
    const fgLum = fg ? ok.relLuminance(fg.r, fg.g, fg.b) : 0;
    const nativeDark = bgLum < 0.05 || (bgLum < 0.2 && fgLum > bgLum);
    return { nativeDark, bgLum, reason: nativeDark ? 'measured-dark' : 'measured-light' };
  }

  const api = { measure, metaHint, parseRgb, classify };
  root.DMR = root.DMR || {};
  root.DMR.detect = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
