# Privacy Policy — LoveSpark Reading Progress

_Last updated: 2026-10-08_

LoveSpark Reading Progress is a free, open-source LoveSpark browser extension. It is built to be private by design.

## What is stored

- **Reading positions:** for pages you scroll through, the page URL, the page title (first 100 characters), how far you scrolled (percent), and a timestamp. This list is capped at the 200 most recent pages, and entries older than 30 days are removed automatically. The popup shows your 5 most recent pages from this list.
- **Reading counters:** pages finished today, pages finished in total, and the date of the last daily reset.
- **Settings:** whether the extension is turned on, and your chosen theme.

Everything is kept in your browser's own extension storage (`chrome.storage.local`) on your device. Nothing is synced. You can remove it at any time by uninstalling the extension.

## What is transmitted

**Nothing.** LoveSpark Reading Progress makes no network requests of its own. No analytics, no tracking, no ads, no accounts, and no remote code. Your reading positions, URLs and titles never leave your device. The progress bar's stylesheet is loaded from inside the extension package, not from the internet.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your reading positions, counters and settings locally so they are still there next time. |
| `scripting` | Injects the progress-bar script (`content/progress.js`) into a page after it finishes loading, so it can show the progress bar and time-left estimate and record your scroll position. It is not injected while the extension is turned off, and never on `chrome://` or `about:` pages. Injection only works on tabs the browser has given the extension access to. |
| `activeTab` | Not called directly by the code, but it is what gives the extension temporary access to the current tab when you click its toolbar icon. Because the extension has no host permissions, that temporary access is what lets the `scripting` injection succeed on that tab. |

The extension requests **no host permissions** and declares **no content scripts** in its manifest. The progress-bar script is injected with `scripting` as described above; on the pages it runs on, it reads only the scroll position, the page title and URL, and the article text (only to count words for the reading-time estimate; the count is done on your device and the text is never stored or sent anywhere). The progress-bar stylesheet is listed as a web-accessible resource so the injected script can load it from the extension package.

## Third-party services

None.

## Children's privacy

The extension collects no personal information from anyone, including children under 13.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/reading/lovespark-reading-progress
