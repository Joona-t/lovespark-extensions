# LoveSpark Reading Progress - Bugs and Iterations

## v1.0.0 (2026-03-23) - Initial Build

### Architecture Decisions
- **activeTab + storage + scripting** — Content script auto-injected on page load. Progress bar appears on any scrollable page (>1.5x viewport height).
- **Fixed 3px progress bar** — Top of page, z-index max. Pink gradient matching LoveSpark brand. Non-interactive (pointer-events: none).
- **Time-to-read estimate** — 238 WPM average. Shows "X% · Y min left" badge on scroll. Auto-hides after 2s.
- **Position persistence** — Saves scroll % per URL in local storage. 200-entry cap, 30-day prune.
- **Page completion tracking** — Counts as "read" when scroll reaches 90%. Prevents double-counting via in-memory Set.
- **Smart article detection** — Tries article/main/[role=main] selectors before falling back to body.
- **Popup shows recent pages** — SVG ring progress for each, title + hostname.
- **prefers-reduced-motion** — Disables transitions on progress bar and info badge.
- **DOM API only** — Zero innerHTML per KI-011.

### Known Limitations (V1)
- No resume-from-saved-position (shows bar but doesn't scroll back)
- No reading time history/charts
- No per-site enable/disable
- No custom bar position (top only)
- No dark mode for the info badge (always dark bg)

### Iteration Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-23 | Initial build | Expansion Agent Cycle 10 (resumed) |
