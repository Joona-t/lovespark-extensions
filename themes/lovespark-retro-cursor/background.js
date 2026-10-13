const STORAGE_KEY_ENABLED = "lovesparkCursorEnabled";
const STORAGE_KEY_PACK = "lovesparkCursorPack";
const DEFAULT_PACK = "retro-pink";

async function ensureDefaults() {
  const current = await chrome.storage.local.get([STORAGE_KEY_ENABLED, STORAGE_KEY_PACK]);
  const patch = {};

  if (typeof current[STORAGE_KEY_ENABLED] !== "boolean") {
    patch[STORAGE_KEY_ENABLED] = true;
  }
  if (typeof current[STORAGE_KEY_PACK] !== "string") {
    patch[STORAGE_KEY_PACK] = DEFAULT_PACK;
  }

  if (Object.keys(patch).length > 0) {
    await chrome.storage.local.set(patch);
  }
}

// Content scripts declared in the manifest only run in pages loaded AFTER the
// extension is installed/updated. Tabs that were already open stay cursor-less
// until the user reloads them — which reads as "the cursor doesn't show" right
// after install (BUG 2026-10-13). Inject into every open tab once on install/update.
// Pages the browser refuses to script (chrome://, new tab, Web Store, other
// extensions, PDF viewer, file:// without "Allow access to file URLs") reject the
// call; those are skipped silently. No `tabs` permission is needed for this.
async function injectIntoOpenTabs() {
  if (!chrome.scripting || !chrome.tabs) {
    return;
  }
  let tabs = [];
  try {
    tabs = await chrome.tabs.query({});
  } catch {
    return;
  }
  await Promise.all(tabs.map(async (tab) => {
    if (typeof tab.id !== "number") {
      return;
    }
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id, allFrames: true },
        files: ["content_script.js"]
      });
    } catch {
      // Restricted page or no host access (Firefox optional host permissions) — nothing to do.
    }
  }));
}

chrome.runtime.onInstalled.addListener(() => {
  void ensureDefaults().then(injectIntoOpenTabs);
});
chrome.runtime.onStartup.addListener(() => void ensureDefaults());

// The popup writes settings directly to chrome.storage.local; content scripts
// pick them up live via chrome.storage.onChanged. No message relay is needed here.
