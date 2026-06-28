(() => {
  if (globalThis.__lovesparkCursorScriptLoaded) {
    return;
  }
  globalThis.__lovesparkCursorScriptLoaded = true;

  const STYLE_ID = "lovespark-cursors";
  const STORAGE_KEY_ENABLED = "lovesparkCursorEnabled";
  const STORAGE_KEY_PACK = "lovesparkCursorPack";
  const DEFAULT_PACK = "retro-pink";
  // Y2K Korean lineup: 9 packs × {emoji, pointer} variants = 18 SVG-based packs
  const Y2K_NAMES = [
    "honey-bunny", "cyworld-dotti", "coquette-ribbon", "strawberry-milk",
    "glossy-pearl", "bubble-boba", "phone-charm", "heart-locket", "cyber-butterfly"
  ];
  const Y2K_PACKS = Y2K_NAMES.flatMap((n) => [`${n}-emoji`, `${n}-pointer`]);
  const ALLOWED_PACKS = new Set([
    "retro-pink", "sakura-peach", "starlight-purple",
    ...Y2K_PACKS
  ]);
  // SVG-based packs (default.svg, pointer.svg, text.svg, wait.svg)
  const SVG_PACKS = new Set(Y2K_PACKS);

  function sanitizePack(pack) {
    if (typeof pack === "string" && ALLOWED_PACKS.has(pack)) {
      return pack;
    }
    return DEFAULT_PACK;
  }

  function cursorURL(pack, fileName) {
    return chrome.runtime.getURL(`cursors/${pack}/${fileName}`);
  }

  function buildCursorCSS(pack) {
    if (SVG_PACKS.has(pack)) {
      // Emoji variants center the icon (16 16); Pointer variants use traditional offsets
      const isEmoji = pack.endsWith("-emoji");
      const defH = isEmoji ? "16 16" : "3 1";
      const ptrH = isEmoji ? "16 16" : "8 4";
      const def = cursorURL(pack, "default.svg");
      const ptr = cursorURL(pack, "pointer.svg");
      const txt = cursorURL(pack, "text.svg");
      const wait = cursorURL(pack, "wait.svg");
      return `
html, body, body *, body *::before, body *::after {
  cursor: url("${def}") ${defH}, auto !important;
}
a, area, button, summary, label[for], [role="button"], [role="link"], input[type="submit"], input[type="button"], .clickable, [onclick], [tabindex]:not([tabindex="-1"]) {
  cursor: url("${ptr}") ${ptrH}, pointer !important;
}
input:not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"], [contenteditable=""], [contenteditable="plaintext-only"] {
  cursor: url("${txt}") 16 16, text !important;
}
.loading, [aria-busy="true"] {
  cursor: url("${wait}") 16 16, wait !important;
}
`;
    }

    const defaultCursor = cursorURL(pack, "cursor_default_32.png");
    const linkCursor = cursorURL(pack, "cursor_link_32.png");
    const textCursor = cursorURL(pack, "cursor_text_32.png");
    const grabCursor = cursorURL(pack, "cursor_grab_32.png");
    const grabbingCursor = cursorURL(pack, "cursor_grabbing_32.png");
    const crosshairCursor = cursorURL(pack, "cursor_crosshair_32.png");
    const notAllowedCursor = cursorURL(pack, "cursor_not_allowed_32.png");
    const waitCursor = cursorURL(pack, "cursor_wait_32.png");

    return `
html, body, body *, body *::before, body *::after {
  cursor: url("${defaultCursor}") 3 1, auto !important;
}

a, area, button, summary, label[for], [role="button"], [role="link"], input[type="submit"], input[type="button"], .clickable, [onclick], [tabindex]:not([tabindex="-1"]) {
  cursor: url("${linkCursor}") 3 1, pointer !important;
}

input:not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"], [contenteditable=""], [contenteditable="plaintext-only"] {
  cursor: url("${textCursor}") 8 8, text !important;
}

.drag, [draggable="true"] {
  cursor: url("${grabCursor}") 8 8, grab !important;
}

.drag:active, [draggable="true"]:active {
  cursor: url("${grabbingCursor}") 8 8, grabbing !important;
}

.crosshair, canvas, [data-cursor="crosshair"] {
  cursor: url("${crosshairCursor}") 8 8, crosshair !important;
}

:disabled, [aria-disabled="true"] {
  cursor: url("${notAllowedCursor}") 8 8, not-allowed !important;
}

.loading, [aria-busy="true"] {
  cursor: url("${waitCursor}") 8 8, wait !important;
}
`;
  }

  function applyCursorStyle(enabled, pack) {
    const existing = document.getElementById(STYLE_ID);

    if (!enabled) {
      if (existing) {
        existing.remove();
      }
      return;
    }

    const style = existing || document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = buildCursorCSS(sanitizePack(pack));

    if (!existing) {
      (document.head || document.documentElement).appendChild(style);
    }
  }

  async function loadAndApplyState() {
    const result = await chrome.storage.local.get([STORAGE_KEY_ENABLED, STORAGE_KEY_PACK]);
    const enabled = typeof result[STORAGE_KEY_ENABLED] === "boolean" ? result[STORAGE_KEY_ENABLED] : true;
    const pack = sanitizePack(result[STORAGE_KEY_PACK]);
    applyCursorStyle(enabled, pack);
  }

  chrome.storage.onChanged.addListener((changes, areaName) => {
    // Settings are written to chrome.storage.local everywhere (popup + background),
    // so the live-apply listener must react to the "local" area — guarding on "sync"
    // (a legacy value left over from the storage.local migration) made this dead code
    // and forced a page refresh before a newly-selected cursor took effect.
    if (areaName !== "local") {
      return;
    }

    if (!changes[STORAGE_KEY_ENABLED] && !changes[STORAGE_KEY_PACK]) {
      return;
    }

    chrome.storage.local.get([STORAGE_KEY_ENABLED, STORAGE_KEY_PACK], (next) => {
      const enabled = typeof next[STORAGE_KEY_ENABLED] === "boolean" ? next[STORAGE_KEY_ENABLED] : true;
      const pack = sanitizePack(next[STORAGE_KEY_PACK]);
      applyCursorStyle(enabled, pack);
    });
  });

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
      void loadAndApplyState();
    });
  } else {
    void loadAndApplyState();
  }
})();
