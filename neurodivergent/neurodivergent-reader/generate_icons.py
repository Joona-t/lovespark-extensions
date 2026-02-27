"""
Generate LoveSpark-style pink reading icons at 16, 48, and 128px.
Uses Pillow. Run: python generate_icons.py
"""

from PIL import Image, ImageDraw

SIZES = [16, 48, 128]
BG_COLOR = (232, 69, 124)       # --ls-pink-accent #E8457C
FG_COLOR = (255, 255, 255)      # white
OUTLINE_COLOR = (214, 52, 102)  # --ls-pink-deep #D63466


def generate_icon(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Pink circle background
    margin = max(1, size // 16)
    draw.ellipse(
        [margin, margin, size - margin - 1, size - margin - 1],
        fill=BG_COLOR,
        outline=OUTLINE_COLOR,
        width=max(1, size // 32),
    )

    # White book/reading icon (simplified)
    cx, cy = size // 2, size // 2
    s = size // 4  # half-size of icon area

    # Open book shape: two rectangles angled like pages
    # Left page
    left_pts = [
        (cx - s, cy - s + 1),
        (cx - 1, cy - s // 2),
        (cx - 1, cy + s),
        (cx - s, cy + s - 1),
    ]
    draw.polygon(left_pts, fill=FG_COLOR)

    # Right page
    right_pts = [
        (cx + s, cy - s + 1),
        (cx + 1, cy - s // 2),
        (cx + 1, cy + s),
        (cx + s, cy + s - 1),
    ]
    draw.polygon(right_pts, fill=FG_COLOR)

    # Spine line
    draw.line(
        [(cx, cy - s // 2), (cx, cy + s)],
        fill=BG_COLOR,
        width=max(1, size // 24),
    )

    return img


if __name__ == '__main__':
    for size in SIZES:
        icon = generate_icon(size)
        path = f'icons/icon-{size}.png'
        icon.save(path)
        print(f'Generated {path} ({size}x{size})')
