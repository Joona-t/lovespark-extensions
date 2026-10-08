# LoveSpark Task Anchor — CWS Listing

## Extension name
LoveSpark Task Anchor — Stay Focused

## Short description
Pin your current task as a persistent reminder and stay focused — one task at a time. A privacy-first, ADHD-friendly focus anchor.

## Detailed description
**What was I doing again?** If that question derails your day, LoveSpark Task Anchor is built for you. Pin the one thing you're working on, and keep it one click away from any tab — a calm, persistent task reminder that helps you stay focused instead of drowning in twelve open thoughts.

Task Anchor is a deliberately small focus tool. You type your current task, click pin, and it's saved. Open a new tab, get pulled into research, come back an hour later — click the toolbar icon and your anchor is right there, exactly where you left it. The toolbar badge quietly shows that an anchor is set, so you have a gentle nudge that you committed to one thing. It's the lightweight, privacy-first alternative to heavy new-tab dashboards: a Momentum Dashboard or PurposeTab alternative that does **not** hijack your new tab page and does **not** watch your browsing.

This is a single-task focus tool on purpose. Working memory loss and task-switching are real costs for ADHD and neurodivergent brains, and "do one task at a time" only works if that task stays visible. Task Anchor keeps your focus anchor in reach without timers, streaks, blockers, or guilt.

Built neurodivergent-first by a neurodivergent developer, it uses clear, high-contrast monospace typography, a soft retro-pink theme, full keyboard navigation, reduced-motion support, and WCAG-AA contrast — so the tool that's supposed to reduce friction doesn't add any.

**Features**
- 📌 **Pin your current task** as a persistent reminder that survives new tabs and browser restarts
- 🔁 **Available from any tab** — click the toolbar icon to see your anchor instantly, wherever you are
- 📍 **On-page banner reminder** — your pinned task can also appear as a small, dismissible banner directly on the page you're viewing (position and auto-hide are configurable), so the anchor stays visible without needing to click the toolbar icon
- 🔖 **Toolbar badge indicator** shows at a glance that an anchor is set
- 🧠 **One task at a time** by design — a focus anchor, not another overflowing to-do list
- ✏️ **Edit or clear** your task in a tap when you finish or switch
- ♿ **Accessible by default** — keyboard-friendly, reduced-motion, high-contrast retro-pink UI with clear monospace typography
- 🔒 **Zero data collection** — everything stays on your device in local storage

**Free, open source, and private.** Task Anchor is MIT-licensed and completely free, with no ads, no accounts, and no tracking. It stores your pinned task only in your browser's local storage and transmits absolutely nothing externally — there are no servers to send anything to. You can read every line of code at https://github.com/Joona-t/lovespark-task-anchor.

If you've been searching for a stay-focused Chrome extension, a persistent task reminder, or a single-task focus tool that respects your attention *and* your privacy, pin your task and get back to it.

## Single-purpose justification
LoveSpark Task Anchor has one purpose: to let you pin a single current task and keep it readily in view so you can stay focused on it. Every part of the extension serves that one job — the popup lets you write, see, edit, and clear your pinned task; local storage makes that task persist across tabs and restarts so it's there when you return; the on-page banner and toolbar badge are two presentations of the same anchored task, keeping it visible on the page you're using without you needing to open the popup. There are no unrelated features — no timers, no site blocking, no note-taking, no new-tab takeover, no analytics. The extension does exactly one thing and is intentionally scoped to keep your one current task anchored.

## Per-permission justification
**storage** — Used solely to save your pinned task and banner preferences (position, auto-hide) on your own device via `chrome.storage.local`, so that your current task persists when you open new tabs, switch windows, or restart the browser, and is shown again when you reopen the popup or a page. This is the only mechanism that makes the "persistent" anchor possible. No data stored with this permission ever leaves your device.

## Host-permissions justification
LoveSpark Task Anchor declares a content script matching `<all_urls>` (see `content_scripts` in `manifest.json`) — this is what lets the pinned-task banner appear directly on the page you're viewing, not just inside the popup. The content script's access is narrow and one-way: it reads only the page's URL scheme (`location.protocol`) to skip internal browser pages, and it writes a single self-contained banner element (your task text, a Done button, a dismiss button) built entirely from data already in the extension's own local storage. It does not read page content, forms, or any other page data, does not use `activeTab`, `scripting`, or `tabs`, and does not track your browsing. Nothing observed on a page is ever transmitted anywhere — the banner is a display-only reminder of a task you typed into the extension yourself.

## Privacy disclosure (CWS Section 5)
**Data collection categories — set every category to "Not collected":**
- Personally identifiable information — **Not collected**
- Health information — **Not collected**
- Financial and payment information — **Not collected**
- Authentication information — **Not collected**
- Personal communications — **Not collected**
- Location — **Not collected**
- Web history — **Not collected**
- User activity — **Not collected**
- Website content — **Not collected**

**Required certification statements (all true for this extension):**
- I do **not** sell or transfer user data to third parties, outside of approved use cases.
- I do **not** use or transfer user data for purposes that are unrelated to my item's single purpose.
- I do **not** use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** https://github.com/Joona-t/lovespark-task-anchor/blob/main/PRIVACY.md

**Developer certification checkboxes to tick:**
- ☑ This item complies with the Developer Program Policies.
- ☑ I have disclosed all data collection and usage, and the disclosures above are accurate.

*Note for the reviewer: this extension stores a single user-typed task string (plus display preferences) only in `chrome.storage.local` on the user's own device. It declares a `<all_urls>` content script solely to render a display-only banner of that task on the active page; the content script does not read page content and makes no network request. Nothing is transmitted off-device; there is no backend.*

## Reviewer test instructions
Total time ~3 minutes. No account, login, or special setup required.

1. **Install and open** — After installing, click the LoveSpark Task Anchor icon in the toolbar to open the popup. You'll see an input field for your current task and a pin/save control.
2. **Pin a task** — Type a task such as `Finish the quarterly report` and click the pin/save button. The popup now displays your pinned task as the active anchor, and the toolbar badge updates to indicate an anchor is set.
3. **Verify cross-tab availability and on-page banner** — Open a new tab and navigate to any site (e.g., `https://example.com`). Click the toolbar icon again: the same pinned task is still shown. You should also see a small banner with the same task text appear on the page itself — this is the content script rendering the on-page reminder from local storage; it does not read anything from the page you're viewing.
4. **Verify persistence across restart** — Close and reopen the browser (or disable/re-enable the extension), then open the popup. The pinned task is still present, confirming it was saved to `chrome.storage.local`.
5. **Edit and clear** — Change the task text or use the clear control to remove the anchor. Confirm the popup, the on-page banner, and the toolbar badge update accordingly.
6. **Confirm no network access** — Open `chrome://extensions`, inspect the extension's permissions: `storage` plus a `<all_urls>` content script for the on-page banner, no other host access. Open DevTools' Network panel while using the popup and the banner to confirm no external requests are made at any point.

Expected result: a single pinned task is created, is shown both in the popup and as an on-page banner, persists across tabs and restarts, can be edited or cleared, and no data ever leaves the device.
