# Privacy Policy — LoveSpark Win Jar

**Effective date:** 2026-07-08
**Applies to version:** 1.0.30

LoveSpark Win Jar is a free, open-source browser extension. Your privacy is not a feature we bolted on — it is the whole design. Everything the extension remembers stays on your own device. We do not run a server, we do not have an account system, and we have no way to see your data. This policy explains exactly what that means.

## What We Store

Everything is stored **locally in your browser** using `chrome.storage.local`. Nothing leaves your device. Specifically, the extension keeps:

- **Your wins** — the small victories you log (the text you type in, and the date/time each one was added), so your jar persists between browser sessions.
- **Preferences and settings** — things like your chosen theme and any display options you toggle.
- **Local usage counters** — simple on-device values such as how many wins are in your jar or streak/tally information, used only to display your progress back to you.

That's it. All of this lives in your browser profile. If you uninstall the extension or clear the extension's storage, this data is gone — there is no copy anywhere else.

## What We Transmit

**Zero data is transmitted externally.** The extension does not send your wins, settings, or any other information to us or to anyone else. Concretely:

- **No servers** — there is no LoveSpark backend for this extension to talk to.
- **No analytics or telemetry** — we do not track usage, clicks, or behavior.
- **No account, no sign-in, no cloud sync** — nothing is uploaded.
- **No remote code** — the extension runs only the code shipped in the package; it does not fetch or execute code from the internet.
- **No ads and no ad networks.**

The extension works fully offline. It has no reason to make a network request, and it doesn't.

## Permissions

The extension requests exactly one permission, and only for the feature it powers:

- **`storage`** — Used to save your wins, settings, and progress counters locally in your browser via `chrome.storage.local`, so your win jar is still there the next time you open it. This permission grants only local storage on your own device; it does **not** allow reading your browsing activity or sending anything over the network.

No other permissions are requested.

## Host Permissions

**None.** The extension declares **no host permissions** and requests no access to any website. Because of this, the extension:

- **Does not** read, monitor, or collect your browsing history.
- **Does not** read the content of the web pages you visit.
- **Does not** inject ads, trackers, or any code into the sites you browse.

It simply cannot see your web activity, because it never asks for the access that would be required to do so.

## Third-Party Services

**None.** LoveSpark Win Jar uses no third-party services, no external SDKs, no trackers, and no analytics providers. Your data is never shared with any third party, because it is never sent anywhere in the first place.

## Children's Privacy

The extension collects **no personal data from anyone**, including children under the age of 13. Because it stores information only on the local device and transmits nothing, there is no personal data to collect, share, or expose. It is safe for users of all ages.

## Changes to This Policy

If this policy is ever updated, the changes will be published in the extension's public repository, and the **Effective date** at the top of this document will be updated. Because the project is open source, the full history of any changes is publicly visible in the repository's commit log:

https://github.com/Joona-t/lovespark-win-jar

## Contact

Questions, concerns, or privacy reports? Please open an issue:

https://github.com/Joona-t/lovespark-win-jar/issues

## Open Source / Verification

You do not have to take our word for any of this. LoveSpark Win Jar is fully open source, and every claim in this policy can be verified by reading the code:

https://github.com/Joona-t/lovespark-win-jar
