globalThis.__lovespark = globalThis.__lovespark || {};
globalThis.__lovespark.modules = globalThis.__lovespark.modules || {};

const VALID_THEMES = [
  "retro-pink", "sakura-peach", "starlight-purple",
  "moonlight-rose", "candy-floss", "cyber-cherry",
  "mint-blossom", "golden-hour", "holographic", "obsidian-heart"
];

function buildCursorCSS(theme) {
  return `
html, body, body *, body *::before, body *::after {
  cursor: url("${theme.default}") 3 1, auto !important;
}
a, area, button, summary, label[for], [role="button"], [role="link"],
input[type="submit"], input[type="button"], .clickable, [onclick],
[tabindex]:not([tabindex="-1"]) {
  cursor: url("${theme.pointer}") 3 1, pointer !important;
}
input:not([type="submit"]):not([type="button"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"]),
textarea, [contenteditable="true"], [contenteditable=""],
[contenteditable="plaintext-only"] {
  cursor: url("${theme.text}") 8 8, text !important;
}
.loading, [aria-busy="true"] {
  cursor: url("${theme.wait}") 16 16, wait !important;
}`;
}

globalThis.__lovespark.modules["cursor-pack"] = {
  getRules(config) {
    const themeName = VALID_THEMES.includes(config?.activeTheme)
      ? config.activeTheme
      : "retro-pink";
    const theme = globalThis.__lovespark.cursorThemes?.[themeName];
    if (!theme) return [];

    return [{
      id: `cursor-pack-${themeName}`,
      moduleId: "cursor-pack",
      matches: ["*"],
      priority: 0,
      actions: [{ type: "ApplyCSS", css: buildCursorCSS(theme) }]
    }];
  }
};
