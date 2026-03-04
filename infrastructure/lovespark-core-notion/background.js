const DEFAULT_STATE = {
  schemaVersion: 1,
  globalEnabled: true,
  siteExclusions: [],
  modules: {
    "cursor-pack": {
      enabled: true,
      matches: ["*"],
      config: {
        activeTheme: "retro-pink"
      }
    }
  }
};

chrome.runtime.onInstalled.addListener(async () => {
  const stored = await chrome.storage.local.get("schemaVersion");
  if (!stored.schemaVersion) {
    await chrome.storage.local.set(DEFAULT_STATE);
  }
});
