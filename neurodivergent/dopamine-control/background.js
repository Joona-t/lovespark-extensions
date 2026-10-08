// Dopamine Control — Background Service Worker
// Handles time tracking, midnight reset, badge, notifications, overrides.

importScripts('shared/utils.js', 'shared/constants.js', 'shared/storage.js');

// ============================================================
// INITIALIZATION
// ============================================================

chrome.runtime.onInstalled.addListener(async () => {
  await storage.init();
  await checkMidnightReset();
  await scheduleNextMidnight();
  await updateBadge();
  console.log('[DC] Installed.');
});

chrome.runtime.onStartup.addListener(async () => {
  await checkMidnightReset();
  await scheduleNextMidnight();
  await updateBadge();
  console.log('[DC] Browser started.');
});

// ============================================================
// MIDNIGHT RESET
// ============================================================

async function checkMidnightReset() {
  const data = await storage.get([
    'lastResetDate', 'todayWatchTime', 'weekdayLimit', 'weekendLimit',
    'currentStreak', 'bestStreak', 'dailyHistory', 'overrideUsedToday'
  ]);

  const today = getTodayString();
  if (data.lastResetDate && data.lastResetDate !== today) {
    await performMidnightReset(data);
  }
}

async function performMidnightReset(data) {
  const yesterday = data.lastResetDate;

  // Determine yesterday's limit (weekday vs weekend)
  let limit = data.weekdayLimit;
  if (yesterday) {
    const yDate = new Date(yesterday + 'T12:00:00');
    const yDay = yDate.getDay();
    if (yDay === 0 || yDay === 6) limit = data.weekendLimit;
  }

  const wasSuccessful = (data.todayWatchTime || 0) <= limit && !data.overrideUsedToday;

  // Update streak
  let newStreak = wasSuccessful ? (data.currentStreak || 0) + 1 : 0;
  let newBest = Math.max(data.bestStreak || 0, newStreak);

  // Archive yesterday
  const history = [...(data.dailyHistory || [])];
  if (yesterday) {
    history.push({
      date: yesterday,
      watchTime: data.todayWatchTime || 0,
      limit,
      underLimit: wasSuccessful,
      overrideUsed: data.overrideUsedToday || false
    });
    if (history.length > 90) history.splice(0, history.length - 90);
  }

  await storage.set({
    lastResetDate: getTodayString(),
    todayWatchTime: 0,
    todayWhitelistTime: 0,
    todayShortsTime: 0,
    warned80: false,
    warned95: false,
    overrideUsedToday: false,
    overrideExpiresAt: null,
    currentStreak: newStreak,
    bestStreak: newBest,
    dailyHistory: history
  });

  console.log(`[DC] Midnight reset. Streak: ${newStreak}. Yesterday successful: ${wasSuccessful}`);
}

async function scheduleNextMidnight() {
  await chrome.alarms.clear('midnight');
  chrome.alarms.create('midnight', { when: getNextMidnight() });
}

// ============================================================
// ALARM HANDLER
// ============================================================

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'midnight') {
    const data = await storage.get([
      'lastResetDate', 'todayWatchTime', 'weekdayLimit', 'weekendLimit',
      'currentStreak', 'bestStreak', 'dailyHistory', 'overrideUsedToday'
    ]);
    await performMidnightReset(data);
    await scheduleNextMidnight();
    await updateBadge();

  } else if (alarm.name === 'override-expiry') {
    await storage.set({ overrideExpiresAt: null });
    const data = await storage.get(['todayWatchTime', 'weekdayLimit', 'weekendLimit']);
    const limit = isWeekend() ? data.weekendLimit : data.weekdayLimit;
    if ((data.todayWatchTime || 0) >= limit) {
      await broadcastToYouTube({ type: 'BLOCK_NOW', payload: await buildBlockPayload() });
    }
    await updateBadge();
  }
});

// ============================================================
// BADGE
// ============================================================

async function updateBadge() {
  const data = await storage.get([
    'todayWatchTime', 'weekdayLimit', 'weekendLimit', 'overrideExpiresAt'
  ]);

  const limit = isWeekend() ? data.weekendLimit : data.weekdayLimit;
  const used = data.todayWatchTime || 0;
  const remaining = Math.max(0, limit - used);
  const pct = Math.min(100, (used / limit) * 100);
  const isOverriding = data.overrideExpiresAt && Date.now() < data.overrideExpiresAt;
  const isBlocked = used >= limit && !isOverriding;

  if (isBlocked) {
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#D63031' });
  } else if (pct >= 80) {
    chrome.action.setBadgeText({ text: formatTimeBadge(remaining) });
    chrome.action.setBadgeBackgroundColor({ color: '#FFD166' });
  } else if (used === 0) {
    chrome.action.setBadgeText({ text: 'OK' });
    chrome.action.setBadgeBackgroundColor({ color: '#7ECFA0' });
  } else {
    chrome.action.setBadgeText({ text: formatTimeBadge(remaining) });
    chrome.action.setBadgeBackgroundColor({ color: '#FF69B4' });
  }
}

// ============================================================
// TIME UPDATE
// ============================================================

async function handleTimeUpdate(seconds, isWhitelisted) {
  await checkMidnightReset();

  const data = await storage.get([
    'todayWatchTime', 'todayWhitelistTime', 'todayShortsTime',
    'weekdayLimit', 'weekendLimit',
    'warned80', 'warned95',
    'overrideExpiresAt', 'overrideUsedToday'
  ]);

  const limit = isWeekend() ? data.weekendLimit : data.weekdayLimit;
  const isOverriding = data.overrideExpiresAt && Date.now() < data.overrideExpiresAt;

  // If override expired, re-block
  if (data.overrideExpiresAt && Date.now() > data.overrideExpiresAt) {
    await storage.set({ overrideExpiresAt: null });
    if ((data.todayWatchTime || 0) >= limit) {
      await broadcastToYouTube({ type: 'BLOCK_NOW', payload: await buildBlockPayload() });
    }
    await updateBadge();
    return;
  }

  // If blocked and not overriding, ignore time
  if ((data.todayWatchTime || 0) >= limit && !isOverriding) return;

  const updates = {
    todayWatchTime: (data.todayWatchTime || 0) + (isWhitelisted ? 0 : seconds),
    todayWhitelistTime: (data.todayWhitelistTime || 0) + (isWhitelisted ? seconds : 0)
  };

  const newUsed = updates.todayWatchTime;
  const newPct = Math.min(100, (newUsed / limit) * 100);

  // Fire 80% warning
  if (!data.warned80 && newPct >= 80 && newPct < 95) {
    updates.warned80 = true;
    const remaining = formatTime(Math.max(0, limit - newUsed));
    chrome.notifications.create('warn-80', {
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: 'Dopamine Control 🌸',
      message: `You've used 80% of your YouTube time. ${remaining} remaining!`,
      priority: 1
    });
  }

  // Fire 95% warning
  if (!data.warned95 && newPct >= 95 && newUsed < limit) {
    updates.warned95 = true;
    const remaining = formatTime(Math.max(0, limit - newUsed));
    chrome.notifications.create('warn-95', {
      type: 'basic',
      iconUrl: 'icons/icon-128.png',
      title: 'Dopamine Control ⚠️',
      message: `Almost out! Only ${remaining} left.`,
      priority: 2
    });
  }

  await storage.set(updates);

  // Block if limit hit
  if (newUsed >= limit && !isOverriding) {
    await updateBadge();
    await broadcastToYouTube({ type: 'BLOCK_NOW', payload: await buildBlockPayload() });
    return;
  }

  await updateBadge();
}

async function buildBlockPayload() {
  const data = await storage.get([
    'todayWatchTime', 'weekdayLimit', 'weekendLimit',
    'currentStreak', 'userLevel', 'dailyHistory'
  ]);
  const limit = isWeekend() ? data.weekendLimit : data.weekdayLimit;
  const quote = MOTIVATIONAL_QUOTES[getDayOfYear() % MOTIVATIONAL_QUOTES.length];

  const sevenDaysAgo = Date.now() - 7 * 86400000;
  const weeklyTotal = (data.dailyHistory || [])
    .filter(d => new Date(d.date + 'T12:00:00').getTime() >= sevenDaysAgo)
    .reduce((sum, d) => sum + d.watchTime, 0);

  return {
    watchTime: data.todayWatchTime || 0,
    limit,
    streak: data.currentStreak || 0,
    level: data.userLevel || 1,
    weeklyTotal,
    quote
  };
}

async function broadcastToYouTube(message) {
  const tabs = await chrome.tabs.query({ url: '*://*.youtube.com/*' });
  for (const tab of tabs) {
    try {
      await chrome.tabs.sendMessage(tab.id, message);
    } catch (_) {
      // Content script may not be present on all YouTube pages
    }
  }
}

// ============================================================
// OVERRIDE
// ============================================================

async function handleOverrideRequest(sendResponse) {
  const data = await storage.get(['overrideUsedToday', 'currentStreak']);
  if (data.overrideUsedToday) {
    sendResponse({ success: false, reason: 'already_used' });
    return;
  }
  sendResponse({ success: true, streak: data.currentStreak || 0 });
}

async function handleOverrideConfirm(sendResponse) {
  const data = await storage.get(['overrideUsedToday']);
  if (data.overrideUsedToday) {
    sendResponse({ success: false });
    return;
  }

  const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes

  await storage.set({
    overrideUsedToday: true,
    overrideExpiresAt: expiresAt,
    currentStreak: 0
  });

  chrome.alarms.create('override-expiry', { when: expiresAt });
  await broadcastToYouTube({ type: 'UNBLOCK', payload: { expiresAt } });
  await updateBadge();

  sendResponse({ success: true, expiresAt });
}

// ============================================================
// MESSAGE HANDLER
// ============================================================

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handle = async () => {
    switch (message.type) {

      case 'TIME_UPDATE':
        await handleTimeUpdate(
          message.payload.seconds,
          message.payload.isWhitelisted || false
        );
        sendResponse({ ok: true });
        break;

      case 'GET_FULL_STATUS': {
        await checkMidnightReset();
        const data = await storage.get([
          'todayWatchTime', 'todayWhitelistTime', 'weekdayLimit', 'weekendLimit',
          'overrideExpiresAt', 'overrideUsedToday',
          'currentStreak', 'bestStreak', 'userLevel', 'userXP', 'dailyHistory'
        ]);
        const limit = isWeekend() ? data.weekendLimit : data.weekdayLimit;
        const used = data.todayWatchTime || 0;
        const isOverriding = data.overrideExpiresAt && Date.now() < data.overrideExpiresAt;
        sendResponse({
          watchTime: used,
          whitelistTime: data.todayWhitelistTime || 0,
          limit,
          isWeekend: isWeekend(),
          percentage: Math.min(100, (used / limit) * 100),
          isBlocked: used >= limit && !isOverriding,
          isOverriding: !!isOverriding,
          overrideExpiresAt: data.overrideExpiresAt || null,
          overrideUsedToday: data.overrideUsedToday || false,
          streak: data.currentStreak || 0,
          bestStreak: data.bestStreak || 0,
          level: data.userLevel || 1,
          xp: data.userXP || 0,
          weekdayLimit: data.weekdayLimit,
          weekendLimit: data.weekendLimit,
          dailyHistory: data.dailyHistory || []
        });
        break;
      }

      case 'REQUEST_STATUS': {
        const data = await storage.get([
          'todayWatchTime', 'weekdayLimit', 'weekendLimit',
          'overrideExpiresAt', 'currentStreak', 'userLevel'
        ]);
        const limit = isWeekend() ? data.weekendLimit : data.weekdayLimit;
        const used = data.todayWatchTime || 0;
        const isOverriding = data.overrideExpiresAt && Date.now() < data.overrideExpiresAt;
        sendResponse({
          watchTime: used,
          limit,
          percentage: Math.min(100, (used / limit) * 100),
          isBlocked: used >= limit && !isOverriding,
          isOverriding: !!isOverriding,
          overrideExpiresAt: data.overrideExpiresAt || null,
          streak: data.currentStreak || 0,
          level: data.userLevel || 1
        });
        break;
      }

      case 'UPDATE_SETTINGS': {
        const allowed = [
          'weekdayLimit', 'weekendLimit', 'breakRemindersEnabled',
          'breakIntervalMinutes', 'floatingTimerVisible',
          'includeYouTubeMusic', 'showShortsBreakdown'
        ];
        const updates = {};
        for (const key of allowed) {
          if (key in message.payload) updates[key] = message.payload[key];
        }
        await storage.set(updates);
        await updateBadge();
        sendResponse({ ok: true });
        break;
      }

      case 'REQUEST_OVERRIDE':
        await handleOverrideRequest(sendResponse);
        break;

      case 'CONFIRM_OVERRIDE':
        await handleOverrideConfirm(sendResponse);
        break;

      case 'RESET_DATA':
        await chrome.storage.local.clear();
        await storage.init();
        await updateBadge();
        sendResponse({ ok: true });
        break;

      default:
        sendResponse({ error: 'Unknown message type' });
    }
  };

  handle().catch(err => {
    console.error('[DC] Handler error:', err);
    sendResponse({ error: err.message });
  });

  return true; // Keep channel open for async response
});
