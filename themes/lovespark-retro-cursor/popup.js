// Theme dropdown
const THEMES = ['retro', 'dark', 'beige', 'slate'];
const THEME_NAMES = { retro: 'Retro Pink', dark: 'Dark', beige: 'Beige', slate: 'Slate' };
function applyTheme(t) {
  THEMES.forEach(n => document.body.classList.remove('theme-' + n));
  document.body.classList.add('theme-' + t);
  const label = document.getElementById('themeLabel');
  if (label) label.textContent = THEME_NAMES[t] || t;
  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.theme === t);
  });
}
(function initThemeDropdown() {
  const toggle = document.getElementById('themeToggle');
  const menu = document.getElementById('themeMenu');
  if (toggle && menu) {
    toggle.addEventListener('click', (e) => { e.stopPropagation(); menu.classList.toggle('open'); });
    menu.addEventListener('click', (e) => {
      const opt = e.target.closest('.theme-option');
      if (!opt) return;
      const theme = opt.dataset.theme;
      applyTheme(theme);
      chrome.storage.local.set({ theme });
      menu.classList.remove('open');
    });
    document.addEventListener('click', () => menu.classList.remove('open'));
  }
  chrome.storage.local.get(['theme', 'darkMode'], ({ theme, darkMode }) => {
    if (!theme && darkMode) theme = 'dark';
    applyTheme(theme || 'retro');
  });
})();
  if (!theme && darkMode) theme = 'dark';
  applyTheme(theme || 'retro');
});
document.getElementById('themeToggle');

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
  const result = await chrome.storage.local.get([STORAGE_KEY_ENABLED, STORAGE_KEY_PACK]);
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
