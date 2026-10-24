/* Dark Mode Reader — colors.js
   Parse CSS colours out of declaration values and rewrite them through the
   OKLCH mapper. Pure functions, DOM-free, unit-tested in tests/colors.test.js.
   Depends on DMR.oklch (oklch.js must load first). */
(function (root) {
  'use strict';
  const ok = root.DMR && root.DMR.oklch ? root.DMR.oklch : require('./oklch.js');

  // ── Named colours (CSS Color 4) ────────────────────────────────────────
  const NAMED = {aliceblue:'f0f8ff',antiquewhite:'faebd7',aqua:'00ffff',aquamarine:'7fffd4',azure:'f0ffff',beige:'f5f5dc',bisque:'ffe4c4',black:'000000',blanchedalmond:'ffebcd',blue:'0000ff',blueviolet:'8a2be2',brown:'a52a2a',burlywood:'deb887',cadetblue:'5f9ea0',chartreuse:'7fff00',chocolate:'d2691e',coral:'ff7f50',cornflowerblue:'6495ed',cornsilk:'fff8dc',crimson:'dc143c',cyan:'00ffff',darkblue:'00008b',darkcyan:'008b8b',darkgoldenrod:'b8860b',darkgray:'a9a9a9',darkgreen:'006400',darkgrey:'a9a9a9',darkkhaki:'bdb76b',darkmagenta:'8b008b',darkolivegreen:'556b2f',darkorange:'ff8c00',darkorchid:'9932cc',darkred:'8b0000',darksalmon:'e9967a',darkseagreen:'8fbc8f',darkslateblue:'483d8b',darkslategray:'2f4f4f',darkslategrey:'2f4f4f',darkturquoise:'00ced1',darkviolet:'9400d3',deeppink:'ff1493',deepskyblue:'00bfff',dimgray:'696969',dimgrey:'696969',dodgerblue:'1e90ff',firebrick:'b22222',floralwhite:'fffaf0',forestgreen:'228b22',fuchsia:'ff00ff',gainsboro:'dcdcdc',ghostwhite:'f8f8ff',gold:'ffd700',goldenrod:'daa520',gray:'808080',green:'008000',greenyellow:'adff2f',grey:'808080',honeydew:'f0fff0',hotpink:'ff69b4',indianred:'cd5c5c',indigo:'4b0082',ivory:'fffff0',khaki:'f0e68c',lavender:'e6e6fa',lavenderblush:'fff0f5',lawngreen:'7cfc00',lemonchiffon:'fffacd',lightblue:'add8e6',lightcoral:'f08080',lightcyan:'e0ffff',lightgoldenrodyellow:'fafad2',lightgray:'d3d3d3',lightgreen:'90ee90',lightgrey:'d3d3d3',lightpink:'ffb6c1',lightsalmon:'ffa07a',lightseagreen:'20b2aa',lightskyblue:'87cefa',lightslategray:'778899',lightslategrey:'778899',lightsteelblue:'b0c4de',lightyellow:'ffffe0',lime:'00ff00',limegreen:'32cd32',linen:'faf0e6',magenta:'ff00ff',maroon:'800000',mediumaquamarine:'66cdaa',mediumblue:'0000cd',mediumorchid:'ba55d3',mediumpurple:'9370db',mediumseagreen:'3cb371',mediumslateblue:'7b68ee',mediumspringgreen:'00fa9a',mediumturquoise:'48d1cc',mediumvioletred:'c71585',midnightblue:'191970',mintcream:'f5fffa',mistyrose:'ffe4e1',moccasin:'ffe4b5',navajowhite:'ffdead',navy:'000080',oldlace:'fdf5e6',olive:'808000',olivedrab:'6b8e23',orange:'ffa500',orangered:'ff4500',orchid:'da70d6',palegoldenrod:'eee8aa',palegreen:'98fb98',paleturquoise:'afeeee',palevioletred:'db7093',papayawhip:'ffefd5',peachpuff:'ffdab9',peru:'cd853f',pink:'ffc0cb',plum:'dda0dd',powderblue:'b0e0e6',purple:'800080',rebeccapurple:'663399',red:'ff0000',rosybrown:'bc8f8f',royalblue:'4169e1',saddlebrown:'8b4513',salmon:'fa8072',sandybrown:'f4a460',seagreen:'2e8b57',seashell:'fff5ee',sienna:'a0522d',silver:'c0c0c0',skyblue:'87ceeb',slateblue:'6a5acd',slategray:'708090',slategrey:'708090',snow:'fffafa',springgreen:'00ff7f',steelblue:'4682b4',tan:'d2b48c',teal:'008080',thistle:'d8bfd8',tomato:'ff6347',turquoise:'40e0d0',violet:'ee82ee',wheat:'f5deb3',white:'ffffff',whitesmoke:'f5f5f5',yellow:'ffff00',yellowgreen:'9acd32'};

  // ── Parsing ─────────────────────────────────────────────────────────────
  function hexToRgba(hex) {
    let h = hex.slice(1);
    if (h.length === 3 || h.length === 4) h = h.split('').map(c => c + c).join('');
    if (h.length !== 6 && h.length !== 8) return null;
    const n = parseInt(h, 16); if (Number.isNaN(n)) return null;
    const a = h.length === 8 ? (n & 255) / 255 : 1;
    const v = h.length === 8 ? n >>> 8 : n;
    return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255, a };
  }
  function num(s, max) {
    s = s.trim();
    if (s.endsWith('%')) return parseFloat(s) / 100 * max;
    return parseFloat(s);
  }
  function alpha(s) {
    if (s === undefined) return 1;
    s = s.trim();
    return s.endsWith('%') ? parseFloat(s) / 100 : parseFloat(s);
  }
  function hslToRgb(h, s, l) {
    h = ((h % 360) + 360) % 360; s = Math.min(1, Math.max(0, s)); l = Math.min(1, Math.max(0, l));
    const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs((h / 60) % 2 - 1)), m = l - c / 2;
    let r, g, b;
    if (h < 60) [r, g, b] = [c, x, 0]; else if (h < 120) [r, g, b] = [x, c, 0]; else if (h < 180) [r, g, b] = [0, c, x];
    else if (h < 240) [r, g, b] = [0, x, c]; else if (h < 300) [r, g, b] = [x, 0, c]; else [r, g, b] = [c, 0, x];
    return { r: Math.round((r + m) * 255), g: Math.round((g + m) * 255), b: Math.round((b + m) * 255) };
  }
  function parseFn(fn, args) {
    const parts = args.split(/\s*[,/]\s*|\s+/).filter(Boolean);
    if (parts.length < 3) return null;
    if (parts.some(p => p.includes('var(') || /^[a-z-]+$/i.test(p) && p !== 'none')) return null; // var()/keywords: leave alone
    if (fn === 'rgb' || fn === 'rgba') {
      const r = num(parts[0], 255), g = num(parts[1], 255), b = num(parts[2], 255);
      if ([r, g, b].some(Number.isNaN)) return null;
      return { r: Math.round(r), g: Math.round(g), b: Math.round(b), a: alpha(parts[3]) };
    }
    if (fn === 'hsl' || fn === 'hsla') {
      const h = parseFloat(parts[0]), s = num(parts[1], 1), l = num(parts[2], 1);
      if ([h, s, l].some(Number.isNaN)) return null;
      return { ...hslToRgb(h, s, l), a: alpha(parts[3]) };
    }
    return null;
  }
  // Returns {r,g,b,a} or null. `transparent`/`currentcolor`/`inherit` → null (untouched).
  function parseColor(token) {
    const t = token.trim().toLowerCase();
    if (t[0] === '#') return hexToRgba(t);
    const m = /^(rgba?|hsla?)\(([^)]*)\)$/.exec(t);
    if (m) return parseFn(m[1], m[2]);
    if (NAMED[t]) return { ...hexToRgba('#' + NAMED[t]), a: 1 };
    return null;
  }
  function fmt(c, a) {
    return a >= 1 ? `rgb(${c.r}, ${c.g}, ${c.b})` : `rgba(${c.r}, ${c.g}, ${c.b}, ${Math.round(a * 1000) / 1000})`;
  }

  // ── Property → role ────────────────────────────────────────────────────
  const BG_PROPS = new Set(['background', 'background-color', 'background-image']);
  const TEXT_PROPS = new Set(['color', 'fill', 'caret-color', 'text-decoration-color', 'text-emphasis-color', '-webkit-text-fill-color', 'column-rule-color', 'stroke']);
  const BORDER_PROPS = new Set(['border', 'border-color', 'border-top', 'border-right', 'border-bottom', 'border-left', 'border-top-color', 'border-right-color', 'border-bottom-color', 'border-left-color', 'border-block', 'border-inline', 'outline', 'outline-color', 'box-shadow', 'text-shadow', 'scrollbar-color', 'accent-color']);
  function roleFor(prop) {
    if (BG_PROPS.has(prop)) return 'bg';
    if (TEXT_PROPS.has(prop)) return 'text';
    if (BORDER_PROPS.has(prop)) return 'border';
    return null;
  }
  // Custom properties: guess from the name, then from lightness.
  function isColorProp(prop) { return roleFor(prop) !== null || prop.startsWith('--'); }

  // ── Value rewriting ────────────────────────────────────────────────────
  // Matches hex, rgb()/hsl() calls, and named colours as whole words. url(...)
  // bodies are skipped so "url(red.png)" is never touched.
  const COLOR_RE = /url\([^)]*\)|#[0-9a-f]{3,8}\b|\b(?:rgba?|hsla?)\([^)]*\)|\b[a-z]{3,20}\b/gi;
  function rewriteValue(value, role, palette) {
    let changed = false;
    const out = value.replace(COLOR_RE, (tok) => {
      if (tok.startsWith('url(')) return tok;
      const c = parseColor(tok);
      if (!c) return tok;
      if (c.a === 0) return tok; // fully transparent: keep
      changed = true;
      return fmt(ok.mapColor(c, role, palette), c.a);
    });
    return changed ? out : null;
  }
  // ── var() rewriting ────────────────────────────────────────────────────
  // color: var(--x)  →  color: var(--dmr-text-x, var(--x))
  // The derived var is emitted next to every definition of --x (expandCustomProp),
  // and the fallback keeps the page intact when we never saw the definition.
  const ROLES = ['bg', 'text', 'border'];
  function derivedName(name, role) { return `--dmr-${role}-${name.slice(2)}`; }
  function rewriteVars(value, role, palette) {
    let out = '', i = 0, changed = false;
    while (i < value.length) {
      const at = value.indexOf('var(', i);
      if (at < 0) { out += rewriteLiterals(value.slice(i), role, palette); break; }
      out += rewriteLiterals(value.slice(i, at), role, palette);
      // find matching paren
      let depth = 0, j = at + 3;
      for (; j < value.length; j++) { if (value[j] === '(') depth++; else if (value[j] === ')') { depth--; if (depth === 0) break; } }
      const inner = value.slice(at + 4, j);
      const m = /^\s*(--[\w-]+)\s*(?:,([\s\S]*))?$/.exec(inner);
      if (!m) { out += value.slice(at, j + 1); i = j + 1; continue; }
      const name = m[1];
      const fb = m[2] !== undefined ? ',' + rewriteVars(m[2], role, palette).out : '';
      out += `var(${derivedName(name, role)}, var(${name}${fb}))`;
      changed = true;
      i = j + 1;
    }
    return { out, changed: changed || out !== value };
  }
  function rewriteLiterals(fragment, role, palette) {
    const r = rewriteValue(fragment, role, palette);
    return r === null ? fragment : r;
  }
  // Single declaration (color:, background-color:, box-shadow:, …). Returns new value or null.
  function rewriteDeclaration(prop, value, palette) {
    const v = value.trim();
    if (!v) return null;
    const role = roleFor(prop);
    if (!role) return null;
    if (prop === 'background-image' && !/gradient\(|var\(/.test(v)) return null; // url() only
    if (v.includes('var(')) { const r = rewriteVars(v, role, palette); return r.changed ? r.out : null; }
    return rewriteValue(v, role, palette);
  }
  // Custom property definition → up to 3 derived definitions, one per role.
  // Returns [[prop, value], …] or [] when the value carries no colour.
  function expandCustomProp(name, value, palette) {
    const v = value.trim();
    if (!v) return [];
    const isGradient = /gradient\(/.test(v);
    if (!isGradient && !parseColor(v) && !v.includes('var(')) return []; // not a colour (e.g. --gap: 8px)
    const out = [];
    for (const role of (isGradient ? ['bg'] : ROLES)) {
      let next;
      if (v.includes('var(')) { const r = rewriteVars(v, role, palette); next = r.changed ? r.out : null; }
      else next = rewriteValue(v, role, palette);
      if (next !== null) out.push([derivedName(name, role), next]);
    }
    return out;
  }

  const api = { parseColor, rewriteValue, rewriteDeclaration, expandCustomProp, rewriteVars, derivedName, roleFor, isColorProp, fmt, NAMED };
  root.DMR = root.DMR || {};
  root.DMR.colors = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
