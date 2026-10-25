// Applies each theme with transitions off and measures every visible text node
// against its composited background (worst gradient stop). Writes JSON into
// a <pre> with id __sweep. Large text (≥24px, or ≥18.66px bold) needs 3:1.
(() => {
  const THEMES = ['seoul', 'gingham', 'holo', 'neon', 'bubblegum', 'retro', 'dark', 'beige', 'slate'];
  const off = document.createElement('style');
  off.textContent = '*,*::before,*::after{transition:none!important;animation:none!important}';
  document.head.appendChild(off);
  const rgb = (s) => (s.match(/[\d.]+/g) || []).map(Number);
  const lum = ([r, g, b]) => [r, g, b].map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; })
    .reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
  const ratio = (a, b) => { const x = lum(a), y = lum(b); return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05); };
  const stops = (img) => (img.match(/#[0-9a-f]{6}\b|rgba?\([^)]*\)/gi) || [])
    .map((s) => (s[0] === '#' ? [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16), 1] : rgb(s)))
    .filter((s) => (s[3] ?? 1) > 0);
  function splitLayers(img) {
    const out = []; let depth = 0; let cur = '';
    for (const ch of img) {
      if (ch === '(') depth++;
      if (ch === ')') depth--;
      if (ch === ',' && depth === 0) { out.push(cur.trim()); cur = ''; } else cur += ch;
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }
  function bases(el) {
    const chain = []; for (let e = el; e; e = e.parentElement) chain.push(e); chain.reverse();
    let out = [[255, 255, 255]];
    for (const e of chain) {
      const cs = getComputedStyle(e);
      const c = rgb(cs.backgroundColor);
      if (c.length >= 3 && (c[3] ?? 1) > 0) { const a = c[3] ?? 1; out = out.map((b) => b.map((v, i) => v * (1 - a) + c[i] * a)); }
      const img = cs.backgroundImage;
      if (img && img !== 'none') {
        // Paint layers bottom-up (the last listed layer is the bottom). A layer
        // with transparent stops also leaves the layers below visible there.
        for (const layer of splitLayers(img).reverse()) {
          if (layer.startsWith('url')) continue;
          const all = (layer.match(/#[0-9a-f]{6}\b|rgba?\([^)]*\)|transparent/gi) || []);
          const st = stops(layer);
          if (!st.length) continue;
          const seeThrough = all.some((x) => /transparent/i.test(x) || /rgba\([^)]*,\s*0\)$/.test(x));
          const nb = seeThrough ? out.slice() : [];
          for (const b of out) for (const s of st) { const a = s[3] ?? 1; nb.push(b.map((v, i) => v * (1 - a) + s[i] * a)); }
          out = nb.slice(0, 48);
        }
      }
    }
    return out;
  }
  const result = {};
  for (const t of THEMES) {
    THEMES.forEach((x) => document.body.classList.remove('theme-' + x));
    document.body.classList.add('theme-' + t);
    if (t === 'neon') document.body.classList.add('theme-dark'); // as lovespark-theme.js does
    void document.body.offsetHeight;
    const fails = []; let n = 0; let worst = 99;
    document.querySelectorAll('body *').forEach((el) => {
      if (!['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEMPLATE'].includes(el.tagName) && [...el.childNodes].some((c) => c.nodeType === 3 && c.textContent.trim())) {
        const own = [...el.childNodes].filter((c) => c.nodeType === 3).map((c) => c.textContent).join('');
        if (!/[\p{L}\p{N}]/u.test(own)) return; // emoji / symbol-only glyphs are not text (WCAG 1.4.3)
        const r = el.getBoundingClientRect(); if (!r.width || !r.height) return;
        const cs = getComputedStyle(el);
        if (cs.visibility === 'hidden' || cs.display === 'none' || el.closest('.sr-only,[aria-hidden="true"],#__sweep')) return;
        if (+cs.opacity === 0) return;
        let fgs = [rgb(cs.color)];
        let bgEl = el;
        const clipText = (cs.webkitBackgroundClip || cs.backgroundClip) === 'text';
        if (clipText && /rgba\(0, 0, 0, 0\)|transparent/.test(cs.webkitTextFillColor || '')) {
          fgs = stops(cs.backgroundImage).map((x) => x.slice(0, 3)); // gradient-painted text
          bgEl = el.parentElement;
        }
        if (!fgs.length || fgs[0].length < 3) return;
        const k = Math.min(...bases(bgEl).flatMap((b) => fgs.map((fg) => ratio(fg, b))));
        const fs = parseFloat(cs.fontSize); const big = fs >= 24 || (fs >= 18.66 && +cs.fontWeight >= 700);
        n++; worst = Math.min(worst, k);
        if (k < (big ? 3 : 4.5)) fails.push({ k: +k.toFixed(2), sel: el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : ''), text: el.textContent.trim().slice(0, 30), color: cs.color });
      }
    });
    result[t] = { n, worst: +worst.toFixed(2), fails };
  }
  const menu = document.getElementById('themeMenu');
  result._menu = menu ? [...menu.querySelectorAll('.theme-option')].map((o) => o.dataset.theme) : null;
  result._errors = window.__sweepErrors || [];
  const pre = document.createElement('pre'); pre.id = '__sweep'; pre.textContent = JSON.stringify(result);
  document.body.appendChild(pre);
})();
