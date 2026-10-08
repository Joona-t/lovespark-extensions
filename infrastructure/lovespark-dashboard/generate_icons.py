#!/usr/bin/env python3
"""Generate LoveSpark Dashboard icons at 16, 48, 128px.

Design: Pink heart on dark circle with subtle glow effect.
Primary: #FF6B9D, outline: #FF2D78, background: dark.
"""

import os
import math
from PIL import Image, ImageDraw

PRIMARY = (255, 107, 157, 255)    # #FF6B9D
DEEP    = (255, 45, 120, 255)     # #FF2D78
DARK    = (26, 26, 46, 255)       # #1A1A2E
WHITE   = (255, 255, 255, 255)


def draw_heart(draw, cx, cy, size, color):
    """Draw a filled heart using two circles + triangle."""
    r = size * 0.26
    offset_y = -size * 0.06

    # Left bump
    lx, ly = cx - r * 0.72, cy + offset_y
    draw.ellipse([(lx - r, ly - r), (lx + r, ly + r)], fill=color)

    # Right bump
    rx, ry = cx + r * 0.72, cy + offset_y
    draw.ellipse([(rx - r, ry - r), (rx + r, ry + r)], fill=color)

    # Bottom triangle connecting bumps to point
    draw.polygon([
        (cx - r * 1.72, cy + offset_y + r * 0.35),
        (cx + r * 1.72, cy + offset_y + r * 0.35),
        (cx, cy + size * 0.42)
    ], fill=color)


def draw_sparkle(draw, cx, cy, size, color):
    """Draw a 4-point sparkle at (cx, cy)."""
    r = size / 2
    thin = size * 0.12
    draw.ellipse([(cx - thin, cy - r), (cx + thin, cy + r)], fill=color)
    draw.ellipse([(cx - r, cy - thin), (cx + r, cy + thin)], fill=color)


def generate_icon(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx, cy = size / 2, size / 2
    margin = size * 0.06

    # Dark circle background
    bg_r = size / 2 - margin
    draw.ellipse([(cx - bg_r, cy - bg_r), (cx + bg_r, cy + bg_r)], fill=DARK)

    # Pink ring
    ring_w = max(1, int(size * 0.04))
    draw.ellipse(
        [(cx - bg_r, cy - bg_r), (cx + bg_r, cy + bg_r)],
        outline=PRIMARY, width=ring_w
    )

    if size <= 16:
        # Simple heart
        draw_heart(draw, cx, cy + 1, size * 0.55, PRIMARY)
    else:
        # Heart with outline
        draw_heart(draw, cx, cy + size * 0.02, size * 0.52, DEEP)
        draw_heart(draw, cx, cy + size * 0.02, size * 0.44, PRIMARY)

        # Sparkle accent
        sp = size * 0.14
        draw_sparkle(draw, cx + size * 0.26, cy - size * 0.22, sp, WHITE)

        if size >= 128:
            draw_sparkle(draw, cx - size * 0.24, cy + size * 0.22, sp * 0.5, PRIMARY)

    return img


def main():
    os.makedirs('icons', exist_ok=True)
    for size in [16, 48, 128]:
        img = generate_icon(size)
        path = f'icons/icon-{size}.png'
        img.save(path, 'PNG', optimize=True)
        print(f'Generated {path} ({size}x{size})')


if __name__ == '__main__':
    main()
