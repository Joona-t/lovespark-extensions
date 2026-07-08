# Bugs & Iterations

_No entries yet. Document bugs, fixes, and iterations here as they occur._

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

## 2026-07-08: P2-a11y-misc — popup missing dialog semantics + dropdown state (BUG-P2A11Y-01)

**Problem:** `popup/popup.html`'s `.popup-container` had no `role="dialog"`/`aria-labelledby`/`aria-describedby`, so screen readers announced the popup as an unstructured region instead of a labelled dialog. The theme dropdown trigger also lacked `aria-expanded`/`aria-haspopup`, so assistive tech couldn't tell the menu was collapsed/expandable, and `#themeLabel` wasn't wired to `aria-live` for the theme-change announcement.
**Root cause:** Popup was scaffolded before the WCAG dialog pattern used elsewhere in the fleet (`lovespark-reaction-time`) was established; the pattern was never backported here.
**Fix:** Added `role="dialog" aria-labelledby="popupTitle" aria-describedby="popupDesc"` to `.popup-container`, `id="popupTitle"`/`id="popupDesc"` to the header title/subtitle, and `aria-expanded="false" aria-haspopup="true" aria-label="Change theme"` + `aria-live="polite"` on the theme dropdown trigger — matching `lovespark-reaction-time`'s verified pattern. `ls-check .` ACCESSIBILITY section: 9 pass/1 fail/2 warn → 11 pass/1 warn (pre-existing opacity warn out of scope).
**Files:** popup/popup.html
**Commit:** see git log (fleet-p2 batch, branch `security/cso-hardening-2026-06-26`)

## 2026-07-08: MV3-SETINTERVAL — pause-overlay countdown blocked commit gate (BUG-P2-MV3-01)

**Problem:** The BUG-P2A11Y-01 a11y fix + version bump to 1.0.30 was correct but sat uncommitted — the repo's `pre-commit` hook (`scripts/pre-commit-lint.sh` → `ls-check.py --pre-commit`) failed on a pre-existing `MV3-SETINTERVAL` violation in `content/content.js:100`: the pause-overlay countdown used `setInterval` to decrement a `remaining` counter once per second.
**Root cause:** A blind-decrement `setInterval` loop drifts under tab throttling — Chrome deprioritizes timers in backgrounded/inactive tabs, so a decrement-by-1-per-tick counter can fall behind wall-clock time and never fully catch up once the tab regains focus. Content scripts (unlike MV3 service workers) aren't killed outright, but the same throttling risk applies, and the fleet's `ls-check` MV3 gate flags any `setInterval` in a `*content*` file as a signal of this class of bug (the same antipattern that shows up as DOM-polling races elsewhere in the fleet).
**Fix:** Replaced the blind-decrement `setInterval` with a self-correcting `setTimeout` loop (`countdownTick`) that recomputes `remaining` from `Date.now() - countdownStart` on every tick instead of decrementing a counter — so a throttled tick always catches up to the true elapsed time instead of drifting. `countdownActive` flag replaces `clearInterval` for stopping the loop, and is also set `false` on `dismiss()` so the loop can't keep firing after the overlay is torn down. `ls-check . --pre-commit`: MV3 COMPLIANCE 6 pass/1 fail → 7 pass/0 fail (gate now green, 35 pass/0 fail/6 warn overall — remaining warns pre-existing/out of scope: A11Y-KI004 opacity, SEC-SENDMSG, BRAND-DEAD-LIB, PERM-UNUSED, QUAL-README, QUAL-LICENSE).
**Files:** content/content.js
**Commit:** see git log (branch `security/cso-hardening-2026-06-26`)

## 2026-07-08: Stranded swarm-audit hygiene/security fixes — landed after gate unblock (BUG-P2-STRAND-01)

**Problem:** A prior interrupted CSO-hardening swarm-audit pass had already made several correct security/hygiene fixes (silent-catch → logged catch in `lib/lovespark-badge.js` and `popup/popup.js`; a `sender.id` origin check in `lib/lovespark-lifecycle.js`'s message handler to reject cross-extension messages; a `rotateMessages` timer-id return in `lib/lovespark-popup.js` so callers can clean up; a legacy `darkMode` storage-key fallback removed from `lib/lovespark-theme.js`; a low-contrast hover state swapped for underline in `lib/lovespark-footer.css`; design tokens extracted from `lib/lovespark-base.css` into the canonical generated `lib/lovespark-tokens.css` + `@import`; and a WCAG touch-target `min-height: 32px` rule added to `lib/lovespark-base.css`) but none of it could be committed — same `pre-commit` gate, blocked by the unrelated pre-existing `MV3-SETINTERVAL` failure (BUG-P2-MV3-01) in `content/content.js`, since `ls-check --pre-commit` fails the whole repo on any single violation regardless of which files changed.
**Root cause:** Same as BUG-P2-MV3-01 — the repo-wide pre-commit gate has no per-file scoping, so one pre-existing violation anywhere in the tree blocks committing unrelated, already-correct work.
**Fix:** No code changes needed for this entry beyond BUG-P2-MV3-01's — landing this batch alongside the setInterval fix now that the gate is green. Verified each change is self-consistent before commit: `lovespark-tokens.css` md5-diffs from canonical only because canonical has since drifted further (BRAND-LIB-SYNC/BRAND-TOKEN-DRIFT warns are pre-existing and skipped in `--pre-commit` mode; out of scope for this unit — flagged for a future shared-lib-sync unit).
**Files:** lib/lovespark-badge.js, lib/lovespark-lifecycle.js, lib/lovespark-popup.js, lib/lovespark-theme.js, lib/lovespark-footer.css, lib/lovespark-base.css, lib/lovespark-tokens.css, popup/popup.js
**Commit:** see git log (branch `security/cso-hardening-2026-06-26`)
