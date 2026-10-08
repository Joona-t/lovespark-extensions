# Changelog — LoveSpark Brain Dump

## 1.0.36 — 2026-10-07 — Fix dead theme dropdown (BUG-001)
- `popup.html` used `id="themeDropdownTrigger"` / `id="themeDropdownMenu"`, but the shared `lib/lovespark-theme.js` wires `#themeToggle` / `#themeMenu` — so `init()` found neither and the "Change theme" button did nothing. IDs now match the canonical fleet markup (CSS classes unchanged).
- Added `tests/test_popup_wiring.py` regression test (`python3 -m unittest discover -s tests`).

## 1.0.35 — 2026-07-08 — Fleet token re-sync (P2-sync-3)
- Version bump only — shared-lib tokens were already synced to canonical (KI-002/003/004 contrast fix) in a prior commit; this entry closes the QUAL-CHANGELOG-DRIFT gap and rebuilds the store zips against the current version.

## 1.0.6
- Shared library sync (footer, fonts, lifecycle updates)
- CWS submission preparation

## 1.0.5
- 7-day auto-pruning of old thoughts
- Shared library integration (lovespark-base.css, theme, badge, stats, popup, lifecycle)

## 1.0.4
- LoveSpark shared footer component
- Keyboard shortcut: Enter to dump thought
- 280 character limit on thoughts

## 1.0.3
- Accessibility improvements: aria-live regions, aria-pressed on tag buttons
- Contrast audit passing all 80 checks across 4 themes
- Added mascot to popup header

## 1.0.2
- Added tag system: Do / Think / Feel categorization
- Delete individual thoughts
- Clear today's dump button

## 1.0.1
- Daily reset for thought list
- Animated stat counters
- Theme support (Retro Pink, Dark Noir, Warm Beige, Cool Slate)

## 1.0.0
- Initial release
- Quick-capture thoughts with Enter key
- Local storage only — no data collection
- Today / total dump counters
- Empty state with brain emoji
