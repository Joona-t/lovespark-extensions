// ═══════════════════════════════════════════════════════════════════
// Porn Blocker Rewire Brain — Background Service Worker
// LoveSpark Suite · github.com/joona-t
// ═══════════════════════════════════════════════════════════════════

// ── Default Settings ──────────────────────────────────────────────
const DEFAULTS = {
  enabled: true,
  blockedCount: 0,
  streakDays: 0,
  streakStartDate: null,     // ISO date string of current streak start
  lastActiveDate: null,       // ISO date string of last day shield was active
  installDate: null,
  bypassLog: [],              // { url, timestamp, reason }
  reportedSites: [],          // { url, timestamp }
  userDomains: [],            // user-added domains
  userSubreddits: [],         // user-added subreddit names
  redirectUrl: '',            // custom redirect URL (empty = use blocked.html)
  pauseMinutes: 0,            // 0 = not paused
  pauseUntil: null,           // ISO timestamp when pause expires
  bypassCooldownSec: 30,     // seconds user must wait before bypass
  blockLog: [],               // last 100 blocks: { url, timestamp }
};

// Dynamic rules start at ID 10000 to avoid collision with static rules
const DYNAMIC_RULE_ID_START = 10000;

// ── Initialization ────────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(async (details) => {
  const data = await chrome.storage.local.get(null);
  const now = new Date().toISOString();

  const merged = {};
  for (const [key, defaultVal] of Object.entries(DEFAULTS)) {
    merged[key] = data[key] !== undefined ? data[key] : defaultVal;
  }

  if (!merged.installDate) merged.installDate = now;
  if (!merged.streakStartDate) merged.streakStartDate = toDateStr(now);
  if (!merged.lastActiveDate) merged.lastActiveDate = toDateStr(now);

  await chrome.storage.local.set(merged);
  await syncDynamicRules();
  await updateStreak();
});

// ── Alarm for streak & pause management ───────────────────────────
// Guard: only create alarm if it doesn't already exist (MV3 SW restarts)
chrome.alarms.get('dailyStreak', (existing) => {
  if (!existing) chrome.alarms.create('dailyStreak', { periodInMinutes: 60 });
});
chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'dailyStreak') {
    await updateStreak();
  }
  if (alarm.name === 'pauseExpired') {
    await chrome.storage.local.set({ enabled: true, pauseMinutes: 0, pauseUntil: null });
    await syncDynamicRules();
  }
});

// ── Message Handler ───────────────────────────────────────────────
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  handleMessage(message, sender).then(sendResponse).catch(err => {
    console.error('Message handler error:', err);
    sendResponse({ error: err.message });
  });
  return true; // async response
});

async function handleMessage(message, sender) {
  switch (message.type) {

    case 'GET_SETTINGS': {
      const data = await chrome.storage.local.get(null);
      return data;
    }

    case 'SITE_BLOCKED': {
      const data = await chrome.storage.local.get(['blockedCount', 'blockLog', 'lastActiveDate', 'streakStartDate']);
      const count = (data.blockedCount || 0) + 1;
      const log = data.blockLog || [];
      log.push({ url: message.url || 'unknown', timestamp: Date.now() });
      if (log.length > 100) log.shift();

      const today = toDateStr(new Date().toISOString());
      const updates = { blockedCount: count, blockLog: log, lastActiveDate: today };

      // If streak was broken (lastActiveDate is >1 day ago), restart it
      if (data.lastActiveDate && daysBetween(data.lastActiveDate, today) > 1) {
        updates.streakStartDate = today;
      }

      await chrome.storage.local.set(updates);
      await updateStreak();
      return { blockedCount: count };
    }

    case 'LOG_BYPASS': {
      const data = await chrome.storage.local.get(['bypassLog']);
      const log = data.bypassLog || [];
      log.push({
        url: message.url || 'unknown',
        timestamp: Date.now(),
        reason: message.reason || ''
      });
      if (log.length > 200) log.shift();
      await chrome.storage.local.set({ bypassLog: log });
      return { logged: true };
    }

    case 'REPORT_SITE': {
      const data = await chrome.storage.local.get(['reportedSites']);
      const reports = data.reportedSites || [];
      reports.push({ url: message.url, timestamp: Date.now() });
      if (reports.length > 500) reports.shift();
      await chrome.storage.local.set({ reportedSites: reports });
      return { reported: true };
    }

    case 'ADD_DOMAIN': {
      const data = await chrome.storage.local.get(['userDomains']);
      const domains = data.userDomains || [];
      const domain = normalizeDomain(message.domain);
      if (domain && !domains.includes(domain)) {
        domains.push(domain);
        await chrome.storage.local.set({ userDomains: domains });
        await syncDynamicRules();
      }
      return { userDomains: domains };
    }

    case 'REMOVE_DOMAIN': {
      const data = await chrome.storage.local.get(['userDomains']);
      let domains = data.userDomains || [];
      domains = domains.filter(d => d !== message.domain);
      await chrome.storage.local.set({ userDomains: domains });
      await syncDynamicRules();
      return { userDomains: domains };
    }

    case 'ADD_SUBREDDIT': {
      const data = await chrome.storage.local.get(['userSubreddits']);
      const subs = data.userSubreddits || [];
      const sub = normalizeSub(message.subreddit);
      if (sub && !subs.includes(sub)) {
        subs.push(sub);
        await chrome.storage.local.set({ userSubreddits: subs });
        await syncDynamicRules();
      }
      return { userSubreddits: subs };
    }

    case 'REMOVE_SUBREDDIT': {
      const data = await chrome.storage.local.get(['userSubreddits']);
      let subs = data.userSubreddits || [];
      subs = subs.filter(s => s !== message.subreddit);
      await chrome.storage.local.set({ userSubreddits: subs });
      await syncDynamicRules();
      return { userSubreddits: subs };
    }

    case 'SET_ENABLED': {
      await chrome.storage.local.set({ enabled: message.enabled });
      if (message.enabled) {
        await chrome.storage.local.set({ pauseMinutes: 0, pauseUntil: null });
        chrome.alarms.clear('pauseExpired');
      }
      await syncDynamicRules();
      return { enabled: message.enabled };
    }

    case 'PAUSE_SHIELD': {
      const minutes = Math.min(Math.max(message.minutes || 5, 1), 60);
      const until = new Date(Date.now() + minutes * 60000).toISOString();
      await chrome.storage.local.set({
        enabled: false,
        pauseMinutes: minutes,
        pauseUntil: until
      });
      chrome.alarms.create('pauseExpired', { delayInMinutes: minutes });
      await syncDynamicRules();
      return { paused: true, pauseUntil: until };
    }

    case 'SET_REDIRECT': {
      const url = (message.url || '').trim();
      await chrome.storage.local.set({ redirectUrl: url });
      return { redirectUrl: url };
    }

    case 'SET_BYPASS_COOLDOWN': {
      const sec = Math.min(Math.max(message.seconds || 30, 5), 300);
      await chrome.storage.local.set({ bypassCooldownSec: sec });
      return { bypassCooldownSec: sec };
    }

    case 'RESET_STATS': {
      const today = toDateStr(new Date().toISOString());
      await chrome.storage.local.set({
        blockedCount: 0,
        streakDays: 0,
        streakStartDate: today,
        lastActiveDate: today,
        bypassLog: [],
        blockLog: []
      });
      return { reset: true };
    }

    case 'CHECK_BLOCKED': {
      // Content script asks if a URL should be blocked
      const data = await chrome.storage.local.get(['enabled', 'userDomains', 'userSubreddits']);
      if (!data.enabled) return { blocked: false };
      return { blocked: isUrlBlocked(message.url, data.userDomains || [], data.userSubreddits || []) };
    }

    default:
      return { error: 'Unknown message type' };
  }
}

// ── Streak Logic ──────────────────────────────────────────────────
async function updateStreak() {
  const data = await chrome.storage.local.get(['streakStartDate', 'lastActiveDate', 'enabled']);
  const today = toDateStr(new Date().toISOString());

  if (!data.streakStartDate) {
    await chrome.storage.local.set({ streakStartDate: today, lastActiveDate: today, streakDays: 0 });
    return;
  }

  // If shield is enabled, update last active date
  if (data.enabled) {
    const gap = data.lastActiveDate ? daysBetween(data.lastActiveDate, today) : 0;

    if (gap > 1) {
      // Streak broken — reset start to today
      await chrome.storage.local.set({
        streakStartDate: today,
        lastActiveDate: today,
        streakDays: 0
      });
    } else {
      // Streak continues
      const streakDays = daysBetween(data.streakStartDate, today);
      await chrome.storage.local.set({
        lastActiveDate: today,
        streakDays: streakDays
      });
    }
  }
}

// ── Dynamic Rule Sync ─────────────────────────────────────────────
async function syncDynamicRules() {
  const data = await chrome.storage.local.get(['enabled', 'userDomains', 'userSubreddits']);

  // Remove all existing dynamic rules first
  const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
  const removeIds = existingRules.map(r => r.id);

  if (!data.enabled) {
    // When disabled, also disable static rules by adding allow-all
    // Actually we can't disable static rules, but dynamic rules take priority
    // So we add a high-priority allow rule
    const allowRule = {
      id: DYNAMIC_RULE_ID_START,
      priority: 100,
      action: { type: 'allow' },
      condition: {
        urlFilter: '*',
        resourceTypes: ['main_frame']
      }
    };
    await chrome.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: removeIds,
      addRules: [allowRule]
    });
    return;
  }

  // Build dynamic rules for user-added domains and subreddits
  const newRules = [];
  let ruleId = DYNAMIC_RULE_ID_START;

  const userDomains = data.userDomains || [];
  for (const domain of userDomains) {
    newRules.push({
      id: ruleId++,
      priority: 1,
      action: { type: 'redirect', redirect: { extensionPath: '/blocked.html' } },
      condition: {
        urlFilter: `||${domain}`,
        resourceTypes: ['main_frame']
      }
    });
  }

  const userSubs = data.userSubreddits || [];
  for (const sub of userSubs) {
    newRules.push({
      id: ruleId++,
      priority: 1,
      action: { type: 'redirect', redirect: { extensionPath: '/blocked.html' } },
      condition: {
        urlFilter: `||reddit.com/r/${sub}`,
        resourceTypes: ['main_frame']
      }
    });
  }

  await chrome.declarativeNetRequest.updateDynamicRules({
    removeRuleIds: removeIds,
    addRules: newRules
  });
}

// ── URL Checking (for content script fallback) ────────────────────
// Built-in domain list (mirrors the static rules.json)
const BUILTIN_DOMAINS = [
  'pornhub.com','xvideos.com','xnxx.com','redtube.com','youporn.com',
  'spankbang.com','eporner.com','xhamster.com','brazzers.com','bangbros.com',
  'onlyfans.com','stripchat.com','chaturbate.com','livejasmin.com',
  'naughtyamerica.com','digitalplayground.com','kink.com','tube8.com',
  'beeg.com','tnaflix.com','tushy.com','blacked.com','blackedraw.com',
  'vixen.com','deeper.com','slayed.com','vixenmedia.com','mofos.com',
  'realitykings.com','nhentai.net','e-hentai.org','rule34.xxx',
  'gelbooru.com','danbooru.donmai.us','fapello.com','thothub.to',
  'slutload.com','xtube.com','sexvid.xxx','hentaihaven.xxx','mrkhanime.com',
  'cam4.com','camsoda.com','bongacams.com','myfreecams.com','flirt4free.com',
  'imlive.com','porntrex.com','4tube.com','txxx.com','hqporner.com',
  'daftsex.com','playvids.com','thumbzilla.com','fuq.com','youjizz.com',
  'drtuber.com','pornpics.com','lobstertube.com','motherless.com',
  'porndude.com','pornmd.com','fux.com','pornone.com','porn.com',
  'cliphunter.com','porndig.com','pornhat.com','porntube.com',
  'ashemaletube.com','trannytube.tv','alohatube.com','voyeurhit.com',
  'empflix.com','porngo.com','anyporn.com','3movs.com','zbporn.com',
  'nuvid.com','tubegalore.com','freeones.com','fapvid.com','sxyprn.com',
  'watchmygf.me','homemoviestube.com','pornzog.com','xbabe.com',
  'pornrox.com','fapster.xxx','coomer.su','kemono.su','simpcity.su',
  'leakedbb.com','nudevista.com','tiktits.com','influencersgonewild.com',
  'bitchesgirls.com','nudostar.com','leaked.wiki','recurbate.com',
  'lewdstars.com','hanime.tv','hentaistream.com','rule34video.com',
  'sankakucomplex.com','hitomi.la','tsumino.com','simply-hentai.com',
  'hentai2read.com','pururin.to','fakku.net','8muses.com','multporn.net',
  'hentaifox.com','imhentai.xxx','fansly.com','manyvids.com',
  'clips4sale.com','iwara.tv','literotica.com','imagefap.com',
  'heavy-r.com','efukt.com','xfantazy.com','xxxbunker.com'
];

const BUILTIN_REDDIT_SUBS = [
  'gooned','gonewild','nsfw','porninfifteenseconds','cumsluts',
  'realgirls','holdthemoan','girlsfinishingthejob','hotwife',
  'cuckold','sissies','breedingmaterial','onlyfanslovers',
  'collegesluts','slutsofsnapchat','nsfwhardcore','nsfw_gif',
  'ass','boobs','rule34','hentai','milf','anal','lesbians',
  'amateur','adorableporn','nsfwfunny','pornstars','tiktoknsfw',
  'onoff','pawg'
];

function isUrlBlocked(url, userDomains = [], userSubs = []) {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname.replace(/^www\./, '').toLowerCase();
    const path = parsed.pathname.toLowerCase();

    // Check all domains
    const allDomains = [...BUILTIN_DOMAINS, ...userDomains];
    for (const domain of allDomains) {
      if (hostname === domain || hostname.endsWith('.' + domain)) return true;
    }

    // Check Reddit subreddits
    if (hostname.includes('reddit.com') || hostname.includes('redd.it')) {
      const subMatch = path.match(/^\/r\/([^/]+)/);
      if (subMatch) {
        const sub = subMatch[1].toLowerCase();
        const allSubs = [...BUILTIN_REDDIT_SUBS, ...userSubs];
        if (allSubs.includes(sub)) return true;
      }
    }

    return false;
  } catch {
    return false;
  }
}

// ── Utilities ─────────────────────────────────────────────────────
function toDateStr(iso) {
  return new Date(iso).toISOString().split('T')[0]; // YYYY-MM-DD
}

function daysBetween(dateA, dateB) {
  const a = new Date(dateA + 'T00:00:00Z');
  const b = new Date(dateB + 'T00:00:00Z');
  return Math.floor((b - a) / 86400000);
}

function normalizeDomain(input) {
  if (!input) return null;
  let d = input.trim().toLowerCase();
  d = d.replace(/^https?:\/\//, '');
  d = d.replace(/^www\./, '');
  d = d.replace(/\/.*$/, '');
  d = d.replace(/[^a-z0-9.\-]/g, '');
  if (!d || !d.includes('.')) return null;
  return d;
}

function normalizeSub(input) {
  if (!input) return null;
  let s = input.trim().toLowerCase();
  s = s.replace(/^\/r\//, '');
  s = s.replace(/^r\//, '');
  s = s.replace(/\/.*$/, '');
  s = s.replace(/[^a-z0-9_]/g, '');
  if (!s) return null;
  return s;
}

// ── DNR Feedback: count blocks from the network layer ─────────────
chrome.declarativeNetRequest.onRuleMatchedDebug?.addListener?.((info) => {
  // Only available in dev mode, useful for debugging
  console.log('[Rewire Brain] Rule matched:', info);
});
