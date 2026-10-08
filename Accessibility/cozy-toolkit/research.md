# Research: Guide Button + Report a Bug Button

## Current Popup Layout

- **Header:** Sparky mascot + title (left), theme dropdown + settings gear (right)
- **Status section:** Cute message + master toggle
- **Presets:** 4 buttons in a row
- **Tabs:** 6 tabs (Reading, Typography, Sensory, Focus, TTS, Site)
- **Tab panels:** Scrollable content, max-height 310px
- **Footer:** LoveSparkFooter (rendered via JS at end of body) — Ko-fi + credits

## Where to Place the Buttons

**Option A: Inside the footer area** — Add Guide + Bug Report as a row above the Ko-fi button in the footer section. This keeps the popup body clean and groups "meta" actions together.

**Option B: In the Site tab** — Site tab already has site-specific controls + Reset to Defaults. Could add a "Help & Feedback" card below Reset. Logical since this tab is already the "utility" tab.

**Option C: Below the presets, above the tabs** — Very visible but adds vertical space to an already tight popup (580px max).

**Recommendation: Option B (Site tab)** — Keeps the main UI clean, groups utility actions together, no extra height on the main flow. The Site tab is the natural "meta" tab.

## Guide Page

- Opens a new tab with `guide.html`
- Must be bundled in the extension (web_accessible_resources or just a local HTML page)
- Uses LoveSpark theming (lovespark-base.css)
- Contains Sparky mascot per CLAUDE.md rules
- Explains all 6 tabs and their features
- Uses `--ls-bg-gradient` background

## Report a Bug Button

- Opens GitHub Issues page for the repo in a new tab
- Uses ladybug emoji per user request
- URL: needs to confirm GitHub repo URL (likely `https://github.com/Joona-t/cozy-accessibility` or similar — check manifest/README)
- Alternative: Could use `chrome.tabs.create({ url: '...' })` from popup.js

## Manifest Impact

- `guide.html` is a local extension page — no new permissions needed
- No web_accessible_resources needed (opened via chrome-extension:// URL)
- Version bump required per CLAUDE.md

## Technical Notes

- Both buttons use `chrome.tabs.create()` — already have `activeTab` permission
- Guide page needs: HTML, CSS (reuse lovespark-base.css), theme support
- Footer.js already renders dynamically — buttons go in popup.html directly in the Site tab
