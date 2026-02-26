#!/usr/bin/env python3
"""Generate LoveSpark Email Guard icons at 16, 48, 128px.

Design: A hot pink shield with a small envelope cutout inside.
Represents email protection. Pink primary, light pink accents, white highlights.
"""

import os
import math
from PIL import Image, ImageDraw

HOT_PINK = (232, 69, 124, 255)    # #E8457C — ls-pink-accent
LIGHT_PINK = (255, 182, 193, 255)  # #FFB6C1
DEEP_PINK = (214, 52, 102, 255)   # #D63466 — ls-pink-deep
WHITE = (255, 255, 255, 255)


def draw_sparkle(draw, cx, cy, size, color):
    """Draw a 4-point sparkle/star at (cx, cy)."""
    r = size / 2
    thin = size * 0.12
    draw.ellipse([(cx - thin, cy - r), (cx + thin, cy + r)], fill=color)
    draw.ellipse([(cx - r, cy - thin), (cx + r, cy + thin)], fill=color)


def draw_shield(draw, cx, cy, size, color):
    """Draw a shield shape using polygon points."""
    w = size * 0.45
    h = size * 0.55
    top = cy - h * 0.5
    bot = cy + h * 0.5

    points = [
        (cx, top),                    # top center
        (cx + w, top + h * 0.15),     # top right
        (cx + w * 0.9, bot - h * 0.15),  # mid right
        (cx, bot),                    # bottom center (point)
        (cx - w * 0.9, bot - h * 0.15),  # mid left
        (cx - w, top + h * 0.15),     # top left
    ]
    draw.polygon(points, fill=color)


def draw_envelope(draw, cx, cy, size, color):
    """Draw a simplified envelope icon."""
    w = size * 0.22
    h = size * 0.15

    # Rectangle body
    draw.rectangle(
        [(cx - w, cy - h), (cx + w, cy + h)],
        fill=color
    )

    # V-shape flap on top
    draw.polygon(
        [(cx - w, cy - h), (cx, cy), (cx + w, cy - h)],
        fill=color
    )


def generate_icon(size):
    """Generate a single icon at the given size."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx, cy = size / 2, size / 2
    margin = size * 0.08

    # Background circle — hot pink
    bg_r = (size / 2) - margin
    draw.ellipse(
        [(cx - bg_r, cy - bg_r), (cx + bg_r, cy + bg_r)],
        fill=HOT_PINK
    )

    # Inner circle — subtle depth
    inner_r = bg_r * 0.88
    draw.ellipse(
        [(cx - inner_r, cy - inner_r), (cx + inner_r, cy + inner_r)],
        fill=DEEP_PINK
    )

    if size <= 16:
        # Simple: shield shape only
        draw_shield(draw, cx, cy, size * 0.8, WHITE)
    else:
        # Full detail: shield + envelope + sparkles
        draw_shield(draw, cx, cy + size * 0.02, size * 0.85, LIGHT_PINK)
        draw_shield(draw, cx, cy + size * 0.02, size * 0.72, DEEP_PINK)
        draw_envelope(draw, cx, cy - size * 0.01, size * 0.7, WHITE)

        # Sparkle accents
        draw_sparkle(draw, cx + size * 0.28, cy - size * 0.25, size * 0.18, WHITE)
        draw_sparkle(draw, cx - size * 0.3, cy + size * 0.22, size * 0.12, LIGHT_PINK)

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
