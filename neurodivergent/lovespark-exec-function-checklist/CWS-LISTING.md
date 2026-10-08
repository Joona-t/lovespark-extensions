# LoveSpark Executive Function Checklist — CWS Listing

## Extension name

LoveSpark Executive Function Checklist

*(38 characters)*

## Short description

Stuck before you start? A 60-second pre-task checklist for ADHD task initiation, task paralysis, and overwhelm.

*(110 characters)*

## Detailed description

Starting is the hardest part. If you have ADHD, you already know the feeling: you want to begin, but the task feels like a wall and you freeze. **LoveSpark Executive Function Checklist** is a 60-second pre-task ritual that gets you unstuck — not another to-do list to maintain, but a quick, structured priming step you run *before* you start.

Open it, and Sparky walks you through four simple prompts:

- **What do I need?** — gather your tools and tabs before you dive in.
- **What's step one?** — find the first, smallest action so you never face the whole task at once.
- **How long will this take?** — set a realistic estimate to quiet the "this is endless" feeling.
- **What could distract me?** — a quick distraction pre-mortem so you spot the traps before they catch you.

That's it. Four questions, sixty seconds, and you're moving. The checklist turns evidence-aligned ideas — behavioral activation (start with the smallest step) and pre-mortem planning (name the obstacles first) — into plain, friendly language.

**Who it's for**

This is an executive function tool for anyone who battles task initiation, task paralysis, or task overwhelm — ADHD brains, autistic folks, people with anxiety or depression, and anyone who simply struggles to begin. If you've searched for a way to break down a task, find the first step, or overcome ADHD overwhelm, this ADHD-friendly checklist gives you a calm focus extension and a lightweight planner for the moment that matters most: the very beginning.

**Built neurodivergent-first**

Like every LoveSpark extension, it's designed for brains like ours:

- **OpenDyslexic font** by default, with a clean rounded fallback.
- Calm, retro-pink interface that's easy on the eyes.
- High-contrast, keyboard-navigable, and `prefers-reduced-motion` friendly (WCAG-aligned).

**Free, private, open source**

- **Always free.** No account, no sign-up, no Pro tier, no paywall in front of your own focus.
- **Zero data collection.** Your answers stay on your device in local browser storage and are never transmitted anywhere.
- **Open source (MIT).** Read every line on GitHub: https://github.com/Joona-t/lovespark-extensions/tree/main/neurodivergent/lovespark-exec-function-checklist

Stop fighting the blank-page freeze. Run the checklist, take the first step, and get going.

## Single-purpose justification

LoveSpark Executive Function Checklist has one purpose: to guide the user through a short, structured pre-task checklist that helps them start a task. Every feature serves that single purpose. The four prompts — what do I need, what's step one, how long, and what could distract me — *are* the checklist itself. Local storage exists only to remember the user's answers and progress so the checklist persists between sessions. The accessible, OpenDyslexic, retro-pink interface exists only to make that same checklist usable for neurodivergent users. There are no unrelated features — no tab management, no website blocking, no general note-taking, no browsing tools — the extension does one thing: prime you to begin a task.

## Per-permission justification

**storage** — The extension uses `chrome.storage.local` to save the user's checklist answers and completion state on their own device, so a ritual they start is still there when they reopen the popup. This is the only data the extension handles, it never leaves the browser, and the permission is required solely for this local persistence of the checklist.

## Host-permissions justification

No host permissions are requested. The extension does not declare `<all_urls>` or any host match pattern. It runs entirely inside its own popup — it never reads, injects into, or modifies any web page, and it never accesses your browsing history or page content. Because the checklist works purely on locally entered text, no site access is needed.

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

**Developer certification checkboxes — tick all three:**

- ☑ I do not sell or transfer user data to third parties, outside of the approved use cases.
- ☑ I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:** https://github.com/Joona-t/lovespark-extensions/blob/main/neurodivergent/lovespark-exec-function-checklist/PRIVACY.md

This extension stores the user's checklist answers only in `chrome.storage.local` on the user's own device and transmits zero data externally.

## Reviewer test instructions

A full check takes about 3 minutes.

1. **Open the popup (~10s).** Install the extension and click the LoveSpark Executive Function Checklist icon in the toolbar. The Sparky mascot and the first prompt appear.
2. **Answer prompt 1 (~30s).** Read "What do I need?", type a short answer (e.g., `laptop, notes`), and advance to the next prompt.
3. **Complete the ritual (~60s).** Continue through "What's step one?", "How long will this take?", and "What could distract me?", entering a brief answer for each. Confirm the checklist shows your progress through all four steps.
4. **Verify local persistence (~20s).** Close the popup completely, then reopen it. Your answers and progress are still there — this is the sole use of the `storage` permission (local persistence only).
5. **Verify zero data transmission (~30s).** Open Chrome DevTools → Network tab while interacting with the popup. Confirm there are **no outbound network requests** — the extension sends nothing externally.
6. **Verify no site access (~20s).** Go to `chrome://extensions`, open this extension's **Details**, and confirm the permissions show storage only with **no site access / host permissions**.
