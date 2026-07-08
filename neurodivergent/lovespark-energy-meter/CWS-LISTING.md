# LoveSpark Energy Meter — CWS Listing

## Extension name

LoveSpark Energy Meter

_(22 / 45 characters)_

## Short description

Track your daily energy levels (1–5) with one tap. A private, offline energy tracker and mood log built neurodivergent-first.

_(125 / 132 characters)_

## Detailed description

LoveSpark Energy Meter is a simple, private energy tracker for your browser. Tap once to log how much energy you have right now on a clear 1–5 scale, then watch today's energy curve build up as the day goes on.

If your energy comes in waves — big mornings and flat afternoons, or the reverse — a quick, low-effort log helps you notice the pattern instead of guessing. Across a single day you can see when you naturally peak and when you dip, so you can plan demanding work for your good hours and give yourself grace during the low ones.

Built neurodivergent-first. Logging takes one tap, the scale is only five points, and there is nothing to configure before you start. The interface uses the dyslexia-friendly OpenDyslexic font, a calm retro-pink theme, high-contrast colors, full keyboard navigation, and reduced-motion support — so checking in on your energy never becomes another draining task.

Who it helps:
- People with ADHD, autism, or other neurodivergence who experience uneven or unpredictable energy
- Anyone managing fatigue, burnout recovery, or limited "spoons" who wants a lightweight daily energy log
- Focus-minded folks who want to match hard tasks to their natural energy peaks

Features:
- One-tap energy logging on a simple 1–5 scale
- Today's energy curve, so you can see your ups and downs at a glance
- A pattern-friendly view that helps you spot recurring peaks and dips over the day
- No account, no sign-up, no setup — open the popup and log
- Works fully offline

Privacy and cost:
- 100% free, forever — no ads, no upsells, no premium tier
- Open source under the MIT license: read every line at https://github.com/Joona-t/lovespark-energy-meter
- Zero data collection — everything you log is stored only on your own device using Chrome's local storage, and nothing is ever transmitted anywhere

LoveSpark Energy Meter does one thing well: it makes checking in on your energy fast enough that you will actually do it.

## Single-purpose justification

LoveSpark Energy Meter has a single purpose: to let you record your current energy level and review your energy across the day. Every feature serves that one purpose. The one-tap 1–5 control captures an energy reading, today's energy-curve view displays those readings back to you, and local storage persists them so the curve survives popup closes and browser restarts. There are no unrelated tools, no secondary features, and nothing that operates outside the single loop of "log an energy level, then look at your energy levels."

## Per-permission justification

**storage** — The extension uses `chrome.storage.local` to save each energy reading you log so that today's energy curve persists after you close the popup or restart your browser. This is the only way the extension can display your energy pattern for the day; without it, every log would be lost the moment the popup closed. Storage is used exclusively to hold your own energy entries, and only on your own device.

## Host-permissions justification

LoveSpark Energy Meter requests no host permissions. It does not read, modify, or access any website, tab content, URL, or browsing activity. The extension runs entirely within its own popup and needs no access to the pages you visit.

## Privacy disclosure (CWS Section 5)

Paste the following into the Chrome Web Store **Privacy practices** tab.

**Single purpose description:**
> LoveSpark Energy Meter lets you log your current energy level on a 1–5 scale and review your energy curve for the day. That is its only purpose.

**Data collection — set every category to "Not collected":**
- Personally identifiable information — **Not collected**
- Health information — **Not collected**
- Financial and payment information — **Not collected**
- Authentication information — **Not collected**
- Personal communications — **Not collected**
- Location — **Not collected**
- Web history — **Not collected**
- User activity — **Not collected**
- Website content — **Not collected**

(The extension stores your energy entries only in `chrome.storage.local` on your device and transmits nothing off-device, so no data is "collected" as the Chrome Web Store defines it.)

**Data usage certifications — check all three:**
- ☑ I do not sell or transfer user data to third parties, outside of the approved use cases.
- ☑ I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:**
> https://github.com/Joona-t/lovespark-energy-meter/blob/main/PRIVACY.md

**Developer certification checkboxes to tick:**
- ☑ The item's data usage complies with the Chrome Web Store Developer Program Policies.
- ☑ A privacy policy is provided and the URL above is entered in the "Privacy policy" field.

## Reviewer test instructions

Total time: about 3 minutes. No account or setup is required.

1. Install and pin the extension, then click the **LoveSpark Energy Meter** toolbar icon to open the popup. You will see the Sparky mascot and a 1–5 energy scale — no login, onboarding, or setup screen appears.
2. Tap a value on the 1–5 scale (for example, tap **4**) to log your current energy. The reading is recorded instantly with a single tap.
3. Confirm that **today's energy curve** updates to include the entry you just logged.
4. Log a second, different value (for example, tap **2**). Confirm the curve now shows both points, reflecting your energy over time today.
5. Close the popup, then reopen it. Confirm your logged entries and today's curve are still present — this demonstrates local persistence via `chrome.storage.local`.
6. Open DevTools → **Network** and interact with the popup again. Confirm the extension makes **no network requests** and transmits no data; every entry stays on the device.
7. (Optional accessibility check) Operate the popup using only the **Tab** key plus **Enter**/arrow keys to confirm full keyboard operability and visible focus indicators.
