/* popup.js — Drag-and-drop / paste / browse UI for manual image scrubbing */

// Theme dropdown
const THEMES = ['retro', 'dark', 'beige', 'slate'];
const THEME_NAMES = { retro: 'Retro Pink', dark: 'Dark', beige: 'Beige', slate: 'Slate' };
function applyTheme(t) {
  THEMES.forEach(n => document.body.classList.remove('theme-' + n));
  document.body.classList.add('theme-' + t);
  const label = document.getElementById('themeLabel');
  if (label) label.textContent = THEME_NAMES[t] || t;
  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.theme === t);
  });
}
(function initThemeDropdown() {
  const toggle = document.getElementById('themeToggle');
  const menu = document.getElementById('themeMenu');
  if (toggle && menu) {
    toggle.addEventListener('click', (e) => { e.stopPropagation(); menu.classList.toggle('open'); });
    menu.addEventListener('click', (e) => {
      const opt = e.target.closest('.theme-option');
      if (!opt) return;
      const theme = opt.dataset.theme;
      applyTheme(theme);
      browser.storage.local.set({ theme });
      menu.classList.remove('open');
    });
    document.addEventListener('click', () => menu.classList.remove('open'));
  }
  browser.storage.local.get(['theme', 'darkMode']).then(({ theme, darkMode }) => {
    if (!theme && darkMode) theme = 'dark';
    applyTheme(theme || 'retro');
  });
}).catch(() => {});
})();
  if (!theme && darkMode) theme = 'dark';
  applyTheme(theme || 'retro');
});
document.getElementById('themeToggle');

const MESSAGES = [
  'Your photos, your privacy 💕',
  'Metadata? Never heard of it ✨',
  'Scrubbed with love 🌸',
  'Clean photos, happy vibes 💖',
  'Privacy is beautiful 🛡️',
  'No tracking data here 💕',
  'Sparkling clean images ✨',
];

// ── DOM refs ──

const dropzone = document.getElementById('dropzone');
const dropzoneContent = document.getElementById('dropzoneContent');
const dropzoneLoading = document.getElementById('dropzoneLoading');
const fileInput = document.getElementById('fileInput');
const resultPanel = document.getElementById('resultPanel');
const previewImg = document.getElementById('previewImg');
const dimensions = document.getElementById('dimensions');
const formatInfo = document.getElementById('formatInfo');
const downloadBtn = document.getElementById('downloadBtn');
const scrubAnother = document.getElementById('scrubAnother');
const todayCount = document.getElementById('todayCount');
const totalCount = document.getElementById('totalCount');
const settingsToggle = document.getElementById('settingsToggle');
const settingsPanel = document.getElementById('settingsPanel');
const formatSelector = document.getElementById('formatSelector');
const qualitySlider = document.getElementById('qualitySlider');
const qualityValue = document.getElementById('qualityValue');
const qualityRow = document.getElementById('qualityRow');
const suffixToggle = document.getElementById('suffixToggle');
const motivational = document.getElementById('motivational');

let currentResult = null;
let currentFile = null;

// ── Init ──

async function init() {
  await loadSettings();
  await loadCounters();
  motivational.textContent = MESSAGES[Math.floor(Math.random() * MESSAGES.length)];
}

// ── Settings ──

async function loadSettings() {
  const { settings } = await browser.storage.local.get('settings');
  const s = settings || { outputFormat: 'original', jpegQuality: 0.95, addSuffix: true };

  // Format pills
  formatSelector.querySelectorAll('.pill').forEach(pill => {
    pill.classList.toggle('active', pill.dataset.value === s.outputFormat);
  });

  // Quality slider
  qualitySlider.value = Math.round((s.jpegQuality || 0.95) * 100);
  qualityValue.textContent = qualitySlider.value + '%';
  qualityRow.classList.toggle('hidden', s.outputFormat !== 'jpeg');

  // Suffix toggle
  suffixToggle.classList.toggle('active', s.addSuffix !== false);
}

async function saveSettings() {
  const activeFormat = formatSelector.querySelector('.pill.active');
  const settings = {
    outputFormat: activeFormat ? activeFormat.dataset.value : 'original',
    jpegQuality: parseInt(qualitySlider.value, 10) / 100,
    addSuffix: suffixToggle.classList.contains('active'),
  };
  await browser.storage.local.set({ settings });
  return settings;
}

// Format selector
formatSelector.addEventListener('click', async (e) => {
  const pill = e.target.closest('.pill');
  if (!pill) return;

  formatSelector.querySelectorAll('.pill').forEach(p => p.classList.remove('active'));
  pill.classList.add('active');
  qualityRow.classList.toggle('hidden', pill.dataset.value !== 'jpeg');
  await saveSettings();
});

// Quality slider
qualitySlider.addEventListener('input', () => {
  qualityValue.textContent = qualitySlider.value + '%';
});
qualitySlider.addEventListener('change', saveSettings);

// Suffix toggle
suffixToggle.addEventListener('click', async () => {
  suffixToggle.classList.toggle('active');
  await saveSettings();
});

// Settings gear
settingsToggle.addEventListener('click', () => {
  settingsPanel.classList.toggle('hidden');
});

// ── Counters ──

async function loadCounters() {
  const data = await browser.storage.local.get(['scrubsToday', 'scrubsTotal', 'lastResetDate']);
  const today = new Date().toISOString().slice(0, 10);

  const todayVal = (data.lastResetDate === today) ? (data.scrubsToday || 0) : 0;
  todayCount.textContent = todayVal;
  totalCount.textContent = data.scrubsTotal || 0;
}

async function incrementCounters() {
  await browser.runtime.sendMessage({ type: 'incrementCounters', target: 'background' });
  await loadCounters();
}

// ── Drop zone ──

dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => {
  dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.classList.remove('dragover');
  const file = e.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    processFile(file);
  }
});

dropzone.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', (e) => {
  if (e.target.files[0]) processFile(e.target.files[0]);
});

// ── Clipboard paste ──

document.addEventListener('paste', (e) => {
  const items = e.clipboardData.items;
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      processFile(item.getAsFile());
      break;
    }
  }
});

// ── Process and scrub ──

async function processFile(file) {
  // SVG warning
  if (file.type === 'image/svg+xml') {
    alert('SVG files are converted to PNG. Text and vector data will be rasterized.');
  }

  showLoading();

  try {
    const settings = (await browser.storage.local.get('settings')).settings || {};
    const bitmap = await createImageBitmap(file);
    const result = await reencodeFromBitmap(bitmap, file.type, settings);

    currentResult = result;
    currentFile = file;

    showResult(result, file);
    await incrementCounters();
  } catch (err) {
    showDropzone();

    if (file.name && file.name.match(/\.heic$/i)) {
      alert('HEIC format not supported in browser. Convert to JPEG first, or use your phone\'s share menu.');
    } else {
      alert('Failed to scrub image: ' + err.message);
    }
  }
}

function showLoading() {
  dropzoneContent.classList.add('hidden');
  dropzoneLoading.classList.remove('hidden');
  resultPanel.classList.add('hidden');
}

function showDropzone() {
  dropzoneContent.classList.remove('hidden');
  dropzoneLoading.classList.add('hidden');
  dropzone.style.display = '';
  resultPanel.classList.add('hidden');
}

function showResult(result, file) {
  dropzone.style.display = 'none';
  resultPanel.classList.remove('hidden');

  previewImg.src = result.cleanDataUrl;
  dimensions.textContent = `${result.width} × ${result.height}`;

  const ext = result.outputMime === 'image/jpeg' ? 'JPEG' : 'PNG';
  const originalExt = file.type.split('/')[1]?.toUpperCase() || '?';
  formatInfo.textContent = `${originalExt} → ${ext}`;
}

// ── Download ──

downloadBtn.addEventListener('click', async () => {
  if (!currentResult) return;

  const settings = (await browser.storage.local.get('settings')).settings || {};

  const a = document.createElement('a');
  a.href = currentResult.cleanDataUrl;
  a.download = buildFilenameFromFile(currentFile, settings, currentResult);
  a.click();

  // Clean up object URL if used
  if (currentResult.isObjectUrl) {
    URL.revokeObjectURL(currentResult.cleanDataUrl);
  }
});

function buildFilenameFromFile(file, settings, result) {
  let name = file.name ? file.name.replace(/\.[^.]+$/, '') : 'image';
  const suffix = settings.addSuffix !== false ? '_clean' : '';

  let ext = 'png';
  if (result.outputMime === 'image/jpeg') ext = 'jpg';

  return `${name}${suffix}.${ext}`;
}

// ── Scrub another ──

scrubAnother.addEventListener('click', () => {
  currentResult = null;
  currentFile = null;
  fileInput.value = '';
  showDropzone();
});

// ── Start ──

init();

/* ── Author / Ko-fi Footer ── */
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
