"""Generate Sparky icons at 16, 48, and 128px from mascot.png."""
from pathlib import Path
from PIL import Image

SIZES = [16, 48, 128]
ROOT = Path(__file__).parent
SRC = ROOT / "mascot.png"
ICONS_DIR = ROOT / "icons"

mascot = Image.open(SRC).convert("RGBA")

for size in SIZES:
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    scale = size / mascot.height
    new_w = round(mascot.width * scale)
    new_h = size
    resized = mascot.resize((new_w, new_h), Image.LANCZOS)
    x = (size - new_w) // 2
    canvas.paste(resized, (x, 0), resized)
    canvas.save(ICONS_DIR / f"icon{size}.png")
    print(f"  icon{size}.png ({size}x{size})")

print("Done!")
