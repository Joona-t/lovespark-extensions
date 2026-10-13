"""coquette-ribbon cursor pack. Edit THIS file; run `python3 gen_cursors.py --only coquette-ribbon`.

Design notes (v2 redesign):
  * Every shape = white halo UNDER a dark-outlined fill, so satin pink + pearl
    read on white, pastel-pink and dark pages at native 32px.
  * Companions (max 2 per cursor) hug the arrow/hand body; ribbon tails flutter
    and pearls bob by <=1.5px, rest pose first + last in every values list.
  * Emoji pointer = a small pointing hand with a ribbon tied around the finger
    (ribbon tied at the wrist, finger tip clear) so it still reads as clickable.
  * Wait = bow at the hotspot inside a rotating pearl ring (busy cue visible
    even in the static Firefox frame).
"""
from cursor_lib import *
from cursor_lib import _HAND

INK = OUTLINE            # dark plum outline shared with arrow/hand
SATIN = "#FFB8CC"        # loop + tail fill
KNOT = "#FF6E96"         # knot / accent
PEARL_EDGE = "#D898B4"   # pearl rim so the gradient never sits pale-on-page


def _defs():
    return (rad("coq_prl", [(0, "#FFFFFF"), (45, "#FFE6EF"), (100, PEARL_EDGE)], cx=32, cy=30, r=65)
            + lin("coq_pt", [(0, "#FFEEF4"), (100, "#F4B8CE")], x1=0, y1=0, x2=100, y2=100)
            + lin("coq_satin", [(0, "#FFD2DF"), (100, "#FF9FBC")], x1=0, y1=0, x2=30, y2=100))


# Bow geometry in local units; knot at (0,0). Spans x -7..7, y -3.6..6.
_LOOP_L = "M0,0 C-2.2,-4.2 -7,-3.8 -7,0 C-7,3.6 -2.2,4 0,0 Z"
_LOOP_R = "M0,0 C2.2,-4.2 7,-3.8 7,0 C7,3.6 2.2,4 0,0 Z"
_TAIL_L = "M-0.6,1.4 L-3.2,6 L-1.2,5 L0.4,2.2 Z"
_TAIL_R = "M0.6,1.4 L3.2,6 L1.2,5 L-0.4,2.2 Z"


def _bow(x, y, s=1.0, delay="0s", sw=0.6, flutter=True, bob=True):
    """Satin bow with halo + outline. Tails flutter +-6deg about the knot and the
    whole bow bobs <=1px. Height at s=1 is ~9.6px (>=4px companion rule at s>=0.5)."""
    hw = 2.4 / s                         # keep halo ~2.4px on screen after scaling
    ow = sw / s if s < 1 else sw         # keep outline >=0.6px on screen
    def part(d, fill, extra=""):
        return f'<path d="{d}" fill="{fill}" stroke="{INK}" stroke-width="{ow:.2f}" stroke-linejoin="round" {extra}/>'
    fl = fr = ""
    if flutter:
        fl = anim_rotate("0 0 0; -6 0 0; 0 0 0; 5 0 0; 0 0 0", "1.4s", delay)
        fr = anim_rotate("0 0 0; 6 0 0; 0 0 0; -5 0 0; 0 0 0", "1.4s", delay)
    body = (
        f'<g transform="translate({x} {y}) scale({s})">'
        + (f'<g>{anim_translate("0 0; 0 -0.8; 0 0", "2s", delay)}' if bob else '<g>')
        + halo(_TAIL_L + _TAIL_R + _LOOP_L + _LOOP_R, hw)
        + f'<g>{fl}{part(_TAIL_L, SATIN)}</g>'
        + f'<g>{fr}{part(_TAIL_R, SATIN)}</g>'
        + part(_LOOP_L, "url(#coq_satin)") + part(_LOOP_R, "url(#coq_satin)")
        + '<ellipse cx="-4" cy="-1.3" rx="1.3" ry="0.7" fill="#FFFFFF" opacity="0.7"/>'
        + '<ellipse cx="4" cy="-1.3" rx="1.3" ry="0.7" fill="#FFFFFF" opacity="0.7"/>'
        + f'<ellipse cx="0" cy="0.2" rx="1.5" ry="1.9" fill="{KNOT}" stroke="{INK}" stroke-width="{ow:.2f}"/>'
        + '</g></g>'
    )
    return body


def _pearl(x, y, r=2.0, delay="0s", bob=True):
    """Pearl with halo ring + dark rim + highlight; bobs <=1.2px."""
    anim = anim_translate("0 0; 0 -1.2; 0 0", "1.6s", delay) if bob else ""
    return (
        f'<g transform="translate({x} {y})"><g>{anim}'
        f'<circle r="{r}" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="2.2" opacity="0.92"/>'
        f'<circle r="{r}" fill="url(#coq_prl)" stroke="{INK}" stroke-width="0.6"/>'
        f'<ellipse cx="{-0.35*r:.2f}" cy="{-0.4*r:.2f}" rx="{0.3*r:.2f}" ry="{0.4*r:.2f}" fill="#FFFFFF" opacity="0.85"/>'
        '</g></g>'
    )


def _thread(x1, y1, x2, y2):
    return (f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="#FFFFFF" stroke-width="2.2" opacity="0.9" stroke-linecap="round"/>'
            f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" stroke="{INK}" stroke-width="0.8" stroke-linecap="round"/>')


def _mini_hand(x, y, s):
    """Pointing hand (shared _HAND template) scaled down, halo + outline kept ~1px on screen."""
    ow = 1.0 / s
    hw = 2.4 / s
    rects = "".join(
        f'<rect x="{rx}" y="{ry}" width="{w}" height="{h}" rx="{r}" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="{hw:.2f}" opacity="0.92"/>'
        for rx, ry, w, h, r in _HAND
    ) + "".join(
        f'<rect x="{rx}" y="{ry}" width="{w}" height="{h}" rx="{r}" fill="url(#coq_pt)" stroke="{INK}" stroke-width="{ow:.2f}"/>'
        for rx, ry, w, h, r in _HAND
    )
    return f'<g transform="translate({x} {y}) scale({s})">{rects}</g>'


def _busy_ring():
    """Centered bow with a rotating ring of 3 pearls — reads as busy even static."""
    ring = (
        '<circle cx="16" cy="16" r="11" fill="none" stroke="#FFFFFF" stroke-width="3.2" opacity="0.9" stroke-dasharray="4.5 3.2" stroke-linecap="round"/>'
        f'<circle cx="16" cy="16" r="11" fill="none" stroke="{INK}" stroke-width="1.6" stroke-dasharray="4.5 3.2" stroke-linecap="round"/>'
    )
    pearls = "".join(_pearl(16 + 11 * dx, 16 + 11 * dy, r=2.2, bob=False)
                     for dx, dy in ((0, -1), (0.866, 0.5), (-0.866, 0.5)))
    return (f'<g>{SPIN}{ring}{pearls}</g>'
            + _bow(16, 15.5, s=1.1, delay="0s", bob=False))


def gen_coquette_ribbon():
    """Coquette Ribbon (리본) — pink satin bow + pearls."""
    defs = _defs()

    # Emoji default: big bow at the hotspot, pearl pendant below on a thread.
    e_def = svg(
        _thread(16, 15, 16, 22)
        + _bow(16, 12.5, s=1.6, delay="0s", sw=0.6)
        + _pearl(16, 25, r=3.0, delay="0.3s"),
        defs,
    )
    # Emoji pointer: mini pointing hand (hs 0.9, finger tip at 15.5,12 = fleet hotspot) with the
    # bow tied at the knuckles (bow top y≈18.1 → top 6px of the finger clear).
    hs = 0.9
    e_ptr = svg(
        _mini_hand(round(15.5 - 11.5 * hs, 2), round(12.0 - 2 * hs, 2), hs)
        + _bow(25, 21.2, s=0.85, delay="0s", bob=False)
        + _pearl(27, 10, r=1.9, delay="0.2s"),
        defs,
    )
    e_wait = svg(_busy_ring(), defs)
    txt = ibeam(KNOT)

    # Pointer default: standard halo'd arrow; bow hugs the arrow's lower right, pearl at its shoulder.
    p_def = svg(
        arrow("url(#coq_pt)")
        + _bow(23, 23.5, s=1.0, delay="0s")
        + _pearl(23, 11, r=2.0, delay="0.25s"),
        defs,
    )
    p_ptr = hand_grad(
        "coq_pt", defs, INK,
        extra=_pearl(27, 9, r=1.9, delay="0s")
        + _bow(25.5, 24, s=0.75, delay="0.2s"),
    )
    p_wait = svg(_busy_ring(), defs)
    write_pack("coquette-ribbon", e_def, e_ptr, txt, e_wait, p_def, p_ptr, txt, p_wait)


generate = gen_coquette_ribbon
