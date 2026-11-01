# BUGS_AND_ITERATIONS -- LoveSpark Quick Save

## v1.0.0 (2026-03-25)

### Initial Release
- One-click save current page URL + title to local storage
- Popup shows saved links list (max 50), click to open, delete button to remove
- Stats tracking: saves today / total saves with animated counters
- 4 themes (Retro Pink, Dark, Beige, Slate)
- Sparky mascot, WCAG AA focus indicators, prefers-reduced-motion
- Zero innerHTML -- all DOM built via createElement API
- Permissions: storage only

## v1.0.1 (2026-10-08)

### ls-check cleanup
- **Failure:** `PERM-MISSING` — `chrome.tabs.query` used in popup.js but no tab permission declared.
- **Root cause:** manifest declared only `storage`. Without `tabs` or `activeTab`, `tabs.query` returns tabs with `url`/`title` undefined, so "Save This Page" stored empty entries — a real functional bug, not just a lint hit.
- **Fix:** added `activeTab` (narrower than `tabs`; the popup is opened by the user clicking the action, which grants activeTab for the current tab). Added matching row to PRIVACY.md. Bumped version 1.0.0 → 1.0.1.
- ls-check now: 34 pass, 0 fail (4 pre-existing warnings: A11Y-LIVE, SEC-SENDMSG, QUAL-LICENSE, QUAL-GITIGNORE).
