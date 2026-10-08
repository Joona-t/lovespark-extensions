# Task Anchor — Implementation Plan

## Architecture

```
manifest.json          → MV3, storage permission, content_scripts on <all_urls>
background.js          → Service worker: task state, nudge stats, badge, settings
popup.html/css/js      → Task input/display, enable toggle, stats, settings link, theme
content.js             → Banner injection via DOM on every page
content.css            → Scoped banner styles (ls-task-anchor prefix, !important isolation)
settings.html/js       → Banner position, auto-hide configuration
lib/                   → LoveSpark shared lib (base CSS, tokens, theme, stats, badge, popup, lifecycle)
```

## Data Flow

```
User types task in popup → SET_TASK message → background saves to storage
Content script listens to storage.onChanged → shows/hides banner
Content script sends NUDGE_SHOWN → background bumps stat counter (direct write, no accumulator)
User clicks "Done" on banner → COMPLETE_TASK → background clears task + increments completed
Popup sends GET_STATS → background returns current stats
Settings sends SAVE_SETTINGS → background updates config → content script reacts via onChanged
```

## Storage Schema (chrome.storage.local)
- `currentTask` (string) — the pinned task text
- `isEnabled` (boolean) — whether banner is active
- `bannerPosition` (string) — "top" or "bottom"
- `autoHide` (number) — seconds before auto-dismiss (0 = never)
- `taskanchorToday` (number) — nudges shown today
- `taskanchorTotal` (number) — nudges shown all-time
- `tasksCompleted` (number) — tasks marked done all-time
- `lastResetDate` (string) — YYYY-MM-DD for daily reset

## KI Compliance
- KI-001: --ls-pink-deep for button backgrounds, not --ls-pink-accent
- KI-005: role="dialog" on popup containers
- KI-006: :focus-visible on all interactive elements
- KI-008: prefers-reduced-motion media query
- KI-011: No innerHTML — createElement + textContent only
- KI-012: All storage via chrome.storage.local (no sync)
- KI-013: aria-expanded on theme dropdown
- KI-015: aria-live on dynamic counters
- KI-020: Direct storage writes in SW, no setTimeout-based accumulator
- KI-021: All catch blocks log with context
- KI-026: No CDN fonts — system font stack
- KI-027: CSP in manifest
- KI-029: No setInterval in content scripts
- KI-031: sendMessage wrapped in try/catch

## Implementation Checklist
- [x] manifest.json — MV3, content_scripts with CSS, CSP, gecko
- [x] background.js — task management, direct-write nudge stats, badge
- [x] popup.html — task input/display, toggle, stats, settings link, theme dropdown
- [x] popup.css — full styling with focus indicators, reduced motion
- [x] popup.js — event handlers, stat display, theme init, aria-expanded
- [x] content.js — banner creation via DOM API, storage listener, dismiss/done
- [x] content.css — scoped styles with position variants, done button, reduced motion
- [x] settings.html — banner position dropdown, auto-hide timer
- [x] settings.js — load/save settings
- [x] Run ls-check quality pipeline
