import { getMedications, getDosesForDate, getSettings, updateSettings } from './utils/storage.js';
import { todayStr } from './utils/dates.js';
import { TIME_SLOTS, DEFAULT_SETTINGS, STORAGE_KEYS } from './utils/constants.js';

// ── Install / Startup ────────────────────────────────────

chrome.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === 'install') {
    await chrome.storage.local.set({
      [STORAGE_KEYS.SETTINGS]: { ...DEFAULT_SETTINGS, lastResetDate: todayStr() },
    });
    chrome.tabs.create({ url: chrome.runtime.getURL('onboarding.html') });
  } else if (details.reason === 'update') {
    const settings = await getSettings();
    if (!settings.lastResetDate) {
      await updateSettings({ lastResetDate: todayStr() });
    }
  }

  setupAlarms();
  updateBadge();
});

chrome.runtime.onStartup.addListener(() => {
  setupAlarms();
  updateBadge();
});

function setupAlarms() {
  chrome.alarms.create('reminderCheck', { periodInMinutes: 15 });
  chrome.alarms.create('dailyReset', { periodInMinutes: 60 });
  chrome.alarms.create('badgeUpdate', { periodInMinutes: 5 });
}

// ── Alarm Handler ────────────────────────────────────────

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'reminderCheck') await checkReminders();
  else if (alarm.name === 'dailyReset') await checkDailyReset();
  else if (alarm.name === 'badgeUpdate') await updateBadge();
});

// ── Badge ────────────────────────────────────────────────

async function updateBadge() {
  const settings = await getSettings();
  if (!settings.onboardingComplete) {
    chrome.action.setBadgeText({ text: '' });
    return;
  }

  const meds = await getMedications();
  const activeMeds = meds.filter(m => m.active && m.frequency !== 'as_needed');
  if (activeMeds.length === 0) {
    chrome.action.setBadgeText({ text: '' });
    return;
  }

  const todayDoses = await getDosesForDate(todayStr());

  let expected = 0;
  let taken = 0;
  for (const med of activeMeds) {
    for (const slot of med.timeSlots) {
      expected++;
      if (todayDoses.some(d => d.medicationId === med.id && d.scheduledSlot === slot && d.status === 'taken')) {
        taken++;
      }
    }
  }

  if (expected === 0) {
    chrome.action.setBadgeText({ text: '' });
    return;
  }

  if (taken >= expected) {
    chrome.action.setBadgeText({ text: '✓' });
    chrome.action.setBadgeBackgroundColor({ color: '#0D9488' });
  } else {
    chrome.action.setBadgeText({ text: String(expected - taken) });
    chrome.action.setBadgeBackgroundColor({ color: '#E8457C' });
  }
  chrome.action.setBadgeTextColor({ color: '#FFFFFF' });
}

// ── Daily Reset ──────────────────────────────────────────

async function checkDailyReset() {
  const settings = await getSettings();
  const today = todayStr();
  if (settings.lastResetDate !== today) {
    await updateSettings({ lastResetDate: today });
    await updateBadge();
  }
}

// ── Reminders ────────────────────────────────────────────

async function checkReminders() {
  const settings = await getSettings();
  if (!settings.remindersEnabled || !settings.onboardingComplete) return;

  const meds = await getMedications();
  const todayDoses = await getDosesForDate(todayStr());
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  for (const med of meds) {
    if (!med.active) continue;

    for (const slotId of med.timeSlots) {
      const slot = TIME_SLOTS.find(s => s.id === slotId);
      if (!slot) continue;

      const timeStr = settings.reminderTimes?.[slotId] || slot.defaultTime;
      const [h, m] = timeStr.split(':').map(Number);
      const slotMinutes = h * 60 + m;
      const lead = settings.reminderLeadMinutes || 15;

      // In reminder window: from (slotTime - lead) to (slotTime + 30min)
      if (currentMinutes < slotMinutes - lead || currentMinutes > slotMinutes + 30) continue;

      const alreadyLogged = todayDoses.some(
        d => d.medicationId === med.id && d.scheduledSlot === slotId
      );
      if (alreadyLogged) continue;

      chrome.notifications.create(`reminder_${med.id}_${slotId}_${todayStr()}`, {
        type: 'basic',
        iconUrl: 'icons/icon-128.png',
        title: `${med.emoji} Time for ${med.name}`,
        message: `${slot.emoji} ${slot.label} dose: ${med.dosage}. Take care of yourself! 💕`,
      });
    }
  }
}

// ── Notification Click ───────────────────────────────────

chrome.notifications.onClicked.addListener(() => {
  chrome.action.openPopup?.();
});

// ── Message Handler ──────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'UPDATE_BADGE') {
    updateBadge().then(() => sendResponse({ ok: true }));
    return true;
  }
  if (msg.type === 'ONBOARDING_COMPLETE') {
    updateSettings({ onboardingComplete: true }).then(() => {
      updateBadge();
      sendResponse({ ok: true });
    });
    return true;
  }
  return false;
});

// Boot
updateBadge();
