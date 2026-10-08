# Bugs & Iterations

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
in this repo, which is what `ls-check`'s `MV3-STORAGE-KEY` warn was
flagging). `lib/lovespark-tokens.css` was a stale copy from before the
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
Bumped `manifest.json` to 1.1.35 for the popup.html/popup.js changes.
**Blocked on commit:** This repo's `.git/hooks/pre-commit` shim runs
`ls-check.py --pre-commit` (a faster, grep-only check set), which surfaces a
4th, unrelated, pre-existing failure not present in plain `ls-check .`:
`A11Y-CONTRAST-FAST` flags `filters/google.css:25,45` and
`filters/twitter.css:10,55,68` as "white text on light background."
Confirmed via `git stash` that this fails identically on HEAD before any of
these changes. Confirmed false positive: every hit is a `background-color:`
(or `--background-color:` custom-property) declaration with no `color:`
property anywhere near it — the checker's regex
`re.search(r'color:\s*#fff', line)` matches the `color:` substring inside
`background-color:` and doesn't exclude it. The full accurate audit
(`ls-check .`, not `--pre-commit`) already passes "Contrast audit (80 pass,
all 4 themes)" for this exact repo, confirming no real defect. Root cause is
in the shared `scripts/ls-check.py` (not a git repo, fleet-wide tool, out of
this unit's assigned-repo scope) — flagged for a follow-up fix rather than
patched here. Per the no-hook-bypass rule, this commit is left staged and
uncommitted; run `git commit` here once the checker is fixed, or
`git commit --no-verify` if you've reviewed and want to land it now.
**Files:** `popup.html`, `popup.js`, `lib/lovespark-tokens.css`, `manifest.json`
**Commit:** (staged, not yet committed — see blocker above)

## GOV-001 — 2026-07-08: Missing README.md/LICENSE + popup accessibility gaps

**Problem:** CLAUDE.md's repo rule requires a README.md and MIT LICENSE at
every repo root; this repo had neither, only this BUGS log. Separately,
`ls-check --pre-commit` (the repo's own gate) found popup.html missing
`role="dialog"` + `aria-labelledby`/`aria-describedby` and the theme-dropdown
trigger missing `aria-expanded`. Flagged in the fleet P2 governance-doc
scaffold sweep (meta_implementation.md) and this repo's own gate.
**Root cause:** Governance docs were never scaffolded; the popup
accessibility gaps predate the CLAUDE.md accessibility-standards rule being
enforced via `ls-check`.
**Fix:** Added `README.md` (what the extension does, the three color modes,
file layout, dev-install steps, privacy statement) and `LICENSE` (MIT,
matching the fleet-standard text used across other LoveSpark extension
repos). Added `role="dialog"`/`aria-labelledby`/`aria-describedby` to
`popup.html`'s `<body>` and `aria-expanded`/`aria-haspopup` to the theme
dropdown trigger (toggled live in `popup.js`). Left the pre-existing
`BRAND-LIB-WIRED` gate failure (popup.html not wired to canonical
`lovespark-base.css`/`lovespark-theme.js`) untouched — this popup already
ships its own working, non-conflicting theme-dropdown CSS/JS under the same
class names the shared lib uses, so a naive wire-in would collide with it
exactly like the March 2026 fleet-wide `--ls-btn-bg` shared-lib-drift
regression documented above; that migration belongs to the dedicated
shared-lib-sync initiative, not this governance-doc unit.
**Files:** `README.md` (new), `LICENSE` (new), `popup.html`, `popup.js`
**Commit:** (this one)

## : |2026-03-05|||fix: replace broken footer with aesthetic ls-footer

**Problem:** |2026-03-05|||fix: replace broken footer with aesthetic ls-footer
**Files:** lib/lovespark-base.css,lib/lovespark-footer.css,lib/lovespark-footer.js,manifest.json,popup.html
**Commit:** 525a724

## : |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)

**Problem:** |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)
**Files:** manifest.json,popup.css
**Commit:** 68d776b

## : |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu

**Problem:** |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu
**Files:** manifest.json,popup.css
**Commit:** 7c0a952

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
