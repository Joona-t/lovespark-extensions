# LoveSpark Habit Garden — CWS Listing

## Extension name

LoveSpark Habit Garden: Habit Tracker

*(37 characters — within the 45-character limit)*

## Short description

A gamified habit tracker that grows a garden as your streaks bloom. Built for ADHD brains. No account, no tracking, always free.

*(128 characters — within the 132-character limit)*

## Detailed description

**Build habits you can actually see grow.**

LoveSpark Habit Garden is a free, gamified habit tracker that turns your daily routines into a living garden. Every habit you keep waters a plant. Every streak you hold makes it bloom. Miss a day and you simply replant — no guilt, no nagging, no broken-chain shame spiral.

It's a habit tracker built for the way ADHD and neurodivergent brains actually work: novelty, visible progress, and an immediate visual reward instead of a boring checkbox. Watching your garden fill in is the dopamine hit that makes the streak worth keeping.

**What it does**
- Add the daily habits you want to build, one plant per habit.
- Mark a habit done and watch its plant grow a stage closer to full bloom.
- Track your streak — the number of consecutive days you've kept each habit.
- See your whole garden at a glance, so progress is something you *look at*, not something you have to remember.
- A gentle daily reset rolls your day over so streaks stay honest and start fresh each morning.

**Who it helps**
- People with ADHD or other neurodivergent brains who bounce off plain checklists and need a visible, gamified reward loop.
- Anyone building a daily habit — water, movement, reading, focus breaks — who wants a streak tracker that feels good to open.
- Folks who want a habit garden in their browser instead of yet another app and yet another login.

**Built neurodivergent-first**
LoveSpark Habit Garden ships with the OpenDyslexic font by default, a calm retro-pink theme, full keyboard navigation, visible focus indicators, and reduced-motion support. It's designed to be readable, low-friction, and easy to come back to.

**Free, open source, and private by design**
- 100% free. No premium tier, no paywall, no ads.
- Open source under the MIT license — read every line at the repository linked below.
- Zero data collection. Everything you create lives only in your browser's local storage. Nothing is ever sent to a server, sold, or shared. There is no account to make and no sign-up to complete.

If you've searched for a habit tracker Chrome extension, a streak tracker, an ADHD habit tracker, or a free habit tracker with no account, Habit Garden is the gamified, grow-a-garden take on the daily habit builder — and it stays free, forever.

## Single-purpose justification

LoveSpark Habit Garden has one purpose: to help the user build and maintain daily habits by tracking streaks and rewarding consistency with a growing, blooming visual garden. Every feature serves that single purpose. Creating habits defines what the user is tracking; marking a habit done advances that habit's plant and increments its streak; the garden view visualizes overall progress to reinforce the habit loop; and the daily reset rolls the tracking period over so streaks remain accurate from one day to the next. There are no unrelated features, no secondary tools, and no functionality outside of daily habit tracking and its garden-based reward.

## Per-permission justification

**storage** — Used to save the user's habits, streak counts, and garden state on the device via `chrome.storage.local`. This is the only way the extension can remember your habits and progress between sessions. All data stays local; nothing is transmitted.

**alarms** — Used to schedule the daily reset that rolls the tracking day over at the appropriate time, so each habit's streak is evaluated and the new day begins correctly. Without `alarms`, streaks could not advance or reset reliably across days. It is used only for this internal timekeeping and triggers no network activity.

## Host-permissions justification

LoveSpark Habit Garden requests no host permissions. It does not request `<all_urls>` or any host pattern, does not read or modify the content of any website, and does not run on web pages. The extension operates entirely within its own popup using locally stored data.

## Privacy disclosure (CWS Section 5)

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

**Developer certifications (tick all three):**
- ☑ I do not sell or transfer user data to third parties, outside of the approved use cases.
- ☑ I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes.

**Privacy policy URL:**
`https://github.com/Joona-t/lovespark-habit-garden/blob/main/PRIVACY.md`

*Note for the reviewer: this extension stores all data exclusively in `chrome.storage.local` and makes no network requests. No data of any kind leaves the user's device.*

## Reviewer test instructions

Estimated time: about 3 minutes. No account, sign-in, or setup is required.

1. **Open the extension.** Click the LoveSpark Habit Garden icon in the Chrome toolbar to open the popup. You'll see the garden view and an option to add a habit.
2. **Add a habit.** Create a new habit (for example, "Drink water"). A new plant appears in the garden representing that habit, starting at its earliest growth stage with a streak of 0.
3. **Mark it done.** Mark the habit complete for today. Confirm that (a) the habit's plant advances a growth stage, and (b) its streak count increases to 1.
4. **Add a second habit and complete it** to confirm multiple habits can be tracked independently, each with its own plant and streak.
5. **Confirm persistence.** Close the popup and reopen it (or reload the extension). Your habits, streaks, and garden state are still there — confirming data is saved locally via the `storage` permission.
6. **Confirm privacy.** Open Chrome DevTools (Network tab) while using the popup. Observe that the extension makes no outbound network requests — all behavior is local. The `alarms` permission is used only to schedule the internal daily reset that advances/resets streaks across days.

Expected result: habits can be created and completed, plants grow and bloom as streaks build, all data persists locally between sessions, and no data is transmitted externally.
