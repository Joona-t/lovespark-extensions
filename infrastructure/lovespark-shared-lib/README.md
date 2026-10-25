# LoveSpark Shared Lib

The canonical source of truth for every visual/behavioral primitive shared across the
LoveSpark extension fleet: theme system, mascot footer, popup animation helpers, stats
tracking, and the CSS design tokens that give every extension the same "bubblegum glass-sticker"
look. **Every extension's `lib/` directory is a byte-identical copy of a subset of the files
in this repo.**

This repo has none of its own UI to run — it exists purely to be copied from.

## The sync contract

1. **This repo is the only place you edit these files.** Never hand-edit a copy inside an
   extension's `lib/` directory — those edits get silently overwritten (or silently ignored)
   the next time a sync runs, and they never propagate to any other extension.
2. **Fixes/changes land here first**, get committed to `main`, then propagate outward via
   `scripts/sync-shared-lib.sh` (canonical location: `Claude x LoveSpark/scripts/sync-shared-lib.sh`).
   The sync script copies each file in `SHARED_FILES` from this repo into every extension under
   `Extensions/` that has a `manifest.json`, with local-modification detection (it warns instead
   of clobbering unless `--force` is passed) and an md5 checksum verification pass after copying.
3. **Drift is caught, not assumed away.** `ls-check`'s `BRAND-LIB-SYNC` check (in
   `lovespark-a11y-toolkit`) md5-diffs every extension's `lib/*.css`/`lib/*.js` against this
   repo's copies on every run and fails loudly if they differ or if this repo itself can't be
   located — it does not silently skip.

### Why this matters — the March 2026 incident

A one-line `--ls-btn-bg` token fix landed here but was never synced back out. Nine extensions
kept running the stale, pre-fix token for weeks because nothing was checking for drift — the
CSS-token-drift detector that was supposed to catch this (`audit-contrast.py`) had a silently
broken path (`CSS_FILE` resolved to a location one directory short of this repo after a repo
extraction, so it permanently fell back to hardcoded values and never actually compared
anything). See `BUGS_AND_ITERATIONS.md` in this repo and in `lovespark-a11y-toolkit` for the
full account and the fix (KI-037).

## File inventory

| File | Purpose |
|---|---|
| `lovespark-tokens.css` | **The actual color/spacing design tokens** (`--ls-*` CSS custom properties) for all 4 themes (bubblegum/retro, dark, beige, slate). This is what `audit-contrast.py` parses for live WCAG contrast checking — not `lovespark-base.css`. |
| `lovespark-base.css` | Component/utility CSS (glass cards, buttons, theme dropdown, focus rings) built on top of the tokens above. |
| `lovespark-fonts.css` | `@font-face` declarations for the bundled webfonts in `fonts/`. |
| `lovespark-theme.js` | Theme dropdown UI + `LoveSparkTheme.init()` — reads/writes `chrome.storage.local` theme preference, applies `body.theme-*` classes. |
| `lovespark-footer.js` / `lovespark-footer.css` | Shared footer: LoveSpark Suite link, Ko-fi button, "Report a Bug" link. |
| `lovespark-popup.js` | Popup interaction helpers: `animateCount()`, `pop()`, `rotateMessages()`. |
| `lovespark-stats.js` | `todayStr()`, `checkDailyReset()`, debounced stat accumulator. |
| `lovespark-badge.js` | Extension badge text/color management. |
| `lovespark-lifecycle.js` | `initDefaults()`, `setupMessageHandler()` — install/update lifecycle boilerplate. |
| `fonts/` | Bundled `.woff2` webfonts (Atkinson Hyperlegible, DM Mono, Press Start 2P) referenced by `lovespark-fonts.css`. Never fetched from a CDN — CLAUDE.md rule requires all fonts bundled locally. |

Not every extension uses every file — trim unused files deliberately and document the trim in
that extension's own `BUGS_AND_ITERATIONS.md` (several extensions already do this; see
`lovespark-cookie-nuke` for the documented pattern). What `sync-shared-lib.sh` and
`ls-check`'s `BRAND-LIB-SYNC` check both guarantee is: **whatever files an extension *does*
have in `lib/`, byte-match this repo's copies.**

## Consuming this in a new extension

```bash
mkdir -p my-new-extension/lib
bash "Claude x LoveSpark/scripts/sync-shared-lib.sh"
```

Then reference only the files your `popup.html` actually needs — the `BRAND-DEAD-LIB` check in
`ls-check` flags unreferenced files so unused ones can be trimmed before shipping.

## Verifying sync status

```bash
# Dry run — see what's out of sync without touching anything
bash "Claude x LoveSpark/scripts/sync-shared-lib.sh" --dry-run

# Force-overwrite local extension copies with canonical (loses local edits)
bash "Claude x LoveSpark/scripts/sync-shared-lib.sh" --force

# Per-extension drift check (md5-diffs against this repo)
ls-check <extension-path> --only brand
```

`LOVESPARK_SHARED_LIB` env var overrides where `ls-check`/`audit-contrast.py` look for this
repo, for anyone running the toolkit from a non-standard checkout location.

## License

MIT — see `LICENSE`.
