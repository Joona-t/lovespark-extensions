/**
 * Background service worker — context menu + message routing.
 *
 * Registers "Convert to Syntax Art" context menu on images.
 * Routes conversion to offscreen document. Opens result tab.
 */

// ── Default Settings ────────────────────────────────────────────────

const DEFAULTS = {
  theme: 'dracula',
  artWidth: 120,
  fontSize: 8,
  convertedToday: 0,
  convertedTotal: 0,
  lastResetDate: '',
};


// ── Context Menu ────────────────────────────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'convert-syntax-art',
    title: 'Convert to Syntax Art \u{1F338}',
    contexts: ['image'],
  });
});


// ── Offscreen Document Management ───────────────────────────────────

let offscreenCreating = null;

async function ensureOffscreen() {
  const existing = await chrome.offscreen.hasDocument();
  if (existing) return;

  if (offscreenCreating) {
    await offscreenCreating;
    return;
  }

  offscreenCreating = chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['DOM_PARSER'],
    justification: 'Canvas API for image pixel decode and color space conversion',
  });

  await offscreenCreating;
  offscreenCreating = null;
}


// ── Daily Reset ─────────────────────────────────────────────────────

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

async function getSettings() {
  const data = await chrome.storage.local.get(DEFAULTS);
  const today = todayISO();

  if (data.lastResetDate !== today) {
    data.convertedToday = 0;
    data.lastResetDate = today;
    await chrome.storage.local.set({
      convertedToday: 0,
      lastResetDate: today,
    });
  }

  return data;
}


// ── Badge ───────────────────────────────────────────────────────────

async function updateBadge() {
  const data = await getSettings();
  const count = data.convertedToday;
  chrome.action.setBadgeText({ text: count > 0 ? String(count) : '' });
  chrome.action.setBadgeBackgroundColor({ color: '#E8457C' });
}


// ── Context Menu Click ──────────────────────────────────────────────

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'convert-syntax-art') return;
  if (!info.srcUrl) return;

  const settings = await getSettings();

  // Set badge to show processing
  chrome.action.setBadgeText({ text: '...' });
  chrome.action.setBadgeBackgroundColor({ color: '#7C3AED' });

  await ensureOffscreen();

  chrome.runtime.sendMessage({
    target: 'offscreen',
    action: 'convert',
    imageUrl: info.srcUrl,
    theme: settings.theme,
    width: settings.artWidth,
    fontSize: settings.fontSize,
  });
});


// ── Message Handling (from offscreen) ───────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.target !== 'background') return;

  if (msg.action === 'result') {
    handleResult(msg.html);
  } else if (msg.action === 'error') {
    handleError(msg.error);
  }
});

async function handleResult(html) {
  // Store HTML for result page to read
  await chrome.storage.local.set({ resultHtml: html });

  // Open result page in new tab
  chrome.tabs.create({ url: chrome.runtime.getURL('result.html') });

  // Update counters
  const data = await getSettings();
  const newToday = (data.convertedToday || 0) + 1;
  const newTotal = (data.convertedTotal || 0) + 1;
  await chrome.storage.local.set({
    convertedToday: newToday,
    convertedTotal: newTotal,
  });

  updateBadge();
}

async function handleError(errorMessage) {
  // Store error for result page
  await chrome.storage.local.set({
    resultHtml: null,
    resultError: errorMessage,
  });

  chrome.tabs.create({ url: chrome.runtime.getURL('result.html') });
  updateBadge();
}


// ── Service Worker Wake-up ──────────────────────────────────────────

updateBadge();
