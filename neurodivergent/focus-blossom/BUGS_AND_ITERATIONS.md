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
