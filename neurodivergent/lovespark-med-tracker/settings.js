import { getMedications, addMedication, updateMedication, deleteMedication, getSettings, updateSettings, exportAllData, importData, clearAllData } from './utils/storage.js';
import { FREQUENCIES, MED_TYPES, MED_COLORS, MED_EMOJIS, TIME_SLOTS } from './utils/constants.js';

let medications = [];
let settings = {};
const newMedSlots = new Set(['morning']);

// ── Init ─────────────────────────────────────────────────
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
      chrome.storage.local.set({ theme });
      menu.classList.remove('open');
    });
    document.addEventListener('click', () => menu.classList.remove('open'));
  }
  chrome.storage.local.get(['theme', 'darkMode'], ({ theme, darkMode }) => {
    if (!theme && darkMode) theme = 'dark';
    applyTheme(theme || 'retro');
  });
})();

async function init() {
  settings = await getSettings();
  medications = await getMedications();

  const themeData = await new Promise(r => chrome.storage.local.get(['theme'], r));
  let theme = themeData.theme;
  if (!theme && settings.darkMode) theme = 'dark';
  applyTheme(theme || 'retro');

  document.getElementById('themeToggle');

  renderMedList();
  populateAddForm();
  bindEvents();
  renderReminderTimes();
}

// ── Medication List ──────────────────────────────────────

function renderMedList() {
  const list = document.getElementById('medList');
  list.textContent = '';

  for (const med of medications) {
    const item = document.createElement('div');
    item.className = 'med-item';

    const info = document.createElement('div');
    info.className = 'med-item-info';

    const emoji = document.createElement('span');
    emoji.className = 'med-item-emoji';
    emoji.textContent = med.emoji;

    const details = document.createElement('div');

    const name = document.createElement('div');
    name.className = 'med-item-name';
    name.textContent = med.name;

    const dosage = document.createElement('div');
    dosage.className = 'med-item-dosage';
    dosage.textContent = med.dosage;

    const freq = FREQUENCIES.find(f => f.id === med.frequency);
    const slots = med.timeSlots.map(s => TIME_SLOTS.find(t => t.id === s)?.emoji || s).join(' ');
    const meta = document.createElement('div');
    meta.className = 'med-item-meta';
    meta.textContent = `${freq?.label || med.frequency} · ${slots}${med.supply !== null ? ` · ${med.supply} left` : ''}`;

    details.append(name, dosage, meta);
    info.append(emoji, details);

    const actions = document.createElement('div');
    actions.className = 'med-item-actions';

    const archiveBtn = document.createElement('button');
    archiveBtn.className = 'btn-icon';
    archiveBtn.textContent = med.active ? '📦' : '✅';
    archiveBtn.title = med.active ? 'Archive' : 'Reactivate';
    archiveBtn.addEventListener('click', async () => {
      await updateMedication(med.id, { active: !med.active });
      medications = await getMedications();
      renderMedList();
    });

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-icon delete';
    deleteBtn.textContent = '✕';
    deleteBtn.title = 'Delete';
    deleteBtn.addEventListener('click', async () => {
      if (!confirm(`Delete ${med.name}? This cannot be undone.`)) return;
      await deleteMedication(med.id);
      medications = await getMedications();
      renderMedList();
    });

    actions.append(archiveBtn, deleteBtn);
    item.append(info, actions);
    list.appendChild(item);
  }

  if (medications.length === 0) {
    const empty = document.createElement('div');
    empty.style.cssText = 'text-align:center;padding:16px;font-size:13px;color:var(--ls-text-muted)';
    empty.textContent = 'No medications added yet';
    list.appendChild(empty);
  }
}

// ── Add Form ─────────────────────────────────────────────

function populateAddForm() {
  const freqSelect = document.getElementById('newMedFreq');
  FREQUENCIES.forEach(f => {
    const opt = document.createElement('option');
    opt.value = f.id;
    opt.textContent = f.label;
    freqSelect.appendChild(opt);
  });

  const typeSelect = document.getElementById('newMedType');
  MED_TYPES.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.label;
    typeSelect.appendChild(opt);
  });

  const slotsContainer = document.getElementById('newMedSlots');
  TIME_SLOTS.forEach(slot => {
    const label = document.createElement('label');
    label.className = `slot-check${newMedSlots.has(slot.id) ? ' selected' : ''}`;
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = slot.id;
    cb.checked = newMedSlots.has(slot.id);
    label.appendChild(cb);
    label.appendChild(document.createTextNode(`${slot.emoji} ${slot.label}`));
    label.addEventListener('click', (e) => {
      e.preventDefault();
      if (newMedSlots.has(slot.id)) {
        newMedSlots.delete(slot.id);
        cb.checked = false;
        label.classList.remove('selected');
      } else {
        newMedSlots.add(slot.id);
        cb.checked = true;
        label.classList.add('selected');
      }
    });
    slotsContainer.appendChild(label);
  });
}

// ── Reminder Times ───────────────────────────────────────

function renderReminderTimes() {
  const grid = document.getElementById('reminderTimesGrid');
  grid.textContent = '';

  const remindersToggle = document.getElementById('remindersToggle');
  remindersToggle.checked = settings.remindersEnabled;
  document.getElementById('reminderTimes').style.display = settings.remindersEnabled ? '' : 'none';

  TIME_SLOTS.forEach(slot => {
    const row = document.createElement('div');
    row.className = 'time-slot-row';

    const label = document.createElement('span');
    label.textContent = `${slot.emoji} ${slot.label}`;

    const input = document.createElement('input');
    input.type = 'time';
    input.className = 'time-input';
    input.value = settings.reminderTimes?.[slot.id] || slot.defaultTime;
    input.addEventListener('change', async () => {
      const times = { ...settings.reminderTimes, [slot.id]: input.value };
      await updateSettings({ reminderTimes: times });
      settings.reminderTimes = times;
    });

    row.append(label, input);
    grid.appendChild(row);
  });
}

// ── Events ───────────────────────────────────────────────

function bindEvents() {
  // Add med toggle
  document.getElementById('addMedToggle').addEventListener('click', () => {
    const form = document.getElementById('addForm');
    form.style.display = form.style.display === 'none' ? '' : 'none';
  });

  document.getElementById('cancelAdd').addEventListener('click', () => {
    document.getElementById('addForm').style.display = 'none';
  });

  // Save new med
  document.getElementById('saveNewMed').addEventListener('click', async () => {
    const name = document.getElementById('newMedName').value.trim();
    if (!name) { document.getElementById('newMedName').focus(); return; }

    const med = {
      id: 'med_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
      name,
      dosage: document.getElementById('newMedDosage').value.trim(),
      emoji: MED_EMOJIS[medications.length % MED_EMOJIS.length],
      color: MED_COLORS[medications.length % MED_COLORS.length],
      frequency: document.getElementById('newMedFreq').value,
      timeSlots: [...newMedSlots],
      medType: document.getElementById('newMedType').value,
      supply: document.getElementById('newMedSupply').value ? parseInt(document.getElementById('newMedSupply').value, 10) : null,
      supplyWarning: 7,
      active: true,
      createdAt: Date.now(),
      order: medications.length,
    };

    await addMedication(med);
    medications = await getMedications();
    renderMedList();
    document.getElementById('addForm').style.display = 'none';
    document.getElementById('newMedName').value = '';
    document.getElementById('newMedDosage').value = '';
    document.getElementById('newMedSupply').value = '';
  });

  // Reminders toggle
  document.getElementById('remindersToggle').addEventListener('change', async (e) => {
    settings.remindersEnabled = e.target.checked;
    await updateSettings({ remindersEnabled: settings.remindersEnabled });
    document.getElementById('reminderTimes').style.display = settings.remindersEnabled ? '' : 'none';
  });

  // Dark mode toggle — syncs with theme system
  const darkToggle = document.getElementById('darkToggle');
  const currentTheme = THEMES.find(t => document.body.classList.contains('theme-' + t)) || 'retro';
  darkToggle.checked = currentTheme === 'dark';
  darkToggle.addEventListener('change', async (e) => {
    const newTheme = e.target.checked ? 'dark' : 'retro';
    applyTheme(newTheme);
    chrome.storage.local.set({ theme: newTheme });
    await updateSettings({ darkMode: e.target.checked });
  });

  // Export
  document.getElementById('exportBtn').addEventListener('click', async () => {
    const data = await exportAllData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `lovespark-med-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  });

  // Import
  document.getElementById('importBtn').addEventListener('click', () => {
    document.getElementById('importFile').click();
  });

  document.getElementById('importFile').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const text = await file.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      alert('Invalid JSON file');
      return;
    }

    if (!json.medications || !json.doses) {
      alert('Invalid backup file — missing medications or doses data');
      return;
    }

    if (!confirm('This will replace all your current data. Continue?')) return;

    await importData(json);
    medications = await getMedications();
    settings = await getSettings();
    renderMedList();
    alert('Data imported successfully! 💕');
  });

  // Report
  document.getElementById('reportBtn').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('report.html') });
  });

  // Clear
  document.getElementById('clearBtn').addEventListener('click', async () => {
    if (!confirm('Delete ALL medication data? This cannot be undone.')) return;
    if (!confirm('Are you really sure? All dose history will be lost.')) return;
    await clearAllData();
    medications = [];
    settings = {};
    renderMedList();
    alert('All data cleared. 💕');
  });
}

init();
