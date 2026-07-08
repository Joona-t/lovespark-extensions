# BUGS_AND_ITERATIONS.md — LoveSpark Task Anchor

## 2026-07-08: P0-4-commit-4 — fix host-permission mismatch in CWS/AMO docs, commit bundle, bump to 1.0.14, build store zips

**Problem:** `fleet-to-store` had generated `CWS-LISTING.md`, `PRIVACY.md`, `SUBMIT.md`, and `cws-shots/` on disk but never committed them. Worse: both docs flatly stated "no host permissions" / "does not read, modify, or monitor the content of the pages you visit" / "cannot read, see, or modify the content of any web page" — but `manifest.json` declares a `content_scripts` block matching `<all_urls>` (`content.js` + `content.css`) that injects an on-page banner reminder into every page. The generator apparently only inspected the top-level `permissions` array and missed the implicit host access granted by static `content_scripts.matches` in MV3.
**Root cause:** fleet-to-store's permission-justification generator didn't account for `content_scripts` as a host-permission source; the on-page banner feature (an intentional, real feature — see `background.js` `bannerPosition`/`autoHide` settings) was undocumented entirely.
**Fix:** Read `content.js`/`content.css` end to end to confirm actual behavior: the content script reads only `location.protocol` (to skip internal browser pages) and injects a single self-contained banner element built from the extension's own local-storage task text — it does not read page content, forms, or DOM data, and makes no network calls. Rewrote the "Host permissions" section of `PRIVACY.md` and the "Host-permissions justification" + reviewer test steps of `CWS-LISTING.md` to accurately disclose the `<all_urls>` content script and its narrow, one-way, display-only access. Added the on-page banner as a documented Feature in `CWS-LISTING.md`'s description (previously omitted). Bumped `manifest.json` to 1.0.14 and synced the stale "Applies to version 1.0.12" / date references in `PRIVACY.md`.
**Verification:** grepped `content.js` for `fetch`/`XMLHttpRequest`/`innerHTML`/`document.title`/other page-read patterns — none found beyond the single `location.protocol` check.
**Files:** CWS-LISTING.md, PRIVACY.md, SUBMIT.md, cws-shots/ (12 files), manifest.json (1.0.13 → 1.0.14)

## v1.0.0 — Initial Build (2026-03-19)

### Decisions
- Banner uses `position: fixed` with `z-index: 2147483647` to stay above all page content
- Content script uses `chrome.storage.onChanged` for real-time updates across all tabs
- Auto-save on task input with 800ms debounce + Enter key for immediate save
- Dismissed state resets when task changes or extension is re-enabled
- Stats track "nudges shown" (each page load where banner appears counts as 1 nudge)

### Known Considerations
- Banner may conflict with sites that also use max z-index (rare)
- `<all_urls>` permission required for content script injection on all pages

## v1.0.4 — Touch Target Fix (2026-03-25)

### Bug Fix
- **Problem:** Close button on injected banner was 28px (below 32px minimum touch target)
- **Root cause:** Initial implementation used 28px for a compact look
- **Fix:** Increased to 32px x 32px in content.css to meet WCAG/LoveSpark UI rules


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits

## v1.0.7 — Contrast + Semantics Fix (2026-04-01)

### Bug Fix: Header title contrast fails WCAG AA on retro pink theme
- **Problem:** `.header-title` used `color: var(--ls-text-white)` (#fff on pink gradient ~1.5:1 ratio)
- **Root cause:** White text on light pink gradient fails 4.5:1 AA minimum
- **Fix:** Changed to `var(--ls-text-dark)` (#5c1a36 on #fdcfe1 = ~7.3:1). Theme overrides in tokens.css handle beige/slate. Removed text-shadow (unnecessary with dark text).
- **Files:** popup.css, settings.css

### Bug Fix: Settings page incorrect role="dialog"
- **Problem:** `settings.html` container had `role="dialog"` but it opens as a full tab, not a popup
- **Root cause:** Copy-paste from popup.html pattern; dialogs should only be used for popup overlays
- **Fix:** Removed `role="dialog"` from settings-container div
- **Files:** settings.html
