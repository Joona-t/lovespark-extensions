# Privacy Policy — LoveSpark Site Notes

_Last updated: 2026-10-08_

LoveSpark Site Notes is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

The notes you write, keyed by the website's hostname (for example `example.com`); simple counters (notes created today and in total, plus the date of the last daily reset); whether notes are enabled or paused; and your theme preference. Everything is kept in your browser's own extension storage (`chrome.storage.local`) on your device, and access to it is restricted to the extension's own trusted pages where the browser supports it. You can remove it at any time by deleting notes in the popup or by uninstalling the extension.

If you click **Download backup**, the extension creates a plaintext JSON file (`lovespark-site-notes-backup.json`) of your notes and saves it to your device through your browser's normal download. If you choose **Restore backup**, the file you pick is read locally and replaces your stored notes. These files never leave your device unless you move them yourself.

## What is transmitted

**Nothing.** LoveSpark Site Notes makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. No data ever leaves your device. The only links in the popup (LoveSpark Suite and Ko-fi) open a normal browser tab only when you click them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your notes, counters, enabled/paused state and theme locally so they are still there next time. |
| `activeTab` | When you open the popup, lets it read the address of the tab you are on so it can show and save the note for that site's hostname. Only the hostname is stored, and only when you save a note. |

The extension requests **no host permissions** and runs **no content scripts**: it cannot read or change the web pages you visit.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/productivity/lovespark-site-notes
