"""glossy-pearl cursor pack. Edit THIS file; run `python3 gen_cursors.py --only glossy-pearl`.

v1.1.42 SOTA pass (3 looked-at iterations): bigger mini hand that fits the
box with the pearl perched beside the fingertip, sparkles that survive
rasterization, iridescent rim arc on every hero pearl.

v1.1.40 legibility pass: every pearl carries a white halo UNDER a dark
lilac outline (PRL_INK, >=0.6px) so the pale iridescent fill never sits
directly on the page; companions hug the arrow/hand (<=2 per cursor, >=4px
tall) instead of floating in corners; emoji pointer = pearl held on a
finger; wait = pearl with an orbiting-dot busy ring visible at rest.
"""
from cursor_lib import *
from cursor_lib import _HAND  # underscore name is skipped by import *

PRL_INK = "#5E4A72"   # pack-matching dark lilac outline (same weight as OUTLINE)


def _prl_defs():
    """Shared gradients. All ids prefixed prl_."""
    return (
        rad("prl_d", [(0, "#FFFFFF"), (30, "#FFE8F4"), (65, "#DCB8EA"), (100, "#A080C4")], cx=35, cy=30, r=60)
        + rad("prl_c", [(0, "#FFFFFF"), (40, "#EEDAF6"), (100, "#AC8CCC")], cx=35, cy=30, r=60)
        + lin("prl_w", [(0, "#FFD8F0"), (33, "#D5B8E8"), (66, "#B8D5E8"), (100, "#FFE0E8")], x1=0, y1=0, x2=100, y2=100)
        + lin("prl_pt", [(0, "#FFF0F8"), (40, "#E8D5F4"), (75, "#C8B5E0"), (100, "#9888B5")], x1=0, y1=0, x2=100, y2=100)
        + lin("prl_rim", [(0, "#8FD8F0"), (100, "#FFA8D8")], x1=100, y1=0, x2=0, y2=100)
    )


def _pearl_body(cx, cy, r, gid="prl_d", sw=0.8, halo_w=2.6):
    """Hero pearl: white halo, iridescent fill, dark outline, glossy highlights."""
    return (
        f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="{halo_w}" opacity="0.92"/>'
        f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="url(#{gid})" stroke="{PRL_INK}" stroke-width="{sw}"/>'
        f'<ellipse cx="{cx - 0.38*r:.2f}" cy="{cy - 0.38*r:.2f}" rx="{0.28*r:.2f}" ry="{0.42*r:.2f}" '
        f'fill="#FFFFFF" opacity="0.9"/>'
        # iridescent rim (cyan→pink arc on the lower-right) = the "glossy lip pearl" tell
        f'<path d="M{cx + 0.78*r:.2f},{cy - 0.1*r:.2f} A{0.78*r:.2f},{0.78*r:.2f} 0 0 1 {cx - 0.1*r:.2f},{cy + 0.78*r:.2f}" '
        f'fill="none" stroke="url(#prl_rim)" stroke-width="{max(0.6, 0.11*r):.2f}" stroke-linecap="round" opacity="0.85"/>'
        f'<circle cx="{cx + 0.42*r:.2f}" cy="{cy + 0.42*r:.2f}" r="{0.14*r:.2f}" fill="#FFFFFF" opacity="0.75"/>'
    )


def _prl_pearl(x, y, r=2.6, delay="0s", bob="0 0; 0 -1.5; 0 0"):
    """Companion pearl (>=4px tall): halo + outline + highlight, gentle bob +
    highlight shimmer. Rest pose is first AND last in every values list."""
    return (
        f'<g transform="translate({x} {y})">'
        f'<g>{anim_translate(bob, "1.8s", delay)}'
        f'<circle cx="0" cy="0" r="{r}" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="2.2" opacity="0.92"/>'
        f'<circle cx="0" cy="0" r="{r}" fill="url(#prl_c)" stroke="{PRL_INK}" stroke-width="0.6"/>'
        f'<ellipse cx="{-0.38*r:.2f}" cy="{-0.38*r:.2f}" rx="{0.3*r:.2f}" ry="{0.44*r:.2f}" fill="#FFFFFF" opacity="0.9">'
        f'{anim_opacity("0.9;0.5;0.9", "1.8s", delay)}</ellipse>'
        '</g></g>'
    )


def _sparkle(x, y, s=2.2, delay="0s"):
    """4-point prism sparkle with halo + outline; subtle scale twinkle."""
    d = f"M0,{-s} L{0.42*s:.2f},{-0.42*s:.2f} L{s},0 L{0.42*s:.2f},{0.42*s:.2f} L0,{s} L{-0.42*s:.2f},{0.42*s:.2f} L{-s},0 L{-0.42*s:.2f},{-0.42*s:.2f} Z"
    return (
        f'<g transform="translate({x} {y})">'
        f'<g>{anim_scale("1 1; 1.2 1.2; 1 1", "1.4s", delay)}'
        f'<path d="{d}" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="1.8" stroke-linejoin="round" opacity="0.92"/>'
        f'<path d="{d}" fill="#F3DCFA" stroke="{PRL_INK}" stroke-width="0.6" stroke-linejoin="round"/>'
        '</g></g>'
    )


def gen_glossy_pearl():
    """Glossy Lip Pearl — iridescent pearl bead with prism shimmer."""
    defs = _prl_defs()

    # ── Emoji default: hero pearl (22px) + one hugging pearl + one sparkle ──
    e_def = svg(
        f'<g>{anim_scale("1 1; 1.03 1.03; 1 1", "2.2s")}'
        + _pearl_body(16, 16, 11)
        + f'<circle cx="21.5" cy="12" r="0.8" fill="#FFFFFF">{SHIMMER}</circle>'
        + '</g>'
        + _prl_pearl(26, 24.5, r=2.6, delay="0s")
        + _sparkle(26.5, 6, s=3.2, delay="0.4s"),
        defs,
    )

    # ── Emoji pointer: small hand (hotspot = finger tip 15.5,12) holding the pearl ──
    # Scaled copy of the shared hand template (cursor_lib._HAND); fleet convention
    # hs ≥ 0.9, tip = (tx + 11.5·hs, ty + 2·hs) = (15.5, 12.0).
    hs = 0.9
    tx, ty = 15.5 - 11.5 * hs, 12.0 - 2 * hs
    mini_hand = f'<g transform="translate({tx:.2f} {ty:.2f}) scale({hs})">' + "".join(
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" '
        f'fill="#FFFFFF" stroke="#FFFFFF" stroke-width="3" opacity="0.92"/>'
        for x, y, w, h, r in _HAND
    ) + "".join(
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" '
        f'fill="url(#prl_pt)" stroke="{PRL_INK}" stroke-width="1.25"/>'
        for x, y, w, h, r in _HAND
    ) + '</g>'
    # Pearl held at the knuckles (top edge y=18.5 → the top 6px of the finger stay clear).
    e_ptr = svg(
        mini_hand
        + f'<g>{anim_translate("0 0; 0 -1; 0 0", "1.6s")}'
        + _pearl_body(24.8, 24.5, 6)
        + '</g>'
        + _sparkle(26.5, 11, s=3, delay="0.3s"),
        defs,
    )

    # ── Wait: pearl + orbiting busy ring (3 dots + dashed arc) visible at rest ──
    ring = (
        f'<g>{SPIN}'
        f'<circle cx="16" cy="16" r="12.5" fill="none" stroke="#FFFFFF" stroke-width="3.2" opacity="0.9" stroke-dasharray="7 5.6" stroke-linecap="round"/>'
        f'<circle cx="16" cy="16" r="12.5" fill="none" stroke="{PRL_INK}" stroke-width="1.6" stroke-dasharray="7 5.6" stroke-linecap="round"/>'
        + "".join(
            f'<circle cx="{cx}" cy="{cy}" r="2.3" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="2" opacity="0.92"/>'
            f'<circle cx="{cx}" cy="{cy}" r="2.3" fill="url(#prl_c)" stroke="{PRL_INK}" stroke-width="0.7"/>'
            for cx, cy in ((16, 3.5), (27.3, 22.3), (4.7, 22.3))
        )
        + '</g>'
    )
    wait = svg(
        ring
        + _pearl_body(16, 16, 7.5, gid="prl_w")
        + f'<circle cx="19.5" cy="13" r="0.7" fill="#FFFFFF">{SHIMMER}</circle>',
        defs,
    )

    txt = ibeam("#8E6FC4", outline=PRL_INK)   # ≥3:1 on #FFE4EC (was #B39BD6 @ 2.05:1)

    # ── Pointer default: standard arrow (halo+outline, tip 5,4) + 2 hugging pearls ──
    p_def = svg(
        arrow("url(#prl_pt)", stroke=PRL_INK)
        + _prl_pearl(22.5, 9.5, r=2.8, delay="0s")
        + _prl_pearl(24, 18.5, r=2.3, delay="0.5s", bob="0 0; 0 -1.2; 0 0"),
        defs,
    )

    # ── Pointer pointer: hand (finger tip 11.5,2 clear) + 2 pearls on the right ──
    p_ptr = hand_grad(
        "prl_pt", defs, PRL_INK,
        extra=_prl_pearl(26.5, 8.5, r=2.6, delay="0s")
        + _prl_pearl(27, 17.5, r=2.2, delay="0.5s", bob="0 0; 0 -1.2; 0 0"),
    )

    write_pack("glossy-pearl", e_def, e_ptr, txt, wait, p_def, p_ptr, txt, wait)


generate = gen_glossy_pearl
