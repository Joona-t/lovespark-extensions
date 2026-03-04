"""Generate LoveSpark Med Tracker icons at 16, 48, 128px."""
from PIL import Image, ImageDraw
import os

HOT_PINK = (232, 69, 124)
LIGHT_PINK = (253, 207, 225)
WHITE = (255, 255, 255)

def draw_pill(draw, cx, cy, size):
    """Draw a simple pill shape (capsule)."""
    w = size * 0.3
    h = size * 0.7
    x1 = cx - w / 2
    y1 = cy - h / 2
    x2 = cx + w / 2
    y2 = cy + h / 2
    r = w / 2

    # Top half (light pink)
    draw.rounded_rectangle([x1, y1, x2, cy], radius=r, fill=LIGHT_PINK)
    # Bottom half (hot pink)
    draw.rounded_rectangle([x1, cy, x2, y2], radius=r, fill=HOT_PINK)
    # Divider line
    draw.line([(x1 + 1, cy), (x2 - 1, cy)], fill=WHITE, width=max(1, size // 32))

def draw_heart(draw, cx, cy, size):
    """Draw a small heart accent."""
    s = size * 0.12
    points = [
        (cx, cy + s * 0.6),
        (cx - s, cy - s * 0.2),
        (cx - s * 0.5, cy - s * 0.7),
        (cx, cy - s * 0.3),
        (cx + s * 0.5, cy - s * 0.7),
        (cx + s, cy - s * 0.2),
    ]
    draw.polygon(points, fill=LIGHT_PINK)

def generate_icon(size, output_path):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Circular background
    pad = max(1, size // 16)
    draw.ellipse([pad, pad, size - pad, size - pad], fill=HOT_PINK)

    # Inner glow circle
    inner_pad = pad + max(1, size // 10)
    draw.ellipse([inner_pad, inner_pad, size - inner_pad, size - inner_pad],
                 fill=(244, 140, 175))

    # Center pill
    cx, cy = size // 2, size // 2
    draw_pill(draw, cx, cy, size)

    # Heart accents (only on larger sizes)
    if size >= 48:
        draw_heart(draw, cx + size * 0.25, cy - size * 0.25, size)
        if size >= 128:
            draw_heart(draw, cx - size * 0.28, cy + size * 0.22, size)

    img.save(output_path, 'PNG')
    print(f"  Generated {output_path} ({size}x{size})")

if __name__ == '__main__':
    icons_dir = os.path.join(os.path.dirname(__file__), 'icons')
    os.makedirs(icons_dir, exist_ok=True)

    for size in (16, 48, 128):
        generate_icon(size, os.path.join(icons_dir, f'icon-{size}.png'))

    print("Done!")
