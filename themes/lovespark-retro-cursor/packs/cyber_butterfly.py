"""cyber-butterfly cursor pack. Edit THIS file; run `python3 gen_cursors.py --only cyber-butterfly`.

v1.1.41 redesign — Y2K "cyber" butterfly: real wing silhouettes (upper teardrop +
lower lobe, body, antennae) instead of four ellipses, every shape carries a white
halo + dark outline so it reads at native 32px on white / pastel-pink / dark pages,
companions hug the arrow/hand, wait has a visible busy ring even at rest.
"""
from cursor_lib import *
from cursor_lib import _HAND

INK = "#7A2E55"        # pack-matching dark outline (≥0.6 stroke everywhere)
WING = "#FFB8D5"
WING_HI = "#FFE3EF"
ACCENT = "#FF5BAA"
HOLO = "#C9A7FF"       # lilac eyespot — the "cyber" holographic hint
CYAN = "#8FEBFF"
HALO = 'fill="#FFF" stroke="#FFF" opacity=".92" stroke-linejoin="round" stroke-linecap="round"'


PREC = 2


def _n(v):
    """Compact number formatting (keeps SVGs small)."""
    return f"{v:.{PREC}f}".rstrip("0").rstrip(".")


def _butterfly(x, y, scale=1.0, delay="0s", flutter=True, dur="1.1s"):
    """Butterfly centred on (x, y); ~7.7px tall at scale 1 (antenna tip to lower wing).

    Right-wing paths are mirrored with scale(-1 1) for the left wing. Wings sit in a
    group whose additive x-scale pulses 1 → 0.55 → 1 (flutter, ≤3px travel at the
    largest size used); body + antennae don't move. Halo silhouette first, ink after.
    Rest pose (wings open) is FIRST and LAST in every values list.
    """
    global PREC
    s = scale
    PREC = 1 if s < 1.2 else 2   # companions: 1-decimal coords (byte budget)
    sw = _n(max(0.6, 0.55 * s))
    hw = _n(max(1.5, 1.2 * s))
    up = (f'M{_n(0.3*s)} {_n(-0.6*s)}C{_n(1.5*s)} {_n(-3.6*s)} {_n(4.7*s)} {_n(-3.4*s)} {_n(4.3*s)} {_n(-1.1*s)}'
          f'C{_n(4.1*s)} {_n(0.3*s)} {_n(2.2*s)} {_n(0.6*s)} {_n(0.3*s)} {_n(0.2*s)}Z')
    lo = (f'M{_n(0.3*s)} {_n(0.5*s)}C{_n(2.5*s)} {_n(0.3*s)} {_n(3.7*s)} {_n(1.7*s)} {_n(2.9*s)} {_n(3.1*s)}'
          f'C{_n(2.1*s)} {_n(4*s)} {_n(0.6*s)} {_n(3.2*s)} {_n(0.3*s)} {_n(2.2*s)}Z')
    body = f'cx="0" cy="{_n(0.6*s)}" rx="{_n(0.6*s)}" ry="{_n(2.5*s)}"'
    ant = f'M0 {_n(-1.9*s)}L{_n(-1.3*s)} {_n(-3.6*s)}M0 {_n(-1.9*s)}L{_n(1.3*s)} {_n(-3.6*s)}'
    eye = f'cx="{_n(2.6*s)}" cy="{_n(-1.6*s)}" r="{_n(0.75*s)}"'
    small = s < 1.2   # companions: fewer elements (byte budget), same silhouette
    wings_ink = (
        f'<path d="{up}{lo}" fill="{WING}"/>'
        f'<circle {eye} fill="{HOLO}" stroke="none"/>'
        + ('' if small else
           f'<path d="{up}" fill="{ACCENT}" stroke="none" transform="translate({_n(0.2*s)} 0) scale(0.55)"/>'
           f'<circle cx="{_n(2.3*s)}" cy="{_n(-1.9*s)}" r="{_n(0.28*s)}" fill="#FFFFFF" stroke="none"/>')
    )
    detail = '' if small else (
        f'<circle cx="{_n(-1.3*s)}" cy="{_n(-3.6*s)}" r="{_n(0.35*s)}" fill="{INK}" stroke="none"/>'
        f'<circle cx="{_n(1.3*s)}" cy="{_n(-3.6*s)}" r="{_n(0.35*s)}" fill="{INK}" stroke="none"/>'
        f'<ellipse cx="0" cy="{_n(-0.3*s)}" rx="{_n(0.22*s)}" ry="{_n(1.1*s)}" fill="{WING_HI}" stroke="none" opacity="0.7"/>'
    )
    anim = anim_scale("1 1; 0.55 1; 1 1", dur, delay) if flutter else ""
    ink_attrs = f'stroke="{INK}" stroke-width="{sw}" stroke-linejoin="round" stroke-linecap="round"'
    return (
        f'<g transform="translate({x} {y})">'
        # halo for body + antennae (static), then ONE flutter group holding halo wings + ink wings
        f'<g {HALO} stroke-width="{hw}"><path d="{ant}"/><ellipse {body}/></g>'
        f'<g>{anim}<g {HALO} stroke-width="{hw}"><path d="{up}{lo}"/><g transform="scale(-1 1)"><path d="{up}{lo}"/></g></g>'
        f'<g {ink_attrs}>{wings_ink}<g transform="scale(-1 1)">{wings_ink}</g></g></g>'
        # ink body + antennae in front of the wings
        f'<g {ink_attrs}><path d="{ant}" fill="none"/><ellipse {body} fill="{INK}"/>{detail}</g>'
        f'</g>'
    )


def _sparkle(x, y, s=1.0, delay="0s"):
    """4-point cyber sparkle (~5px tall at s=1), halo + outline, gentle twinkle."""
    d = (f'M0 {_n(-2.5*s)}Q{_n(0.5*s)} {_n(-0.5*s)} {_n(2.5*s)} 0Q{_n(0.5*s)} {_n(0.5*s)} 0 {_n(2.5*s)}'
         f'Q{_n(-0.5*s)} {_n(0.5*s)} {_n(-2.5*s)} 0Q{_n(-0.5*s)} {_n(-0.5*s)} 0 {_n(-2.5*s)}Z')
    tw = anim_scale("1 1; 0.78 0.78; 1 1", "1.6s", delay)
    return (f'<g transform="translate({x} {y})"><g>{tw}'
            f'<path d="{d}" {HALO} stroke-width="1.6"/>'
            f'<path d="{d}" fill="{CYAN}" stroke="{INK}" stroke-width="0.6" stroke-linejoin="round"/>'
            f'</g></g>')


def _mini_hand(tx, ty, k):
    """Scaled copy of the shared pointer-hand rects (halo + outline) for the emoji pointer."""
    rects = "".join(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}"/>' for x, y, w, h, r in _HAND)
    return (f'<g transform="translate({tx} {ty}) scale({k})">'
            f'<g fill="#FFFFFF" stroke="#FFFFFF" stroke-width="2.6" opacity="0.92">{rects}</g>'
            f'<g fill="url(#bfly_pt)" stroke="{INK}" stroke-width="1">{rects}</g></g>')


def _busy_ring():
    """Dashed ring + 3 orbiting beads around the centre — visible busy cue even at rest."""
    beads = "".join(
        f'<g transform="rotate({a} 16 16)">'
        f'<circle cx="16" cy="3.2" r="1.7" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="1.4" opacity="0.92"/>'
        f'<circle cx="16" cy="3.2" r="1.7" fill="{c}" stroke="{INK}" stroke-width="0.6"/></g>'
        for a, c in ((0, ACCENT), (120, HOLO), (240, CYAN))
    )
    return (
        '<circle cx="16" cy="16" r="12.8" fill="none" stroke="#FFFFFF" stroke-width="3.2" opacity="0.9" stroke-dasharray="5 3.5" stroke-linecap="round"/>'
        f'<circle cx="16" cy="16" r="12.8" fill="none" stroke="{INK}" stroke-width="1.6" stroke-dasharray="5 3.5" stroke-linecap="round"/>'
        f'<g>{SPIN}{beads}</g>'
    )


def gen_cyber_butterfly():
    """Cyber Butterfly (나비) — holographic pink butterfly with cyan sparkle companions."""
    p_defs = lin("bfly_pt", [(0, "#FFE8F4"), (100, "#FFB8D5")])

    # Emoji default: big butterfly centred on the 16,16 hotspot (~23px tall), one sparkle hugging it.
    e_def = svg(
        _butterfly(16, 16.5, scale=2.9, dur="1.3s")
        + _sparkle(27, 6.5, s=0.9, delay="0.3s"),
    )
    # Emoji pointer: mini pointing hand (hs 0.9, finger tip at 15.5,12 = fleet hotspot) with the
    # butterfly perched at the knuckles (antenna tips y≈18.1 → top 6px of the finger clear).
    hs = 0.9
    e_ptr = svg(
        _mini_hand(round(15.5 - 11.5 * hs, 2), round(12.0 - 2 * hs, 2), hs)
        + _butterfly(24.5, 23.5, scale=1.5, delay="0.2s", dur="1.2s")
        + _sparkle(27.5, 10, s=0.85, delay="0.5s"),
        p_defs,
    )
    # Wait: butterfly inside a dashed ring with 3 orbiting beads (busy cue is static-visible).
    wait = svg(
        _busy_ring()
        + f'<g>{anim_translate("0 0; 0 -1.2; 0 0", "1.6s")}'
        + _butterfly(16, 16.5, scale=2.0, dur="1.2s")
        + '</g>',
    )
    txt = ibeam(ACCENT, INK)

    # Pointer default: standard arrow (halo + outline, crisp tip at 5,4) + 2 butterflies hugging its right edge.
    p_def = svg(
        arrow("url(#bfly_pt)", INK)
        + _butterfly(23, 9.5, scale=1.0, delay="0s")
        + _butterfly(22.5, 25.5, scale=0.9, delay="0.35s"),
        p_defs,
    )
    # Pointer hand: butterfly + sparkle hug the hand's right side (2 butterflies blow the
    # 4096-byte budget: hand 1398 B + 2 × 1535 B); finger tip (11.5,2) stays clear.
    p_ptr = hand_grad(
        "bfly_pt", p_defs, INK,
        extra=_butterfly(27, 7.5, scale=1.0, delay="0s")
        + _sparkle(27.5, 19.5, s=0.9, delay="0.4s"),
    )
    write_pack("cyber-butterfly", e_def, e_ptr, txt, wait, p_def, p_ptr, txt, wait)

# ── Run ────────────────────────────────────────────────────────────────────────


generate = gen_cyber_butterfly
