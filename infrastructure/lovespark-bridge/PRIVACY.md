# Privacy Policy — LoveSpark Bridge

_Last updated: 2026-10-08_

LoveSpark Bridge is a free, open-source LoveSpark browser extension. Its single job is to copy your LoveSpark Focus data to a LoveSpark Mission Control server that you choose. Because that is its purpose, **it does send data over the network**, as described below.

## What is stored

Kept in your browser's own extension storage (`chrome.storage.local`) on your device:

- `pomofocusId` — the LoveSpark Focus extension ID you paste into the popup.
- `mcUrl` — the Mission Control URL you enter (default `http://localhost:3000`).
- `lastSyncAt` and `lastSyncStatus` — the time and result of the last sync attempt, shown in the popup.

Nothing is stored in `chrome.storage.sync`. You can remove all of it at any time by uninstalling the extension.

## What is transmitted

**Your LoveSpark Focus data, to the Mission Control URL you configured — and nowhere else.**

- Once you have entered a LoveSpark Focus extension ID, the extension asks LoveSpark Focus for its data every minute (and on install, on browser startup, and when you press "Sync Now"). LoveSpark Focus only answers if you have turned on external sync in its own settings.
- It then sends an HTTP `POST` to `<your Mission Control URL>/api/study-planner/sync` containing: a timestamp, whether Focus was reachable, and the Focus data it returned — your task list, completed tasks, and focus stats (sessions and focus minutes today, total sessions, current streak, last session date).
- The default destination is `http://localhost:3000`, a server on your own computer. If you change the URL to a remote address, your data is sent to that address. The developer does not run any server and never receives this data.
- If LoveSpark Focus is unreachable or has external sync turned off, the `POST` is still sent, but it carries only the timestamp, the reachability flag, and (when sync is off) Focus's "external sync is disabled" error message. It carries no task or stats data.
- If no Focus extension ID is set, nothing is sent.

Separately, the popup's stylesheet requests a font stylesheet from Google Fonts (`fonts.googleapis.com`) when you open the popup. That request sends Google ordinary web-request information such as your IP address and browser user agent; no extension data is included.

No analytics, no tracking, no ads, no accounts, and no remote code.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your Focus extension ID, Mission Control URL, and last-sync status locally. |
| `alarms` | Runs the sync once every minute in the background. |

The extension requests **no host permissions** and runs **no content scripts**: it cannot read or change the web pages you visit. It talks to LoveSpark Focus through the browser's standard extension-to-extension messaging.

## Third-party services

- **Google Fonts** (`fonts.googleapis.com`) — the popup's stylesheet loads font CSS from it. See Google's privacy policy: https://policies.google.com/privacy
- **Your Mission Control server** — receives your Focus data. It is software you run or choose yourself, not a service operated by the developer.

## Children's privacy

The extension collects no personal information for the developer from anyone, including children under 13. Data it syncs goes only to the Mission Control URL the user configures.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/infrastructure/lovespark-bridge
