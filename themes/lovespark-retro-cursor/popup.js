const STORAGE_KEY_ENABLED = "lovesparkCursorEnabled";
const STORAGE_KEY_PACK = "lovesparkCursorPack";
const DEFAULT_PACK = "retro-pink";
const ALLOWED_PACKS = new Set([
  "retro-pink", "sakura-peach", "starlight-purple",
  "moonlight-rose", "candy-floss", "cyber-cherry",
  "mint-blossom", "golden-hour", "holographic", "obsidian-heart"
]);

const toggle = document.getElementById("cursorToggle");
const statusText = document.getElementById("statusText");
const themeItems = document.querySelectorAll(".theme-item");

function sanitizePack(pack) {
  if (typeof pack === "string" && ALLOWED_PACKS.has(pack)) {
    return pack;
  }
  return DEFAULT_PACK;
}

function render(enabled, pack) {
  toggle.checked = enabled;
  statusText.textContent = `Cursors: ${enabled ? "ON" : "OFF"}`;
  const safe = sanitizePack(pack);
  themeItems.forEach((item) => {
    item.classList.toggle("selected", item.dataset.pack === safe);
  });
}

async function saveAndBroadcast(enabled, pack) {
  render(enabled, pack);
  await chrome.runtime.sendMessage({
    type: "lovespark:set-settings",
    enabled,
    pack: sanitizePack(pack)
  });
}

async function loadState() {
  const result = await chrome.storage.sync.get([STORAGE_KEY_ENABLED, STORAGE_KEY_PACK]);
  const enabled = typeof result[STORAGE_KEY_ENABLED] === "boolean" ? result[STORAGE_KEY_ENABLED] : true;
  const pack = sanitizePack(result[STORAGE_KEY_PACK]);
  render(enabled, pack);
}

toggle.addEventListener("change", () => {
  void saveAndBroadcast(toggle.checked, getCurrentPack());
});

themeItems.forEach((item) => {
  item.addEventListener("click", () => {
    void saveAndBroadcast(toggle.checked, item.dataset.pack);
  });
});

function getCurrentPack() {
  const selected = document.querySelector(".theme-item.selected");
  return selected ? selected.dataset.pack : DEFAULT_PACK;
}

void loadState();
