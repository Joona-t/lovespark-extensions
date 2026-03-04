import { STORAGE_KEYS, DEFAULT_SETTINGS } from './constants.js';

async function getKey(key) {
  const result = await chrome.storage.local.get(key);
  return result[key] ?? null;
}

async function setKey(key, value) {
  return chrome.storage.local.set({ [key]: value });
}

// ── Medications ──────────────────────────────────────────

export async function getMedications() {
  const data = await getKey(STORAGE_KEYS.MEDICATIONS);
  return data?.medications ?? [];
}

export async function saveMedications(medications) {
  return setKey(STORAGE_KEYS.MEDICATIONS, { medications });
}

export async function addMedication(med) {
  const meds = await getMedications();
  meds.push(med);
  return saveMedications(meds);
}

export async function updateMedication(id, updates) {
  const meds = await getMedications();
  const idx = meds.findIndex(m => m.id === id);
  if (idx === -1) return;
  Object.assign(meds[idx], updates);
  return saveMedications(meds);
}

export async function deleteMedication(id) {
  const meds = await getMedications();
  return saveMedications(meds.filter(m => m.id !== id));
}

// ── Doses ────────────────────────────────────────────────

export async function getDoses() {
  const data = await getKey(STORAGE_KEYS.DOSES);
  return data?.doses ?? [];
}

export async function saveDoses(doses) {
  return setKey(STORAGE_KEYS.DOSES, { doses });
}

export async function logDose(dose) {
  const doses = await getDoses();
  doses.push(dose);
  await saveDoses(doses);

  // Decrement supply if tracked
  if (dose.status === 'taken') {
    const meds = await getMedications();
    const med = meds.find(m => m.id === dose.medicationId);
    if (med && med.supply !== null && med.supply > 0) {
      med.supply -= 1;
      await saveMedications(meds);
    }
  }
}

export async function undoDose(doseId) {
  const doses = await getDoses();
  const idx = doses.findIndex(d => d.id === doseId);
  if (idx === -1) return;

  const dose = doses[idx];
  doses.splice(idx, 1);
  await saveDoses(doses);

  // Re-increment supply if it was taken
  if (dose.status === 'taken') {
    const meds = await getMedications();
    const med = meds.find(m => m.id === dose.medicationId);
    if (med && med.supply !== null) {
      med.supply += 1;
      await saveMedications(meds);
    }
  }
}

export async function getDosesForDate(dateStr) {
  const doses = await getDoses();
  return doses.filter(d => d.date === dateStr);
}

export async function getDosesForRange(startDate, endDate) {
  const doses = await getDoses();
  return doses.filter(d => d.date >= startDate && d.date <= endDate);
}

// ── Settings ─────────────────────────────────────────────

export async function getSettings() {
  const data = await getKey(STORAGE_KEYS.SETTINGS);
  return { ...DEFAULT_SETTINGS, ...(data ?? {}) };
}

export async function updateSettings(updates) {
  const current = await getSettings();
  return setKey(STORAGE_KEYS.SETTINGS, { ...current, ...updates });
}

// ── Export / Import ──────────────────────────────────────

export async function exportAllData() {
  const [medications, doses, settings] = await Promise.all([
    getMedications(),
    getDoses(),
    getSettings(),
  ]);
  return {
    version: 1,
    app: 'lovespark-med-tracker',
    exportedAt: new Date().toISOString(),
    medications,
    doses,
    settings,
  };
}

export async function importData(json) {
  if (!json.medications || !json.doses) throw new Error('Invalid backup file');
  await saveMedications(json.medications);
  await saveDoses(json.doses);
  if (json.settings) await setKey(STORAGE_KEYS.SETTINGS, json.settings);
}

export async function clearAllData() {
  await chrome.storage.local.remove([
    STORAGE_KEYS.MEDICATIONS,
    STORAGE_KEYS.DOSES,
    STORAGE_KEYS.SETTINGS,
  ]);
}
