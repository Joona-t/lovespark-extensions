# Published screenshot extension verification

The allowlist in `scripts/published-scope.cjs` contains only the 16 published Chrome Web Store screenshot extensions whose source was found. Browser and manifest checks default to that list. `EXTENSIONS` can narrow it further but cannot select an out-of-scope project.

Use Node 22 or newer. From the repository root:

```sh
npm ci
npm ci --prefix privacy/lovespark-adblock
npx playwright install chromium
npm test
FUNCTIONAL=1 CONTENT=1 npm run test:browser
```

`npm test` runs 16 manifest/resource checks and the 16 existing JavaScript tests found in the scoped projects. The adblock suite needs its separately locked dependencies.

The browser harness installs actual unpacked extensions one at a time in a disposable Chromium profile. It opens declared popup/options pages and selected dashboards, checks errors and resources, exercises selected interactions and saves screenshots plus `results.json` beneath ignored `work/browser-audit/`.

Environment options:

- `CHROMIUM_PATH`: optional path to Chromium or Chrome for Testing supporting `Extensions.loadUnpacked` and `--enable-unsafe-extension-debugging`.
- `AUDIT_RUN`: output directory name beneath `work/`.
- `EXTENSIONS`: comma-separated folder names from the published-project allowlist.
- `FUNCTIONAL=1`: theme, enable-switch, timer, note, site-list and game scenarios.
- `CONTENT=1`: content-script regressions with deterministic website/API fixtures and real extension APIs.

Example:

```sh
AUDIT_RUN=cookie-regression EXTENSIONS=i-dont-want-cookies CONTENT=1 npm run test:browser
```

These tests use no personal browser profile and publish nothing to the Web Store. Fixtures do not prove effectiveness on every live website. Long-running suspension, every browser-toolbar gesture and Firefox are outside this run's coverage. `ls-check` remains an additional gate when available.

See the [audit record](../docs/audits/2026-10-24.md) for per-extension findings and limits.
