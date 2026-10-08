# Bugs & Iterations

## ITER-003 — 2026-10-08: ls-check cleanup (v1.0.1 → v1.0.2)

**Problem:** `ls-check` reported 8 failures: A11Y-KI006 (slider `outline: none`
with no focus replacement), A11Y-DIALOG (no `role="dialog"`/`aria-labelledby`),
A11Y-LABEL (emoji/symbol buttons `📊 Stats`, `⚙ Settings`, `← Back` without
aria-label), SEC-INNERHTML (`content.js` floating timer + block overlay built
via `innerHTML` template strings, interpolating the quote/stats), MV3-SETINTERVAL
(1s watch-time counter + 30s status poll in the content script), BRAND-SPARKY
(no mascot), BRAND-GRADIENT (hardcoded popup body gradient), BRAND-LIB-WIRED
(shared lib not loaded). Warnings for missing reduced-motion blocks too.
**Root cause:** Extension predates the shared-lib / brand / a11y gates and was
never brought onto `lovespark-shared-lib`.
**Fix:**
- Vendored the canonical shared lib into `lib/`; popup loads
  `../lib/lovespark-base.css` + `../lib/lovespark-theme.js`, calls
  `LoveSparkTheme.init()`; added a "Change Theme" dropdown top-right in the
  header, with `aria-expanded` synced via MutationObserver + Escape to close.
- Added `mascot.png` (Sparky) to the header with alt text; popup wrapped in a
  `role="dialog"` container labelled by the title/subtitle; aria-labels on nav,
  back button, sliders and the floating-timer toggle.
- Body background now `var(--ls-bg-gradient)`; `:focus-visible` outlines for
  the slider and buttons; `prefers-reduced-motion` blocks (scoped to our own
  `#dc-*` elements in the YouTube-injected CSS so YouTube itself is untouched).
- `content.js`: overlay + floating timer built with `createElement`/`append`
  via a tiny `h()` helper (text always as text nodes). The 1s counter is now
  driven by the video's `timeupdate` events accumulating wall-clock time
  (same 1s/5s-flush semantics, still skips hidden tabs); the 30s poll is
  replaced by `chrome.storage.onChanged` → `requestStatus()` (background writes
  every midnight-reset / override-expiry / settings transition to storage).
- No permissions added. Version bumped to 1.0.2.
**Files:** `popup/popup.html`, `popup/popup.css`, `popup/popup.js`,
`content.js`, `content-overlay.css`, `lib/*` (new), `mascot.png` (new),
`manifest.json`
**Commit:** (pending)

## BUG-002 — 2026-07-09: Google Fonts CDN dependency (privacy-first violation)

**Problem:** `shared/theme.css` line 1 `@import`ed Silkscreen/Nunito/Space Mono
from `fonts.googleapis.com`, and the manifest CSP allowlisted
`fonts.googleapis.com` (style-src) + `fonts.gstatic.com` (font-src). Every
popup/dashboard open made requests to Google's CDN — violating the LoveSpark
privacy-first rule (zero external requests). Same violation class fixed
earlier for lovespark-games.
**Root cause:** Fonts were wired up the quick way (CDN import) at initial
build, before the fleet-wide self-hosted-fonts pattern
(`lovespark-shared-lib/lovespark-fonts.css`) existed.
**Fix:** Self-hosted all three families under `shared/fonts/` (latin +
latin-ext woff2 subsets, 10 files, ~140 KB) declared via `@font-face` with
`font-display: swap` + `unicode-range`, following the shared-lib pattern.
Nunito is served by Google as one variable font regardless of requested
weight, so the four weights (400/600/700/800) were deduped to a single
`nunito-variable-*.woff2` per subset with `font-weight: 400 800`. CSP
tightened to `script-src 'self'; object-src 'self'; style-src 'self';
font-src 'self'`. Note: `content-overlay.css` (YouTube pages) references
Nunito/Silkscreen by family name only and never loaded the CDN import, so
its system-font fallback behavior on YouTube is unchanged. Version bumped
1.0.0 → 1.0.1.
**Files:** `shared/theme.css`, `shared/fonts/*` (new), `manifest.json`
**Commit:** (this one)

## GOV-001 — 2026-07-08: Missing README.md, LICENSE, and populated BUGS log

**Problem:** CLAUDE.md's repo rule requires a populated BUGS_AND_ITERATIONS.md
and README.md at every repo root; this repo shipped only the unfilled
template plus no README.md/LICENSE. Flagged in the fleet P2 governance-doc
scaffold sweep (meta_implementation.md).
**Root cause:** The repo was built and committed in a single initial commit
(2026-03-17, `6f55142`) before the governance-doc requirement was
standardized fleet-wide, and no iteration history existed to backfill from.
**Fix:** Added `README.md` (feature list, file layout, dev-install steps,
privacy statement) and `LICENSE` (MIT, matching the fleet-standard text used
across other LoveSpark extension repos). Backfilling further entries as
future bugs/iterations land.
**Files:** `README.md` (new), `LICENSE` (new)
**Commit:** (this one)

## 2026-03-17: Initial commit

**Problem:** N/A — initial build.
**Fix:** YouTube watch-time limiter with streaks/gamification shipped as a
single commit: manifest, background service worker, content script +
overlay, popup, stats dashboard, shared constants/utils.
**Files:** all
**Commit:** `6f55142`
