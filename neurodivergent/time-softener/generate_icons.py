"""
Generate LoveSpark-style pink clock icons at 16, 48, and 128px.
Uses Pillow. Run: python generate_icons.py
"""

from PIL import Image, ImageDraw

SIZES = [16, 48, 128]
BG_COLOR = (232, 69, 124)       # --ls-pink-accent
FG_COLOR = (255, 255, 255)      # white
OUTLINE = (214, 52, 102)        # --ls-pink-deep
INNER = (244, 140, 175)         # lighter pink


def generate_icon(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    margin = max(1, size // 8)
    cx = size // 2
    cy = size // 2
    r = size // 2 - margin

    # Outer circle
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=BG_COLOR, outline=OUTLINE)

    # Inner circle
    ir = r - max(2, size // 6)
    draw.ellipse([cx - ir, cy - ir, cx + ir, cy + ir], fill=INNER)

    # Clock hands
    lw = max(1, size // 16)
    # Hour hand (pointing up-right)
    draw.line([(cx, cy), (cx + ir // 3, cy - ir // 2)], fill=FG_COLOR, width=lw + 1)
    # Minute hand (pointing up)
    draw.line([(cx, cy), (cx, cy - ir * 3 // 4)], fill=FG_COLOR, width=lw)

    # Center dot
    dot_r = max(1, size // 16)
    draw.ellipse([cx - dot_r, cy - dot_r, cx + dot_r, cy + dot_r], fill=FG_COLOR)

    return img


if __name__ == '__main__':
    import os
    os.makedirs('icons', exist_ok=True)
    for size in SIZES:
        icon = generate_icon(size)
        path = f'icons/icon-{size}.png'
        icon.save(path)
        print(f'Generated {path} ({size}x{size})')
