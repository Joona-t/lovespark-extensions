# LoveSpark Cookie Annihilator — Chrome Web Store Submission

---

## Store Listing Tab

**Name:** LoveSpark Cookie Annihilator
**Category:** Privacy & Security

### Short Description (132 chars max)

Automatically removes cookie consent banners so you can browse without interruption. No data collection, fully local.

### Detailed Description

Cookie consent banners interrupt your browsing on nearly every website. They pile up, demand clicks, and break your focus. LoveSpark Cookie Annihilator removes them automatically.

HOW IT WORKS

Three layers of protection work together to keep your browsing clean:

1. CSS Layer: Known cookie banner containers are hidden instantly via an injected stylesheet, before they even render on screen.
2. Network Blocking: Consent SDK scripts (OneTrust, CookieBot, Didomi, and others) are blocked via declarativeNetRequest before they load, preventing banners from being created in the first place.
3. Dynamic Detection: A MutationObserver watches for banners that appear after page load. When detected, the extension clicks "Reject All" or "Necessary Only" buttons automatically. If no reject button exists, it opens settings, unchecks optional cookies, and saves with minimal consent.

WHAT IT HANDLES

OneTrust, CookieBot, Didomi, Quantcast, Usercentrics, iubenda, Termly, Complianz, Osano, SourcePoint, TrustArc, CookieScript, CookieFirst, CookieYes, Axeptio, Borlabs, Moove GDPR, Evidon, Civic Cookie Control, and generic cookie/GDPR banners.

Supports reject buttons in English, German, French, Italian, Spanish, and Portuguese.

After removing a banner, the extension also cleans up dark overlays and restores page scrolling that banners often lock.

STATS TRACKING

The popup shows how many banners were removed today and your lifetime total. Stats are stored 100% locally and never transmitted anywhere.

WHAT IT DOESN'T DO

- Does not block ads or page content
- Does not collect any user data
- Does not phone home or make any network requests
- Does not store cookies or browsing history
- Does not modify page content beyond removing consent banners

PRIVACY

- Zero data collection — no analytics, no telemetry, no outbound calls
- All data stays local using chrome.storage.local
- No remote code execution — every script is bundled locally
- Open source under MIT license — read every line yourself

Part of the LoveSpark Suite — free, open-source tools that respect your attention and privacy.

---

## Single Purpose Description

(Chrome Web Store requires a single-purpose justification)

This extension has a single purpose: removing cookie consent banners from web pages. It uses three methods to accomplish this: CSS rules to hide known banner containers, declarativeNetRequest rules to block consent SDK network requests, and a content script to detect and dismiss dynamically injected banners by clicking reject/decline buttons. It does not block ads, modify page content beyond consent banners, or perform any function beyond cookie banner removal.

---

## Privacy Practices Tab

### Single Purpose

This extension removes cookie consent banners from web pages to reduce browsing interruptions.

### Permission Justifications

**alarms**
Used to schedule an hourly check that resets the daily banner counter at midnight. The alarm triggers a simple date comparison and counter reset — no network activity or data collection is involved.

**declarativeNetRequest**
Used to block network requests to known consent management platform scripts (OneTrust, CookieBot, Didomi, Quantcast, etc.) before they load. This prevents cookie banners from being created in the first place. The rules only block specific consent SDK URLs — they do not modify, redirect, or intercept any other network traffic.

**storage**
Used to store the user's toggle state (enabled/disabled), daily and lifetime banner removal counters, and the date of the last counter reset. All data is stored locally using chrome.storage.local. No data is transmitted externally.

**Host permissions: <all_urls>**
Required because cookie consent banners appear on websites across all domains. The extension must operate on all URLs to detect and remove banners wherever they appear. The extension only interacts with cookie consent elements — it does not read, collect, or transmit any page content or browsing data.

**Content scripts: <all_urls>**
A content script runs on all pages to detect cookie consent banners via known CSS selectors and generic attribute patterns. When a banner is found, it clicks "Reject All" or equivalent buttons, or hides the banner if no button is available. It also removes dark overlays and restores scroll-locked pages. The content script does not read or collect any page content, form data, or personal information.

**Content styles: <all_urls>**
A CSS stylesheet is injected on all pages to immediately hide known cookie banner containers before they render. This provides instant visual cleanup without waiting for JavaScript to load.

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

https://github.com/Joona-t/lovespark-cookie-nuke/blob/main/README.md
