"""Generate LoveSpark Notes extension icons — pink notepad with sparkle."""
from PIL import Image, ImageDraw

SIZES = [16, 48, 128]
BG_COLOR = (232, 69, 124)      # --ls-pink-accent #E8457C
PAGE_COLOR = (255, 255, 255)    # white page
LINE_COLOR = (253, 207, 225)    # --ls-bg-pink-light
SPARKLE_COLOR = (255, 255, 255) # white sparkle

for size in SIZES:
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    pad = max(1, size // 10)
    r = max(2, size // 8)

    # Pink rounded rectangle background
    draw.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=BG_COLOR)

    # White notepad page
    px1, py1 = pad + size // 8, pad + size // 10
    px2, py2 = size - pad - size // 10, size - pad - size // 10
    page_r = max(1, r // 2)
    draw.rounded_rectangle([px1, py1, px2, py2], radius=page_r, fill=PAGE_COLOR)

    # Pink lines on page
    line_pad = max(1, size // 20)
    num_lines = 3 if size >= 48 else 2
    page_h = py2 - py1
    for i in range(num_lines):
        y = py1 + int(page_h * (0.35 + i * 0.2))
        draw.line([px1 + line_pad, y, px2 - line_pad, y], fill=LINE_COLOR, width=max(1, size // 32))

    # Sparkle (top-right)
    if size >= 48:
        sx, sy = size - pad - size // 5, pad + size // 8
        arm = max(2, size // 12)
        w = max(1, size // 32)
        draw.line([sx - arm, sy, sx + arm, sy], fill=SPARKLE_COLOR, width=w)
        draw.line([sx, sy - arm, sx, sy + arm], fill=SPARKLE_COLOR, width=w)
        # diagonal arms (smaller)
        da = max(1, arm * 2 // 3)
        draw.line([sx - da, sy - da, sx + da, sy + da], fill=SPARKLE_COLOR, width=w)
        draw.line([sx - da, sy + da, sx + da, sy - da], fill=SPARKLE_COLOR, width=w)

    img.save(f'icons/icon-{size}.png')
    print(f'Generated icon-{size}.png')

print('Done!')
