# LoveSpark Popup Fortress — Chrome Web Store Submission

---

## Store Listing Tab

**Name:** LoveSpark Popup Fortress
**Category:** Productivity

### Short Description (132 chars max)

Blocks unwanted popups, redirects, and meta refreshes by overriding browser APIs. Tracks stats locally. Zero data collection.

### Detailed Description

Websites open popups, redirect you to ad pages, and inject meta refresh tags — all without your permission. LoveSpark Popup Fortress stops them at the source by overriding the APIs sites abuse.

HOW IT WORKS

Five layers of protection work together to block unwanted popups and redirects:

1. window.open Override: Intercepts window.open() calls and only allows them during real user gestures (click, keydown, touch). Programmatic popups are silently blocked.
2. Location Override: Blocks location.assign() and location.replace() redirects that fire without user interaction. Legitimate link clicks pass through normally.
3. Synthetic Anchor Blocking: Catches the pattern where sites create invisible anchor tags with target="_blank" and call .click() programmatically.
4. Meta Refresh Blocking: A MutationObserver removes injected meta refresh tags before they can redirect you.
5. declarativeNetRequest: Static network rules block known popup and redirect patterns at the request level.

USER GESTURE DETECTION

Unlike simple popup blockers, Popup Fortress uses gesture-aware blocking. When you actually click a link or button, popups and navigation are allowed through. Only programmatic, non-user-initiated actions are blocked. This means legitimate site functionality keeps working.

STATS TRACKING

The popup shows how many popups were crushed today and your lifetime total. A badge on the extension icon shows today's count. Stats are stored 100% locally and never transmitted anywhere.

WHAT IT DOESN'T DO

- Does not block ads or page content
- Does not collect any user data
- Does not phone home or make any network requests
- Does not store cookies or browsing history
- Does not modify page content beyond blocking popups and redirects

PRIVACY

- Zero data collection — no analytics, no telemetry, no outbound calls
- All data stays local using chrome.storage.local
- No remote code execution — every script is bundled locally
- Open source under MIT license — read every line yourself

Part of the LoveSpark Suite — free, open-source tools that respect your attention and privacy.

---

## Single Purpose Description

This extension has a single purpose: blocking unwanted popup windows and programmatic redirects. It uses five methods to accomplish this: overriding window.open() to block non-gesture popups, overriding location.assign() and location.replace() to block programmatic redirects, intercepting synthetic anchor clicks, removing injected meta refresh tags via MutationObserver, and declarativeNetRequest rules to block known popup network patterns. All blocking is gesture-aware — user-initiated navigation passes through. It does not block ads, modify page content, or perform any function beyond popup and redirect blocking.

---

## Privacy Practices Tab

### Single Purpose

This extension blocks unwanted popup windows and programmatic redirects on web pages.

### Permission Justifications

**alarms**
Used to schedule an hourly check that resets the daily popup counter at midnight. The alarm triggers a simple date comparison and counter reset — no network activity or data collection is involved.

**declarativeNetRequest**
Used to block network requests matching known popup and redirect patterns before they load. The rules only block specific popup-related URLs — they do not modify, redirect, or intercept any other network traffic.

**storage**
Used to store the user's toggle state (enabled/disabled), daily and lifetime popup block counters, and the date of the last counter reset. All data is stored locally using chrome.storage.local. No data is transmitted externally.

**Host permissions: <all_urls>**
Required because popups and redirects can occur on any website. The extension must operate on all URLs to intercept popup attempts wherever they happen. The extension only intercepts popup and redirect calls — it does not read, collect, or transmit any page content or browsing data.

**Content scripts: <all_urls> (MAIN world)**
A content script runs in MAIN world on all pages to override window.open(), location.assign(), location.replace(), and HTMLElement.click() for anchor elements. It also observes for injected meta refresh tags. These overrides only block non-gesture-initiated actions. The script does not read or collect any page content, form data, or personal information.

**Content styles: <all_urls>**
A CSS stylesheet is injected on all pages to hide known overlay-style popup elements before they render.

### Data Usage Disclosures

Check "No" for all of the following:
- Does your extension collect personally identifiable information? **No**
- Does your extension collect health information? **No**
- Does your extension collect financial and payment information? **No**
- Does your extension collect authentication information? **No**
- Does your extension collect personal communications? **No**
- Does your extension collect location data? **No**
- Does your extension collect web history? **No**
- Does your extension collect user activity? **No**
- Does your extension collect website content? **No**

### Data Usage Certification

Certify all of the following:
- I do not sell user data to third parties
- I do not use or transfer user data for purposes unrelated to the extension's core functionality
- I do not use or transfer user data to determine creditworthiness or for lending purposes

### Remote Code

Does this extension execute remote code? **No**
All code is bundled locally within the extension package. No external scripts, APIs, or remote resources are loaded at runtime.

### Privacy Policy URL

https://github.com/Joona-t/lovespark-popup-fortress/blob/main/README.md
