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

browser.runtime.onInstalled.addListener(async () => {
  const stored = await browser.storage.sync.get("schemaVersion");
  if (!stored.schemaVersion) {
    await browser.storage.sync.set(DEFAULT_STATE);
  }
});
