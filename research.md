# Extension fleet audit — 2026-10-24

## Verified starting point
- Consolidated repository contains 114 extension manifests; README's 116 entries also include two infrastructure tools.
- Screenshot has 22 listings: 20 distinct extension projects (19 in the monorepo plus the recovered Link Cleaner), two listings named Are You Cooked?, and the LoveSpark Retro Pink browser theme, excluded at the user’s request because its source was not found.
- Source versions differ from several store versions. Tests describe this checkout, not installed store binaries.
- Existing tests: Node suites for adblock, Sponsor Skip, site notes, YouTube Shield, doomscroll, dark-mode reader; Python popup checks for brain dump.
- Repository's Sponsor Skip workflow tests actual unpacked extensions via Chromium DevTools `Extensions.loadUnpacked` in an isolated temporary profile. Fleet audit will extend that workflow using the installed Playwright Chromium.
- `ls-check`, Bun, and the referenced external LoveSpark scripts/docs are unavailable here. Report that gap; do not claim those gates ran.
- Atlas audit URL was attempted but unavailable.

## Browser references
- https://playwright.dev/docs/chrome-extensions — persistent Chromium contexts and real extension loading.
- https://developer.chrome.com/docs/extensions/develop/concepts/service-workers/lifecycle — persisted state and restart resilience.

## Scope
Run manifest/resource validation and real Chromium load/page checks across all 115 manifests after restoring Link Cleaner. Prioritize functional interactions, persistence, disabled-state behavior and security review for the 20 screenshot projects. Capture exact failures before editing and re-run regressions after repairs. No Web Store publishing is part of this audit.

## Recovered source

Link Cleaner was verified in its archived upstream repository and restored to `privacy/lovespark-link-cleaner`; it is distinct from UTM Stripper. See its UPSTREAM.md for the exact source commit. The consolidated repository started with 114 manifests and now has 115.
