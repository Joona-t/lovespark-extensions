# Bugs & Iterations

## : |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)

**Problem:** |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)
**Files:** manifest.json,popup.css,settings.css
**Commit:** 12f7f88

## : |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu

**Problem:** |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu
**Files:** manifest.json,popup.css
**Commit:** b309a52

## : |2026-03-05|||fix: replace broken footer with aesthetic ls-footer

**Problem:** |2026-03-05|||fix: replace broken footer with aesthetic ls-footer
**Files:** lib/lovespark-base.css,lib/lovespark-footer.css,lib/lovespark-footer.js,manifest.json,popup.html
**Commit:** e078155

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

## 2026-09-24: Hidden cookie banner leaves article scroll locked

**Problem:** The user reported that some news pages stop scrolling after this extension handles the cookie banner. A local browser fixture reproduced the failure: the OneTrust-shaped banner was hidden, but scrolling remained at `scrollY=0`.

**Confirmed root cause:** The extension's early CSS and content script hide the consent element without undoing a later `overflow-y: hidden !important` written inline on `<body>` or `<html>` by the consent manager. The existing class-specific stylesheet override cannot beat an inline important declaration. This diagnosis is confirmed for the DOM fixture; the user did not provide an affected news URL, so no specific publisher implementation is claimed.

**Fix:** Once the content script has hidden a known consent element, it removes inline hidden overflow and fixed-position locks from `<html>` or `<body>`, watches later root style changes for five seconds, and leaves visible non-consent dialogs alone. Once a consent element is removed, it clears any remaining lock once and stops attributing later locks to consent. Removing the CMP's inline property lets later site modal styles work normally; the short window avoids touching unrelated dialogs opened later on the page.

**Verification:** In the browser fixture, the unfixed script kept `scrollY=0` with the banner hidden. The updated script was exercised against body, HTML-root, and fixed-position locks; a separate modal kept scrolling blocked while open and scrolling resumed after close. Auto-decline clicked Reject all once, removed the banner, and allowed scrolling. A root lock with no consent element remained untouched. `node --check content.js` and `git diff --check` passed. This fixture does not establish behavior on a named live news site or an installed-store version.

**Files:** `content.js`, `manifest.json`, `tests/scroll-lock-fixture.html`.

**Release state:** Version `1.0.38` was packaged and the code pushed to `Joona-t/I-Dont-Want-Cookies` `main` on 2026-09-24. The Chrome Web Store dashboard upload and submit-for-review steps remain unverified because browser automation refused the extension gallery and the in-app browser was not signed in.

## 2026-10-24 — Chromium fleet audit (1.0.38 → 1.0.39)

- Scope CSS hiding to enabled, non-allowlisted pages; restore original inline display values immediately when disabled or allowlisted, and allow re-enabling without reloading.

Validation: manifest/resource checks, actual unpacked Chromium load and UI checks, with interaction/content regressions where applicable. See [the audit record](../../docs/audits/2026-10-24.md) for per-extension coverage and limitations.
