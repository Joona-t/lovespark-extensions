# Cozy Accessibility — Session Summary

## What Was Done

### 1. Popup UI Redesign

**Problem:** The popup had 6 emoji-only tabs that caused cognitive overload for neurodivergent users. The reading ruler was in the wrong tab, and the layout created friction and confusion.

**Solution:** Consolidated to 3 text-labeled tabs grouped by user intent:

| Tab | Contains |
|-----|----------|
| **Read** | Typography, Bionic Reading, Reading Ruler, Writing Comfort, Text-to-Speech |
| **Visual** | Color Tint, Color Filter, Reading Mode, Large Cursor |
| **Focus** | Sensory Controls, Paragraph Focus, Hide Distractions |

**Key changes:**
- Removed all emojis from tab labels and feature card headers
- Moved Reading Ruler from Focus → Read tab
- Moved Reading Mode from Read → Visual tab
- Moved Large Cursor from Sensory card → standalone card in Visual tab
- Removed Site Settings tab (Reset/Guide moved to settings page)
- Added per-site disable row to popup status section
- Text labels with font-size: 11px instead of emoji-sized tabs

**Files modified:**
- `popup/popup.html` — full rewrite
- `popup/popup.css` — tab styling, status-site-row, panel height
- `popup/popup.js` — removed reset-btn and guide-btn listeners
- `guide/guide.html` — updated documentation to match new 3-tab layout
- `manifest.json` — version 1.1.1 → 1.1.2

---

### 2. Auto-Injection Bug Fix

**Problem:** Extension didn't auto-enable on new tabs. Users had to open the popup and toggle settings to activate features on every new page.

**Root cause:** `service-worker.js` had no `chrome.tabs.onUpdated` listener. Content script JS was only injected when the popup called `ensureInjected()`. The manifest only auto-injects CSS files (`sensory-rules.css`, `distraction-rules.css`), not the JS agents.

**Fix:** Added `chrome.tabs.onUpdated` listener in `service-worker.js`:

```js
chrome.tabs.onUpdated.addListener(async (tabId, changeInfo, tab) => {
  if (changeInfo.status === 'loading') {
    injectedTabs.delete(tabId);
    return;
  }
  if (changeInfo.status !== 'complete') return;
  if (!tab.url || tab.url.startsWith('chrome://') || tab.url.startsWith('chrome-extension://')) return;

  try {
    const { globalSettings, disabledSites } = await chrome.storage.local.get(['globalSettings', 'disabledSites']);
    if (!globalSettings?.enabled) return;
    const hostname = new URL(tab.url).hostname.replace(/^www\./, '');
    if ((disabledSites || []).includes(hostname)) return;
    injectContentScripts(tabId);
  } catch (_) {}
});
```

**Logic:**
1. On `loading` → clear tab from `injectedTabs` (so navigation triggers re-injection)
2. On `complete` → check URL isn't chrome:// or chrome-extension://, check `globalSettings.enabled`, check `disabledSites`, then inject
3. `injectContentScripts()` already deduplicates via `injectedTabs` Set

**Files modified:**
- `service-worker.js` — added `onUpdated` listener after line 135
- `manifest.json` — version 1.1.2 → 1.1.3

---

### 3. Extension Testing Skill

**Problem:** Lifecycle bugs (like the auto-injection gap) slip through because there's no systematic way to test Chrome extension behavior. Claude can verify layout via preview but can't test injection, storage, or tab lifecycle.

**Solution:** Created `.claude/skills/test-extension/SKILL.md` — a Claude Code skill invocable via `/test-extension` that provides a systematic testing checklist.

**6 test categories:**
1. **Lifecycle** — new tab auto-activation, same-tab navigation, back/forward, reload, browser restart, extension reload
2. **Enable/Disable** — master toggle, per-site disable
3. **Restricted Pages** — chrome://, chrome-extension://, about:blank, PDF, New Tab Page
4. **Storage** — fresh install, settings roundtrip, popup ↔ content script sync, preset application
5. **UI** — all themes, popup dimensions, all tabs, sub-controls, keyboard nav, sliders
6. **Edge Cases** — multiple windows, rapid toggling, long domains

---

## Testing Required

After reloading the extension at `chrome://extensions`:

1. Enable Color Tint + Typography on any page via popup
2. Open brand new tab, navigate to any site → features should apply automatically
3. Navigate to a different site in same tab → features should re-apply
4. Add a site to disabled list → open that site → features should NOT apply
5. Turn master toggle off → open new tab → nothing should activate
6. Run `/test-extension` for the full checklist

---

## Architecture Notes

- **Manifest CSS injection** (`content_scripts` in manifest.json): Only injects `sensory-rules.css` and `distraction-rules.css` at `document_start`. These are CSS-only and always present.
- **JS agent injection** (service worker `injectContentScripts()`): Injects 13 JS files via `chrome.scripting.executeScript()`. Tracked by `injectedTabs` Set. Requires `globalSettings.enabled` and site not in `disabledSites`.
- **ContentOrchestrator.init()** reads settings from storage on first run, so newly-injected tabs apply saved settings automatically.
- **Deep merge pattern** ensures new settings keys get default values on extension update without losing user customizations.
