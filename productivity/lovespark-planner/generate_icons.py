"""Generate LoveSpark Planner icons (pink calendar with heart)."""
from PIL import Image, ImageDraw, ImageFont
import os

SIZES = [16, 48, 128]
OUT_DIR = os.path.join(os.path.dirname(__file__), 'icons')
os.makedirs(OUT_DIR, exist_ok=True)

for size in SIZES:
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    p = size / 128  # scale factor

    # Calendar body (rounded rect)
    margin = int(8 * p)
    top = int(24 * p)
    body_rect = [margin, top, size - margin, size - margin]
    radius = int(12 * p)
    d.rounded_rectangle(body_rect, radius=radius, fill='#E8457C')

    # Calendar header bar
    header_rect = [margin, int(16 * p), size - margin, int(44 * p)]
    d.rounded_rectangle(header_rect, radius=radius, fill='#D63466')

    # Calendar ring tabs
    ring_width = int(6 * p)
    ring_height = int(16 * p)
    for rx in [int(36 * p), int(92 * p)]:
        d.rounded_rectangle(
            [rx - ring_width//2, int(8 * p), rx + ring_width//2, int(8 * p) + ring_height],
            radius=int(3 * p), fill='#FFFFFF'
        )

    # Heart in center
    cx, cy = size // 2, int(76 * p)
    hs = int(20 * p)  # heart size
    # Simple heart using circles + triangle
    d.ellipse([cx - hs, cy - hs, cx, cy], fill='white')
    d.ellipse([cx, cy - hs, cx + hs, cy], fill='white')
    d.polygon([(cx - hs, cy - int(4*p)), (cx + hs, cy - int(4*p)), (cx, cy + hs)], fill='white')

    path = os.path.join(OUT_DIR, f'icon-{size}.png')
    img.save(path)
    print(f'  Created {path}')

print('Done!')
