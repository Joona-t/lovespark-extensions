"""phone-charm cursor pack. Edit THIS file; run `python3 gen_cursors.py --only phone-charm`.

v1.1.40 legibility rebuild: every shape (big star, dangling charm, chain, sparkle,
busy dots) sits on a white halo under a dark outline, so the pack reads at native
32px on white, pastel-pink AND dark pages. Companions hug the arrow/hand body
(≤2 per cursor, ≥4px tall). Rest pose is first AND last keyframe everywhere.
"""
from cursor_lib import *
from cursor_lib import _HAND

CHAIN = "#7A4A6A"      # dark metal chain tone (was #C8CCD2 — vanished on white)
INK = "#A8408A"        # pack outline (pink-leaning dark, ≥0.6 stroke everywhere)
JELLY = "#FFB8D9"
HOT = "#FF3D8A"

_STAR = [(0.0, -1.0), (0.247, -0.34), (0.951, -0.31), (0.4, 0.13), (0.588, 0.81),
         (0.0, 0.42), (-0.588, 0.81), (-0.4, 0.13), (-0.951, -0.31), (-0.247, -0.34)]


def _star_d(cx, cy, r):
    return "M " + " L ".join(f"{cx+px*r:.2f} {cy+py*r:.2f}" for px, py in _STAR) + " Z"


def _jelly_star(cx, cy, r, fill=JELLY, stroke=INK, sw=0.8, halo_w=2.6):
    """Haloed + outlined jelly star with hot-pink core and a gloss highlight."""
    return (
        halo(_star_d(cx, cy, r), halo_w)
        + f'<path d="{_star_d(cx, cy, r)}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round"/>'
        + f'<path d="{_star_d(cx, cy + r*0.06, r*0.55)}" fill="{HOT}" opacity="0.85"/>'
        + f'<ellipse cx="{cx - r*0.32:.2f}" cy="{cy - r*0.22:.2f}" rx="{r*0.15:.2f}" ry="{r*0.22:.2f}" fill="#FFFFFF" opacity="0.7"/>'
    )


def _chm_charm(x, y, scale=1.0, delay="0s"):
    """Dangling jelly-star phone charm: chain + ring + star, swinging ±10° about
    the chain anchor at local (0,0). Height = 10*scale px (scale ≥0.6 → ≥6px).
    Rest pose (0°) is the first AND last keyframe (Firefox static-safe)."""
    s = scale
    cy = 6.6 * s
    r = 3.3 * s
    d = _star_d(0, cy, r)
    swing = anim_rotate("0 0 0; 10 0 0; 0 0 0; -10 0 0; 0 0 0", "1.4s", delay)
    chain = f'M0,0 L0,{1.8*s:.2f}'
    return (
        f'<g transform="translate({x} {y})">'
        f'<g>{swing}'
        # halos (white, under everything)
        f'<path d="{chain}" stroke="#FFFFFF" stroke-width="2.4" stroke-linecap="round" opacity="0.92"/>'
        f'<circle cx="0" cy="{2.6*s:.2f}" r="{0.9*s:.2f}" fill="none" stroke="#FFFFFF" stroke-width="2.4" opacity="0.92"/>'
        f'{halo(d, 2.2)}'
        # ink
        f'<path d="{chain}" stroke="{CHAIN}" stroke-width="{max(0.8, 0.8*s):.2f}" stroke-linecap="round"/>'
        f'<circle cx="0" cy="{2.6*s:.2f}" r="{0.9*s:.2f}" fill="none" stroke="{CHAIN}" stroke-width="{max(0.7, 0.7*s):.2f}"/>'
        f'<path d="{d}" fill="{JELLY}" stroke="{INK}" stroke-width="0.65" stroke-linejoin="round"/>'
        f'<path d="{_star_d(0, cy + r*0.06, r*0.52)}" fill="{HOT}" opacity="0.85"/>'
        f'<ellipse cx="{-1.0*s:.2f}" cy="{5.6*s:.2f}" rx="{0.5*s:.2f}" ry="{0.75*s:.2f}" fill="#FFFFFF" opacity="0.7"/>'
        '</g></g>'
    )


def _chm_sparkle(x, y, scale=1.0, delay="0s"):
    """Four-point jelly sparkle (height 4.8*scale) with a gentle twinkle-pop
    (scale 1→1.25→1, opacity 0.75→1→0.75). Rest pose first and last."""
    s = scale
    a, b = 2.4 * s, 0.6 * s
    d = (f"M 0 {-a:.2f} L {b:.2f} {-b:.2f} L {a:.2f} 0 L {b:.2f} {b:.2f} "
         f"L 0 {a:.2f} L {-b:.2f} {b:.2f} L {-a:.2f} 0 L {-b:.2f} {-b:.2f} Z")
    pop = anim_scale("1 1; 1.25 1.25; 1 1", "1.2s", delay)
    tw = anim_opacity("0.75;1;0.75", "1.2s", delay)
    return (
        f'<g transform="translate({x} {y})">'
        f'<g>{pop}{tw}'
        f'{halo(d, 2.0)}'
        f'<path d="{d}" fill="{JELLY}" stroke="{INK}" stroke-width="0.6" stroke-linejoin="round"/>'
        f'<circle cx="0" cy="0" r="{0.65*s:.2f}" fill="{HOT}"/>'
        '</g></g>'
    )


def _chain_top(x, y1, y2, ring_r=1.7, sw=1.0):
    """Vertical chain strap ending in a ring link, haloed + dark."""
    ry = y2 + ring_r
    return (
        f'<path d="M{x},{y1} L{x},{y2}" stroke="#FFFFFF" stroke-width="{sw+2.2:.2f}" stroke-linecap="round" opacity="0.92"/>'
        f'<circle cx="{x}" cy="{ry:.2f}" r="{ring_r}" fill="none" stroke="#FFFFFF" stroke-width="{sw+2.2:.2f}" opacity="0.92"/>'
        f'<path d="M{x},{y1} L{x},{y2}" stroke="{CHAIN}" stroke-width="{sw}" stroke-linecap="round"/>'
        f'<circle cx="{x}" cy="{ry:.2f}" r="{ring_r}" fill="none" stroke="{CHAIN}" stroke-width="{sw}"/>'
    )


def _mini_hand(x, y, s=0.55):
    """Scaled-down pointer hand (same silhouette as the pointer variant) used as
    the 'clickable' cue in the emoji pointer cursor. Finger tip lands at
    (x + 11.5*s, y + 2*s)."""
    rects = "".join(
        f'<rect x="{rx}" y="{ry}" width="{w}" height="{h}" rx="{r}" '
        f'fill="#FFFFFF" stroke="#FFFFFF" stroke-width="{2.6/s:.2f}" opacity="0.92"/>'
        for rx, ry, w, h, r in _HAND
    ) + "".join(
        f'<rect x="{rx}" y="{ry}" width="{w}" height="{h}" rx="{r}" '
        f'fill="url(#chm_hand)" stroke="{INK}" stroke-width="{1.0/s:.2f}"/>'
        for rx, ry, w, h, r in _HAND
    )
    return f'<g transform="translate({x} {y}) scale({s})">{rects}</g>'


def gen_phone_charm():
    """Phone Charm (폰꽂이) — Y2K jelly star dangling from a chain link."""
    defs = lin("chm_d", [(0, "#FFD0E4"), (100, "#FF8AB8")])
    hand_defs = defs + lin("chm_hand", [(0, "#FFE8F4"), (100, "#FFB8D5")])

    # ── Emoji default: big charm (strap + ring + star), centered on hotspot 16,16
    e_def = svg(
        '<g>' + anim_rotate("0 16 4; 4 16 4; 0 16 4; -4 16 4; 0 16 4", "2.2s")
        + _jelly_star(16, 19.5, 10.5, fill="url(#chm_d)", sw=0.9, halo_w=2.8)
        + '</g>'
        + _chain_top(16, 2.5, 6, ring_r=1.8, sw=1.1)
        + _chm_sparkle(27.5, 10.5, scale=0.9, delay="0s")
        + _chm_sparkle(5, 12, scale=0.85, delay="0.5s"),
        defs,
    )

    # ── Emoji pointer: HAND first (hs 0.9, finger tip at 15.5,12 = fleet hotspot), star
    # charm dangling beside the knuckles (star top y=18.1 → top 6px of the finger clear).
    hs = 0.9
    e_ptr = svg(
        _mini_hand(round(15.5 - 11.5 * hs, 2), round(12.0 - 2 * hs, 2), s=hs)
        + '<g>' + anim_rotate("0 25 12; 5 25 12; 0 25 12; -5 25 12; 0 25 12", "2.2s")
        + _jelly_star(25, 23.6, 5.5, fill="url(#chm_d)", sw=0.8)
        + '</g>'
        + _chain_top(25, 12, 14.6, ring_r=1.1, sw=0.9)
        + _chm_sparkle(5.5, 27, scale=0.85, delay="0.3s"),
        hand_defs,
    )

    # ── Emoji wait: star charm inside a spinning ring of 3 busy dots (static-visible)
    dots = "".join(
        f'<g transform="rotate({a} 16 16)">'
        f'<circle cx="16" cy="3.2" r="2.5" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="2.2" opacity="0.92"/>'
        f'<circle cx="16" cy="3.2" r="2.5" fill="{c}" stroke="{INK}" stroke-width="0.75"/>'
        f'</g>'
        for a, c in ((0, HOT), (120, JELLY), (240, "#FFE0EE"))
    )
    e_wait = svg(
        f'<circle cx="16" cy="16" r="12.8" fill="none" stroke="#FFFFFF" stroke-width="3.2" opacity="0.92" stroke-dasharray="5 3.5" stroke-linecap="round"/>'
        f'<circle cx="16" cy="16" r="12.8" fill="none" stroke="{INK}" stroke-width="1.6" stroke-dasharray="5 3.5" stroke-linecap="round"/>'
        + f'<g>{SPIN}{dots}</g>'
        + _jelly_star(16, 18.6, 7.4, fill="url(#chm_d)", sw=0.8)
        + _chain_top(16, 7.5, 9, ring_r=1.3, sw=0.9),
        defs,
    )

    txt = ibeam(HOT)

    # ── Pointer default: haloed arrow + charm dangling beside the shaft + sparkle
    p_defs = lin("chm_pt", [(0, "#FFD0E4"), (100, "#FF8AB8")])
    p_def = svg(
        arrow("url(#chm_pt)")
        + _chm_charm(23.5, 6, scale=1.15, delay="0s")
        + _chm_sparkle(22.5, 22.5, scale=0.85, delay="0.4s"),
        p_defs,
    )

    # ── Pointer pointer: haloed hand + charm hanging by the knuckles + sparkle
    p_ptr = hand_grad(
        "chm_pt", p_defs, INK,
        extra=_chm_charm(27, 3.5, scale=0.95, delay="0s")
        + _chm_sparkle(26.5, 20, scale=0.85, delay="0.5s"),
    )

    p_wait = e_wait
    write_pack("phone-charm", e_def, e_ptr, txt, e_wait, p_def, p_ptr, txt, p_wait)


generate = gen_phone_charm
