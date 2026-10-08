"""Generate Flappy Waifu extension icons from Sparky mascot at 16, 48, 128px."""
from PIL import Image

SIZES = [16, 48, 128]

mascot = Image.open('mascot.png').convert('RGBA')

# Crop to tight bounding box (remove whitespace around Sparky)
bbox = mascot.getbbox()
if bbox:
    mascot = mascot.crop(bbox)

for size in SIZES:
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))

    # Fit Sparky into the square, preserving aspect ratio
    ratio = min(size / mascot.width, size / mascot.height)
    new_w = int(mascot.width * ratio)
    new_h = int(mascot.height * ratio)
    resized = mascot.resize((new_w, new_h), Image.LANCZOS)

    # Center on transparent canvas
    offset_x = (size - new_w) // 2
    offset_y = (size - new_h) // 2
    img.paste(resized, (offset_x, offset_y), resized)

    img.save(f'icons/icon{size}.png')
    print(f'  icons/icon{size}.png ({size}x{size})')

print('Done — Sparky icons generated!')
