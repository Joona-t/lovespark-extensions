# Research: Animated companion assets for all cursor packs (butterfly-style)

**Goal:** Make every pack feel as alive as `cyber-butterfly` — 2-3 small animated companion
assets around the arrow that visibly animate while the cursor moves.

## 1. Why the butterfly animates (mechanism)

The cyber-butterfly SVGs embed **SMIL animations** (`<animateTransform>` wing-flap,
`values="1 1; 0.5 1; 1 1" dur="0.45s" repeatCount="indefinite" additive="sum"`).

- **Chrome/Chromium:** CSS `cursor: url(x.svg)` cursors are re-rasterized as the pointer
  moves, so the SMIL timeline visibly advances **while the mouse is moving** and freezes
  when idle. This is exactly the observed butterfly behavior — "animates when moving."
- **Firefox:** SVG cursors are rasterized once; SMIL is frozen at t=0. The existing
  generator already notes this (`gen_cursors.py:30` — "browsers may freeze in cursor
  context — designs work as static").
- **Design rule that follows:** every animation's *first keyframe must be the perfect
  rest pose*. Butterfly does this right: frame 0 = wings fully open. All new companions
  must obey the same rule so Firefox/static contexts still look great.

## 2. Where the assets live

- Generator: `gen_cursors.py` (580 lines) → writes 72 SVGs to `cursors/<pack>-{emoji,pointer}/{default,pointer,text,wait}.svg`.
  **The SVGs are build artifacts — all changes go in the generator, then regenerate.**
- 9 Y2K SVG packs × 2 variants: honey-bunny, cyworld-dotti, coquette-ribbon,
  strawberry-milk, glossy-pearl, bubble-boba, phone-charm, heart-locket, cyber-butterfly.
- 3 OG PNG packs (retro-pink, sakura-peach, starlight-purple): **PNG raster — cannot be
  animated** without converting to SVG packs. Out of scope for v1 (flagged as decision).
- `content_script.js` builds CSS from fixed filenames — **no JS/manifest changes needed**
  beyond the version bump; new SVG content is picked up automatically.

## 3. Current animation state per pack (pointer-variant `default.svg`, the arrow)

| Pack | Companions today | Animated? |
|---|---|---|
| cyber-butterfly | 2 butterflies | ✅ wing-flap ×2, staggered (the reference) |
| honey-bunny | 1 static bunny-tail ball | ❌ |
| cyworld-dotti | 1 sparkle | ⚠️ opacity twinkle only (subtle, single) |
| coquette-ribbon | 1 static bow | ❌ |
| strawberry-milk | 3 static seeds | ❌ |
| glossy-pearl | 1 shimmer dot | ⚠️ opacity only |
| bubble-boba | 2 static pearls | ❌ |
| phone-charm | 1 static star | ❌ |
| heart-locket | 1 static heart charm | ❌ |

The `pointer.svg` (hand) of every pack — including butterfly — has **zero** companions.
Emoji-variant defaults are single centered icons; some have twinkle/BOB already.

## 4. Butterfly pattern to replicate (the recipe)

From `_butterfly()` + `gen_cyber_butterfly()` (`gen_cursors.py:485-550`):
1. Companion = small self-contained `<g transform="translate(x y)">` group, parametrized
   `(x, y, scale, delay)`.
2. Motion via inner `<g><animateTransform ... additive="sum">` — short loop (0.4-1.2s)
   so movement is visible even in brief mouse drags.
3. **2-3 instances at staggered `begin=` delays** (0s / 0.15s / 0.3s) — the stagger is
   what sells "alive" (they never move in unison).
4. Placement in the free quadrant right/below the arrow (x≈20-27, y≈8-25); arrow tip and
   hotspot (3 1) stay untouched; nothing above/left of the tip.
5. 32×32 viewBox; companions ≈4-6px units so they read at 1×.

## 5. Constraints

- Hotspots unchanged (`content_script.js:39-40`): pointer packs `3 1` / `8 4`; emoji `16 16`.
- CWS/AMO: pure SVG asset change, no permission delta. Rule 5a: firefox zip must pass
  `amo-validate.py` via `scripts/build-zips.sh`. Rule 9: bump patch version.
- Accessibility: cursor SVGs are decorative (no ARIA surface). Motion is only-on-move by
  nature in Chrome, which is inherently reduced-motion-friendly (idle cursor = static),
  but keep loops gentle (no flashing, opacity ≥0.4, dur ≥0.4s).
- File size: current animated SVGs ~2-3 KB; keep each under ~4 KB.

## 6. Decision points for Joona

1. **Scope of "all the pointers":** proposal = all 8 remaining Y2K packs, both variants'
   `default.svg`, PLUS add companions to every `pointer.svg` hand (currently lifeless in
   all 9 packs, including butterfly). Wait cursors already animate (SPIN/BOB) — polish only.
2. **OG PNG packs** (retro-pink/sakura-peach/starlight-purple): leave static (v1) or
   convert to SVG packs later (separate iteration)? Proposal: leave, log as v_next.
