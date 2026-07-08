# Sensory Shield by LoveSpark

Calming sensory toolkit for neurodivergent browsers. Reduce motion, tint the
screen, hide flashing GIFs, and add a focus ruler — per-site, from one small
popup.

## What it does

- **Reduce motion** — quiets autoplaying animations and transitions
- **Colour tint** — a soft, adjustable overlay to ease glare and light sensitivity
- **Hide flashing/GIFs** — stops looping animated images from flashing
- **Focus ruler** — a horizontal reading guide to track your place on the page
- **Increase cursor** — larger cursor for easier tracking
- **Font comfort** — OpenDyslexic override for body text
- **Presets** — Calm, Focus, Full Shield, or a Custom mix, saved per domain

## Why

Autoplaying animation, flashing banners, looping GIFs, and glaring bright
pages can turn ordinary browsing into sensory overload for people with ADHD,
autism, migraine or light sensitivity, or vestibular motion sensitivity.
Sensory Shield puts the controls for all of that in the user's hands.

## Privacy

- 100% free, MIT-licensed, open source
- Zero data collection — nothing is ever transmitted off the device
- Settings live only in `chrome.storage.local`; no accounts, no sign-in, no ads
- See [PRIVACY.md](PRIVACY.md) for the full disclosure

## Install

Load unpacked in Chrome/Edge (`chrome://extensions` → Developer mode → Load
unpacked) or via `about:debugging` in Firefox, pointing at this directory.
Store listings are in progress — see [SUBMIT.md](SUBMIT.md).

## Development

- `manifest.json` — MV3 manifest, `storage` permission + `<all_urls>` host permission
- `popup/` — popup UI (per-site controls)
- `settings/` — settings page (global toggle, whitelist)
- `content/` — content scripts that apply the shields to the page
- `lib/` — shared LoveSpark component library (theme, fonts, footer — see
  `Extensions/infrastructure/lovespark-shared-lib`)

See [BUGS_AND_ITERATIONS.md](BUGS_AND_ITERATIONS.md) for the fix/iteration log.

Part of the [LoveSpark](https://lovespark.love) suite — free, open-source
tools for neurodivergent coders.
