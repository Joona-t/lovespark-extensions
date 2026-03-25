# LoveSpark Zen Garden - Bugs and Iterations

## v1.0.0 (2026-03-24) - Initial Build

### Architecture Decisions
- **storage only** — No alarms, no content scripts. Garden state persisted in local storage.
- **Tap-to-place interaction** — Click anywhere on the 308x220 canvas to place the selected element. Right-click to remove.
- **6 element types** — Rock, Bamboo, Flower, Tree, Water Drop, Lantern. All emoji-based, no image assets needed.
- **30 item cap** — Prevents storage bloat. Enough for a detailed garden.
- **Persistent garden** — Saved on every placement. Restores on popup reopen.
- **Session tracking** — First placement per popup open counts as a "session" in daily stats.
- **Clear button** — Trash icon in picker bar. Wipes garden state.
- **Crosshair cursor** — Signals "click to place" interaction mode.
- **DOM API only** — Elements created via createElement. Zero innerHTML per KI-011.
- **prefers-reduced-motion** — Disables hover scale transitions.

### Known Limitations (V1)
- No drag to reposition (items are fixed after placement)
- No undo (only right-click to remove individual items)
- No sand drawing (raking patterns — V2 candidate using canvas API)
- No zoom or pan
- No garden sharing/export

### Iteration Log
| Date | Change | Reason |
|------|--------|--------|
| 2026-03-24 | Initial build | Expansion Agent Cycle 15 |
