globalThis.__lovespark = globalThis.__lovespark || {};

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

globalThis.__lovespark.state = {
  DEFAULT_STATE,

  async getState() {
    const stored = await browser.storage.local.get(null);
    if (!stored || !stored.schemaVersion) return structuredClone(DEFAULT_STATE);
    return stored;
  },

  async setState(patch) {
    const current = await this.getState();
    for (const key of Object.keys(patch)) {
      if (key === "modules" && typeof patch.modules === "object") {
        if (!current.modules) current.modules = {};
        for (const [modId, modPatch] of Object.entries(patch.modules)) {
          if (!current.modules[modId]) {
            current.modules[modId] = modPatch;
            continue;
          }
          for (const [k, v] of Object.entries(modPatch)) {
            if (k === "config" && typeof v === "object") {
              current.modules[modId].config = { ...(current.modules[modId].config || {}), ...v };
            } else {
              current.modules[modId][k] = v;
            }
          }
        }
      } else {
        current[key] = patch[key];
      }
    }
    await browser.storage.local.set(current);
    return current;
  }
};
