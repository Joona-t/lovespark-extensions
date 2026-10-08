# Are You Cooked? — Research Notes

This file grounds every product decision in cited literature. Each finding ties
to a Tier 2 / Tier 3 feature; nothing in the extension claims a property that
isn't either obvious from the code (tab count) or backed by one of these
sources.

## What "cookedness" actually measures (today)

In v2.1.36 the extension measures **tab pressure** as a proxy for cognitive
overspill. It is not a clinical burnout instrument. The `Are You Cooked?` brand
points at a richer construct that the Tier 3 roadmap will earn.

## Cited literature

### 1. Attention residue — Leroy (2009)

Leroy, S. (2009). *Why is it so hard to do my work? The challenge of attention
residue when switching between work tasks*. **Organizational Behavior and
Human Decision Processes**, 109(2), 168–181.
DOI: [10.1016/j.obhdp.2009.04.002](https://doi.org/10.1016/j.obhdp.2009.04.002)

- Switching with incomplete prior tasks leaves "attention residue" that lingers
  for tens of minutes.
- Productivity cost on subsequent tasks is substantial; downstream studies put
  the effective overhead at up to ~40% under high time pressure.
- **Used by AYC:** Tier 2.3 (tab-churn rate) and Tier 3.1 (cookedness index)
  treat *rate of tab creation* as a residue proxy, on top of raw count.

### 2. Doomscrolling and mood — Satici et al. (2023)

Satici, S. A., Gocet Tekin, E., Deniz, M. E., & Satici, B. (2023).
*Doomscrolling Scale: its association with personality traits, psychological
distress, social media use, and wellbeing*. **Applied Research in Quality of
Life**.
PMC: [9580444](https://pmc.ncbi.nlm.nih.gov/articles/PMC9580444/)

- Doomscrolling scores correlate with anxiety, depression, and reduced life
  satisfaction; mediated by secondary traumatic stress and lowered mindfulness.
- Effects are dose-dependent and time-shifted, with strongest mood decay in
  late evening / overnight clusters.
- **Used by AYC:** Tier 2.4 (after-22:00 threshold drop) — we don't measure
  mood directly; we lower the bar for nudging when timing is highest-risk.

### 3. ADHD and short-form video — short-form video study (2022)

Wang, X. et al. (2022). *Short-Form Video Use and ADHD-related Symptoms in
College Students.*
PMC: [9659797](https://pmc.ncbi.nlm.nih.gov/articles/PMC9659797/)

- Heavy TikTok / Reels exposure correlates with ADHD-like symptom worsening
  in college cohorts.
- Mechanism implicates phasic dopamine spikes from algorithmic novelty,
  desensitising baseline reward systems already vulnerable in ADHD.
- **Used by AYC:** Tier 3.4 (optional content-script doomscroll dwell on
  TikTok / Reels / Shorts). Requires host permissions and a fresh permission
  audit before shipping; explicitly *not* in v2.1.36.

### 4. Just-in-time adaptive interventions — Nahum-Shani et al. (2018)

Nahum-Shani, I., Smith, S. N., Spring, B. J., Collins, L. M., Witkiewitz, K.,
Tewari, A., & Murphy, S. A. (2018). *Just-in-Time Adaptive Interventions
(JITAIs) in Mobile Health: Key Components and Design Principles for Ongoing
Health Behavior Support*. **Annals of Behavioral Medicine**, 52(6), 446–462.
DOI: [10.1007/s12160-016-9830-8](https://doi.org/10.1007/s12160-016-9830-8)

- A JITAI is defined by six elements: distal/proximal outcomes, tailoring
  variables, decision points, decision rules, intervention options.
- Effective JITAIs minimise false positives, preserve user dismissal, and
  vary tone to fight nudge fatigue.
- **Used by AYC:** Tier 3.1 decision rule will require **≥3 signals crossing
  threshold simultaneously** before firing the cooked alert. Tier 2.5 (copy
  variation by hour) directly applies the "vary tone" finding.

### 5. Scroll immersion structural model — ScienceDirect (2025)

Structural-equation model of scroll behaviour and cognitive outcomes.
[ScienceDirect S0001691825009874](https://www.sciencedirect.com/science/article/pii/S0001691825009874)

- "Scroll immersion" — habitual, unintentional engagement — predicts attention
  deficits, memory disruption, and fatigue more strongly than session
  duration alone.
- Dwell-time decay > scroll velocity > raw duration in explanatory power.
- **Used by AYC:** Tier 3.1 weighting — when we can observe scroll behaviour
  (post-Tier 3.4), dwell decay is the highest-leverage feature, followed by
  velocity, then duration.

### 6. Micro-break recovery — Albulescu et al. (2022)

Albulescu, P., Macsinga, I., Rusu, A., Sulea, C., Bodnaru, A., & Tulbure, B. T.
(2022). *"Give me a break!" A systematic review and meta-analysis on the
efficacy of micro-breaks for increasing well-being and performance*.
**PLOS ONE**, 17(8), e0272460.
DOI: [10.1371/journal.pone.0272460](https://doi.org/10.1371/journal.pone.0272460)

- Pooled effect of micro-breaks on vigour: *d* ≈ 0.36 (p < .001).
- Pooled effect on fatigue: *d* ≈ 0.35 (p < .001).
- Performance recovery for cognitively demanding tasks may require >10 min;
  micro-breaks reliably restore well-being.
- **Used by AYC:** the Mindful path closes a tab and surfaces a calm copy
  variant. Tier 3 will pair this with a 2-3 minute breath / nature prompt
  rather than a generic "rest" suggestion.

### 7. Maslach Burnout Inventory — Maslach & Leiter

Maslach, C., & Leiter, M. P. *The Maslach Burnout Inventory Manual* (Mind
Garden). Standard reference for the three-factor burnout structure:
exhaustion, cynicism / depersonalisation, reduced personal accomplishment.

- **Used by AYC:** an honesty constraint. Tab clutter is at best an
  *exhaustion proxy*; it cannot diagnose burnout. The CWS listing copy must
  not claim burnout detection until at least Tier 3.1 ships and even then
  only with appropriate hedging.

### 8. WCAG 2.1 — motion and keyboard accessibility

W3C Web Content Accessibility Guidelines 2.1. SC 2.3.3 (Animation from
Interactions) and SC 2.1.1 (Keyboard).
[https://www.w3.org/TR/WCAG21/](https://www.w3.org/TR/WCAG21/)

- Animations triggered by interaction must respect
  `prefers-reduced-motion: reduce`.
- All functionality must be operable through a keyboard interface.
- **Used by AYC:** popup.css and warning.css already gate animations on
  `prefers-reduced-motion`. v2.1.36 closes the keyboard gap on warning.html
  by adding ESC support, initial focus, and `role="dialog"` semantics.

## Highest-leverage signals to track (post-v2.1.36 ranking)

| # | Signal | Strongest source | Status in extension |
|---|---|---|---|
| 1 | Tab-churn rate (open + close cadence) | Leroy 2009 | **planned** Tier 2.3 |
| 2 | Late-night clustering (>50% activity 22:00–03:00) | Satici 2023 | **planned** Tier 2.4 |
| 3 | Short-form video dwell (TikTok / Reels / Shorts) | PMC9659797 | **planned** Tier 3.4 |
| 4 | Combined ≥3-signal decision rule | Nahum-Shani 2018 | **planned** Tier 3.1 |
| 5 | Scroll dwell decay slope | SEM 2025 | **planned** Tier 3.1 (after 3.4) |

Tab count alone is signal #0 — already shipping, lowest leverage of the set,
strongest false-positive rate.

## Honest framing for the CWS listing

> *Are You Cooked?* shows you when your tab pile is getting out of hand and
> nudges you, gently or assertively, depending on how cooked you're getting.
> Designed for ADHD and neurodivergent brains: zero data collection,
> zero accounts, zero ads, free forever.

Avoid in copy: "burnout detection", "measures dopamine debt", "knows when
you're overstimulated", "tracks attention". Those are Tier 3 promises and
must wait for Tier 3.1 to ship and a fresh research review.
