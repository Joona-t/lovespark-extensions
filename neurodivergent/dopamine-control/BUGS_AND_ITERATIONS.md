# Bugs & Iterations

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

## 2026-10-24 — Chromium fleet audit (1.0.1 → 1.0.2)

- Move inline popup/dashboard styling and dashboard JavaScript into local files to comply with the existing strict CSP.

Validation: manifest/resource checks, actual unpacked Chromium load and UI checks, with interaction/content regressions where applicable. See [the audit record](../../docs/audits/2026-10-24.md) for per-extension coverage and limitations.
