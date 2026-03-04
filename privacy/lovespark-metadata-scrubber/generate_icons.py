"""Generate LoveSpark Metadata Scrubber icons — pink shield with sparkle eraser."""

from PIL import Image, ImageDraw, ImageFont
import os

SIZES = [16, 48, 128]
PRIMARY = (232, 69, 124)     # #E8457C — pink accent
ACCENT = (255, 179, 217)     # #FFB3D9 — lighter pink
WHITE = (255, 255, 255)

os.makedirs('icons', exist_ok=True)

for size in SIZES:
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Shield shape
    cx, cy = size // 2, size // 2
    pad = max(1, size // 16)

    shield_points = [
        (cx, pad),                           # top center
        (size - pad, cy * 0.45 + pad),       # top right
        (size - pad, cy),                    # mid right
        (cx + size * 0.15, size - pad),      # bottom right curve
        (cx, size - pad * 0.5),              # bottom center (pointy)
        (cx - size * 0.15, size - pad),      # bottom left curve
        (pad, cy),                           # mid left
        (pad, cy * 0.45 + pad),              # top left
    ]
    draw.polygon(shield_points, fill=PRIMARY)

    # Inner highlight
    if size >= 48:
        inner_pad = pad + max(2, size // 12)
        inner_points = [
            (cx, inner_pad + 2),
            (size - inner_pad, cy * 0.45 + inner_pad),
            (size - inner_pad, cy - 2),
            (cx, cy - 2),
            (inner_pad, cy - 2),
            (inner_pad, cy * 0.45 + inner_pad),
        ]
        draw.polygon(inner_points, fill=ACCENT + (60,))

    # Sparkle/eraser symbol in center
    if size >= 48:
        # Draw a simple "✦" sparkle shape
        sc = size / 128  # scale factor
        star_cx, star_cy = cx, cy + int(4 * sc)
        arm = int(16 * sc)
        thin = max(1, int(3 * sc))

        # Vertical arm
        draw.rectangle(
            [star_cx - thin, star_cy - arm, star_cx + thin, star_cy + arm],
            fill=WHITE,
        )
        # Horizontal arm
        draw.rectangle(
            [star_cx - arm, star_cy - thin, star_cx + arm, star_cy + thin],
            fill=WHITE,
        )
        # Diagonal arms (dots at 45°)
        diag = int(arm * 0.6)
        dot = max(1, int(2 * sc))
        for dx, dy in [(-diag, -diag), (diag, -diag), (-diag, diag), (diag, diag)]:
            draw.ellipse(
                [star_cx + dx - dot, star_cy + dy - dot,
                 star_cx + dx + dot, star_cy + dy + dot],
                fill=WHITE,
            )
    elif size == 16:
        # Simple cross for 16px
        draw.rectangle([cx - 1, cy - 3, cx + 1, cy + 3], fill=WHITE)
        draw.rectangle([cx - 3, cy - 1, cx + 3, cy + 1], fill=WHITE)

    img.save(f'icons/icon-{size}.png')
    print(f'Generated icons/icon-{size}.png ({size}x{size})')

print('Done! 🌸')
