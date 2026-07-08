# LoveSpark Brain Dump — CWS Listing

## Extension name

LoveSpark Brain Dump

## Short description

Quick-capture ADHD brain dump: empty your spinning mind with one keystroke, tag thoughts do/think/feel. Free, private, no account.

## Detailed description

**Your working memory is not a to-do list. Stop trying to hold it all in your head.**

LoveSpark Brain Dump is a free, open-source quick-capture tool built for ADHD and neurodivergent brains. When your mind is spinning with half-thoughts, reminders, worries, and ideas all at once, you open the popup, type the thought, and it's out of your head and safely saved — in one keystroke. No friction, no forms, no "just let me organize this first."

Every captured thought can be tagged with one of three simple buckets: **do** (something actionable), **think** (something to mull over), or **feel** (something emotional to acknowledge). That's the whole system. It's deliberately small, because a complicated capture tool is a capture tool you won't use when your brain is at capacity.

Brain dumping is a well-known strategy for reducing cognitive load and clearing working memory. LoveSpark Brain Dump makes it a one-second habit instead of a chore, so you can offload the mental clutter and get back to focusing on the one thing in front of you.

**Built neurodivergent-first:**
- ⌨️ **One-keystroke capture** — open, type, done. The input is ready the moment the popup opens.
- 🏷️ **Do / Think / Feel tagging** — three buckets, zero decision paralysis.
- 🧹 **Clear your working memory** — get thoughts out of your head so you can concentrate.
- 🔤 **OpenDyslexic-friendly, accessible UI** — high-contrast, keyboard-navigable, respects reduced-motion.
- 🎀 **Calm retro-pink design** — a gentle, low-stimulation interface that won't overwhelm.
- 🔒 **100% private** — everything stays on your device.
- 🆓 **Always free, MIT-licensed, open source** — no ads, no upsell, no catch.

**Privacy you can verify.** LoveSpark Brain Dump stores your thoughts only in your browser's local storage (`chrome.storage.local`). It transmits **zero** data anywhere. There is no account, no login, no cloud sync, no analytics, and no tracking. Nothing you type ever leaves your computer. The full source code is public so you can confirm exactly that: https://github.com/Joona-t/lovespark-brain-dump

Empty your spinning brain. Keep your focus. Own your data.

## Single-purpose justification

LoveSpark Brain Dump has one purpose: to let a user instantly capture a fleeting thought and clear it from their working memory. Every feature serves that single purpose. The one-keystroke text capture *is* the brain dump. The do/think/feel tags exist only to sort captured thoughts into lightweight buckets so the dump stays usable. The saved list exists only so the user can revisit and clear what they offloaded. There are no unrelated capabilities — no browsing tools, no content injection, no external integrations. The extension does exactly one thing: capture-and-clear a brain dump.

## Per-permission justification

**storage** — Used solely to save the user's captured thoughts and their do/think/feel tags to `chrome.storage.local` so the brain dump persists between sessions and browser restarts. Without this permission the extension could not retain a single captured thought after the popup closes. Data written under this permission stays on the user's device and is never transmitted anywhere.

## Host-permissions justification

LoveSpark Brain Dump requests **no host permissions**. It does not request `<all_urls>` or any host pattern, does not read or modify any web page, and has no content scripts. All functionality lives entirely within the extension popup, so access to websites is neither requested nor needed.

## Privacy disclosure (CWS Section 5)

**Data collected — set every category to "Not collected":**

- Personally identifiable information — **Not collected**
- Health information — **Not collected**
- Financial and payment information — **Not collected**
- Authentication information — **Not collected**
- Personal communications — **Not collected**
- Location — **Not collected**
- Web history — **Not collected**
- User activity — **Not collected**
- Website content — **Not collected**

The thoughts a user types are stored exclusively in `chrome.storage.local` on the user's own device and are never sent to the developer or any third party, so no data is *collected* in the CWS sense.

**Certification checkboxes — tick all three:**

- ☑ I do not sell or transfer user data to third parties, apart from the approved use cases.
- ☑ I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** https://github.com/Joona-t/lovespark-brain-dump/blob/main/PRIVACY.md

## Reviewer test instructions

No account, login, or setup is required. The whole extension lives in the toolbar popup. This takes about 3 minutes.

1. **Open the popup.** Click the LoveSpark Brain Dump icon in the Chrome toolbar (pin it via the puzzle-piece menu if needed). The capture input is focused and ready immediately.
2. **Capture a thought.** Type `Buy oat milk` and submit it (press Enter / the capture control). The thought appears in the saved list below the input — this is the core brain-dump action.
3. **Tag it.** Assign the tag **do** to that thought. Add a second thought, e.g. `Why do I keep opening new tabs`, and tag it **think**. Add a third, e.g. `Feeling scattered today`, and tag it **feel**. Confirm all three appear with their do/think/feel tags.
4. **Verify persistence (local storage).** Close the popup and reopen it. All three thoughts and their tags are still there — confirming they were saved to `chrome.storage.local`.
5. **Verify it clears.** Remove or clear a thought to confirm the user can empty their brain dump once it's been offloaded.
6. **Verify no network activity.** Open DevTools → Network on the popup and repeat steps 2–3. You will see **no outbound requests** — nothing the user types leaves the browser. The extension declares only the `storage` permission and no host permissions, so it cannot read web pages or contact any server.

Expected result: thoughts capture instantly, tag into do/think/feel, persist locally across sessions, and never leave the device.
