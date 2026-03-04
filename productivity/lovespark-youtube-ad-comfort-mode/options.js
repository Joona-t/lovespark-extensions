const STORAGE_KEY = "loveSparkSettings";

const DEFAULT_SETTINGS = Object.freeze({
  comfortModeDefaultEnabled: true,
  autoMuteEnabled: true,
  lowVolumeEnabled: false,
  lowVolumePercent: 10,
  dimOverlayEnabled: true,
});

const elements = {};
let settings = { ...DEFAULT_SETTINGS };
let statusTimer = null;

document.addEventListener("DOMContentLoaded", () => {
  void init();
});

async function init() {
  cacheElements();
  bindEvents();

  settings = await loadSettings();
  renderSettings();
  void loadShortcutHint();
}

function cacheElements() {
  elements.comfortModeDefaultEnabled = document.getElementById(
    "comfortModeDefaultEnabled"
  );
  elements.autoMuteEnabled = document.getElementById("autoMuteEnabled");
  elements.lowVolumeEnabled = document.getElementById("lowVolumeEnabled");
  elements.lowVolumePercent = document.getElementById("lowVolumePercent");
  elements.lowVolumeValue = document.getElementById("lowVolumeValue");
  elements.dimOverlayEnabled = document.getElementById("dimOverlayEnabled");
  elements.shortcutValue = document.getElementById("shortcutValue");
  elements.status = document.getElementById("status");
}

function bindEvents() {
  elements.comfortModeDefaultEnabled.addEventListener("change", async () => {
    settings.comfortModeDefaultEnabled =
      elements.comfortModeDefaultEnabled.checked;
    await saveSettings();
  });

  elements.autoMuteEnabled.addEventListener("change", async () => {
    settings.autoMuteEnabled = elements.autoMuteEnabled.checked;
    await saveSettings();
  });

  elements.lowVolumeEnabled.addEventListener("change", async () => {
    settings.lowVolumeEnabled = elements.lowVolumeEnabled.checked;
    updateLowVolumeControlState();
    await saveSettings();
  });

  elements.lowVolumePercent.addEventListener("input", () => {
    const lowVolumePercent = clamp(
      Number.parseInt(elements.lowVolumePercent.value, 10) || 0,
      0,
      30
    );
    settings.lowVolumePercent = lowVolumePercent;
    elements.lowVolumeValue.textContent = `${lowVolumePercent}%`;
  });

  elements.lowVolumePercent.addEventListener("change", async () => {
    const lowVolumePercent = clamp(
      Number.parseInt(elements.lowVolumePercent.value, 10) || 0,
      0,
      30
    );
    settings.lowVolumePercent = lowVolumePercent;
    elements.lowVolumeValue.textContent = `${lowVolumePercent}%`;
    await saveSettings();
  });

  elements.dimOverlayEnabled.addEventListener("change", async () => {
    settings.dimOverlayEnabled = elements.dimOverlayEnabled.checked;
    await saveSettings();
  });
}

async function loadSettings() {
  try {
    const stored = await chrome.storage.sync.get(STORAGE_KEY);
    const normalized = normalizeSettings(stored?.[STORAGE_KEY]);
    if (!stored?.[STORAGE_KEY]) {
      await chrome.storage.sync.set({ [STORAGE_KEY]: normalized });
    }
    return normalized;
  } catch (_error) {
    showStatus("Using local defaults (storage unavailable).");
    return { ...DEFAULT_SETTINGS };
  }
}

function renderSettings() {
  elements.comfortModeDefaultEnabled.checked =
    settings.comfortModeDefaultEnabled;
  elements.autoMuteEnabled.checked = settings.autoMuteEnabled;
  elements.lowVolumeEnabled.checked = settings.lowVolumeEnabled;
  elements.lowVolumePercent.value = String(settings.lowVolumePercent);
  elements.lowVolumeValue.textContent = `${settings.lowVolumePercent}%`;
  elements.dimOverlayEnabled.checked = settings.dimOverlayEnabled;
  updateLowVolumeControlState();
}

function updateLowVolumeControlState() {
  elements.lowVolumePercent.disabled = !elements.lowVolumeEnabled.checked;
}

async function saveSettings() {
  try {
    await chrome.storage.sync.set({ [STORAGE_KEY]: normalizeSettings(settings) });
    showStatus("Saved.");
  } catch (_error) {
    showStatus("Save failed.");
  }
}

async function loadShortcutHint() {
  try {
    const commands = await chrome.commands.getAll();
    const toggleCommand = commands.find(
      (command) => command.name === "toggle-comfort-mode"
    );
    elements.shortcutValue.textContent =
      toggleCommand?.shortcut || "Not set";
  } catch (_error) {
    elements.shortcutValue.textContent = "Unavailable";
  }
}

function normalizeSettings(rawSettings) {
  const source =
    rawSettings && typeof rawSettings === "object" ? rawSettings : {};

  return {
    comfortModeDefaultEnabled: source.comfortModeDefaultEnabled !== false,
    autoMuteEnabled: source.autoMuteEnabled !== false,
    lowVolumeEnabled: Boolean(source.lowVolumeEnabled),
    lowVolumePercent: clamp(
      Number.isFinite(Number(source.lowVolumePercent))
        ? Number(source.lowVolumePercent)
        : DEFAULT_SETTINGS.lowVolumePercent,
      0,
      30
    ),
    dimOverlayEnabled: source.dimOverlayEnabled !== false,
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function showStatus(message) {
  elements.status.textContent = message;

  if (statusTimer) {
    window.clearTimeout(statusTimer);
  }

  statusTimer = window.setTimeout(() => {
    elements.status.textContent = "";
  }, 1400);
}
