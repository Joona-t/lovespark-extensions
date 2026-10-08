#!/usr/bin/env python3
"""Generate LoveSpark Syntax Art extension icons.

Pink background with code brackets — represents code art.
Generates 16, 48, 128px icons in icons/ directory.
"""

from PIL import Image, ImageDraw, ImageFont
import os

# LoveSpark pink palette
BG_COLOR = (232, 69, 124)       # --ls-pink-accent #E8457C
FG_COLOR = (255, 255, 255)      # white
SHADOW_COLOR = (166, 40, 86)    # darker pink shadow

SIZES = [16, 48, 128]
OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "icons")


def draw_icon(size):
    """Draw a code-art icon at the given size."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Rounded rectangle background
    margin = max(1, size // 16)
    draw.rounded_rectangle(
        [margin, margin, size - margin - 1, size - margin - 1],
        radius=max(2, size // 6),
        fill=BG_COLOR,
    )

    # Draw code brackets: </>
    # Use a simple approach — draw text if font available, else draw shapes
    try:
        font_size = max(8, size * 5 // 10)
        font = ImageFont.truetype("/System/Library/Fonts/Menlo.ttc", font_size)
    except (OSError, IOError):
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf", font_size)
        except (OSError, IOError):
            font = ImageFont.load_default()

    text = "</>"

    # Center text
    bbox = draw.textbbox((0, 0), text, font=font)
    tw = bbox[2] - bbox[0]
    th = bbox[3] - bbox[1]
    tx = (size - tw) // 2
    ty = (size - th) // 2 - bbox[1]

    # Shadow
    offset = max(1, size // 48)
    draw.text((tx + offset, ty + offset), text, fill=SHADOW_COLOR, font=font)

    # Main text
    draw.text((tx, ty), text, fill=FG_COLOR, font=font)

    return img


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    for size in SIZES:
        icon = draw_icon(size)
        path = os.path.join(OUTPUT_DIR, f"icon-{size}.png")
        icon.save(path)
        print(f"Generated: {path}")


if __name__ == "__main__":
    main()
