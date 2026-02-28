"""Generate Flappy Waifu extension icons at 16, 48, 128px."""
from PIL import Image, ImageDraw

SIZES = [16, 48, 128]
BG_COLOR = (255, 110, 180)       # #ff6eb4
HEART_COLOR = (255, 255, 255)    # white heart

def draw_icon(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Pink circle background
    pad = max(1, size // 16)
    draw.ellipse([pad, pad, size - pad - 1, size - pad - 1], fill=BG_COLOR)

    # White heart in center
    cx, cy = size / 2, size / 2 + size * 0.04
    r = size * 0.22

    # Heart = two circles + triangle
    lx, ly = cx - r * 0.55, cy - r * 0.3
    rx, ry = cx + r * 0.55, cy - r * 0.3
    cr = r * 0.55

    draw.ellipse([lx - cr, ly - cr, lx + cr, ly + cr], fill=HEART_COLOR)
    draw.ellipse([rx - cr, ry - cr, rx + cr, ry + cr], fill=HEART_COLOR)
    draw.polygon([
        (cx - r * 1.1, cy - r * 0.1),
        (cx + r * 1.1, cy - r * 0.1),
        (cx, cy + r * 1.1),
    ], fill=HEART_COLOR)

    return img

for s in SIZES:
    icon = draw_icon(s)
    icon.save(f'icons/icon{s}.png')
    print(f'  icons/icon{s}.png')

print('Done.')
