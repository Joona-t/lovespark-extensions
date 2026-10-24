# BUGS_AND_ITERATIONS — LoveSpark CWS Filler

## ITER-001 — Initial build (2026-06-20)
**What:** Companion extension for the CWS Submission Autopilot. In-page overlay
on the CWS dashboard that fills text fields from a `cws-listing.json`.
**Why:** The Playwright filler (`scripts/cws-autofill.py`) needs a separate
logged-in automation session, which is the higher-risk path under CWS terms and
requires a one-time Google login + calibration. This runs in the browser the
developer is already logged into — the lower-risk fallback Joona asked for ("both
engines").
**Design decisions:**
- Adaptive field finding by accessibility label / aria / nearby text — no fixed
  CSS selectors, because Google's dashboard classes are obfuscated and churn.
- Framework-safe value setting (native setter + `input`/`change` events) so the
  dashboard's Angular/Polymer model registers programmatic fills.
- Zero permissions; content script scoped to `devconsole/*`; no network/storage.
- Images, the Category dropdown, and the final Submit click stay manual
  (browser security / non-native menu / human-in-loop by design).

## Open / known limitations
- **Live DOM not yet verified.** The label-matching needs to be confirmed against
  the real CWS dashboard (Phase 0 spike, same as cws-autofill.py). Field labels
  may need tuning once observed live.
- **Icons are placeholders** (copied from lovespark-calm) — rebrand before any
  store/public listing. This is an internal dev tool, not a CWS submission.
- **OpenDyslexic** falls back to system rounded unless installed on the machine;
  the font is not vendored to keep the package tiny.

## 2026-10-24 — Chromium fleet audit (0.1.1 → 0.1.2)

- Keep this permissionless helper’s theme in memory instead of calling unavailable chrome.storage APIs; no permission is added.

Validation: manifest/resource checks, actual unpacked Chromium load and UI checks, with interaction/content regressions where applicable. See [the audit record](../../docs/audits/2026-10-24.md) for per-extension coverage and limitations.
