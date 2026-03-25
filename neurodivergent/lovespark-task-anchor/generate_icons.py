#!/usr/bin/env python3
"""Generate pink anchor/pin icons at 16, 48, 128px for Task Anchor."""
from PIL import Image, ImageDraw, ImageFont
import os

SIZES = [16, 48, 128]
BG = (232, 69, 124)
WHITE = (255, 255, 255)

os.makedirs("icons", exist_ok=True)

for size in SIZES:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    margin = max(1, size // 8)
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=size // 4,
        fill=BG,
    )
    # Draw a simple pin/anchor shape in the center
    cx, cy = size // 2, size // 2
    r = max(2, size // 6)
    # Pin head (circle)
    draw.ellipse([cx - r, cy - r - r // 2, cx + r, cy + r // 2], fill=WHITE)
    # Pin point (line down)
    lw = max(1, size // 16)
    draw.line([cx, cy + r // 2, cx, cy + r + r], fill=WHITE, width=lw)
    img.save(f"icons/icon-{size}.png")
    print(f"Generated icon-{size}.png")
