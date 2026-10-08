# LoveSpark AdBlock — Audit & Research (2026-06-21)

Adversarial audit of `lovespark-adblock` v1.0.38. Method: 5 disjoint-dimension auditors
(read-only, file:line-grounded) → each code finding re-verified by an independent skeptic →
orchestrator re-confirmed the P0 against committed HEAD. **42 confirmed, 1 debunked.**

> Status note: the working tree currently has an **uncommitted shared-lib/UI sync** (`lib/*`,
> `popup.css`, `settings.css`, `manifest.json` modified; `lib/lovespark-tokens.css` untracked).
> None of the findings below depend on that in-progress work unless stated. The P0 is in committed HEAD.

---

## 0. Headline verdict

The extension is clean, well-structured MV3, but has **one shipped P0 that breaks the popup**, a
**token-sized 240-rule blocklist** (the product's core value is thin), a **droppable `<all_urls>`**,
**stats that under-count and disagree with the badge**, and a **missing CWS package** (rule #14).
The single highest-leverage improvement is a **build-time filter-list → DNR converter** to go from
240 rules to a real (~30k-rule) blocklist — without paid API or remote code.

---

## 1. CRITICAL — popup is broken in production (P0)

**`popup.js:61,181` references `settings-btn`, which does not exist in `popup.html`.**

- Committed HEAD `popup.js:61` → `const settingsBtn = document.getElementById('settings-btn');`
- Committed HEAD `popup.js:181` → `settingsBtn.addEventListener('click', …)` → `settingsBtn` is `null` → **`TypeError` at module top level**.
- Committed HEAD `popup.html` has only `id="board-btn"` and `id="whitelist-btn"` — **no `settings-btn`**.
- Because line 181 throws, **everything after it never runs**: the `board-btn` listener (185), the
  `chrome.storage.onChanged` live-update listener (196–218), `init()` (221), and the footer render (224).
- **User-visible effect:** popup opens but counters never populate from storage, the domain/whitelist
  button never initializes, live updates are dead, and the Ko-fi/suite footer is missing. The toggle and
  whitelist buttons (listeners registered at 162–179, before the crash) still work.
- This very likely co-caused the historical "counter stuck at 0" symptom (BUG, commit `97961ec`), which was
  only partly explained by the `rulesMatchedInfo` property bug.

**Fix:** delete the dead `settingsBtn` ref (line 61) and its listener (181–183) — `board-btn` already calls
`openOptionsPage()`. Add null-guards to all DOM refs before `addEventListener`. Bump patch version (rule #9).
This is the one finding that should be fixed and shipped on its own, immediately.

---

## 2. Ruleset & blocking efficacy

| Sev | Finding | Location | Fix |
|-----|---------|----------|-----|
| High | **Google Publisher Tag loader entirely unblocked** — `googletagservices.com` + `securepubads.g.doubleclick.net` absent (only `googlesyndication.com` / `googleads.g.doubleclick.net` present) | rules-ads.json | add `\|\|googletagservices.com^`, `\|\|securepubads.g.doubleclick.net^` |
| High | **Criteo bidstream `criteo.net` missing** (only `criteo.com` blocked) | rules-ads.json:11 | add `\|\|criteo.net^` |
| High | **Major modern networks absent**: tiktok, adroll, doubleverify, adsafeprotected (IAS), tealium/tiqcdn, adobedtm, permutive, lotame, pardot, marketo, pinterest, quora, reddit ads, 33across | rules-tracking.json | add the vendor hosts |
| Med | **240 hand-curated rules = coverage ceiling** (EasyList ≈ 50k). DNR static cap is far higher; this is a curation choice, not a limit | rules-ads.json | §6 scaling plan, or scope marketing copy to "major-network blocker" |
| Med | **Whitelist allow-rule uses `initiatorDomains` only** — no `requestDomains`/`resourceTypes`; main_frame nav has empty initiator, and requests from inside a 3rd-party ad iframe carry the iframe origin → not exempted on a whitelisted site | background.js:194–201 | add `resourceTypes` incl. `main_frame` and/or `requestDomains`; test on a GPT-heavy site |
| Med | **`\|\|disqus.com^` blocks Disqus comments** (script+sub_frame on whole domain) at "strong" | rules-annoyances.json:55 | narrow to disqus tracking endpoints, or document as intentional "remove comments" |
| Low | `intercom.io` is in the **tracking** ruleset → support chat blocked at the **default** "medium" tier | rules-tracking.json:47–48 | move Intercom widget hosts to annoyances (off by default) |
| Low | `t.co` blocked for image/ping/xhr (navigation preserved — correctly scoped tradeoff) | rules-tracking.json:56 | confirm intent; note in BUGS log |
| Low | `analytics.google.com` XHRs blocked → affects GA admins only | rules-tracking.json:43 | acceptable |
| Nit | First-party server-side GTM (sGTM) is inherently unblockable by domain rules | rules-tracking.json:2 | document in PRIVACY/CWS copy |
| ✓ | **Priority model sound, no id collisions** — ads 1–120, tracking 121–180, annoyances 181–240, whitelist 50000+ (all disjoint); ads all `priority:1`, allow `priority:2` | confirmatory | none |
| ✓ | `facebook.com/tr` + `/plugins` correctly path-scoped (login unaffected) | confirmatory | none |

---

## 3. Background service worker — state & stats

| Sev | Finding | Location | Fix |
|-----|---------|----------|-----|
| High | **`getMatchedRules` retention window drops blocks during SW sleep → counter under-counts.** Chrome retains match records only for a short rolling window; persisting `_lastPollTs` cannot recover records that aged out while the SW slept (the line-95 comment is misleading) | background.js:96–111 | treat the polled counter as a best-effort lower bound (label it), or make the badge canonical; poll on popup open |
| Med | **Badge ≠ popup "Blocked Today".** Badge = Chrome's per-tab matched-action count (auto); popup = cumulative polled sum. Different data sources → they diverge and read as a bug | bg:35–37,73–74 vs 115–121 | pick one source of truth, or relabel badge="this page" / popup="today (all sites)" |
| Med | **`_lastPollTs` advanced to `Date.now()` *after* the await** → matches in the read→write gap are dropped | background.js:102–110 | capture cursor *before* `getMatchedRules`, or set `_lastPollTs` = max `timeStamp` in `rulesMatchedInfo` (idempotent window) |
| Med | **`GET_STATS` re-polls out-of-band with no in-flight guard**, racing the 1-min alarm → can double-process the same window | bg:218–220,100–111 | coalesce concurrent `pollMatchedRules()` via a module-level in-flight promise |
| Med | **Daily reset uses UTC date** (`toISOString().slice(0,10)`) → "Today" rolls over at UTC midnight, not local | bg:15–17,123–132 | compute local `YYYY-MM-DD` from `getFullYear/getMonth/getDate` |
| Med | **`syncWhitelist` passes raw user domains to `updateDynamicRules` with no validation; storage written *before* sync; `{error}` never surfaced** → one bad domain poisons the batch, silently | bg:187–207,244–252; settings.js:170–184; popup.js:168–179 | validate/normalize, persist only after sync resolves, show returned error in UI |
| Low | `RESET_STATS` doesn't reset `_lastPollTs` → next poll re-adds retained matches after a reset | background.js:269–276 | also set `_lastPollTs: Date.now()` on reset |
| Low | Dev/unpacked double-counts after SW restart: in-memory `_debugListenerFired` resets to `false`, so poll path + `onRuleMatchedDebug` overlap until the next debug event | background.js:85–111 | persist a durable dev/packed flag, or make the poll path timestamp-idempotent |
| Low | `pollStats` 1-min alarm is at Chrome's floor and subject to throttling | background.js:56–59 | tolerate missed polls via idempotent cursor (above) |
| Nit | **`onStartup` does not re-apply intensity/whitelist — verified NON-bug** (Chrome persists DNR enabled-rulesets + dynamic rules across restarts) | background.js:71–78 | add a comment so a future edit doesn't add a redundant re-apply |

---

## 4. Manifest, permissions & store compliance (CWS + AMO)

| Sev | Finding | Location | Fix |
|-----|---------|----------|-----|
| High | **CWS submission package entirely missing** (rule #14): no `CWS-LISTING.md`, `PRIVACY.md`, `SUBMIT.md`, `cws-shots/` | repo root | run `marketing-asset-generator.py`; check artifacts in before any CWS upload |
| High | **Source manifest fails `amo-validate.py` (AMO-001 + AMO-002)** — only rescued by `build-zips.sh` auto-fix: gecko block uses `is_exempt`/`justification` but validator expects `data_collection_permissions.required:["none"]`; `background.service_worker` has no `scripts` fallback for Firefox | manifest.json:20–22,62–66 | add `"required":["none"]` to gecko block + `"scripts":["background.js"]` to background; bump version |
| Med | **`host_permissions:["<all_urls>"]` broader than needed** for a pure block-only DNR extension — blocking works without host perms; only `getMatchedRules` (popup counter) leans on the feedback permission. Dropping it = fastest CWS review (rule #5) | manifest.json:29–31 | drop it (rely on badge), or scope `getMatchedRules` to active tab; if kept, justify in CWS-LISTING |
| Med | **Mascot missing from `settings.html`** (rule #3) — present in popup.html:17 only | settings.html | add `<img src="mascot.png" alt="Sparky — LoveSpark mascot">` to settings header |
| Med | **Body font is DM Mono / Lora, not OpenDyslexic** (rule #12). An accessible font (Atkinson Hyperlegible) is *bundled but unused*; OpenDyslexic is not shipped at all | lib/lovespark-tokens.css:44,109 | see §5 — this is a **fleet-wide** design-system vs rule-#12 conflict; owner call |
| Low | `declarativeNetRequestFeedback` carried solely for the popup counter (CWS-flagged but justified) | manifest.json:25 | keep + justify; drop together with `<all_urls>` if the precise counter is ever cut |
| Nit | Chrome build retains `<all_urls>`; auto-strip only removes gecko + adds background.scripts → minimization must happen in source manifest | scripts/build-zips.sh:140–153 | doc-only |

---

## 5. UI / popup / settings / accessibility

| Sev | Finding | Location | Fix |
|-----|---------|----------|-----|
| **Critical** | **popup.js crash** — see §1 | popup.js:61,181 | delete dead `settingsBtn` ref + listener |
| High | **OpenDyslexic never loaded** — body resolves to DM Mono monospace (rule #12; shared-lib-wide gap) | popup.css:36 / settings.css:35 / lib/lovespark-fonts.css | add OpenDyslexic `@font-face`; `--ls-font-body:'OpenDyslexic',system-ui,sans-serif` |
| High | **Mascot absent from settings.html** (rule #3) | settings.html:12–14 | add mascot `<img>` to header |
| High | **Popup has no visible focus indicators** — `lib/lovespark-base.css` not linked in popup.html and popup.css defines none | popup.html:7–9 / popup.css | link base.css, or copy the `:focus-visible` block into popup.css |
| Med | **Popup missing `role="dialog"` + `aria-labelledby`/`aria-describedby`** | popup.html:13 | set on `#root`, give title an id |
| Med | **`aria-live` is on the static shield emoji, not the dynamic counters** | popup.html:35,49,54 | move `aria-live="polite"` + `aria-atomic="true"` onto stat-today/total |
| Med | **Touch targets < 32px**: `.wl-remove`, `.wl-btn`, theme trigger/options, footer links | settings.css:296–303 / popup.css:241–244,404–413 | add `min-height:32px` (+`min-width` for icon-only ✕) |
| Med | **Beige theme small text fails AA** (muted ≈3.72:1, accent-on-glass ≈2.50:1) | popup.css:349,353,345 | darken muted ~`#6f5733`, accent ~`#9a5840`; verify ≥4.5:1 |
| Med | **Paused status `#999` fails contrast** (~2.3–2.85:1) | popup.css:117 | use `var(--ls-text-muted)` or ~`#5a5a5a` |
| Low | **Dead code**: `escHtml`/`HTML_ESC` defined, never called | settings.js:230–233 | delete |
| Low | **Settings footer hardcodes `v1.0.0`** while manifest is 1.0.38 | settings.html:128 | render `chrome.runtime.getManifest().version` |
| Low | **Suite links are dead `href="#"`** placeholders | settings.html:119–121 | point to real store URLs (`target=_blank rel=noopener`) or remove |
| ✗ Debunked | "Retro theme muted small text ~3.7:1 fails" — `--ls-text-muted:#9E4D6E` on the retro glass surface does **not** reproduce as failing | — | none |

---

## 6. The #1 improvement — scale 240 rules → a real blocklist (no paid API, no remote code)

**Path:** a *build-time* converter that compiles community filter lists (EasyList / EasyPrivacy /
AdGuard Base) into **bundled static DNR JSON**, split to fit Chrome's caps. No runtime network, no
`eval` — MV3-compliant and zero-data. Updates = re-run the build, bump version, re-zip, resubmit
(the standard uBO-Lite / AdGuard-MV3 model).

### Chrome MV3 DNR limits (verified)
- `GUARANTEED_MINIMUM_STATIC_RULES` = **30,000** enabled static rules across enabled rulesets (the practical ceiling — target ≤30k enabled).
- Shared `GLOBAL_STATIC_RULE_LIMIT` ≈ 300k–330k pooled across *all* extensions, opportunistic only (`getAvailableStaticRuleCount()`) — **do not rely on it**.
- `MAX_NUMBER_OF_STATIC_RULESETS` = 100 declared, `MAX_NUMBER_OF_ENABLED_STATIC_RULESETS` = 50.
- `MAX_NUMBER_OF_REGEX_RULES` = **1,000** (static+dynamic combined) — converter must cap/drop overflow.
- Dynamic (Chrome 121+): 30,000 "safe" (block/allow/allowAllRequests/upgradeScheme) + 5,000 "unsafe" (redirect/modifyHeaders). The whitelist allow-rules (id 50000+) live in the **separate dynamic pool** — they don't eat the static budget.

### Converter options
| Tool | License | no-paid-API | Verdict |
|------|---------|-------------|---------|
| **@ghostery/adblocker** | **MPL-2.0** | ✓ | **Recommended** — MPL is MIT-compatible; build-time only. |
| @adguard/tsurlfilter (CLI) | GPL-3.0-only | ✓ | Best fidelity, but GPL — only as an *isolated, unshipped* build tool. |
| @adguard/dnr-rulesets (prebuilt) | GPL-3.0-only | ✓ | **Avoid** — shipping the prebuilt rulesets makes the extension a GPL derivative (breaks MIT). |
| @eyeo/abp2dnr | GPL-3.0 | ✓ | Single-list; same GPL caveat as tsurlfilter. |
| Stay hand-curated + expand | clean MIT | ✓ | No attribution burden, but never competitive with EasyList. |

**Recommended:** build-time pipeline using **@ghostery/adblocker (MPL-2.0)** so the repo stays MIT-clean.
`scripts/build-rules.mjs` (dev-dependency only — *nothing from node_modules ships*) fetches EasyList +
EasyPrivacy + AdGuard Base at build time, converts to DNR JSON, **splits to keep the enabled set ≤30k**,
writes `rules-ads-*.json` / `rules-tracking-*.json` / `rules-annoyances-*.json`, and regenerates
`manifest.rule_resources`.

> **Content-license obligation (independent of build tool):** EasyList/EasyPrivacy are GPL-3.0 + CC BY-SA 3.0.
> The generated rules are a derivative → add `ATTRIBUTION.md` crediting "The EasyList authors
> (https://easylist.to/)" and honor share-alike. Missing attribution is a real violation even with an MPL tool.

### Integration steps (preserve existing behavior)
1. `scripts/build-rules.mjs` + `package.json` with `@ghostery/adblocker` as **devDependency**; command `npm run build:rules`.
2. Fetch upstream lists into a gitignored cache (pin to dated snapshot for reproducible builds).
3. Convert + **split** so enabled rulesets total ≤30,000; keep each file a few-thousand rules; cap regex ≤1,000.
4. Map intensity tiers to ruleset **groups** in `applyIntensity()`: light=ads*, medium=ads*+tracking*, strong=+annoyances* (annoyances disabled by default, as today).
5. **Rebase whitelist priority**: converted EasyList rules carry their own priorities → set allow-rule priority = `maxConvertedPriority + 1` (computed at build, written to a generated constant). Keep the `initiatorDomains`+`allow` dynamic scheme.
6. Regenerate `manifest.rule_resources` from the build script (don't hand-edit). Leave permissions/gecko untouched.
7. Add `ATTRIBUTION.md`; link from README + PRIVACY.md.
8. Verify: load unpacked, hit known ad/track domains, confirm counter increments + badge shows counts; assert headroom via `getAvailableStaticRuleCount()`; bump version (rule #9); rebuild both zips (`build-zips.sh`; firefox zip must pass `amo-validate.py` per rule 5a); regenerate CWS package (rule #14); log to BUGS_AND_ITERATIONS.md.

### Risks
- **License coupling** (GPL tools/rulesets) → use MPL Ghostery or isolate GPL build tools.
- **Content attribution** (EasyList GPL+CC-BY-SA) → mandatory `ATTRIBUTION.md`.
- **Over-blocking / breakage** (EasyList is aggressive) → rely on the whitelist, conservative default tier, annoyances off.
- **Cap overflow** → trim/prioritize to ≤30k; don't rely on the shared global pool.
- **Regex cap (1,000)** → converter must drop/down-convert overflow; log dropped count.
- **Update cadence** → no runtime fetch in MV3; set a monthly rebuild+resubmit cadence.
- **CWS/AMO scrutiny** of large rulesets + `<all_urls>` → update single-purpose + per-permission justifications.
- **No cosmetic hiding** (no content scripts) → EasyList `##` rules are unconvertible; page placeholders may remain. This is a network-level blocker, not uBO element-hiding parity.
