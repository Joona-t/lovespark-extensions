// ── Storage shim ──────────────────────────────────────────────────────────
// chrome.* is absent when popup.html is opened over file:// (design review /
// screenshots). Everything below degrades to an in-memory store so the static
// UI still renders instead of throwing before the DOM is drawn.
const hasChrome = typeof chrome !== "undefined" && !!(chrome && chrome.storage && chrome.storage.local);
const memStore = {};

function storageGet(keys) {
  if (!hasChrome) {
    const out = {};
    keys.forEach((k) => { if (k in memStore) out[k] = memStore[k]; });
    return Promise.resolve(out);
  }
  return new Promise((resolve) => {
    chrome.storage.local.get(keys, (result) => resolve(result || {}));
  });
}

function storageSet(obj) {
  if (!hasChrome) {
    Object.assign(memStore, obj);
    return Promise.resolve();
  }
  return new Promise((resolve) => {
    chrome.storage.local.set(obj, () => resolve());
  });
}

// ── Theme dropdown ────────────────────────────────────────────────────────
// Bubblegum and Seoul Y2K are this popup's own token blocks in popup.css;
// the rest also exist in lib/lovespark-tokens.css.
const THEMES = ['seoul', 'gingham', 'holo', 'neon', 'retro', 'bubblegum', 'dark', 'beige', 'slate'];
// Seoul Y2K is the default (Joona, 2026-10-25); a saved choice always wins.
const DEFAULT_THEME = 'seoul';
const THEME_NAMES = {
  retro: 'Retro Pink',
  bubblegum: 'Bubblegum',
  seoul: 'Seoul Y2K',
  gingham: 'Gingham Sticker',
  holo: 'Holo Mochi',
  neon: 'Neon Usagi',
  dark: 'Dark',
  beige: 'Beige',
  slate: 'Slate',
};
function applyTheme(t) {
  THEMES.forEach(n => document.body.classList.remove('theme-' + n));
  document.body.classList.add('theme-' + t);
  // The trigger's accessible name carries the current theme (no aria-live inside
  // a button); the visible label mirrors it.
  const name = THEME_NAMES[t] || t;
  const trigger = document.getElementById('themeToggle');
  if (trigger) {
    trigger.setAttribute('aria-label', 'Change Theme (current: ' + name + ')');
    const label = trigger.querySelector('.theme-label');
    if (label) label.textContent = name;
  }
  const status = document.getElementById('themeLabel');
  if (status) status.textContent = 'Theme: ' + name;
  document.querySelectorAll('.theme-option').forEach(opt => {
    opt.classList.toggle('active', opt.dataset.theme === t);
  });
}
(function initThemeDropdown() {
  const toggle = document.getElementById('themeToggle');
  const menu = document.getElementById('themeMenu');
  if (toggle && menu) {
    const close = () => {
      menu.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
    };
    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      menu.classList.toggle('open');
      toggle.setAttribute('aria-expanded', menu.classList.contains('open'));
    });
    menu.addEventListener('click', (e) => {
      const opt = e.target.closest('.theme-option');
      if (!opt) return;
      const theme = opt.dataset.theme;
      // Crossfade between themes where the View Transitions API exists;
      // instant swap otherwise or when reduced motion is preferred.
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (document.startViewTransition && !reduce) {
        document.startViewTransition(() => applyTheme(theme));
      } else {
        applyTheme(theme);
      }
      void storageSet({ theme });
      close();
      toggle.focus();
    });
    document.addEventListener('click', close);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && menu.classList.contains('open')) {
        close();
        toggle.focus();
      }
    });
  }
  storageGet(['theme']).then(({ theme }) => {
    applyTheme(THEMES.includes(theme) ? theme : DEFAULT_THEME);
  });
})();

// ── Pack picker ───────────────────────────────────────────────────────────
const STORAGE_KEY_ENABLED = "lovesparkCursorEnabled";
const STORAGE_KEY_PACK = "lovesparkCursorPack";
const DEFAULT_PACK = "retro-pink";
const Y2K_NAMES = [
  "honey-bunny", "cyworld-dotti", "coquette-ribbon", "strawberry-milk",
  "glossy-pearl", "bubble-boba", "phone-charm", "heart-locket", "cyber-butterfly"
];
const Y2K_PACKS = Y2K_NAMES.flatMap((n) => [`${n}-emoji`, `${n}-pointer`]);
const SVG_PACKS = new Set(Y2K_PACKS);
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
const themeItems = Array.from(document.querySelectorAll(".theme-item"));
const previewPage = document.getElementById("previewPage");
const previewPackLabel = document.getElementById("previewPack");
const pvLink = document.getElementById("pvLink");
const pvButton = document.getElementById("pvButton");
const pvText = document.getElementById("pvText");

// Source of truth for the selected pack. Tracked in a variable (set by render)
// rather than read back from the DOM, so a fast ON/OFF toggle before loadState()
// finishes can't clobber the saved pack with DEFAULT_PACK.
let currentPack = DEFAULT_PACK;

function sanitizePack(pack) {
  if (typeof pack === "string" && ALLOWED_PACKS.has(pack)) {
    return pack;
  }
  return DEFAULT_PACK;
}

// Mirrors content_script.js buildCursorCSS(): same files + hotspots, so the
// popup preview feels exactly like the page will.
function previewCursors(pack) {
  if (SVG_PACKS.has(pack)) {
    const isEmoji = pack.endsWith("-emoji");
    return {
      def: `url("cursors/${pack}/default.svg") ${isEmoji ? "16 16" : "5 4"}, auto`,
      ptr: `url("cursors/${pack}/pointer.svg") ${isEmoji ? "15 12" : "11 3"}, pointer`
    };
  }
  return {
    def: `url("cursors/${pack}/cursor_default_32.png") 3 1, auto`,
    ptr: `url("cursors/${pack}/cursor_link_32.png") 3 1, pointer`
  };
}

function packDisplayName(pack) {
  const item = themeItems.find((el) => el.dataset.pack === pack);
  const name = item ? item.querySelector(".theme-name") : null;
  if (!name) return pack;
  // First text node = "🌸 Retro Pink"; strip the emoji so the label stays tidy.
  const raw = (name.childNodes[0] && name.childNodes[0].textContent || "").trim();
  return raw.replace(/^[^\p{L}\p{N}]+/u, "").trim() || pack;
}

function applyPreview(enabled, pack) {
  if (!previewPage) return;
  const c = previewCursors(pack);
  const def = enabled ? c.def : "auto";
  const ptr = enabled ? c.ptr : "pointer";
  previewPage.style.cursor = def;
  if (pvText) pvText.style.cursor = def;
  if (pvLink) pvLink.style.cursor = ptr;
  if (pvButton) pvButton.style.cursor = ptr;
  if (previewPackLabel) {
    previewPackLabel.textContent = enabled ? packDisplayName(pack) : "Cursors are OFF";
  }
}

// Visible = actually rendered. Chrome ≥97 keeps offsetParent non-null inside a
// closed <details> (content-visibility hiding), so offsetParent alone lies there.
function isVisible(el) {
  if (typeof el.checkVisibility === "function") return el.checkVisibility();
  return el.offsetParent !== null;
}

function revealItem(item) {
  // A pack inside a collapsed <details> must be visible to be the focus target.
  const details = item.closest("details");
  if (details && !details.open) details.open = true;
}

function render(enabled, pack) {
  toggle.checked = enabled;
  statusText.textContent = `Cursors: ${enabled ? "ON" : "OFF"}`;
  const safe = sanitizePack(pack);
  currentPack = safe;
  themeItems.forEach((item) => {
    const on = item.dataset.pack === safe;
    item.setAttribute("aria-checked", on ? "true" : "false");
    if (on) revealItem(item);
  });
  syncTabStops();
  applyPreview(enabled, safe);
}

// Roving tabindex: exactly one tab stop among the VISIBLE radios. The checked
// pack owns it; if its <details> is collapsed, the first visible radio does, so
// Tab never skips the picker entirely.
function syncTabStops() {
  const checked = themeItems.find((el) => el.getAttribute("aria-checked") === "true");
  let stop = checked && isVisible(checked) ? checked : null;
  if (!stop) stop = themeItems.find(isVisible) || checked || null;
  themeItems.forEach((el) => { el.tabIndex = el === stop ? 0 : -1; });
}

document.querySelectorAll(".theme-subgroup").forEach((d) => {
  d.addEventListener("toggle", syncTabStops);
});

async function saveAndBroadcast(enabled, pack) {
  const safe = sanitizePack(pack);
  render(enabled, safe);
  // Write straight to storage.local. Every tab's content script reacts via
  // chrome.storage.onChanged and applies the cursor live — no background hop needed.
  await storageSet({
    [STORAGE_KEY_ENABLED]: enabled,
    [STORAGE_KEY_PACK]: safe
  });
}

async function loadState() {
  const result = await storageGet([STORAGE_KEY_ENABLED, STORAGE_KEY_PACK]);
  const enabled = typeof result[STORAGE_KEY_ENABLED] === "boolean" ? result[STORAGE_KEY_ENABLED] : true;
  let pack = result[STORAGE_KEY_PACK];
  if (typeof pack === "string" && STALE_PACKS.has(pack)) {
    // Migrate stale New Collection ID to default and persist so content_script reloads correctly
    pack = DEFAULT_PACK;
    await storageSet({ [STORAGE_KEY_PACK]: DEFAULT_PACK });
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

// Arrow keys move selection through the visible radios (WAI-ARIA radiogroup
// pattern); Home/End jump to the ends. Enter/Space already fire click on <button>.
(function initRadioKeys() {
  const group = document.getElementById("packGroup");
  if (!group) return;
  group.addEventListener("keydown", (e) => {
    const item = e.target.closest && e.target.closest(".theme-item");
    if (!item) return;
    const visible = themeItems.filter(isVisible);
    const idx = visible.indexOf(item);
    if (idx === -1) return;
    let next = -1;
    if (e.key === "ArrowDown" || e.key === "ArrowRight") next = (idx + 1) % visible.length;
    else if (e.key === "ArrowUp" || e.key === "ArrowLeft") next = (idx - 1 + visible.length) % visible.length;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = visible.length - 1;
    if (next === -1) return;
    e.preventDefault();
    const target = visible[next];
    void saveAndBroadcast(toggle.checked, target.dataset.pack);
    target.focus();
  });
})();

// The preview link is a feel-only surface — never navigate the popup.
if (pvLink) pvLink.addEventListener("click", (e) => e.preventDefault());

function getCurrentPack() {
  return currentPack;
}

render(true, DEFAULT_PACK); // paint a sane default immediately; storage overrides below
void loadState();

// If the user (or the browser) limited site access — Chrome "On click"/"On specific
// sites", Firefox MV3 opt-in host permissions — cursors show on only some sites.
// That reads exactly like "it doesn't show", so say what to change.
(function checkSiteAccess() {
  const note = document.getElementById("coverageNote");
  if (!note || !hasChrome || !chrome.permissions || !chrome.permissions.contains) return;
  chrome.permissions.contains({ origins: ["<all_urls>"] }, (granted) => {
    if (chrome.runtime.lastError || granted) return;
    note.textContent = "Site access is limited, so cursors only show on some sites. " +
      "Set this extension to \"On all sites\" in your browser's extension settings.";
  });
})();

/* ── Author / Ko-fi Footer ── */
if (typeof LoveSparkFooter !== "undefined") {
  document.body.insertAdjacentHTML('beforeend', LoveSparkFooter.render());
}
