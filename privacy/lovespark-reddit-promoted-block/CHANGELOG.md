# Changelog

## 1.0.17

- Bump version for CWS submission
- Shared library sync

## 1.0.16

- Add shreddit-post promoted-label selector for latest Reddit SPA
- Add article promoted-label selector fallback
- Full accessibility audit pass (39/39 checks)
- 54-locale i18n support

## 1.0.15

- Text-based fallback: detect "Promoted" labels and hide parent post cards
- Sidebar ad selectors (shreddit-ad, ad-container, premium-banner)
- Debounced storage writes (3s flush) to reduce write overhead

## 1.0.14

- MutationObserver for infinite scroll feeds
- Support for old.reddit.com, new.reddit.com, sh.reddit.com
- Daily reset counter with today/total stats

## 1.0.0

- Initial release
- Hides promoted posts on new Reddit and old Reddit
- No network requests, no data collection
- LoveSpark branded popup with Sparky mascot
