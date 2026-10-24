# Dark Mode Reader — by LoveSpark

Dark mode for every website. It paints dark before the page shows, recolours each stylesheet with contrast you can read, steps aside on sites that are already dark, and adds an optional dyslexia-friendly reading layer. Free, MIT, zero tracking. Part of the [LoveSpark suite](https://lovespark.love).

## How it works

Three stages per page:

1. **Before first paint.** A tiny stylesheet registered for `document_start` sets a dark root and `color-scheme: dark`. It is only registered for sites where the extension is active, so turned-off sites never flash dark.
2. **First frame.** A cheap invert filter covers the page while the real theme is computed.
3. **Dynamic theme.** Every stylesheet, inline style, CSS variable and shadow root is recoloured in **OKLCH**. The filter is removed in the same frame the theme lands. Work is capped at 4 ms per frame.

**Contrast by construction.** Backgrounds map into a dark lightness band and text into a light one. The bands are picked so any text colour on any background colour clears WCAG AA (4.5:1). `tests/oklch.test.js` proves it for every palette on band corners across 12 hues and on 1,000 random colour pairs.

**Native-dark sites are left alone.** Before recolouring, the engine measures the page's own background. If it is already dark, it stands down and remembers the site.

**Images are dimmed, never inverted.** Photo brightness is a slider from 60 to 100%.

## Features

- Three palettes: **Noir** (neutral), **Plum** (LoveSpark brand dark), **Warm** (sepia dark for long reads)
- Per site: Auto, On or Off
- Reading layer per site: OpenDyslexic or Atkinson Hyperlegible, 70-character lines, line height 1.6, underlined links
- Schedule: always, follow system dark mode, or a time window
- Keyboard: `Alt+Shift+D` toggles the current site

## Measured

Live bench, 2026-10-24, Chromium 148. Each side ran twice, alternating, on 4 light and 4 dark-scheme sites. Script: `bench/sites.py`.

| Metric | No extension | Dark Mode Reader |
|---|---|---|
| First screenshot after HTML parsed, mean luminance (light sites, median) | 0.94 | 0.13 |
| Visible text nodes at or above 4.5:1 (light sites) | 59% median | 100% on 4 of 4 |
| Dark-scheme sites left untouched | n/a | 4 of 4 |
| Inverted images | 0 | 0 |
| Main-thread CPU during 10 s of scrolling (median) | 82–101 ms | 134–152 ms |

The CPU overhead is about 50 ms per 10 s of scrolling, roughly 0.5% of one core, and it was not profiled. There is no side-by-side Dark Reader column yet. The bench takes `--darkreader <unpacked dir>` to add one.

## Development

```bash
npm test                         # unit tests (node:test, no deps)
python3 bench/run.py smoke       # loads the extension in Chromium against local fixtures
python3 bench/sites.py --n 4     # live-site bench, writes bench/results.json
```

The bench needs `pip install playwright` and `python -m playwright install chromium`.

Manifest V3, vanilla JS, no frameworks, no build step. Shared LoveSpark UI lib in `lib/`. Per-site fixes live in `fixes/sites.json`. See `BUGS_AND_ITERATIONS.md` for the fix history.

## Privacy

Settings stay in `chrome.storage.local`. Nothing is sent to LoveSpark or any third party. See [PRIVACY.md](PRIVACY.md).

## License

MIT. See [LICENSE](LICENSE).
