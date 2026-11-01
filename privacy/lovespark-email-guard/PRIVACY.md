# Privacy Policy — LoveSpark Email Guard

_Last updated: 2026-10-08_

LoveSpark Email Guard is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Only a few counters and settings: how many tracking pixels were blocked today and in total (`trackersBlockedToday`, `trackersBlockedTotal`), the date of the last daily counter reset (`lastResetDate`), whether protection is switched on (`isEnabled`), and your popup theme (`theme`). Everything is kept in your browser's own extension storage (`chrome.storage.local`) on your device. The extension does not store your emails, sender addresses, subjects, or the URLs of blocked images. You can remove the stored data at any time by uninstalling the extension.

## What is transmitted

**Nothing.** LoveSpark Email Guard makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. When it finds a tracking pixel in an email, it replaces the image with a blank image built into the extension, so the tracker is never contacted; this happens entirely on your device. The fonts it uses are packaged with the extension. The popup footer has two plain links (lovespark.love and Ko-fi) that open only if you click them. No data ever leaves your device.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves the blocked-tracker counters, the on/off switch and your theme locally. |
| `declarativeNetRequest` | Applies the packaged block list (`rules.json`, 71 rules) that stops images and requests to known email-tracking domains, but only when they are started from the supported webmail sites. Turning protection off in the popup disables this rule set. |
| Host access to `mail.google.com`, `outlook.live.com`, `outlook.office.com`, `outlook.office365.com`, `mail.yahoo.com` | Lets the extension run on these webmail sites only, to find and block tracking pixels in the emails you open. |

The content script runs only on the five webmail sites listed above. It looks at the images inside opened email bodies on your device, blanks the ones that look like tracking pixels, and adds a small "blocked" badge next to the sender. It sends only a count of blocked images to the extension's own background script. It cannot read or change any other web pages you visit.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/privacy/lovespark-email-guard
