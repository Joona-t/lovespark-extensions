/* Dark Mode Reader — engine.js  (runs at document_start, all frames)
   Stage 0: theme.css (registered by the worker) paints a dark root before first paint.
   Stage 1: this file adds html.dmr-stage1 synchronously → cheap filter fallback.
   Stage 2: stylesheets are recoloured into #dmr-theme; stage 1 is removed in the
            same frame the theme lands. Native-dark pages make us stand down.
   Budget: 4 ms of work per frame, everything else deferred. No setInterval. */
(function () {
  'use strict';
  if (window.__dmrEngine) return;
  window.__dmrEngine = true;

  const DMR = window.DMR;
  const { MSG } = DMR.storage;
  const { PALETTES } = DMR.palettes;
  const html = document.documentElement;
  const TAG = '[dark-mode-reader]';
  const FRAME_BUDGET_MS = 4;

  const host = location.hostname;
  let pageState = null;       // from worker
  let palette = null;
  let active = false;
  let themeEl = null;         // <style id="dmr-theme">
  const chunks = new Map();   // source key -> css text
  const sheetCursor = new Map(); // CSSStyleSheet -> { index, rulesLen }
  const seenSheets = new WeakSet();
  const shadowRoots = new Set();
  let initialBatchDone = false;
  let observer = null;
  let flushScheduled = false;

  // ── messaging ──────────────────────────────────────────────────────────
  function send(msg) {
    return new Promise((resolve) => {
      try {
        chrome.runtime.sendMessage(msg, (res) => {
          if (chrome.runtime.lastError) { resolve(null); return; }
          resolve(res || null);
        });
      } catch (err) { console.warn(TAG, 'sendMessage failed:', err); resolve(null); }
    });
  }

  // ── scheduler: bounded work per frame ─────────────────────────────────
  const queue = [];
  let pumping = false;
  function enqueue(task) { queue.push(task); pump(); }
  function pump() {
    if (pumping) return;
    pumping = true;
    const tick = () => {
      const deadline = performance.now() + FRAME_BUDGET_MS;
      while (queue.length && performance.now() < deadline) {
        const task = queue.shift();
        try { if (task(deadline)) queue.push(task); } // returns true → more work
        catch (err) { console.warn(TAG, 'task failed:', err); }
      }
      if (queue.length) { document.hidden ? setTimeout(tick, 50) : requestAnimationFrame(tick); }
      else { pumping = false; onIdle(); }
    };
    document.hidden ? setTimeout(tick, 0) : requestAnimationFrame(tick);
  }

  // ── theme <style> management ───────────────────────────────────────────
  function ensureThemeEl() {
    if (themeEl && themeEl.isConnected) return themeEl;
    themeEl = themeEl || document.createElement('style');
    themeEl.id = 'dmr-theme';
    themeEl.setAttribute('data-dmr', '');
    html.appendChild(themeEl); // last child of <html> → last author sheet in cascade
    return themeEl;
  }
  function keepLast() {
    if (themeEl && themeEl.isConnected && html.lastElementChild !== themeEl) html.appendChild(themeEl);
  }
  function scheduleFlush() {
    if (flushScheduled) return;
    flushScheduled = true;
    requestAnimationFrame(() => { flushScheduled = false; flush(); });
  }
  function flush() {
    if (!active) return;
    const css = baseCss() + '\n' + Array.from(chunks.values()).join('\n');
    const el = ensureThemeEl();
    if (el.textContent !== css) el.textContent = css;
    for (const sr of shadowRoots) {
      let st = sr.querySelector('style[data-dmr]');
      if (!st) { st = document.createElement('style'); st.setAttribute('data-dmr', ''); sr.appendChild(st); }
      if (st.textContent !== css) st.textContent = css;
    }
    if (!initialBatchDone && pendingInitial === 0 && (document.readyState !== 'loading')) {
      initialBatchDone = true;
      html.classList.remove('dmr-stage1'); // same frame as the theme landing
      html.classList.add('dmr-on');
      send({ type: MSG.PAGE_THEMED, host });
    }
  }
  // :where() keeps specificity 0 so any author rule still wins over these.
  function baseCss() {
    const { mapColor } = DMR.oklch, { fmt } = DMR.colors;
    const bg = fmt(mapColor({ r: 255, g: 255, b: 255 }, 'bg', palette), 1);
    const fg = fmt(mapColor({ r: 0, g: 0, b: 0 }, 'text', palette), 1);
    const link = fmt(mapColor({ r: 0, g: 0, b: 238 }, 'text', palette), 1);
    const visited = fmt(mapColor({ r: 85, g: 26, b: 139 }, 'text', palette), 1);
    const border = fmt(mapColor({ r: 128, g: 128, b: 128 }, 'border', palette), 1);
    return `:root{--dmr-bg:${bg};--dmr-fg:${fg};--dmr-border:${border}}` +
      `:where(html){background-color:${bg};color:${fg}}` +
      `:where(body){background-color:${bg};color:${fg}}` +
      `:where(a:link){color:${link}}:where(a:visited){color:${visited}}` +
      `:where(input,textarea,select,button){background-color:${bg};color:${fg};border-color:${border}}` +
      `:where(hr){border-color:${border}}` +
      (pageState.fixes && pageState.fixes.css ? pageState.fixes.css : '');
  }

  // ── stylesheet processing ─────────────────────────────────────────────
  let pendingInitial = 0; // sheets still being processed from the initial pass
  function keyFor(sheet) {
    if (sheet.href) return 'href:' + sheet.href;
    const node = sheet.ownerNode;
    if (node) { if (!node.__dmrKey) node.__dmrKey = 'inline:' + Math.random().toString(36).slice(2); return node.__dmrKey; }
    return 'anon:' + Math.random().toString(36).slice(2);
  }
  function processSheet(sheet, countInitial) {
    if (!sheet || seenSheets.has(sheet)) return;
    seenSheets.add(sheet);
    if (sheet.ownerNode && sheet.ownerNode.hasAttribute && sheet.ownerNode.hasAttribute('data-dmr')) return;
    if (sheet.media && sheet.media.mediaText === 'print') return;
    let rules = null;
    try { rules = sheet.cssRules; } catch (err) { rules = null; }
    if (countInitial) pendingInitial++;
    const finish = () => { if (countInitial) pendingInitial--; scheduleFlush(); };
    if (rules) { walkRules(sheet, rules, sheet.href, keyFor(sheet), finish); return; }
    // cross-origin: ask the worker for the text (cached in storage.session)
    if (!sheet.href) { finish(); return; }
    send({ type: MSG.FETCH_SHEET, url: sheet.href }).then((res) => {
      if (!res || typeof res.text !== 'string') { finish(); return; }
      if (res.themed) { chunks.set('href:' + sheet.href, res.themed); finish(); return; } // worker cache hit
      const rs = DMR.sheets.rulesFromText(res.text);
      walkRules(sheet, rs, sheet.href, 'href:' + sheet.href, () => {
        send({ type: MSG.FETCH_SHEET, url: sheet.href, store: chunks.get('href:' + sheet.href) || '', paletteId: palette.id });
        finish();
      });
    });
  }
  function walkRules(sheet, rules, baseHref, key, done) {
    let index = 0; const parts = [];
    enqueue((deadline) => {
      const r = DMR.sheets.processSheetChunk(rules, palette, baseHref, index, deadline);
      if (r.css) parts.push(r.css);
      index = r.nextIndex;
      for (const url of r.pending) fetchImport(url);
      if (!r.done) return true;
      chunks.set(key, parts.join('\n'));
      sheetCursor.set(sheet, { rulesLen: rules.length });
      done();
      return false;
    });
  }
  function fetchImport(url) {
    const key = 'href:' + url;
    if (chunks.has(key)) return;
    chunks.set(key, '');
    send({ type: MSG.FETCH_SHEET, url }).then((res) => {
      if (!res || typeof res.text !== 'string') return;
      if (res.themed) { chunks.set(key, res.themed); scheduleFlush(); return; }
      walkRules({ href: url }, DMR.sheets.rulesFromText(res.text), url, key, () => {
        send({ type: MSG.FETCH_SHEET, url, store: chunks.get(key) || '', paletteId: palette.id });
      });
    });
  }
  // Sites that insertRule() into existing sheets (styled-components, emotion):
  // cheap length check on each flush; reprocess when it grew.
  function recheckSheets() {
    for (const sheet of document.styleSheets) {
      const cur = sheetCursor.get(sheet);
      if (!cur) continue;
      let len = 0; try { len = sheet.cssRules.length; } catch (err) { continue; }
      if (len !== cur.rulesLen) { seenSheets.delete(sheet); sheetCursor.delete(sheet); processSheet(sheet, false); }
    }
  }
  function scanSheets(countInitial) {
    for (const sheet of document.styleSheets) processSheet(sheet, countInitial);
    for (const sr of shadowRoots) for (const sheet of sr.styleSheets) processSheet(sheet, false);
  }

  // ── inline styles + shadow roots + DOM mutations ───────────────────────
  function scanInline(rootNode) {
    const els = rootNode.querySelectorAll('[style],[bgcolor],font[color]');
    let i = 0;
    enqueue((deadline) => {
      for (; i < els.length; i++) {
        DMR.inline.processElement(els[i], palette);
        if ((i & 31) === 31 && performance.now() > deadline) { i++; return true; }
      }
      return false;
    });
  }
  function adoptShadow(el) {
    const sr = el.shadowRoot;
    if (!sr || shadowRoots.has(sr)) return;
    shadowRoots.add(sr);
    observer && observer.observe(sr, OBS_OPTS);
    for (const sheet of sr.styleSheets) processSheet(sheet, false);
    scanInline(sr);
    scheduleFlush();
  }
  function scanShadows(rootNode) {
    const all = rootNode.querySelectorAll('*');
    let i = 0;
    enqueue((deadline) => {
      for (; i < all.length; i++) {
        if (all[i].shadowRoot) adoptShadow(all[i]);
        if ((i & 63) === 63 && performance.now() > deadline) { i++; return true; }
      }
      return false;
    });
  }
  const OBS_OPTS = { childList: true, subtree: true, attributes: true, attributeFilter: ['style', 'bgcolor', 'color'], characterData: true };
  let mutationBacklog = [];
  function onMutations(list) {
    if (!active) return;
    for (const m of list) mutationBacklog.push(m);
    if (mutationBacklog.length === list.length) enqueue(drainMutations);
  }
  function drainMutations(deadline) {
    let styleTouched = false;
    while (mutationBacklog.length && performance.now() < deadline) {
      const m = mutationBacklog.shift();
      if (m.type === 'attributes') {
        const el = m.target;
        if (el.hasAttribute && el.hasAttribute('data-dmr')) continue;
        if (m.attributeName === 'style' && DMR.inline.isOwnMutation(el)) continue;
        DMR.inline.processElement(el, palette);
      } else if (m.type === 'childList') {
        for (const n of m.addedNodes) {
          if (n.nodeType !== 1) continue;
          if (n.hasAttribute('data-dmr')) continue;
          if (n.tagName === 'STYLE' || n.tagName === 'LINK') { styleTouched = true; if (n.sheet) processSheet(n.sheet, false); else n.addEventListener('load', () => { processSheet(n.sheet, false); }, { once: true }); }
          if (n.hasAttribute('style') || n.hasAttribute('bgcolor')) DMR.inline.processElement(n, palette);
          if (n.shadowRoot) adoptShadow(n);
          if (n.firstElementChild) { scanInline(n); scanShadows(n); if (n.querySelector('style,link[rel~=stylesheet]')) styleTouched = true; }
        }
        if (m.target === html) keepLast();
      } else if (m.type === 'characterData') {
        const st = m.target.parentNode;
        if (st && st.tagName === 'STYLE' && !st.hasAttribute('data-dmr') && st.sheet) { seenSheets.delete(st.sheet); styleTouched = true; }
      }
    }
    if (styleTouched) scanSheets(false);
    if (mutationBacklog.length) return true;
    return false;
  }
  function onIdle() { if (active) { recheckSheets(); scheduleFlush(); } }

  // ── native dark detection ─────────────────────────────────────────────
  let detectRuns = 0;
  function runDetect() {
    if (!active || !document.body) return;
    detectRuns++;
    const disable = () => { html.classList.add('dmr-measure'); if (themeEl) themeEl.disabled = true; };
    const enable = () => { html.classList.remove('dmr-measure'); if (themeEl) themeEl.disabled = false; };
    const r = DMR.detect.measure(disable, enable);
    if (r.nativeDark) {
      standDown('native-dark:' + r.reason);
      send({ type: MSG.REPORT_NATIVE_DARK, host, nativeDark: true });
    } else if (pageState.site && pageState.site.nativeDark) {
      send({ type: MSG.REPORT_NATIVE_DARK, host, nativeDark: false }); // it went light again
    }
  }

  // ── apply / stand down ────────────────────────────────────────────────
  function applyState(state) {
    pageState = state;
    if (!state || !state.active) { standDown('inactive'); return; }
    palette = PALETTES[state.palette] || PALETTES.noir;
    html.style.setProperty('--dmr-img-dim', String((state.imageDim || 85) / 100));
    DMR.reading.apply(state.reading, state.readingEnabled);
    if (active) { // palette change at runtime: redo everything
      chunks.clear(); sheetCursor.clear();
      for (const s of document.styleSheets) seenSheets.delete(s);
      scanSheets(false); scanInline(document); scheduleFlush();
      return;
    }
    active = true;
    html.classList.remove('dmr-off');
    if (!initialBatchDone) html.classList.add('dmr-stage1');
    start();
  }
  function start() {
    observer = new MutationObserver(onMutations);
    observer.observe(document, OBS_OPTS);
    for (const sr of shadowRoots) observer.observe(sr, OBS_OPTS);
    const kick = () => {
      scanSheets(true);
      scanInline(document);
      scanShadows(document);
      runDetect();
      scheduleFlush();
    };
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', kick, { once: true });
    else kick();
    window.addEventListener('load', () => { if (active) { runDetect(); scanSheets(false); } }, { once: true });
    // SPAs that flip their own theme after hydration: one late re-check, no polling.
    window.addEventListener('load', () => setTimeout(() => { if (active && detectRuns < 3) runDetect(); }, 1500), { once: true });
  }
  function standDown(reason) {
    active = false;
    html.classList.remove('dmr-stage1', 'dmr-on');
    html.classList.add('dmr-off');
    if (observer) { observer.disconnect(); observer = null; }
    queue.length = 0; mutationBacklog = [];
    if (themeEl && themeEl.isConnected) themeEl.remove();
    for (const sr of shadowRoots) { const st = sr.querySelector('style[data-dmr]'); if (st) st.remove(); }
    chunks.clear(); sheetCursor.clear();
    for (const s of document.styleSheets) seenSheets.delete(s);
    if (document.body) DMR.inline.clear(document);
    DMR.reading.remove();
    initialBatchDone = false; pendingInitial = 0;
    if (reason !== 'inactive') console.info(TAG, 'standing down:', reason);
  }

  // ── boot ──────────────────────────────────────────────────────────────
  html.classList.add('dmr-stage1'); // sync, before first paint; only visible if theme.css was injected
  const systemDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
  // The worker can be cold-starting (browser launch, extension update): retry a few times.
  (function requestState(attempt) {
    send({ type: MSG.GET_PAGE_STATE, host, systemDark, top: window === window.top }).then((state) => {
      if (!state && attempt < 6) { setTimeout(() => requestState(attempt + 1), 120 * (attempt + 1)); return; }
      if (!state || !state.active) { html.classList.remove('dmr-stage1'); html.classList.add('dmr-off'); pageState = state; return; }
      applyState(state);
    });
  })(0);
  chrome.runtime.onMessage.addListener((msg) => {
    if (!msg || msg.type !== MSG.APPLY) return;
    if (msg.pageState && msg.pageState.active) { html.classList.remove('dmr-off'); applyState(msg.pageState); }
    else standDown('inactive');
  });
  if (window.matchMedia) {
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
      send({ type: MSG.GET_PAGE_STATE, host, systemDark: e.matches, top: window === window.top }).then((s) => { if (s) (s.active ? applyState(s) : standDown('inactive')); });
    });
  }
})();
