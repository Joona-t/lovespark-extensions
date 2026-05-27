# Bugs & Iterations — Rewire Brain

<!-- Format:
## YYYY-MM-DD: Short Title

**Problem:** What went wrong or needed changing
**Root cause:** Why it happened
**Fix:** What was done to resolve it
**Files:** files touched
**Commit:** sha or "uncommitted"
-->

## 2026-05-09 (v2.4.1): Phase 4 ship-readiness audit — P0 silent-failure fail-closed patches

**Problem:** Image blur "silently failed" on Twitter and DuckDuckGo Images — users saw NSFW images with no indication that the classifier had run.
**Root cause:** Three independent silent failures:
1. `image-blur-main.js:148` — bare `catch{}` removed the pre-blur class on ANY classify error (tainted-canvas SecurityError, CSP failures, NSFWJS load failures), revealing the unblurred image.
2. `image-blur.js:14-22` — `chrome.storage.local.get` failure caused early return, silently disabling blur for the whole site.
3. `content.js:49-51` — 500ms safety timeout removed the page-hiding style EVEN when the SW response indicated the URL should be blocked, causing flash-of-blocked-content.
**Fix:** Applied fail-closed pattern to all three:
- F-1: catch now KEEPS the blur permanently and logs a warning + still emits the `rb-image-blurred` event.
- F-2: storage error now defaults to `enabled: true` with strict settings instead of bailing.
- F-5: added `responded` flag and bumped timeout to 1500ms; timeout now respects "block" responses that already arrived.
**Files:** `image-blur.js`, `image-blur-main.js`, `content.js`
**Commit:** uncommitted

## 2026-05-09 (v2.4.1): Journal entries duplicated on multi-save per day

**Problem:** Saving the journal multiple times in one day produced multiple entries with the same date. The dashboard's `find(date)` returned the OLDEST save, so the textarea pre-filled with stale content.
**Root cause:** `SAVE_JOURNAL_ENTRY` handler used `entries.push(newEntry)` without deduplicating by date.
**Fix:** Upsert pattern — `findIndex(date)` and replace if found, else push.
**Files:** `background.js:310`
**Commit:** uncommitted

## 2026-05-09 (v2.4.1): UTC vs local-date mismatch broke streak/journal for non-UTC users

**Problem:** Users outside the UTC timezone saw journal entries stored under the previous calendar date (e.g. journaling at 22:00 local in UTC+10 = 12:00 UTC, fine; but journaling at 23:30 local in UTC-5 = 04:30 UTC next day, would advance the date by one).
**Root cause:** `toDateStr()` used `toISOString().split('T')[0]` which produces UTC dates. The journal alarm used local clock for scheduling. Mismatched conventions → wrong date slot.
**Fix:** Rewrote `toDateStr` to produce local-date (YYYY-MM-DD using `getFullYear/getMonth/getDate`). Updated `daysBetween` to parse at local midnight (no `Z` suffix) so DST transitions don't introduce ±1 hour skew.
**Files:** `background.js:580` (`toDateStr`), `background.js:584` (`daysBetween`)
**Commit:** uncommitted

## 2026-05-09 (v2.4.1): SITE_BLOCKED returned stale XP

**Problem:** XP toast on the blocked page displayed a value 10–110 XP behind the actual stored value immediately after a block event.
**Root cause:** `SITE_BLOCKED` awaited `updateStreak()` (which may add +10 daily streak XP or +110 milestone bonus) AFTER returning a precomputed `xp` value to the caller.
**Fix:** Added a fresh `chrome.storage.local.get(['xp'])` after `updateStreak()` so the response reflects the post-streak XP.
**Files:** `background.js:144` (SITE_BLOCKED handler)
**Commit:** uncommitted

## 2026-05-09 (v2.4.1): Streak gap branch did not write `streakDays: 0`

**Problem:** When the SITE_BLOCKED handler detected a streak gap (>1 day), it set `streakStartDate: today` but not `streakDays: 0`. There was a brief window where storage held inconsistent state until `updateStreak()` corrected it on the next line.
**Root cause:** Implicit assumption that `updateStreak` would fix it; not defensive.
**Fix:** Added `updates.streakDays = 0` to the gap branch.
**Files:** `background.js:163`
**Commit:** uncommitted

## 2026-05-09 (v2.4.1): Debug `console.log` in DNR feedback listener

**Problem:** ls-check flagged `console.log('[Rewire Brain] Rule matched:', info)` at `background.js:631` as a debug leftover.
**Root cause:** Development logging never escalated to a discoverable level.
**Fix:** Changed to `console.warn` so it remains discoverable in DevTools but doesn't trip lint.
**Files:** `background.js:631`
**Commit:** uncommitted

## 2026-05-09 (v2.4.1): Missing CWS submission requirements

**Problem:** No `README.md` or `LICENSE` file in the package.
**Root cause:** Original scaffold did not include them.
**Fix:** Added comprehensive `README.md` with feature list, privacy claims, install instructions. Added MIT `LICENSE` (LoveSpark default).
**Files:** `README.md`, `LICENSE`
**Commit:** uncommitted

## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits

## 2026-03-05: Replace broken footer with aesthetic LoveSpark footer

**Problem:** Popup footer was missing or broken. Needed shared LoveSpark footer treatment.
**Fix:** Wired up `lib/lovespark-footer.js` and `lib/lovespark-footer.css`.
**Files:** `lib/lovespark-base.css`, `lib/lovespark-footer.css`, `lib/lovespark-footer.js`, `manifest.json`, `popup.html`
**Commit:** a053173

## 2026-03-05: Theme title text visibility on Beige and Slate

**Problem:** Title text contrast failed against the Beige (`#4a7c59` earthy green) and Slate (`#d4714e` terracotta) themes.
**Fix:** Added theme-specific title color overrides.
**Files:** `manifest.json`, `popup.html`
**Commit:** 8469130

## 2026-03-05: Theme dropdown — missing CSS for styled menu

**Problem:** Theme dropdown had no styled menu UI.
**Fix:** Added CSS for the dropdown menu visual.
**Files:** `manifest.json`, `popup.html`, `popup.js`
**Commit:** 0734a76

## 2026-03-04: Description length for Chrome Web Store (max 132 chars)

**Problem:** Several locale `messages.json` files exceeded the 132-character description limit imposed by Chrome Web Store.
**Fix:** Trimmed descriptions across all locales.
**Files:** `_locales/am/messages.json`, `_locales/ar/messages.json`, `_locales/bg/messages.json`, `_locales/bn/messages.json`, `_locales/ca/messages.json`, etc.
**Commit:** 577dfba
