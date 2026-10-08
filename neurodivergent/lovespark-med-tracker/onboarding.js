import { saveMedications, getSettings, updateSettings } from './utils/storage.js';
import { FREQUENCIES, MED_TYPES, MED_COLORS, MED_EMOJIS, TIME_SLOTS, COMMON_MEDS } from './utils/constants.js';

const medications = [];
let selectedEmoji = MED_EMOJIS[0];
let selectedColor = MED_COLORS[0];
const selectedSlots = new Set(['morning']);

// ── DOM ──────────────────────────────────────────────────

const steps = [
  document.getElementById('step1'),
  document.getElementById('step2'),
  document.getElementById('step3'),
];
const dots = document.querySelectorAll('.dot');

const startBtn = document.getElementById('startBtn');
const backBtn1 = document.getElementById('backBtn1');
const nextBtn2 = document.getElementById('nextBtn2');
const addMedBtn = document.getElementById('addMedBtn');
const doneBtn = document.getElementById('doneBtn');

const medName = document.getElementById('medName');
const medDosage = document.getElementById('medDosage');
const medFrequency = document.getElementById('medFrequency');
const medType = document.getElementById('medType');
const slotCheckboxes = document.getElementById('slotCheckboxes');
const emojiPicker = document.getElementById('emojiPicker');
const colorPicker = document.getElementById('colorPicker');
const addedMeds = document.getElementById('addedMeds');
const doneSummary = document.getElementById('doneSummary');

// ── Init ─────────────────────────────────────────────────

function init() {
  getSettings().then(settings => {
    if (settings.onboardingComplete) showStep(2);
  });
  populateForm();
  bindEvents();
}

function populateForm() {
  const dl = document.getElementById('medSuggestions');
  COMMON_MEDS.forEach(name => {
    const opt = document.createElement('option');
    opt.value = name;
    dl.appendChild(opt);
  });

  FREQUENCIES.forEach(f => {
    const opt = document.createElement('option');
    opt.value = f.id;
    opt.textContent = f.label;
    medFrequency.appendChild(opt);
  });

  MED_TYPES.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t.id;
    opt.textContent = t.label;
    medType.appendChild(opt);
  });

  TIME_SLOTS.forEach(slot => {
    const label = document.createElement('label');
    label.className = `slot-check${selectedSlots.has(slot.id) ? ' selected' : ''}`;
    const cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.value = slot.id;
    cb.checked = selectedSlots.has(slot.id);
    cb.style.display = 'none';
    label.appendChild(cb);
    label.appendChild(document.createTextNode(`${slot.emoji} ${slot.label}`));
    label.addEventListener('click', (e) => {
      e.preventDefault();
      if (selectedSlots.has(slot.id)) {
        selectedSlots.delete(slot.id);
        cb.checked = false;
        label.classList.remove('selected');
      } else {
        selectedSlots.add(slot.id);
        cb.checked = true;
        label.classList.add('selected');
      }
    });
    slotCheckboxes.appendChild(label);
  });

  MED_EMOJIS.forEach(emoji => {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `emoji-btn${emoji === selectedEmoji ? ' selected' : ''}`;
    btn.textContent = emoji;
    btn.addEventListener('click', () => {
      document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedEmoji = emoji;
    });
    emojiPicker.appendChild(btn);
  });

  MED_COLORS.forEach(color => {
    const swatch = document.createElement('button');
    swatch.type = 'button';
    swatch.className = `color-swatch${color === selectedColor ? ' selected' : ''}`;
    swatch.style.backgroundColor = color;
    swatch.addEventListener('click', () => {
      document.querySelectorAll('.color-swatch').forEach(s => s.classList.remove('selected'));
      swatch.classList.add('selected');
      selectedColor = color;
    });
    colorPicker.appendChild(swatch);
  });
}

function bindEvents() {
  startBtn.addEventListener('click', () => showStep(1));
  backBtn1.addEventListener('click', () => showStep(0));
  nextBtn2.addEventListener('click', () => finishOnboarding());
  addMedBtn.addEventListener('click', handleAddMed);
  doneBtn.addEventListener('click', () => window.close());
  medName.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleAddMed();
  });
}

// ── Steps ────────────────────────────────────────────────

function showStep(idx) {
  steps.forEach((s, i) => s.style.display = i === idx ? '' : 'none');
  dots.forEach((d, i) => d.classList.toggle('active', i === idx));
}

// ── Add Medication ───────────────────────────────────────

function handleAddMed() {
  const name = medName.value.trim();
  if (!name) { medName.focus(); return; }

  const med = {
    id: 'med_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6),
    name,
    dosage: medDosage.value.trim() || '',
    emoji: selectedEmoji,
    color: selectedColor,
    frequency: medFrequency.value,
    timeSlots: [...selectedSlots],
    medType: medType.value,
    supply: null,
    supplyWarning: 7,
    active: true,
    createdAt: Date.now(),
    order: medications.length,
  };

  medications.push(med);
  renderMedList(addedMeds, true);
  medName.value = '';
  medDosage.value = '';
  medName.focus();
  nextBtn2.disabled = false;
}

function removeMed(id) {
  const idx = medications.findIndex(m => m.id === id);
  if (idx !== -1) medications.splice(idx, 1);
  renderMedList(addedMeds, true);
  nextBtn2.disabled = medications.length === 0;
}

function createMedCard(med, showRemove) {
  const card = document.createElement('div');
  card.className = 'added-med';

  const info = document.createElement('div');
  info.className = 'added-med-info';

  const emoji = document.createElement('span');
  emoji.className = 'added-med-emoji';
  emoji.textContent = med.emoji;

  const name = document.createElement('span');
  name.className = 'added-med-name';
  name.textContent = med.name;

  const dosage = document.createElement('span');
  dosage.className = 'added-med-dosage';
  dosage.textContent = med.dosage;

  info.append(emoji, name, dosage);
  card.appendChild(info);

  if (showRemove) {
    const btn = document.createElement('button');
    btn.className = 'remove-med-btn';
    btn.textContent = '✕';
    btn.setAttribute('aria-label', `Remove ${med.name}`);
    btn.addEventListener('click', () => removeMed(med.id));
    card.appendChild(btn);
  }

  return card;
}

function renderMedList(container, showRemove) {
  container.textContent = '';
  medications.forEach(med => container.appendChild(createMedCard(med, showRemove)));
}

// ── Finish ───────────────────────────────────────────────

async function finishOnboarding() {
  if (medications.length === 0) return;

  await saveMedications(medications);
  await updateSettings({ onboardingComplete: true, lastResetDate: new Date().toISOString().slice(0, 10) });
  chrome.runtime.sendMessage({ type: 'ONBOARDING_COMPLETE' });

  renderMedList(doneSummary, false);
  showStep(2);
}

init();
