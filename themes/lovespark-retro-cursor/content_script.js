(() => {
  if (globalThis.__lovesparkCursorScriptLoaded) {
    return;
  }
  globalThis.__lovesparkCursorScriptLoaded = true;

  const STYLE_ID = "lovespark-cursors";
  const STORAGE_KEY_ENABLED = "lovesparkCursorEnabled";
  const STORAGE_KEY_PACK = "lovesparkCursorPack";
  const DEFAULT_PACK = "honey-bunny-pointer";
  // Y2K Korean lineup: 9 packs × {emoji, pointer} variants = 18 packs
  const Y2K_NAMES = [
    "honey-bunny", "cyworld-dotti", "coquette-ribbon", "strawberry-milk",
    "glossy-pearl", "bubble-boba", "phone-charm", "heart-locket", "cyber-butterfly"
  ];
  const Y2K_PACKS = Y2K_NAMES.flatMap((n) => [`${n}-emoji`, `${n}-pointer`]);
  const ALLOWED_PACKS = new Set(Y2K_PACKS);

  function sanitizePack(pack) {
    if (typeof pack === "string" && ALLOWED_PACKS.has(pack)) {
      return pack;
    }
    return DEFAULT_PACK;
  }

  function cursorURL(pack, fileName) {
    return chrome.runtime.getURL(`cursors/${pack}/${fileName}`);
  }

  // Animated cursors ship as short PNG loops (gen_frames.mjs) instead of SMIL SVGs:
  // Chrome keeps an animated SVG cursor's timeline ticking and re-checks every element
  // that uses it, ~30% of a core per visible tab even with the mouse still. Here the
  // page-wide rules show frame 0, and while the mouse moves, tick() puts the next
  // frame number on the hovered element only, so each step restyles one element.
  const FRAME_COUNTS = globalThis.LOVESPARK_CURSOR_FRAMES || {};
  const FRAME_MS = 150; // matches gen_frames.mjs STEP
  const IDLE_MS = 400;
  const FRAME_ATTR = "data-lsc-f";
  const POINTER_SEL = 'a, area, button, summary, label[for], [role="button"], [role="link"], input[type="submit"], input[type="button"], .clickable, [onclick], [tabindex]:not([tabindex="-1"])';
  const TEXT_SEL = 'input:not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]), textarea, [contenteditable="true"], [contenteditable=""], [contenteditable="plaintext-only"]';
  const WAIT_SEL = '.loading, [aria-busy="true"]';
  // Never mark text fields, editors or busy elements: their cursors don't animate,
  // and an editor may record attribute changes inside it.
  const SKIP_SEL = `${TEXT_SEL}, ${WAIT_SEL}, [contenteditable] *`;

  function frameCount(pack, kind) {
    return (FRAME_COUNTS[pack] && FRAME_COUNTS[pack][kind]) || 1;
  }

  // Plain 1x url() first for browsers without image-set() in cursor; image-set
  // adds the 2x frame for sharp cursors on high-DPI screens. Hotspots stay in CSS px.
  function frameCursor(pack, kind, i, hotspot, fallback) {
    const one = cursorURL(pack, `frames/${kind}-${i}.png`);
    const two = cursorURL(pack, `frames/${kind}-${i}@2x.png`);
    return `cursor: url("${one}") ${hotspot}, ${fallback} !important;
  cursor: image-set(url("${one}") 1x, url("${two}") 2x) ${hotspot}, ${fallback} !important;`;
  }

  function buildCursorCSS(pack) {
    // Emoji variants center the icon (16 16); Pointer variants use traditional offsets
    const isEmoji = pack.endsWith("-emoji");
    const defH = isEmoji ? "16 16" : "5 4";
    const ptrH = isEmoji ? "15 12" : "11 3"; // emoji packs put the mini-hand fingertip at (15.5,12)
    const txt = cursorURL(pack, "text.svg");
    let frames = "";
    // Same specificity as [tabindex]:not(...), and later, so a marked element wins.
    for (const [kind, letter, hotspot, fallback] of [["default", "d", defH, "auto"], ["pointer", "p", ptrH, "pointer"]]) {
      for (let i = 0; i < frameCount(pack, kind); i++) {
        const sel = `[${FRAME_ATTR}="${letter}${i}"][${FRAME_ATTR}]`;
        frames += `${sel}, ${sel}::before, ${sel}::after {
  ${frameCursor(pack, kind, i, hotspot, fallback)}
}
`;
      }
    }
    return `
html, body, body *, body *::before, body *::after {
  ${frameCursor(pack, "default", 0, defH, "auto")}
}
${POINTER_SEL} {
  ${frameCursor(pack, "pointer", 0, ptrH, "pointer")}
}
${TEXT_SEL} {
  cursor: url("${txt}") 16 16, text !important;
}
${WAIT_SEL} {
  ${frameCursor(pack, "wait", 0, "16 16", "wait")}
}
${frames}`;
  }

  let live = { enabled: false, pack: DEFAULT_PACK };
  let hovered = null;
  let marked = null;
  let tickCount = 0;
  let timer = null;
  let lastMove = 0;

  function unmark() {
    if (marked) {
      marked.removeAttribute(FRAME_ATTR);
      marked = null;
    }
  }

  function stopAnimation() {
    clearInterval(timer);
    timer = null;
  }

  function tick() {
    if (!live.enabled || performance.now() - lastMove > IDLE_MS) {
      // The hovered element keeps its last frame until the pointer moves on.
      stopAnimation();
      return;
    }
    if (marked !== hovered) {
      unmark();
    }
    if (!hovered || !hovered.isConnected || hovered.matches(SKIP_SEL)) {
      return;
    }
    tickCount += 1;
    const kind = hovered.matches(POINTER_SEL) ? "pointer" : "default";
    const n = frameCount(live.pack, kind);
    if (n > 1) {
      hovered.setAttribute(FRAME_ATTR, (kind === "pointer" ? "p" : "d") + (tickCount % n));
      marked = hovered;
    }
  }

  addEventListener("mousemove", (e) => {
    if (!live.enabled) {
      return;
    }
    lastMove = performance.now();
    hovered = e.target instanceof Element ? e.target : null;
    if (timer === null) {
      timer = setInterval(tick, FRAME_MS);
    }
  }, { capture: true, passive: true });

  function applyCursorStyle(enabled, pack) {
    const existing = document.getElementById(STYLE_ID);
    live = { enabled, pack: sanitizePack(pack) };
    stopAnimation();
    unmark();

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
    // and forced a page refresh before a newly-selected cursor took effect (KI-039).
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

  // documentElement exists at document_start, so the cursor applies before the
  // page paints instead of after DOMContentLoaded.
  void loadAndApplyState();
})();
