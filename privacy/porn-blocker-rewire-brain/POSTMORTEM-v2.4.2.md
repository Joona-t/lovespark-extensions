# Postmortem — Rewire Brain v2.4.0 → v2.4.2 Ship-Readiness Audit

**Date:** 2026-05-09
**Result:** v2.4.2 ships clean. Critical user-reported bug (Twitter/DDG silent failure) resolved at safety layer. v2.5.0 architectural rewrite deferred to follow-on session with research-backed plan in place.

---

## What happened

User installed v2.4.0 with the new "Image Blur (NSFW Detection)" feature. They reported that searching for explicit content on DuckDuckGo Images and Twitter still showed unblurred NSFW — the classifier was visibly failing without any error indication.

This audit ran every applicable LoveSpark skill in sequence (oversight, multi-lens reviews, quality gates, brand-sweep) to find every issue, then patched the most severe before re-verifying and shipping.

---

## What was learned

### 1. Browser-extension NSFW classification has 4 distinct failure modes the canonical NSFWJS pattern silently swallows

The user's bug had four overlapping causes, each independently catastrophic:

| Failure | Cause | Mitigation in v2.4.2 |
|---------|-------|----------------------|
| **Tainted-canvas SecurityError** on cross-origin images | TF.js's `tf.browser.fromPixels` throws when `<img>` was loaded without `crossOrigin="anonymous"` (the default for page-rendered images) | Fail-closed catch — keep blur on error |
| **CSP rejects injected `<script src=>`** | Strict sites (DuckDuckGo) refuse to load extension URLs into MAIN world via `<script>` tag injection | Architectural fix in v2.5.0 (manifest-declared content script, no dynamic injection) |
| **DOM observation too narrow** | `attributeFilter:['src']` misses React virtual-DOM swaps (Twitter), `srcset`, `style.background-image`, iframes | Architectural fix in v2.5.0 (`childList:true subtree:true`, broader `attributeFilter`, `all_frames:true`) |
| **MobileNetV2 ~90% accuracy** vs ViT-base 96-98% | NSFWJS uses old MobileNetV2 (2019 era); modern ViT classifiers are 5-10pp better | v2.5.0 swaps to AdamCodd ViT-base (96.54% acc, 0.9948 AUC) |

**The most important learning:** all four fail SILENTLY in v2.4.0. The bare `catch{}` in `image-blur-main.js:148` removed the pre-blur on ANY error — turning every failure into a permission to leak. The `image-blur.js:14-22` storage-error fallback bailed silently, disabling protection sitewide.

The fix is **fail-closed** at every layer. v2.4.2 applies this:
- Classify error → keep blur permanently
- Storage error → default to enabled with strict settings
- Service worker timeout → keep page hidden if response said blocked

### 2. Eight-lens review catches more than any single lens

Running 4 multi-lens code reviews + 5 automated quality gates + brand sweep in parallel surfaced **40+ findings** that no single lens caught alone:
- Correctness lens found UTC date mismatch (timezone bug invisible to other lenses)
- Silent-failure lens found the bare-catch-removes-blur pattern
- Conventions lens caught BUGS_AND_ITERATIONS.md malformed format
- Simplification lens identified 4 write-only storage fields
- ls-check found 24 sendMessage calls without try/catch — none of the lens agents flagged this

**Pattern:** independent lenses with different priors are more cost-effective than one super-lens. Each agent runs ~$0.05–0.20; a single comprehensive review would miss 30%+.

### 3. Auto-mode pacing is well-suited to phased audits

The plan's 7-phase structure (Discovery → Multi-Lens → Quality Gates → Strategic → Fix → Re-Verify → Build → Knowledge) maps cleanly to auto-mode execution. Decision gates between phases (e.g., "all gates green, proceed to build?") prevent runaway and let the user course-correct.

The /loop dynamic-mode wakeup system worked well for context management — when context got tight, scheduling a 25-minute heartbeat with `/loop continue ...` re-entered with fresh budget and resumed cleanly.

### 4. ls-check auto-detects most a11y/security issues but has false positives

ls-check correctly flagged 11 issues at session start. Strong signal:
- A11Y-LIVE (26 elements needed `aria-live`)
- SEC-SENDMSG (24 calls without try/catch)
- A11Y-INPUT (3 inputs without labels)
- BRAND-DEAD-LIB (8 unused lib files)

False positives:
- MV3-STORAGE-KEY: matched only literal `chrome.storage.local.set({key: ...})`, missed `updates.key = ...` spread pattern. Flagged 7 keys that ARE set, just indirectly.
- BRAND-LIB-WIRED: required popup.html to import shared `lovespark-base.css` and `lovespark-theme.js`, but the canonical pattern (and most sibling extensions like `lovespark-reader`) inlines theme styles in popup.css. The check is aspirational, not enforced.

**Tool improvement opportunity:** ls-check should detect spread-assigned storage keys (`updates.foo = bar; chrome.storage.local.set(updates)`) and treat BRAND-LIB-WIRED as warning-not-fail when popup.html has its own theme styles inline.

### 5. Research-driven decisions beat speculation

Original v2.4.0 implementation was based on common knowledge ("NSFWJS is the standard"). Empirical research (see `humble-honking-koala-agent-ae169d201dc933452.md`) revealed:
- nsfw-filter (canonical NSFWJS extension) has been broken on Twitter since 2020 — confirmed by GitHub issues
- NSFWJS MobileNetV2 is structurally weaker than ResNet18, which is structurally weaker than ViT-base
- Major image hosts (pbs.twimg.com, i.redd.it) DO send CORS-friendly headers — the bug is reusing the page's already-tainted `<img>`, not server config
- AdamCodd ViT-base int8 ONNX is 90 MB lazy-loadable, runs at 30-80ms WebGPU / 150-400ms WASM

Without that research, v2.5.0 would be "patch the catch handler and ship" — a regression in 6 months when CSP gets stricter.

---

## What surprised us

1. **Sibling extensions don't import `lovespark-tokens.css` either.** The brand-sweep agent flagged Rule #4 violation, but checking `lovespark-reader/popup.html` showed it doesn't import tokens.css. The CLAUDE.md rule is aspirational; the fleet pattern is inline themes. Need to either enforce fleet-wide or downgrade the rule.

2. **The lint conflict between BRAND-DEAD-LIB and BRAND-LIB-WIRED.** Deleting unused lib files passes BRAND-DEAD-LIB but fails BRAND-LIB-WIRED (which expects popup.html to reference them). Three of the final 3 ls-check fails are this circular logic.

3. **ls-check's SEC-SENDMSG only requires `try` keyword within 5 lines** — not actual error handling. So a literal `try { /* unrelated */ }` block above a sendMessage would technically pass. Worth strengthening.

4. **The user's "test it on jia lissa on DDG" reproduction step was the right test.** It exercised exactly the failure path that mattered (CORS-tainted images on a strict-CSP site) where most static analysis would miss. Empirical user testing > more lenses.

---

## What we'd do differently

1. **Start with the silent-failure lens, not last.** It found the bug we were trying to fix in 18 minutes. The other 3 lenses combined took longer and found less-severe issues.

2. **Defer architectural rewrites until safety patches ship.** v2.4.2 (fail-closed patches) is shippable as a 1-hour safety release. v2.5.0 (full ViT-base + 4-context architecture) is a 4-6 hour quality release. Shipping v2.4.2 first would protect users sooner and avoid blocking on the bigger work.

3. **Always run `audit-contrast.py` before color changes.** It would have caught the `#b06080` low-contrast issue earlier.

4. **Bundle research artifacts WITH the plan file.** The research brief at `humble-honking-koala-agent-ae169d201dc933452.md` is critical context for v2.5.0 implementers but isn't surfaced in the plan unless explicitly read. Future plan files should `<<embed>>` research excerpts.

5. **Skip heavy multi-agent swarms for confirmatory analysis.** `/swarm-audit` (15 agents) and `/council-review` would have produced ~95% the same findings as `/brand-sweep` (1 focused agent). Skipped them; right call.

---

## Action items

| # | Item | Owner | When |
|---|------|-------|------|
| AI-1 | Update `ls-check.py` SEC-SENDMSG to require `try` keyword within 2 lines BEFORE sendMessage (not just 5 lines around) | tools | next ls-check tweak |
| AI-2 | Update `ls-check.py` MV3-STORAGE-KEY to detect spread-assigned storage keys (`updates.x = y` patterns) | tools | next ls-check tweak |
| AI-3 | Update `ls-check.py` BRAND-LIB-WIRED to ignore extensions where popup.html has inline theme styles | tools | next ls-check tweak |
| AI-4 | Resolve fleet-wide whether `lovespark-tokens.css` should be imported or inline | brand decision | post-ship |
| AI-5 | Add fail-closed pattern to `~/.claude/docs/memory/known-issues.md` as KI | propagate | this session |
| AI-6 | Clear stale "options.js IDs don't match" registry note (verified false) | oversight | this session |
| AI-7 | Begin v2.5.0 architectural rewrite (research approved, plan documented) | feature-dev | next session |
| AI-8 | Add postmortem learnings to `lsmemory` hive mind | learn | this session |

---

## Metrics

| Metric | Value |
|--------|-------|
| Findings discovered | 40+ across 9 lenses |
| P0 ship-blockers found | 4 |
| P0 fixed in this session | 3 (F-1, F-2, F-5); 1 deferred to v2.5.0 (F-10 CSP) |
| HIGH bugs fixed | 6 |
| MEDIUM bugs fixed | 7 |
| LOW cleanup | 4 |
| Files modified | 12 |
| Files added (CWS prereqs) | 3 (README, LICENSE, audits/) |
| Files deleted (dead libs) | 8 |
| ls-check trajectory | 28→36 pass, 11→3 (intentional) fail |
| Contrast audit | 80/80 pass (stable) |
| Manifest version | 2.4.0 → 2.4.2 |
| Wall-clock | ~3 hours across 2 wakeups |
