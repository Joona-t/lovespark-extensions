"""Generate LoveSpark Notes extension icons from mascot.png"""
import os
from PIL import Image

SIZES = [16, 48, 128]
SRC = os.path.join(os.path.dirname(__file__), 'mascot.png')
OUT = os.path.join(os.path.dirname(__file__), 'icons')

os.makedirs(OUT, exist_ok=True)
img = Image.open(SRC).convert('RGBA')

for size in SIZES:
    resized = img.resize((size, size), Image.LANCZOS)
    resized.save(os.path.join(OUT, f'icon{size}.png'), 'PNG')
    print(f'  icon{size}.png')

print('Done.')
