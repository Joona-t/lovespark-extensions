"""cyworld-dotti cursor pack. Edit THIS file; run `python3 gen_cursors.py --only cyworld-dotti`.

Cyworld Dotti (싸이월드 도토리) — chrome "Y2K metal" heart with a pink core and
pixel-cross sparkles. Legibility contract (v1.1.42 polish): every shape and
companion sits on a white halo under a dark OUTLINE (>=0.6), companions hug the
arrow/hand (<=2 per cursor, >=4px tall), rest pose is first+last in every SMIL
values list, and emoji-pointer/-wait carry an explicit click/busy cue.
"""
from cursor_lib import *
from cursor_lib import _HAND

PINK = "#FF5BAA"
CHR = "url(#dot_chr)"


def _sparkle(x, y, scale=1.0, delay="0s"):
    """Pixel-cross sparkle (Dotti pixel star): white halo under an OUTLINED pink cross
    with a white centre pixel. 5*scale px tall, 1.3*scale px arms so it survives native
    32px (a pale 1px cross reads as a grey smudge). Twinkles + pops; rest pose first+last."""
    s = scale
    v = f'x="{-0.65*s:.2f}" y="{-2.5*s:.2f}" width="{1.3*s:.2f}" height="{5.0*s:.2f}"'
    h = f'x="{-2.5*s:.2f}" y="{-0.65*s:.2f}" width="{5.0*s:.2f}" height="{1.3*s:.2f}"'
    halo_a = 'fill="#FFFFFF" stroke="#FFFFFF" stroke-width="2.2" opacity="0.92"'
    ink_a = f'fill="#FF8FC6" stroke="{OUTLINE}" stroke-width="0.6"'
    return (
        f'<g transform="translate({x} {y})"><g>'
        + anim_opacity("1;0.7;1", "1.2s", delay)
        + anim_scale("1 1; 1.2 1.2; 1 1", "1.2s", delay)
        + f'<rect {v} {halo_a}/><rect {h} {halo_a}/>'
        + f'<rect {v} {ink_a}/><rect {h} {ink_a}/>'
        + f'<rect x="{-0.55*s:.2f}" y="{-0.55*s:.2f}" width="{1.1*s:.2f}" height="{1.1*s:.2f}" fill="#FFFFFF"/>'
        + '</g></g>'
    )


def _heart_d(cx, cy, s):
    """Chrome heart outline path, ~6.4*s wide x 6.6*s tall, centred near (cx, cy)."""
    f = lambda v: f"{v:.2f}"
    return (f'M {f(cx)} {f(cy-2.0*s)} C {f(cx-1.1*s)} {f(cy-3.8*s)}, {f(cx-3.2*s)} {f(cy-3.2*s)}, {f(cx-3.2*s)} {f(cy-1.3*s)} '
            f'C {f(cx-3.2*s)} {f(cy+0.6*s)}, {f(cx)} {f(cy+2.6*s)}, {f(cx)} {f(cy+2.6*s)} '
            f'C {f(cx)} {f(cy+2.6*s)}, {f(cx+3.2*s)} {f(cy+0.6*s)}, {f(cx+3.2*s)} {f(cy-1.3*s)} '
            f'C {f(cx+3.2*s)} {f(cy-3.2*s)}, {f(cx+1.1*s)} {f(cy-3.8*s)}, {f(cx)} {f(cy-2.0*s)} Z')


def _mini_heart(x, y, scale=1.0, delay="0s"):
    """Companion chrome heart that beats (1 -> 1.12 -> 1), halo + outline. 6.6*scale px tall."""
    s = scale
    outer = _heart_d(0, 0, s)
    inner = _heart_d(0, 0.35 * s, 0.55 * s)
    return (
        f'<g transform="translate({x} {y})"><g>'
        + anim_scale("1 1; 1.12 1.12; 1 1", "1.4s", delay)
        + halo(outer, width=2.2)
        + f'<path d="{outer}" fill="{CHR}" stroke="{OUTLINE}" stroke-width="0.6" stroke-linejoin="round"/>'
        + f'<path d="{inner}" fill="{PINK}"/>'
        + f'<ellipse cx="{-1.3*s:.2f}" cy="{-1.4*s:.2f}" rx="{0.6*s:.2f}" ry="{0.8*s:.2f}" fill="#FFFFFF" opacity="0.8"/>'
        + '</g></g>'
    )


def _big_heart(cx, cy, s):
    """Hero chrome heart (halo + outline 0.8 + pink core + gloss), 6.6*s tall."""
    outer = _heart_d(cx, cy, s)
    inner = _heart_d(cx, cy + 0.3 * s, 0.62 * s)
    return (
        halo(outer, width=2.6)
        + f'<path d="{outer}" fill="{CHR}" stroke="{OUTLINE}" stroke-width="0.8" stroke-linejoin="round"/>'
        + f'<path d="{inner}" fill="url(#dot_pk)"/>'
        + f'<ellipse cx="{cx-1.5*s:.2f}" cy="{cy-1.6*s:.2f}" rx="{0.5*s:.2f}" ry="{0.75*s:.2f}" fill="#FFFFFF" opacity="0.75"/>'
    )


def _busy_ring(r=10.8, n=8):
    """Orbiting comet ring of pixel dots: head bright pink, tail fading to pale pink.
    The FILL fades (not the whole dot) so every bead keeps its dark outline + halo —
    an unmistakable busy cue even in the static rest pose on white/pink/dark."""
    import math
    def mix(a, b, t):
        a, b = [int(a[i:i+2], 16) for i in (1, 3, 5)], [int(b[i:i+2], 16) for i in (1, 3, 5)]
        return "#%02X%02X%02X" % tuple(round(a[i] + (b[i] - a[i]) * t) for i in range(3))
    dots = ""
    for i in range(n):
        a = -math.pi / 2 + i * 2 * math.pi / n
        x, y = 16 + r * math.cos(a), 16 + r * math.sin(a)
        rr = 1.8 - i * 0.08
        fill = mix(PINK, "#FFD6E8", i / (n - 1))
        dots += (f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rr:.1f}" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="1.4" opacity="0.92"/>'
                 f'<circle cx="{x:.1f}" cy="{y:.1f}" r="{rr:.1f}" fill="{fill}" stroke="{OUTLINE}" stroke-width="0.7"/>')
    return f'<g>{SPIN}{dots}</g>'


def _mini_hand(tx, ty, k):
    """Scaled copy of the shared pointer-hand rects (halo + outline): the click cue
    under the emoji-pointer heart. Index-finger tip lands at (tx+11.5k, ty+2k)."""
    rects = "".join(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}"/>' for x, y, w, h, r in _HAND)
    return (f'<g transform="translate({tx} {ty}) scale({k})">'
            f'<g fill="#FFFFFF" stroke="#FFFFFF" stroke-width="2.6" opacity="0.92">{rects}</g>'
            f'<g fill="url(#dot_pt)" stroke="{OUTLINE}" stroke-width="1">{rects}</g></g>')


def gen_cyworld_dotti():
    """Cyworld Dotti (싸이월드) — chrome heart + pixel sparkles."""
    defs = (rad("dot_chr", [(0, "#FFFFFF"), (40, "#E4D9EA"), (75, "#B48CB0"), (100, "#6E3F62")], cx=32, cy=30)
            + lin("dot_pk", [(0, "#FFA8C9"), (100, PINK)])
            + lin("dot_pt", [(0, "#FFD8EC"), (55, "#FF7DB8"), (100, "#C8408F")]))

    # ── Emoji: default = hero heart centred on (16,16), 23px tall, bobbing
    e_def = svg(
        f'<g>{BOB}' + _big_heart(16, 16.5, 3.5) + '</g>'
        + _sparkle(25.5, 6, scale=1.0, delay="0s")            # hugs the right lobe
        + _mini_heart(7, 25.5, scale=0.8, delay="0.3s"),      # hugs bottom-left lobe
        defs)

    # ── Emoji: pointer = shared mini pointing hand (hs 0.9, finger tip at 15.5,12 = fleet
    #    hotspot) holding the chrome heart at the knuckles (heart top y≈18.1 → top 6px of finger clear).
    hs = 0.9
    e_ptr = svg(
        _mini_hand(round(15.5 - 11.5 * hs, 2), round(12.0 - 2 * hs, 2), hs)
        + f'<g transform="translate(25 25.3)"><g>{anim_scale("1 1; 1.08 1.08; 1 1", "1.4s")}' + _big_heart(0, 0, 1.9) + '</g></g>'
        + _sparkle(27, 10, scale=1.1, delay="0.2s"),
        defs)

    # ── Emoji/pointer: wait = beating heart inside an orbiting pixel-dot ring
    wait = svg(
        _busy_ring()
        + f'<g transform="translate(16 16.3)"><g>{anim_scale("1 1; 1.08 1.08; 1 1", "0.9s")}' + _big_heart(0, 0, 2.0) + '</g></g>',
        defs)

    txt = ibeam(PINK)

    # ── Pointer: default = standard haloed arrow + 2 hugging companions
    p_def = svg(
        arrow("url(#dot_pt)")
        + _sparkle(15, 8, scale=1.0, delay="0s")              # rides the arrow's top edge
        + _mini_heart(21.5, 22, scale=0.85, delay="0.3s"),   # tucked under the arrow tail
        defs)

    # ── Pointer: pointer = lib hand + companions hugging the right edge (tip 11.5,2 clear)
    # Fingertip: pink nail WITH a 0.6 OUTLINE (skeptic fix — the old white accent had no
    # stroke, so the hotspot pixels at (11.5,2) vanished on white pages).
    nail = f'<circle cx="11.5" cy="2.6" r="1.5" fill="{PINK}" stroke="{OUTLINE}" stroke-width="0.6"/>'
    p_ptr = hand_grad("dot_pt", defs, OUTLINE, accent=None,
                      extra=nail
                            + _sparkle(25.5, 7.5, scale=1.0, delay="0s")
                            + _mini_heart(26.5, 21.5, scale=0.85, delay="0.3s"))

    write_pack("cyworld-dotti", e_def, e_ptr, txt, wait, p_def, p_ptr, txt, wait)


generate = gen_cyworld_dotti
