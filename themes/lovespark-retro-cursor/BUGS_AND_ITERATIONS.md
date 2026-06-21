# Bugs & Iterations

## 2026-06-21: SEO — lead the store title with "Pink"

**Problem:** The Chrome Web Store / AMO listing title was "LoveSpark Retro Cursor Pack" — the high-intent search keyword "pink" (the pack's defining trait) was absent, and the brand led the title where the store weights leading keywords most.
**Root cause:** Title optimized for brand-first naming convention rather than search discoverability.
**Fix:** Renamed to "Pink Retro Cursor Pack by LoveSpark" (35 chars, under the 45-char CWS limit) — keyword leads, brand retained at the tail. Updated `extName` across all 55 locale `messages.json` files and `action.default_title` in manifest.json; popup tab title matches the store name, popup `<h1>` set to the concise "Pink Retro Cursor Pack" (brand already shown via the Sparky mascot).
**Files:** _locales/*/messages.json (55), manifest.json, popup.html
**Version:** 1.1.33

## 2026-05-05: Y2K Korean Collection — replaced New Collection with dual-variant lineup

**Problem:** The 7 SVG packs in "New Collection" (Moonlight Rose, Candy Floss, Cyber Cherry, Mint Blossom, Golden Hour, Holographic, Obsidian Heart) drifted from the Pink Y2K Korean kawaii brand — palette went mint/orange/red, and the flat-icon style felt disconnected from cursor functionality.
**Root cause:** Initial New Collection optimized for procedural-generation variety in `gen_cursors.py` rather than brand consistency. Aesthetic divergence wasn't caught before ship because there was no brand audit gate.
**Fix:** Removed all 7 New Collection packs. Added 9 Y2K Korean themed packs in two design subcategories — Emoji (symmetric kawaii icon as the cursor) and Pointer (traditional asymmetric arrow with theme decoration) — for 18 new pack registrations. Final lineup: 21 packs (3 OG + 18 Y2K Korean). Pack IDs follow `{name}-emoji` / `{name}-pointer` convention. Storage migration in popup.js falls stale pack IDs back to retro-pink.
**Files:** manifest.json, gen_cursors.py, content_script.js, popup.html, popup.js, popup.css, README.md, CHANGELOG.md
**Version:** 1.1.32

## : |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu

**Problem:** |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu
**Files:** manifest.json,popup.css
**Commit:** 1001acd

## : |2026-03-05|||fix: replace broken footer with aesthetic ls-footer

**Problem:** |2026-03-05|||fix: replace broken footer with aesthetic ls-footer
**Files:** lib/lovespark-base.css,lib/lovespark-footer.css,lib/lovespark-footer.js,manifest.json,popup.html
**Commit:** 3daec09

## : |2026-02-23|||Fix excessive permissions — strip to storage-only for CWS resubmission

**Problem:** |2026-02-23|||Fix excessive permissions — strip to storage-only for CWS resubmission
**Details:** Remove scripting, tabs, and host_permissions. Static content_scripts
handles injection; chrome.storage.onChanged handles settings propagation.
Delete redundant ensureScriptAndBroadcast() and onMessage listener.
Co-Authored-By: Claude Opus 4.6 <noreply@anthropic.com>
**Files:** background.js,content_script.js,manifest.json
**Commit:** a5daacf

## : |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)

**Problem:** |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)
**Files:** manifest.json
**Commit:** b958a4d

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
