// Dark Mode Reader — popup.js
'use strict';
const { MSG } = DMR.storage;

LoveSparkTheme.init();
// lib/lovespark-theme.js toggles .open but never updates ARIA (sibling BUG-002): mirror it.
(function syncThemeAriaExpanded() {
  const trigger = document.getElementById('themeToggle');
  const menu = document.getElementById('themeMenu');
  if (!trigger || !menu) return;
  const sync = () => trigger.setAttribute('aria-expanded', String(menu.classList.contains('open')));
  new MutationObserver(sync).observe(menu, { attributes: true, attributeFilter: ['class'] });
  sync();
})();

const $ = (id) => document.getElementById(id);
const pills = document.querySelectorAll('.mode-pill');
const segBtns = document.querySelectorAll('.seg-btn');
const toggle = $('toggle-enabled');
const readingToggle = $('toggle-reading');
const statusText = $('status-text');
const nativeNote = $('native-note');
const dim = $('image-dim');
const dimValue = $('image-dim-value');

let host = '';
let state = null;

function send(msg) {
  return new Promise((resolve) => {
    try {
      chrome.runtime.sendMessage(msg, (res) => { resolve(chrome.runtime.lastError ? null : res); });
    } catch (err) { console.warn('[dark-mode-reader] popup sendMessage failed:', err); resolve(null); }
  });
}

function animateTo(el, target) {
  target = target || 0;
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || !target) { el.textContent = target.toLocaleString(); return; }
  const start = performance.now(), dur = 400;
  const tick = (now) => {
    const p = Math.min((now - start) / dur, 1);
    el.textContent = Math.round(target * (1 - Math.pow(1 - p, 3))).toLocaleString();
    if (p < 1) requestAnimationFrame(tick);
  };
  requestAnimationFrame(tick);
}

function render() {
  if (!state) return;
  const site = state.site || {};
  const ps = state.pageState;
  toggle.checked = state.enabled;
  document.body.classList.toggle('disabled', !state.enabled);
  pills.forEach(p => p.setAttribute('aria-checked', String(p.dataset.mode === state.palette)));
  segBtns.forEach(b => b.setAttribute('aria-checked', String(b.dataset.siteMode === (site.mode || 'auto'))));
  readingToggle.checked = !!site.reading;
  dim.value = state.imageDim; dimValue.textContent = state.imageDim + '%';
  $('site-host').textContent = host || 'no web page';
  nativeNote.hidden = !(site.nativeDark && (site.mode || 'auto') === 'auto' && state.enabled);
  if (!state.enabled) statusText.textContent = 'paused everywhere';
  else if (!host) statusText.textContent = 'open a web page to theme it';
  else if (ps && ps.active) statusText.textContent = 'darkening ' + host;
  else if (site.nativeDark && site.mode !== 'off') statusText.textContent = 'site is already dark';
  else if (state.schedule.mode !== 'always' && !(ps && ps.active) && site.mode !== 'off') statusText.textContent = 'waiting for schedule';
  else statusText.textContent = 'off on ' + host;
  animateTo($('val-pagesToday'), state.stats.pagesToday);
}

async function refresh() {
  const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  state = await send({ type: MSG.GET_STATE, host, systemDark });
  render();
}

// ── init ──────────────────────────────────────────────────────────────────
chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
  const tab = tabs && tabs[0];
  if (tab && tab.url && /^https?:/.test(tab.url)) {
    try { host = new URL(tab.url).hostname; } catch (err) { console.warn('[dark-mode-reader] bad tab url:', err); }
  }
  refresh();
});

toggle.addEventListener('change', async () => { await send({ type: MSG.SET_GLOBAL, patch: { enabled: toggle.checked } }); refresh(); });
pills.forEach(p => p.addEventListener('click', async () => {
  await send({ type: MSG.SET_GLOBAL, patch: { palette: p.dataset.mode, enabled: true } }); refresh();
}));
segBtns.forEach(b => b.addEventListener('click', async () => {
  if (!host) return;
  await send({ type: MSG.SET_SITE, host, patch: { mode: b.dataset.siteMode } }); refresh();
}));
readingToggle.addEventListener('change', async () => {
  if (!host) { readingToggle.checked = false; return; }
  await send({ type: MSG.SET_SITE, host, patch: { reading: readingToggle.checked } }); refresh();
});
dim.addEventListener('input', () => { dimValue.textContent = dim.value + '%'; });
dim.addEventListener('change', async () => { await send({ type: MSG.SET_GLOBAL, patch: { imageDim: Number(dim.value) } }); refresh(); });

$('open-settings').addEventListener('click', (e) => {
  e.preventDefault();
  if (chrome.runtime.openOptionsPage) chrome.runtime.openOptionsPage();
  else chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
});

chrome.storage.onChanged.addListener(() => refresh());
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
