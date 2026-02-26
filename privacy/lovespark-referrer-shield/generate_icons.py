#!/usr/bin/env python3
"""Generate LoveSpark Referrer Shield icons at 16, 48, 128px.

Design: A pink shield icon with a lock/block symbol — represents referrer protection.
Hot pink primary with light pink accents and white shield highlights.
"""

import os
import math
from PIL import Image, ImageDraw

HOT_PINK = (232, 69, 124, 255)      # #E8457C — ls-pink-accent
DEEP_PINK = (214, 52, 102, 255)     # #D63466 — ls-pink-deep
LIGHT_PINK = (253, 207, 225, 255)   # #FDCFE1
WHITE = (255, 255, 255, 255)


def draw_shield(draw, cx, cy, size, fill_color, outline_color=None):
    """Draw a shield shape centered at (cx, cy)."""
    w = size * 0.38
    h = size * 0.44
    top = cy - h
    bottom = cy + h * 0.7

    # Shield as polygon: flat top, curved bottom point
    points = [
        (cx - w, top),
        (cx + w, top),
        (cx + w, cy),
        (cx + w * 0.6, cy + h * 0.4),
        (cx, bottom),
        (cx - w * 0.6, cy + h * 0.4),
        (cx - w, cy),
    ]
    draw.polygon(points, fill=fill_color)
    if outline_color:
        draw.line(points + [points[0]], fill=outline_color, width=max(1, int(size * 0.03)))


def draw_slash(draw, cx, cy, size, color):
    """Draw a diagonal slash (block symbol) through the shield center."""
    r = size * 0.15
    w = max(1, int(size * 0.05))
    draw.line(
        [(cx - r, cy - r), (cx + r, cy + r)],
        fill=color, width=w
    )


def draw_sparkle(draw, cx, cy, size, color):
    """Draw a 4-point sparkle at (cx, cy)."""
    r = size / 2
    thin = size * 0.12
    draw.ellipse([(cx - thin, cy - r), (cx + thin, cy + r)], fill=color)
    draw.ellipse([(cx - r, cy - thin), (cx + r, cy + thin)], fill=color)


def generate_icon(size):
    """Generate a single icon at the given size."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx, cy = size / 2, size / 2
    margin = size * 0.08

    # Background circle
    bg_r = (size / 2) - margin
    draw.ellipse(
        [(cx - bg_r, cy - bg_r), (cx + bg_r, cy + bg_r)],
        fill=HOT_PINK
    )

    # Inner circle — depth
    inner_r = bg_r * 0.88
    draw.ellipse(
        [(cx - inner_r, cy - inner_r), (cx + inner_r, cy + inner_r)],
        fill=DEEP_PINK
    )

    if size <= 16:
        # Simple shield silhouette
        draw_shield(draw, cx, cy + 1, size, WHITE)
    else:
        # Shield with slash through it (referrer blocked)
        draw_shield(draw, cx, cy + size * 0.02, size, LIGHT_PINK, WHITE)
        draw_slash(draw, cx, cy + size * 0.02, size, DEEP_PINK)

        # Accent sparkle top-right
        sparkle_size = size * 0.18
        draw_sparkle(draw, cx + size * 0.28, cy - size * 0.26, sparkle_size, WHITE)

        # Small sparkle bottom-left
        draw_sparkle(draw, cx - size * 0.26, cy + size * 0.24, sparkle_size * 0.5, LIGHT_PINK)

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
