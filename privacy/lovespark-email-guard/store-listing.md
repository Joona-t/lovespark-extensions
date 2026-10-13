# LoveSpark Email Guard — Chrome Web Store Submission

---

## Store Listing Tab

**Name:** LoveSpark Email Guard
**Category:** Privacy & Security

### Short Description (132 chars max)

Blocks invisible tracking pixels in Gmail, Outlook & Yahoo Mail. See who's tracking your email opens.

### Detailed Description

Every marketing email, sales pitch, and newsletter contains an invisible 1x1 pixel image. The moment you open the email, that pixel phones home and tells the sender:

- That you opened their email
- Exactly when you opened it
- How many times you re-opened it
- Your approximate location (city level)
- What device you're using

Tools like Mailchimp, HubSpot, Superhuman, Salesforce, Mixmax, Yesware, and dozens more embed these pixels by default. Most people have no idea that opening an email is not a private action.

LoveSpark Email Guard makes it private again.

HOW IT WORKS

Two layers of protection work together:

1. Network blocking — Requests to 65+ known tracking pixel services are blocked before they leave your browser. The tracking server never receives the request.
2. Smart detection — A heuristic scanner identifies tracking pixels that network rules miss, including self-hosted trackers. Hidden 1x1 images, invisible beacons, and pixel patterns are caught and replaced with a local transparent image.

When trackers are found, a small shield badge appears on the email showing how many were blocked.

SUPPORTED EMAIL CLIENTS

- Gmail (mail.google.com)
- Outlook.com / Office 365
- Yahoo Mail

WHAT IT DOESN'T DO

- Does not block legitimate images in emails
- Does not modify email content or text
- Does not read or access your email content
- Does not collect any data about your emails

PRIVACY

- Zero data collection — we don't collect, transmit, or store any user data
- No accounts, no API keys, no tracking
- Only runs on webmail sites (not the whole internet)
- All processing happens 100% locally in your browser
- Open source under MIT license

Part of the LoveSpark Suite — free, open-source tools that respect your attention and privacy.

---

## Single Purpose Description

This extension blocks email tracking pixels to protect user privacy when reading emails in Gmail, Outlook.com, and Yahoo Mail.

---

## Privacy Practices Tab

### Single Purpose

This extension blocks email tracking pixels to protect user privacy.

### Permission Justifications

**declarativeNetRequest**
Used to create URL blocking rules that prevent image requests to 65+ known email tracking pixel domains (Mailchimp, HubSpot, Superhuman, etc.) when initiated from webmail sites. The rules only block tracking pixel requests — they do not block, modify, or redirect any other content.

**storage**
Used to store the user's preferences (enabled/disabled toggle) and a local counter of how many tracking pixels have been blocked. All data is stored locally using chrome.storage.local. No data is transmitted externally.

**Host permissions: webmail domains only**
Required by the declarativeNetRequest API to apply tracking pixel blocking rules on Gmail, Outlook.com, Office 365, and Yahoo Mail. Also required for the content script to scan email bodies for tracking pixels that network rules missed. The extension ONLY operates on these five webmail domains — it does not run on any other websites.

**Content scripts: webmail domains only**
A content script runs on Gmail, Outlook.com, and Yahoo Mail to detect tracking pixels using heuristic analysis (1x1 dimensions, hidden/invisible styling, known tracking URL patterns). Detected pixels are replaced with a local transparent image. A small shield badge is shown on tracked emails. The content script does not read, collect, or transmit any email content.

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
- I do not sell user data to third parties ✓
- I do not use or transfer user data for purposes unrelated to the extension's core functionality ✓
- I do not use or transfer user data to determine creditworthiness or for lending purposes ✓

### Remote Code

Does this extension execute remote code? **No**
All code is bundled locally within the extension package. No external scripts, APIs, or remote resources are loaded at runtime.

### Privacy Policy URL

https://github.com/Joona-t/lovespark-extensions/blob/main/privacy/lovespark-email-guard/PRIVACY.md

---

## Privacy Policy

**Privacy Policy — LoveSpark Email Guard**

Last updated: 2026-02-26

LoveSpark Email Guard does not collect, store, transmit, or share any user data. Period.

WHAT THE EXTENSION DOES

LoveSpark Email Guard detects and blocks invisible tracking pixels embedded in emails when you use Gmail, Outlook.com, or Yahoo Mail. All processing happens entirely locally in your browser. No data ever leaves your device.

DATA COLLECTION

- We collect no personal information
- We collect no browsing history
- We collect no URLs you visit
- We collect no email content or metadata
- We collect no analytics or usage data
- We collect no crash reports or telemetry

NETWORK REQUESTS

This extension makes zero network requests. It only blocks outgoing image requests to known tracking pixel domains. No data is sent to any server.

STORAGE

The extension stores locally: an enabled/disabled toggle preference, a daily counter of blocked tracking pixels, and a lifetime counter. This data never leaves your device.

THIRD PARTIES

We do not share data with third parties because we do not have any data to share.

PERMISSIONS USED

- declarativeNetRequest: Block image requests to known tracking pixel domains on webmail sites
- storage: Save user preferences and blocked pixel counters locally
- Host permissions (5 webmail domains): Run content script and blocking rules on Gmail, Outlook.com, Office 365, and Yahoo Mail only

OPEN SOURCE

https://github.com/Joona-t/lovespark-extensions/tree/main/privacy/lovespark-email-guard

CONTACT

lovesparksuite@gmail.com
