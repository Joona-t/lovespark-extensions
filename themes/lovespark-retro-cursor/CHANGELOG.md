# Changelog

All notable changes to LoveSpark Retro Cursor Pack.

## [1.1.36] - 2026-07-08
- **"Alive" update**: every Y2K pack now has 2-3 animated companion assets in the
  cyber-butterfly style (SMIL — animates while the cursor moves in Chrome; perfect
  static rest pose in Firefox). Hopping bunnies + bobbing carrot (honey-bunny),
  twinkle-pop sparkles + beating chrome heart (cyworld-dotti), fluttering bow tails +
  drifting pearls (coquette-ribbon), wiggling strawberries + dripping milk droplet
  (strawberry-milk), shimmer-pulsing pearls (glossy-pearl), rising boba bubbles
  (bubble-boba), swinging star charm (phone-charm), beating locket + floating hearts
  (heart-locket), and butterflies on the hand cursor (cyber-butterfly parity).
- Companions added to arrow, hand, and emoji default cursors; I-beam and wait cursors
  unchanged. OG PNG packs (retro-pink, sakura-peach, starlight-purple) intentionally
  untouched.
- cyworld-dotti's old 1.7s sparkle superseded by the new twinkle+pop set,
  dark-outlined (#5A2A4A) so sparkles read on light pages.

## [1.1.35] - 2026-06-28
- **Fix**: selecting a different cursor now applies instantly on all open tabs instead of only after a page refresh. The live-apply `storage.onChanged` listener was guarding on the wrong storage area (`sync`) while all writes go to `local`.
- Simplified the settings path: the popup writes directly to `storage.local` (removed the dead popup→background message relay), and the popup's selected-pack tracking no longer races against initial load.

## [1.1.34] - 2026-06-28
- **Store title**: renamed to "Aesthetic Pink Retro Cursor Pack by LoveSpark" (45 chars) — adds the high-intent "aesthetic" search keyword while keeping the brand at the tail. Updated `extName` across all 55 locales, `action.default_title`, and the popup tab title.

## [1.1.32] - 2026-05-05
- **Y2K Korean Collection**: replaced 7 New Collection SVG packs with 9 Y2K Korean themed packs in dual variants (Emoji + Pointer subcategories) — 18 new pack registrations, 21 packs total.
- New packs: Honey Bunny (꿀토끼), Cyworld Dotti (싸이월드), Coquette Ribbon (리본), Strawberry Milk (딸기우유), Glossy Pearl, Bubble Boba (버블티), Phone Charm (폰꽂이), Heart Locket (하트 로켓), Cyber Butterfly (나비).
- Removed: Moonlight Rose, Candy Floss, Cyber Cherry, Mint Blossom, Golden Hour, Holographic, Obsidian Heart (off-brand palette and flat icon style).
- Popup nav restructured into OG / Y2K Korean → Emoji + Pointer collapsible groups using native `<details>` for keyboard accessibility.
- Storage migration: stale New Collection pack IDs auto-fall-back to retro-pink on upgrade.
- Per-cursor-type hotspot map: Pointer variants use traditional offsets, Emoji variants center on the icon.

## [1.1.20] - 2026-04-09
- Shared lib sync and fleet audit compliance

## [1.1.19] - 2026-04-07
- Swarm audit: bundle fonts locally, add CSP, fix security + performance + reliability

## [1.1.18] - 2026-03-28
- Add bug report button to shared footer

## [1.1.17] - 2026-03-12
- Bump version, add browser-polyfill.min.js

## [1.1.16] - 2026-03-07
- Add MIT license

## [1.1.15] - 2026-03-04
- Fix: replace broken footer with aesthetic LoveSpark footer
- Add author credit and Ko-fi footer

## [1.1.14] - 2026-03-04
- Fix: theme title text visibility on beige and slate themes

## [1.1.13] - 2026-02-26
- Fix theme dropdown: add missing CSS styles for styled dropdown menu

## [1.1.12] - 2026-02-26
- Replace theme cycling button with dropdown menu

## [1.1.11] - 2026-02-24
- Production audit fixes: gecko block, mascot, permissions, storage.local migration

## [1.1.10] - 2026-02-23
- Bump version for i18n localization update
- Add i18n localization support (55 languages)

## [1.1.9] - 2026-02-22
- Add 4-theme system (dark/retro/beige/slate)

## [1.1.8] - 2026-02-21
- Add dark mode toggle (LoveSpark Noir)

## [1.1.7] - 2026-02-21
- Fix excessive permissions — strip to storage-only for CWS resubmission

## [1.1.0] - 2026-02-20
- Add 7 new cursor themes: Moonlight Rose, Candy Floss, Cyber Cherry, Mint Blossom, Golden Hour, Holographic, Obsidian Heart

## [1.0.0] - 2026-02-19
- Initial release: LoveSpark Retro Cursor extension with Retro Pink, Sakura Peach, Starlight Purple
