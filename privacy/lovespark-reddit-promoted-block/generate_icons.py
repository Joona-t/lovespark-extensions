"""Generate LoveSpark Reddit Ad Blocker icons — pink shield at 16, 48, 128px."""

from PIL import Image, ImageDraw

SIZES = [16, 48, 128]
PINK = (232, 69, 124)
WHITE = (255, 255, 255)

def draw_shield(size):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)

    # Shield body — rounded rect with pointed bottom
    pad = max(1, size // 8)
    w = size - pad * 2
    top = pad
    mid_y = int(size * 0.55)
    bot_y = size - pad

    # Upper rectangle portion
    r = max(2, size // 6)
    d.rounded_rectangle([pad, top, pad + w, mid_y], radius=r, fill=PINK)

    # Lower triangle portion (shield point)
    cx = size // 2
    d.polygon([(pad, mid_y - 1), (pad + w, mid_y - 1), (cx, bot_y)], fill=PINK)

    # White heart in center
    heart_size = max(3, size // 4)
    hx = cx
    hy = int(size * 0.4)
    hr = heart_size // 2

    if size >= 48:
        # Two overlapping circles + triangle for heart shape
        offset = max(1, hr // 2)
        d.ellipse([hx - offset - hr, hy - hr, hx - offset + hr, hy + hr], fill=WHITE)
        d.ellipse([hx + offset - hr, hy - hr, hx + offset + hr, hy + hr], fill=WHITE)
        d.polygon([hx - offset - hr, hy + 2, hx + offset + hr, hy + 2, hx, hy + heart_size + offset], fill=WHITE)
    else:
        # Small sizes: simple diamond/dot
        d.ellipse([hx - hr, hy - hr, hx + hr, hy + hr], fill=WHITE)

    return img

for s in SIZES:
    img = draw_shield(s)
    img.save(f'icons/icon{s}.png')
    print(f'Generated icons/icon{s}.png')
