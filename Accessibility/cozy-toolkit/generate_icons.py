"""
Generate Cozy Accessibility extension icons.
Pink accessibility icon (person with arms raised in a circle) at 16, 48, 128px.
"""

from PIL import Image, ImageDraw
import os

SIZES = [16, 48, 128]
BG_COLOR = (232, 69, 124)      # --ls-pink-accent #E8457C
FG_COLOR = (255, 255, 255)     # white
OUTLINE_COLOR = (214, 52, 102) # --ls-pink-deep #D63466

os.makedirs('icons', exist_ok=True)

for size in SIZES:
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    pad = max(1, size // 16)
    cx, cy = size // 2, size // 2
    r = size // 2 - pad

    # Background circle
    draw.ellipse([cx - r, cy - r, cx + r, cy + r], fill=BG_COLOR, outline=OUTLINE_COLOR,
                 width=max(1, size // 32))

    # Accessibility person icon (simplified)
    # Head
    head_r = max(1, size // 8)
    draw.ellipse([cx - head_r, cy - r + pad * 2, cx + head_r, cy - r + pad * 2 + head_r * 2],
                 fill=FG_COLOR)

    # Body line
    body_top = cy - r + pad * 2 + head_r * 2
    body_bottom = cy + r // 3
    line_w = max(1, size // 16)
    draw.line([(cx, body_top), (cx, body_bottom)], fill=FG_COLOR, width=line_w)

    # Arms (outstretched)
    arm_y = body_top + (body_bottom - body_top) // 4
    arm_span = r - pad * 2
    draw.line([(cx - arm_span, arm_y - arm_span // 3), (cx, arm_y)],
              fill=FG_COLOR, width=line_w)
    draw.line([(cx, arm_y), (cx + arm_span, arm_y - arm_span // 3)],
              fill=FG_COLOR, width=line_w)

    # Legs (spread)
    leg_span = r // 2
    draw.line([(cx, body_bottom), (cx - leg_span, cy + r - pad * 2)],
              fill=FG_COLOR, width=line_w)
    draw.line([(cx, body_bottom), (cx + leg_span, cy + r - pad * 2)],
              fill=FG_COLOR, width=line_w)

    path = f'icons/icon-{size}.png'
    img.save(path, 'PNG')
    print(f'Generated {path} ({size}x{size})')

print('Done!')
