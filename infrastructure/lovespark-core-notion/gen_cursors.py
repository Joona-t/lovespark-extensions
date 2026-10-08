#!/usr/bin/env python3
"""Generate themes.js for LoveSpark Core — Cursor Pack module.

10 themes × 4 states = 40 inline SVG data URIs, percent-encoded.
Reuses shape primitives from LoveSpark-Retro-Cursor/gen_cursors.py.

Run from anywhere — writes modules/cursor-pack/themes.js relative to this script.
"""
import os, math
from urllib.parse import quote

BASE = os.path.dirname(os.path.abspath(__file__))
OUTPUT = os.path.join(BASE, "modules", "cursor-pack", "themes.js")

# ── SVG helpers ────────────────────────────────────────────────────────────────

def svg(body, defs=""):
    d = f"<defs>{defs}</defs>" if defs else ""
    return (f'<svg xmlns="http://www.w3.org/2000/svg" '
            f'viewBox="0 0 32 32" width="32" height="32">{d}{body}</svg>')

def grad2(gid, c1, c2, x1=0, y1=0, x2=0, y2=100):
    return (f'<linearGradient id="{gid}" x1="{x1}%" y1="{y1}%" x2="{x2}%" y2="{y2}%">'
            f'<stop offset="0%" stop-color="{c1}"/>'
            f'<stop offset="100%" stop-color="{c2}"/>'
            f'</linearGradient>')

def grad4(gid, stops, x1=0, y1=0, x2=100, y2=100):
    els = "".join(f'<stop offset="{p}%" stop-color="{c}"/>' for p, c in stops)
    return f'<linearGradient id="{gid}" x1="{x1}%" y1="{y1}%" x2="{x2}%" y2="{y2}%">{els}</linearGradient>'

def glowf(fid, blur, color, opacity=0.85):
    return (f'<filter id="{fid}" x="-50%" y="-50%" width="200%" height="200%">'
            f'<feDropShadow dx="0" dy="0" stdDeviation="{blur}" '
            f'flood-color="{color}" flood-opacity="{opacity}"/></filter>')

# ── Cursor shapes ──────────────────────────────────────────────────────────────

ARROW   = "M4,2 L4,22 L7,18 L10,26 L13,24.5 L10,16.5 L16.5,16.5 Z"
ANGULAR = "M4,2 L4,20 L7.5,16 L11,25 L14,23 L11,15 L17.5,15 Z"

def arrow_solid(fill, stroke, extra_defs="", filt=""):
    fa = f' filter="url(#{filt})"' if filt else ""
    body = (f'<path d="{ARROW}" fill="{fill}" stroke="{stroke}" '
            f'stroke-width="1.2" stroke-linejoin="round"{fa}/>')
    return svg(body, extra_defs)

def arrow_grad(gid, stroke, extra_defs="", filt="", path=ARROW):
    fa = f' filter="url(#{filt})"' if filt else ""
    body = (f'<path d="{path}" fill="url(#{gid})" stroke="{stroke}" '
            f'stroke-width="1.2" stroke-linejoin="round"{fa}/>')
    return svg(body, extra_defs)

# Hand rects — finger + palm
_HAND_RECTS = [
    ('9.5', '2',  '4',    '15', '2'),
    ('13.5','8',  '3.5',  '10', '1.75'),
    ('17',  '9',  '3',    '9',  '1.5'),
    ('6',   '14', '3.5',  '8',  '1.75'),
    ('6',   '15', '17.5', '13', '3'),
]

def _hand_body(fill_attr, stroke, filt="", sparkle=None):
    fa = f' filter="url(#{filt})"' if filt else ""
    rects = "".join(
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" '
        f'fill="{fill_attr}" stroke="{stroke}" stroke-width="1"/>'
        for x, y, w, h, r in _HAND_RECTS
    )
    body = f'<g{fa}>{rects}</g>'
    if sparkle:
        body += (f'<circle cx="11.5" cy="2.5" r="1.5" fill="{sparkle}"/>'
                 f'<circle cx="9.5"  cy="4.5" r="1"   fill="{sparkle}" opacity="0.75"/>')
    return body

def hand_solid(fill, stroke, extra_defs="", filt="", sparkle=None):
    return svg(_hand_body(fill, stroke, filt, sparkle), extra_defs)

def hand_grad(gid, stroke, extra_defs="", filt=""):
    fa = f' filter="url(#{filt})"' if filt else ""
    rects = "".join(
        f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" '
        f'fill="url(#{gid})" stroke="{stroke}" stroke-width="1"/>'
        for x, y, w, h, r in _HAND_RECTS
    )
    return svg(f'<g{fa}>{rects}</g>', extra_defs)

def ibeam(color):
    body = (f'<rect x="12"   y="4"    width="8" height="2.5" rx="1.25" fill="{color}"/>'
            f'<rect x="15.5" y="6.5"  width="1" height="19"  rx="0.5"  fill="{color}"/>'
            f'<rect x="12"   y="25.5" width="8" height="2.5" rx="1.25" fill="{color}"/>')
    return svg(body)

def ibeam_grad(gid, extra_defs):
    body = (f'<rect x="12"   y="4"    width="8" height="2.5" rx="1.25" fill="url(#{gid})"/>'
            f'<rect x="15.5" y="6.5"  width="1" height="19"  rx="0.5"  fill="url(#{gid})"/>'
            f'<rect x="12"   y="25.5" width="8" height="2.5" rx="1.25" fill="url(#{gid})"/>')
    return svg(body, extra_defs)

# ── Wait cursors ───────────────────────────────────────────────────────────────

def wait_sparkle(color1, color2):
    """4-point sparkle — generic wait for simple themes"""
    body = (
        f'<path d="M16,2 L17,13 L28,16 L17,19 L16,30 L15,19 L4,16 L15,13 Z" '
        f'fill="{color1}" opacity="0.9"/>'
        f'<circle cx="16" cy="16" r="3" fill="{color2}" opacity="0.85"/>'
        f'<circle cx="8" cy="8" r="1.3" fill="{color2}" opacity="0.55"/>'
        f'<circle cx="24" cy="24" r="1" fill="{color2}" opacity="0.45"/>'
    )
    return svg(body)

def wait_moonlight():
    body = (
        '<rect width="32" height="32" rx="4" fill="#0a0a2e" opacity="0.85"/>'
        '<circle cx="15" cy="16" r="10" fill="#c2185b"/>'
        '<circle cx="19" cy="13" r="8"  fill="#0a0a2e"/>'
        '<circle cx="8"  cy="7"  r="1.2" fill="#f48fb1" opacity="0.85"/>'
        '<circle cx="27" cy="10" r="0.8" fill="#f48fb1" opacity="0.65"/>'
        '<circle cx="23" cy="26" r="0.9" fill="#f48fb1" opacity="0.5"/>'
    )
    return svg(body)

def wait_candy():
    body = (
        '<ellipse cx="16" cy="10" rx="4.5" ry="7"   fill="#ffb6c1" opacity="0.92"/>'
        '<ellipse cx="22" cy="16" rx="7"   ry="4.5" fill="#e1bee7" opacity="0.92"/>'
        '<ellipse cx="16" cy="22" rx="4.5" ry="7"   fill="#bbdefb" opacity="0.92"/>'
        '<ellipse cx="10" cy="16" rx="7"   ry="4.5" fill="#c8e6c9" opacity="0.92"/>'
        '<circle  cx="16" cy="16" r="3.5"            fill="#fff"    opacity="0.80"/>'
    )
    return svg(body)

def wait_cherry():
    heart = ("M16,21 C13,18 7,15 7,11 C7,8 9,6.5 11,6.5 "
             "C13,6.5 14.5,8 16,10 C17.5,8 19,6.5 21,6.5 "
             "C23,6.5 25,8 25,11 C25,15 19,18 16,21 Z")
    defs = grad2("cc_wg", "#d50000", "#ff69b4", x1=0, y1=0, x2=100, y2=100)
    body = (
        '<rect width="32" height="32" rx="3" fill="#1a0000"/>'
        f'<path d="{heart}" fill="url(#cc_wg)" stroke="#ff1744" stroke-width="0.8"/>'
        '<line x1="14" y1="6.5" x2="12" y2="3" stroke="#4caf50" stroke-width="1.2" stroke-linecap="round"/>'
        '<line x1="18" y1="6.5" x2="20" y2="3" stroke="#4caf50" stroke-width="1.2" stroke-linecap="round"/>'
        '<line x1="12" y1="3"   x2="20" y2="3" stroke="#4caf50" stroke-width="1.2" stroke-linecap="round"/>'
    )
    return svg(body, defs)

def wait_flower():
    petals = []
    for i in range(5):
        a = i * 72 - 90
        r = math.radians(a)
        cx, cy = 16 + 7 * math.cos(r), 16 + 7 * math.sin(r)
        petals.append(
            f'<ellipse cx="{cx:.1f}" cy="{cy:.1f}" rx="3.5" ry="5.5" '
            f'fill="#a5d6a7" opacity="0.9" transform="rotate({a},{cx:.1f},{cy:.1f})"/>'
        )
    body = "".join(petals) + '<circle cx="16" cy="16" r="4.5" fill="#f48fb1"/>'
    return svg(body)

def wait_sun():
    defs = grad2("gh_wg", "#ffd54f", "#ffab91")
    rays = []
    for i in range(8):
        r = math.radians(i * 45)
        x1, y1 = 16 + 11 * math.cos(r), 16 + 11 * math.sin(r)
        x2, y2 = 16 + 14.5 * math.cos(r), 16 + 14.5 * math.sin(r)
        rays.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" '
                    f'stroke="#ff8a65" stroke-width="2" stroke-linecap="round"/>')
    body = ("".join(rays) +
            '<circle cx="16" cy="16" r="9" fill="url(#gh_wg)" stroke="#ff8a65" stroke-width="1.5"/>')
    return svg(body, defs)

def wait_holo():
    defs = grad4("ho_wg", [(0,"#ff6eb4"),(33,"#c084fc"),(66,"#818cf8"),(100,"#5eead4")])
    body = (
        '<circle cx="16" cy="16" r="11" fill="none" stroke="url(#ho_wg)" '
        'stroke-width="6" stroke-dasharray="52 18" stroke-linecap="round"/>'
        '<circle cx="16" cy="16" r="4" fill="url(#ho_wg)" opacity="0.45"/>'
    )
    return svg(body, defs)

def wait_obsidian():
    heart = ("M16,21 C13,18 7,15 7,11 C7,8 9,6.5 11,6.5 "
             "C13,6.5 14.5,8 16,10 C17.5,8 19,6.5 21,6.5 "
             "C23,6.5 25,8 25,11 C25,15 19,18 16,21 Z")
    defs = glowf("oh_wg", 4, "#ff1744", 0.9)
    body = (
        '<rect width="32" height="32" rx="4" fill="#0a0a0a"/>'
        f'<path d="{heart}" fill="#c2185b" stroke="#ff1744" stroke-width="1" filter="url(#oh_wg)"/>'
    )
    return svg(body, defs)

# ── Encoding ───────────────────────────────────────────────────────────────────

def svg_to_data_uri(svg_string):
    encoded = quote(svg_string.strip(), safe="")
    return f"data:image/svg+xml;charset=utf-8,{encoded}"

# ── Theme definitions ──────────────────────────────────────────────────────────

def build_all_themes():
    themes = {}

    # 1. RETRO PINK (new SVG version of the original PNG theme)
    d = grad2("rp_ag", "#ff69b4", "#ffb6c1") + glowf("rp_glow", 2.5, "#ff69b4", 0.7)
    themes["retro-pink"] = {
        "default": arrow_grad("rp_ag", "#d63384", d, filt="rp_glow"),
        "pointer": hand_grad("rp_ag", "#d63384", d, filt="rp_glow"),
        "text":    ibeam("#ff69b4"),
        "wait":    wait_sparkle("#ff69b4", "#ffb6c1"),
    }

    # 2. SAKURA PEACH
    d = grad2("sp_ag", "#ffd7b0", "#ffb6c1") + glowf("sp_glow", 2, "#ffb6c1", 0.6)
    themes["sakura-peach"] = {
        "default": arrow_grad("sp_ag", "#f4a0b0", d, filt="sp_glow"),
        "pointer": hand_grad("sp_ag", "#f4a0b0", d, filt="sp_glow"),
        "text":    ibeam("#f4a0b0"),
        "wait":    wait_sparkle("#ffd7b0", "#ffb6c1"),
    }

    # 3. STARLIGHT PURPLE
    d = grad2("sl_ag", "#c39bd3", "#9b59b6") + glowf("sl_glow", 2.5, "#c39bd3", 0.7)
    themes["starlight-purple"] = {
        "default": arrow_grad("sl_ag", "#7d3c98", d, filt="sl_glow"),
        "pointer": hand_grad("sl_ag", "#7d3c98", d, filt="sl_glow"),
        "text":    ibeam("#9b59b6"),
        "wait":    wait_sparkle("#c39bd3", "#9b59b6"),
    }

    # 4. MOONLIGHT ROSE
    d = grad2("mr_ag", "#c2185b", "#f48fb1") + glowf("mr_glow", 3, "#f48fb1", 0.8)
    themes["moonlight-rose"] = {
        "default": arrow_grad("mr_ag", "#0a0a2e", d, filt="mr_glow"),
        "pointer": hand_grad("mr_ag", "#0a0a2e",
                             grad2("mr_hg", "#c2185b", "#f48fb1") + glowf("mr_hglow", 2, "#f48fb1", 0.65),
                             filt="mr_hglow"),
        "text":    ibeam("#c2185b"),
        "wait":    wait_moonlight(),
    }

    # 5. CANDY FLOSS
    d_cf = grad4("cf_ag", [(0,"#ffb6c1"),(33,"#e1bee7"),(66,"#bbdefb"),(100,"#c8e6c9")],
                 x1=0, y1=0, x2=100, y2=100)
    themes["candy-floss"] = {
        "default": arrow_grad("cf_ag", "#c9a0d4", d_cf),
        "pointer": hand_grad("cf_ag", "#c9a0d4", d_cf),
        "text":    ibeam_grad("cf_ig", grad2("cf_ig", "#ffb6c1", "#bbdefb", x1=0, y1=0, x2=0, y2=100)),
        "wait":    wait_candy(),
    }

    # 6. CYBER CHERRY
    d_cc = grad2("cc_ag", "#d50000", "#ff69b4", x1=0, y1=0, x2=100, y2=0)
    themes["cyber-cherry"] = {
        "default": arrow_grad("cc_ag", "#1a0000", d_cc, path=ANGULAR),
        "pointer": hand_grad("cc_ag", "#1a0000", d_cc),
        "text":    ibeam("#d50000"),
        "wait":    wait_cherry(),
    }

    # 7. MINT BLOSSOM
    d_mb = grad2("mb_ag", "#a5d6a7", "#ffffff", x1=0, y1=0, x2=100, y2=100)
    themes["mint-blossom"] = {
        "default": arrow_grad("mb_ag", "#80cbc4", d_mb),
        "pointer": hand_solid("#a5d6a7", "#80cbc4", sparkle="#f48fb1"),
        "text":    ibeam("#80cbc4"),
        "wait":    wait_flower(),
    }

    # 8. GOLDEN HOUR
    d_gh = grad2("gh_ag", "#ffab91", "#ffd54f") + glowf("gh_glow", 2.5, "#ffd54f", 0.65)
    themes["golden-hour"] = {
        "default": arrow_grad("gh_ag", "#ff8a65", d_gh, filt="gh_glow"),
        "pointer": hand_solid("#ffd54f", "#ff8a65"),
        "text":    ibeam("#ff8a65"),
        "wait":    wait_sun(),
    }

    # 9. HOLOGRAPHIC
    d_ho = grad4("ho_ag", [(0,"#ff6eb4"),(33,"#c084fc"),(66,"#818cf8"),(100,"#5eead4")],
                 x1=0, y1=0, x2=100, y2=100)
    themes["holographic"] = {
        "default": arrow_grad("ho_ag", "#c084fc", d_ho),
        "pointer": hand_grad("ho_ag", "#c084fc", d_ho),
        "text":    ibeam_grad("ho_ig", grad4("ho_ig", [(0,"#ff6eb4"),(50,"#818cf8"),(100,"#5eead4")],
                              x1=0, y1=0, x2=0, y2=100)),
        "wait":    wait_holo(),
    }

    # 10. OBSIDIAN HEART
    d_oh = glowf("oh_glow", 3, "#ff1744", 0.9)
    themes["obsidian-heart"] = {
        "default": arrow_solid("#1a1a1a", "#c2185b", d_oh, filt="oh_glow"),
        "pointer": hand_solid("#1a1a1a", "#c2185b", d_oh, filt="oh_glow"),
        "text":    ibeam("#c2185b"),
        "wait":    wait_obsidian(),
    }

    return themes

# ── Write themes.js ────────────────────────────────────────────────────────────

def generate():
    themes = build_all_themes()

    lines = ['globalThis.__lovespark = globalThis.__lovespark || {};', '',
             'globalThis.__lovespark.cursorThemes = {']

    theme_names = list(themes.keys())
    for i, name in enumerate(theme_names):
        cursors = themes[name]
        trailing = "," if i < len(theme_names) - 1 else ""
        lines.append(f'  "{name}": {{')
        for j, state in enumerate(["default", "pointer", "text", "wait"]):
            uri = svg_to_data_uri(cursors[state])
            comma = "," if j < 3 else ""
            lines.append(f'    {state}: "{uri}"{comma}')
        lines.append(f'  }}{trailing}')

    lines.append('};')
    lines.append('')

    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))

    total = len(themes) * 4
    size_kb = os.path.getsize(OUTPUT) / 1024
    print(f"  {len(themes)} themes, {total} cursors")
    print(f"  Output: {OUTPUT}")
    print(f"  Size: {size_kb:.1f} KB")

generate()
