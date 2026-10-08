# Focus Blossom — Ship Report v1.0.33

**Date:** 2026-04-19
**Stores:** Chrome Web Store · Firefox AMO · Edge Add-ons (uses chrome zip)
**Linus Gate:** ✅ **GO**

---

## Linus Gate decision

**GO.** Both pre-ship blockers from the audit were fixed. Security, privacy, manifest, CSP, permissions, and assets are all clean. Zips are lean (1.3MB / 202 files). Nothing is shipping that shouldn't ship.

### Blockers resolved

| # | Blocker | Fix |
|---|---|---|
| 1 | `build-zips.sh` was shipping `_cws/` (screenshot mock HTMLs with inline `<style>` that would violate the declared CSP during CWS review) | Rewrote `scripts/build-zips.sh` to stage via `rsync --exclude` — reliable recursive exclusion. Also excludes `BUGS_AND_ITERATIONS.md`, `generate_*.py`, `__pycache__`, `node_modules`, `.claude/`. |
| 2 | `blocked.html` lacked `<img src="mascot.png">` — violated CLAUDE.md Rule 3 ("ALWAYS include Sparky mascot in every UI") | Added `<img src="mascot.png" alt="Sparky — LoveSpark mascot" class="info-mascot">` to info-panel + styled in `blocked.css` as a subtle top-left decorative icon (38px, 0.85 opacity, pink drop shadow). |

---

## What shipped

### Build artifacts
| File | Size | Files | Manifest diff |
|---|---|---|---|
| `lovespark zips/chrome zips/focus-blossom-chrome.zip` | 1.3 MB | 202 | `browser_specific_settings` stripped |
| `lovespark zips/firefox zips/focus-blossom-firefox.zip` | 1.3 MB | 202 | Full manifest with gecko block |

### Excluded from zips
`.git/`, `.gitignore`, `.claude/`, `__pycache__/`, `node_modules/`, `.DS_Store`, `_cws/` (all screenshot prep + outputs), `BUGS_AND_ITERATIONS.md`, `generate_icons.py`, `generate_mascot.py`, `*.md.bak`, `*.log`

### Manifest summary
- **Name:** `__MSG_extName__` → Focus Blossom: Site Blocker & Digital Detox
- **Version:** 1.0.33
- **Manifest:** V3
- **Permissions:** `storage`, `alarms`, `notifications`, `declarativeNetRequest`
- **Host permissions:** `<all_urls>`
- **CSP:** `script-src 'self'; object-src 'self'; font-src 'self'`
- **Default locale:** `en` (55 locales present; see i18n coverage below)

---

## CWS listing assets — ready to upload

All images at `~/Claude x LoveSpark/Extensions/neurodivergent/focus-blossom/_cws/out/`.

### Screenshots (CWS requires ≥1, up to 5)
| File | Dimensions | Purpose |
|---|---|---|
| `01-blocked-garden.png` | 1280 × 800 | **Hero** — cherry blossom garden at "thriving garden" stage with Sparky, reddit.com 9-day streak |
| `02-popup-hero.png` | 1280 × 800 | Popup side-by-side with marketing copy: 4 gardens at different growth stages, growth speed 1.2x |
| `03-settings.png` | 1280 × 800 | Settings panel with feature highlights sidebar: friction levels, affirmations, export/import, themes |

All JPEG-equivalent quality as 24-bit PNG (no alpha) — CWS-compliant.

### Promo tiles
| File | Dimensions | CWS field |
|---|---|---|
| `promo-small.png` | 440 × 280 | Small promo tile |
| `promo-marquee.png` | 1400 × 560 | Marquee promo tile |

### Icons (shipped inside extension, not listing assets)
| File | Size | Dimensions |
|---|---|---|
| `icons/icon-16.png` | 196 B | 16×16 |
| `icons/icon-48.png` | 466 B | 48×48 |
| `icons/icon-128.png` | 1.1 KB | 128×128 |

---

## Suggested store-listing copy

### Short description (132 char max)
> Every blocked site grows a flower garden. The longer you resist, the more it blooms. 🌸

### Detailed description
```
Focus Blossom replaces doomscroll with a living garden.

Pick the sites that drain you — Reddit, TikTok, Twitter, YouTube — and block them. Each blocked site becomes a cherry blossom garden that grows the longer you stay away. Seed → sprout → bud → bloom → full garden.

Block more sites and they ALL grow faster. At 16 blocked sites, your gardens bloom at 2.5× speed.

When you try to unblock, your garden wilts — lose 50% of its growth. Choose your friction level: Low (just click), Medium (wait 10s), or High (wait 30s + type the domain).

✨ Features
🌸 Four growth stages with real cherry blossom animations
⚡ Speed multiplier — the more sites blocked, the faster all gardens grow
🔥 Daily streak tracking per garden
💕 Sparky, the LoveSpark mascot, waters your gardens for you
🎨 Four cozy themes: Retro Pink, Dark (LoveSpark Noir), Beige, Slate
🔔 Stage-up notifications (clickable — jumps to the garden)
💬 Daily affirmations on every blocked page
💾 Full export/import of your gardens and settings
♿ Respects prefers-reduced-motion, keyboard-navigable, screen-reader friendly

🔒 Privacy-first
Everything stays on your device. No accounts. No cloud. No analytics. No tracking. Not a single outbound network request. Open source under MIT on GitHub.

🧠 Designed for neurodivergent focus
Made by a neurodivergent self-taught dev for brains like ours. No dark patterns. No guilt. No nagging. Just a garden that grows when you choose to stay.

Part of the LoveSpark Suite — free, open-source, ad-free productivity tools.
```

### Category
**Productivity** (primary) · **Health & Fitness** (secondary if allowed)

### Single-purpose justification (for CWS form)
> Focus Blossom blocks user-chosen distracting websites and visualizes the resulting focus time as a growing flower garden. All blocking, tracking, and visualization happens locally on the user's device.

### Permission justifications
| Permission | Justification |
|---|---|
| `declarativeNetRequest` | Required to block user-chosen sites by redirecting them to the in-extension blocked.html page. Rules are added/removed as users block/unblock sites. |
| `storage` | Stores user-chosen sites, garden growth state, streaks, and settings locally. Nothing is transmitted off-device. |
| `alarms` | Periodic 5-minute tick credits growth time to active gardens; 60-minute tick updates daily streak counters. |
| `notifications` | Optional stage-up notifications ("🌸 Your garden is in full bloom!"). User can disable in settings. |
| `<all_urls>` host permission | Required by `declarativeNetRequest` to be allowed to redirect any site the user chooses to block. No content scripts are injected and no page data is read. |

### Privacy: data collection
**None.** Extension does not collect, transmit, or store any personally identifying information outside the user's local `chrome.storage.local`. No analytics, no telemetry, no outbound network requests. The `browser_specific_settings.gecko.data_collection_permissions.is_exempt = true` claim in manifest is accurate.

---

## Known non-blockers (tracked for post-ship)

From the pre-ship audit, these are documented but not blocking:

### 1. i18n coverage gap
54 of 55 non-English locales only have `extName` + `extDescription`. The 11 new runtime i18n keys (`statusUnblocked`, `labelStage`, `labelFlower`, `labelStreak`, `streakDisplay`, `btnUnblock`, `btnReblock`, `btnRemove`, `confirmUnblock`, `confirmRemove`, `dayLabel`) exist only in `en/messages.json`. Chrome auto-falls-back to `default_locale` so this is a **UX polish** item, not a CWS blocker.

**Suggested next-cycle task:** Run the 55 locales through automated translation for the new keys.

### 2. Hardcoded English strings in HTML
`blocked.html` static labels (Go Back, I need to visit this site..., Are you sure?, friction modal copy), `settings.html` (all labels), `background.js:65-71` stage-up notification messages, `garden-sprites.js:65-69` stage labels.

**Suggested next-cycle task:** Convert to `__MSG_*__` tokens or `data-i18n` attribute sweep.

### 3. Dead weight in `lib/`
~1.1 MB of unreferenced files inside the shipped zip:
- `lib/fonts/` (48 font files) — not referenced by any loaded CSS (actual fonts live in `fonts/`)
- `lib/lovespark-fonts.css` — not referenced
- `lib/lovespark-base.css`, `lib/lovespark-badge.js`, `lib/lovespark-lifecycle.js`, `lib/lovespark-popup.js`, `lib/lovespark-stats.js`, `lib/lovespark-theme.js` — unused; popup/settings only use `lovespark-tokens.css` and `lovespark-footer.{js,css}`
- `lib/browser-polyfill.min.js` (473 B) — not loaded

Removing them would cut the zip roughly in half. **Not blocking** — users won't notice, CWS doesn't reject for unused static assets.

**Suggested next-cycle task:** Audit `lib/` with a referenced-files grep and delete what isn't imported.

### 4. Uncommitted state
18 modified files + untracked `_cws/` and `lib/lovespark-tokens.css` in the focus-blossom repo. The zip captures the uncommitted state. Recommend committing before the CWS review completes so the repo and the shipped artifact match.

---

## Chrome Web Store form — exact values to paste

When filling the form right now:

| Field | Value |
|---|---|
| **Extension package** | Upload `lovespark zips/chrome zips/focus-blossom-chrome.zip` |
| **Localized screenshots** | Upload `01-blocked-garden.png`, `02-popup-hero.png`, `03-settings.png` (any order; 01 is the strongest hero) |
| **Global screenshots** | Same three images |
| **Global promo video** | (leave blank — optional) |
| **Small promo tile** | Upload `promo-small.png` |
| **Marquee promo tile** | Upload `promo-marquee.png` |
| **Category** | Productivity |
| **Language** | English (en) — + the 54 locales will be auto-detected from `_locales/` |
| **Description** | Paste the detailed description above |
| **Single purpose** | Paste the single-purpose justification above |
| **Permissions justification** | Paste the permission table above |
| **Privacy — data handling** | "This extension does not collect or transmit any user data." Check: no PII, no auth info, no financial info, no personal communications, no location, no web history, no user activity, no website content. |
| **Host permission justification** | "Required by declarativeNetRequest to redirect the user-chosen sites to the in-extension blocked page. No content scripts are injected, no page data is read or transmitted." |
| **Remote code** | "No — all code is bundled in the extension package." |

---

## Verification after upload

1. Load `focus-blossom-chrome.zip` unpacked in `chrome://extensions` (dev mode) and spot-check:
   - Popup renders with 4 themes
   - Block a test site → redirect works
   - Unblock friction modal → destruction animation plays
   - Stage-up notification fires (manual trigger via chrome://extensions → service worker → test)
2. Load `focus-blossom-firefox.zip` in Firefox via `about:debugging` → Load Temporary Add-on.
3. When CWS review completes, inspect the published listing to confirm screenshots rendered correctly (Chrome re-encodes PNGs; occasional color shift on gradients).

---

**Generated by LoveSpark ship-day swarm — 2026-04-19**
