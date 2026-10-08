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

chrome.runtime.onInstalled.addListener(() => void ensureDefaults());
chrome.runtime.onStartup.addListener(() => void ensureDefaults());

// The popup writes settings directly to chrome.storage.local; content scripts
// pick them up live via chrome.storage.onChanged. No message relay is needed here.
