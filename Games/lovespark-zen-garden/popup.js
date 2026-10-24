'use strict';

LoveSparkTheme.init();

const gardenCanvas = document.getElementById('gardenCanvas');
const todayEl = document.getElementById('todayCount');
const totalEl = document.getElementById('totalCount');
const itemCountEl = document.getElementById('itemCount');
const footerMount = document.getElementById('footerMount');

let selectedElement = 'rock';
let gardenItems = [];
let hasPlacedThisSession = false;

const ELEMENTS = {
  rock:    '\u{1FAA8}',
  bamboo:  '\u{1F38D}',
  flower:  '\u{1F338}',
  tree:    '\u{1F333}',
  water:   '\u{1F4A7}',
  lantern: '\u{1F3EE}'
};

if (typeof LoveSparkFooter !== 'undefined') {
  footerMount.innerHTML = LoveSparkFooter.render();
}

async function sendBg(msg) {
  try {
    return await chrome.runtime.sendMessage(msg);
  } catch (err) {
    console.warn('[LoveSpark Zen Garden] sendBg error:', err.message);
    return null;
  }
}

// ── Picker buttons ──────────────────────────
document.querySelectorAll('.pick-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const el = btn.dataset.element;
    if (el === 'clear') {
      clearGarden();
      return;
    }
    selectedElement = el;
    document.querySelectorAll('.pick-btn').forEach(b => {
      if (b.dataset.element !== 'clear') {
        b.classList.remove('active');
        b.setAttribute('aria-pressed', 'false');
      }
    });
    btn.classList.add('active');
    btn.setAttribute('aria-pressed', 'true');
  });
});

// ── Place element on canvas click ───────────
gardenCanvas.addEventListener('click', (e) => {
  if (gardenItems.length >= 30) return;
  const rect = gardenCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left - 12;
  const y = e.clientY - rect.top - 12;
  if (x < 0 || y < 0 || x > rect.width - 24 || y > rect.height - 24) return;

  const item = {
    element: selectedElement,
    emoji: ELEMENTS[selectedElement],
    x: Math.round(x),
    y: Math.round(y),
    id: Date.now().toString(36)
  };
  gardenItems.push(item);
  renderItem(item);
  saveGarden();

  if (!hasPlacedThisSession) {
    hasPlacedThisSession = true;
    sendBg({ type: 'LOG_SESSION' });
  }
  itemCountEl.textContent = gardenItems.length;
});

// ── Render single item ──────────────────────
function renderItem(item) {
  const el = document.createElement('span');
  el.className = 'garden-item';
  el.textContent = item.emoji;
  el.style.left = item.x + 'px';
  el.style.top = item.y + 'px';
  el.setAttribute('aria-label', item.element);
  el.dataset.id = item.id;

  // Right-click to remove
  el.addEventListener('contextmenu', (e) => {
    e.preventDefault();
    gardenItems = gardenItems.filter(i => i.id !== item.id);
    el.remove();
    saveGarden();
    itemCountEl.textContent = gardenItems.length;
  });

  gardenCanvas.appendChild(el);
}

// ── Render full garden ──────────────────────
function renderGarden() {
  // Clear existing items from canvas (keep canvas itself)
  gardenCanvas.querySelectorAll('.garden-item').forEach(el => el.remove());
  for (const item of gardenItems) {
    renderItem(item);
  }
  itemCountEl.textContent = gardenItems.length;
}

// ── Save/clear garden ───────────────────────
async function saveGarden() {
  await sendBg({ type: 'SAVE_GARDEN', garden: gardenItems });
}

async function clearGarden() {
  gardenItems = [];
  renderGarden();
  await sendBg({ type: 'CLEAR_GARDEN' });
}

// ── Stats ───────────────────────────────────
function updateStats(data) {
  todayEl.textContent = data.sessionsToday || 0;
  totalEl.textContent = data.sessionsTotal || 0;
  if (data.garden && data.garden.length > 0) {
    gardenItems = data.garden;
    renderGarden();
  }
}

async function refreshData() {
  const data = await sendBg({ type: 'GET_STATS' });
  if (data) updateStats(data);
}

refreshData();
