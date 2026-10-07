# Attribution

LoveSpark AdBlock's expanded blocklist can be generated at build time from community filter lists
via `scripts/build-rules.mjs` (`npm run build:rules`). When you do so, the generated
`rules-*.json` files are **derivative works of those lists** and carry their licenses. This file
satisfies that attribution / share-alike obligation.

## Filter lists (content)

- **EasyList** — © The EasyList authors — https://easylist.to/
  Licensed under **GPL-3.0** and **CC BY-SA 3.0**.
- **EasyPrivacy** — © The EasyList authors — https://easylist.to/
  Licensed under **GPL-3.0** and **CC BY-SA 3.0**.
- **Fanboy's Annoyance List** — © The EasyList authors — https://easylist.to/
  Licensed under **GPL-3.0** and **CC BY-SA 3.0**.

Because these lists are GPL-3.0 + CC BY-SA, any distributed ruleset derived from them must credit
"The EasyList authors (https://easylist.to/)" and remain share-alike. The
hand-curated rules that ship by default (`rules-ads.json`, `rules-tracking.json`,
`rules-annoyances.json`, `rules-youtube.json`) are original LoveSpark work under the project's MIT
license; the generated `rules-easylist.json`, `rules-easyprivacy.json`, and
`rules-fanboy-annoyances.json` carry the list licenses above.

## Build tooling (code, not shipped)

- **@ghostery/adblocker** — © Ghostery GmbH — https://github.com/ghostery/adblocker
  Licensed under **MPL-2.0**. Used **only at build time** (a `devDependency`) to validate filter
  syntax. It is never bundled into the published extension, so the shipped extension remains MIT.

## The extension itself

LoveSpark AdBlock's own source code is **MIT** licensed — see [LICENSE](LICENSE).
