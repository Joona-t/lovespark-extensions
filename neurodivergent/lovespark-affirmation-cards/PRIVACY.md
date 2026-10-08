# Privacy Policy — LoveSpark Affirmation Cards

**Effective date:** This policy applies to LoveSpark Affirmation Cards version 1.0.30 and later.

LoveSpark Affirmation Cards is a free, open-source browser extension that shows daily affirmation cards and lets you save the ones you love. Your privacy is not a feature we bolt on — it's the whole architecture. **Everything the extension does happens on your own device. Nothing ever leaves it.**

---

## What we store

The extension stores a small amount of data **locally on your device only**, using the browser's `chrome.storage.local` API. Depending on how you use it, this may include:

- **Your favorite / saved cards** — the affirmations you tap to save into your deck.
- **Your deck** — the collection of cards you've built up over time.
- **Your preferences / settings** — such as your chosen theme and any display options.
- **Lightweight local counters** — such as which card was shown last, a daily card count, or a streak, so the "daily card" experience works and picks up where you left off.

This data lives in your browser's local storage. It stays on your computer. We — the developers — never see it, never receive it, and have no way to access it.

## What we transmit

**Zero.** The extension transmits **no data whatsoever** to any external server, at any time, for any reason.

- No analytics.
- No telemetry.
- No usage tracking.
- No crash/error reporting to a remote service.
- No accounts, no sign-in, no cloud sync.
- No servers of ours for your data to travel to — there is no backend.

Because nothing is transmitted, there is nothing for anyone to intercept, sell, profile, or leak.

## Permissions

The extension declares exactly one permission, and only because a core feature requires it:

- **`storage`** — Used solely to save your favorite cards, your deck, and your settings on your own device via `chrome.storage.local`, so they persist between sessions and are there when you come back. This permission does **not** grant any network or browsing access, and we use it for nothing beyond storing the data described above.

That's the complete list. The extension requests no other permissions.

## Host permissions

**None.** The extension requests **no host permissions** and no access to any website.

Concretely, this means the extension:

- Does **not** read, monitor, or collect your browsing history.
- Does **not** access the content of any web page you visit.
- Does **not** inject ads, trackers, scripts, or any other code into web pages.
- Does **not** run any remote or externally-loaded code.

It simply cannot see the sites you browse, because it never asks for permission to.

## Third-party services

**None.** The extension uses no third-party services, SDKs, analytics providers, advertising networks, or external APIs. There are no external dependencies that receive any information about you.

## Children's privacy

The extension collects **no personal data from anyone** — including children under the age of 13. Because nothing is collected, transmitted, or shared, there is no personal information to gather from children or from any user. LoveSpark Affirmation Cards is safe for all ages.

## Changes to this policy

If this privacy policy changes, the updated version will be published in the extension's public source repository, and the effective date / version line at the top will be updated. Because the repository is open, you can review the full history of any changes at any time.

## Contact

Questions, concerns, or reports? Please open an issue:

**https://github.com/Joona-t/lovespark-affirmation-cards/issues**

## Open source / verification

You don't have to take our word for any of this. LoveSpark Affirmation Cards is fully open source, and every claim in this policy can be verified by reading the code yourself:

**https://github.com/Joona-t/lovespark-affirmation-cards**

If you find anything that contradicts this policy, please open an issue — transparency is the point.
