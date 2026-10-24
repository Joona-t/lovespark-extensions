#!/usr/bin/env python3
"""Dark Mode Reader icons: a crescent moon cut from a LoveSpark-pink disc, on plum."""
from PIL import Image, ImageDraw
import os

PLUM = (42, 4, 19)        # --ls-text-strong
PINK = (255, 73, 166)     # --ls-pink-accent
CREAM = (255, 250, 253)   # --ls-cream
os.makedirs("icons", exist_ok=True)
for size in (16, 48, 128):
    s = size * 4  # supersample
    img = Image.new("RGBA", (s, s), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    m = s * 0.06
    d.rounded_rectangle([m, m, s - m, s - m], radius=s * 0.24, fill=PLUM)
    # moon: cream disc minus an offset plum disc
    r = s * 0.30
    cx, cy = s * 0.50, s * 0.52
    d.ellipse([cx - r, cy - r, cx + r, cy + r], fill=CREAM)
    d.ellipse([cx - r + s * 0.17, cy - r - s * 0.10, cx + r + s * 0.17, cy + r - s * 0.10], fill=PLUM)
    # pink sparkle
    sx, sy, sr = s * 0.72, s * 0.30, s * 0.05
    d.polygon([(sx, sy - sr * 1.6), (sx + sr * 0.5, sy - sr * 0.5), (sx + sr * 1.6, sy), (sx + sr * 0.5, sy + sr * 0.5),
               (sx, sy + sr * 1.6), (sx - sr * 0.5, sy + sr * 0.5), (sx - sr * 1.6, sy), (sx - sr * 0.5, sy - sr * 0.5)], fill=PINK)
    img = img.resize((size, size), Image.LANCZOS)
    img.save(f"icons/icon-{size}.png")
    print(f"icons/icon-{size}.png")
