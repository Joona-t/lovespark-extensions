"""strawberry-milk cursor pack. Edit THIS file; run `python3 gen_cursors.py --only strawberry-milk`.

v1.1.40 redesign (Fable 5.1): every shape carries a white halo + dark outline so
the pack reads at native 32px on white, pastel-pink AND dark pages; companions
hug the arrow/hand (≤2, ≥4px tall); emoji pointer = berry held on a fingertip;
emoji wait = berry inside a dashed ring + 3 orbiting beads (busy cue visible at rest).
Round 2 (skeptic fixes): milk drops scaled ≥1.5 with a PALE body (were speck-sized,
near-white); wait got the shared dashed ring; emoji-pointer hand raised so the palm
no longer runs off the 32px canvas (hs 0.65, tip at 15.5,12).
"""
from cursor_lib import *

# ── palette ────────────────────────────────────────────────────────────────────
BERRY    = "#FF6E96"   # strawberry body
BERRY_DK = "#C84A6B"   # pack-matching dark tone (seeds on arrow, stem details)
PALE     = "#FFC4D8"   # strawberry-milk pink
MILK     = "#FFF6F9"   # milk cap / drop highlight (drop BODY is PALE so it reads on white)
SEED     = "#FFE68A"   # seeds
LEAF     = "#8FD67E"   # calyx (mint green, kawaii 딸기우유 packaging)
LEAF_DK  = "#3E7A4A"
HALO_W   = 2.2         # companion halo stroke


def _halo_path(d, w=HALO_W):
    return (f'<path d="{d}" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="{w:.1f}" '
            f'stroke-linejoin="round" opacity="0.92"/>')


def _berry_paths(s):
    """Return (body_d, leaf_d) for a strawberry of scale s centred at (0,0);
    body spans y -1.6s..3.5s, leaves reach y -3.1s. Height ≈ 6.6·s px."""
    body = (f"M 0 {-1.6*s:.1f} C {-2.6*s:.1f} {-1.6*s:.1f}, {-3.2*s:.1f} {0.4*s:.1f}, {-2.3*s:.1f} {1.9*s:.1f} "
            f"C {-1.5*s:.1f} {3.2*s:.1f}, {-0.6*s:.1f} {3.5*s:.1f}, 0 {3.5*s:.1f} "
            f"C {0.6*s:.1f} {3.5*s:.1f}, {1.5*s:.1f} {3.2*s:.1f}, {2.3*s:.1f} {1.9*s:.1f} "
            f"C {3.2*s:.1f} {0.4*s:.1f}, {2.6*s:.1f} {-1.6*s:.1f}, 0 {-1.6*s:.1f} Z")
    leaf = (f"M {-1.7*s:.1f} {-1.4*s:.1f} L {-0.9*s:.1f} {-3.1*s:.1f} L {-0.2*s:.1f} {-1.6*s:.1f} "
            f"L 0 {-3.3*s:.1f} L {0.2*s:.1f} {-1.6*s:.1f} L {0.9*s:.1f} {-3.1*s:.1f} L {1.7*s:.1f} {-1.4*s:.1f} Z")
    return body, leaf


def _straw_berry(x, y, scale=1.0, delay="0s", animate=True):
    """Mini strawberry companion with halo + outline. Gentle ±8° wiggle about
    its stem, 1.4s, rest pose first and last."""
    s = scale
    body, leaf = _berry_paths(s)
    piv = f"0 {-2.2*s:.1f}"
    rot = anim_rotate(f"0 {piv}; 8 {piv}; 0 {piv}; -8 {piv}; 0 {piv}", "1.4s", delay) if animate else ""
    sw = max(0.6, 0.55 * s)
    return (
        f'<g transform="translate({x} {y})"><g>{rot}'
        + _halo_path(body + " " + leaf, HALO_W)
        + f'<path d="{body}" fill="{BERRY}" stroke="{OUTLINE}" stroke-width="{sw:.1f}" stroke-linejoin="round"/>'
        + f'<path d="{leaf}" fill="{LEAF}" stroke="{OUTLINE}" stroke-width="{sw*0.85:.1f}" stroke-linejoin="round"/>'
        + f'<ellipse cx="{-1.1*s:.1f}" cy="{0.1*s:.1f}" rx="{0.6*s:.1f}" ry="{0.95*s:.1f}" fill="#FFFFFF" opacity="0.55"/>'
        + f'<circle cx="{0.9*s:.1f}" cy="{0.5*s:.1f}" r="{0.36*s:.1f}" fill="{SEED}"/>'
        + f'<circle cx="{-0.4*s:.1f}" cy="{1.9*s:.1f}" r="{0.36*s:.1f}" fill="{SEED}"/>'
        + f'<circle cx="{1.1*s:.1f}" cy="{2.0*s:.1f}" r="{0.32*s:.1f}" fill="{SEED}"/>'
        + '</g></g>'
    )


def _straw_drop(x, y, scale=1.0, delay="0s"):
    """Milk droplet companion with halo + outline. Drips 1.5px and fades a little,
    then returns — rest pose first and last (≈4.4·s px tall)."""
    s = scale
    d = (f"M 0 {-2*s:.1f} C {1*s:.1f} {-0.4*s:.1f}, {1.5*s:.1f} {0.5*s:.1f}, {1.5*s:.1f} {1.1*s:.1f} "
         f"C {1.5*s:.1f} {2.0*s:.1f}, {0.8*s:.1f} {2.5*s:.1f}, 0 {2.5*s:.1f} "
         f"C {-0.8*s:.1f} {2.5*s:.1f}, {-1.5*s:.1f} {2.0*s:.1f}, {-1.5*s:.1f} {1.1*s:.1f} "
         f"C {-1.5*s:.1f} {0.5*s:.1f}, {-1*s:.1f} {-0.4*s:.1f}, 0 {-2*s:.1f} Z")
    trans = anim_translate("0 0; 0 1.5; 0 0", "1.8s", delay)
    fade = anim_opacity("1;0.7;1", "1.8s", delay)
    return (
        f'<g transform="translate({x} {y})"><g>{trans}{fade}'
        + _halo_path(d, HALO_W)
        + f'<path d="{d}" fill="{PALE}" stroke="{OUTLINE}" stroke-width="0.7" stroke-linejoin="round"/>'
        + f'<ellipse cx="{-0.5*s:.1f}" cy="{0.9*s:.1f}" rx="{0.4*s:.1f}" ry="{0.7*s:.1f}" fill="{MILK}" opacity="0.95"/>'
        + '</g></g>'
    )


# ── main icon ──────────────────────────────────────────────────────────────────
_BODY = "M 16 9.5 C 9.5 9.5, 5.5 15, 6.5 21 C 8 27, 13 29, 16 29 C 19 29, 24 27, 25.5 21 C 26.5 15, 22.5 9.5, 16 9.5 Z"
_LEAF = "M 11 9.5 L 12.8 5.2 L 14.6 8.6 L 16 4 L 17.4 8.6 L 19.2 5.2 L 21 9.5 Z"
_MILK = ("M 7.6 14.8 C 9 11.2, 23 11.2, 24.4 14.8 C 23.6 17.2, 21.8 15.2, 20.6 17.8 "
         "C 19.2 15.6, 17.4 16.2, 16 17.4 C 14.6 15.4, 12.6 16.4, 11.6 18.2 C 10.4 15.6, 8.6 17, 7.6 14.8 Z")


def _main_berry(grad_id):
    seeds = [(10.5, 21, -15), (21.5, 21, 15), (13.5, 24.5, -5), (18.5, 24.5, 5), (16, 20.5, 0)]
    seed_svg = "".join(
        f'<ellipse cx="{x}" cy="{y}" rx="0.6" ry="1.15" fill="{SEED}" stroke="{BERRY_DK}" stroke-width="0.35"'
        + (f' transform="rotate({r} {x} {y})"' if r else '') + '/>' for x, y, r in seeds)
    return (
        halo(_BODY + " " + _LEAF, 2.6)
        + f'<path d="{_BODY}" fill="url(#{grad_id})" stroke="{OUTLINE}" stroke-width="0.9" stroke-linejoin="round"/>'
        + f'<path d="{_LEAF}" fill="{LEAF}" stroke="{OUTLINE}" stroke-width="0.8" stroke-linejoin="round"/>'
        + f'<path d="{_MILK}" fill="{MILK}" stroke="{OUTLINE}" stroke-width="0.7" stroke-linejoin="round"/>'
        + seed_svg
        + '<ellipse cx="9.8" cy="18" rx="1.1" ry="2" fill="#FFFFFF" opacity="0.55" transform="rotate(20 9.8 18)"/>'
    )


# ── mini pointing hand (emoji pointer "clickable" cue) ─────────────────────────
def _mini_hand(tx, ty, s, grad_id):
    """Scaled copy of the library hand (same 5-rect silhouette) with halo+outline.
    Finger tip lands at (tx + 11.5·s, ty + 2·s)."""
    rects = [('9.5', '2', '4', '15', '2'), ('13.5', '8', '3.5', '10', '1.75'), ('17', '9', '3', '9', '1.5'),
             ('6', '14', '3.5', '8', '1.75'), ('6', '15', '17.5', '13', '3')]
    def r(x, y, w, h, rx, fill, stroke, sw, extra=""):
        return (f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" '
                f'fill="{fill}" stroke="{stroke}" stroke-width="{sw:.2f}" {extra}/>')
    halo_r = "".join(r(*q, "#FFFFFF", "#FFFFFF", 2.6 / s, 'opacity="0.92"') for q in rects)
    ink = "".join(r(*q, f"url(#{grad_id})", OUTLINE, 1.0 / s) for q in rects)
    return f'<g transform="translate({tx} {ty}) scale({s})">{halo_r}{ink}</g>'


def gen_strawberry_milk():
    """Strawberry Milk (딸기우유) — milk-capped strawberry with seeds, mini berries + milk drops."""
    defs = (lin("straw_g", [(0, PALE), (100, BERRY)]) +
            lin("straw_pt", [(0, "#FFEEF3"), (100, "#FF8FAA")]))

    # emoji/default — big berry centred, mini berry top-left + milk drop top-right hugging it
    e_def = svg(
        _main_berry("straw_g")
        + _straw_berry(5.5, 7.5, scale=0.9, delay="0s")
        + _straw_drop(26.5, 9.5, scale=1.5, delay="0.4s"),
        defs,
    )

    # emoji/pointer — mini pointing hand (hotspot = finger tip 15.5,12), strawberry held
    # at the knuckles (icon top edge y≥18 so the top 6px of the finger stay clear).
    # Fleet convention: hs ≥ 0.9, tip = (tx + 11.5·hs, ty + 2·hs) = (15.5, 12.0).
    hs = 0.9
    tx, ty = 15.5 - 11.5 * hs, 12.0 - 2 * hs    # finger tip at (15.5, 12.0)
    e_ptr = svg(
        _mini_hand(tx, ty, hs, "straw_pt")
        + _straw_berry(25, 23.6, scale=1.6, delay="0s")   # leaves top ≈ 18.3, bottom ≈ 29.2
        + _straw_drop(27, 9.5, scale=1.6, delay="0.5s"),
        defs,
    )

    # emoji/wait — berry inside a dashed ring (white halo under OUTLINE dashes) with
    # 3 orbiting beads on the ring; the ring alone reads "busy" even in the static rest pose
    beads = "".join(
        f'<g transform="rotate({a} 16 16)">'
        f'<circle cx="16" cy="3.5" r="1.8" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="1.6" opacity="0.92"/>'
        f'<circle cx="16" cy="3.5" r="1.8" fill="{c}" stroke="{OUTLINE}" stroke-width="0.6"/></g>'
        for a, c in ((0, BERRY), (120, SEED), (240, BERRY_DK))   # no pale bead: all 3 read on white
    )
    ring = (
        '<circle cx="16" cy="16" r="12.5" fill="none" stroke="#FFFFFF" stroke-width="3.2" opacity="0.9" stroke-dasharray="5 3.5" stroke-linecap="round"/>'
        f'<circle cx="16" cy="16" r="12.5" fill="none" stroke="{OUTLINE}" stroke-width="1.6" stroke-dasharray="5 3.5" stroke-linecap="round"/>'
    )
    e_wait = svg(
        ring
        + f'<g>{SPIN}{beads}</g>'
        + _straw_berry(16, 16.3, scale=1.7, delay="0s"),
        defs,
    )

    txt = ibeam(BERRY)

    # pointer/default — standard haloed arrow with berry-seed speckles, companions hugging the shaft
    p_def = svg(
        arrow("url(#straw_pt)")
        + f'<ellipse cx="9.2" cy="11.5" rx="0.55" ry="1.2" fill="{BERRY_DK}" transform="rotate(-20 9.2 11.5)"/>'
        + f'<ellipse cx="10.8" cy="15.5" rx="0.55" ry="1.2" fill="{BERRY_DK}" transform="rotate(15 10.8 15.5)"/>'
        + f'<ellipse cx="8.4" cy="18.5" rx="0.55" ry="1.2" fill="{BERRY_DK}" transform="rotate(-30 8.4 18.5)"/>'
        + _straw_berry(22.5, 10.5, scale=1.05, delay="0s")
        + _straw_drop(21, 24.5, scale=1.7, delay="0.4s"),
        defs,
    )

    # pointer/pointer — library hand (halo built in) + berry & drop hugging the right edge
    p_ptr = hand_grad("straw_pt", defs, OUTLINE,
                      extra=_straw_berry(27, 9, scale=0.95, delay="0s")
                            + _straw_drop(27.5, 19.5, scale=1.7, delay="0.4s"))

    p_wait = e_wait
    write_pack("strawberry-milk", e_def, e_ptr, txt, e_wait, p_def, p_ptr, txt, p_wait)


generate = gen_strawberry_milk
