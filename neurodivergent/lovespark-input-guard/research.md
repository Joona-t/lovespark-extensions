# Input Guard Research — Audit of Existing v1.0.1

## Summary

lovespark-input-guard already has a complete implementation (April 11-12, 2026):
- content.js: auto-saves inputs with debounced `input` event + MutationObserver for dynamic fields
- background.js: handles stats, entries CRUD, settings via LoveSparkLifecycle message handler
- popup.html/js/css: shows stats, entry cards with copy/delete, clear-all with confirm
- settings.html/js/css: sliders for debounce, min length, max entries, max age
- Shared lib wired up: theme, badge, stats, popup, lifecycle

## KI Compliance (checked all 31 known issues)

PASS: KI-001 (no white-on-accent), KI-005 (role=dialog), KI-006 (focus-visible), KI-008 (reduced-motion), KI-011 (no innerHTML), KI-012 (storage.local only), KI-013 (aria-expanded), KI-014 (aria-labels), KI-015 (aria-live on stats), KI-018 (no aria-live on cuteMsg), KI-020 (no setTimeout deferral in SW), KI-026 (local fonts), KI-027 (CSP present), KI-029 (MutationObserver), KI-031 (safeSend wrapper)

## Bugs Found

### BUG-1: Entry key collision across pages (data loss)
**Severity: Critical**
`content.js:37` — Key is `hostname + '::' + fieldId(el)`. Two different pages on the same site with same input structure overwrite each other. E.g., typing in GitHub issue #123 comment, then navigating to issue #456 — first comment is lost because both produce `github.com::textarea#new_comment_field`.

Fix: Include `location.pathname` in the key.

### BUG-2: Sensitive fields not excluded (privacy risk)
**Severity: High**
`content.js:82-89` — Only excludes `type="password"` and `type="hidden"`. Fields with `autocomplete="cc-number"`, `cc-csc`, `cc-exp`, `ssn`, etc. are captured. Credit card numbers and SSNs would be saved to local storage in plaintext.

Fix: Check `el.autocomplete` for sensitive values and exclude them.

### BUG-3: Silent catch block (KI-021 violation)
**Severity: Medium**
`content.js:69` — `catch (_err) {}` swallows all errors on sendMessage. Should log.

### BUG-4: Settings header font-size too large
**Severity: Low**
`settings.css:33` — `.header-title` is 18px with Press Start 2P. Brand docs say 10-12px for this font. At 18px it's enormous and looks broken.

### BUG-5: Unnecessary CSP directive
**Severity: Cosmetic**
`manifest.json:24` — `font-src 'self'` in extension_pages CSP. MV3 only allows overriding `script-src` and `object-src`. Chrome ignores the extra directive but it's misleading.

## Architecture Assessment

The implementation is solid. Uses correct patterns:
- MutationObserver (not setInterval) for dynamic fields
- Direct storage writes (not debounced in SW)
- safeSend wrapper for popup->background messages
- Proper ARIA, focus indicators, reduced motion
- All 4 themes supported via shared lib tokens

The 5 bugs above are the only issues. BUG-1 and BUG-2 are the critical/high-priority ones.
