# Task Anchor — Research

## Problem Statement
The #1 ADHD developer complaint: "I opened a new tab to look something up and 20 minutes later I forgot what I was doing." Context-switching destroys focus for neurodivergent developers.

## Existing Solutions
- **Tab title modifiers** — change the tab title; easily lost in many tabs
- **Sticky notes apps** — separate app, not integrated into browsing flow
- **Browser new-tab replacements** — only show on new-tab page, not on every page
- **Focus mode extensions** — block sites but don't remind you of your task

## Our Approach
A persistent mini-banner injected via content script on every page. Shows the current task as a gentle nudge. Key differentiators:
- **Always visible** — appears on every page, not just new tabs
- **Non-intrusive** — small banner, dismissible, auto-hide option
- **Persistent across tabs** — stored in chrome.storage.local
- **Stats tracking** — count how many times the nudge helped you stay on track

## Technical Requirements
- Manifest V3, content_scripts on `<all_urls>`
- Banner injected via DOM, styled with scoped CSS (no conflict with host pages)
- Settings: banner position (top/bottom), auto-hide delay, enable/disable toggle
- Stats: daily + total nudge count with daily reset
- LoveSpark shared lib for popup UI (themes, badges, stats, lifecycle)
- No data collection, all local storage

## Risk Assessment
- **z-index conflicts** — mitigated by using max z-index (2147483647)
- **SPA navigation** — content script runs at document_idle, storage.onChanged listener handles updates
- **Performance** — single DOM element, minimal overhead
- **Permission scope** — `<all_urls>` required for content script injection; `storage` for persistence
