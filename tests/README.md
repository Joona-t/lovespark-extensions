# Extension verification

Use Node 22 or newer. From the repository root:

```sh
npm ci
npm ci --prefix privacy/lovespark-adblock
npx playwright install chromium
npm test
python3 neurodivergent/lovespark-brain-dump/tests/test_popup_wiring.py
node productivity/lovespark-sponsor-skip/tests/check-package.js
FUNCTIONAL=1 CONTENT=1 npm run test:browser
```

`npm test` includes the existing JavaScript regression suites and manifest/resource validation for every extension. The adblock suite needs its separately locked dependencies.

The browser harness loads actual unpacked extensions one at a time with Chromium's extension debugging API, using a temporary profile. It opens declared popups/options/new-tab pages, selected dashboards, checks errors and resources, and saves screenshots plus `results.json` under ignored `work/browser-audit/`. It never uses a personal browser profile or publishes packages.

Environment options:

- `CHROMIUM_PATH`: optional path to a Chromium or Chrome for Testing executable that supports `Extensions.loadUnpacked` and `--enable-unsafe-extension-debugging`.
- `AUDIT_RUN`: output directory name beneath `work/`.
- `EXTENSIONS`: comma-separated extension folder names to test a subset.
- `FUNCTIONAL=1`: exercise theme choices and the selected popup workflows in `scripts/functional-scenarios.cjs`.
- `CONTENT=1`: exercise the content-script regressions in `scripts/content-scenarios.cjs`.

Example:

```sh
AUDIT_RUN=cookie-regression EXTENSIONS=i-dont-want-cookies CONTENT=1 npm run test:browser
```

Content tests use deterministic website/API response fixtures while running the extension's actual Chrome storage, messaging, content scripts and request rules. They validate regressions, not the current layout or behavior of every live website. Headless tests do not verify speech audio, all browser-toolbar gestures, Firefox compatibility, or store acceptance. The permissionless CWS helper intentionally keeps its theme only while open.

The repository's optional pre-commit `ls-check` gate still applies when installed; these tests supplement it. Audit findings and exact coverage are in [the audit record](../docs/audits/2026-10-24.md).
