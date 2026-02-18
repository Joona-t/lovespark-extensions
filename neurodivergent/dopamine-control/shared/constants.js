// Shared constants — loaded as content script globals and via importScripts in background

const STORAGE_DEFAULTS = {
  // Time limits (seconds)
  weekdayLimit: 7200,       // 2 hours
  weekendLimit: 10800,      // 3 hours

  // Today's tracking
  todayWatchTime: 0,
  todayWhitelistTime: 0,
  todayShortsTime: 0,
  lastResetDate: null,

  // Warning flags (reset daily)
  warned80: false,
  warned95: false,
  overrideUsedToday: false,
  overrideExpiresAt: null,

  // Streak
  currentStreak: 0,
  bestStreak: 0,
  streakStartDate: null,

  // Gamification
  userLevel: 1,
  userXP: 0,
  achievements: [],

  // History (rolling 90 days)
  dailyHistory: [],

  // Whitelist
  whitelistedChannels: [],

  // Settings
  breakRemindersEnabled: false,
  breakIntervalMinutes: 30,
  floatingTimerVisible: true,
  floatingTimerPosition: { x: null, y: null },
  includeYouTubeMusic: true,
  showShortsBreakdown: true,

  // Meta
  installDate: null,
  totalTimeSaved: 0,
  totalOverrides: 0,
  baselineHoursPerDay: 4
};

const MOTIVATIONAL_QUOTES = [
  "Your future self will thank you for stopping now.",
  "The best content will still be there tomorrow.",
  "Boredom is where creativity begins.",
  "You've already done great today. Rest now.",
  "Your attention is your most valuable currency.",
  "Real life has better resolution than 1080p.",
  "The scroll can wait. Your dreams can't.",
  "2 hours of focus > 8 hours of half-watching."
];
