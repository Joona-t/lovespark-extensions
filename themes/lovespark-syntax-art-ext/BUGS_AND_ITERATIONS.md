# Bugs & Iterations

## BUG-001 — 2026-07-09: Storage-key collision — UI theme dropdown and code-art theme pills both wrote `theme`

**Problem:** The popup's UI theme dropdown (retro/dark/beige/slate, driven by
`LoveSparkTheme.init()` from `lib/lovespark-theme.js`) and the "Theme" pill
selector for the code/syntax-art style (dracula/monokai/lovespark/github-light)
both persisted to the same `chrome.storage.local` key `theme`. Picking a
code-art theme pill (e.g. `dracula`) silently overwrote the stored UI theme,
so on next popup open the shared lib tried `body.classList.add('theme-dracula')`
(a no-op class) and showed "dracula" as the UI theme label. In the other
direction, picking a UI theme (e.g. `retro`) corrupted the code-art setting:
`background.js` passed `settings.theme = 'retro'` to `offscreen.js`, whose
`THEMES['retro']` lookup fails with `Unknown theme: retro`, breaking conversion.
**Root cause:** Two independent features each claimed the generic storage key
`theme` — the shared theme lib owns that key fleet-wide, and the extension's
own `DEFAULTS` in `popup.js`/`background.js` reused it for the syntax-art
palette instead of a namespaced key.
**Fix:** Renamed the code-art theme storage key to `codeTheme` end-to-end:
`DEFAULTS` in `popup.js` and `background.js`, the `initPills('themeSelector')`
read/write in `popup.js`, the offscreen conversion message field
(`background.js` send → `offscreen.js` `msg.codeTheme` read). The UI theme
dropdown's `theme` key is untouched and now solely owned by
`lib/lovespark-theme.js`. No migration: any pre-fix stored `theme` value was
already ambiguous/corrupted by the collision, so code-art simply falls back to
the `dracula` default once.
**Files:** popup.js, background.js, offscreen.js, manifest.json (1.0.35 → 1.0.36)

## GOV-002 — 2026-07-08: BRAND-LIB-WIRED/BRAND-LIB-SYNC gate failures — wire shared theme lib into popup

**Problem:** `ls-check`'s pre-commit gate was red on 3 `BRAND` checks:
`BRAND-LIB-WIRED` (popup.html not loading `lib/lovespark-base.css` /
`lib/lovespark-theme.js`), `BRAND-LIB-SYNC` (`lib/lovespark-tokens.css`
md5-mismatched the canonical shared-lib copy), and `BRAND-TOKEN-DRIFT`
(shared-lib `lovespark-tokens.css` differs from `design-tokens/generated/`).
GOV-001 (previous session) left `BRAND-LIB-WIRED` deliberately unfixed,
reasoning a wire-in would collide with this popup's own hand-rolled
theme-dropdown CSS/JS the way the March 2026 `--ls-btn-bg` regression did.
**Root cause:** `popup.html` never linked the shared lib CSS/JS at all —
`popup.js` instead carried a full duplicate reimplementation of
`LoveSparkTheme` (same class names, same `THEMES`/`THEME_NAMES` table,
including a dead `darkMode` storage-key read that's never written anywhere
in this repo). `lib/lovespark-tokens.css` was a stale copy from before the
March 2026 accessibility-contrast token pass (KI-002/003/004 muted-text and
glass-border fixes) landed in the canonical shared lib.
**Fix:** Verified the collision concern from GOV-001 does not hold:
`popup.css` already defines its own `:root` tokens and
`.theme-dropdown*`/`.theme-option*` rules at equal specificity, loaded
*after* `lib/lovespark-base.css` in `<head>`, so cascade order lets
`popup.css` win on every declaration it defines — no `--ls-btn-bg`-style
undefined-variable regression is possible. Added
`<link rel="stylesheet" href="lib/lovespark-base.css">` (before
`lovespark-fonts.css`/`lovespark-footer.css`, `popup.css` last) and
`<script src="lib/lovespark-theme.js"></script>` (before `popup.js`) to
`popup.html`. Removed the duplicate theme-dropdown implementation from
`popup.js` (and its dead `darkMode` read) and replaced it with
`LoveSparkTheme.init();`, matching the pattern already used by
`lovespark-reading-progress`/`lovespark-habit-garden`/etc. Copied the
canonical `lovespark-tokens.css` from `lovespark-shared-lib` into
`lib/lovespark-tokens.css` to clear `BRAND-LIB-SYNC`. `BRAND-TOKEN-DRIFT`
is left red — it compares `design-tokens/generated/lovespark-tokens.css`
against the shared-lib canonical globally (no per-repo path), fails
identically on every extension in the fleet (verified against
`lovespark-dark-mode`), and can only be fixed by resyncing
`lovespark-shared-lib` itself, which is outside this repo and this unit's
scope — tracked as a separate fleet-infra item (see
`meta_implementation.md`'s dead-token-drift-detector P0/P1 item).
Separately noted but NOT fixed (out of scope): the popup's syntax/code
"Theme" pill selector (`dracula`/`monokai`/`lovespark`/`github-light`) and
the shared UI theme dropdown (`retro`/`dark`/`beige`/`slate`) both write to
the same `chrome.storage.local` key `theme`, so picking a code-art theme
pill silently clobbers the UI theme preference (and vice versa) — a
pre-existing storage-key collision, not introduced by this fix; flagged for
a follow-up.
Bumped `manifest.json` to 1.0.35 for the popup.html/popup.js changes.
**Files:** `popup.html`, `popup.js`, `lib/lovespark-tokens.css`, `manifest.json`
**Commit:** (this one)

## GOV-001 — 2026-07-08: Missing README.md/LICENSE + popup accessibility gaps

**Problem:** CLAUDE.md's repo rule requires README.md/LICENSE at every repo
root (this repo had neither); popup.html was missing `role="dialog"` +
`aria-labelledby`/`aria-describedby` and the theme-dropdown trigger was
missing `aria-expanded`; `offscreen.html` was missing `lang="en"`. Flagged
in the fleet P2 governance-doc scaffold sweep + this repo's own
`ls-check --pre-commit` gate (A11Y-DIALOG, A11Y-EXPANDED, A11Y-LANG,
QUAL-README).
**Root cause:** Governance docs were never scaffolded; the popup accessibility
gaps predate the CLAUDE.md accessibility-standards rule being enforced via
`ls-check`.
**Fix:** Added `README.md` and `LICENSE` (MIT, matching fleet-standard
text). Added `role="dialog"`/`aria-labelledby`/`aria-describedby` to
`popup.html`'s `<body>`, `aria-expanded`/`aria-haspopup` to the theme
dropdown trigger (toggled live in `popup.js`), and `lang="en"` to
`offscreen.html`. Left the pre-existing `BRAND-LIB-WIRED` gate failure
(popup.html not wired to canonical `lovespark-base.css`/`lovespark-theme.js`)
untouched — this popup already ships its own working, non-conflicting
theme-dropdown CSS/JS under the same class names as the shared lib, so a
naive wire-in would collide with it exactly like the March 2026 fleet-wide
`--ls-btn-bg` shared-lib-drift regression; that migration belongs to the
dedicated shared-lib-sync initiative, not this governance-doc unit.
**Files:** `README.md` (new), `LICENSE` (new), `popup.html`, `popup.js`,
`offscreen.html`
**Commit:** (this one)

## : |2026-03-05|||fix: replace broken footer with aesthetic ls-footer

**Problem:** |2026-03-05|||fix: replace broken footer with aesthetic ls-footer
**Files:** lib/lovespark-base.css,lib/lovespark-footer.css,lib/lovespark-footer.js,manifest.json,popup.html
**Commit:** 59ea532

## : |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu

**Problem:** |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu
**Files:** manifest.json,popup.css
**Commit:** 74bc74d

## : |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)

**Problem:** |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)
**Files:** manifest.json,popup.css
**Commit:** f9fcff7

<!-- Format:
## YYYY-MM-DD: Short Title

**Problem:** What went wrong or needed changing
**Root cause:** Why it happened
**Fix:** What was done to resolve it
-->


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits
