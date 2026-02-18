const STORAGE_KEY_ENABLED = "lovesparkCursorEnabled";
const STORAGE_KEY_PACK = "lovesparkCursorPack";
const DEFAULT_PACK = "retro-pink";
const ALLOWED_PACKS = new Set(["retro-pink", "sakura-peach", "starlight-purple"]);

const toggle = document.getElementById("cursorToggle");
const statusText = document.getElementById("statusText");
const packSelect = document.getElementById("packSelect");

function sanitizePack(pack) {
  if (typeof pack === "string" && ALLOWED_PACKS.has(pack)) {
    return pack;
  }
  return DEFAULT_PACK;
}

function render(enabled, pack) {
  toggle.checked = enabled;
  packSelect.value = sanitizePack(pack);
  statusText.textContent = `Cursors: ${enabled ? "ON" : "OFF"}`;
}

async function saveAndBroadcast() {
  const enabled = toggle.checked;
  const pack = sanitizePack(packSelect.value);

  render(enabled, pack);

  await chrome.runtime.sendMessage({
    type: "lovespark:set-settings",
    enabled,
    pack
  });
}

async function loadState() {
  const result = await chrome.storage.sync.get([STORAGE_KEY_ENABLED, STORAGE_KEY_PACK]);
  const enabled = typeof result[STORAGE_KEY_ENABLED] === "boolean" ? result[STORAGE_KEY_ENABLED] : true;
  const pack = sanitizePack(result[STORAGE_KEY_PACK]);
  render(enabled, pack);
}

toggle.addEventListener("change", () => {
  void saveAndBroadcast();
});

packSelect.addEventListener("change", () => {
  void saveAndBroadcast();
});

void loadState();
