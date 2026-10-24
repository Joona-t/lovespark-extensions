# Privacy Policy — LoveSpark YT Digest

_Last updated: 2026-10-08_

LoveSpark YT Digest is a free, open-source LoveSpark browser extension. It reads the captions of the YouTube video you are watching and, **only when you ask it to and only if you have entered your own OpenAI API key**, sends that transcript to OpenAI to get a summary. This policy explains exactly what that means.

## What is stored

Everything is kept in your browser's own extension storage (`chrome.storage.local`) on your device. Nothing uses `chrome.storage.sync`. Stored items:

- **Your OpenAI API key** (`apiKey`), if you enter one in Settings. It is stored in plain form in local extension storage and is only ever sent to OpenAI (see below).
- **Your preferences**: OpenAI model (`model`), summary style (`summaryStyle`), summary length (`summaryLength`), how long to keep cached summaries (`cacheDurationDays`), on/off state (`isEnabled`), and theme (`theme`).
- **Cached summaries** (`digest_<videoId>`): for each video you summarize, the summary, the timestamped transcript, the caption language, whether captions were auto-generated, the video's ID, title, channel name, length and live-stream flag, and the time it was cached. These are deleted automatically after your chosen cache duration (default 7 days), and you can clear them any time with "Clear Cache" in Settings.
- **Usage counters**: summaries made today and in total (`digestsToday`, `digestsTotal`) and the date of the last daily reset (`lastResetDate`). These are shown in the popup and badge and never leave your device.

Caption track information for the current video is also held temporarily in the background worker's memory and is discarded when the browser unloads it. You can remove all stored data by uninstalling the extension.

## What is transmitted

LoveSpark YT Digest does **not** collect any data for the developer. There are no analytics, no tracking, no ads, no accounts, and no remote code. It does make the following network requests:

- **To OpenAI (`https://api.openai.com/v1/chat/completions`)** — only when you click summarize (or use the Alt+Shift+D shortcut) and you have saved an API key. The request contains: your API key (as the authorization header), the video's transcript text (split into parts for very long videos), the video title and channel name, and the summary instructions. When you click "Test Key" in Settings, a tiny test request ("Say \"ok\"") is sent with the key you entered. Data sent to OpenAI is handled under OpenAI's own terms and privacy policy, under your own OpenAI account. If you never enter an API key, nothing is ever sent to OpenAI.
- **To YouTube** — to read a video's captions, the extension downloads the caption track from the caption URL that YouTube itself provides in the page (a YouTube address). This is the same caption data YouTube serves to its own player; the extension sends nothing of yours to YouTube beyond that standard request.

All fonts, images and scripts are packaged inside the extension; no external fonts or CDNs are loaded. The footer contains ordinary links to lovespark.love and Ko-fi that open only if you click them.

## Permissions

| Permission | Why it is needed |
|---|---|
| `storage` | Saves your API key, preferences, cached summaries and usage counters locally (see "What is stored"). |
| Host: `*://*.youtube.com/*` | Lets the content scripts run on YouTube to detect the current video and its caption tracks, and lets the background worker download the caption file from YouTube. |
| Host: `https://api.openai.com/*` | Lets the background worker send the transcript to OpenAI for summarization, and test your API key, using your own key. |

**Content scripts** run only on `*://*.youtube.com/*` pages:

- `content-main.js` (runs in the page itself) wraps the page's `JSON.parse` to spot YouTube's caption-track list and video details (ID, title, channel, length, live flag) and passes them to the extension's other content script within the page. It does not modify the page.
- `content.js` relays that caption information to the extension's background worker, notices when you navigate to another video, and answers the popup's request for the current video ID, title and channel name.

Other declared items: a keyboard shortcut (`commands`, Alt+Shift+D) that summarizes the current video, and `mascot.png` exposed as a web-accessible resource on YouTube pages. The extension also uses `chrome.tabs` (to find the active YouTube tab and open the digest and settings pages) and `chrome.action` (to show today's summary count on the badge); these need no separate permission.

## Third-party services

- **OpenAI** — used only if you enter your own OpenAI API key and request a summary. Your transcript, video title, channel name and API key are sent to OpenAI as described above. See OpenAI's privacy policy for how they handle it.
- **YouTube** — caption files are downloaded from YouTube's own caption URLs for the video you are viewing.

No other third-party services are used.

## Children's privacy

The extension collects no personal information for the developer from anyone, including children under 13. The optional OpenAI feature requires the user's own OpenAI account and key.

## Contact

Questions or problems: open an issue at https://github.com/Joona-t/lovespark-extensions/issues

## Verify it yourself

The full source code is public: https://github.com/Joona-t/lovespark-extensions/tree/main/productivity/lovespark-yt-digest
