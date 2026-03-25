# LoveSpark Habit Garden - Bugs and Iterations

## v1.0.0 (2026-03-21) - Initial Build

### Architecture Decisions
- **storage + alarms only** - Simplest possible permission surface. No content scripts, no host permissions.
- **Plant growth stages** - 6 stages based on streak length: Seed (0), Sprout (1-2), Seedling (3-6), Flower (7-13), Blossom (14-29), Tree (30+)
- **Daily reset via alarm** - Hourly alarm checks for day change. Streak breaks if yesterday wasn't completed.
- **Max 12 habits** - Prevents grid overflow in popup. V2 could add scrolling/pagination.
- **DOM API only** - el() helper for building cards. Zero innerHTML per KI-011.

### KI Compliance
- [x] KI-001: Using --ls-pink-deep for btn-add (not --ls-pink-accent)
- [x] KI-005: role="dialog" + aria-labelledby + aria-describedby
- [x] KI-006: :focus-visible on all interactive elements including habit cards
- [x] KI-007: All buttons min-height 32px+
- [x] KI-008: prefers-reduced-motion wraps all animations
- [x] KI-011: No innerHTML — using el() DOM helper
- [x] KI-012: All storage uses chrome.storage.local
- [x] KI-013: Theme dropdown has aria-expanded + aria-haspopup
- [x] KI-015: Stats have aria-live="polite"
- [x] KI-016: Input has aria-label
- [x] KI-020: No setTimeout for storage writes (alarms for daily reset)
- [x] KI-021: No empty catch blocks
- [x] KI-026: No CDN links
- [x] KI-027: CSP in manifest
- [x] KI-031: sendMessage wrapped in try/catch (sendBg helper)
