"""honey-bunny cursor pack. Edit THIS file; run `python3 gen_cursors.py --only honey-bunny`.

v1.1.40 redesign — every shape carries a white halo + dark outline so the pack reads
at native 32px on white, pastel-pink and dark pages; companions hug the arrow/hand.
"""
from cursor_lib import *

INK = "#7A3858"       # pack-matching dark outline (≥0.6 stroke everywhere)
CREAM = "#FFF4EE"
FUR = "#FFEADF"      # mini-bunny body: peach-cream so it separates from the white halo
PINK = "#FF8FB0"
HAND_PINK = "#FFB8CC"  # emoji-pointer hand fill (cream/white had no interior contrast on white)
ACCENT = "#FF6E96"
EYE = "#5A3030"
CARROT = "#FF9A5A"
LEAF = "#6FB85E"
HALO = 'fill="#FFFFFF" stroke="#FFFFFF" stroke-width="1.5" opacity="0.92"'


def _n(v):
    """Compact number formatting (keeps SVGs small)."""
    return f"{v:.2f}".rstrip("0").rstrip(".")


def _bun_bunny(x, y, scale=1.0, delay="0s"):
    """Mini sitting bunny companion (faces right), ~6.6px tall at scale 1 (used at 1.2-1.5 → 8-10px).

    Halo silhouette group first, then an outlined-ink group (fill/stroke inherited
    from the <g> to keep bytes down). Hop = additive translate (≤1.4px); ears squash
    on landing via additive scale; rest pose is first AND last.
    """
    s = scale
    hop = anim_translate("0 0; 0 -1.4; 0 0", "1.2s", delay)
    squash = anim_scale("1 1; 1 1; 1 0.85; 1 1", "1.2s", delay)
    body = f'cx="0" cy="{_n(1*s)}" rx="{_n(2.2*s)}" ry="{_n(1.6*s)}"'
    head = f'cx="{_n(1.5*s)}" cy="{_n(-0.6*s)}" r="{_n(1.55*s)}"'
    ear_l = f'cx="{_n(-0.55*s)}" cy="{_n(-1.2*s)}" rx="{_n(0.48*s)}" ry="{_n(1.25*s)}"'
    ear_r = f'cx="{_n(0.55*s)}" cy="{_n(-1.2*s)}" rx="{_n(0.48*s)}" ry="{_n(1.25*s)}"'
    ears_at = f'transform="translate({_n(1.5*s)} {_n(-1.6*s)})"'
    return (
        f'<g transform="translate({x} {y})"><g>{hop}'
        f'<g {HALO}><ellipse {body}/><circle {head}/>'
        f'<g {ears_at}><ellipse {ear_l}/><ellipse {ear_r}/></g></g>'
        f'<g fill="{FUR}" stroke="{INK}" stroke-width="0.7"><ellipse {body}/>'
        f'<g {ears_at}><g>{squash}<ellipse {ear_l}/><ellipse {ear_r}/>'
        f'<ellipse cx="{_n(-0.55*s)}" cy="{_n(-1.05*s)}" rx="{_n(0.2*s)}" ry="{_n(0.75*s)}" fill="{PINK}" stroke="none"/>'
        f'<ellipse cx="{_n(0.55*s)}" cy="{_n(-1.05*s)}" rx="{_n(0.2*s)}" ry="{_n(0.75*s)}" fill="{PINK}" stroke="none"/>'
        f'</g></g><circle {head}/>'
        f'<circle cx="{_n(-2.2*s)}" cy="{_n(1.1*s)}" r="{_n(0.65*s)}" fill="#FFFFFF"/>'
        f'<circle cx="{_n(2.1*s)}" cy="{_n(-0.85*s)}" r="{_n(0.3*s)}" fill="{EYE}" stroke="none"/>'
        f'<circle cx="{_n(1.2*s)}" cy="{_n(-0.1*s)}" r="{_n(0.45*s)}" fill="{PINK}" stroke="none" opacity="0.8"/>'
        f'</g></g></g>'
    )


def _bun_carrot(x, y, scale=1.0, delay="0s"):
    """Tiny bobbing carrot companion, ~5.6px tall at scale 1, halo + outline."""
    s = scale
    bob = anim_translate("0 0; 0 -0.9; 0 0", "1.5s", delay)
    root = (f'M{_n(-1.3*s)} {_n(-1.0*s)} Q0 {_n(-1.7*s)} {_n(1.3*s)} {_n(-1.0*s)} '
            f'L{_n(0.2*s)} {_n(2.7*s)} Q0 {_n(3.0*s)} {_n(-0.2*s)} {_n(2.7*s)} Z')
    leaf_l = f'cx="{_n(-0.65*s)}" cy="{_n(-1.9*s)}" rx="{_n(0.45*s)}" ry="{_n(1.0*s)}" transform="rotate(-30 {_n(-0.65*s)} {_n(-1.9*s)})"'
    leaf_r = f'cx="{_n(0.65*s)}" cy="{_n(-1.9*s)}" rx="{_n(0.45*s)}" ry="{_n(1.0*s)}" transform="rotate(30 {_n(0.65*s)} {_n(-1.9*s)})"'
    return (
        f'<g transform="translate({x} {y})"><g>{bob}'
        f'<g {HALO} stroke-linejoin="round"><ellipse {leaf_l}/><ellipse {leaf_r}/><path d="{root}"/></g>'
        f'<g fill="{LEAF}" stroke="{INK}" stroke-width="0.6" stroke-linejoin="round"><ellipse {leaf_l}/><ellipse {leaf_r}/>'
        f'<path d="{root}" fill="{CARROT}"/>'
        f'<path d="M{_n(-0.7*s)} {_n(0.2*s)} L{_n(0.5*s)} {_n(0.4*s)} M{_n(-0.45*s)} {_n(1.3*s)} L{_n(0.35*s)} {_n(1.45*s)}" '
        f'stroke="#E07040" stroke-width="{_n(max(0.3, 0.3*s))}" stroke-linecap="round"/>'
        f'</g></g></g>'
    )


def _bunny_face(cx, cy, s=1.0, sleepy=False, twitch=True):
    """Big bunny face with ears, centred on (cx, cy); ~22.5px tall at s=1.

    Head r 7.5, ears rise to cy-15. Halo under every outlined shape. One ear
    twitches (±4°, additive rotate about its base) unless twitch=False.
    """
    sw = _n(max(1.0, 1.0*s))   # ≥1px at native size: white face/ears on pink pages
    head = f'cx="{_n(cx)}" cy="{_n(cy)}" r="{_n(7.5*s)}"'
    ear_l = f'cx="{_n(cx-3.8*s)}" cy="{_n(cy-9.5*s)}" rx="{_n(2.2*s)}" ry="{_n(5.6*s)}"'
    ear_r = f'cx="{_n(cx+3.8*s)}" cy="{_n(cy-9.5*s)}" rx="{_n(2.2*s)}" ry="{_n(5.6*s)}"'
    in_l = f'cx="{_n(cx-3.8*s)}" cy="{_n(cy-9.2*s)}" rx="{_n(1.05*s)}" ry="{_n(3.9*s)}"'
    in_r = f'cx="{_n(cx+3.8*s)}" cy="{_n(cy-9.2*s)}" rx="{_n(1.05*s)}" ry="{_n(3.9*s)}"'
    big_halo = 'fill="#FFFFFF" stroke="#FFFFFF" stroke-width="2.4" opacity="0.92"'
    tw = anim_rotate(f"0 {_n(cx+3.8*s)} {_n(cy-4*s)}; 4 {_n(cx+3.8*s)} {_n(cy-4*s)}; 0 {_n(cx+3.8*s)} {_n(cy-4*s)}", "2.4s") if twitch else ""
    if sleepy:
        eyes = (f'<path d="M{_n(cx-3.6*s)} {_n(cy-1.2*s)} q{_n(1.2*s)} {_n(1.4*s)} {_n(2.4*s)} 0 '
                f'M{_n(cx+1.2*s)} {_n(cy-1.2*s)} q{_n(1.2*s)} {_n(1.4*s)} {_n(2.4*s)} 0" '
                f'fill="none" stroke="{EYE}" stroke-width="{_n(0.9*s)}" stroke-linecap="round"/>')
    else:
        eyes = (f'<ellipse cx="{_n(cx-2.5*s)}" cy="{_n(cy-1.4*s)}" rx="{_n(1*s)}" ry="{_n(1.3*s)}" fill="{EYE}"/>'
                f'<ellipse cx="{_n(cx+2.5*s)}" cy="{_n(cy-1.4*s)}" rx="{_n(1*s)}" ry="{_n(1.3*s)}" fill="{EYE}"/>'
                f'<circle cx="{_n(cx-2.75*s)}" cy="{_n(cy-1.85*s)}" r="{_n(0.35*s)}" fill="#FFFFFF"/>'
                f'<circle cx="{_n(cx+2.25*s)}" cy="{_n(cy-1.85*s)}" r="{_n(0.35*s)}" fill="#FFFFFF"/>')
    return (
        f'<ellipse {ear_l} {big_halo}/><ellipse {ear_r} {big_halo}/><circle {head} {big_halo}/>'
        f'<ellipse {ear_l} fill="#FFFFFF" stroke="{INK}" stroke-width="{sw}"/>'
        f'<ellipse {in_l} fill="{PINK}"/>'
        f'<g>{tw}<ellipse {ear_r} fill="#FFFFFF" stroke="{INK}" stroke-width="{sw}"/>'
        f'<ellipse {in_r} fill="{PINK}"/></g>'
        f'<circle {head} fill="#FFFFFF" stroke="{INK}" stroke-width="{sw}"/>'
        f'<ellipse cx="{_n(cx-4.6*s)}" cy="{_n(cy+1.6*s)}" rx="{_n(1.7*s)}" ry="{_n(1.1*s)}" fill="{PINK}" opacity="0.8"/>'
        f'<ellipse cx="{_n(cx+4.6*s)}" cy="{_n(cy+1.6*s)}" rx="{_n(1.7*s)}" ry="{_n(1.1*s)}" fill="{PINK}" opacity="0.8"/>'
        + eyes +
        f'<path d="M{_n(cx-1*s)} {_n(cy+0.8*s)} L{_n(cx)} {_n(cy+1.8*s)} L{_n(cx+1*s)} {_n(cy+0.8*s)} Z" fill="{ACCENT}"/>'
        f'<path d="M{_n(cx-2.2*s)} {_n(cy+2.4*s)} q{_n(1.1*s)} {_n(1.4*s)} {_n(2.2*s)} 0 M{_n(cx)} {_n(cy+2.4*s)} q{_n(1.1*s)} {_n(1.4*s)} {_n(2.2*s)} 0" '
        f'fill="none" stroke="{INK}" stroke-width="{_n(0.6*s)}" stroke-linecap="round"/>'
    )


# Mini pointing hand (same rect template as cursor_lib's hand, scaled) used by the
# emoji pointer so it still reads as "clickable" with the bunny perched on the finger.
_MINI_HAND = [
    ('9.5', '2',  '4',    '15', '2'),
    ('13.5','8',  '3.5',  '10', '1.75'),
    ('17',  '9',  '3',    '9',  '1.5'),
    ('6',   '14', '3.5',  '8',  '1.75'),
    ('6',   '15', '17.5', '13', '3'),
]


def _mini_hand(tx, ty, s, fill):
    rects = "".join(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}"/>'
                    for x, y, w, h, r in _MINI_HAND)
    return (f'<g transform="translate({tx} {ty}) scale({s})">'
            f'<g fill="#FFFFFF" stroke="#FFFFFF" stroke-width="{_n(2.6/s)}" opacity="0.92">{rects}</g>'
            f'<g fill="{fill}" stroke="{OUTLINE}" stroke-width="{_n(1/s)}">{rects}</g>'
            f'<circle cx="11.5" cy="2.6" r="1.5" fill="{PINK}"/></g>')


def _busy_ring():
    """Spinning 270° ring (halo + dark rim + pink core) with a lead dot — visible busy
    cue even in the static rest pose."""
    arc = 'M16 2.5 A13.5 13.5 0 1 1 2.5 16'
    return (
        f'<g>{SPIN}'
        f'<path d="{arc}" fill="none" stroke="#FFFFFF" stroke-width="4.6" stroke-linecap="round" opacity="0.92"/>'
        f'<path d="{arc}" fill="none" stroke="{INK}" stroke-width="3.2" stroke-linecap="round"/>'
        f'<path d="{arc}" fill="none" stroke="{ACCENT}" stroke-width="1.9" stroke-linecap="round"/>'
        f'<circle cx="2.5" cy="16" r="2.3" fill="#FFFFFF" opacity="0.92"/>'
        f'<circle cx="2.5" cy="16" r="1.7" fill="{CARROT}" stroke="{INK}" stroke-width="0.6"/>'
        f'</g>'
    )


def gen_honey_bunny():
    """Honey Bunny (꿀토끼) — bunny face + mini bunnies/carrots, cream-pink palette."""
    defs = lin("bun_pt", [(0, "#FFE0D0"), (100, "#FF9FB8")])  # darker bottom stop: fill survives pastel-pink pages
    txt = ibeam(ACCENT)

    # ── emoji variant (hotspot 16,16) ──
    e_def = svg(_bunny_face(16, 17.5) + _bun_carrot(6, 26, scale=1.4, delay="0.3s"))
    # emoji pointer: pink-filled mini hand (hs 0.9, finger tip at 15.5,12 — fleet hotspot),
    # bunny face held at the knuckles (ear tips y≈18.3 → top 6px of the finger clear).
    hs = 0.9
    e_ptr = svg(_mini_hand(_n(15.5 - 11.5 * hs), _n(12.0 - 2 * hs), hs, HAND_PINK)
                + _bunny_face(24, 26.5, s=0.55, twitch=False)
                + _bun_carrot(27.5, 9, scale=1.4, delay="0.2s"))
    e_wait = svg(_busy_ring() + _bunny_face(16, 17.8, s=0.68, sleepy=True, twitch=False))

    # ── pointer variant (hotspots 5,4 / 11,3) ──
    p_def = svg(arrow("url(#bun_pt)")
                + _bun_bunny(23.5, 10.5, scale=1.5, delay="0s")
                + _bun_carrot(22, 26, scale=1.6, delay="0.4s"), defs)
    p_ptr = hand_grad("bun_pt", defs, OUTLINE, accent=PINK,
                      extra=_bun_bunny(24.5, 6.2, scale=1.3, delay="0s")
                            + _bun_carrot(3.5, 9.5, scale=1.4, delay="0.4s"))
    p_wait = e_wait
    write_pack("honey-bunny", e_def, e_ptr, txt, e_wait, p_def, p_ptr, txt, p_wait)


generate = gen_honey_bunny
