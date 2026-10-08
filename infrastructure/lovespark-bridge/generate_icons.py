"""Generate LoveSpark Bridge extension icons (pink bridge icon)."""
from PIL import Image, ImageDraw

SIZES = [16, 48, 128]
PINK = (232, 69, 124)
BG = (26, 10, 18)

for size in SIZES:
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Dark circle background
    draw.ellipse([0, 0, size - 1, size - 1], fill=BG)

    # Pink bridge arch
    pad = size // 5
    arch_top = size // 3
    arch_bottom = size * 2 // 3
    draw.arc([pad, arch_top, size - pad, arch_bottom + size // 4], 180, 0, fill=PINK, width=max(1, size // 10))

    # Bridge deck (horizontal line)
    y = arch_bottom
    draw.line([pad, y, size - pad, y], fill=PINK, width=max(1, size // 12))

    # Two pillars
    pillar_w = max(1, size // 12)
    left_x = pad + size // 6
    right_x = size - pad - size // 6
    draw.line([left_x, arch_top + size // 8, left_x, y], fill=PINK, width=pillar_w)
    draw.line([right_x, arch_top + size // 8, right_x, y], fill=PINK, width=pillar_w)

    img.save(f'icons/icon-{size}.png')
    print(f'Generated icon-{size}.png')
