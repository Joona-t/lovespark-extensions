"""
Generate LoveSpark-style pink shield icons at 16, 48, and 128px.
Uses Pillow. Run: python generate_icons.py
"""

from PIL import Image, ImageDraw

SIZES = [16, 48, 128]
BG_COLOR = (232, 69, 124)       # --ls-pink-accent #E8457C
FG_COLOR = (255, 255, 255)      # white
OUTLINE_COLOR = (214, 52, 102)  # --ls-pink-deep #D63466
LIGHT_FILL = (244, 140, 175)    # lighter pink for shield body


def generate_icon(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    margin = max(1, size // 10)
    cx = size // 2
    w = size - margin * 2
    h = size - margin * 2

    # Shield shape: pointed bottom
    top_y = margin
    mid_y = margin + int(h * 0.55)
    bot_y = size - margin

    shield_pts = [
        (margin, top_y),
        (size - margin, top_y),
        (size - margin, mid_y),
        (cx, bot_y),
        (margin, mid_y),
    ]

    # Fill
    draw.polygon(shield_pts, fill=BG_COLOR, outline=OUTLINE_COLOR)

    # Inner shield highlight (smaller, lighter)
    inner_margin = max(2, size // 6)
    inner_top = top_y + inner_margin
    inner_mid = margin + int(h * 0.5)
    inner_bot = bot_y - inner_margin

    inner_pts = [
        (margin + inner_margin, inner_top),
        (size - margin - inner_margin, inner_top),
        (size - margin - inner_margin, inner_mid),
        (cx, inner_bot),
        (margin + inner_margin, inner_mid),
    ]
    draw.polygon(inner_pts, fill=LIGHT_FILL)

    # White checkmark
    check_size = max(2, size // 5)
    check_cx = cx
    check_cy = margin + int(h * 0.4)
    lw = max(1, size // 16)

    draw.line(
        [
            (check_cx - check_size, check_cy),
            (check_cx - check_size // 3, check_cy + check_size // 2),
            (check_cx + check_size, check_cy - check_size // 2),
        ],
        fill=FG_COLOR,
        width=lw,
        joint='curve',
    )

    return img


if __name__ == '__main__':
    import os
    os.makedirs('icons', exist_ok=True)
    for size in SIZES:
        icon = generate_icon(size)
        path = f'icons/icon-{size}.png'
        icon.save(path)
        print(f'Generated {path} ({size}x{size})')
