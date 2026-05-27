# Rewire Brain — Roadmap

## Completed (v2.2.0)

- [x] XP + Level system (10 levels, Seedling to Rewired)
- [x] Brain-tree growth visualization (CSS-only, 10 stages)
- [x] Full-screen dashboard (dashboard.html in new tab)
- [x] Neuroscience milestone labels (Day 7 through Day 365)
- [x] Breathing exercise XP (+15 after 3 cycles)
- [x] Bypass-resisted XP (+25 when user goes back)
- [x] Popup UI polish (XP bar, dashboard button, simplified footer)
- [x] Single LoveSpark.love link (replaced ecosystem grid)
- [x] OpenDyslexic font on all text
- [x] Security hardening (XSS, redirect validation, CSP)

## Completed (v2.1.0)

- [x] 125+ domain blocklist with DNR
- [x] Bypass with friction (timed cooldown + reflection)
- [x] Streak tracking
- [x] 4 themes (Retro Pink, Dark, Beige, Slate)
- [x] Science-backed quote database (stoic, mindfulness, philosophical, neuroscience)
- [x] Resources section with Huberman Lab, recovery tools, books, studies
- [x] Popup tab system (Shield / Resources)
- [x] Enhanced blocked page with categorized quotes + resources

---

## Planned: Religious Teachings Integration

### Overview
Add opt-in religious wisdom and teachings as a quote/resource category. Users choose their faith tradition (or none) in settings. Quotes and resources from that tradition appear alongside existing categories.

### Traditions

**Buddhism**
- Mindfulness of craving (tanha) — observing desire without attachment
- Middle Way — balance between indulgence and extreme asceticism
- Right Effort — cultivating wholesome states, abandoning unwholesome ones
- Impermanence (anicca) — all urges are temporary
- Example quotes from Dhammapada, suttas (public domain)

**Islam**
- Lowering the gaze (ghadd al-basar) — Quran 24:30-31
- Taqwa (God-consciousness) — awareness that strengthens self-discipline
- Sabr (patience) — endurance through difficulty as a spiritual practice
- Guarding modesty (haya) — protecting one's dignity and that of others
- Example quotes from Quran and Hadith (public domain)

**Christianity**
- Purity of heart — "Blessed are the pure in heart" (Matthew 5:8)
- Self-control as fruit of the Spirit — Galatians 5:22-23
- Renewal of the mind — Romans 12:2
- Fleeing temptation — 1 Corinthians 6:18-20
- Example quotes from Bible (public domain)

### Architecture

**Storage:**
```
enabledReligion: null | 'buddhism' | 'islam' | 'christianity' | 'all'
```

**New file:** `quotes-religion.js`
- Same structure as quotes.js: `{ text, author, source, category }`
- Categories: `buddhism`, `islam`, `christianity`
- Loaded only when user has opted in

**Options page addition:**
- "Faith-Based Wisdom" section with dropdown: None / Buddhism / Islam / Christianity / All
- Explanation text: "Optionally include teachings from your faith tradition alongside the science-based content"
- Default: None (opt-in only)

**Quote integration:**
- `getRandomQuote()` checks storage for `enabledReligion`
- If set, religion categories are added to the pool alongside existing 4 categories
- Weighted equally with other categories (e.g., 5 categories = 20% each)

**Resources integration:**
- Each tradition gets 2-3 recovery resources specific to that faith
- E.g., Covenant Eyes (Christian), Islamic guidance counseling, Buddhist recovery programs

### Sensitivity notes
- All religious content is respectful and sourced from canonical texts
- No proselytizing — presented as wisdom traditions, not recruitment
- User must explicitly opt in — never shown by default
- "All" option shows quotes from all three traditions
- No ranking or comparison between traditions

---

## Planned: Mindful Recovery Community

### Overview
A sobriety-focused community platform — not just anti-porn, but covering all forms of compulsive behavior:
- Porn/content addiction recovery
- Substance sobriety support
- Bad habit breaking (doomscrolling, gambling, overeating)
- Mindfulness and self-improvement through discipline

### Core Principles
- Evidence-based approaches (CBT, MBRP, Stoic philosophy)
- Anonymous by default
- Non-religious (religion opt-in via existing roadmap feature)
- Peer accountability (streak sharing, check-ins)
- No shame, no judgment — growth mindset only

### Features (future)
- Daily check-in threads
- Anonymous streak sharing
- Guided group breathing/mindfulness sessions
- Milestone celebrations (community reacts when someone hits 30/60/90 days)
- Mentor/mentee pairing (experienced members help newcomers)
- Integration with Rewire Brain extension (share milestones, XP level)

### Platform (TBD)
- Discord community (fastest to launch)
- Custom web platform (long-term)
- Subreddit (r/RewireBrain or similar)
