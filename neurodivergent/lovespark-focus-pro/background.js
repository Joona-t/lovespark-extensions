// LoveSpark Focus Pro — background.js (Service Worker)
// Single source of truth for timer state, site blocking, stats, and pro status.
// Uses chrome.alarms for SW persistence.
'use strict';

// ── Constants ────────────────────────────────────────────────────────────────

const FREE_SITE_LIMIT = 3;

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

// ── Default storage values ──────────────────────────────────────────────────

const DEFAULTS = {
  // Timer state
  timerState: 'idle',       // idle | running | paused
  sessionType: 'focus',     // focus | shortBreak | longBreak
  endTime: null,
  remainingSeconds: null,
  currentCyclePosition: 0,

  // Stats — daily
  sessionsToday: 0,
  focusMinutesToday: 0,
  lastResetDate: todayStr(),

  // Stats — lifetime
  totalFocusMinutes: 0,
  totalSessions: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastSessionDate: null,

  // Focus history (last 30 days): [{date, minutes, sessions}]
  focusHistory: [],

  // Distraction log: [{site, timestamp}]
  distractionLog: [],

  // Settings
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: true,
  autoStartFocus: false,

  // Site blocking
  blockedSites: [],
  siteBlockingEnabled: true,

  // Sound
  activeSound: null,
  soundVolume: 50,

  // Pro status (stub — will integrate ExtensionPay later)
  proStatus: false,
};

// ── Storage helpers ─────────────────────────────────────────────────────────

async function getAll() {
  return chrome.storage.local.get(null);
}

async function get(...keys) {
  return chrome.storage.local.get(keys.length === 1 ? keys[0] : keys);
}

async function set(obj) {
  return chrome.storage.local.set(obj);
}

// ── Storage initialization ──────────────────────────────────────────────────

let _initialized = false;

async function initStorage() {
  if (_initialized) return;
  _initialized = true;

  const existing = await getAll();
  const today = todayStr();
  const updates = {};

  // Set any missing keys to defaults
  for (const [key, val] of Object.entries(DEFAULTS)) {
    if (!(key in existing)) updates[key] = val;
  }

  // Daily reset
  const resetDate = existing.lastResetDate || today;
  if (resetDate !== today) {
    // Archive yesterday's stats before resetting
    await archiveDailyStats(existing, resetDate);
    updates.sessionsToday = 0;
    updates.focusMinutesToday = 0;
    updates.lastResetDate = today;
  }

  if (Object.keys(updates).length > 0) await set(updates);

  // Recover timer if it was running when service worker was killed
  await recoverTimer(existing);
  await updateBadge();
}

// Archive daily stats into focusHistory (last 30 days)
async function archiveDailyStats(data, dateStr) {
  const history = [...(data.focusHistory || [])];
  const minutes = data.focusMinutesToday || 0;
  const sessions = data.sessionsToday || 0;

  if (minutes > 0 || sessions > 0) {
    history.push({ date: dateStr, minutes, sessions });
  }

  // Keep only last 30 days
  while (history.length > 30) {
    history.shift();
  }

  await set({ focusHistory: history });
}

// Recover timer if the service worker was killed mid-session
async function recoverTimer(data) {
  if (!data.timerState) return;

  if (data.timerState === 'running' && data.endTime) {
    const now = Date.now();
    if (data.endTime <= now) {
      // Session ended while we were asleep
      await handleSessionComplete();
    } else {
      // Still running — recreate alarms
      const remainingMs = data.endTime - now;
      await chrome.alarms.clear('sessionEnd');
      await chrome.alarms.create('sessionEnd', { delayInMinutes: remainingMs / 60000 });
      await chrome.alarms.create('stateSave', { periodInMinutes: 5 / 60 });
      await scheduleBadgeAlarm();
    }
  }
}

// ── Badge update ────────────────────────────────────────────────────────────

async function updateBadge() {
  const data = await get('timerState', 'sessionType', 'endTime', 'remainingSeconds');

  if (data.timerState === 'running' && data.endTime) {
    const remaining = Math.max(0, Math.ceil((data.endTime - Date.now()) / 1000));
    const mm = Math.floor(remaining / 60);
    chrome.action.setBadgeText({ text: String(mm) + 'm' });
    const isBreak = data.sessionType === 'shortBreak' || data.sessionType === 'longBreak';
    chrome.action.setBadgeBackgroundColor({ color: isBreak ? '#C084FC' : '#FF69B4' });
    chrome.action.setBadgeTextColor({ color: '#FFFFFF' });
  } else if (data.timerState === 'paused') {
    chrome.action.setBadgeText({ text: '||' });
    chrome.action.setBadgeBackgroundColor({ color: '#c04880' });
    chrome.action.setBadgeTextColor({ color: '#FFFFFF' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

async function scheduleBadgeAlarm() {
  await chrome.alarms.create('badgeTick', { periodInMinutes: 1 });
}

// ── Duration helpers ────────────────────────────────────────────────────────

function getDurationSeconds(sessionType, data) {
  const mins = {
    focus: data.focusDuration || 25,
    shortBreak: data.shortBreakDuration || 5,
    longBreak: data.longBreakDuration || 15,
  }[sessionType] || 25;
  return mins * 60;
}

// ── Timer state machine ─────────────────────────────────────────────────────

async function startTimer(overrideRemaining) {
  const data = await getAll();
  const seconds = overrideRemaining != null
    ? overrideRemaining
    : getDurationSeconds(data.sessionType, data);

  if (seconds <= 0) return;

  const endTime = Date.now() + seconds * 1000;

  await chrome.alarms.clear('sessionEnd');
  await chrome.alarms.create('sessionEnd', { delayInMinutes: seconds / 60 });

  await set({
    timerState: 'running',
    endTime,
    remainingSeconds: null,
  });

  // Periodic state save for resilience
  await chrome.alarms.create('stateSave', { periodInMinutes: 5 / 60 });

  // Enable site blocking during focus sessions
  if (data.sessionType === 'focus') {
    await enableSiteBlocking(data.blockedSites, data.siteBlockingEnabled);
  }

  await updateBadge();
  await scheduleBadgeAlarm();
}

async function pauseTimer() {
  const data = await get('timerState', 'endTime');
  if (data.timerState !== 'running' || !data.endTime) return;

  const remaining = Math.max(0, Math.ceil((data.endTime - Date.now()) / 1000));

  await chrome.alarms.clear('sessionEnd');
  await chrome.alarms.clear('badgeTick');
  await chrome.alarms.clear('stateSave');

  await set({
    timerState: 'paused',
    endTime: null,
    remainingSeconds: remaining,
  });

  await updateBadge();
}

async function resumeTimer() {
  const data = await get('timerState', 'remainingSeconds');
  if (data.timerState !== 'paused') return;
  await startTimer(data.remainingSeconds);
}

async function resetTimer() {
  await chrome.alarms.clear('sessionEnd');
  await chrome.alarms.clear('badgeTick');
  await chrome.alarms.clear('stateSave');

  await set({
    timerState: 'idle',
    endTime: null,
    remainingSeconds: null,
  });

  await disableSiteBlocking();
  await updateBadge();
}

// ── Session completion ──────────────────────────────────────────────────────

async function handleSessionComplete() {
  const data = await getAll();
  const today = todayStr();
  const wasFocus = data.sessionType === 'focus';
  let cyclePos = data.currentCyclePosition || 0;
  const updates = {};

  if (wasFocus) {
    cyclePos = (cyclePos + 1) % (data.longBreakInterval || 4);
    updates.currentCyclePosition = cyclePos;

    // Daily stats (handle day rollover)
    if (today !== data.lastResetDate) {
      await archiveDailyStats(data, data.lastResetDate);
      updates.sessionsToday = 1;
      updates.focusMinutesToday = data.focusDuration || 25;
      updates.lastResetDate = today;
    } else {
      updates.sessionsToday = (data.sessionsToday || 0) + 1;
      updates.focusMinutesToday = (data.focusMinutesToday || 0) + (data.focusDuration || 25);
    }

    // Lifetime stats
    updates.totalSessions = (data.totalSessions || 0) + 1;
    updates.totalFocusMinutes = (data.totalFocusMinutes || 0) + (data.focusDuration || 25);

    // Streak tracking
    const lastDate = data.lastSessionDate;
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (lastDate === yesterday) {
      updates.currentStreak = (data.currentStreak || 0) + 1;
    } else if (lastDate === today) {
      // Same day — streak stays
    } else if (!lastDate) {
      updates.currentStreak = 1;
    } else {
      updates.currentStreak = 1; // Streak broken
    }
    updates.lastSessionDate = today;
    const newStreak = updates.currentStreak ?? data.currentStreak ?? 0;
    if (newStreak > (data.longestStreak || 0)) {
      updates.longestStreak = newStreak;
    }
  }

  // Determine next session type
  let nextType;
  if (wasFocus) {
    nextType = cyclePos === 0 ? 'longBreak' : 'shortBreak';
  } else {
    nextType = 'focus';
  }

  // Transition to idle with next session type
  updates.timerState = 'idle';
  updates.sessionType = nextType;
  updates.endTime = null;
  updates.remainingSeconds = null;

  await set(updates);
  await disableSiteBlocking();

  // Fire notification
  fireNotification(wasFocus, nextType);

  // Auto-start logic
  const autoStartBreaks = data.autoStartBreaks !== false;
  const autoStartFocus = !!data.autoStartFocus;

  if ((nextType !== 'focus' && autoStartBreaks) ||
      (nextType === 'focus' && autoStartFocus)) {
    chrome.alarms.create('autoStart', { delayInMinutes: 1.5 / 60 });
  }

  await updateBadge();
}

// ── Notifications ───────────────────────────────────────────────────────────

function fireNotification(wasFocus, nextType) {
  const msgs = {
    focus: {
      title: 'Focus session complete!',
      message: nextType === 'longBreak'
        ? 'Time for a long break - you earned it!'
        : 'Time for a 5-minute break!',
    },
    shortBreak: {
      title: 'Break is over!',
      message: 'Ready for another focus session? You got this!',
    },
    longBreak: {
      title: 'Long break complete!',
      message: 'Feeling refreshed? Let\'s focus!',
    },
  };

  const key = wasFocus ? 'focus' : (nextType === 'focus' ? 'shortBreak' : 'longBreak');
  const { title, message } = msgs[key];

  chrome.notifications.create({
    type: 'basic',
    iconUrl: 'icons/icon-128.png',
    title,
    message,
  });
}

// ── Site blocking (declarativeNetRequest dynamic rules) ─────────────────────

async function enableSiteBlocking(blockedSites, siteBlockingEnabled) {
  if (!siteBlockingEnabled || !blockedSites || blockedSites.length === 0) return;

  const rules = blockedSites.map((domain, index) => ({
    id: index + 1,
    priority: 1,
    action: {
      type: 'redirect',
      redirect: { extensionPath: '/blocked.html' },
    },
    condition: {
      urlFilter: '||' + domain,
      resourceTypes: ['main_frame'],
    },
  }));

  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map(r => r.id),
    addRules: rules,
  });
}

async function disableSiteBlocking() {
  const existing = await chrome.declarativeNetRequest.getDynamicRules();
  if (existing.length === 0) return;
  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: existing.map(r => r.id),
    addRules: [],
  });
}

// Log a distraction attempt
async function logDistraction(site) {
  const data = await get('distractionLog', 'proStatus');
  if (!data.proStatus) return; // Only log for pro users (analytics feature)

  const log = [...(data.distractionLog || [])];
  log.push({ site, timestamp: Date.now() });

  // Keep last 500 entries
  while (log.length > 500) log.shift();
  await set({ distractionLog: log });
}

// ── Alarm handler ───────────────────────────────────────────────────────────

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'sessionEnd') {
    const data = await get('timerState');
    if (data.timerState === 'running') {
      await handleSessionComplete();
    }
  } else if (alarm.name === 'badgeTick') {
    await updateBadge();
  } else if (alarm.name === 'stateSave') {
    const sdata = await get('timerState', 'endTime');
    if (sdata.timerState === 'running' && sdata.endTime) {
      const remaining = Math.max(0, Math.ceil((sdata.endTime - Date.now()) / 1000));
      await set({ remainingSeconds: remaining });
    }
  } else if (alarm.name === 'autoStart') {
    await startTimer();
  } else if (alarm.name === 'dailyReset') {
    const today = todayStr();
    const data = await get('lastResetDate');
    if (data.lastResetDate !== today) {
      const allData = await getAll();
      await archiveDailyStats(allData, allData.lastResetDate);
      await set({ sessionsToday: 0, focusMinutesToday: 0, lastResetDate: today });
    }
  }
});

// ── Keyboard shortcut handler ───────────────────────────────────────────────

chrome.commands.onCommand.addListener(async (command) => {
  if (command === 'toggle-focus') {
    const data = await get('timerState');
    if (data.timerState === 'running') {
      await pauseTimer();
    } else if (data.timerState === 'paused') {
      await resumeTimer();
    } else {
      await startTimer();
    }
  }
});

// ── Message handler ─────────────────────────────────────────────────────────

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  (async () => {
    switch (message.action) {

      case 'START_FOCUS': {
        const data = await get('timerState');
        if (data.timerState === 'paused') {
          await resumeTimer();
        } else {
          if (data.timerState === 'running') await chrome.alarms.clear('sessionEnd');
          await startTimer();
        }
        sendResponse({ ok: true });
        break;
      }

      case 'PAUSE_FOCUS': {
        await pauseTimer();
        sendResponse({ ok: true });
        break;
      }

      case 'RESET_FOCUS': {
        await resetTimer();
        sendResponse({ ok: true });
        break;
      }

      case 'SKIP_TO_BREAK': {
        // Skip current session and transition
        await handleSessionComplete();
        sendResponse({ ok: true });
        break;
      }

      case 'SET_SESSION_TYPE': {
        const data = await get('timerState');
        if (data.timerState === 'idle') {
          await set({ sessionType: message.sessionType });
        }
        sendResponse({ ok: true });
        break;
      }

      case 'GET_STATE': {
        const state = await getAll();
        sendResponse(state);
        break;
      }

      case 'ADD_BLOCKED_SITE': {
        const data = await get('blockedSites', 'proStatus');
        const sites = [...(data.blockedSites || [])];
        const site = (message.site || '').trim().toLowerCase()
          .replace(/^https?:\/\//, '')
          .replace(/^www\./, '')
          .replace(/\/.*$/, '');

        if (!site || sites.includes(site)) {
          sendResponse({ ok: false, error: 'Invalid or duplicate site' });
          break;
        }

        // Free tier limit
        if (!data.proStatus && sites.length >= FREE_SITE_LIMIT) {
          sendResponse({ ok: false, error: 'free_limit', limit: FREE_SITE_LIMIT });
          break;
        }

        sites.push(site);
        await set({ blockedSites: sites });

        // Re-apply blocking if currently in a focus session
        const timerData = await get('timerState', 'sessionType', 'siteBlockingEnabled');
        if (timerData.timerState !== 'idle' && timerData.sessionType === 'focus') {
          await enableSiteBlocking(sites, timerData.siteBlockingEnabled);
        }

        sendResponse({ ok: true, sites });
        break;
      }

      case 'REMOVE_BLOCKED_SITE': {
        const data = await get('blockedSites');
        const sites = (data.blockedSites || []).filter(s => s !== message.site);
        await set({ blockedSites: sites });

        // Re-apply blocking
        const timerData = await get('timerState', 'sessionType', 'siteBlockingEnabled');
        if (timerData.timerState !== 'idle' && timerData.sessionType === 'focus') {
          await enableSiteBlocking(sites, timerData.siteBlockingEnabled);
        }

        sendResponse({ ok: true, sites });
        break;
      }

      case 'GET_BLOCKED_SITES': {
        const data = await get('blockedSites');
        sendResponse({ sites: data.blockedSites || [] });
        break;
      }

      case 'GET_STATS': {
        const data = await get(
          'sessionsToday', 'focusMinutesToday', 'totalFocusMinutes',
          'totalSessions', 'currentStreak', 'longestStreak', 'lastSessionDate'
        );
        sendResponse({
          sessionsToday: data.sessionsToday || 0,
          focusMinutesToday: data.focusMinutesToday || 0,
          totalFocusMinutes: data.totalFocusMinutes || 0,
          totalSessions: data.totalSessions || 0,
          currentStreak: data.currentStreak || 0,
          longestStreak: data.longestStreak || 0,
          lastSessionDate: data.lastSessionDate,
        });
        break;
      }

      case 'GET_FOCUS_HISTORY': {
        const data = await get('focusHistory');
        sendResponse({ history: data.focusHistory || [] });
        break;
      }

      case 'GET_PRO_STATUS': {
        const data = await get('proStatus');
        sendResponse({ proStatus: !!data.proStatus });
        break;
      }

      case 'UPDATE_BADGE': {
        const badgeText = message.text || '';
        chrome.action.setBadgeText({ text: badgeText });
        const isBreak = message.sessionType === 'shortBreak' || message.sessionType === 'longBreak';
        chrome.action.setBadgeBackgroundColor({ color: isBreak ? '#C084FC' : '#FF69B4' });
        chrome.action.setBadgeTextColor({ color: '#FFFFFF' });
        sendResponse({ ok: true });
        break;
      }

      case 'LOG_DISTRACTION': {
        await logDistraction(message.site);
        sendResponse({ ok: true });
        break;
      }

      default:
        sendResponse({ ok: false, error: 'Unknown action' });
    }
  })();
  return true; // Keep channel open for async response
});

// ── Startup ─────────────────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(initStorage);
chrome.runtime.onStartup.addListener(async () => {
  await initStorage();
  chrome.alarms.create('dailyReset', { periodInMinutes: 60 });
});
