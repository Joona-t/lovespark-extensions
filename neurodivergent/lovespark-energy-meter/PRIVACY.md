# Privacy Policy — LoveSpark Energy Meter

**Effective date:** This policy applies to LoveSpark Energy Meter version 1.0.29 and later.

LoveSpark Energy Meter is a free, open-source browser extension that lets you track your energy level throughout the day on a 1–5 scale. Your privacy is not a feature we bolt on — it is the whole design. Everything you log stays on your own device. Nothing is ever sent anywhere.

## What we store

The extension stores data **only** on your own computer, using your browser's local extension storage (`chrome.storage.local`). This may include:

- **Your energy logs** — the 1–5 energy ratings you tap, along with their timestamps, used to draw today's energy curve and help you spot patterns.
- **Daily history** — past days' entries retained locally so the extension can show trends over time.
- **Your settings and preferences** — such as your chosen theme and any display options.

That's it. There is no account, no sign-up, no profile, and no cloud copy. All of this data lives in your browser and never leaves it. If you uninstall the extension or clear its storage, this data is removed.

## What we transmit

**ZERO data is transmitted externally.** To be completely explicit:

- No data is sent to us or to anyone else.
- There are **no analytics** and **no telemetry**.
- There are **no servers** — the extension has no backend to talk to.
- Nothing you log is uploaded, synced to a remote service, sold, shared, or tracked.

Your energy data exists in exactly one place: your own browser, on your own device.

## Permissions

The extension requests the minimum permissions needed to do its one job, and nothing more.

- **`storage`** — This is the only permission the extension declares. It is used to save your energy logs, daily history, and settings locally in your browser (`chrome.storage.local`) so your data persists between sessions and your energy curve is there when you reopen the popup. This permission does **not** grant any network access and is used solely to keep your data on your device.

## Host permissions

**None.** The extension requests no host permissions and no access to any websites. It does not read, monitor, or modify the pages you visit. Because it has no host access, it **cannot** — and does not — collect your browsing history, inject ads or trackers, read page content, or interact with any site you open. It runs entirely within its own popup.

## Third-party services

**None.** The extension uses no third-party services, SDKs, libraries-with-callbacks, advertising networks, or external analytics providers. There is no remote code execution and no external code is loaded at runtime.

## Children's privacy

The extension collects **no personal data from anyone**, including children under the age of 13. Because nothing is transmitted or gathered off-device, there is no personal information to collect, store remotely, or share. LoveSpark Energy Meter is safe for users of all ages.

## Changes to this policy

If this policy ever changes, the updated version will be published in the extension's public source repository, and the effective date/version line above will be updated. Because the extension is open source, the full history of any changes is visible in the repository's commit history.

## Contact

Questions, concerns, or reports? Please open an issue at:
https://github.com/Joona-t/lovespark-energy-meter/issues

## Open source / verification

You do not have to take our word for any of the claims above. LoveSpark Energy Meter is fully open source, and anyone can read the complete source code to verify that it stores data only in `chrome.storage.local`, transmits nothing, and uses no third-party services:
https://github.com/Joona-t/lovespark-energy-meter
