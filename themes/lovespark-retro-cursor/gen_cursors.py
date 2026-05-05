#!/usr/bin/env python3
"""Generate SVG cursor files for LoveSpark Retro Cursor Pack v1.1.32.

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

# SMIL animation snippets (browsers may freeze in cursor context — designs work as static)
SPIN = '<animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="3s" repeatCount="indefinite"/>'
SPIN_SLOW = '<animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="5s" repeatCount="indefinite"/>'
BOB = '<animateTransform attributeName="transform" type="translate" values="0 0; 0 -2; 0 0" dur="1.6s" repeatCount="indefinite"/>'
SHIMMER = '<animate attributeName="opacity" values="0.55;1;0.55" dur="1.7s" repeatCount="indefinite"/>'

# Standard arrow path (top-left tip, asymmetric)
ARROW = "M5,4 L5,22 L9.5,18 L12,24 L15,23 L12.5,17 L18,17 Z"

def ibeam(color):
    body = (f'<rect x="12" y="4" width="8" height="2.5" rx="1.25" fill="{color}"/>'
            f'<rect x="15.5" y="6.5" width="1" height="19" rx="0.5" fill="{color}"/>'
            f'<rect x="12" y="25.5" width="8" height="2.5" rx="1.25" fill="{color}"/>')
    return svg(body)

# Hand template for pointer-variant link cursors
_HAND = [
    ('9.5', '2',  '4',    '15', '2'),
    ('13.5','8',  '3.5',  '10', '1.75'),
    ('17',  '9',  '3',    '9',  '1.5'),
    ('6',   '14', '3.5',  '8',  '1.75'),
    ('6',   '15', '17.5', '13', '3'),
]

def hand(fill, stroke, accent=None):
    rects = "".join(
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" '
        f'fill="{fill}" stroke="{stroke}" stroke-width="1"/>'
        for x, y, w, h, r in _HAND
    )
    body = f'<g>{rects}</g>'
    if accent:
        body += (f'<circle cx="11.5" cy="2.5" r="1.5" fill="{accent}"/>'
                 f'<circle cx="9.5"  cy="4.5" r="1"   fill="{accent}" opacity="0.75"/>')
    return svg(body)

def hand_grad(gid, defs, stroke, accent=None):
    rects = "".join(
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" '
        f'fill="url(#{gid})" stroke="{stroke}" stroke-width="1"/>'
        for x, y, w, h, r in _HAND
    )
    body = f'<g>{rects}</g>'
    if accent:
        body += (f'<circle cx="11.5" cy="2.5" r="1.5" fill="{accent}"/>'
                 f'<circle cx="9.5"  cy="4.5" r="1"   fill="{accent}" opacity="0.75"/>')
    return svg(body, defs)

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

# ── Pack designs ───────────────────────────────────────────────────────────────

def gen_honey_bunny():
    """Honey Bunny (꿀토끼) — bunny face + paw print, cream-pink palette."""
    bunny_face_ears = (
        '<ellipse cx="11.5" cy="9" rx="2" ry="5.5" fill="#FFFFFF" stroke="#A06080" stroke-width="0.5"/>'
        '<ellipse cx="11.5" cy="9.3" rx="0.95" ry="3.8" fill="#FF8FB0"/>'
        '<ellipse cx="20.5" cy="9" rx="2" ry="5.5" fill="#FFFFFF" stroke="#A06080" stroke-width="0.5"/>'
        '<ellipse cx="20.5" cy="9.3" rx="0.95" ry="3.8" fill="#FF8FB0"/>'
        '<circle cx="16" cy="19" r="6.5" fill="#FFFFFF" stroke="#A06080" stroke-width="0.6"/>'
        '<ellipse cx="11.7" cy="20.5" rx="1.6" ry="1.1" fill="#FF8FB0" opacity="0.75"/>'
        '<ellipse cx="20.3" cy="20.5" rx="1.6" ry="1.1" fill="#FF8FB0" opacity="0.75"/>'
        '<ellipse cx="13.5" cy="17.5" rx="0.95" ry="1.25" fill="#6B4438"/>'
        '<ellipse cx="18.5" cy="17.5" rx="0.95" ry="1.25" fill="#6B4438"/>'
        '<circle cx="13.3" cy="17.1" r="0.32" fill="#FFFFFF"/>'
        '<circle cx="18.3" cy="17.1" r="0.32" fill="#FFFFFF"/>'
        '<path d="M 15 19.7 L 16 20.6 L 17 19.7 Z" fill="#FF6E96"/>'
        '<path d="M 13.8 21 Q 16 22.3, 18.2 21" stroke="#A06080" stroke-width="0.5" fill="none" stroke-linecap="round"/>'
    )
    paw = (
        '<ellipse cx="16" cy="20" rx="6.5" ry="5.5" fill="#FFE5E5" stroke="#A06080" stroke-width="0.6"/>'
        '<circle cx="10.5" cy="13" r="2" fill="#FFE5E5" stroke="#A06080" stroke-width="0.5"/>'
        '<circle cx="14" cy="10.5" r="2" fill="#FFE5E5" stroke="#A06080" stroke-width="0.5"/>'
        '<circle cx="18" cy="10.5" r="2" fill="#FFE5E5" stroke="#A06080" stroke-width="0.5"/>'
        '<circle cx="21.5" cy="13" r="2" fill="#FFE5E5" stroke="#A06080" stroke-width="0.5"/>'
        '<ellipse cx="16" cy="20.5" rx="3.2" ry="2.6" fill="#FF8FB0"/>'
        '<circle cx="10.5" cy="13" r="1" fill="#FF8FB0"/>'
        '<circle cx="14" cy="10.5" r="1" fill="#FF8FB0"/>'
        '<circle cx="18" cy="10.5" r="1" fill="#FF8FB0"/>'
        '<circle cx="21.5" cy="13" r="1" fill="#FF8FB0"/>'
    )
    bunny_face_no_ears = (
        '<circle cx="16" cy="16" r="7" fill="#FFFFFF" stroke="#A06080" stroke-width="0.5"/>'
        '<ellipse cx="11.7" cy="17.5" rx="1.6" ry="1.1" fill="#FF8FB0" opacity="0.7"/>'
        '<ellipse cx="20.3" cy="17.5" rx="1.6" ry="1.1" fill="#FF8FB0" opacity="0.7"/>'
        '<circle cx="13.5" cy="14.5" r="0.9" fill="#6B4438"/>'
        '<circle cx="18.5" cy="14.5" r="0.9" fill="#6B4438"/>'
        '<path d="M 15 16.5 L 16 17.4 L 17 16.5 Z" fill="#FF6E96"/>'
    )
    e_def = svg(bunny_face_ears)
    e_ptr = svg(paw)
    e_wait = svg(f'<g>{BOB}{bunny_face_ears}</g>')
    txt = ibeam("#FF6E96")
    bun_defs = lin("bun_pt", [(0, "#FFF0EC"), (100, "#FFB8CC")])
    p_def = svg(
        f'<path d="{ARROW}" fill="url(#bun_pt)" stroke="#A06080" stroke-width="0.7" stroke-linejoin="round"/>'
        f'<ellipse cx="6.5" cy="6" rx="0.6" ry="1.8" fill="#FFFFFF" opacity="0.7"/>'
        f'<circle cx="4.5" cy="23" r="2.3" fill="#FFFFFF" stroke="#A06080" stroke-width="0.4"/>'
        f'<circle cx="3.7" cy="22.5" r="0.8" fill="#FFE0E8" opacity="0.85"/>',
        bun_defs
    )
    p_ptr = hand("#FFE5E5", "#A06080", accent="#FF8FB0")
    p_wait = svg(f'<g>{BOB}{bunny_face_no_ears}</g>')
    write_pack("honey-bunny", e_def, e_ptr, txt, e_wait, p_def, p_ptr, txt, p_wait)


def gen_cyworld_dotti():
    """Cyworld Dotti (싸이월드) — chrome heart + pixel sparkles."""
    chrome_heart = (
        '<path d="M 16 12 C 13 7, 5 9, 5 14.5 C 5 20, 14 26, 16 27.5 C 18 26, 27 20, 27 14.5 C 27 9, 19 7, 16 12 Z" fill="url(#dot_chr)" stroke="#5A2A4A" stroke-width="0.7"/>'
        '<path d="M 16 14 C 14 10, 8 11, 8 15 C 8 19, 14 23, 16 24.5 C 18 23, 24 19, 24 15 C 24 11, 18 10, 16 14 Z" fill="url(#dot_pk)"/>'
        '<ellipse cx="11" cy="13" rx="1.6" ry="2.3" fill="#FFFFFF" opacity="0.65"/>'
    )
    sparkle_top = (
        '<g transform="translate(16 5)">'
        f'<animate attributeName="opacity" values="0.55;1;0.55" dur="1.7s" repeatCount="indefinite"/>'
        '<rect x="-0.4" y="-2.2" width="0.8" height="4.4" fill="#FFFFFF"/>'
        '<rect x="-2.2" y="-0.4" width="4.4" height="0.8" fill="#FFFFFF"/>'
        '</g>'
    )
    pink_only_heart = (
        '<path d="M 16 11 C 13 5, 4 7, 4 14 C 4 21, 14 27, 16 28.5 C 18 27, 28 21, 28 14 C 28 7, 19 5, 16 11 Z" fill="url(#dot_lpk)" stroke="#5A2A4A" stroke-width="0.7"/>'
        '<ellipse cx="11" cy="13" rx="2" ry="2.8" fill="#FFFFFF" opacity="0.6"/>'
        '<ellipse cx="21" cy="13" rx="0.8" ry="1.2" fill="#FFFFFF" opacity="0.45"/>'
    )
    spinning_heart = (
        f'<g>{SPIN}'
        '<path d="M 16 11 C 13 8, 8 9, 9 14 C 10 18, 14 21, 16 24 C 18 21, 22 18, 23 14 C 24 9, 19 8, 16 11 Z" fill="url(#dot_chr)" stroke="#5A2A4A" stroke-width="0.6"/>'
        '<path d="M 16 13 C 14 11, 11 12, 11 14 C 12 17, 14 19, 16 20 C 18 19, 20 17, 21 14 C 21 12, 18 11, 16 13 Z" fill="#FF5BAA"/>'
        '<circle cx="13" cy="13" r="1.1" fill="#FFFFFF" opacity="0.75"/>'
        '</g>'
    )
    defs_e = (rad("dot_chr", [(0, "#FFFFFF"), (55, "#E8E2EC"), (100, "#7A4A6A")], cx=30, cy=30) +
              lin("dot_pk", [(0, "#FFA8C9"), (100, "#FF5BAA")]) +
              lin("dot_lpk", [(0, "#FFC8DD"), (100, "#FF3D8A")]))
    e_def = svg(chrome_heart + sparkle_top, defs_e)
    e_ptr = svg(pink_only_heart, defs_e)
    e_wait = svg(spinning_heart, defs_e)
    txt = ibeam("#FF5BAA")
    p_defs = lin("dot_pt", [(0, "#FFD8EC"), (55, "#FF7DB8"), (100, "#C8408F")])
    p_def = svg(
        f'<path d="{ARROW}" fill="url(#dot_pt)" stroke="#5A2A4A" stroke-width="0.7" stroke-linejoin="round"/>'
        f'<ellipse cx="7.8" cy="7" rx="0.8" ry="2.2" fill="#FFFFFF" opacity="0.6"/>'
        '<g transform="translate(20 4)">'
        f'<animate attributeName="opacity" values="0.55;1;0.55" dur="1.7s" repeatCount="indefinite"/>'
        '<rect x="1.4" y="0" width="0.8" height="3.2" fill="#FFFFFF"/>'
        '<rect x="0" y="1.4" width="3.2" height="0.8" fill="#FFFFFF"/>'
        '</g>',
        p_defs
    )
    p_ptr = hand_grad("dot_pt", p_defs, "#5A2A4A", accent="#FFFFFF")
    p_wait = svg(spinning_heart, defs_e)
    write_pack("cyworld-dotti", e_def, e_ptr, txt, e_wait, p_def, p_ptr, txt, p_wait)


def gen_coquette_ribbon():
    """Coquette Ribbon (리본) — pink satin bow."""
    bow = (
        '<path d="M 16 16 C 12 9, 4 11, 4 16 C 4 20, 12 22, 16 16 Z" fill="#FFB8CC" stroke="#A06080" stroke-width="0.6"/>'
        '<path d="M 16 16 C 20 9, 28 11, 28 16 C 28 20, 20 22, 16 16 Z" fill="#FFB8CC" stroke="#A06080" stroke-width="0.6"/>'
        '<ellipse cx="16" cy="16" rx="2.4" ry="3.2" fill="#FF6E96" stroke="#A06080" stroke-width="0.5"/>'
        '<path d="M 13.5 19 L 11 26 L 14 23.5 L 15 19 Z" fill="#FFB8CC" stroke="#A06080" stroke-width="0.5"/>'
        '<path d="M 18.5 19 L 21 26 L 18 23.5 L 17 19 Z" fill="#FFB8CC" stroke="#A06080" stroke-width="0.5"/>'
        '<ellipse cx="9" cy="14" rx="1.5" ry="1" fill="#FFFFFF" opacity="0.65"/>'
        '<ellipse cx="23" cy="14" rx="1.5" ry="1" fill="#FFFFFF" opacity="0.65"/>'
    )
    bow_with_pearl = (
        '<path d="M 16 13 C 12 6, 3 8, 3 13 C 3 18, 12 20, 16 13 Z" fill="#FFB8CC" stroke="#A06080" stroke-width="0.6"/>'
        '<path d="M 16 13 C 20 6, 29 8, 29 13 C 29 18, 20 20, 16 13 Z" fill="#FFB8CC" stroke="#A06080" stroke-width="0.6"/>'
        '<ellipse cx="16" cy="13" rx="2.4" ry="3" fill="#FF6E96" stroke="#A06080" stroke-width="0.5"/>'
        '<line x1="16" y1="16.5" x2="16" y2="22" stroke="#C898A8" stroke-width="0.5"/>'
        '<circle cx="16" cy="25" r="3.5" fill="url(#coq_prl)" stroke="#A06080" stroke-width="0.5"/>'
        '<ellipse cx="14.8" cy="23.8" rx="1" ry="1.5" fill="#FFFFFF" opacity="0.7"/>'
    )
    pearl_drop = (
        '<line x1="16" y1="3" x2="16" y2="13" stroke="#C898A8" stroke-width="0.6"/>'
        f'<g>{BOB}'
        '<circle cx="16" cy="19" r="6" fill="url(#coq_prl)" stroke="#A06080" stroke-width="0.5"/>'
        '<ellipse cx="14" cy="17" rx="1.7" ry="2.5" fill="#FFFFFF" opacity="0.6"/>'
        '</g>'
    )
    defs = rad("coq_prl", [(0, "#FFFFFF"), (55, "#FFE8F0"), (100, "#E8B8C8")], cx=30, cy=30)
    e_def = svg(bow, defs)
    e_ptr = svg(bow_with_pearl, defs)
    e_wait = svg(pearl_drop, defs)
    txt = ibeam("#FF6E96")
    p_defs = lin("coq_pt", [(0, "#FFEEF4"), (100, "#F4B8CE")], x1=0, y1=0, x2=100, y2=100)
    p_def = svg(
        f'<path d="{ARROW}" fill="url(#coq_pt)" stroke="#A06080" stroke-width="0.7" stroke-linejoin="round"/>'
        '<ellipse cx="6.8" cy="6.5" rx="0.6" ry="1.8" fill="#FFFFFF" opacity="0.7"/>'
        '<g transform="translate(5 22.5)">'
        '<path d="M 0 0 L -3.5 -2 L -3.5 3 L 0 1 Z" fill="#FF8FB0"/>'
        '<path d="M 0 0 L 3.5 -2 L 3.5 3 L 0 1 Z" fill="#FF8FB0"/>'
        '<circle cx="0" cy="0.4" r="1.1" fill="#FF6E96"/>'
        '<path d="M -2.5 1 L -3.5 4.5" stroke="#FF8FB0" stroke-width="0.9" fill="none"/>'
        '<path d="M 2.5 1 L 3.5 4.5" stroke="#FF8FB0" stroke-width="0.9" fill="none"/>'
        '</g>',
        p_defs
    )
    p_ptr = hand_grad("coq_pt", p_defs, "#A06080")
    p_wait = svg(pearl_drop, defs)
    write_pack("coquette-ribbon", e_def, e_ptr, txt, e_wait, p_def, p_ptr, txt, p_wait)


def gen_strawberry_milk():
    """Strawberry Milk (딸기우유) — strawberry shape with seeds, milk swirl."""
    straw = (
        '<path d="M 16 9 C 9 9, 5 15, 6 21 C 8 27, 13 29, 16 29 C 19 29, 24 27, 26 21 C 27 15, 23 9, 16 9 Z" fill="url(#straw_g)" stroke="#C84A6B" stroke-width="0.7"/>'
        '<ellipse cx="16" cy="9" rx="3.5" ry="1.5" fill="#FF6E96"/>'
        '<path d="M 13 8 L 14 5 L 15 8 Z M 16 8 L 16 4 L 17 8 Z M 19 8 L 18 5 L 17 8 Z" fill="#FF8FAA" stroke="#C84A6B" stroke-width="0.3"/>'
        '<ellipse cx="11" cy="15" rx="0.5" ry="1.2" fill="#FFE68A" transform="rotate(-15 11 15)"/>'
        '<ellipse cx="21" cy="15" rx="0.5" ry="1.2" fill="#FFE68A" transform="rotate(15 21 15)"/>'
        '<ellipse cx="13" cy="20" rx="0.5" ry="1.2" fill="#FFE68A"/>'
        '<ellipse cx="19" cy="20" rx="0.5" ry="1.2" fill="#FFE68A"/>'
        '<ellipse cx="16" cy="24" rx="0.5" ry="1.2" fill="#FFE68A"/>'
        '<ellipse cx="13" cy="13" rx="1.3" ry="2.2" fill="#FFFFFF" opacity="0.65"/>'
    )
    straw_milk = (
        '<path d="M 16 8 C 9 8, 5 14, 6 20 C 8 26, 13 28, 16 28 C 19 28, 24 26, 26 20 C 27 14, 23 8, 16 8 Z" fill="url(#straw_l)" stroke="#C84A6B" stroke-width="0.7"/>'
        '<ellipse cx="16" cy="8" rx="3.5" ry="1.5" fill="#FF6E96"/>'
        '<ellipse cx="11" cy="14" rx="0.5" ry="1.2" fill="#FFE68A" transform="rotate(-15 11 14)"/>'
        '<ellipse cx="21" cy="14" rx="0.5" ry="1.2" fill="#FFE68A" transform="rotate(15 21 14)"/>'
        '<ellipse cx="16" cy="22" rx="0.5" ry="1.2" fill="#FFE68A"/>'
        '<path d="M 13 16 Q 13 22, 16 24 Q 19 22, 19 16 Q 16 19, 13 16 Z" fill="#FFFFFF" opacity="0.85"/>'
    )
    milk_swirl = (
        f'<g>{SPIN}'
        '<circle cx="16" cy="16" r="10" fill="#FFEEE8" stroke="#FF8FAA" stroke-width="0.7"/>'
        '<path d="M 8 16 C 8 11, 12 8, 16 8 C 20 8, 24 11, 24 16" stroke="#FF8FAA" stroke-width="2.4" fill="none" stroke-linecap="round"/>'
        '<path d="M 11 19 C 11 14, 14 11, 17 11" stroke="#FFB8C8" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
        '<circle cx="11" cy="22" r="0.7" fill="#FFE68A"/>'
        '<circle cx="21" cy="22" r="0.7" fill="#FFE68A"/>'
        '<circle cx="16" cy="11" r="0.7" fill="#FFE68A"/>'
        '</g>'
    )
    defs = (lin("straw_g", [(0, "#FFC4D8"), (100, "#FF6E96")]) +
            lin("straw_l", [(0, "#FFD8E0"), (100, "#FF8FAA")]))
    e_def = svg(straw, defs)
    e_ptr = svg(straw_milk, defs)
    e_wait = svg(milk_swirl, defs)
    txt = ibeam("#C44A6B")
    p_defs = lin("straw_pt", [(0, "#FFEEE8"), (100, "#FF8FAA")])
    p_def = svg(
        f'<path d="{ARROW}" fill="url(#straw_pt)" stroke="#C84A6B" stroke-width="0.7" stroke-linejoin="round"/>'
        '<ellipse cx="9" cy="10" rx="0.4" ry="1" fill="#D4A044" transform="rotate(-20 9 10)"/>'
        '<ellipse cx="11" cy="14" rx="0.4" ry="1" fill="#D4A044" transform="rotate(15 11 14)"/>'
        '<ellipse cx="9" cy="17" rx="0.4" ry="1" fill="#D4A044" transform="rotate(-30 9 17)"/>'
        '<ellipse cx="7.5" cy="6" rx="0.7" ry="2" fill="#FFFFFF" opacity="0.75"/>',
        p_defs
    )
    p_ptr = hand_grad("straw_pt", p_defs, "#C84A6B")
    p_wait = svg(milk_swirl, defs)
    write_pack("strawberry-milk", e_def, e_ptr, txt, e_wait, p_def, p_ptr, txt, p_wait)


def gen_glossy_pearl():
    """Glossy Lip Pearl — iridescent pearl bead with prism shimmer."""
    pearl = (
        '<circle cx="16" cy="16" r="10" fill="url(#prl_d)" stroke="#7A6A8E" stroke-width="0.7"/>'
        '<ellipse cx="12" cy="12" rx="3" ry="4.5" fill="#FFFFFF" opacity="0.85"/>'
        '<circle cx="20" cy="20" r="1.4" fill="#FFFFFF" opacity="0.7"/>'
        f'<circle cx="22" cy="14" r="0.7" fill="#FFFFFF">{SHIMMER}</circle>'
    )
    pearl_big = (
        '<circle cx="16" cy="16" r="11" fill="url(#prl_l)" stroke="#7A6A8E" stroke-width="0.7"/>'
        '<circle cx="16" cy="16" r="11" fill="none" stroke="#FFFFFF" stroke-width="1" opacity="0.6"/>'
        '<ellipse cx="11.5" cy="11.5" rx="3.2" ry="4.5" fill="#FFFFFF" opacity="0.85"/>'
        '<circle cx="21" cy="21" r="1.6" fill="#FFFFFF" opacity="0.7"/>'
        f'<circle cx="22" cy="11" r="0.7" fill="#FFFFFF">{SHIMMER}</circle>'
    )
    prism_spin = (
        f'<g>{SPIN}'
        '<circle cx="16" cy="16" r="9" fill="url(#prl_w)" stroke="#A89BC5" stroke-width="0.5"/>'
        '<ellipse cx="13" cy="13" rx="2.4" ry="3.2" fill="#FFFFFF" opacity="0.7"/>'
        '<circle cx="20" cy="19" r="1" fill="#FFFFFF"/>'
        '</g>'
    )
    defs = (rad("prl_d", [(0, "#FFFFFF"), (35, "#FFE8F4"), (70, "#D5B8E8"), (100, "#9888B5")], cx=35, cy=30) +
            rad("prl_l", [(0, "#FFFFFF"), (40, "#FFD8F0"), (100, "#A89BC5")], cx=35, cy=30) +
            lin("prl_w", [(0, "#FFD8F0"), (33, "#D5B8E8"), (66, "#B8D5E8"), (100, "#FFE0E8")], x1=0, y1=0, x2=100, y2=100))
    e_def = svg(pearl, defs)
    e_ptr = svg(pearl_big, defs)
    e_wait = svg(prism_spin, defs)
    txt = ibeam("#A89BC5")
    p_defs = lin("prl_pt", [(0, "#FFE8F4"), (35, "#E8D5F4"), (70, "#C8B5E0"), (100, "#9888B5")], x1=0, y1=0, x2=100, y2=100)
    p_def = svg(
        f'<path d="{ARROW}" fill="url(#prl_pt)" stroke="#7A6A8E" stroke-width="0.6" stroke-linejoin="round"/>'
        '<ellipse cx="8" cy="6" rx="1.1" ry="2.6" fill="#FFFFFF" opacity="0.85"/>'
        f'<circle cx="13" cy="20" r="0.6" fill="#FFFFFF">{SHIMMER}</circle>',
        p_defs
    )
    p_ptr = hand_grad("prl_pt", p_defs, "#7A6A8E")
    p_wait = svg(prism_spin, defs)
    write_pack("glossy-pearl", e_def, e_ptr, txt, e_wait, p_def, p_ptr, txt, p_wait)


def gen_bubble_boba():
    """Bubble Boba (버블티) — gel droplet with dark boba pearls."""
    droplet = (
        '<path d="M 16 6 C 22 12, 26 18, 26 22 C 26 27, 22 30, 16 30 C 10 30, 6 27, 6 22 C 6 18, 10 12, 16 6 Z" fill="url(#bob_d)" stroke="#7A5A8A" stroke-width="0.7"/>'
        '<circle cx="16" cy="22" r="2.5" fill="#3A2A3A"/>'
        '<ellipse cx="13" cy="13" rx="1.4" ry="2.4" fill="#FFFFFF" opacity="0.8"/>'
        '<circle cx="14.5" cy="20.5" r="0.6" fill="#FFFFFF" opacity="0.6"/>'
    )
    cluster = (
        '<circle cx="11" cy="14" r="4" fill="#3A2A3A"/>'
        '<circle cx="21" cy="14" r="4" fill="#3A2A3A"/>'
        '<circle cx="16" cy="22" r="4" fill="#3A2A3A"/>'
        '<circle cx="9" cy="12" r="1.2" fill="#FFFFFF" opacity="0.5"/>'
        '<circle cx="19" cy="12" r="1.2" fill="#FFFFFF" opacity="0.5"/>'
        '<circle cx="14" cy="20" r="1.2" fill="#FFFFFF" opacity="0.5"/>'
    )
    boba_cup = (
        '<path d="M 9 9 L 9 26 L 23 26 L 23 9 Z" fill="url(#bob_cup)" stroke="#7A5A8A" stroke-width="0.6"/>'
        '<line x1="16" y1="6" x2="16" y2="14" stroke="#7A5A8A" stroke-width="1"/>'
        '<ellipse cx="11" cy="11" rx="1" ry="2" fill="#FFFFFF" opacity="0.6"/>'
        f'<g>{BOB}<circle cx="13" cy="22" r="1.5" fill="#3A2A3A"/></g>'
        '<circle cx="16" cy="23" r="1.5" fill="#3A2A3A"/>'
        '<circle cx="19" cy="22" r="1.5" fill="#3A2A3A"/>'
        '<circle cx="14" cy="24.5" r="1.2" fill="#3A2A3A"/>'
        '<circle cx="18" cy="24.5" r="1.2" fill="#3A2A3A"/>'
    )
    defs = (lin("bob_d", [(0, "#FFD8E5"), (100, "#C4A8E0")]) +
            lin("bob_cup", [(0, "#FFE8F5"), (100, "#C4A8E0")]))
    e_def = svg(droplet, defs)
    e_ptr = svg(cluster)
    e_wait = svg(boba_cup, defs)
    txt = ibeam("#7A5A8A")
    p_defs = lin("bob_pt", [(0, "#FFD8E5"), (100, "#C4A8E0")])
    p_def = svg(
        f'<path d="{ARROW}" fill="url(#bob_pt)" stroke="#7A5A8A" stroke-width="0.7" stroke-linejoin="round"/>'
        '<circle cx="9" cy="11" r="1.3" fill="#3A2A3A"/>'
        '<circle cx="11" cy="15" r="1.1" fill="#3A2A3A"/>'
        '<ellipse cx="7.5" cy="6" rx="0.7" ry="2" fill="#FFFFFF" opacity="0.85"/>',
        p_defs
    )
    p_ptr = hand_grad("bob_pt", p_defs, "#7A5A8A")
    p_wait = svg(boba_cup, defs)
    write_pack("bubble-boba", e_def, e_ptr, txt, e_wait, p_def, p_ptr, txt, p_wait)


def gen_phone_charm():
    """Phone Charm (폰꽂이) — Y2K jelly star with chain link."""
    star_jelly = (
        '<g transform="translate(16 17)">'
        '<path d="M 0 -10 L 2.94 -3.09 L 9.51 -3.09 L 4.29 1.18 L 6.18 8.09 L 0 4 L -6.18 8.09 L -4.29 1.18 L -9.51 -3.09 L -2.94 -3.09 Z" fill="url(#chm_d)" stroke="#A8408A" stroke-width="0.7"/>'
        '<path d="M 0 -7 L 2 -2.5 L 6 -2.5 L 3 0 L 4 4 L 0 1.5 L -4 4 L -3 0 L -6 -2.5 L -2 -2.5 Z" fill="#FF3D8A" opacity="0.7"/>'
        '<ellipse cx="-3" cy="-2" rx="1.5" ry="2" fill="#FFFFFF" opacity="0.6"/>'
        '</g>'
    )
    star_chain = (
        '<line x1="16" y1="3" x2="16" y2="9" stroke="#C8CCD2" stroke-width="0.8"/>'
        '<circle cx="16" cy="9" r="1.6" fill="none" stroke="#C8CCD2" stroke-width="0.7"/>'
        '<g transform="translate(16 19)">'
        '<path d="M 0 -8 L 2.35 -2.47 L 7.61 -2.47 L 3.43 0.94 L 4.94 6.47 L 0 3.2 L -4.94 6.47 L -3.43 0.94 L -7.61 -2.47 L -2.35 -2.47 Z" fill="#FFB8D9" stroke="#A8408A" stroke-width="0.7"/>'
        '<path d="M 0 -5 L 1.5 -2 L 4.5 -2 L 2 0 L 3 3 L 0 1.5 L -3 3 L -2 0 L -4.5 -2 L -1.5 -2 Z" fill="#FF3D8A"/>'
        '<ellipse cx="-2.5" cy="-1.5" rx="1.2" ry="1.6" fill="#FFFFFF" opacity="0.65"/>'
        '</g>'
    )
    star_spin = (
        '<line x1="16" y1="2" x2="16" y2="9" stroke="#C8CCD2" stroke-width="0.7"/>'
        '<circle cx="16" cy="9" r="1.5" fill="none" stroke="#C8CCD2" stroke-width="0.6"/>'
        f'<g>{SPIN}'
        '<circle cx="16" cy="18" r="6.5" fill="#FFB8D9" opacity="0.85" stroke="#A8408A" stroke-width="0.5"/>'
        '<g transform="translate(16 18)">'
        '<path d="M 0 -3.4 L 1 -1 L 3.4 -1 L 1.5 0.6 L 2.2 3.2 L 0 1.7 L -2.2 3.2 L -1.5 0.6 L -3.4 -1 L -1 -1 Z" fill="#FF3D8A"/>'
        '</g>'
        '<ellipse cx="13" cy="15" rx="1" ry="2" fill="#FFFFFF" opacity="0.65"/>'
        '</g>'
    )
    defs = lin("chm_d", [(0, "#FFC8DD"), (100, "#FF8AB8")])
    e_def = svg(star_jelly, defs)
    e_ptr = svg(star_chain, defs)
    e_wait = svg(star_spin)
    txt = ibeam("#FF3D8A")
    p_defs = lin("chm_pt", [(0, "#FFC8DD"), (100, "#FF8AB8")])
    p_def = svg(
        f'<path d="{ARROW}" fill="url(#chm_pt)" stroke="#A8408A" stroke-width="0.7" stroke-linejoin="round"/>'
        '<g transform="translate(10 13)">'
        '<path d="M 0 -2.4 L 0.7 -0.7 L 2.5 -0.7 L 1 0.5 L 1.6 2.4 L 0 1.2 L -1.6 2.4 L -1 0.5 L -2.5 -0.7 L -0.7 -0.7 Z" fill="#FF3D8A"/>'
        '</g>'
        '<ellipse cx="7.5" cy="6" rx="0.7" ry="2" fill="#FFFFFF" opacity="0.85"/>',
        p_defs
    )
    p_ptr = hand_grad("chm_pt", p_defs, "#A8408A")
    p_wait = svg(star_spin)
    write_pack("phone-charm", e_def, e_ptr, txt, e_wait, p_def, p_ptr, txt, p_wait)


def gen_heart_locket():
    """Heart Locket (하트 로켓) — silver+pink heart locket with chain ring."""
    locket = (
        '<line x1="16" y1="3" x2="16" y2="8" stroke="#A04A6E" stroke-width="0.7"/>'
        '<circle cx="16" cy="7" r="1.5" fill="none" stroke="#A04A6E" stroke-width="0.7"/>'
        '<path d="M 16 14 C 13 9, 5 11, 5 16 C 5 21, 14 27, 16 28.5 C 18 27, 27 21, 27 16 C 27 11, 19 9, 16 14 Z" fill="url(#loc_d)" stroke="#A04A6E" stroke-width="0.7"/>'
        '<ellipse cx="11" cy="14" rx="1.6" ry="2.3" fill="#FFFFFF" opacity="0.7"/>'
        f'<circle cx="20" cy="20" r="0.7" fill="#FFFFFF">{SHIMMER}</circle>'
    )
    locket_sparkle = (
        '<path d="M 16 12 C 13 7, 4 9, 4 14 C 4 20, 14 27, 16 28.5 C 18 27, 28 20, 28 14 C 28 9, 19 7, 16 12 Z" fill="url(#loc_l)" stroke="#A04A6E" stroke-width="0.7"/>'
        '<ellipse cx="11" cy="13" rx="2" ry="2.8" fill="#FFFFFF" opacity="0.75"/>'
        '<g transform="translate(22 9)">'
        f'{SHIMMER.replace("</animate>", "/>")}'
        '<rect x="-0.4" y="-2" width="0.8" height="4" fill="#FFFFFF"/>'
        '<rect x="-2" y="-0.4" width="4" height="0.8" fill="#FFFFFF"/>'
        '</g>'
    )
    locket_wait_fixed = (
        '<line x1="16" y1="3" x2="16" y2="7.5" stroke="#7A4A6A" stroke-width="0.7"/>'
        '<circle cx="16" cy="6" r="1.4" fill="none" stroke="#7A4A6A" stroke-width="0.7"/>'
        f'<g>{BOB}'
        '<path d="M 16 16 C 13 11.5, 8 14, 8 19 C 8 22.5, 12.5 25, 16 27 C 19.5 25, 24 22.5, 24 19 C 24 14, 19 11.5, 16 16 Z" fill="url(#loc_fix)" stroke="#7A4A6A" stroke-width="0.7"/>'
        '<line x1="16" y1="16" x2="16" y2="27" stroke="#7A4A6A" stroke-width="0.4" opacity="0.55"/>'
        f'<path d="M 16 18 C 14.5 15.5, 11.5 16.5, 11.5 19 C 11.5 21, 14 23, 16 24 C 18 23, 20.5 21, 20.5 19 C 20.5 16.5, 17.5 15.5, 16 18 Z" fill="#FF6E96"><animate attributeName="opacity" values="0.6;1;0.6" dur="1.2s" repeatCount="indefinite"/></path>'
        '<ellipse cx="13" cy="16.5" rx="1.5" ry="2.2" fill="#FFFFFF" opacity="0.8"/>'
        '</g>'
    )
    defs = (lin("loc_d", [(0, "#FFD8E5"), (100, "#FF6E96")]) +
            lin("loc_l", [(0, "#FFE5EC"), (100, "#FF8FA8")]) +
            lin("loc_fix", [(0, "#FFE8F0"), (50, "#E8C8D8"), (100, "#A88498")]))
    e_def = svg(locket, defs)
    e_ptr = svg(locket_sparkle, defs)
    e_wait = svg(locket_wait_fixed, defs)
    txt = ibeam("#E84A85")
    p_defs = lin("loc_pt", [(0, "#FFD8E5"), (100, "#FF8FA8")])
    rad_shine = rad("loc_shine", [(0, "#FFFFFF"), (100, "#E0CCD8")])
    p_def = svg(
        '<path d="M 8 8 L 8 24 L 11.5 20.5 L 14 26 L 16.5 25 L 14 19.5 L 19 19.5 Z" fill="url(#loc_pt)" stroke="#A04A6E" stroke-width="0.7" stroke-linejoin="round"/>'
        '<g transform="translate(7 5)">'
        '<path d="M 0 1 C -1 -1.5, -3.2 -1.2, -3.2 1.2 C -3.2 3.2, 0 5.5, 0 5.5 C 0 5.5, 3.2 3.2, 3.2 1.2 C 3.2 -1.2, 1 -1.5, 0 1 Z" fill="url(#loc_shine)" stroke="#A04A6E" stroke-width="0.5"/>'
        '<circle cx="0" cy="2" r="0.7" fill="#FF8FA8"/>'
        '</g>',
        p_defs + rad_shine
    )
    p_ptr = hand_grad("loc_pt", p_defs, "#A04A6E")
    p_wait = svg(locket_wait_fixed, defs)
    write_pack("heart-locket", e_def, e_ptr, txt, e_wait, p_def, p_ptr, txt, p_wait)


def _butterfly(x, y, scale=1.0, delay="0s"):
    """Single butterfly group with wing flutter animation."""
    s = scale
    body = (
        f'<g transform="translate({x} {y})">'
        f'<g><animateTransform attributeName="transform" type="scale" values="1 1; 0.5 1; 1 1" dur="0.45s" begin="{delay}" repeatCount="indefinite" additive="sum"/>'
        f'<line x1="0" y1="{-1.5*s:.2f}" x2="0" y2="{2*s:.2f}" stroke="#5A3A4A" stroke-width="{0.45*s:.2f}"/>'
        f'<ellipse cx="{-2*s:.2f}" cy="{-0.8*s:.2f}" rx="{2.2*s:.2f}" ry="{1.7*s:.2f}" fill="#FFB8D5" stroke="#A04A6E" stroke-width="{0.35*s:.2f}"/>'
        f'<ellipse cx="{2*s:.2f}" cy="{-0.8*s:.2f}" rx="{2.2*s:.2f}" ry="{1.7*s:.2f}" fill="#FFB8D5" stroke="#A04A6E" stroke-width="{0.35*s:.2f}"/>'
        f'<ellipse cx="{-1.6*s:.2f}" cy="{1.4*s:.2f}" rx="{1.5*s:.2f}" ry="{1*s:.2f}" fill="#FFB8D5" stroke="#A04A6E" stroke-width="{0.35*s:.2f}"/>'
        f'<ellipse cx="{1.6*s:.2f}" cy="{1.4*s:.2f}" rx="{1.5*s:.2f}" ry="{1*s:.2f}" fill="#FFB8D5" stroke="#A04A6E" stroke-width="{0.35*s:.2f}"/>'
        f'<ellipse cx="{-2*s:.2f}" cy="{-0.8*s:.2f}" rx="{0.9*s:.2f}" ry="{0.7*s:.2f}" fill="#FF5BAA"/>'
        f'<ellipse cx="{2*s:.2f}" cy="{-0.8*s:.2f}" rx="{0.9*s:.2f}" ry="{0.7*s:.2f}" fill="#FF5BAA"/>'
        f'<circle cx="0" cy="{-1.7*s:.2f}" r="{0.4*s:.2f}" fill="#5A3A4A"/>'
        '</g></g>'
    )
    return body


def gen_cyber_butterfly():
    """Cyber Butterfly (나비) — small heart cursor + 3 fluttering pink butterflies."""
    heart_with_butterflies = (
        '<path d="M 8 7 C 6 4, 2 5, 2 8 C 2 11, 6 14, 8 15 C 10 14, 14 11, 14 8 C 14 5, 10 4, 8 7 Z" fill="url(#bfly_h)" stroke="#A04A6E" stroke-width="0.6"/>'
        '<ellipse cx="5" cy="7" rx="1" ry="1.5" fill="#FFFFFF" opacity="0.7"/>'
        + _butterfly(22, 8, scale=1.0, delay="0s")
        + _butterfly(25, 17, scale=1.0, delay="0.15s")
        + _butterfly(22, 25, scale=0.85, delay="0.3s")
    )
    big_butterfly = (
        '<g transform="translate(16 16)">'
        '<g><animateTransform attributeName="transform" type="scale" values="1 1; 0.5 1; 1 1" dur="0.45s" repeatCount="indefinite" additive="sum"/>'
        '<line x1="0" y1="-7" x2="0" y2="9" stroke="#5A3A4A" stroke-width="0.7"/>'
        '<ellipse cx="-5.5" cy="-3" rx="5" ry="4" fill="#FFB8D5" stroke="#A04A6E" stroke-width="0.6"/>'
        '<ellipse cx="5.5" cy="-3" rx="5" ry="4" fill="#FFB8D5" stroke="#A04A6E" stroke-width="0.6"/>'
        '<ellipse cx="-4.5" cy="5" rx="3.5" ry="2.6" fill="#FFB8D5" stroke="#A04A6E" stroke-width="0.6"/>'
        '<ellipse cx="4.5" cy="5" rx="3.5" ry="2.6" fill="#FFB8D5" stroke="#A04A6E" stroke-width="0.6"/>'
        '<ellipse cx="-5.5" cy="-3" rx="2.2" ry="1.7" fill="#FF5BAA"/>'
        '<ellipse cx="5.5" cy="-3" rx="2.2" ry="1.7" fill="#FF5BAA"/>'
        '<circle cx="-5.5" cy="-3.5" r="0.7" fill="#FFFFFF" opacity="0.8"/>'
        '<circle cx="5.5" cy="-3.5" r="0.7" fill="#FFFFFF" opacity="0.8"/>'
        '<circle cx="0" cy="-7" r="0.6" fill="#5A3A4A"/>'
        '</g></g>'
    )
    butterfly_orbit = (
        f'<g>{SPIN_SLOW}'
        + _butterfly(16, 8, scale=1.05, delay="0s")
        + _butterfly(9, 22, scale=1.05, delay="0.18s")
        + _butterfly(23, 22, scale=1.05, delay="0.36s")
        + '</g>'
    )
    defs = lin("bfly_h", [(0, "#FFD8E5"), (100, "#FF8FB8")])
    e_def = svg(heart_with_butterflies, defs)
    e_ptr = svg(big_butterfly)
    e_wait = svg(butterfly_orbit)
    txt = ibeam("#FF5BAA")
    p_defs = lin("bfly_pt", [(0, "#FFE8F4"), (100, "#FFB8D5")])
    p_def = svg(
        f'<path d="{ARROW}" fill="url(#bfly_pt)" stroke="#A04A6E" stroke-width="0.6" stroke-linejoin="round"/>'
        '<ellipse cx="6.5" cy="6" rx="0.6" ry="1.8" fill="#FFFFFF" opacity="0.7"/>'
        + _butterfly(22, 9, scale=0.95, delay="0s")
        + _butterfly(25, 22, scale=0.85, delay="0.2s"),
        p_defs
    )
    p_ptr = hand_grad("bfly_pt", p_defs, "#A04A6E")
    p_wait = svg(butterfly_orbit)
    write_pack("cyber-butterfly", e_def, e_ptr, txt, e_wait, p_def, p_ptr, txt, p_wait)


# ── Run ────────────────────────────────────────────────────────────────────────

PACKS = ["honey-bunny", "cyworld-dotti", "coquette-ribbon", "strawberry-milk",
         "glossy-pearl", "bubble-boba", "phone-charm", "heart-locket", "cyber-butterfly"]


def generate():
    gen_honey_bunny()
    gen_cyworld_dotti()
    gen_coquette_ribbon()
    gen_strawberry_milk()
    gen_glossy_pearl()
    gen_bubble_boba()
    gen_phone_charm()
    gen_heart_locket()
    gen_cyber_butterfly()
    total = 0
    for pack in PACKS:
        for variant in ("emoji", "pointer"):
            folder = os.path.join(BASE, f"{pack}-{variant}")
            files = sorted(f for f in os.listdir(folder) if f.endswith(".svg"))
            total += len(files)
            print(f"  ✓ {pack}-{variant}: {files}")
    print(f"\n✨ {total} SVG cursor files generated across {len(PACKS) * 2} pack variants")


if __name__ == "__main__":
    generate()
