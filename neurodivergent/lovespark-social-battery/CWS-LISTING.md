# LoveSpark Social Battery — CWS Listing

## Extension name

LoveSpark Social Battery — Energy Tracker

## Short description

Track your social battery from 0–100% and manage social fatigue. A free, private social energy tracker for ADHD minds & introverts.

## Detailed description

**Know your limits before you hit them.** LoveSpark Social Battery is a simple social battery tracker that lives in your browser toolbar. Set your current social energy on a 0–100% scale, glance at it any time, and make better decisions about when to say yes, when to rest, and when to step away.

If you're an introvert or have ADHD, you know social fatigue isn't laziness — it's a real, finite resource that drains through meetings, calls, group chats, and back-to-back interactions. This social energy tracker gives that feeling a number you can actually see, so you can pace your day instead of crashing at the end of it.

**Who it's for:** introverts, neurodivergent folks, ADHD brains, highly sensitive people, and anyone who wants a lightweight mood and energy check-in without another account to manage. It was built neurodivergent-first by a neurodivergent developer.

**What you can do:**

- Set your social battery level anywhere from 0% to 100% with a single control
- See your current social energy at a glance the moment you open the popup
- Watch a clear visual battery indicator reflect how much you have left
- Have your level saved locally and remembered the next time you open your browser
- Switch between calming retro-pink, dark, beige, and slate themes
- Read everything in the OpenDyslexic font, with a system-rounded fallback, for low-strain accessible text

**Built the LoveSpark way:**

- **Free forever.** No ads, no upsells, no premium tier.
- **Open source.** MIT licensed — read every line at the repository linked below.
- **Zero data collection.** Nothing is transmitted anywhere. Your social energy level is stored only in your own browser via `chrome.storage.local`.
- **Accessible by design.** OpenDyslexic typography, high-contrast themes, keyboard navigation, and reduced-motion support.

A quick browser check-in beats nothing at all — pop it open between calls, set where your battery sits, and give your social fatigue the visibility it deserves.

## Single-purpose justification

LoveSpark Social Battery has one purpose: to let a user record and view their current social energy level (0–100%) so they can manage social fatigue. Every feature serves that single purpose. The slider/control sets the level, the visual battery indicator displays it, local storage remembers it between sessions, and the themes and OpenDyslexic font make that same single self-check-in readable and comfortable for neurodivergent users. There are no unrelated tools, content modification, browsing features, or secondary functions bolted on — the extension does exactly one thing and everything in it exists to do that one thing well.

## Per-permission justification

**storage** — Used solely to save the user's current social battery level and their selected theme so the value persists between popup openings and browser restarts. Without `storage`, the user's social energy reading would reset to default every time the popup closed, defeating the core purpose of tracking it over time. All data written through this permission stays in `chrome.storage.local` on the user's own device and is never read by, or sent to, any external party.

## Host-permissions justification

No host permissions are requested. LoveSpark Social Battery does not declare `<all_urls>` or any host match pattern. It does not read, access, modify, or inject into any web page, and it does not observe your browsing activity in any way. The extension operates entirely within its own popup interface and local storage.

## Privacy disclosure (CWS Section 5)

Paste the following into the Chrome Web Store privacy form:

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

**Developer certifications — tick all three checkboxes:**

- ☑ I do not sell or transfer user data to third parties, outside of the approved use cases.
- ☑ I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:**
https://github.com/Joona-t/lovespark-extensions/blob/main/neurodivergent/lovespark-social-battery/PRIVACY.md

Note for reviewers: this extension stores a single numeric social-battery value and a theme preference in `chrome.storage.local` only. It declares no host permissions, makes no network requests, and contains no remote code — there is genuinely nothing to collect or transmit.

## Reviewer test instructions

This takes about 3 minutes and requires no account, login, or setup.

1. **Install and pin** the extension, then click the LoveSpark Social Battery toolbar icon to open the popup. You'll see the Sparky mascot, a battery indicator, and a level control.
2. **Read the current level.** The popup shows the current social energy as a percentage (0–100%) with a matching visual battery indicator.
3. **Change your level.** Use the on-screen control (slider/buttons) to lower the value to roughly 40%. Confirm the percentage and the visual battery indicator update immediately.
4. **Confirm persistence.** Close the popup and reopen it. The value should still read ~40% — confirming it was saved to `chrome.storage.local`, the only thing the single `storage` permission is used for.
5. **Test a theme.** Open the "Change Theme" dropdown (top-right) and switch to another theme (e.g., dark). The popup restyles and the choice persists on reopen.
6. **Verify zero network activity.** Open DevTools → Network on the popup. Interact with the controls. Confirm there are no outbound requests — no data leaves the device, consistent with the privacy disclosure above.

Expected result: the social battery value and theme persist locally, the UI is fully keyboard-navigable, and no network traffic occurs.
