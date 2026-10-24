'use strict';

LoveSparkTheme.init();

const toggleEl = document.getElementById('enableToggle');
const statusText = document.getElementById('statusText');
const siteInput = document.getElementById('siteInput');
const addBtn = document.getElementById('addBtn');
const blocklistEl = document.getElementById('blocklist');
const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const footerMount = document.getElementById('footerMount');

let prevToday = 0;
let prevTotal = 0;

if (typeof LoveSparkFooter !== 'undefined') {
  LoveSparkFooter.render(footerMount);
}

async function sendBg(msg) {
  try {
    return await chrome.runtime.sendMessage(msg);
  } catch (err) {
    console.warn('[LoveSpark Site Blocker] sendBg error:', err.message);
    return null;
  }
}

function renderBlocklist(sites) {
  blocklistEl.textContent = '';
  for (const site of sites) {
    const item = document.createElement('div');
    item.className = 'block-item';
    item.setAttribute('role', 'listitem');

    const name = document.createElement('span');
    name.className = 'block-site';
    name.textContent = site;

    const removeBtn = document.createElement('button');
    removeBtn.className = 'block-remove';
    removeBtn.textContent = '\u00D7';
    removeBtn.setAttribute('aria-label', 'Unblock ' + site);
    removeBtn.addEventListener('click', async () => {
      await sendBg({ type: 'REMOVE_SITE', site });
      await refreshData();
    });

    item.appendChild(name);
    item.appendChild(removeBtn);
    blocklistEl.appendChild(item);
  }
}

function updateStats(data) {
  const today = data.blocksToday || 0;
  const total = data.blocksTotal || 0;
  const enabled = data.isEnabled !== false;

  LoveSparkPopup.animateCount(todayEl, prevToday, today);
  LoveSparkPopup.animateCount(totalEl, prevTotal, total);

  prevToday = today;
  prevTotal = total;

  toggleEl.checked = enabled;
  statusText.textContent = enabled ? 'Blocking active' : 'Blocking paused';
  renderBlocklist(data.blocklist || []);
}

toggleEl.addEventListener('change', async () => {
  await sendBg({ type: 'SET_ENABLED', enabled: toggleEl.checked });
  statusText.textContent = toggleEl.checked ? 'Blocking active' : 'Blocking paused';
});

async function addSite() {
  const site = siteInput.value.trim();
  if (!site) return;
  const result = await sendBg({ type: 'ADD_SITE', site });
  if (result && !result.error) {
    siteInput.value = '';
    await refreshData();
  }
}

addBtn.addEventListener('click', addSite);
siteInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addSite();
});

async function refreshData() {
  const data = await sendBg({ type: 'GET_STATS' });
  if (data) updateStats(data);
}

chrome.storage.onChanged.addListener(() => refreshData());
refreshData();
