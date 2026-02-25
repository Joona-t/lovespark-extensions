#!/usr/bin/env python3
"""
Pink Anti-Doomscroll — generate_icons.py
Generates pink flower/sparkle icons at 16, 48, and 128px using Pillow.

Install dependency:
    pip install Pillow

Run:
    python3 generate_icons.py
"""

import os
import math
from PIL import Image, ImageDraw


# ── Color palette ────────────────────────────────────────────────────────────

HOT_PINK   = (232, 69, 124, 255)    # #E8457C — main accent
LIGHT_PINK = (253, 207, 225, 255)   # #FDCFE1 — petals highlight
DEEP_PINK  = (214, 52, 102, 255)    # #D63466 — petal shadow
GLOW_PINK  = (232, 69, 124, 50)     # soft glow halo
WHITE      = (255, 255, 255, 255)
SPARKLE_PK = (255, 182, 193, 255)   # #FFB6C1 — sparkle accent


def draw_sparkle(draw, cx, cy, r, color, points=4):
    """Draw a multi-point star sparkle at (cx, cy)."""
    pts = []
    for i in range(points * 2):
        angle = math.radians(i * (360 / (points * 2)) - 90)
        radius = r if i % 2 == 0 else r * 0.35
        pts.append((cx + radius * math.cos(angle), cy + radius * math.sin(angle)))
    draw.polygon(pts, fill=color)


def draw_petal(draw, cx, cy, angle_deg, length, width, color):
    """Draw an elongated elliptical petal rotated around center."""
    # Create a petal as a polygon
    rad = math.radians(angle_deg)
    tip_x = cx + length * math.cos(rad)
    tip_y = cy + length * math.sin(rad)

    # Side points perpendicular to petal direction
    perp = math.radians(angle_deg + 90)
    mid_x = cx + length * 0.45 * math.cos(rad)
    mid_y = cy + length * 0.45 * math.sin(rad)

    side1_x = mid_x + width * math.cos(perp)
    side1_y = mid_y + width * math.sin(perp)
    side2_x = mid_x - width * math.cos(perp)
    side2_y = mid_y - width * math.sin(perp)

    draw.polygon([(cx, cy), (side1_x, side1_y), (tip_x, tip_y),
                  (side2_x, side2_y)], fill=color)


def generate_icon(size):
    """Create a single RGBA icon at the given pixel size."""
    img  = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx, cy = size / 2, size / 2

    # ── Outer glow ────────────────────────────────────────────────────────
    if size >= 48:
        glow_r = size * 0.42
        draw.ellipse(
            [cx - glow_r, cy - glow_r, cx + glow_r, cy + glow_r],
            fill=GLOW_PINK
        )

    # ── Flower petals ─────────────────────────────────────────────────────
    petal_count = 5
    petal_length = size * 0.38
    petal_width = size * 0.16

    for i in range(petal_count):
        angle = (360 / petal_count) * i - 90  # start from top
        # Shadow petal (slightly larger, darker)
        draw_petal(draw, cx, cy, angle, petal_length * 1.02,
                   petal_width * 1.05, DEEP_PINK)
        # Main petal
        draw_petal(draw, cx, cy, angle, petal_length, petal_width, HOT_PINK)

    # ── Highlight petals (lighter, slightly inward) ───────────────────────
    if size >= 48:
        for i in range(petal_count):
            angle = (360 / petal_count) * i - 90
            draw_petal(draw, cx, cy, angle, petal_length * 0.6,
                       petal_width * 0.5, LIGHT_PINK)

    # ── Center circle ─────────────────────────────────────────────────────
    center_r = size * 0.12
    draw.ellipse(
        [cx - center_r, cy - center_r, cx + center_r, cy + center_r],
        fill=WHITE
    )

    # Inner center dot
    inner_r = center_r * 0.45
    draw.ellipse(
        [cx - inner_r, cy - inner_r, cx + inner_r, cy + inner_r],
        fill=HOT_PINK
    )

    # ── Sparkle accents ───────────────────────────────────────────────────
    if size >= 48:
        sp_r = size * 0.06
        sp_cx = cx + size * 0.32
        sp_cy = cy - size * 0.32
        draw_sparkle(draw, sp_cx, sp_cy, sp_r, SPARKLE_PK, points=4)

    if size >= 128:
        draw_sparkle(draw, cx - size * 0.28, cy - size * 0.34,
                     size * 0.04, SPARKLE_PK, points=4)

    return img


def main():
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'icons')
    os.makedirs(out_dir, exist_ok=True)

    sizes = [16, 48, 128]
    for size in sizes:
        img  = generate_icon(size)
        path = os.path.join(out_dir, f'icon-{size}.png')
        img.save(path, 'PNG', optimize=True)
        print(f'  Generated {path}  ({size}x{size})')

    print('\nDone! Icons saved to icons/')


if __name__ == '__main__':
    main()
