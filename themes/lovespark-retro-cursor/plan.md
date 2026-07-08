# Plan: "Alive" update — butterfly-style animated companions for every Y2K pack

Based on `research.md`. **Do not implement yet.**

## Design principle (from the butterfly recipe)

Each pack gets a parametrized companion helper (like `_butterfly(x, y, scale, delay)`)
and places **2-3 staggered instances** beside the arrow / hand. Every animation's first
keyframe is the rest pose (Firefox-safe static fallback). Loops 0.4-1.2s, gentle motion,
`additive="sum"` on transformed groups.

## Per-pack companion designs (pointer-variant `default.svg` arrow + `pointer.svg` hand)

| Pack | Companions (2-3, staggered) | Motion |
|---|---|---|
| honey-bunny | 2 mini bunnies + 1 tiny carrot | bunnies **hop** (translate y 0→-1.5→0, 0.6s, ears squash on land via scale); carrot bobs |
| cyworld-dotti | 3 pixel sparkles + mini chrome heart | sparkles twinkle **and** scale-pop (0.9s, staggered); heart **beats** (scale 1→1.15→1, 0.7s) |
| coquette-ribbon | 1 bow with live tails + 2 drifting pearls | bow tails **flutter** (rotate ±8° around knot, 0.5s); pearls bob alternately |
| strawberry-milk | 2 mini strawberries + 1 milk droplet | berries **wiggle-swing** (rotate ±10°, 0.55s); droplet drips (translate y + fade, 1.1s) |
| glossy-pearl | 3 mini pearls | **orbit shimmer**: each pearl scale-pulses + highlight sweeps, staggered 0.3s — reads as rolling |
| bubble-boba | 3 boba pearls | **rise like bubbles**: translate y 0→-3 with fade-reset, staggered (classic bubble column beside arrow) |
| phone-charm | 1 dangling star charm + 2 sparkles | star **swings** on its chain (rotate ±12° pendulum around link point, 0.9s); sparkles twinkle-pop |
| heart-locket | 1 locket heart + 2 rising mini hearts | locket **beats**; mini hearts float up + fade, staggered (love-note trail) |
| cyber-butterfly | (reference — unchanged arrow) | add 1 butterfly to the hand `pointer.svg` for parity |

- **Hands (`pointer.svg`) all 9 packs:** add 1-2 of the same companions in the free
  left/lower-left area (hand occupies right side) — same helpers, smaller scale.
- **Emoji-variant `default.svg`:** add the same staggered companions around the centered
  icon where space allows (icon is 32×32-filling; use corners, scale ≈0.7).
- **Wait cursors:** already animated (SPIN/BOB) — no changes.
- **text.svg (I-beam):** stays clean/static on purpose — precision cursor, companions
  would obscure the caret target.
- **OG PNG packs (retro-pink, sakura-peach, starlight-purple):** ✅ DECIDED (Joona,
  2026-07-08): stay exactly as they are. No SVG conversion, not even as v_next. Y2K
  packs only.

## Todo list

- [x] 1. `gen_cursors.py`: add generic companion helpers next to `_butterfly()` —
      `_hop`, `_beat`, `_twinkle_pop`, `_swing`, `_rise_fade`, `_wiggle` SMIL snippet
      builders (each takes rest-pose-first values + `begin` delay).
- [x] 2. Implement per-pack companion functions (`_bunny`, `_sparkle_px`, `_mini_bow`,
      `_mini_strawberry`, `_mini_pearl`, `_boba_pearl`, `_star_charm`, `_mini_heart`)
      parametrized `(x, y, scale, delay)` like `_butterfly`.
- [x] 3. Wire 2-3 staggered companions into each `gen_*()`: pointer default + hand,
      emoji default; butterfly hand gets its butterfly.
- [x] 4. Run `python3 gen_cursors.py` — regenerate all 72 SVGs; verify file sizes <4 KB
      and rest-pose-first keyframes (grep: every `values=` starts with the rest value).
- [x] 5. Visual verification: load unpacked in Chrome via `/browse` daemon or preview
      page cycling all packs; confirm companions animate on move, arrow tip/hotspot
      unobstructed at 1×; static render check (Firefox fallback) via rsvg/screenshot.
- [x] 6. Bump manifest patch version; update `CHANGELOG.md` + `BUGS_AND_ITERATIONS.md`
      (ITER entry: "alive update").
- [x] 7. `scripts/build-zips.sh` → chrome + firefox zips (AMO validator gate).
- [x] 8. Run `ls-check .`; commit + push (branch off current `seo/pink-title` or `main`
      per repo state; no Co-Authored-By).

**Implemented 2026-07-08** (v1.1.36, branch feat/alive-y2k-cursors) via 9-agent design workflow + 3-skeptic verify. All todos done.
