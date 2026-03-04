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

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== "lovespark:set-settings") return;

  const enabled = Boolean(message.enabled);
  const pack = typeof message.pack === "string" ? message.pack : DEFAULT_PACK;

  chrome.storage.local
    .set({ [STORAGE_KEY_ENABLED]: enabled, [STORAGE_KEY_PACK]: pack })
    .then(() => sendResponse({ ok: true, enabled, pack }))
    .catch((error) => sendResponse({ ok: false, error: String(error) }));

  return true;
});
