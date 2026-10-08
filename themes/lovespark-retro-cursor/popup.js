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
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', menu.classList.contains('open'));
    });
    menu.addEventListener('click', (e) => {
      const opt = e.target.closest('.theme-option');
      if (!opt) return;
      const theme = opt.dataset.theme;
      applyTheme(theme);
      chrome.storage.local.set({ theme });
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
    document.addEventListener('click', () => {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    });
  }
  chrome.storage.local.get(['theme'], ({ theme }) => {
    applyTheme(theme || 'retro');
  });
})();

const STORAGE_KEY_ENABLED = "lovesparkCursorEnabled";
const STORAGE_KEY_PACK = "lovesparkCursorPack";
const DEFAULT_PACK = "retro-pink";
const Y2K_NAMES = [
  "honey-bunny", "cyworld-dotti", "coquette-ribbon", "strawberry-milk",
  "glossy-pearl", "bubble-boba", "phone-charm", "heart-locket", "cyber-butterfly"
];
const Y2K_PACKS = Y2K_NAMES.flatMap((n) => [`${n}-emoji`, `${n}-pointer`]);
const ALLOWED_PACKS = new Set([
  "retro-pink", "sakura-peach", "starlight-purple",
  ...Y2K_PACKS
]);
// Stale IDs from removed New Collection — migrated to retro-pink on first load after upgrade
const STALE_PACKS = new Set([
  "moonlight-rose", "candy-floss", "cyber-cherry",
  "mint-blossom", "golden-hour", "holographic", "obsidian-heart"
]);

const toggle = document.getElementById("cursorToggle");
const statusText = document.getElementById("statusText");
const themeItems = document.querySelectorAll(".theme-item");

// Source of truth for the selected pack. Tracked in a variable (set by render)
// rather than read back from the DOM .selected class, so a fast ON/OFF toggle
// before loadState() finishes can't clobber the saved pack with DEFAULT_PACK.
let currentPack = DEFAULT_PACK;

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
  currentPack = safe;
  themeItems.forEach((item) => {
    item.classList.toggle("selected", item.dataset.pack === safe);
  });
}

async function saveAndBroadcast(enabled, pack) {
  const safe = sanitizePack(pack);
  render(enabled, safe);
  // Write straight to storage.local. Every tab's content script reacts via
  // chrome.storage.onChanged and applies the cursor live — no background hop needed.
  await chrome.storage.local.set({
    [STORAGE_KEY_ENABLED]: enabled,
    [STORAGE_KEY_PACK]: safe
  });
}

async function loadState() {
  const result = await chrome.storage.local.get([STORAGE_KEY_ENABLED, STORAGE_KEY_PACK]);
  const enabled = typeof result[STORAGE_KEY_ENABLED] === "boolean" ? result[STORAGE_KEY_ENABLED] : true;
  let pack = result[STORAGE_KEY_PACK];
  if (typeof pack === "string" && STALE_PACKS.has(pack)) {
    // Migrate stale New Collection ID to default and persist so content_script reloads correctly
    pack = DEFAULT_PACK;
    await chrome.storage.local.set({ [STORAGE_KEY_PACK]: DEFAULT_PACK });
  } else {
    pack = sanitizePack(pack);
  }
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
  return currentPack;
}

void loadState();

/* ── Author / Ko-fi Footer ── */
document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
