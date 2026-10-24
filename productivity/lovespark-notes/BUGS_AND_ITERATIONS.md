# Bugs & Iterations

## 2026-10-24 — Published screenshot Chromium audit (1.0.42 → 1.0.43)

- Package the local font stylesheet and the font files it references so the UI renders without missing assets or remote font requests.
- Reopen recent saved popup drafts even after automatic title generation; preserve explicit titles and skip deleted notes. Replace remote fonts with bundled assets.

Validation: manifest/resource checks, actual unpacked Chromium load and UI checks, with interaction/content regressions where applicable. See [the audit record](../../docs/audits/2026-10-24.md) for per-extension coverage and limitations.
