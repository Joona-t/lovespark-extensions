# LoveSpark Read Aloud - Bugs and Iterations

## v1.0.0 (2026-03-21) - Initial Build

### Architecture Decisions
- **No Readability.js dependency** - Built custom article extractor (content/reader.js) instead of Mozilla Readability. Simpler, no external dependency, full control over extraction logic.
- **On-demand content script injection** - Scripts injected via scripting API only when user activates. Zero performance impact on pages where Read Aloud isn't used.
- **Minimal permissions** - storage + activeTab + scripting. No `<all_urls>`, no `tabs`.
- **Web Speech API only** - All TTS processing is local via browser-native SpeechSynthesis. No server, no data collection.

### KI Compliance Checklist
- [x] KI-001: No white text on --ls-pink-accent (using --ls-pink-deep for buttons)
- [x] KI-005: popup.html has role="dialog" with aria-labelledby + aria-describedby
- [x] KI-006: All interactive elements have :focus-visible rules
- [x] KI-007: All buttons and controls have min-height: 32px
- [x] KI-008: prefers-reduced-motion media query in popup.css and highlighter.css
- [x] KI-011: No innerHTML usage (DOM API methods only)
- [x] KI-012: All storage uses chrome.storage.local consistently
- [x] KI-013: Theme dropdown has aria-expanded + aria-haspopup
- [x] KI-015: Dynamic content has aria-live="polite" (progress, stats, status)
- [x] KI-016: All inputs have aria-label attributes
- [x] KI-020: No setTimeout for storage writes in service worker
- [x] KI-021: No empty catch blocks (all log with context)
- [x] KI-026: No CDN font links (using local lovespark-fonts.css)
- [x] KI-027: CSP in manifest.json
- [x] KI-029: No setInterval in content scripts
- [x] KI-031: sendMessage wrapped in try/catch (sendBg helper, safeSendMessage pattern)


## 2026-03-28: Fleet-wide automation regression — broken CSS variables + missing footers

**Problem:** A post-swarm-audit automation run injected `lovespark-tokens.css` and `lovespark-base.css` into popup.html, and replaced `--ls-pink-accent` with undefined `--ls-btn-bg` in popup.css. This broke toggle colors (rendered transparent) and changed disabled opacity from 0.4 to 0.9. Footer buttons were also missing from 26 extensions.
**Root cause:** Batch automation (`sync-shared-lib.sh` or swarm pass) overwrote extension CSS without validating variable definitions. The `--ls-btn-bg` variable was never defined in any CSS file.
**Fix:** Reverted all 76 git repos to last committed state. Fixed 3 extensions (cookie-nuke, breathe, planner) that had the bug baked into commits. Added footer buttons (LoveSpark Suite, Ko-fi, Report a Bug) to all 26 missing extensions. Updated shared lib footer to make LoveSpark Suite a proper link to lovespark.love. Deployed `guard-fleet-sync.sh` — 4-gate pre-sync validator that blocks automations introducing undefined CSS variables.
**Files:** popup.css, popup.html, lib/lovespark-footer.js, lib/lovespark-footer.css
**Commit:** fleet-wide fix, multiple commits
