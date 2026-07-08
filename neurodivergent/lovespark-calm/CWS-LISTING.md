# LoveSpark Calm — CWS Listing

## Extension name

LoveSpark Calm: Sensory-Friendly Web

## Short description

One toggle makes any page sensory-friendly — mute harsh colors, stop animations, hide distractions. Calm, low-stimulation browsing.

## Detailed description

**The modern web is loud.** Flashing banners, autoplaying motion, neon gradients, sidebars full of clutter — for a sensitive nervous system it adds up to sensory overload fast. LoveSpark Calm turns any page down with a single toggle.

Click once, and the current page becomes calm: harsh colors are muted, animations and looping motion stop, and visual clutter fades back so you can focus on what you actually came to read. Click again to restore the page. That's the whole product — one switch between "loud web" and "quiet web."

**Who it helps.** LoveSpark Calm is built neurodivergent-first, for people who feel the web more than most:

- ADHD readers who lose the thread the moment something moves in the corner of the screen
- Autistic and sensory-sensitive users overwhelmed by bright colors and busy layouts
- Anyone with migraine, light sensitivity, or visual stress triggered by flashing motion
- People who simply want a lower-stimulation, more focused reading experience

**Accessibility is the point, not a feature.** LoveSpark Calm uses the OpenDyslexic-friendly, high-contrast, retro-pink LoveSpark design language, respects your system "reduce motion" preference, and is keyboard- and screen-reader-navigable throughout.

**What it does:**

- 🔇 **Mute colors** — softens harsh, oversaturated palettes into an easier, lower-contrast-fatigue view
- 🛑 **Kill animations** — stops autoplaying motion, looping GIFs, marquees, and CSS animations that pull focus
- 🙈 **Hide distractions** — dims busy, attention-grabbing page clutter so the main content stands out
- 🔘 **One toggle** — a single on/off switch per page; no menus, no configuration marathon
- 💾 **Remembers your choice** — your preference is stored locally so the calm view is there when you want it
- ♿ **Neurodivergent-first** — accessible fonts, motion-safe, keyboard friendly

**Free, open, and private by design.** LoveSpark Calm is completely free, MIT-licensed, and open source — you can read every line at https://github.com/Joona-t/lovespark-calm. It stores your settings only on your own device using `chrome.storage.local`, and it transmits **zero** data anywhere. No accounts, no tracking, no ads, no analytics, no remote code. Ever.

Quiet the web. Keep your focus.

## Single-purpose justification

LoveSpark Calm has one purpose: to make the web page you are currently viewing more sensory-friendly with a single toggle. Every capability in the extension serves that one goal — muting harsh colors, stopping animations, and hiding visual distractions are three facets of the same act of turning a visually loud page into a calm, low-stimulation one, and the stored preference simply remembers whether you want that calm view. There are no unrelated features, no bundled tools, and no functionality outside making the active page calmer; the extension does exactly this and nothing else.

## Per-permission justification

**storage** — Used solely to remember your on/off preference for the calming view via `chrome.storage.local`, so LoveSpark Calm behaves consistently between sessions without asking you to re-toggle every time. Nothing is stored remotely.

**activeTab** — Used solely so that when you click the LoveSpark Calm toggle, the extension can act on the tab you are currently looking at. It grants access only to that one explicitly-activated tab, only in response to your click, and to no other tabs or background pages.

**scripting** — Used solely to inject the styling and small script that mutes colors, stops animations, and hides distractions on the tab you activated. This is the mechanism that actually applies the calm view; it runs only on the tab you toggled and only when you toggle it.

## Host-permissions justification

LoveSpark Calm requests **no host permissions**. It does not declare `<all_urls>` or any broad site-matching pattern, and it has no standing access to any website. Instead it relies on `activeTab` plus `scripting`, which grant access to a page only at the moment you click the toggle on that specific tab. This means the extension cannot read, monitor, or modify any site in the background — it can only calm the one page you explicitly ask it to.

## Privacy disclosure (CWS Section 5)

**Data collection categories** — set every category to **Not collected**:

- Personally identifiable information — **Not collected**
- Health information — **Not collected**
- Financial and payment information — **Not collected**
- Authentication information — **Not collected**
- Personal communications — **Not collected**
- Location — **Not collected**
- Web history — **Not collected**
- User activity — **Not collected**
- Website content — **Not collected**

**Data-use certifications** — tick all three:

- ☑ I do not sell or transfer user data to third parties, outside of the approved use cases.
- ☑ I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** https://github.com/Joona-t/lovespark-calm/blob/main/PRIVACY.md

Note for the reviewer: LoveSpark Calm stores only a local on/off preference in `chrome.storage.local` and transmits no data off the device.

## Reviewer test instructions

You can verify LoveSpark Calm end to end in about three minutes. No account or setup is required.

1. Open any visually busy, animated page in a new tab — for example a news homepage or a site with an autoplaying banner or looping GIF (this gives you clear motion and bright colors to observe).
2. Click the **LoveSpark Calm** toolbar icon to open the popup. Confirm the Sparky mascot, the retro-pink accessible UI, and a single calm on/off toggle are visible.
3. Flip the toggle **on**. Observe the active page change: harsh colors mute, animations and looping motion stop, and busy/distracting elements dim back so the main content stands out.
4. Flip the toggle **off**. Confirm the page returns to its original appearance, verifying the effect is reversible and page-scoped.
5. Switch to a different tab and confirm it is **unaffected** — the calm view applies only to the tab you toggled (this demonstrates the `activeTab` scoping and the absence of host permissions).
6. Reload the page or reopen the popup and confirm your last toggle preference is remembered (this demonstrates local `chrome.storage.local` persistence — no network calls are made).

Expected result: the toggle calms only the explicitly-activated tab, the change is fully reversible, other tabs are untouched, and no data leaves the browser.
