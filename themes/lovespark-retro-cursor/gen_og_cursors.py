#!/usr/bin/env python3
"""Regenerate the three OG PNG cursor packs: retro-pink, sakura-peach, starlight-purple.

    python3 gen_og_cursors.py            # writes cursors/<pack>/cursor_<name>{,_32}.png
    python3 gen_og_cursors.py --sheet out.png   # also writes a verification contact sheet

Pillow only. Deterministic. Every shape is designed in a 32-unit coordinate space,
rasterised at 8x supersampling and LANCZOS-downscaled, so the 32px file is pixel-clean
and the 64px file (same filename without _32, the "retina" copy) is the identical
design at 2x.

Hotspots are fixed by content_script.js buildCursorCSS (NOT edited here):
    default, link                               -> 3 1
    text, grab, grabbing, crosshair, not_allowed, wait -> 8 8
so every shape is placed so that its natural hot point lands on that pixel:
    default   arrow tip: topmost opaque (halo) pixel at (2,1), first solid pixel at (2,2);
              the (3,1) hotspot sits on the halo row, one pixel right of the tip apex
    link      pointing-hand index-finger tip: topmost halo pixel at (2,1), first solid (1,2);
              hotspot (3,1) lands on the halo beside the fingertip
    text      I-beam stem centred on pixel (16,16), full-height
    grab      open hand, hotspot on the fingers above the palm
    grabbing  closed fist, hotspot on the knuckles
    crosshair centre pixel (16,16)
    not_allowed circle-slash centred on pixel (16,16)
    wait      clock face centred on pixel (16,16)

Style: filled diagonal gradient (highlight top-left -> core bottom-right), 1px dark
outline, 1px white halo so the shape never vanishes on white OR dark pages.
"""
import os
import sys
from PIL import Image, ImageDraw, ImageFilter

BASE = os.path.join(os.path.dirname(os.path.abspath(__file__)), "cursors")
SS = 8            # supersample factor relative to the 32px design grid
DESIGN = 32       # design-space size
HALO = (255, 255, 255, 255)

PALETTES = {
    "retro-pink":       {"core": "#FF62B4", "hi": "#FFD6EA", "outline": "#7A1E55"},
    "sakura-peach":     {"core": "#FF7188", "hi": "#FFE3D6", "outline": "#8C2A40"},
    "starlight-purple": {"core": "#B57BEE", "hi": "#EADCFF", "outline": "#7B4FC9"},
}

NAMES = ["default", "link", "text", "grab", "grabbing", "crosshair", "not_allowed", "wait"]
HOTSPOTS = {n: (16, 16) for n in NAMES}          # centred shapes -> CSS hotspot "16 16"
HOTSPOTS["default"] = HOTSPOTS["link"] = (3, 1)
HOTSPOTS["grab"] = HOTSPOTS["grabbing"] = (8, 8)


def hexrgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


# ── mask canvas ────────────────────────────────────────────────────────────────

class Canvas:
    """A supersampled L-mode mask plus a second 'ink' mask for interior detail lines."""

    def __init__(self, k):
        self.k = k                    # supersampled pixels per design unit
        n = DESIGN * k
        self.fill = Image.new("L", (n, n), 0)
        self.ink = Image.new("L", (n, n), 0)
        self.df = ImageDraw.Draw(self.fill)
        self.di = ImageDraw.Draw(self.ink)

    def _s(self, pts):
        k = self.k
        return [(x * k, y * k) for x, y in pts]

    def poly(self, pts, ink=False):
        (self.di if ink else self.df).polygon(self._s(pts), fill=255)

    def rrect(self, box, r, ink=False):
        k = self.k
        x0, y0, x1, y1 = [v * k for v in box]
        (self.di if ink else self.df).rounded_rectangle([x0, y0, x1, y1], radius=r * k, fill=255)

    def ellipse(self, box, ink=False):
        k = self.k
        (self.di if ink else self.df).ellipse([v * k for v in box], fill=255)

    def line(self, pts, w, ink=False):
        k = self.k
        (self.di if ink else self.df).line(self._s(pts), fill=255, width=int(round(w * k)), joint="curve")

    def ring(self, cx, cy, r_out, r_in, ink=False):
        k = self.k
        d = self.di if ink else self.df
        d.ellipse([(cx - r_out) * k, (cy - r_out) * k, (cx + r_out) * k, (cy + r_out) * k], fill=255)
        tmp = Image.new("L", self.fill.size, 0)
        ImageDraw.Draw(tmp).ellipse([(cx - r_in) * k, (cy - r_in) * k, (cx + r_in) * k, (cy + r_in) * k], fill=255)
        target = self.ink if ink else self.fill
        target.paste(0, mask=tmp)

    def erase(self, pts):
        self.df.polygon(self._s(pts), fill=0)


def dilate(mask, px, k):
    """Dilate an L mask by `px` design pixels with a ROUND footprint.

    Pillow only has a square MaxFilter, which blunts acute tips (an arrow apex
    becomes a flat 5px shelf). A Gaussian blur thresholded at the straight-edge
    distance `px` gives an isotropic, rounded dilation; it under-dilates acute
    corners, so union it with a smaller square dilation that guarantees minimum
    coverage everywhere (keeps the dark outline fully enclosing the fill).
    """
    r = px * k
    soft = mask.filter(ImageFilter.GaussianBlur(r)).point(lambda v: 255 if v >= 40 else 0)
    hard = mask.filter(ImageFilter.MaxFilter(2 * int(round(r * 0.6)) + 1))
    return Image.eval(Image.composite(soft, hard, soft), lambda v: v)  # union = soft | hard


def gradient_image(size, hi, core):
    """Diagonal gradient (top-left hi -> bottom-right core) as RGBA."""
    g = Image.linear_gradient("L").rotate(45, expand=True)           # top-left dark -> bottom-right light
    g = g.resize((size, size), Image.LANCZOS)
    a = Image.new("RGBA", (size, size), hexrgb(hi) + (255,))
    b = Image.new("RGBA", (size, size), hexrgb(core) + (255,))
    return Image.composite(b, a, g)


def render(shape, pal, size):
    """Rasterise `shape(canvas)` for one pack at `size` px (32 or 64)."""
    k = SS * size // DESIGN
    cv = Canvas(k)
    shape(cv)
    n = DESIGN * k
    out = Image.new("RGBA", (n, n), (0, 0, 0, 0))

    halo_m = dilate(cv.fill, 2, k)
    outline_m = dilate(cv.fill, 1, k)
    out.paste(Image.new("RGBA", (n, n), HALO), mask=halo_m)
    out.paste(Image.new("RGBA", (n, n), hexrgb(pal["outline"]) + (255,)), mask=outline_m)
    out.paste(gradient_image(n, pal["hi"], pal["core"]), mask=cv.fill)
    # interior detail lines: outline colour, clipped to the fill
    ink = Image.composite(cv.ink, Image.new("L", (n, n), 0), cv.fill)
    out.paste(Image.new("RGBA", (n, n), hexrgb(pal["outline"]) + (255,)), mask=ink)

    small = out.resize((size, size), Image.LANCZOS)
    # pixel-clean: snap alpha so there is no faint fringe outside the halo
    r, g, b, a = small.split()
    a = a.point(lambda v: 0 if v < 48 else (255 if v > 200 else v))
    return Image.merge("RGBA", (r, g, b, a))


# ── shapes (32-unit design space) ──────────────────────────────────────────────

def shape_default(cv):
    # Classic asymmetric arrow. Fill tip at (3.5, 3); outline+halo push the topmost opaque
    # (halo) pixel to (2,1) and the first solid pixel to (2,2) -- measured with PIL, see docstring.
    cv.poly([(3.5, 3), (3.5, 23.5), (9, 18.5), (12.5, 26.5), (16.5, 24.8), (13, 17), (19.5, 17)])


def shape_link(cv):
    # Pointing hand: index finger up on the LEFT, fingertip halo beside the (3,1) hotspot (measured: top opaque (2,1)).
    cv.rrect((1.5, 3, 6.5, 18), 2.4)                 # index finger (tip centre x=4 -> pixels 2..5)
    cv.rrect((1.5, 11, 18.5, 26), 3.0)               # palm
    for i, x in enumerate((6.5, 10.5, 14.5)):        # folded fingers, descending stair
        cv.rrect((x, 10 + i * 1.2, x + 4.2, 19), 2.0)
    cv.poly([(1.5, 14), (0.6, 17.5), (0.9, 21.5), (3, 23), (5, 19)])  # thumb
    cv.rrect((4, 23, 16, 28.5), 2.0)                 # cuff
    # knuckle separators
    for x in (6.7, 10.7, 14.7):
        cv.line([(x, 11.5), (x, 18)], 0.9, ink=True)
    cv.line([(4, 24.5), (16, 24.5)], 0.9, ink=True)


def shape_grab(cv):
    # Open hand, four fingers up; hotspot (8,8) lands on finger 2.
    tops = [4.5, 2, 2.8, 5]
    for i, top in enumerate(tops):
        x = 2.5 + i * 4.4
        cv.rrect((x, top, x + 4.0, 17), 2.0)
    cv.rrect((2.5, 12, 20.5, 25.5), 3.2)             # palm
    cv.poly([(2.5, 15), (0.5, 18.5), (1.5, 22.5), (4.5, 24), (6.5, 19)])  # thumb
    cv.rrect((5.5, 23, 18, 28), 2.0)                 # cuff
    for i in range(1, 4):
        x = 2.5 + i * 4.4 + 0.2
        cv.line([(x, 13), (x, 20)], 0.9, ink=True)
    cv.line([(5.5, 24.5), (18, 24.5)], 0.9, ink=True)


def shape_grabbing(cv):
    # Closed fist; hotspot (8,8) lands on the knuckles.
    for i in range(4):
        x = 2.5 + i * 4.4
        cv.rrect((x, 5.5 + (0.6 if i in (0, 3) else 0), x + 4.0, 14), 2.0)   # knuckles
    cv.rrect((2.5, 9, 20.5, 23.5), 3.2)              # palm
    cv.rrect((2, 15, 13, 20.5), 2.2)                 # thumb folded across the front
    cv.rrect((5.5, 21.5, 18, 27), 2.0)               # cuff
    for i in range(1, 4):
        x = 2.5 + i * 4.4 + 0.2
        cv.line([(x, 8), (x, 14.5)], 0.9, ink=True)
    cv.line([(3, 15.5), (12.5, 15.5)], 0.9, ink=True)
    cv.line([(5.5, 22.8), (18, 22.8)], 0.9, ink=True)


def shape_text(cv):
    # I-beam centred on pixel (16,16): 2px stem, full-height serifs (hotspot "16 16")
    cv.rrect((15.5, 3.5, 17.5, 29.5), 0.5)            # stem (2px) spanning y 3.5..29.5, centre 16.5
    cv.rrect((11.5, 3.5, 21.5, 6.5), 1.0)             # top serif
    cv.rrect((11.5, 26.5, 21.5, 29.5), 1.0)           # bottom serif


def shape_crosshair(cv):
    c = 16.5                                          # centre of pixel (16,16)
    cv.rrect((c - 1, 2.5, c + 1, 30.5), 0.4)          # vertical arm, 2px
    cv.rrect((2.5, c - 1, 30.5, c + 1), 0.4)          # horizontal arm, 2px
    cv.ring(c, c, 8.5, 6.3)                           # sight ring
    cv.erase([(c - 2.2, c - 2.2), (c + 2.2, c - 2.2), (c + 2.2, c + 2.2), (c - 2.2, c + 2.2)])  # open centre


def shape_not_allowed(cv):
    c = 16.5
    cv.ring(c, c, 12.5, 9.5)
    cv.line([(c - 9.0, c - 9.0), (c + 9.0, c + 9.0)], 3.0)   # slash, top-left -> bottom-right


def shape_wait(cv):
    c = 16.5
    cv.ellipse((c - 12.5, c - 12.5, c + 12.5, c + 12.5))      # face
    cv.rrect((c - 1.8, c - 15.2, c + 1.8, c - 12), 0.6)        # crown stub
    cv.line([(c, c), (c, c - 8.0)], 2.0, ink=True)             # hour hand (12)
    cv.line([(c, c), (c + 6.5, c + 0.6)], 2.0, ink=True)       # minute hand (3)
    cv.ellipse((c - 1.4, c - 1.4, c + 1.4, c + 1.4), ink=True)  # pivot
    for dx, dy in ((0, -9.8), (0, 9.8), (-9.8, 0), (9.8, 0)):  # tick marks
        cv.ellipse((c + dx - 0.9, c + dy - 0.9, c + dx + 0.9, c + dy + 0.9), ink=True)


SHAPES = {
    "default": shape_default, "link": shape_link, "text": shape_text, "grab": shape_grab,
    "grabbing": shape_grabbing, "crosshair": shape_crosshair, "not_allowed": shape_not_allowed,
    "wait": shape_wait,
}


# ── verification helpers ───────────────────────────────────────────────────────

def topmost_opaque(im):
    px = im.load()
    for y in range(im.height):
        xs = [x for x in range(im.width) if px[x, y][3] > 0]
        if xs:
            return (min(xs), y, max(xs))
    return None


def contact_sheet(packs, out_path):
    S = 4
    cell = 32 * S + 8
    bgs = [(255, 255, 255), (255, 214, 232), (28, 24, 34)]
    W, H = 8 * cell + 130, len(packs) * len(bgs) * (cell + 40)
    sheet = Image.new("RGB", (W, H), (200, 200, 200))
    d = ImageDraw.Draw(sheet)
    y = 0
    for p in packs:
        for bg in bgs:
            d.rectangle([0, y, W, y + cell + 40], fill=bg)
            d.text((4, y + 4), p, fill=(128, 128, 128))
            for i, n in enumerate(NAMES):
                im = Image.open(os.path.join(BASE, p, f"cursor_{n}_32.png")).convert("RGBA")
                x = 130 + i * cell
                big = im.resize((32 * S, 32 * S), Image.NEAREST)
                sheet.paste(big, (x, y + 4), big)
                sheet.paste(im, (x, y + 4 + 32 * S + 4), im)
                hx, hy = HOTSPOTS[n]
                d.rectangle([x + hx * S, y + 4 + hy * S, x + hx * S + S - 1, y + 4 + hy * S + S - 1],
                            outline=(0, 220, 0))
            y += cell + 40
    sheet.save(out_path)


def generate(sheet=None):
    for pack, pal in PALETTES.items():
        folder = os.path.join(BASE, pack)
        os.makedirs(folder, exist_ok=True)
        for name, shape in SHAPES.items():
            im32 = render(shape, pal, 32)
            im64 = render(shape, pal, 64)
            im32.save(os.path.join(folder, f"cursor_{name}_32.png"), optimize=True)
            im64.save(os.path.join(folder, f"cursor_{name}.png"), optimize=True)
            if pack == "retro-pink":
                print(f"  {name:12s} hotspot={HOTSPOTS[name]} topmost-opaque(x_min,y,x_max)={topmost_opaque(im32)}")
        print(f"  ✓ {pack}: 8 cursors × 2 sizes")
    if sheet:
        contact_sheet(list(PALETTES), sheet)
        print(f"  ✓ contact sheet -> {sheet}")


if __name__ == "__main__":
    args = sys.argv[1:]
    sheet = args[args.index("--sheet") + 1] if "--sheet" in args else None
    generate(sheet)
