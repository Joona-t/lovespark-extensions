# Plan: Guide Button + Report a Bug Button

## Summary

Add two buttons to the popup's Site tab:
1. **Guide** — Opens a new `guide.html` tab explaining all features
2. **Report a Bug** (with ladybug emoji) — Opens GitHub Issues in a new tab

## Changes

### 1. popup.html — Add "Help & Feedback" card to Site tab

Add a new `panel-card` below the Reset to Defaults card in the Site tab:

```html
<div class="panel-card help-card">
  <button id="guide-btn" class="action-btn">📖 How to Use Cozy</button>
  <button id="bug-btn" class="action-btn bug-btn">🐞 Report a Bug</button>
</div>
```

### 2. popup.css — Style the help card

- `.help-card` — flex column, gap between buttons
- `.bug-btn` — subtle red-ish outline variant to differentiate from guide

### 3. popup.js — Wire up the two buttons

```js
$('guide-btn').addEventListener('click', () => {
  chrome.tabs.create({ url: chrome.runtime.getURL('guide/guide.html') });
});

$('bug-btn').addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://github.com/Joona-t/cozy-accessibility/issues' });
});
```

### 4. guide/guide.html — New guide page

- Full standalone page using `lovespark-base.css` + `--ls-bg-gradient` background
- Sparky mascot in header
- Theme dropdown (reuse lovespark-theme.js)
- Sections for each tab/feature:
  - Quick Start (presets)
  - Reading tab (Color Tint, Bionic Reading, Reading Mode)
  - Typography tab (fonts, sizing, spacing, writing comfort)
  - Sensory tab (animations, GIFs, motion, autoplay, cursor)
  - Focus tab (paragraph focus, reading ruler, hide distractions)
  - TTS tab (text-to-speech usage)
  - Site tab (per-site disable, reset, export/import)
  - Themes
- Clean, readable card-based layout
- Keyboard/screen reader accessible

### 5. guide/guide.css — Guide page styling

- Reuses CSS variables from lovespark-base.css
- Card layout for each section
- Responsive-ish for the new tab context (wider than popup)

### 6. guide/guide.js — Theme support for guide page

- Minimal JS: read theme from storage, apply, wire theme dropdown

### 7. manifest.json — Bump patch version

- 1.0.7 → 1.0.8

## Files Created
- `guide/guide.html`
- `guide/guide.css`
- `guide/guide.js`

## Files Modified
- `popup/popup.html` (add help card)
- `popup/popup.css` (help card styles)
- `popup/popup.js` (wire button clicks)
- `manifest.json` (version bump)

## No New Permissions Needed
- `guide.html` is a local extension page (chrome-extension:// URL)
- GitHub Issues link is just a `chrome.tabs.create` call
- Already have `activeTab` permission

## Do not implement yet.
