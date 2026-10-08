// CWS screenshot mock — stubs chrome.* APIs with realistic garden data
// Do NOT ship this file. Only used for screenshot generation.

(function () {
  const DAY = 86400000;
  const HOUR = 3600000;
  const now = Date.now();

  // Four gardens at escalating stages — "your focus journey" visible at a glance
  const gardens = {
    "reddit.com":    { domain: "reddit.com",    isBlocked: true,  totalBlockedMs: 9 * DAY,          growthStage: 4, flowerType: 0, lastGrowthTick: new Date(now).toISOString(), streak: { currentDays: 9,  longestDays: 9  } },
    "tiktok.com":    { domain: "tiktok.com",    isBlocked: true,  totalBlockedMs: 2 * DAY + 4*HOUR, growthStage: 3, flowerType: 1, lastGrowthTick: new Date(now).toISOString(), streak: { currentDays: 3,  longestDays: 4  } },
    "twitter.com":   { domain: "twitter.com",   isBlocked: true,  totalBlockedMs: 12 * HOUR,        growthStage: 2, flowerType: 2, lastGrowthTick: new Date(now).toISOString(), streak: { currentDays: 1,  longestDays: 2  } },
    "instagram.com": { domain: "instagram.com", isBlocked: true,  totalBlockedMs: 2 * HOUR,         growthStage: 1, flowerType: 3, lastGrowthTick: new Date(now).toISOString(), streak: { currentDays: 1,  longestDays: 1  } },
  };
  // Pre-compute display fields (background.js does this on getGardens)
  for (const g of Object.values(gardens)) {
    g._displayTotalMs = g.totalBlockedMs;
    g._displayStage = g.growthStage;
  }

  const stats = {
    longestStreak: 9,
    totalBlockedTimeMs: 12 * DAY + 6 * HOUR,
  };

  const settings = {
    unblockFriction: "high",
    showAffirmations: true,
    stageNotifications: true,
    darkMode: false,
  };

  // Respect ?t=<theme> URL param so theme-showcase iframes each boot into their own theme
  const urlTheme = new URLSearchParams(window.location.search).get("t");
  const storage = { theme: ["retro", "dark", "beige", "slate"].includes(urlTheme) ? urlTheme : "retro" };

  // Read messages.json i18n at runtime — inlined set for screenshots.
  // Any missing key returns null so callers fall back to their hardcoded English.
  const i18n = {
    dayLabel:        (n) => `${n}d`,
    statusUnblocked: () => " (unblocked)",
    labelStage:      () => "Stage",
    labelFlower:     () => "Flower",
    labelStreak:     () => "Streak",
    streakDisplay:   (c, b) => `${c}d (best: ${b}d)`,
    btnUnblock:      () => "Unblock",
    btnReblock:      () => "Re-block",
    btnRemove:       () => "Remove",
    confirmUnblock:  (d) => `Unblock ${d}? Your garden will lose 50% growth.`,
    confirmRemove:   (d) => `Remove ${d} and destroy its garden?`,
    popupChangeTheme:   () => "Change Theme",
    popupEmptyTitle:    () => "No gardens yet!",
    popupEmptyHint:     () => "Block a site to start growing.",
    popupSitePlaceholder: () => "e.g. reddit.com",
    popupSiteAria:      () => "Site domain to block",
    popupBtnAdd:        () => "+ Add",
    popupStatGardens:   () => "🌱 Gardens growing",
    popupStatStreak:    () => "🔥 Longest streak",
    popupStatBlocked:   () => "⏱️ Total blocked",
    popupStatSpeed:     () => "⚡ Growth speed",
    popupSettingsTitle: () => "Settings",
    blockedLoading:     () => "Growing...",
    blockedBackBtn:     () => "← Go Back",
    blockedUnblockLink: () => "I need to visit this site...",
    blockedFrictionTitle:   () => "Are you sure?",
    blockedFrictionBody:    () => "Unblocking will wilt your garden. Your flowers will lose half their growth.",
    blockedFrictionCancel:  () => "Cancel",
    blockedFrictionConfirm: () => "I understand, unblock",
    settingsHeaderTitle:    () => "Settings",
    settingsHeaderSubtitle: () => "Focus Blossom",
    settingsLabelFriction:  () => "Unblock friction",
    settingsDescFriction:   () => "How hard it is to unblock a site",
    settingsFrictionLow:    () => "Low",
    settingsFrictionMedium: () => "Medium",
    settingsFrictionHigh:   () => "High",
    settingsLabelAffirmations:  () => "Show affirmations",
    settingsDescAffirmations:   () => "Daily self-compassion quotes",
    settingsLabelNotifications: () => "Stage notifications",
    settingsDescNotifications:  () => "Notify when your garden grows",
    settingsCardData:       () => "Data",
    settingsLabelExport:    () => "Export gardens",
    settingsDescExport:     () => "Download all data as JSON",
    settingsBtnExport:      () => "Export",
    settingsLabelImport:    () => "Import gardens",
    settingsDescImport:     () => "Restore from a backup file",
    settingsBtnImport:      () => "Import",
    settingsAboutSuite:     () => "Part of the LoveSpark Suite",
    settingsSavedToast:     () => "Saved!",
    stage0Label: () => "A seed planted 🌱",
    stage1Label: () => "Growing roots 🌿",
    stage2Label: () => "Reaching for light 🌷",
    stage3Label: () => "In full bloom 🌸",
    stage4Label: () => "A thriving garden 🌺",
  };

  window.chrome = {
    runtime: {
      sendMessage: (msg) => new Promise((resolve) => {
        queueMicrotask(() => {
          if (msg.type === "getGardens") resolve({ gardens, multiplier: 1.2 });
          else if (msg.type === "getStats") resolve({ stats });
          else if (msg.type === "getSettings") resolve({ settings });
          else resolve({});
        });
      }),
      getURL: (p) => p,
      getManifest: () => ({ version: "1.0.34" }),
    },
    storage: {
      local: {
        get: (keys, cb) => {
          const out = {};
          const keyList = Array.isArray(keys) ? keys : (typeof keys === "string" ? [keys] : Object.keys(keys || storage));
          for (const k of keyList) out[k] = storage[k];
          if (cb) cb(out); else return Promise.resolve(out);
        },
        set: (obj, cb) => {
          Object.assign(storage, obj);
          if (cb) cb(); else return Promise.resolve();
        },
      },
    },
    i18n: {
      getMessage: (key, subs) => {
        const fn = i18n[key];
        if (!fn) return "";  // empty string → caller uses hardcoded English fallback
        const args = Array.isArray(subs) ? subs : (subs != null ? [subs] : []);
        return fn(...args);
      },
    },
    tabs: { create: () => {} },
    notifications: { create: () => {} },
    alarms: { create: () => {}, onAlarm: { addListener: () => {} } },
  };
})();
