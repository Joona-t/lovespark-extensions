"""bubble-boba cursor pack. Edit THIS file; run `python3 gen_cursors.py --only bubble-boba`.

v2 (2026-10-13): every shape carries a white halo + dark outline so it reads at
native 32px on white / pastel-pink / dark pages; companions are 2 chunky boba
pearls (one pearl + one bubble) hugging the arrow/hand instead of scattered
specks; the emoji pointer is the cup held on a mini pointing hand; wait is the
cup inside an orbiting pearl ring (busy even in the frozen rest frame).
"""
from cursor_lib import *
from cursor_lib import _HAND

INK = OUTLINE            # #5A2A4A — shared dark outline
PEARL = "#3A2A3A"        # tapioca pearl
LAV = "#C4A8E0"          # lavender accent (milk-tea bottom)
MILK = "#FFD8E5"         # milk-tea top
STRAW = "#FF8FB8"


def _pearl(x, y, r=2.2, delay="0s", dur="1.6s", dy=-2):
    """Companion boba pearl: white halo + dark outline + glint, gentle bob.
    Rest pose first AND last so Firefox's frozen frame is the resting pearl."""
    return (
        f'<g transform="translate({x} {y})"><g>'
        + anim_translate(f"0 0; 0 {dy}; 0 0", dur, delay)
        + f'<circle r="{r + 1.2:.1f}" fill="#FFFFFF" opacity="0.92"/>'
        + f'<circle r="{r}" fill="{PEARL}" stroke="{INK}" stroke-width="0.6"/>'
        + f'<circle cx="{-r * 0.38:.2f}" cy="{-r * 0.38:.2f}" r="{r * 0.3:.2f}" fill="#FFFFFF" opacity="0.75"/>'
        + '</g></g>'
    )


def _bubble(x, y, r=2.3, delay="0s", dur="2.1s", dy=-3):
    """Companion milk-tea bubble: pale fill never touches the page (halo + outline)."""
    return (
        f'<g transform="translate({x} {y})"><g>'
        + anim_translate(f"0 0; 0 {dy}; 0 0", dur, delay)
        + f'<circle r="{r + 1.2:.1f}" fill="#FFFFFF" opacity="0.92"/>'
        + f'<circle r="{r}" fill="url(#bob_bub)" stroke="{INK}" stroke-width="0.7"/>'
        + f'<circle cx="{-r * 0.35:.2f}" cy="{-r * 0.4:.2f}" r="{r * 0.32:.2f}" fill="#FFFFFF" opacity="0.85"/>'
        + '</g></g>'
    )


# Boba cup silhouette, drawn in a 32-unit frame centred on (16,16): straw top y=3, cup bottom y=28.
_CUP_BODY = "M9,10.5 L10.4,26.8 Q10.6,28 11.8,28 L20.2,28 Q21.4,28 21.6,26.8 L23,10.5 Z"
_LID = "M8,8.2 L24,8.2 Q25.2,8.2 25.2,9.4 Q25.2,10.6 24,10.6 L8,10.6 Q6.8,10.6 6.8,9.4 Q6.8,8.2 8,8.2 Z"
_STRAW = "M17.6,3 L20.4,3 L20.4,8.2 L17.6,8.2 Z"


def _cup(animated=True):
    """The themed icon: milk-tea cup with lid, straw, pearls and one rising pearl."""
    rise = (anim_translate("0 0; 0 -2.5; 0 -2.5; 0 0", "2.4s") if animated else "")
    return (
        halo(_STRAW + _LID + _CUP_BODY, 2.8)
        + f'<path d="{_CUP_BODY}" fill="url(#bob_cup)" stroke="{INK}" stroke-width="0.9" stroke-linejoin="round"/>'
        # pearls at the bottom of the cup
        + f'<circle cx="12.6" cy="25.2" r="1.6" fill="{PEARL}"/>'
        + f'<circle cx="16" cy="25.6" r="1.6" fill="{PEARL}"/>'
        + f'<circle cx="19.4" cy="25.2" r="1.6" fill="{PEARL}"/>'
        + f'<circle cx="14.3" cy="22.4" r="1.5" fill="{PEARL}"/>'
        + f'<g><g>{rise}<circle cx="18" cy="22.2" r="1.5" fill="{PEARL}"/></g></g>'
        # glints
        + '<ellipse cx="12.2" cy="15" rx="1" ry="2.6" fill="#FFFFFF" opacity="0.8"/>'
        + f'<path d="{_STRAW}" fill="{STRAW}" stroke="{INK}" stroke-width="0.8" stroke-linejoin="round"/>'
        + f'<path d="{_LID}" fill="url(#bob_lid)" stroke="{INK}" stroke-width="0.9" stroke-linejoin="round"/>'
    )


_DEFS = (lin("bob_cup", [(0, MILK), (55, "#E8C4E8"), (100, LAV)])
         + lin("bob_lid", [(0, "#F4E0FF"), (100, LAV)], 0, 0, 0, 100)
         + rad("bob_bub", [(0, "#FFF4FA"), (100, MILK)], 40, 35, 65)
         + lin("bob_pt", [(0, MILK), (100, LAV)]))


def _mini_hand(tx, ty, s):
    """Scaled copy of the shared hand (halo rects + outlined rects) for the emoji pointer."""
    rects = "".join(
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" '
        f'fill="#FFFFFF" stroke="#FFFFFF" stroke-width="3" opacity="0.92"/>'
        for x, y, w, h, r in _HAND
    ) + "".join(
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" '
        f'fill="url(#bob_pt)" stroke="{INK}" stroke-width="1.3"/>'
        for x, y, w, h, r in _HAND
    )
    return f'<g transform="translate({tx} {ty}) scale({s})">{rects}</g>'


def gen_bubble_boba():
    """Bubble Boba (버블티) — milk-tea cup with tapioca pearls."""
    # ── Emoji variant (hotspot 16,16) ──
    e_def = svg(
        _cup()
        + _pearl(5, 21, r=2.2, delay="0s")
        + _bubble(27.5, 15, r=2.3, delay="0.5s"),
        _DEFS,
    )
    # pointer: mini pointing hand (hs 0.9, finger tip at 15.5,12 = fleet hotspot) holding the
    # cup at the knuckles (cup straw top y=18 → top 6px of the finger clear).
    hs = 0.9
    e_ptr = svg(
        _mini_hand(round(15.5 - 11.5 * hs, 2), round(12.0 - 2 * hs, 2), hs)
        + f'<g transform="translate(17 16.5) scale(0.5)">{_cup()}</g>'
        + _pearl(27, 10, r=2.1, delay="0.3s"),
        _DEFS,
    )
    # wait: small cup inside an orbiting pearl ring — 3 pearls visible even frozen
    ring_pearls = "".join(
        f'<g transform="rotate({a} 16 16)">'
        f'<circle cx="16" cy="3.4" r="3.2" fill="#FFFFFF" opacity="0.92"/>'
        f'<circle cx="16" cy="3.4" r="2.1" fill="{PEARL}" stroke="{INK}" stroke-width="0.6"/>'
        f'<circle cx="15.3" cy="2.7" r="0.6" fill="#FFFFFF" opacity="0.75"/></g>'
        for a in (0, 120, 240)
    )
    e_wait = svg(
        f'<circle cx="16" cy="16" r="12.6" fill="none" stroke="#FFFFFF" stroke-width="3.2" opacity="0.92"/>'
        f'<circle cx="16" cy="16" r="12.6" fill="none" stroke="{INK}" stroke-width="1.6"/>'
        f'<circle cx="16" cy="16" r="12.6" fill="none" stroke="{LAV}" stroke-width="0.7" stroke-dasharray="2.2 1.6"/>'
        + f'<g transform="translate(16 16) scale(0.62) translate(-16 -16)">{_cup()}</g>'
        + f'<g><animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="2s" repeatCount="indefinite"/>{ring_pearls}</g>',
        _DEFS,
    )
    txt = ibeam(LAV)

    # ── Pointer variant (hotspots 5,4 / 11,3) ──
    p_def = svg(
        arrow("url(#bob_pt)")
        + _pearl(21.5, 10.5, r=2.2, delay="0s")
        + _bubble(23.5, 20, r=2.3, delay="0.5s"),
        _DEFS,
    )
    p_ptr = hand_grad(
        "bob_pt", _DEFS, INK,
        extra=_pearl(27, 9.5, r=2.1, delay="0s")
        + _bubble(27.5, 19.5, r=2.2, delay="0.5s"),
    )
    p_wait = e_wait
    write_pack("bubble-boba", e_def, e_ptr, txt, e_wait, p_def, p_ptr, txt, p_wait)


generate = gen_bubble_boba
