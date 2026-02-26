"""Generate Focus Blossom icons — pink flower bud at 16, 48, 128px."""

from PIL import Image, ImageDraw
import os

SIZES = [16, 48, 128]
OUT_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "icons")
os.makedirs(OUT_DIR, exist_ok=True)


def draw_icon(size):
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx, cy = size / 2, size / 2
    r = size * 0.42

    # Circular pink background
    draw.ellipse(
        [cx - r, cy - r, cx + r, cy + r],
        fill=(232, 69, 124, 255),  # --ls-pink-accent
    )

    # Stem
    stem_w = max(1, size * 0.06)
    stem_top = cy - r * 0.15
    stem_bottom = cy + r * 0.65
    draw.line(
        [(cx, stem_top), (cx, stem_bottom)],
        fill=(144, 238, 144, 255),  # light green
        width=max(1, int(stem_w)),
    )

    # Petals — 5 circles around center
    petal_r = r * 0.28
    petal_dist = r * 0.32
    petal_color = (255, 183, 197, 255)  # soft pink

    for i in range(5):
        import math
        angle = (i / 5) * math.pi * 2 - math.pi / 2
        px = cx + math.cos(angle) * petal_dist
        py = (cy - r * 0.15) + math.sin(angle) * petal_dist
        draw.ellipse(
            [px - petal_r, py - petal_r, px + petal_r, py + petal_r],
            fill=petal_color,
        )

    # Center dot
    center_r = r * 0.15
    center_y = cy - r * 0.15
    draw.ellipse(
        [cx - center_r, center_y - center_r, cx + center_r, center_y + center_r],
        fill=(255, 215, 0, 255),  # gold
    )

    # Leaf
    if size >= 48:
        leaf_x = cx + r * 0.2
        leaf_y = cy + r * 0.3
        leaf_size = r * 0.22
        draw.ellipse(
            [leaf_x, leaf_y - leaf_size * 0.5, leaf_x + leaf_size * 1.5, leaf_y + leaf_size * 0.5],
            fill=(119, 221, 119, 255),  # green
        )

    return img


for s in SIZES:
    icon = draw_icon(s)
    icon.save(os.path.join(OUT_DIR, f"icon-{s}.png"))
    print(f"Generated icon-{s}.png")

print("Done!")
