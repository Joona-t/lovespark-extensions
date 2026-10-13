"""heart-locket cursor pack. Edit THIS file; run `python3 gen_cursors.py --only heart-locket`.

v1.1.40 SOTA pass: every shape carries a white halo + dark outline, companions hug
the arrow/hand (<=2, >=4px, <=3px travel), pointer default uses arrow() so the tip
at (5,4) is crisp, emoji pointer = locket charm sitting on a mini pointing finger,
wait = locket inside an orbiting-dot ring that reads as "busy" even when frozen.
"""
from cursor_lib import *
from cursor_lib import _HAND

INK = "#A04A6E"      # pack-matching detail tone (seam, chain)
ACCENT = "#E84A85"   # i-beam / dot accent


def _loc_heart_path(s):
    """Heart outline (~4x4.1 units at s=1), local origin at the notch between the lobes."""
    return (f'M 0 {0.6*s:.2f} C {-0.6*s:.2f} {-0.9*s:.2f}, {-2*s:.2f} {-0.7*s:.2f}, {-2*s:.2f} {0.8*s:.2f} '
            f'C {-2*s:.2f} {2.1*s:.2f}, 0 {3.4*s:.2f}, 0 {3.4*s:.2f} '
            f'C 0 {3.4*s:.2f}, {2*s:.2f} {2.1*s:.2f}, {2*s:.2f} {0.8*s:.2f} '
            f'C {2*s:.2f} {-0.7*s:.2f}, {0.6*s:.2f} {-0.9*s:.2f}, 0 {0.6*s:.2f} Z')


def _heart(s, fill, stroke=OUTLINE, sw=0.6, halo_w=2.2):
    """Halo'd + outlined heart at the local origin."""
    d = _loc_heart_path(s)
    return (halo(d, halo_w)
            + f'<path d="{d}" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" stroke-linejoin="round"/>')


def _locket(x, y, s, fill="url(#loc_d)", bail=True, sw=0.7):
    """Silver-rimmed pink heart locket: bail ring + chain stub, seam, clasp, glass highlight.
    Local origin (x,y) = notch between the lobes; heart spans y-0.65s .. y+3.4s."""
    d = _loc_heart_path(s)
    r = 0.4 * s
    out = f'<g transform="translate({x} {y})">'
    if bail:
        cy = -1.12 * s
        out += (f'<circle cx="0" cy="{cy:.2f}" r="{r:.2f}" fill="none" stroke="#FFFFFF" stroke-width="2.4" opacity="0.92"/>'
                f'<circle cx="0" cy="{cy:.2f}" r="{r:.2f}" fill="none" stroke="{OUTLINE}" stroke-width="{0.26*s:.2f}"/>'
                f'<line x1="0" y1="{cy+r:.2f}" x2="0" y2="{-0.4*s:.2f}" stroke="{OUTLINE}" stroke-width="{0.26*s:.2f}"/>')
    out += halo(d, 2.6)
    out += f'<path d="{d}" fill="{fill}" stroke="{OUTLINE}" stroke-width="{sw}" stroke-linejoin="round"/>'
    # seam (locket hinge line) + tiny clasp
    out += (f'<line x1="0" y1="{0.7*s:.2f}" x2="0" y2="{3.1*s:.2f}" stroke="{INK}" stroke-width="{0.16*s:.2f}" opacity="0.7"/>'
            f'<circle cx="0" cy="{1.5*s:.2f}" r="{0.2*s:.2f}" fill="{INK}" opacity="0.8"/>')
    # glass highlight on the left lobe
    out += f'<ellipse cx="{-1.1*s:.2f}" cy="{0.55*s:.2f}" rx="{0.42*s:.2f}" ry="{0.6*s:.2f}" fill="#FFFFFF" opacity="0.75"/>'
    out += '</g>'
    return out


def _float_heart(x, y, s=1.0, delay="0s"):
    """Companion: mini heart drifts up 3px while fading, snaps home invisible, fades back in at rest
    (rest pose is first AND last; the reset never pops)."""
    return (f'<g transform="translate({x} {y})"><g>'
            + anim_translate("0 0; 0 -1; 0 -2; 0 -3; 0 0; 0 0", "1.8s", delay)
            + anim_opacity("1; 0.95; 0.6; 0; 0; 1", "1.8s", delay)
            + _heart(s, "#FF8FA8")
            + f'<circle cx="{-0.8*s:.2f}" cy="{0.5*s:.2f}" r="{0.4*s:.2f}" fill="#FFFFFF" opacity="0.8"/>'
            + '</g></g>')


def _beat_locket(x, y, s=1.4, delay="0s"):
    """Companion: mini locket charm with a two-thump heartbeat (scale pulse, <=0.6px travel)."""
    return (f'<g transform="translate({x} {y})"><g>'
            + anim_scale("1 1; 1.14 1.14; 1 1; 1.08 1.08; 1 1", "1.2s", delay)
            + _locket(0, 0, s, sw=0.6)
            + '</g></g>')


def _busy_ring():
    """Wait cue: thin dashed ring + 4 orbiting dots (one bright, trailing fade) around (16,16).
    Visible as 'loading' even in the frozen rest frame."""
    pts = [(16, 3), (29, 16), (16, 29), (3, 16)]
    ops = ["1", "0.85", "0.65", "0.5"]
    dots = ""
    for (cx, cy), op in zip(pts, ops):
        dots += (f'<circle cx="{cx}" cy="{cy}" r="1.9" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="2" opacity="0.92"/>'
                 f'<circle cx="{cx}" cy="{cy}" r="1.9" fill="{ACCENT}" stroke="{OUTLINE}" stroke-width="0.6" opacity="{op}"/>')
    return (f'<g>{SPIN}'
            '<circle cx="16" cy="16" r="13" fill="none" stroke="#FFFFFF" stroke-width="3.2" opacity="0.9" stroke-dasharray="5 3.5" stroke-linecap="round"/>'
            f'<circle cx="16" cy="16" r="13" fill="none" stroke="{OUTLINE}" stroke-width="1.6" stroke-dasharray="5 3.5" stroke-linecap="round"/>'
            + dots + '</g>')


def gen_heart_locket():
    """Heart Locket (하트 로켓) — silver-rimmed pink heart locket on a chain."""
    defs = lin("loc_d", [(0, "#FFE0EA"), (55, "#FF8FB0"), (100, "#F0547F")])
    p_defs = lin("loc_pt", [(0, "#FFE4EE"), (100, "#FF8FB0")])

    # Emoji default: 22px locket centred on (16,16) + 2 drifting hearts hugging the lobes.
    e_def = svg(
        _locket(16, 11.5, 4.6)
        + _float_heart(5.2, 10.5, s=1.1, delay="0s")
        + _float_heart(27.2, 20.5, s=1.0, delay="0.7s"),
        defs
    )

    # Emoji pointer: shared mini pointing hand (hs 0.9, finger tip at 15.5,12 = fleet hotspot)
    # holding the locket charm at the knuckles (charm top y≈18 → top 6px of the finger clear).
    hs = 0.9
    tx, ty = 15.5 - 11.5 * hs, 12.0 - 2 * hs
    mini_hand = f'<g transform="translate({tx:.2f} {ty:.2f}) scale({hs})">' + "".join(
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="{2.6/hs:.2f}" opacity="0.92"/>'
        for x, y, w, h, r in _HAND
    ) + "".join(
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" fill="url(#loc_pt)" stroke="{OUTLINE}" stroke-width="{1/hs:.2f}"/>'
        for x, y, w, h, r in _HAND
    ) + '</g>'
    e_ptr = svg(
        mini_hand
        + '<g><g>' + anim_translate("0 0; 0 -0.8; 0 0", "1.8s")
        + _locket(25, 20, 2.9, bail=False, sw=0.6)
        + '</g></g>',
        defs + p_defs
    )

    # Wait: locket inside an orbiting-dot ring (busy cue visible when frozen), gentle bob.
    wait = svg(
        _busy_ring()
        + '<g><g>' + anim_translate("0 0; 0 -1.5; 0 0", "1.6s")
        + _locket(16, 12.6, 3.4)
        + '</g></g>',
        defs
    )

    txt = ibeam(ACCENT)

    # Pointer default: standard halo'd arrow; locket charm beats at the arrow's right
    # flank, mini heart drifts off the arrow's lower-right. Tip (5,4) stays clear.
    p_def = svg(
        arrow("url(#loc_pt)")
        + _beat_locket(23.5, 12.5, s=1.6, delay="0s")
        + _float_heart(20.5, 23.5, s=1.0, delay="0.5s"),
        p_defs + defs
    )

    # Hand: charm beats in the free right column, heart drifts beside the palm.
    p_ptr = hand_grad(
        "loc_pt", p_defs + defs, OUTLINE, accent="#FF6E96",
        extra=_beat_locket(27.6, 11.5, s=1.3, delay="0s")
        + _float_heart(3.2, 20.5, s=1.0, delay="0.4s")
    )

    write_pack("heart-locket", e_def, e_ptr, txt, wait, p_def, p_ptr, txt, wait)


generate = gen_heart_locket
