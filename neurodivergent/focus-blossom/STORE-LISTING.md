# Focus Blossom — Chrome Web Store Listing

**Version:** 1.0.34
**Zip:** `lovespark zips/chrome zips/focus-blossom-chrome.zip`
**Privacy policy URL:** `https://lovespark.love/privacy.html`
**Homepage URL:** `https://lovespark.love`
**Support URL:** `https://github.com/Joona-t/focus-blossom/issues`

Copy-paste each section into the corresponding CWS dashboard field. Every block below is final copy — nothing to edit.

---

## Store listing → Product details

### Name
```
Focus Blossom: Site Blocker & Digital Detox
```

### Summary (132 char limit)
```
Block doomscroll sites and grow a flower garden instead. Every hour you resist, your garden blooms. For ADHD & busy minds. 🌸
```

### Description
```
Focus Blossom is a cozy site blocker that turns every avoided doomscroll into a living garden. The longer you resist, the more your flowers bloom — from seed, to sprout, to full cherry-blossom garden. Made for ADHD brains and anyone who responds better to rewards than willpower.

🌱 HOW IT WORKS
• Add any site you want to block — reddit.com, tiktok.com, twitter.com, anything
• Each blocked site grows its own garden while it stays blocked
• Five growth stages: seed → sprout → bud → bloom → thriving garden
• Sparky the mascot walks around and waters your flowers
• Try to visit a blocked site? You see your garden instead.

🔥 STREAKS & PROGRESS
• Track longest streak per site and overall
• Total time blocked across all sites
• Growth speed multiplier — the more sites you block, the faster they grow
• Daily affirmations on every blocked page

🛡️ UNBLOCK FRICTION (your choice)
• Low: quick confirmation
• Medium: 30-second timer you must wait through
• High: 30-second timer + type the domain to confirm
• Unblocking wilts your garden (loses 50% growth) — the cost is the point

🎨 FOUR COZY THEMES
• Retro Pink (default)
• Dark
• Beige
• Slate

🔒 PRIVACY FIRST
• No accounts, no logins, no tracking
• 100% local storage — your gardens never leave your device
• No ads, no data collection, no remote code
• Open-source and MIT-licensed

🧠 FOR NEURODIVERGENT MINDS
Most productivity tools shame you into compliance. Focus Blossom rewards you for every hour you don't break. It's gentle, visual, and specifically designed for brains that struggle with time-blindness and dopamine regulation.

💕 PART OF THE LOVESPARK SUITE
Free, open-source browser extensions for neurodivergent coders. Always free. No ads. Ever.

— Built by Joona Tyrninoksa · LoveSpark
— github.com/Joona-t/focus-blossom
```

### Category
```
Productivity
```

### Language
```
English (United States)
```

---

## Store listing → Graphic assets

Upload from `Extensions/neurodivergent/focus-blossom/cws-shots/out/`:

| Slot | File | Dimensions |
|---|---|---|
| Store icon (in manifest) | `icons/icon-128.png` | 128×128 |
| Screenshot 1 | `01-blocked-garden.png` | 1280×800 |
| Screenshot 2 | `02-popup-hero.png` | 1280×800 |
| Screenshot 3 | `03-settings.png` | 1280×800 |
| Screenshot 4 | `04-friction.png` | 1280×800 |
| Screenshot 5 | `05-themes.png` | 1280×800 |
| Small promo tile | `promo-small.png` | 440×280 |
| Marquee promo tile | `promo-marquee.png` | 1400×560 |

All images are 24-bit PNG, no alpha. Upload the same 5 screenshots into both the **Localized** and **Global** screenshot slots.

---

## Privacy practices → Single purpose description
```
Focus Blossom blocks user-selected websites and shows a custom "garden growing" page in their place, visually representing the user's focus time as a virtual flower garden.
```

---

## Privacy practices → Permission justifications

### `storage`
```
Used to save the user's list of blocked sites, per-site focus streaks, garden growth state, daily affirmation history, and theme preference locally on their device via chrome.storage.local. No data leaves the device.
```

### `alarms`
```
Used to run a recurring 1-minute alarm that credits focus time to each currently-blocked site and advances its garden growth stage. A separate daily alarm resets streak counters at local midnight.
```

### `notifications`
```
Used to notify the user when one of their gardens advances to a new growth stage (e.g., "Your reddit.com garden just bloomed! 🌸"). Notifications are optional and disabled via a single toggle in Settings.
```

### `declarativeNetRequest`
```
Used to block the user's selected websites by redirecting navigation to the extension's local blocked.html page. Rules are created and removed dynamically as the user adds or removes sites. No requests are observed, logged, or modified beyond this redirect.
```

### Host permission (`<all_urls>`)
```
Required because the user chooses which arbitrary domains to block at runtime. The extension does not inject content scripts or read page content — host permission is used solely so declarativeNetRequest can redirect navigation to any user-added domain to the extension's local blocked page.
```

---

## Privacy practices → Data usage disclosures

### What user data does this extension collect, use, or share?

Tick **exactly one** box for each category — answers below.

| Data type | Answer |
|---|---|
| Personally identifiable information | **Not collected** |
| Health information | **Not collected** |
| Financial and payment information | **Not collected** |
| Authentication information | **Not collected** |
| Personal communications | **Not collected** |
| Location | **Not collected** |
| Web history | **Not collected** |
| User activity | **Not collected** |
| Website content | **Not collected** |

### Certifications (check all three)

- [x] I do not sell or transfer user data to third parties, outside of the approved use cases.
- [x] I do not use or transfer user data for purposes that are unrelated to my item's single purpose.
- [x] I do not use or transfer user data to determine creditworthiness or for lending purposes.

---

## Privacy practices → Privacy policy URL
```
https://lovespark.love/privacy.html
```

---

## Distribution

| Field | Value |
|---|---|
| Visibility | **Public** |
| Regions | **All regions** |
| Pricing | **Free** |
| Mature content | **No** |

---

## Post-submission checklist

- [ ] Upload `focus-blossom-chrome.zip` (v1.0.34, 326K, 143 files)
- [ ] Paste Name, Summary, Description
- [ ] Select Productivity category
- [ ] Upload 5 screenshots to BOTH Localized + Global slots
- [ ] Upload small promo tile (440×280)
- [ ] Upload marquee promo tile (1400×560)
- [ ] Fill all 5 permission justifications
- [ ] Fill single-purpose description
- [ ] Set all data-collection categories to "Not collected"
- [ ] Tick 3 certifications
- [ ] Paste privacy policy URL
- [ ] Set Public / All regions / Free
- [ ] Submit for review

---

## Firefox notes (separate submission)

Firefox zip: `lovespark zips/firefox zips/focus-blossom-firefox.zip` (327K).
Includes the `browser_specific_settings.gecko` block with `data_collection_permissions.is_exempt: true`. Description copy is identical — Firefox AMO uses the same long description.
