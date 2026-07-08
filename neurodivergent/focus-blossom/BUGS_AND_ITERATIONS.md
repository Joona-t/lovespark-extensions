# Bugs & Iterations

## 2026-05-08 — v1.0.43 — Twitter/X rename bypass

**Problem:** Typing `https://x.com/...` directly bypassed the blocker. Users who added the "twitter.com" preset only got a `||twitter.com` DNR rule, which never matches `x.com` requests, so the page loaded normally.
**Root cause:** Preset hardcoded `twitter.com` (since 1.0.0) but Twitter renamed to `x.com` in 2023; codebase had no alias mapping, so the two domains were treated as unrelated.
**Fix:**
1. Renamed preset `twitter.com` → `x.com` in `popup.html` and `cws-shots/popup.html`.
2. Added `ALIASES = { "twitter.com": ["x.com"], "x.com": ["twitter.com"] }` to `popup.js` — `addSite()` and the preset click handler now route through `blockWithAliases()`, which blocks every aliased host in one go.
3. Added a one-shot `migrateAliases()` step at the top of `syncBlockingRules()` in `background.js` — on next startup, existing users with stale `twitter.com` gardens automatically get `x.com` blocked too (and vice versa).
**Files:** popup.html, cws-shots/popup.html, popup.js, background.js, manifest.json

## 2026-04-27 — v1.0.41 — Remove dead shared lib files

**Problem:** BRAND-DEAD-LIB warning — 4 lib files (lovespark-popup.js, lovespark-badge.js, lovespark-lifecycle.js, lovespark-stats.js) shipped in lib/ but never referenced from any HTML. Bloated bundle and tripped fleet-audit.
**Root cause:** sync-shared-lib.sh copies the full canonical set; focus-blossom only consumes base/theme/footer/tokens.
**Fix:** Deleted the four unused lib files. Bumped manifest 1.0.40 → 1.0.41. Health 83 → 84 (39/39 checks pass).

## : |2026-03-05|||fix: replace broken footer with aesthetic ls-footer

**Problem:** |2026-03-05|||fix: replace broken footer with aesthetic ls-footer
**Files:** lib/lovespark-base.css,lib/lovespark-footer.css,lib/lovespark-footer.js,manifest.json,popup.html
**Commit:** 25f0693

## : |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu

**Problem:** |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu
**Files:** manifest.json,popup.css
**Commit:** 6ece18a

## : |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)

**Problem:** |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)
**Files:** manifest.json,popup.css,settings.css
**Commit:** 8a158f3

## : |2026-02-26|||Fix blocked page redirect: add web_accessible_resources

**Problem:** |2026-02-26|||Fix blocked page redirect: add web_accessible_resources
**Details:** declarativeNetRequest redirect to blocked.html requires the page
and its dependencies to be listed in web_accessible_resources,
otherwise Chrome shows ERR_BLOCKED_BY_CLIENT instead of the garden.
**Files:** manifest.json
**Commit:** ad6a9c4

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

## 2026-07-08: CWS/AMO submission bundle committed (P0-4-commit-3)

**Problem:** Focus Blossom had no committed CWS Web Store / AMO submission package — CWS-LISTING.md, PRIVACY.md, SUBMIT.md, and cws-shots/ existed only as generator output on disk, never landed in git, so the extension wasn't submission-ready from a clean checkout.
**Root cause:** `fleet-to-store` generates these artifacts locally but a separate commit step was needed to land them, bump the patch version, and rebuild the store zips.
**Fix:** Verified PRIVACY.md is truthful (local-storage-only, zero external transmission) and CWS-LISTING.md's single-purpose + per-permission + host-permission justifications match the actual manifest.json permissions. Bumped manifest.json to v1.0.45. Rebuilt *-chrome.zip / *-firefox.zip via the canonical `scripts/build-zips.sh`; Firefox zip passed `amo-validate.py`. Committed the bundle.
**Files:** CWS-LISTING.md, PRIVACY.md, SUBMIT.md, cws-shots/, manifest.json

## 2026-07-08: R-cws-a11y-3 — land stranded shared-lib sync files + confirm A11Y-CONTRAST blocker

**Problem:** `lib/lovespark-badge.js`, `lib/lovespark-lifecycle.js`, `lib/lovespark-popup.js`, `lib/lovespark-stats.js` sat on disk as untracked files (byte-identical to canonical `Extensions/infrastructure/lovespark-shared-lib/`) — a prior sync pass wrote them but never `git add`ed them. `ls-check .` also reported `A11Y-CONTRAST: 3 failure(s)`.
**Root cause:** Leftover uncommitted sync output (same class as the 2026-07-08 P0-4-commit-3 pattern seen fleet-wide). Separately, `A11Y-CONTRAST` is a fleet-wide defect in canonical `lovespark-shared-lib/lovespark-tokens.css` itself: beige hint-text at 0.8 opacity (4.26:1, needs 4.5:1), slate muted-text on glass-strong (4.17:1, needs 4.5:1), slate slider-thumb on track (2.65:1, needs 3.0:1) — matches documented KI-002/KI-003/KI-004. Confirmed real (not a false alarm from the checker): running `audit-contrast.py --hardcoded` (old fallback values) passes clean, so the live canonical values are the actual regression.
**Fix:** Committed the four already-correct, already-on-disk lib files (finishes the prior sync, no content change). `A11Y-CONTRAST` is out of scope for this repo — the fix belongs in the canonical `lovespark-shared-lib` repo (not one of this unit's assigned repos); flagged separately.
**Files:** lib/lovespark-badge.js, lib/lovespark-lifecycle.js, lib/lovespark-popup.js, lib/lovespark-stats.js, manifest.json (1.0.45 → 1.0.46)
