# Privacy Policy — LoveSpark Brain Dump

**Effective date:** 2026-07-08 · **Applies to version:** 1.0.32

LoveSpark Brain Dump is a free, open-source browser extension built to help you empty your spinning brain — quick-capture a thought with one keystroke, tag it as do / think / feel, and clear your working memory. This policy explains, in plain language, exactly what the extension does and does not do with your information.

**The short version:** everything you write stays on your own device. The extension has no account, no server, and no way to send your data anywhere. There is nothing to opt out of because there is nothing being collected.

---

## What we store

Everything the extension saves is written to your browser's local storage (`chrome.storage.local`) on your own computer. That is the only place your data ever lives. Specifically, the extension may store:

- **Your captured thoughts** — the text of the notes you quick-capture.
- **Your tags** — the do / think / feel label attached to each entry.
- **Timestamps** — when an entry was captured, so entries can be ordered and cleared.
- **Your settings and preferences** — such as your chosen theme and any display or behavior options you set.
- **Local counters** — lightweight, on-device tallies (for example, how many thoughts you've captured or cleared) used only to show your activity back to you inside the popup.

This data never leaves your browser. Clearing your working memory inside the extension, or clearing your browser's data for the extension, removes it. Uninstalling the extension removes it as well.

## What we transmit

**Zero data is transmitted externally. None. Ever.**

- No analytics.
- No telemetry.
- No usage tracking or "phone home" pings.
- No remote servers, APIs, or endpoints of any kind.
- No accounts, logins, or cloud sync.

The extension has no code that sends your information anywhere, because it has no network access to do so. Your thoughts stay between you and your own browser.

## Permissions

LoveSpark Brain Dump requests exactly one permission, and only for the feature described below:

- **`storage`** — Used solely to save your captured thoughts, their do / think / feel tags, timestamps, your settings, and local activity counters in `chrome.storage.local` on your device, so your brain dump persists between browser sessions. This permission grants access only to the extension's own local storage area; it does not read or write any website's data and cannot access the internet.

That is the complete list. The extension declares no permissions it does not actively use.

## Host permissions

**None.** LoveSpark Brain Dump requests **no host permissions** and **no access to any website**.

Because of this, the extension:

- Does **not** read, monitor, or collect your browsing history.
- Does **not** see the pages you visit or the content of any website.
- Does **not** inject scripts, ads, trackers, or any other code into the pages you view.
- Does **not** modify, intercept, or transmit any web traffic.

It simply cannot do these things — it has no access to the web to do them with.

## Third-party services

**None.** The extension bundles no third-party SDKs, analytics libraries, advertising networks, trackers, or external services of any kind. Nothing about your use of the extension is shared with anyone, because there is no one — and no service — to share it with.

## Children's privacy

LoveSpark Brain Dump collects **no personal information from anyone**, including children under the age of 13. Because all data stays on the user's own device and nothing is ever transmitted, gathered, or sold, the extension is safe for users of all ages and complies with children's privacy expectations by design.

## Changes to this policy

If this policy ever changes, the updated version will be published in the public source repository, and the **Effective date** and **version** at the top of this document will be updated to reflect the change. Because the extension is open source, the full history of any change to this policy is visible in the repository's commit log. Continued use of the extension after an update means the current policy applies.

## Contact

Questions, concerns, or reports about privacy? Please open an issue:

**https://github.com/Joona-t/lovespark-extensions/issues**

## Open source / verification

You do not have to take our word for any of this. LoveSpark Brain Dump is fully open source, and every claim in this policy can be verified by reading the code:

**https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-brain-dump**

Inspect the source, review the manifest, and confirm for yourself that the extension stores data only in local storage, requests only the `storage` permission, uses no host permissions, and never transmits anything. Transparency is the point — privacy you can check.
