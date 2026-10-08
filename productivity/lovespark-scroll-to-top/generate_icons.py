#!/usr/bin/env python3
"""Generate pink shield icons at 16, 48, 128px."""
from PIL import Image, ImageDraw

SIZES = [16, 48, 128]
BG = (232, 69, 124)

for size in SIZES:
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    margin = max(1, size // 8)
    draw.rounded_rectangle(
        [margin, margin, size - margin, size - margin],
        radius=size // 4,
        fill=BG,
    )
    img.save(f"icons/icon-{size}.png")
    print(f"Generated icon-{size}.png")
