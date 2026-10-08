"""
LoveSpark Fingerprint Shield — Icon Generator
Generates shield icons with a fingerprint motif at 16, 48, 128px.
Hot pink (#FF69B4) shield, light pink (#FFB6C1) accent.
"""

from PIL import Image, ImageDraw
import os

SIZES = [16, 48, 128]
OUTPUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'icons')
os.makedirs(OUTPUT_DIR, exist_ok=True)

HOT_PINK = (255, 105, 180, 255)
LIGHT_PINK = (255, 182, 193, 255)
WHITE = (255, 255, 255, 255)
DEEP_PINK = (220, 50, 100, 255)


def draw_shield(draw, size):
    """Draw a shield shape."""
    s = size
    cx = s / 2
    pad = s * 0.08

    # Shield outline points (rounded feel via polygon)
    points = [
        (cx, pad),                          # top center
        (s - pad, s * 0.18),                # top right
        (s - pad, s * 0.55),                # mid right
        (cx + s * 0.15, s * 0.78),          # lower right
        (cx, s - pad),                      # bottom center (point)
        (cx - s * 0.15, s * 0.78),          # lower left
        (pad, s * 0.55),                    # mid left
        (pad, s * 0.18),                    # top left
    ]

    # Shield body
    draw.polygon(points, fill=HOT_PINK)

    # Inner highlight (slightly smaller shield)
    inset = s * 0.15
    inner = [
        (cx, pad + inset * 0.7),
        (s - pad - inset, s * 0.22),
        (s - pad - inset, s * 0.52),
        (cx + s * 0.08, s * 0.72),
        (cx, s - pad - inset * 0.8),
        (cx - s * 0.08, s * 0.72),
        (pad + inset, s * 0.52),
        (pad + inset, s * 0.22),
    ]
    draw.polygon(inner, fill=LIGHT_PINK)


def draw_fingerprint(draw, size):
    """Draw simplified fingerprint arcs inside the shield."""
    cx = size / 2
    cy = size * 0.48
    r_base = size * 0.12

    for i in range(3):
        r = r_base + i * size * 0.06
        bbox = [cx - r, cy - r, cx + r, cy + r]
        width = max(1, round(size * 0.04))
        draw.arc(bbox, start=200, end=340, fill=DEEP_PINK, width=width)

    # Center dot
    dot_r = max(1, size * 0.03)
    draw.ellipse(
        [cx - dot_r, cy - dot_r, cx + dot_r, cy + dot_r],
        fill=DEEP_PINK
    )


for s in SIZES:
    # Use 4x supersampling for smooth edges
    ss = s * 4
    img = Image.new('RGBA', (ss, ss), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    draw_shield(draw, ss)
    draw_fingerprint(draw, ss)

    # Downscale with antialiasing
    img = img.resize((s, s), Image.LANCZOS)

    path = os.path.join(OUTPUT_DIR, f'icon-{s}.png')
    img.save(path)
    print(f'Generated {path}')

print('Done!')
