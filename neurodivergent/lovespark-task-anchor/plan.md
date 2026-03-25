# Task Anchor — Implementation Plan

## Architecture

```
manifest.json          → MV3, storage permission, content_scripts on <all_urls>
background.js          → Service worker: message hub, stats, daily reset, badge
popup.html/css/js      → Task input, enable toggle, stats, settings, theme dropdown
content.js             → Banner injection via DOM on every page
content.css            → Scoped banner styles (ls-task-anchor prefix)
lib/                   → LoveSpark shared lib (base CSS, theme, stats, badge, popup, lifecycle)
```

## Data Flow

```
User types task in popup → SET_TASK message → background saves to storage
Content script listens to storage.onChanged → shows/hides banner
Content script sends NUDGE_SHOWN → background bumps stat counter
Popup sends GET_STATS → background returns current stats
```

## Storage Schema (chrome.storage.local)
- `currentTask` (string) — the pinned task text
- `isEnabled` (boolean) — whether banner is active
- `bannerPosition` (string) — "top" or "bottom"
- `autoHide` (number) — seconds before auto-dismiss (0 = never)
- `taskanchorToday` (number) — nudges shown today
- `taskanchorTotal` (number) — nudges shown all-time
- `lastResetDate` (string) — YYYY-MM-DD for daily reset

## Implementation Checklist
- [x] Scaffold via scaffold-extension.py
- [x] manifest.json — MV3, content_scripts, storage permission
- [x] background.js — message handler, stats accumulator, badge updates
- [x] popup.html — task input, toggle, stats, settings panel, theme dropdown
- [x] popup.css — full styling with focus indicators, reduced motion
- [x] popup.js — event handlers, stat display, theme init
- [x] content.js — banner creation, show/hide, storage listener, dismiss
- [x] content.css — scoped banner styles, position variants, reduced motion
- [x] Review: verify a11y (ARIA, contrast, keyboard nav, focus indicators)
- [x] Review: verify no bugs in message flow
- [x] Fix: close button touch target 28px -> 32px (content.css)
- [ ] Run ls-check quality pipeline
