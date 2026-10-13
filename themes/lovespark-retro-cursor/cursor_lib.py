"""Shared helpers for the LoveSpark cursor generator (imported by packs/*.py).

Originally: Generate SVG cursor files for LoveSpark Retro Cursor Pack v1.1.32.

Y2K Korean Collection: 9 packs × 2 variants (Emoji + Pointer) × 4 cursor types = 72 SVGs.
Pack IDs: {name}-emoji and {name}-pointer where name is one of:
honey-bunny, cyworld-dotti, coquette-ribbon, strawberry-milk, glossy-pearl,
bubble-boba, phone-charm, heart-locket, cyber-butterfly.

The OG PNG packs (retro-pink, sakura-peach, starlight-purple) are not regenerated.
"""
import os

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cursors")

# ── SVG helpers ────────────────────────────────────────────────────────────────

def svg(body, defs=""):
    d = f"<defs>{defs}</defs>" if defs else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" '
            f'viewBox="0 0 32 32" width="32" height="32">{d}{body}</svg>')

def lin(gid, stops, x1=0, y1=0, x2=0, y2=100):
    els = "".join(f'<stop offset="{p}%" stop-color="{c}"/>' for p, c in stops)
    return f'<linearGradient id="{gid}" x1="{x1}%" y1="{y1}%" x2="{x2}%" y2="{y2}%">{els}</linearGradient>'

def rad(gid, stops, cx=50, cy=50, r=50):
    els = "".join(f'<stop offset="{p}%" stop-color="{c}"/>' for p, c in stops)
    return f'<radialGradient id="{gid}" cx="{cx}%" cy="{cy}%" r="{r}%">{els}</radialGradient>'

# SMIL animation snippets (Chrome re-rasterizes SVG cursors on mouse-move so these
# visibly animate while the cursor moves; Firefox freezes at t=0, so every values=
# list MUST start (and end) with the rest pose to look perfect as a static frame)
SPIN = '<animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="3s" repeatCount="indefinite"/>'
SPIN_SLOW = '<animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="5s" repeatCount="indefinite"/>'
BOB = '<animateTransform attributeName="transform" type="translate" values="0 0; 0 -2; 0 0" dur="1.6s" repeatCount="indefinite"/>'
SHIMMER = '<animate attributeName="opacity" values="0.55;1;0.55" dur="1.7s" repeatCount="indefinite"/>'

# Generic staggered-companion animation builders (butterfly recipe, rest-pose-first).
def anim_translate(values, dur, delay="0s"):
    return (f'<animateTransform attributeName="transform" type="translate" '
            f'values="{values}" dur="{dur}" begin="{delay}" repeatCount="indefinite" additive="sum"/>')

def anim_scale(values, dur, delay="0s"):
    return (f'<animateTransform attributeName="transform" type="scale" '
            f'values="{values}" dur="{dur}" begin="{delay}" repeatCount="indefinite" additive="sum"/>')

def anim_rotate(values, dur, delay="0s"):
    return (f'<animateTransform attributeName="transform" type="rotate" '
            f'values="{values}" dur="{dur}" begin="{delay}" repeatCount="indefinite" additive="sum"/>')

def anim_opacity(values, dur, delay="0s"):
    return (f'<animate attributeName="opacity" values="{values}" dur="{dur}" '
            f'begin="{delay}" repeatCount="indefinite"/>')

# Standard arrow path (top-left tip, asymmetric)
ARROW = "M5,4 L5,22 L9.5,18 L12,24 L15,23 L12.5,17 L18,17 Z"

def ibeam(color, outline="#5A2A4A"):
    """I-beam text cursor. Stem is 2px (a 1px stem disappears at native 32px on
    most displays); every shape carries a white halo under a dark outline so it
    reads on white, pink AND dark pages."""
    parts = (
        ('rect', 'x="11.5" y="3.5" width="9" height="3" rx="1.5"'),
        ('rect', 'x="15" y="6.5" width="2" height="19" rx="1"'),
        ('rect', 'x="11.5" y="25.5" width="9" height="3" rx="1.5"'),
    )
    halo = "".join(f'<{t} {a} fill="#FFFFFF" stroke="#FFFFFF" stroke-width="2.4" opacity="0.9"/>' for t, a in parts)
    ink = "".join(f'<{t} {a} fill="{color}" stroke="{outline}" stroke-width="0.6"/>' for t, a in parts)
    return svg(halo + ink)

# Dark outline + white halo used by every arrow/hand so cursors stay legible on
# white, pastel-pink and dark pages alike (the #1 legibility fix of v1.1.39).
OUTLINE = "#5A2A4A"

def halo(path_d, width=2.6):
    """White halo stroke drawn UNDER a shape (call before the shape itself)."""
    return (f'<path d="{path_d}" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="{width}" '
            f'stroke-linejoin="round" opacity="0.92"/>')

def arrow(fill, stroke=OUTLINE, extra_attrs=""):
    """Standard arrow with halo + outline. Tip is at (5,4) — hotspot "5 4" in CSS."""
    return (halo(ARROW)
            + f'<path d="{ARROW}" fill="{fill}" stroke="{stroke}" stroke-width="0.9" '
              f'stroke-linejoin="round" {extra_attrs}/>'
            + '<path d="M6.2,6.2 L6.2,12" stroke="#FFFFFF" stroke-width="0.9" stroke-linecap="round" opacity="0.6"/>')

# Hand template for pointer-variant link cursors
_HAND = [
    ('9.5', '2',  '4',    '15', '2'),
    ('13.5','8',  '3.5',  '10', '1.75'),
    ('17',  '9',  '3',    '9',  '1.5'),
    ('6',   '14', '3.5',  '8',  '1.75'),
    ('6',   '15', '17.5', '13', '3'),
]

def _hand_halo():
    return "".join(
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" '
        f'fill="#FFFFFF" stroke="#FFFFFF" stroke-width="2.6" opacity="0.92"/>'
        for x, y, w, h, r in _HAND
    )

def hand(fill, stroke, accent=None, extra=""):
    rects = _hand_halo() + "".join(
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" '
        f'fill="{fill}" stroke="{stroke}" stroke-width="1"/>'
        for x, y, w, h, r in _HAND
    )
    body = f'<g>{rects}</g>'
    if accent:
        body += (f'<circle cx="11.5" cy="2.5" r="1.5" fill="{accent}"/>'
                 f'<circle cx="9.5"  cy="4.5" r="1"   fill="{accent}" opacity="0.75"/>')
    return svg(body + extra)

def hand_grad(gid, defs, stroke, accent=None, extra=""):
    rects = _hand_halo() + "".join(
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" '
        f'fill="url(#{gid})" stroke="{stroke}" stroke-width="1"/>'
        for x, y, w, h, r in _HAND
    )
    body = f'<g>{rects}</g>'
    if accent:
        body += (f'<circle cx="11.5" cy="2.5" r="1.5" fill="{accent}"/>'
                 f'<circle cx="9.5"  cy="4.5" r="1"   fill="{accent}" opacity="0.75"/>')
    return svg(body + extra, defs)

def write(theme, filename, content):
    path = os.path.join(BASE, theme, filename)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    return path

def write_pack(pack_id, e_def, e_ptr, e_txt, e_wait, p_def, p_ptr, p_txt, p_wait):
    """Write 8 SVGs (emoji + pointer variants × 4 cursor types) for one Y2K Korean pack."""
    write(f"{pack_id}-emoji",   "default.svg", e_def)
    write(f"{pack_id}-emoji",   "pointer.svg", e_ptr)
    write(f"{pack_id}-emoji",   "text.svg",    e_txt)
    write(f"{pack_id}-emoji",   "wait.svg",    e_wait)
    write(f"{pack_id}-pointer", "default.svg", p_def)
    write(f"{pack_id}-pointer", "pointer.svg", p_ptr)
    write(f"{pack_id}-pointer", "text.svg",    p_txt)
    write(f"{pack_id}-pointer", "wait.svg",    p_wait)

