# Submission Quickstart — Pink Ad Blocker (v1.1.0)

One-page map from each store form field to the copy in [CWS-LISTING.md](CWS-LISTING.md).
Full long-form copy lives there; this is the checklist for upload day.

## Packages
- **Chrome Web Store:** `lovespark zips/chrome zips/lovespark-adblock-chrome.zip`
- **Firefox AMO:** `lovespark zips/firefox zips/lovespark-adblock-firefox.zip` (AMO-validated)

## CWS form field → source
| CWS field | Use |
|-----------|-----|
| Name | `Pink Ad Blocker — Block Ads & Trackers` (from manifest `__MSG_extName__`; 38/45 chars) |
| Short description | CWS-LISTING.md → *Short description* (117/132 chars) |
| Detailed description | CWS-LISTING.md → *Long description* |
| Category | Productivity (or Privacy & Security) |
| Single purpose | CWS-LISTING.md → *Single-purpose justification* |
| Permission justifications | CWS-LISTING.md → *Per-permission justification* |
| Site access justification | CWS-LISTING.md → *Site-access justification* (YouTube only; no `<all_urls>`) |
| Privacy practices (§5) | CWS-LISTING.md → *Privacy disclosure* — all data types **No** |
| Privacy policy URL | `https://github.com/Joona-t/lovespark-adblock/blob/main/PRIVACY.md` |
| Test instructions | CWS-LISTING.md → *Reviewer test instructions* |

## Pre-submit checklist
- [ ] Version bumped (manifest `1.1.0`) and zips rebuilt.
- [ ] Name avoids the "AdBlock"/"Adblock" trademark token (uses two-word "Ad Blocker"). ✅
- [ ] PRIVACY.md committed and reachable at the GitHub blob URL above.
- [ ] All privacy data-collection categories set to **No**; 3 certification boxes ticked.
- [ ] **Screenshots — TODO:** 5 localized + 5 global @ 1280×800, small promo 440×280, marquee
      1400×560. Generate with `python3 "Claude x LoveSpark/scripts/marketing-asset-generator.py"
      Extensions/privacy/lovespark-adblock --out ~/Downloads/lovespark-adblock-cws-assets`.
- [ ] Firefox AMO: upload the `-firefox.zip`; reuse the same listing copy.
