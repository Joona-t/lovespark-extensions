# Privacy Policy — Dark Mode Reader

**Effective date:** 2026-10-24 · **Applies to version:** 1.0.0

Dark Mode Reader is a free, open-source browser extension that shows websites in dark mode and can add a reading-friendly layer. This policy says exactly what it does with your information.

**The short version:** everything stays on your device. There are no servers, no accounts, no analytics and no tracking.

## What is stored

Only in your browser's local storage (`chrome.storage.local`), on your device:

- Your settings: on/off, palette, photo brightness, schedule, reading-layer options, popup theme.
- Per-site choices: for each site you change, whether it is Auto, On or Off, whether the reading layer is on, and whether the site was detected as already dark.
- Two counters: pages darkened today and in total.

A short-lived cache of stylesheet text lives in `chrome.storage.session`. The browser clears it when it restarts.

Uninstalling the extension removes all of it. **Settings → Reset All Data** clears it at any time.

## What is transmitted

**Nothing to LoveSpark or any third party.** No analytics, telemetry, crash reports or remote configuration.

There is one kind of network request. Some sites load stylesheets from another domain, and the browser does not let extensions read those directly. Then the extension downloads **the same stylesheet the page already asked for**, from the same address, without cookies, so it can recolour it. Nothing about you is added to that request, and the result never leaves your device.

## Permissions

- **storage**: saves your settings and per-site choices locally.
- **scripting**: registers the small dark stylesheet that paints before the page appears, only for sites where dark mode is on.
- **alarms**: turns dark mode on and off at your scheduled times and resets the daily counter.
- **Host access to http and https sites**: dark mode has to apply to whatever site you open, before it paints. It is **not** used to read, store or send page content, form data, browsing history or anything else about you.

## Third parties

None.

## Children

The extension collects no personal information from anyone, including children under 13.

## Contact

Open an issue at https://github.com/Joona-t/lovespark-extensions/issues or email joona@lovespark.love.

## Verify it yourself

Every line of code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/reading/lovespark-dark-mode-reader
