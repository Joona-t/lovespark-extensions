# Architecture Decisions

## Agent-based architecture (not LLM agents)

**Decision:** Structure the extension as discrete software agents with explicit roles, lifecycle methods, and message-based communication.

**Why:** Each feature (font override, reading ruler, paragraph focus, distraction removal) has distinct DOM ownership, event listeners, and lifecycle concerns. Agents enforce isolation: no shared mutable state, no cross-agent DOM access, clean teardown/re-init for MV3 service worker restarts.

**Tradeoff:** More boilerplate than a flat content script. Worth it for testability and the ability to enable/disable features independently without side effects.

## MessageBus over direct calls

**Decision:** Content-side agents communicate through a local EventTarget-based MessageBus. No agent calls another agent's methods directly.

**Why:** Prevents coupling. Agents can be added/removed without modifying other agents. The Orchestrator is the only component that knows about all agents.

**Alternative considered:** Direct method calls between agents. Rejected because it creates hidden dependencies and makes teardown order-dependent.

## chrome.storage.onChanged for settings propagation

**Decision:** Settings flow from popup/settings page via `chrome.storage.sync.set()`, and content scripts react via `chrome.storage.onChanged` listener.

**Why:** This is the established LoveSpark pattern (used by lovespark-reader). Zero message-passing overhead, works across all tabs simultaneously, survives service worker restarts. The storage API handles serialization and cross-context delivery.

**Alternative considered:** `chrome.runtime.sendMessage` relay from popup to background to content scripts. Rejected because it adds complexity for no benefit and requires the service worker to be alive.

## activeTab + scripting (on-demand injection)

**Decision:** Use `activeTab` permission with `chrome.scripting.executeScript()` for on-demand content script injection instead of static `content_scripts` in the manifest.

**Why:** Zero permission warnings at install. No `<all_urls>` host permission needed. Content scripts only run on tabs the user explicitly activates. This maximizes Chrome Web Store approval chances and user trust.

**Tradeoff:** Content scripts don't auto-inject on page load. The user must click the extension icon to activate it on each tab. Future enhancement: use `chrome.scripting.registerContentScripts()` for user-configured always-on domains.

## Shadow DOM for reading ruler

**Decision:** The reading ruler overlays live inside a closed Shadow DOM to prevent CSS conflicts with page styles.

**Why:** Page CSS (resets, global selectors, z-index stacking) can break injected overlay elements. Shadow DOM provides complete style isolation. `mode: 'closed'` prevents page scripts from accessing the shadow tree.

## Two-overlay approach for ruler (not gradient)

**Decision:** Two opaque overlay divs (top shade + bottom shade) with a transparent gap, positioned via `transform: translateY()`.

**Why:** GPU-composited transforms avoid layout recalculation. The transparent gap naturally allows click-through to page content via `pointer-events: none`. This is the dominant pattern used by Helperbird, ReadingLine, and other mature reading ruler extensions.

**Alternative considered:** Single overlay with CSS `linear-gradient`. More elegant CSS but gradient repaints are more expensive than transform-based positioning.

## box-shadow 100vmax for paragraph focus

**Decision:** Use `box-shadow: 0 0 0 100vmax rgba(0,0,0,dim)` on the focused element to dim the entire viewport.

**Why:** Single DOM element, no overlay div needed. The massive shadow covers the entire viewport, creating the dimming effect. Clean toggle via adding/removing a CSS class.

**Tradeoff:** Can produce visual artifacts on complex multi-column layouts. The opacity-based fallback approach is kept in reserve but not implemented in v1.

## CSS-first distraction removal with per-type gating

**Decision:** Distraction hiding uses CSS `display: none !important` gated on individual data attributes (`data-nr-hide-sidebars`, `data-nr-hide-ads`, `data-nr-hide-cookies`, `data-nr-hide-floating`). MutationObserver only handles auto-playing media.

**Why:** CSS-first is fastest (no JS execution needed for static hiding), instantly reversible (remove the attribute), and doesn't break page JavaScript that references hidden elements. Per-type attributes ensure sub-toggles actually work — users can hide ads without hiding sidebars. DOM removal would break SPAs that expect elements to exist.

## Single settings object in chrome.storage.sync

**Decision:** All settings stored as one `settings` key in `chrome.storage.sync` instead of individual keys.

**Why:** Single read/write per operation. Atomic updates prevent inconsistent state. Version tracking (`_version`) enables future schema migrations. Well within the 8KB per-item sync limit.

## .woff fonts (not .woff2)

**Decision:** Bundle OpenDyslexic as `.woff` files instead of `.woff2`.

**Why:** The official OpenDyslexic repository provides `.woff` format. All modern browsers support both. The `.woff` files are ~17-30KB each, well within acceptable extension size.

## No framework

**Decision:** Vanilla JavaScript, no React/Vue/Svelte.

**Why:** LoveSpark convention. Extension popups and content scripts are small enough that frameworks add bundle size without meaningful benefit. Direct DOM manipulation is explicit and traceable.
