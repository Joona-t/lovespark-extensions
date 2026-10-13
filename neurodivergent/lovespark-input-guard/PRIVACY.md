# Privacy Policy — LoveSpark Input Guard

_Last updated: 2026-10-08_

LoveSpark Input Guard is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

Input Guard exists to save what you type so you can recover it later. Everything below is kept in your browser's own extension storage (`chrome.storage.local`) on your device only:

- **Saved text entries** (`inputGuardEntries`): when you type at least 10 characters (configurable) into a text box, text area or editable area on a web page, the extension saves the text, the page URL, page title, site hostname, a field identifier (built from the field's tag, id, name, type or placeholder), the field type and a timestamp. Password fields and hidden fields are **never** saved. Note that ordinary text, search, URL, email and phone-number fields **are** saved, so anything you type into them is stored on your device.
- Entries are automatically pruned after 7 days (configurable) and capped at 200 entries (configurable). You can delete any entry, or all entries, from the popup at any time.
- **Settings** (`inputGuardSettings`): save delay, minimum length, maximum entries and maximum age.
- **On/off state** (`isEnabled`), **save counters** (`inputguardToday`, `inputguardTotal`, `lastResetDate`) and your chosen **theme** (`theme`).

This data is stored unencrypted in your browser profile, like other extension data. You can remove all of it at any time by clearing entries in the popup or uninstalling the extension.

## What is transmitted

**Nothing.** LoveSpark Input Guard makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. Fonts are bundled inside the extension. The "copy" button only places a saved entry on your own clipboard. No data ever leaves your device.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your typed-text entries, settings, on/off state, counters and theme locally so you can recover lost text later. |
| Content script on `<all_urls>` | Runs on the pages you visit so it can notice when you type into a text field and save that text to local storage. Apart from adding an invisible `data-ls-guard` marker attribute to fields it watches, it does not change the page, and it sends nothing anywhere. |

The extension requests **no host permissions** beyond the content script above, and no other permissions.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13. Text it saves stays on the user's own device.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-input-guard
