# Bugs & Iterations Log

## 2026-04-10 — Strict audit fixes (v1.0.17)

- **Problem:** `#lowVolumeValue` and `#shortcutValue` lacked `aria-live` attributes for dynamic content updates.
  - **Root cause:** Original HTML omitted ARIA live regions on dynamically-updated spans.
  - **Fix:** Added `aria-live="polite"` to both elements.

- **Problem:** Body background used hardcoded gradient instead of `--ls-bg-gradient`.
  - **Root cause:** Options page predated shared lib integration.
  - **Fix:** Replaced inline gradient with `var(--ls-bg-gradient)`.

- **Problem:** 11 shared lib files synced but not referenced in options.html.
  - **Root cause:** Options page was built standalone without shared lib integration.
  - **Fix:** Added `<link>` and `<script>` tags for all shared lib files.

- **Problem:** `chrome.tabs.query` and `chrome.tabs.sendMessage` used without `tabs` permission.
  - **Root cause:** Missing permission declaration in manifest.json.
  - **Fix:** Added `"tabs"` to permissions array.

- **Problem:** LICENSE file missing.
  - **Fix:** Added MIT LICENSE file.

- **Problem:** BUGS_AND_ITERATIONS.md missing.
  - **Fix:** Created this file.
