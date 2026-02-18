const STORAGE_KEY_ENABLED = "lovesparkCursorEnabled";
const STORAGE_KEY_PACK = "lovesparkCursorPack";
const DEFAULT_PACK = "retro-pink";

async function ensureDefaults() {
  const current = await chrome.storage.sync.get([STORAGE_KEY_ENABLED, STORAGE_KEY_PACK]);
  const patch = {};

  if (typeof current[STORAGE_KEY_ENABLED] !== "boolean") {
    patch[STORAGE_KEY_ENABLED] = true;
  }
  if (typeof current[STORAGE_KEY_PACK] !== "string") {
    patch[STORAGE_KEY_PACK] = DEFAULT_PACK;
  }

  if (Object.keys(patch).length > 0) {
    await chrome.storage.sync.set(patch);
  }
}

async function ensureScriptAndBroadcast(enabled, pack) {
  const tabs = await chrome.tabs.query({});

  await Promise.all(
    tabs
      .map((tab) => tab.id)
      .filter((tabId) => typeof tabId === "number")
      .map(async (tabId) => {
        try {
          await chrome.scripting.executeScript({
            target: { tabId, allFrames: true },
            files: ["content_script.js"]
          });
        } catch {
          // Ignore tabs where script injection is restricted.
        }

        try {
          await chrome.tabs.sendMessage(tabId, {
            type: "lovespark:apply-settings",
            enabled,
            pack
          });
        } catch {
          // Ignore tabs without a content-script context.
        }
      })
  );
}

chrome.runtime.onInstalled.addListener(() => {
  void ensureDefaults();
});

chrome.runtime.onStartup.addListener(() => {
  void ensureDefaults();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (!message || message.type !== "lovespark:set-settings") {
    return;
  }

  const enabled = Boolean(message.enabled);
  const pack = typeof message.pack === "string" ? message.pack : DEFAULT_PACK;

  chrome.storage.sync
    .set({
      [STORAGE_KEY_ENABLED]: enabled,
      [STORAGE_KEY_PACK]: pack
    })
    .then(() => ensureScriptAndBroadcast(enabled, pack))
    .then(() => sendResponse({ ok: true, enabled, pack }))
    .catch((error) => sendResponse({ ok: false, error: String(error) }));

  return true;
});
