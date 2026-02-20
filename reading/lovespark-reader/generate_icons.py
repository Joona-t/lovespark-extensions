#!/usr/bin/env python3
"""
LoveSpark Reader — generate_icons.py
Generates sakura blossom icons at 16, 48, and 128px using Pillow.

Install: pip install Pillow
Run:     python3 generate_icons.py
"""

import os
import math
from PIL import Image, ImageDraw, ImageFilter

# ── Palette ────────────────────────────────────────────────────────────────
PETAL_OUTER  = (255, 105, 180, 230)   # hot pink, slightly transparent
PETAL_INNER  = (255, 182, 193, 200)   # light pink highlight
PETAL_EDGE   = (220, 60, 130, 180)    # deeper pink edge
CENTER_GOLD  = (255, 210, 80, 255)    # gold center
CENTER_RING  = (255, 140, 0, 180)     # amber ring around center


def draw_petal(size, cx, cy, angle_deg, petal_w, petal_h, offset):
    """
    Draw a single rounded petal on a transparent canvas,
    rotated by angle_deg around (cx, cy).
    Returns a composited RGBA image.
    """
    layer = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw  = ImageDraw.Draw(layer)

    # Petal ellipse: centred above (cx, cy) by `offset` pixels
    x0 = cx - petal_w // 2
    y0 = cy - offset - petal_h
    x1 = cx + petal_w // 2
    y1 = cy - offset

    draw.ellipse([x0, y0, x1, y1], fill=PETAL_OUTER)

    # Inner highlight (smaller ellipse, slightly offset upward)
    if size >= 48:
        hx0 = cx - petal_w // 4
        hy0 = y0 + petal_h * 0.12
        hx1 = cx + petal_w // 4
        hy1 = y0 + petal_h * 0.45
        draw.ellipse([hx0, hy0, hx1, hy1], fill=PETAL_INNER)

    return layer.rotate(-angle_deg, center=(cx, cy), resample=Image.BICUBIC)


def make_icon(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    cx  = size / 2
    cy  = size / 2

    # ── Five petals ────────────────────────────────────────────────────────
    petal_w  = max(3, int(size * 0.28))
    petal_h  = max(4, int(size * 0.38))
    offset   = max(1, int(size * 0.06))   # tiny gap between center and petal

    for i in range(5):
        angle  = i * 72
        petal  = draw_petal(size, int(cx), int(cy), angle, petal_w, petal_h, offset)
        img    = Image.alpha_composite(img, petal)

    # ── Soft shadow under petals ───────────────────────────────────────────
    if size >= 48:
        shadow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        sdraw  = ImageDraw.Draw(shadow)
        sr     = int(size * 0.18)
        sdraw.ellipse(
            [cx - sr + 2, cy - sr + 2, cx + sr + 2, cy + sr + 2],
            fill=(80, 0, 40, 60)
        )
        shadow = shadow.filter(ImageFilter.GaussianBlur(radius=max(2, size // 24)))
        img    = Image.alpha_composite(img, shadow)

    # ── Gold center ────────────────────────────────────────────────────────
    draw  = ImageDraw.Draw(img)
    cr    = max(2, int(size * 0.14))

    # Outer amber ring
    draw.ellipse(
        [cx - cr - 1, cy - cr - 1, cx + cr + 1, cy + cr + 1],
        fill=CENTER_RING
    )
    # Gold centre
    draw.ellipse(
        [cx - cr, cy - cr, cx + cr, cy + cr],
        fill=CENTER_GOLD
    )
    # Tiny white specular highlight
    if size >= 48:
        hr = max(1, cr // 3)
        draw.ellipse(
            [cx - hr - cr * 0.3, cy - hr - cr * 0.3,
             cx + hr - cr * 0.3, cy + hr - cr * 0.3],
            fill=(255, 255, 255, 200)
        )

    return img


def main():
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'icons')
    os.makedirs(out_dir, exist_ok=True)

    for size in [16, 48, 128]:
        img  = make_icon(size)
        path = os.path.join(out_dir, f'icon-{size}.png')
        img.save(path, 'PNG', optimize=True)
        print(f'  Generated {path}  ({size}×{size})')

    print('\nDone! Icons saved to icons/')


if __name__ == '__main__':
    main()
