# Privacy Policy — LoveSpark Time Blindness Clock

**Effective date:** 2026-06-09
**Applies to version:** 1.0.0

LoveSpark Time Blindness Clock is built privacy-first. It runs entirely on your own device. It does not have a server, does not contain analytics, and does not transmit anything about you anywhere. This policy explains exactly what that means.

## What we store

The extension keeps a small amount of data in your browser's local extension storage (`chrome.storage.local`) so your clock looks and behaves the way you set it up. This includes only:

- **Your time markers** — the times you configure for events like lunch, end of work, and bedtime, so the "time until" countdowns can be calculated.
- **Display and clock settings** — preferences such as 12-hour vs. 24-hour format, whether to show seconds, and clock size/layout choices.
- **Theme / appearance choice** — which LoveSpark theme you've selected.

That's it. This data never leaves your device. It exists only so the extension can remember your setup between sessions. You can erase all of it at any time by removing the extension or clearing its storage in your browser.

We do **not** store your browsing history, the websites you visit, your identity, your location, or any other personal information. The extension has no account system and no login.

## What we transmit

**Zero data is transmitted externally.** Specifically:

- No analytics.
- No telemetry or usage tracking.
- No remote servers, APIs, or databases.
- No advertising or ad networks.
- No remote code execution — everything the extension runs ships inside the extension package itself.

Nothing you do in this extension is ever sent off your device. There is nowhere for it to go, by design.

## Permissions

The extension requests the minimum permissions required for its single purpose — showing you a clear, real sense of time.

- **`storage`** — Used solely to save your time markers, display settings, and theme choice locally in your browser (see "What we store" above) so they persist between sessions. This permission does not grant any network or browsing access; it is local storage only.

No other permissions are requested.

## Host permissions

**None.** This extension requests no host permissions and no access to any websites. It cannot read, modify, or monitor the pages you visit, because it never asks for that access in the first place.

To be explicit about what the extension does **not** do:

- It does **not** collect or read your browsing history.
- It does **not** read or modify the content of any web page.
- It does **not** inject ads, trackers, or any third-party code into the sites you use.

## Third-party services

**None.** The extension uses no third-party services, SDKs, frameworks-as-a-service, fonts loaded from remote servers, or external libraries that phone home. All assets are bundled locally within the extension.

## Children's privacy

The extension collects no personal data from anyone — including children under 13. Because nothing is gathered, transmitted, or shared, there is no personal information to protect or expose. The extension is safe for users of all ages.

## Changes to this policy

If this policy ever changes, the updated version will be published in the public source repository, and the **Effective date** above will be updated. Because the project is open source, the full history of changes is visible in the repository's commit log:

https://github.com/Joona-t/lovespark-time-blindness-clock

## Contact

Questions, concerns, or privacy reports? Please open an issue on GitHub:

https://github.com/Joona-t/lovespark-time-blindness-clock/issues

## Open source / verification

You don't have to take our word for any of this. LoveSpark Time Blindness Clock is fully open source under the MIT license. Anyone can read the complete source code and verify these claims — including the fact that the extension makes no network requests and stores data only on your device:

https://github.com/Joona-t/lovespark-time-blindness-clock
