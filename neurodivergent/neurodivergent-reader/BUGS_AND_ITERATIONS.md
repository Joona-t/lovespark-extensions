# Bugs & Iterations

## : |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)

**Problem:** |2026-03-05|||fix: theme title text visibility on beige (#4a7c59 earthy green) and slate (#d4714e terracotta)
**Files:** manifest.json,popup/popup.css,settings/settings.css
**Commit:** 04028aa

## : |2026-03-06|||fix: WCAG AA compliance — contrast, keyboard nav, ARIA, touch targets

**Problem:** |2026-03-06|||fix: WCAG AA compliance — contrast, keyboard nav, ARIA, touch targets
**Details:** - Fix white-on-pink contrast failures: title/card text now uses --ls-text-dark
- Darken --ls-text-muted from #9E4D6E to #783850 for 4.5:1+ contrast
- Remove opacity on footer text that degraded contrast below AA
- Add full keyboard navigation to theme dropdown (arrows, Enter, Escape)
- Add aria-expanded, aria-haspopup, role=listbox/option to theme dropdown
**Files:** lib/lovespark-footer.css,manifest.json,popup/popup.css,popup/popup.html,popup/popup.js
**Commit:** 384f639

## : |2026-03-08|||fix: storage API mismatch causing all features to be non-functional + a11y fixes

**Problem:** |2026-03-08|||fix: storage API mismatch causing all features to be non-functional + a11y fixes
**Details:** Content scripts read from storage.sync while popup/SW wrote to storage.local,
so features never activated (caused Chrome Web Store rejection). Also fixes
ARIA roles, aria-live, focus ring tokens, touch targets, and KI-001 contrast.
**Files:** content/agents/ContentOrchestrator.js,lib/lovespark-base.css,manifest.json,popup/popup.css,popup/popup.html
**Commit:** 55e9612

## : |2026-03-05|||fix: replace broken footer with aesthetic ls-footer

**Problem:** |2026-03-05|||fix: replace broken footer with aesthetic ls-footer
**Files:** lib/lovespark-base.css,lib/lovespark-footer.css,lib/lovespark-footer.js,manifest.json,popup/popup.html
**Commit:** 7041047

## : |2026-03-08|||fix: stale comments and ARIA role correction

**Problem:** |2026-03-08|||fix: stale comments and ARIA role correction
**Details:** - ContentOrchestrator comment: storage.sync → storage.local
- settings.js comment: sync rate limits → write storm avoidance
- popup: role="alertdialog" → role="dialog" (non-modal panel)
- Remove aria-live from cute-msg (cosmetic rotating text, not status)
**Files:** content/agents/ContentOrchestrator.js,popup/popup.html,settings/settings.js
**Commit:** 720cafb

## : |2026-02-28|||Fix font override not applying — invalid :not(svg *) selector

**Problem:** |2026-02-28|||Fix font override not applying — invalid :not(svg *) selector
**Details:** :not(svg *) uses a descendant combinator inside :not() which is
invalid CSS. Browsers silently dropped the entire rule, so no font
override was applied. Changed to :not(svg).
**Files:** content/agents/StyleAgent.js
**Commit:** 97b1a16

## : |2026-03-08|||fix: KI-001 and KI-008 in shared footer — pink-accent bg + missing reduced-motion

**Problem:** |2026-03-08|||fix: KI-001 and KI-008 in shared footer — pink-accent bg + missing reduced-motion
**Details:** Ko-fi button used --ls-pink-accent with white text (fails 4.5:1 contrast).
Changed to --ls-pink-deep. Added prefers-reduced-motion for footer transitions.
Bumped version to 1.0.8.
**Files:** lib/lovespark-footer.css,manifest.json
**Commit:** b468030

## : |2026-02-28|||Fix 11 bugs from Carmack audit: rate limits, stale DOM, accessibility

**Problem:** |2026-02-28|||Fix 11 bugs from Carmack audit: rate limits, stale DOM, accessibility
**Details:** - Storage sync rate limit: enforce 500ms MIN_WRITE_GAP in popup + settings
- FocusAgent: isConnected checks in rAF mouseover callback
- DistractionAgent: epoch guard prevents stale rAF after disable
- Popup: clear setInterval on beforeunload, defensive ensureInjected
- Popup: disable site button on non-injectable tabs (chrome://, etc.)
**Files:** content/agents/ContentOrchestrator.js,content/agents/DistractionAgent.js,content/agents/FocusAgent.js,content/message-bus.js,popup/popup.css
**Commit:** bf24a17

## : |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu

**Problem:** |2026-03-05|||Fix theme dropdown: add missing CSS styles for styled dropdown menu
**Files:** manifest.json,popup/popup.css
**Commit:** df7d857

<!-- Format:
## YYYY-MM-DD: Short Title

**Problem:** What went wrong or needed changing
**Root cause:** Why it happened
**Fix:** What was done to resolve it
-->
