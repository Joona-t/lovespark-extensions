# LoveSpark Sensory Dimmer — CWS Listing

## Extension name

LoveSpark Sensory Dimmer

*(24 characters — within the 45-character limit.)*

## Short description

Dim any page for instant sensory overload relief. Reduce brightness, contrast & saturation. One-click calm, zero tracking, free.

*(128 characters — within the 132-character limit. Primary keywords woven in: sensory overload, reduce brightness, contrast & saturation.)*

## Detailed description

**Bright pages shouldn't hurt.** LoveSpark Sensory Dimmer turns down the visual intensity of any web page with a single click — so you can read, work, and browse without the glare, the buzz, and the overwhelm.

If a too-bright website ever made you wince, lose your place, or close the tab just to make the feeling stop, this is for you. Sensory Dimmer dims the page instantly and lets you dial in exactly the calm you need: lower the brightness, soften the contrast, and pull back color saturation until the screen feels comfortable again.

**Built for sensory overload, not just dark mode.** Most screen dimmers were made for nighttime or blue-light fatigue. Sensory Dimmer is built neurodivergent-first — for ADHD, autistic, and sensory-sensitive folks who get overstimulated by loud, high-contrast, oversaturated pages in broad daylight. It treats dimming as sensory regulation, not just a night filter.

**Who it helps:**
- People with ADHD or sensory processing sensitivity who need low-stimulation browsing
- Anyone fighting eye strain, screen fatigue, or headache-bright pages
- Migraine-prone and light-sensitive readers
- Neurodivergent students and workers who need calmer focus

**What it does:**
- 🌙 **Dim any page instantly** — one click on the toolbar applies the calm overlay to the tab you're on
- 🔆 **Reduce brightness** — turn down harsh, glaring whites
- 🎚️ **Reduce contrast** — soften jarring light-on-dark and dark-on-light extremes
- 🎨 **Reduce color saturation** — tone down overstimulating, oversaturated color
- 💾 **Remembers your settings** — your preferred dimming levels are saved locally and ready next time
- ♿ **Accessible by design** — OpenDyslexic font, clear contrast, full keyboard navigation, and reduced-motion support

**Free, open, and private — for real.** LoveSpark Sensory Dimmer is completely free, MIT-licensed, and open source. There is no trial that turns into a subscription, no paywall, no "pro" upsell. It collects **zero** data, has **no** trackers, and never transmits anything externally. Your preferences live only in your own browser's local storage. You can read every line of the source code here: https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-sensory-dimmer

One click. Instant calm. Always free.

## Single-purpose justification

LoveSpark Sensory Dimmer has one purpose: **reduce the visual stimulation of the web page you are viewing to relieve sensory overload and eye strain.** Every feature serves that single purpose. Dimming brightness, reducing contrast, and lowering color saturation are three facets of the same job — turning down how visually intense a page feels — and the saved-preferences behavior exists only to remember the comfort level you chose for that same dimming. There are no unrelated tools, no bundled utilities, and no features outside this single sensory-regulation purpose.

## Per-permission justification

**storage** — Used solely to save your chosen dimming preferences (brightness, contrast, and saturation levels) in local browser storage so they persist between sessions and you don't have to re-set them every time. No other data is stored.

**activeTab** — Used solely to apply the dimming effect to the single page you are actively viewing when you click the extension's toolbar button. This permission grants access only to that current tab, at your explicit action, and nothing else.

**scripting** — Used solely to inject the lightweight CSS/JS overlay that performs the actual dimming (brightness, contrast, and saturation adjustment) on the active tab. Without it, the extension could not modify the visual appearance of the page, which is its entire function.

## Host-permissions justification

No host permissions are requested. The extension declares no host-permission patterns (such as `<all_urls>`) and requests no persistent access to any site. It relies on `activeTab`, which grants temporary, single-tab access only when you click the toolbar button — so dimming is applied on demand, to the page in front of you, and never through standing access to your browsing across sites.

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

**Developer certifications — tick all three:**
- ☑ I do not sell or transfer user data to third parties, outside of the approved use cases
- ☑ I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL:**
https://github.com/Joona-t/lovespark-extensions/blob/main/neurodivergent/lovespark-sensory-dimmer/PRIVACY.md

*(This extension stores user preferences only in `chrome.storage.local` and transmits zero data externally. There is no remote server, analytics, or third-party service of any kind.)*

## Reviewer test instructions

You can fully verify this extension in about 3 minutes. No account, login, or setup is required.

1. **Open a bright page.** Navigate to any normal, bright website (for example, a news homepage or `https://en.wikipedia.org`). Note how bright/high-contrast it looks.
2. **Click the extension icon** in the Chrome toolbar to open the popup. You'll see the LoveSpark Sensory Dimmer controls (with the Sparky mascot) and sliders for brightness, contrast, and saturation.
3. **Dim the page.** Lower the brightness slider — the active tab should visibly dim in real time. The change applies only to the current tab.
4. **Reduce contrast and saturation.** Adjust the contrast and saturation sliders and confirm the page's contrast softens and its colors desaturate live as you move them.
5. **Confirm persistence (storage).** Close the popup, then reopen it (or open a new tab and apply the dimmer again). Your chosen levels should be remembered — demonstrating that preferences are saved locally via the `storage` permission.
6. **Confirm scope (activeTab).** Switch to a different tab that you have not dimmed and confirm it is unaffected — dimming applies only to the tab where you activated it.
7. **Confirm no network/data activity (optional).** Open DevTools → Network while using the controls. You will see no external requests; all behavior is local. The full source is available at https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-sensory-dimmer for verification.

Expected result: clicking the icon and adjusting the sliders dims/softens/desaturates the active page instantly, settings persist locally, and no data leaves the browser.
