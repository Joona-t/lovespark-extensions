#!/usr/bin/env python3
"""Generate 28 SVG cursor files for LoveSpark Retro Cursor Pack v1.1.0.
7 themes × 4 states = 28 files.
Run from anywhere — writes to cursors/<theme>/ relative to this script's directory.
"""
import os, math

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cursors")

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
ANGULAR = "M4,2 L4,20 L7.5,16 L11,25 L14,23 L11,15 L17.5,15 Z"   # Cyber Cherry

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
    ('9.5', '2',  '4',    '15', '2'),      # index finger (pointing)
    ('13.5','8',  '3.5',  '10', '1.75'),   # middle finger
    ('17',  '9',  '3',    '9',  '1.5'),    # ring finger
    ('6',   '14', '3.5',  '8',  '1.75'),   # thumb
    ('6',   '15', '17.5', '13', '3'),      # palm
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

def wait_moonlight():
    """Crescent moon + star dots"""
    body = (
        '<rect width="32" height="32" rx="4" fill="#0a0a2e" opacity="0.85"/>'
        '<circle cx="15" cy="16" r="10" fill="#c2185b"/>'
        '<circle cx="19" cy="13" r="8"  fill="#0a0a2e"/>'   # bite out the crescent
        '<circle cx="8"  cy="7"  r="1.2" fill="#f48fb1" opacity="0.85"/>'
        '<circle cx="27" cy="10" r="0.8" fill="#f48fb1" opacity="0.65"/>'
        '<circle cx="23" cy="26" r="0.9" fill="#f48fb1" opacity="0.5"/>'
    )
    return svg(body)

def wait_candy():
    """4-petal pastel swirl — cotton candy"""
    body = (
        '<ellipse cx="16" cy="10" rx="4.5" ry="7"   fill="#ffb6c1" opacity="0.92"/>'
        '<ellipse cx="22" cy="16" rx="7"   ry="4.5" fill="#e1bee7" opacity="0.92"/>'
        '<ellipse cx="16" cy="22" rx="4.5" ry="7"   fill="#bbdefb" opacity="0.92"/>'
        '<ellipse cx="10" cy="16" rx="7"   ry="4.5" fill="#c8e6c9" opacity="0.92"/>'
        '<circle  cx="16" cy="16" r="3.5"            fill="#fff"    opacity="0.80"/>'
    )
    return svg(body)

def wait_cherry():
    """Cherry with stems — Cyber Cherry theme"""
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
    """5-petal mint flower"""
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
    """Golden sun with rays"""
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
    """Holographic spinner ring — static iridescent arc"""
    defs = grad4("ho_wg", [(0,"#ff6eb4"),(33,"#c084fc"),(66,"#818cf8"),(100,"#5eead4")])
    body = (
        '<circle cx="16" cy="16" r="11" fill="none" stroke="url(#ho_wg)" '
        'stroke-width="6" stroke-dasharray="52 18" stroke-linecap="round"/>'
        '<circle cx="16" cy="16" r="4" fill="url(#ho_wg)" opacity="0.45"/>'
    )
    return svg(body, defs)

def wait_obsidian():
    """Glowing pink heart on black — Obsidian Heart"""
    heart = ("M16,21 C13,18 7,15 7,11 C7,8 9,6.5 11,6.5 "
             "C13,6.5 14.5,8 16,10 C17.5,8 19,6.5 21,6.5 "
             "C23,6.5 25,8 25,11 C25,15 19,18 16,21 Z")
    defs = glowf("oh_wg", 4, "#ff1744", 0.9)
    body = (
        '<rect width="32" height="32" rx="4" fill="#0a0a0a"/>'
        f'<path d="{heart}" fill="#c2185b" stroke="#ff1744" stroke-width="1" filter="url(#oh_wg)"/>'
    )
    return svg(body, defs)

# ── Write helpers ──────────────────────────────────────────────────────────────

def write(theme, filename, content):
    path = os.path.join(BASE, theme, filename)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "w", encoding="utf-8") as f:
        f.write(content)
    return path

# ── Generate all 28 files ──────────────────────────────────────────────────────

def generate():
    # ── 1. MOONLIGHT ROSE ────────────────────────────────────────────────────
    t = "moonlight-rose"
    d_arrow = grad2("mr_ag", "#c2185b", "#f48fb1") + glowf("mr_glow", 3, "#f48fb1", 0.8)
    write(t, "default.svg", arrow_grad("mr_ag", "#0a0a2e", d_arrow, filt="mr_glow"))

    d_hand = grad2("mr_hg", "#c2185b", "#f48fb1") + glowf("mr_hglow", 2, "#f48fb1", 0.65)
    write(t, "pointer.svg", hand_grad("mr_hg", "#0a0a2e", d_hand, filt="mr_hglow"))

    write(t, "text.svg",    ibeam("#c2185b"))
    write(t, "wait.svg",    wait_moonlight())

    # ── 2. CANDY FLOSS ───────────────────────────────────────────────────────
    t = "candy-floss"
    d_cf = grad4("cf_ag", [(0,"#ffb6c1"),(33,"#e1bee7"),(66,"#bbdefb"),(100,"#c8e6c9")],
                 x1=0, y1=0, x2=100, y2=100)
    write(t, "default.svg", arrow_grad("cf_ag", "#c9a0d4", d_cf))
    write(t, "pointer.svg", hand_grad("cf_ag", "#c9a0d4", d_cf))

    d_cfi = grad2("cf_ig", "#ffb6c1", "#bbdefb", x1=0, y1=0, x2=0, y2=100)
    write(t, "text.svg",    ibeam_grad("cf_ig", d_cfi))
    write(t, "wait.svg",    wait_candy())

    # ── 3. CYBER CHERRY ──────────────────────────────────────────────────────
    t = "cyber-cherry"
    d_cc = grad2("cc_ag", "#d50000", "#ff69b4", x1=0, y1=0, x2=100, y2=0)  # horizontal
    write(t, "default.svg", arrow_grad("cc_ag", "#1a0000", d_cc, path=ANGULAR))
    write(t, "pointer.svg", hand_grad("cc_ag", "#1a0000", d_cc))
    write(t, "text.svg",    ibeam("#d50000"))
    write(t, "wait.svg",    wait_cherry())

    # ── 4. MINT BLOSSOM ──────────────────────────────────────────────────────
    t = "mint-blossom"
    d_mb = grad2("mb_ag", "#a5d6a7", "#ffffff", x1=0, y1=0, x2=100, y2=100)
    write(t, "default.svg", arrow_grad("mb_ag", "#80cbc4", d_mb))
    write(t, "pointer.svg", hand_solid("#a5d6a7", "#80cbc4", sparkle="#f48fb1"))
    write(t, "text.svg",    ibeam("#80cbc4"))
    write(t, "wait.svg",    wait_flower())

    # ── 5. GOLDEN HOUR ───────────────────────────────────────────────────────
    t = "golden-hour"
    d_gh = grad2("gh_ag", "#ffab91", "#ffd54f") + glowf("gh_glow", 2.5, "#ffd54f", 0.65)
    write(t, "default.svg", arrow_grad("gh_ag", "#ff8a65", d_gh, filt="gh_glow"))
    write(t, "pointer.svg", hand_solid("#ffd54f", "#ff8a65"))
    write(t, "text.svg",    ibeam("#ff8a65"))
    write(t, "wait.svg",    wait_sun())

    # ── 6. HOLOGRAPHIC ───────────────────────────────────────────────────────
    t = "holographic"
    # NOTE: SVG gradient animations don't work in cursor context — static mid-shift
    d_ho = grad4("ho_ag", [(0,"#ff6eb4"),(33,"#c084fc"),(66,"#818cf8"),(100,"#5eead4")],
                 x1=0, y1=0, x2=100, y2=100)
    write(t, "default.svg", arrow_grad("ho_ag", "#c084fc", d_ho))
    write(t, "pointer.svg", hand_grad("ho_ag", "#c084fc", d_ho))

    d_hoi = grad4("ho_ig", [(0,"#ff6eb4"),(50,"#818cf8"),(100,"#5eead4")],
                  x1=0, y1=0, x2=0, y2=100)
    write(t, "text.svg",    ibeam_grad("ho_ig", d_hoi))
    write(t, "wait.svg",    wait_holo())

    # ── 7. OBSIDIAN HEART ────────────────────────────────────────────────────
    t = "obsidian-heart"
    d_oh = glowf("oh_glow", 3, "#ff1744", 0.9)
    write(t, "default.svg", arrow_solid("#1a1a1a", "#c2185b", d_oh, filt="oh_glow"))
    write(t, "pointer.svg", hand_solid("#1a1a1a", "#c2185b", d_oh, filt="oh_glow"))
    write(t, "text.svg",    ibeam("#c2185b"))
    write(t, "wait.svg",    wait_obsidian())

    # ── Summary ───────────────────────────────────────────────────────────────
    themes = ["moonlight-rose","candy-floss","cyber-cherry","mint-blossom",
              "golden-hour","holographic","obsidian-heart"]
    total = 0
    for theme in themes:
        files = sorted(os.listdir(os.path.join(BASE, theme)))
        svg_files = [f for f in files if f.endswith(".svg")]
        total += len(svg_files)
        print(f"  ✓ {theme}: {svg_files}")
    print(f"\n✨ {total} SVG cursor files generated across {len(themes)} themes")

generate()
