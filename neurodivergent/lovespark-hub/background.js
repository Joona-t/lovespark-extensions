'use strict';

/* ── LoveSpark Hub — Background Service Worker ──────────────────────
   Manages break reminder alarms and browsing session tracking.
   No notifications API — stores timestamps for the newtab page to read. */

const REMINDER_INTERVALS = {
  water:  45,
  food:  180,
  move:   60,
  meds:   60
};

/* ── Alarm Setup ──────────────────────────────────────────────────── */

function setupAlarms() {
  Object.entries(REMINDER_INTERVALS).forEach(([name, minutes]) => {
    chrome.alarms.create('reminder-' + name, {
      delayInMinutes: minutes,
      periodInMinutes: minutes
    });
  });
}

/* ── Install / Startup ────────────────────────────────────────────── */

chrome.runtime.onInstalled.addListener(() => {
  const now = Date.now();

  chrome.storage.local.get(['sessionStart', 'reminders', 'medsInterval'], (data) => {
    const defaults = {};

    if (!data.sessionStart) {
      defaults.sessionStart = now;
    }

    if (!data.reminders) {
      defaults.reminders = {
        water: { lastDone: now, overdue: false },
        food:  { lastDone: now, overdue: false },
        move:  { lastDone: now, overdue: false },
        meds:  { lastDone: now, overdue: false }
      };
    }

    if (!data.medsInterval) {
      defaults.medsInterval = 60;
    }

    if (Object.keys(defaults).length > 0) {
      chrome.storage.local.set(defaults);
    }
  });

  setupAlarms();
});

chrome.runtime.onStartup.addListener(() => {
  chrome.storage.local.set({ sessionStart: Date.now() });
  setupAlarms();
});

/* ── Alarm Fired ──────────────────────────────────────────────────── */

chrome.alarms.onAlarm.addListener((alarm) => {
  if (!alarm.name.startsWith('reminder-')) return;

  const type = alarm.name.replace('reminder-', '');

  chrome.storage.local.get(['reminders'], (data) => {
    const reminders = data.reminders || {};
    if (reminders[type]) {
      reminders[type].overdue = true;
      chrome.storage.local.set({ reminders });
    }
  });
});

/* ── Message Handler ──────────────────────────────────────────────── */

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.action === 'markReminderDone') {
    const type = msg.type;
    chrome.storage.local.get(['reminders'], (data) => {
      const reminders = data.reminders || {};
      if (reminders[type]) {
        reminders[type].lastDone = Date.now();
        reminders[type].overdue = false;
        chrome.storage.local.set({ reminders });

        const interval = type === 'meds' ? null : REMINDER_INTERVALS[type];
        if (interval) {
          chrome.alarms.create('reminder-' + type, {
            delayInMinutes: interval,
            periodInMinutes: interval
          });
        } else {
          chrome.storage.local.get(['medsInterval'], (d) => {
            const mins = d.medsInterval || 60;
            chrome.alarms.create('reminder-meds', {
              delayInMinutes: mins,
              periodInMinutes: mins
            });
          });
        }
      }
      sendResponse({ ok: true });
    });
    return true;
  }

  if (msg.action === 'setMedsInterval') {
    const mins = Math.max(1, Math.min(1440, parseInt(msg.minutes, 10) || 60));
    chrome.storage.local.set({ medsInterval: mins });
    chrome.alarms.create('reminder-meds', {
      delayInMinutes: mins,
      periodInMinutes: mins
    });
    sendResponse({ ok: true, minutes: mins });
    return true;
  }
});
