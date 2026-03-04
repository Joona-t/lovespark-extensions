const STORAGE_KEY = "loveSparkSettings";
const COMMAND_TOGGLE = "toggle-comfort-mode";

const DEFAULT_SETTINGS = Object.freeze({
  comfortModeDefaultEnabled: true,
  autoMuteEnabled: true,
  lowVolumeEnabled: false,
  lowVolumePercent: 10,
  dimOverlayEnabled: true,
});

// Keeps current comfort-toggle state per tab while the service worker is alive.
const tabComfortState = new Map();

chrome.runtime.onInstalled.addListener(() => {
  void ensureDefaultSettings();
});

chrome.commands.onCommand.addListener((command) => {
  if (command !== COMMAND_TOGGLE) {
    return;
  }
  void toggleComfortModeForActiveTab();
});

chrome.tabs.onRemoved.addListener((tabId) => {
  tabComfortState.delete(tabId);
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || typeof message !== "object") {
    return;
  }

  if (message.type === "LS_REPORT_COMFORT_MODE" && sender.tab?.id != null) {
    tabComfortState.set(sender.tab.id, Boolean(message.enabled));
    sendResponse({ ok: true });
  }
});

async function ensureDefaultSettings() {
  try {
    const stored = await chrome.storage.local.get(STORAGE_KEY);
    if (!stored?.[STORAGE_KEY]) {
      await chrome.storage.local.set({ [STORAGE_KEY]: DEFAULT_SETTINGS });
    }
  } catch (error) {
    console.warn("LoveSpark: failed to initialize default settings.", error);
  }
}

async function toggleComfortModeForActiveTab() {
  const tab = await getActiveTab();
  if (!tab?.id || !isYoutubeUrl(tab.url)) {
    return;
  }

  const tabId = tab.id;
  const currentEnabled = tabComfortState.has(tabId)
    ? tabComfortState.get(tabId)
    : true;
  const targetEnabled = !currentEnabled;

  let result = await sendTabMessage(tabId, {
    type: "LS_SET_COMFORT_MODE",
    enabled: targetEnabled,
    source: "command",
  });

  if (!result.ok) {
    // If the content script is not awake yet, inject once and retry.
    const injected = await injectContentScript(tabId);
    if (injected) {
      result = await sendTabMessage(tabId, {
        type: "LS_SET_COMFORT_MODE",
        enabled: targetEnabled,
        source: "command",
      });
    }
  }

  const resolvedEnabled =
    result.ok && result.response && typeof result.response.enabled === "boolean"
      ? result.response.enabled
      : targetEnabled;

  tabComfortState.set(tabId, resolvedEnabled);
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({
    active: true,
    lastFocusedWindow: true,
  });
  return tabs[0];
}

async function injectContentScript(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ["content.js"],
    });
    return true;
  } catch (error) {
    console.warn("LoveSpark: unable to inject content script.", error);
    return false;
  }
}

async function sendTabMessage(tabId, message) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, message);
    return { ok: true, response };
  } catch (error) {
    return { ok: false, error };
  }
}

function isYoutubeUrl(url) {
  return typeof url === "string" && url.startsWith("https://www.youtube.com/");
}
