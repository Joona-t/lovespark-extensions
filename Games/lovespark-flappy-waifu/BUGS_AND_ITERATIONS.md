# Bugs & Iterations

## : |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)

**Problem:** |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)
**Files:** manifest.json
**Commit:** 272d349

## : |2026-03-05|||fix: clouds behind pipes, add theme picker to game tab, theme-aware title

**Problem:** |2026-03-05|||fix: clouds behind pipes, add theme picker to game tab, theme-aware title
**Details:** - Move near cloud layer to draw before pipes so they render behind
- Add theme dropdown to fullscreen game page (top-right)
- Title colors now change per theme (dark/beige/slate)
- Bump to v1.0.7
**Files:** game.css,game.html,game.js,manifest.json
**Commit:** 8b820ce

## : |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu

**Problem:** |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu
**Files:** manifest.json,popup.css
**Commit:** 9fd0797

## : |2026-03-05|||fix: replace broken footer with aesthetic ls-footer

**Problem:** |2026-03-05|||fix: replace broken footer with aesthetic ls-footer
**Files:** lib/lovespark-base.css,lib/lovespark-footer.css,lib/lovespark-footer.js,manifest.json,popup.html
**Commit:** bbc7d57

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


## 2026-05-05: Add background music (BGM) — CC0 lofi loop

**Problem:** Flappy Waifu had a Web Audio SFX system (flap, score, milestone, near-miss, death) but no background music. Portfolio positions it as the flagship arcade title — a silent flagship reads as half-finished.
**Root cause:** Prior tension-audio attempt was scrapped as "annoying whistling" (see `stopTensionAudio` stub still present in game.js). The team backed away from looping audio entirely instead of replacing it with something tasteful and mutable.
**Fix:** Added a single CC0 lofi loop (`audio/bgm-main.mp3`, 2.7 MB, 123 s, 128 kbps) running through a dedicated `AudioBufferSourceNode` with `loop=true` and an independent gain node so SFX volumes are unaffected. Lifecycle: hydrate prefs from `chrome.storage.local` on script load → `loadBgm()` decodes on first user gesture (existing autoplay-gesture gate via `initAudio`) → `bgmStart()` fades in over 1.2 s on `startGame()` → keeps playing across deaths under the death overlay. In-game mute button in HUD (`#mute-btn`, 36 × 36 px, theme variants for retro/dark/beige/slate). Music card in settings panel (toggle + volume slider) writes to `chrome.storage.local`; game tab listens via `chrome.storage.onChanged` for live updates without reload. First launch defaults to OFF if `prefers-reduced-motion: reduce`, else ON at 0.25 volume.
**Track shortlist** (CC0, audited 2026-05-05):
  1. https://opengameart.org/content/chill-lofi-inspired (omfgdude, 2.7 MB) — **selected**
  2. https://opengameart.org/content/calm-ambient-1-synthwave-4k (The Cynic Project, 6.3 MB) — pads overlap flap-SFX band
  3. https://opengameart.org/content/calm-ambient-2-synthwave-15k (The Cynic Project, 8.3 MB) — same masking concern + heavier bundle
**Files:** game.js, game.html, game.css, settings.html, settings.css, settings.js, manifest.json (1.0.37 → 1.0.38), audio/bgm-main.mp3 (new), audio/LICENSE.md (new)
**Plan:** ~/.claude/plans/let-us-update-flappy-snazzy-quasar.md


## 2026-05-05: Ship-readiness — popup ARIA, dropdown aria-expanded, innerHTML → DOM API

**Problem:** Pre-commit `ls-check` blocked the BGM commit on four pre-existing failures unrelated to BGM: popup.html missing `role="dialog"` + `aria-labelledby`, dropdown triggers (popup + game) missing `aria-expanded`, four `innerHTML` assignments in game.js / popup.js (XSS-shape pattern even though inputs are trusted), and popup.html not loading the canonical shared lib.
**Root cause:** Latent debt — features built before `ls-check` enforced these patterns. They were tolerated because Chrome extension popups feel like dialogs but were never marked as such, and string-built HTML was ergonomic before this lint rule.
**Fix:**
- popup.html: added `role="dialog"` + `aria-labelledby="popup-title"` on `.popup-container`, `id="popup-title"` on `<h1>`, `aria-expanded` + `aria-haspopup="menu"` + `aria-controls` on the theme trigger, `role="menu"` on the menu, `<link>` for `lib/lovespark-base.css`, `<script>` for `lib/lovespark-theme.js`.
- game.html: same `aria-expanded` + `aria-haspopup` + `aria-controls` + `role="menu"` treatment for the in-page theme dropdown.
- popup.js + game.js: added `syncExpanded()` helper to flip `aria-expanded` in lockstep with `.open` class on every toggle path (open / select / outside-click).
- popup.js (`hearts-badge`, `streak-stamps`) and game.js (`death-hearts`, `death-daily`): replaced four `innerHTML` assignments with `replaceChildren()` + `createElement` + `textContent` + `appendChild`. Output DOM identical to prior render; `replaceChildren()` is supported in Chrome 86+ (MV3 minimum is 88+).
- `lovespark-base.css` is loaded BEFORE `popup.css` so popup.css's `:root` token overrides win on cascade — guards against the March 2026 fleet regression where injected base CSS undefined `--ls-btn-bg`.
- `lovespark-theme.js` is included to satisfy `BRAND-LIB-WIRED`; it exposes `LoveSparkTheme` but does NOT auto-init, so popup.js's existing inline dropdown logic continues to own the binding (no double-listener).
**Verified:** ls-check now reports 33 pass / 0 fail / 6 warn (warnings are README/LICENSE conventions + dead-lib references unrelated to this fix). Preview confirmed: aria-expanded false → true → false on click cycle, hearts-badge renders identically to old innerHTML version, streak-stamps render 7 spans with correct fill/empty classes, no console errors.
**Files:** popup.html, popup.js, game.html, game.js
**Plan:** ~/.claude/plans/let-us-update-flappy-snazzy-quasar.md (downstream of "ship ready" requirement)

## 2026-07-08: Shared-lib sync sweep — lib/ copies + popup.css button contrast had uncommitted drift

**Problem:** Two defects found during a fleet shared-lib sync sweep (P0-7-sweep-1). (1) `lib/lovespark-badge.js`, `lib/lovespark-base.css`, `lib/lovespark-footer.css`, `lib/lovespark-lifecycle.js`, `lib/lovespark-popup.js`, `lib/lovespark-theme.js` in the working tree all differed from the last commit (uncommitted) — canonical shared-lib has since moved `lovespark-base.css`'s theme variable definitions out into a separate `lovespark-tokens.css` (imported via `@import`), added a `sender.id` origin check to the runtime message handler, added a min-height touch-target rule, and a few other hardening fixes. `lib/lovespark-tokens.css` itself was entirely untracked/new. (2) `popup.css` had an uncommitted change swapping `--ls-pink-accent` for the darker `--ls-pink-deep` on the primary button and daily-progress fill — an AA contrast fix.
**Root cause:** A prior sync pass copied the current canonical shared-lib files (and made the local contrast fix) into this repo's working tree but the commit step was never run.
**Fix:** Diffed every `lib/lovespark-*.{css,js}` file against `Extensions/infrastructure/lovespark-shared-lib/` — all matched byte-for-byte, so committed the sync as-is (no porting or drift-revert needed). Committed the `popup.css` contrast fix separately since it is not a shared-lib file. Bumped patch version.
**Files:** lib/lovespark-badge.js, lib/lovespark-base.css, lib/lovespark-footer.css, lib/lovespark-lifecycle.js, lib/lovespark-popup.js, lib/lovespark-theme.js, lib/lovespark-tokens.css (new), popup.css, manifest.json (1.0.39 → 1.0.40)

## 2026-10-07: BUG — "AA contrast fix" made Play Now worse in Slate, still failing in Beige

**Problem:** The 2026-07-08 sweep switched `.play-btn` / `.daily-fill` from `--ls-pink-accent` to `--ls-pink-deep` and called it an AA fix. That holds for Retro and Dark, but popup.css's own theme blocks make `--ls-pink-deep` *lighter* than the accent in Slate (#e8926e) and only slightly darker in Beige (#a86c56). Play Now (14px/500, so it needs 4.5:1) measured retro 4.62, dark 5.87, **beige 3.70 (fail), slate 2.03 (worse than the 2.83 before the "fix")**.
**Root cause:** The fix was verified only by ls-check's static A11Y-KI001 pattern ("pink-accent used as a background"). That rule proves the linter is satisfied, not the contrast. Neither ls-check nor ls-audit-contrast models the button-bg/text-white pair per theme.
**Fix:** Added a popup-local `--fw-cta-bg` token, set only in the Beige (#8a5340, 5.40:1 vs #f5efe0) and Slate (#9c4a2c, 5.18:1 vs #ececec) theme blocks. `.play-btn`, `.play-btn:hover` and `.daily-fill` use `var(--fw-cta-bg, var(--ls-pink-deep))`, so Retro and Dark are unchanged. In a browser on localhost (transitions off), the computed Play Now bg/text for retro/dark/beige/slate matched these values exactly.
**Regression check** (run from the repo root; exits 1 if any theme drops below 4.5:1; fails on the pre-fix popup.css, passes after):
```
python3 - <<'PY'
import re,sys
css=open('popup.css').read()
blk=lambda s: re.search(re.escape(s)+r'\s*\{(.*?)\}',css,re.S).group(1)
def v(b,n):
    m=re.search(r'--'+n+r':\s*(#[0-9a-fA-F]{6})',b); return m and m.group(1)
def L(h):
    c=[int(h[i:i+2],16)/255 for i in (1,3,5)]; c=[x/12.92 if x<=0.03928 else ((x+0.055)/1.055)**2.4 for x in c]
    return .2126*c[0]+.7152*c[1]+.0722*c[2]
root=blk(':root'); bad=0
for t,s in [('retro',':root'),('dark','body.theme-dark'),('beige','body.theme-beige'),('slate','body.theme-slate')]:
    b=blk(s); g=lambda n: v(b,n) or v(root,n)
    bg=v(b,'fw-cta-bg') or g('ls-pink-deep'); fg=g('ls-text-white'); a,c=sorted([L(bg),L(fg)]); r=(c+.05)/(a+.05)
    bad+=r<4.5; print(t,bg,fg,round(r,2),'OK' if r>=4.5 else 'FAIL')
sys.exit(bad>0)
PY
```
**Files:** popup.css, manifest.json (1.0.40 → 1.0.41)
