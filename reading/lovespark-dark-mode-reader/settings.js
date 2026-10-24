// Dark Mode Reader — settings.js
'use strict';
const { MSG } = DMR.storage;
LoveSparkTheme.init();

const $ = (id) => document.getElementById(id);
function send(msg) {
  return new Promise((resolve) => {
    try { chrome.runtime.sendMessage(msg, (res) => resolve(chrome.runtime.lastError ? null : res)); }
    catch (err) { console.warn('[dark-mode-reader] settings sendMessage failed:', err); resolve(null); }
  });
}
let state = null;

function setRadio(attr, value) {
  document.querySelectorAll(`[data-${attr}]`).forEach(b => b.setAttribute('aria-checked', String(b.dataset[attr.replace(/-(\w)/g, (m, c) => c.toUpperCase())] === value)));
}

function renderSites() {
  const list = $('site-list');
  list.replaceChildren();
  const entries = Object.entries(state.sites).filter(([, s]) => s.mode !== 'auto' || s.reading || s.nativeDark).sort();
  if (!entries.length) {
    const li = document.createElement('li'); li.className = 'domain-item'; li.textContent = 'No per-site choices yet.'; list.appendChild(li); return;
  }
  for (const [host, site] of entries) {
    const li = document.createElement('li'); li.className = 'domain-item';
    const name = document.createElement('span'); name.className = 'domain-name'; name.textContent = host;
    const mode = document.createElement('span'); mode.className = 'domain-mode';
    const bits = [];
    if (site.mode === 'off') bits.push('off'); if (site.mode === 'on') bits.push('forced on');
    if (site.nativeDark && site.mode !== 'on') bits.push('already dark'); if (site.reading) bits.push('reading');
    mode.textContent = bits.join(' · ');
    const rm = document.createElement('button'); rm.className = 'domain-remove'; rm.textContent = '×'; rm.setAttribute('aria-label', `Forget ${host}`);
    rm.addEventListener('click', async () => {
      const sites = { ...state.sites }; delete sites[host];
      await send({ type: MSG.SET_GLOBAL, patch: { sites } }); refresh();
    });
    li.append(name, mode, rm); list.appendChild(li);
  }
}

function render() {
  setRadio('palette', state.palette);
  setRadio('schedule', state.schedule.mode);
  setRadio('font', state.reading.font);
  $('time-row').hidden = state.schedule.mode !== 'time';
  $('sched-from').value = state.schedule.from; $('sched-to').value = state.schedule.to;
  $('read-width').checked = !!state.reading.width; $('read-lh').checked = !!state.reading.lineHeight; $('read-links').checked = !!state.reading.links;
  $('image-dim').value = state.imageDim; $('image-dim-value').textContent = state.imageDim + '%';
  renderSites();
  const grid = $('stats-grid'); grid.replaceChildren();
  for (const s of [{ label: 'Pages today', value: state.stats.pagesToday }, { label: 'Pages total', value: state.stats.pagesTotal }, { label: 'Sites remembered', value: Object.keys(state.sites).length }]) {
    const cell = document.createElement('div'); cell.className = 'stat-cell';
    const big = document.createElement('div'); big.className = 'stat-big'; big.textContent = (s.value || 0).toLocaleString();
    const lbl = document.createElement('div'); lbl.className = 'stat-lbl'; lbl.textContent = s.label;
    cell.append(big, lbl); grid.appendChild(cell);
  }
}
async function refresh() { state = await send({ type: MSG.GET_STATE, systemDark: window.matchMedia('(prefers-color-scheme: dark)').matches }); if (state) render(); }
async function patch(p) { await send({ type: MSG.SET_GLOBAL, patch: p }); refresh(); }

document.querySelectorAll('[data-palette]').forEach(b => b.addEventListener('click', () => patch({ palette: b.dataset.palette })));
document.querySelectorAll('[data-schedule]').forEach(b => b.addEventListener('click', () => patch({ schedule: { ...state.schedule, mode: b.dataset.schedule } })));
document.querySelectorAll('[data-font]').forEach(b => b.addEventListener('click', () => patch({ reading: { ...state.reading, font: b.dataset.font } })));
$('sched-from').addEventListener('change', (e) => patch({ schedule: { ...state.schedule, from: e.target.value || '20:00' } }));
$('sched-to').addEventListener('change', (e) => patch({ schedule: { ...state.schedule, to: e.target.value || '07:00' } }));
$('read-width').addEventListener('change', (e) => patch({ reading: { ...state.reading, width: e.target.checked } }));
$('read-lh').addEventListener('change', (e) => patch({ reading: { ...state.reading, lineHeight: e.target.checked } }));
$('read-links').addEventListener('change', (e) => patch({ reading: { ...state.reading, links: e.target.checked } }));
$('image-dim').addEventListener('input', (e) => { $('image-dim-value').textContent = e.target.value + '%'; });
$('image-dim').addEventListener('change', (e) => patch({ imageDim: Number(e.target.value) }));

async function addSite() {
  const host = $('domain-add').value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');
  if (!host) return;
  await send({ type: MSG.SET_SITE, host, patch: { mode: 'off' } });
  $('domain-add').value = ''; refresh();
}
$('domain-add-btn').addEventListener('click', addSite);
$('domain-add').addEventListener('keydown', (e) => { if (e.key === 'Enter') addSite(); });

$('reset-btn').addEventListener('click', async () => {
  if (confirm('Reset all Dark Mode Reader settings and stats? This cannot be undone.')) { await send({ type: MSG.RESET }); refresh(); }
});

chrome.storage.onChanged.addListener(() => refresh());
refresh();
