/* background.js — Context menu registration + scrub orchestration */

// ── Context menu registration ──

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'scrub-image',
    title: '\ud83c\udf38 Scrub Metadata & Download Clean',
    contexts: ['image'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info) => {
  if (info.menuItemId === 'scrub-image' && info.srcUrl) {
    await scrubAndDownload(info.srcUrl);
  }
});

// ── Message handler ──

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.target !== 'background') return;

  if (msg.type === 'incrementCounters') {
    incrementCounters().then(() => updateBadge()).then(() => sendResponse({ ok: true }));
    return true;
  }
});

// ── Scrub pipeline ──

async function scrubAndDownload(imageUrl) {
  await ensureOffscreen();

  const response = await chrome.runtime.sendMessage({
    type: 'scrub',
    target: 'offscreen',
    imageUrl,
  });

  if (!response || response.error) {
    console.error('Scrub failed:', response?.error || 'no response');
    // Show notification to user
    chrome.action.setBadgeText({ text: '!' });
    chrome.action.setBadgeBackgroundColor({ color: '#D63466' });
    return;
  }

  const { settings } = await chrome.storage.local.get('settings');
  const filename = buildFilename(imageUrl, settings);

  await chrome.downloads.download({
    url: response.cleanDataUrl,
    filename,
    saveAs: false,
  });

  await incrementCounters();
  await updateBadge();
}

// ── Offscreen document management ──

let offscreenCreated = false;

async function ensureOffscreen() {
  if (offscreenCreated) return;

  try {
    await chrome.offscreen.createDocument({
      url: 'offscreen.html',
      reasons: ['DOM_PARSER'],
      justification: 'Canvas re-encoding to strip image metadata',
    });
    offscreenCreated = true;
  } catch (e) {
    // Document might already exist (service worker woke up)
    if (!e.message.includes('already exists')) throw e;
    offscreenCreated = true;
  }
}

// ── Filename generation ──

function buildFilename(imageUrl, settings) {
  let name = 'image';
  try {
    const urlPath = new URL(imageUrl).pathname;
    const lastSegment = urlPath.split('/').pop();
    if (lastSegment && lastSegment.includes('.')) {
      name = lastSegment.replace(/\.[^.]+$/, '');
    }
  } catch { /* data URIs etc — use default */ }

  const suffix = settings?.addSuffix !== false ? '_clean' : '';
  const format = settings?.outputFormat || 'original';

  let ext = 'png';
  if (format === 'jpeg') {
    ext = 'jpg';
  } else if (format === 'png') {
    ext = 'png';
  } else {
    // "original" — try to match input format
    if (imageUrl.match(/\.jpe?g/i)) ext = 'jpg';
    else if (imageUrl.match(/\.png/i)) ext = 'png';
    else ext = 'png'; // webp/gif/other → png
  }

  return `${name}${suffix}.${ext}`;
}

// ── Counter management ──

async function incrementCounters() {
  const data = await chrome.storage.local.get(['scrubsToday', 'scrubsTotal', 'lastResetDate']);
  const today = new Date().toISOString().slice(0, 10);

  let todayCount = data.scrubsToday || 0;
  if (data.lastResetDate !== today) {
    todayCount = 0;
  }

  await chrome.storage.local.set({
    scrubsToday: todayCount + 1,
    scrubsTotal: (data.scrubsTotal || 0) + 1,
    lastResetDate: today,
  });
}

// ── Badge ──

async function updateBadge() {
  const data = await chrome.storage.local.get(['scrubsToday', 'lastResetDate']);
  const today = new Date().toISOString().slice(0, 10);
  const count = (data.lastResetDate === today) ? (data.scrubsToday || 0) : 0;

  if (count > 0) {
    chrome.action.setBadgeText({ text: String(count) });
    chrome.action.setBadgeBackgroundColor({ color: '#FF69B4' });
  } else {
    chrome.action.setBadgeText({ text: '' });
  }
}

// Restore badge on service worker wake
updateBadge();
