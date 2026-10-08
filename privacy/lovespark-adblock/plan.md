# LoveSpark AdBlock — Improvement Plan

Derived from `research.md` (2026-06-21 audit: 42 confirmed findings). Ordered by leverage.

> **DO NOT IMPLEMENT YET.** Per workflow rules #1/#8, code lands only when Joona says **"implement it all"**
> (or names specific tiers). Two items below need an **owner decision** before they're actionable — marked 🟣.
>
> Working-tree note: an uncommitted shared-lib/UI sync is in progress (`lib/*`, `popup.css`, `settings.css`,
> `manifest.json`). P0 should be committed on its own branch so it doesn't entangle that sync.

---

## P0 — Ship now (shipped breakage, ~10 min)

- [ ] **Fix popup crash** — remove dead `settingsBtn` ref (`popup.js:61`) + its listener (`popup.js:181–183`); `board-btn` already opens options. Null-guard every `getElementById` ref before `addEventListener`.
- [ ] Manually confirm popup loads: counters populate, live `storage.onChanged` updates fire, footer renders.
- [ ] Bump patch version (rule #9) → log `BUG` in BUGS_AND_ITERATIONS.md → commit on a branch + push (rule #15).

## P1 — Correctness, safety & store-compliance (low risk, high value)

- [ ] **Whitelist validation + error surfacing** — validate/normalize domains, persist to storage **only after** `syncWhitelist` resolves, show the returned `{error}` in popup/settings (bg:187–207; settings.js:170–184; popup.js:168–179).
- [ ] **Stat-counter idempotency** — capture the `getMatchedRules` cursor *before* the await (or use max `timeStamp`); add an in-flight guard so `GET_STATS` + the alarm coalesce; reset `_lastPollTs` on `RESET_STATS` (bg:96–111,218–220,269–276).
- [ ] **Badge vs popup semantics** — relabel badge = "this page" / popup = "today (all sites)", and label the polled counter as a best-effort lower bound (bg + popup.html copy).
- [ ] **Local daily reset** — replace UTC `toISOString` date with a local `YYYY-MM-DD` (bg:15–17).
- [ ] **AMO source-clean manifest** — add `gecko.data_collection_permissions.required:["none"]` and `background.scripts:["background.js"]` so the source passes `amo-validate.py` without the build-time rescue (rule 5a).
- [ ] 🟣 **Drop `<all_urls>`** (decision A) — if approved, remove host permission and verify blocking + popup counter still work; else add a host-perm justification to CWS-LISTING.
- [ ] **CWS package (rule #14)** — run `marketing-asset-generator.py`; check in `CWS-LISTING.md`, `PRIVACY.md`, `SUBMIT.md`, `cws-shots/` (12 assets). Run `ls-check . --strict`.

## P2 — The big one: real blocklist 🟣 (decision B — see §6 of research.md)

- [ ] 🟣 Choose scaling approach: **(B1) Ghostery MPL build-time converter → ~30k DNR rules** (recommended, stays MIT) / (B2) stay hand-curated, just add the missing major networks from §2 / (B3) GPL route.
- [ ] If B1: add `scripts/build-rules.mjs` + `package.json` (`@ghostery/adblocker` devDep, never shipped) + `npm run build:rules`.
- [ ] If B1: fetch EasyList + EasyPrivacy + AdGuard Base → convert → **split to keep enabled ≤30,000**; cap regex ≤1,000; emit `rules-{ads,tracking,annoyances}-*.json`; regenerate `manifest.rule_resources`.
- [ ] If B1: map intensity tiers to the new ruleset groups in `applyIntensity()`; rebase whitelist allow-rule priority to `maxConvertedPriority+1`.
- [ ] If B1: add `ATTRIBUTION.md` (EasyList GPL-3.0 + CC BY-SA 3.0) → link from README + PRIVACY.md.
- [ ] **Quick win regardless of B** — add the confirmed missing high-value hosts: `googletagservices.com`, `securepubads.g.doubleclick.net`, `criteo.net`, tiktok, adroll, doubleverify, adsafeprotected, tealium/tiqcdn, adobedtm, permutive, lotame, pardot, marketo.
- [ ] Broaden the whitelist allow-rule (`resourceTypes` incl. `main_frame` / `requestDomains`); test on a GPT-heavy site.
- [ ] Re-scope `\|\|disqus.com^` and move `intercom.io` to annoyances (off by default) so defaults don't break comments/support chat.

## P3 — Accessibility & polish

- [ ] **OpenDyslexic** (shared-lib-wide) — 🟣 see decision C; if adopted, add `@font-face` + `--ls-font-body`.
- [ ] **Mascot in settings.html** (rule #3).
- [ ] **Popup focus indicators** — link `lib/lovespark-base.css` or add `:focus-visible` to popup.css.
- [ ] **Popup ARIA** — `role="dialog"` + `aria-labelledby`/`aria-describedby`; move `aria-live` onto the counters.
- [ ] **Touch targets ≥32px** — `.wl-remove`, `.wl-btn`, theme trigger/options, footer links.
- [ ] **Contrast fixes** — beige muted/accent; paused `#999` → theme token.
- [ ] **Cleanup** — delete dead `escHtml`/`HTML_ESC`; render real version in settings footer (not hardcoded `v1.0.0`); fix dead `href="#"` suite links.
- [ ] After UI work: `python3 scripts/audit-contrast.py --verbose --history` + `/postmortem`.

---

## Owner decisions needed (🟣) before P1/P2/P3 fully greenlight
- **A — `<all_urls>`:** drop it for the fastest CWS review (recommended), or keep + justify?
- **B — Blocklist scaling:** Ghostery MPL build pipeline (recommended) / hand-curated expansion only / GPL route?
- **C — OpenDyslexic vs DM Mono:** rule #12 mandates OpenDyslexic, but the live design system ships DM Mono. Fleet-wide — switch to OpenDyslexic, or update rule #12 to reflect the design system?

## Suggested sequencing
P0 today (standalone branch). Then P1 + the P2 "quick win" hosts in one pass. Then decision B → P2 build pipeline. Then P3 a11y sweep (ideally fleet-wide for the shared-lib items: focus indicators, OpenDyslexic).
