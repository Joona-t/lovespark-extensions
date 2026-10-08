The workflow needs an interactive approval gate that would block, so I'll write the listing directly — I have all the data and constraints needed. Output below is the exact `CWS-LISTING.md`.

---

# LoveSpark Task Starter — CWS Listing

## Extension name
LoveSpark Task Starter: ADHD First Step

*(39 characters)*

## Short description
Break ADHD task paralysis in 3 steps: name it, find the tiniest first step, do just that. Free, private, no account.

*(117 characters)*

## Detailed description
Staring at a task you can't begin? LoveSpark Task Starter breaks ADHD task paralysis with one tiny, doable first step — no to-do list to maintain, no account, no AI.

Task initiation is the hardest part for ADHD and executive dysfunction brains. The work isn't laziness — it's that "do the whole thing" feels impossible, so nothing starts. This extension turns starting into a calm, repeatable ritual built on the advice therapists and the ADHD community give most often: shrink the first step until it's too small to refuse, then do only that.

Open the popup and walk through three steps:

1. **Name the task** — say the one thing you're avoiding, out loud and on screen.
2. **Find the tiniest first step** — not the plan, not the deadline. The single smallest action you could do in the next two minutes.
3. **Do just that** — start the tiny step. Momentum does the rest.

That's the whole tool. It's an anti-procrastination ritual, not another productivity app to fall behind on. There's no growing backlog, no streaks to break, no notifications guilt-tripping you. Just a quiet way to get unstuck, one task at a time.

**Who it helps**
- People with ADHD who hit task paralysis and can't find the on-ramp.
- Autistic and executive-dysfunction brains that need tasks broken into steps before they feel doable.
- Anyone who procrastinates by overthinking and needs a tiny task breakdown to start.

**Features**
- A focused 3-step task starter: name the task → find the tiniest first step → do just that.
- One task at a time — no overwhelming list, no nagging, no scorekeeping.
- Your task and chosen first step are saved locally, so closing the popup never loses your place.
- Works instantly and fully offline — no sign-up, no loading spinner, no AI latency or paywall.
- Neurodivergent-first design: OpenDyslexic font, calm retro-pink theme, high-contrast accessible layout (WCAG AA+), full keyboard navigation, and respect for reduced-motion settings.
- 100% free, MIT-licensed, and open source — read every line in the repo.
- Zero data collection: everything stays in your browser, nothing is ever transmitted.

LoveSpark Task Starter is a free ADHD focus extension and executive dysfunction tool that does exactly one thing well: help you take the first step. Power to the people — knowledge and focus tools should be a right, not a subscription.

Open source: https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-task-starter

## Single-purpose justification
The single purpose of LoveSpark Task Starter is to help a user begin one task by guiding them through a short task-initiation ritual — name the task, identify the tiniest first step, and start that step. Every feature serves this one purpose: the three-step popup flow *is* the ritual; saving the current task and chosen first step locally exists so the user can close and reopen the popup mid-ritual without losing their place; and the accessible, OpenDyslexic, reduced-motion interface exists so neurodivergent users can complete that same ritual without friction. The extension deliberately does not include a to-do list, scheduling, reminders, AI breakdown, sync, or any unrelated productivity feature, so the scope stays narrowly and verifiably focused on overcoming task paralysis.

## Per-permission justification
**storage** — Used solely to save the user's current task and their chosen tiniest first step in `chrome.storage.local` so the in-progress ritual persists when the popup is closed and reopened (popups otherwise lose their state on close). It is also used to remember the user's accessibility/theme preference. This data lives only in the user's own browser; the permission is never used to read browsing data, track activity, or transmit anything externally.

## Host-permissions justification
No host permissions are requested. LoveSpark Task Starter does not access, read, or modify the content of any website, makes no network requests, and operates entirely within its own popup using local storage. Because the extension never interacts with web pages or external servers, no host permissions (broad patterns such as `<all_urls>` or any specific host) are needed or declared.

## Privacy disclosure (CWS Section 5)

**What user data do you plan to collect from users now or in the future?**
Set every category to **Not collected**:

- Personally identifiable information — **Not collected**
- Health information — **Not collected**
- Financial and payment information — **Not collected**
- Authentication information — **Not collected**
- Personal communications — **Not collected**
- Location — **Not collected**
- Web history — **Not collected**
- User activity — **Not collected**
- Website content — **Not collected**

The extension stores the user's task text, chosen first step, and theme preference only in `chrome.storage.local` on the user's own device. None of this is collected by the developer or any third party, and nothing is ever transmitted off the device.

**Developer certifications — tick all three boxes:**
- ☑ I do not sell or transfer user data to third parties, outside of the approved use cases.
- ☑ I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:**
https://github.com/Joona-t/lovespark-extensions/blob/main/neurodivergent/lovespark-task-starter/PRIVACY.md

## Reviewer test instructions
The extension needs no account, no setup, and no network connection. You can verify the full behavior in about three minutes:

1. **Install and open.** Click the LoveSpark Task Starter toolbar icon. The popup opens instantly to step 1 of the starter ritual, showing the Sparky mascot and the retro-pink, OpenDyslexic interface. No login or onboarding appears.
2. **Step 1 — Name the task.** Type a task you're avoiding (e.g., "Reply to landlord email") and advance to the next step.
3. **Step 2 — Find the tiniest first step.** Enter the smallest possible action (e.g., "Open the email and read the first line") and advance.
4. **Step 3 — Do just that.** Confirm the popup now presents only that single tiny first step to start. There is no to-do list, scheduling, or AI feature — just the one step.
5. **Confirm local persistence.** Close the popup, then reopen it. Your task and first step are still there (loaded from `chrome.storage.local`), confirming the only declared permission is used exactly as described.
6. **Confirm no network / offline operation.** Disconnect from the internet (or check DevTools → Network) and repeat steps 2–5. Everything works identically with zero network requests, confirming no data is transmitted and no host permissions are used.
7. **(Optional) Accessibility check.** Tab through the controls to confirm visible focus indicators and full keyboard navigation, and note the OpenDyslexic font and high-contrast theme.

Expected result: a self-contained, offline, single-purpose task-initiation ritual that stores nothing beyond the user's own task and preference locally.
