#!/usr/bin/env python3
"""Generate LoveSpark Core icons — pink sparkle/flower at 16, 48, 128px.
Suite icon, not a shield. Uses Pillow.
"""
import os, math
from PIL import Image, ImageDraw, ImageFilter

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "icons")
os.makedirs(BASE, exist_ok=True)

# Colors
PINK_HOT = (232, 69, 124)
PINK_LIGHT = (253, 207, 225)
PINK_MID = (249, 168, 201)
WHITE = (255, 255, 255)
GLOW_PINK = (232, 69, 124, 80)

def draw_icon(size):
    # Oversample at 4x for antialiasing
    s = size * 4
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    cx, cy = s // 2, s // 2

    # Background circle — soft pink gradient effect
    for r in range(int(s * 0.48), 0, -1):
        t = r / (s * 0.48)
        c = (
            int(PINK_HOT[0] * (1 - t) + PINK_LIGHT[0] * t),
            int(PINK_HOT[1] * (1 - t) + PINK_LIGHT[1] * t),
            int(PINK_HOT[2] * (1 - t) + PINK_LIGHT[2] * t),
            255
        )
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=c)

    # 5-petal flower
    petal_len = s * 0.28
    petal_w = s * 0.14
    for i in range(5):
        angle = math.radians(i * 72 - 90)
        px = cx + petal_len * 0.55 * math.cos(angle)
        py = cy + petal_len * 0.55 * math.sin(angle)
        bbox = [
            px - petal_w, py - petal_len,
            px + petal_w, py + petal_len
        ]
        # Rotate by creating a temp image
        petal_img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
        petal_draw = ImageDraw.Draw(petal_img)
        # Draw petal centered
        ew, eh = int(petal_w * 2), int(petal_len * 2)
        petal_draw.ellipse(
            [cx - ew // 2, cy - eh // 2, cx + ew // 2, cy + eh // 2],
            fill=(255, 255, 255, 200)
        )
        petal_img = petal_img.rotate(-i * 72, center=(cx, cy), resample=Image.BICUBIC)
        img = Image.alpha_composite(img, petal_img)
        draw = ImageDraw.Draw(img)

    # Center circle
    cr = int(s * 0.1)
    draw.ellipse([cx - cr, cy - cr, cx + cr, cy + cr], fill=PINK_HOT)

    # Small sparkle dots
    sparkles = [(0.25, 0.22), (0.78, 0.18), (0.82, 0.75), (0.2, 0.8)]
    for sx, sy in sparkles:
        sr = max(1, int(s * 0.02))
        px, py = int(s * sx), int(s * sy)
        draw.ellipse([px - sr, py - sr, px + sr, py + sr], fill=(255, 255, 255, 180))

    # Downsample with antialiasing
    img = img.resize((size, size), Image.LANCZOS)
    return img


for size in (16, 48, 128):
    icon = draw_icon(size)
    path = os.path.join(BASE, f"icon-{size}.png")
    icon.save(path, "PNG")
    print(f"  icon-{size}.png ({os.path.getsize(path)} bytes)")

print("Done")
