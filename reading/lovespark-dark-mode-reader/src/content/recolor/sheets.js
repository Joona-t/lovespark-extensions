/* Dark Mode Reader — sheets.js
   Walk a CSSStyleSheet's rules and emit recoloured copies as CSS text.
   Resumable per top-level rule so the scheduler can stay under its frame budget. */
(function (root) {
  'use strict';
  const colors = root.DMR.colors;

  function absolutizeUrls(value, baseHref) {
    if (!baseHref) return value;
    return value.replace(/url\((['"]?)([^'")]+)\1\)/g, (m, q, u) => {
      if (/^(data:|https?:|\/\/|blob:)/i.test(u)) return m;
      try { return `url(${q}${new URL(u, baseHref).href}${q})`; } catch (err) { return m; }
    });
  }

  // Shorthands written with var() are kept as pending substitutions: their
  // longhands read back empty, so we must look at the shorthand itself.
  const VAR_SHORTHANDS = ['background', 'border', 'border-top', 'border-right', 'border-bottom', 'border-left', 'border-color', 'border-block', 'border-inline', 'outline', 'text-decoration'];
  function emitStyleRule(rule, palette, out, baseHref) {
    const style = rule.style;
    if (!style || !style.length) return;
    let body = '';
    for (const sh of VAR_SHORTHANDS) {
      const value = style.getPropertyValue(sh);
      if (!value || !value.includes('var(')) continue;
      const next = colors.rewriteDeclaration(sh, value, palette);
      if (next === null) continue;
      body += `${sh}:${absolutizeUrls(next, baseHref)}${style.getPropertyPriority(sh) ? ' !important' : ''};`;
    }
    for (let i = 0; i < style.length; i++) {
      const prop = style[i];
      if (!colors.isColorProp(prop)) continue;
      const value = style.getPropertyValue(prop);
      if (!value) continue; // pending var() substitution of a shorthand (handled above)
      const priority = style.getPropertyPriority(prop) ? ' !important' : '';
      if (prop.startsWith('--')) {
        for (const [dp, dv] of colors.expandCustomProp(prop, value, palette)) body += `${dp}:${absolutizeUrls(dv, baseHref)}${priority};`;
        continue;
      }
      const next = colors.rewriteDeclaration(prop, value, palette);
      if (next === null) continue;
      body += `${prop}:${prop === 'background-image' ? absolutizeUrls(next, baseHref) : next}${priority};`;
    }
    if (body) out.push(`${rule.selectorText}{${body}}`);
  }

  // Returns the list of cross-origin @import hrefs it could not read.
  function processRules(rules, palette, out, baseHref, pending) {
    for (let i = 0; i < rules.length; i++) {
      const r = rules[i];
      try {
        switch (r.constructor && r.constructor.name) {
          case 'CSSStyleRule': {
            emitStyleRule(r, palette, out, baseHref);
            if (r.cssRules && r.cssRules.length) { // CSS nesting
              const inner = [];
              processRules(r.cssRules, palette, inner, baseHref, pending);
              if (inner.length) out.push(`${r.selectorText}{${inner.join('')}}`);
            }
            break;
          }
          case 'CSSMediaRule':
          case 'CSSSupportsRule':
          case 'CSSContainerRule':
          case 'CSSLayerBlockRule':
          case 'CSSScopeRule':
          case 'CSSStartingStyleRule': {
            const inner = [];
            processRules(r.cssRules, palette, inner, baseHref, pending);
            if (!inner.length) break;
            const head = r.cssText.slice(0, r.cssText.indexOf('{')).trim();
            out.push(`${head}{${inner.join('')}}`);
            break;
          }
          case 'CSSImportRule': {
            let sub = null;
            try { sub = r.styleSheet && r.styleSheet.cssRules; } catch (err) { sub = null; }
            if (sub) {
              const inner = [];
              processRules(sub, palette, inner, r.styleSheet.href || baseHref, pending);
              const media = r.media && r.media.mediaText;
              out.push(media ? `@media ${media}{${inner.join('')}}` : inner.join(''));
            } else if (r.href) {
              pending.push(new URL(r.href, baseHref || location.href).href);
            }
            break;
          }
          default: break; // keyframes, font-face, page, namespace, property: nothing to recolour
        }
      } catch (err) {
        console.warn('[dark-mode-reader] sheets.processRules rule skipped:', err);
      }
    }
  }

  // Chunked top-level walk. Returns { css, nextIndex, done, pending }.
  function processSheetChunk(rules, palette, baseHref, startIndex, deadline) {
    const out = [], pending = [];
    let i = startIndex;
    for (; i < rules.length; i++) {
      processRules([rules[i]], palette, out, baseHref, pending);
      if ((i & 15) === 15 && performance.now() > deadline) { i++; break; }
    }
    return { css: out.join('\n'), nextIndex: i, done: i >= rules.length, pending };
  }

  // Parse raw CSS text (fetched cross-origin sheet) into rules we can walk.
  function rulesFromText(text) {
    try {
      const sheet = new CSSStyleSheet();
      sheet.replaceSync(text);
      return sheet.cssRules;
    } catch (err) {
      // Firefox content-script realm fallback: parse via a detached <style>
      const doc = document.implementation.createHTMLDocument('');
      const st = doc.createElement('style');
      st.textContent = text;
      doc.head.appendChild(st);
      return st.sheet ? st.sheet.cssRules : [];
    }
  }

  root.DMR.sheets = { processSheetChunk, processRules, rulesFromText, absolutizeUrls };
})(typeof globalThis !== 'undefined' ? globalThis : this);
