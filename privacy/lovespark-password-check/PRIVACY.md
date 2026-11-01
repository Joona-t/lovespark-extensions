# Privacy Policy — LoveSpark Password Check

_Last updated: 2026-10-08_

LoveSpark Password Check is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

**The passwords you type are never stored.** Strength is calculated in the popup's memory and discarded when you close it.

The extension keeps only a few small items in your browser's own extension storage (`chrome.storage.local`) on your device:

- `checksToday` and `checksTotal` — how many passwords you have checked (numbers only, shown as the popup counters and toolbar badge)
- `lastResetDate` — the date the daily counter was last reset
- `isEnabled` — whether the toolbar badge counter is on
- `theme` — your chosen popup theme

You can remove it at any time by uninstalling the extension.

## What is transmitted

**Nothing.** LoveSpark Password Check makes no network requests of its own. Password strength is pure local math — your password is never sent anywhere. No analytics, no tracking, no ads, no accounts, and no remote code. Fonts are bundled inside the extension, not loaded from the web. The bundled popup footer includes ordinary links (LoveSpark site, Ko-fi, bug-report email); they open only if you click them and send nothing on their own.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves the check counters, badge on/off setting and theme locally so they are still there next time. |

The extension requests **no host permissions** and runs **no content scripts**: it cannot read or change the web pages you visit.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/privacy/lovespark-password-check
