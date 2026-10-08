# LoveSpark CWS Filler

A shipping helper for the LoveSpark suite. It auto-fills the **text fields** of
the Chrome Web Store Developer Dashboard from an extension's `cws-listing.json`
(the structured source of truth produced by `scripts/cws-listing.py`).

It is the lightweight, on-page **fallback** to the Playwright filler
(`scripts/cws-autofill.py`): it runs inside the browser you're already logged
into, so there's no separate automation session — the lower-risk path under the
CWS developer terms.

## Use

1. Load unpacked (`chrome://extensions` → Developer mode → Load unpacked → this folder).
2. Open your extension's listing in the CWS dashboard.
3. Click the **Sparky button** at the bottom-right of the page.
4. Load the extension's `cws-listing.json`, then **Fill text fields**.
5. Drag in the screenshots / promo tiles (browser security blocks scripted image
   upload), set the **Category** dropdown by hand, review every tab, and click
   **Submit for review** yourself. The extension never submits.

## What it fills

- Detailed description
- Single-purpose statement
- Per-permission justifications
- Privacy policy URL
- The three developer certification checkboxes

## What stays manual

- Screenshots, store icon, promo tiles (the panel lists exactly what to drag where)
- The Category dropdown (non-native Material menu)
- The final **Submit for review** click (human-in-loop by design)

## How it finds fields

No fixed CSS selectors — Google's dashboard classes are obfuscated and churn.
The content script matches each field by its accessibility label / aria / nearby
text at runtime, and sets values with the native setter + input/change events so
the dashboard's framework registers them.

Part of the LoveSpark suite — free, open-source, privacy-first, local-only.
