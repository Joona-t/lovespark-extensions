# LoveSpark Reward Spinner — CWS Listing

## Extension name
LoveSpark Reward Spinner

## Short description
Spin a wheel of your own rewards after finishing a task. A free, ADHD-friendly reward system that gamifies task completion.

## Detailed description
LoveSpark Reward Spinner turns "I finished the task" into a tiny celebration. Instead of grinding through your to-do list with no payoff, you build your own wheel of self-chosen rewards — then give it a spin every time you complete something. The result is a random reward you actually picked, delivering the little hit of novelty and anticipation that helps a distractible brain follow through.

It's built for the way ADHD and neurodivergent brains actually work. Traditional productivity apps assume willpower is enough; Reward Spinner leans on gamification, dopamine, and surprise instead. You decide what counts as a reward — a five-minute music break, a snack, ten minutes of a game, a walk — and the wheel decides which one you get. That small element of chance makes finishing a task feel worth doing.

Everything is intentionally simple. There's no account to create, no login, no setup wizard. Open the popup, add a few rewards, and start spinning. Your reward list is saved locally on your own device so it's there the next time you finish a task.

Accessibility is baked in, not bolted on. The interface uses the OpenDyslexic font, a warm retro-pink theme, high-contrast text, keyboard-navigable controls, and reduced-motion support — so the spinner is comfortable whether you're dyslexic, sensitive to motion, or just want a calmer UI.

LoveSpark Reward Spinner is completely free, open source, and MIT-licensed. It stores your rewards only in your browser's local storage and transmits zero data anywhere. There are no ads, no trackers, no analytics, and no data collection of any kind.

**Features**
- 🎡 Spin a reward wheel to get a random, self-chosen reward after completing a task
- ✍️ Add, edit, and remove your own custom rewards — you control what's on the wheel
- 🎲 Randomized results add surprise and anticipation to help you follow through
- 🧠 Designed for ADHD and neurodivergent brains — gamified task completion, not willpower
- 👀 Accessible by design: OpenDyslexic font, high contrast, keyboard support, reduced-motion friendly
- 🔒 Your rewards are stored locally only — zero data leaves your device
- 🚫 No account, no login, no ads, no trackers
- 💜 Free forever, open source, and MIT-licensed

## Single-purpose justification
LoveSpark Reward Spinner has one purpose: to let you spin a wheel of your own custom rewards when you complete a task. Every feature serves that single purpose — adding and editing rewards defines what appears on the wheel, the spin action selects a random reward from that list, and local storage remembers your rewards between sessions so the wheel is ready the next time you finish a task. The extension does not browse, block, track, or modify any web content; it does exactly one thing — reward-spinning for task completion — and nothing outside that scope.

## Per-permission justification
**storage** — The extension uses `chrome.storage.local` to save the list of rewards you create so your wheel persists between sessions and browser restarts. Without this permission your custom rewards would be lost every time the popup closed. All stored data stays on your own device and is never transmitted anywhere.

## Host-permissions justification
LoveSpark Reward Spinner requests no host permissions. It does not read, access, or modify the content of any website you visit, and it does not run on web pages at all — the entire experience lives inside the extension's own popup.

## Privacy disclosure (CWS Section 5)

**Data collection categories — set every category to "Not collected":**
- Personally identifiable information — Not collected
- Health information — Not collected
- Financial and payment information — Not collected
- Authentication information — Not collected
- Personal communications — Not collected
- Location — Not collected
- Web history — Not collected
- User activity — Not collected
- Website content — Not collected

**Certification checkboxes to tick:**
- ☑ I do not sell or transfer user data to third parties, outside of the approved use cases
- ☑ I do not use or transfer user data for purposes that are unrelated to my item's single purpose
- ☑ I do not use or transfer user data to determine creditworthiness or for lending purposes

**Privacy policy URL:**
https://github.com/Joona-t/lovespark-extensions/blob/main/neurodivergent/lovespark-reward-spinner/PRIVACY.md

The extension stores your custom rewards only in `chrome.storage.local` on your own device and transmits zero data externally. No data is collected, sold, transferred, or used for any unrelated purpose or for creditworthiness or lending.

## Reviewer test instructions
This is a self-contained popup extension with no host permissions and no accounts — everything can be verified in about three minutes.

1. Install and pin the extension, then click the LoveSpark Reward Spinner toolbar icon to open the popup. The reward wheel and controls appear; no login or setup is required.
2. In the "Add reward" input, type a reward (e.g., "5-minute music break") and confirm/add it. Add two or three more (e.g., "Snack", "Short walk"). Each one appears on the wheel and in your rewards list.
3. Click the **Spin** button. The wheel spins and lands on one randomly selected reward from your list — confirming the core reward-spinning behavior.
4. Remove a reward from the list and spin again to confirm it no longer appears as a possible result, verifying that you fully control the wheel's contents.
5. Close the popup, then reopen it. Your rewards are still present — confirming they are saved via `chrome.storage.local` on the local device.
6. (Optional) Open your browser's network inspector while adding rewards and spinning. No outbound network requests are made, confirming zero external data transmission. The extension also declares only the `storage` permission and no host permissions.
