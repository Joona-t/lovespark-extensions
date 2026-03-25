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
