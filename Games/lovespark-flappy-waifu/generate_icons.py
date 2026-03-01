"""Generate Flappy Waifu extension icons from sprite.png at 16, 48, 128px."""
from PIL import Image, ImageDraw

SIZES = [16, 48, 128]
BG_COLOR = (255, 110, 180)  # #ff6eb4

sprite = Image.open('sprite.png').convert('RGBA')

for size in SIZES:
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # Pink circle background
    pad = max(1, size // 16)
    draw.ellipse([pad, pad, size - pad - 1, size - pad - 1], fill=BG_COLOR)

    # Resize sprite to fit inside the circle with slight padding
    sprite_size = int(size * 0.82)
    resized = sprite.resize((sprite_size, sprite_size), Image.LANCZOS)

    # Center the sprite on the icon
    offset_x = (size - sprite_size) // 2
    offset_y = (size - sprite_size) // 2

    # Paste sprite over the pink circle (sprite has transparency)
    img.paste(resized, (offset_x, offset_y), resized)

    img.save(f'icons/icon{size}.png')
    print(f'  icons/icon{size}.png ({size}x{size})')

print('Done — sprite icons generated!')
