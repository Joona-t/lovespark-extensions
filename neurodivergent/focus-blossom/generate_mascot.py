"""Generate Focus Blossom Sparky mascot — kawaii style with watering can.

Output: mascot.png (512x512, transparent background)
"""

from PIL import Image, ImageDraw, ImageFilter
import math
import os

SIZE = 512
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "mascot.png")

# ── Brand palette ──
PINK_BODY = (255, 183, 197)
PINK_LIGHT = (255, 218, 230)
PINK_DEEP = (232, 160, 192)
PINK_DARKER = (210, 130, 170)
PINK_ACCENT = (232, 69, 124)
WHITE = (255, 255, 255)
WHITE_FLUFF = (255, 245, 252)
BLACK_EYE = (25, 15, 20)
MOUTH_PINK = (232, 69, 124)
BLUE_WATER = (120, 200, 240)
BLUE_LIGHT = (170, 225, 250)
HEART_PINK = (255, 105, 180)
SLIPPER_WHITE = (255, 245, 250)
SLIPPER_INNER = (255, 190, 215)
CHEEK_BLUSH = (255, 150, 185, 120)


def el(draw, cx, cy, rx, ry, fill, outline=None, width=0):
    """Draw centered ellipse."""
    draw.ellipse(
        [cx - rx, cy - ry, cx + rx, cy + ry],
        fill=fill, outline=outline, width=width,
    )


def heart(draw, cx, cy, size, fill):
    """Draw a small heart shape."""
    r = size * 0.38
    el(draw, cx - r * 0.62, cy - r * 0.25, r, r, fill)
    el(draw, cx + r * 0.62, cy - r * 0.25, r, r, fill)
    draw.polygon([
        (cx - size * 0.5, cy + size * 0.02),
        (cx, cy + size * 0.6),
        (cx + size * 0.5, cy + size * 0.02),
    ], fill=fill)


def teardrop(draw, cx, cy, size, fill):
    """Draw a water teardrop."""
    r = size * 0.42
    el(draw, cx, cy + r * 0.2, r, r * 1.1, fill)
    draw.polygon([
        (cx, cy - size * 0.55),
        (cx - r * 0.55, cy),
        (cx + r * 0.55, cy),
    ], fill=fill)


def fluffy_circle(draw, cx, cy, radius, fill, puff_color, puff_count=16):
    """Draw a circle with fluffy puffs around the edge."""
    # Puff bumps around edge
    for i in range(puff_count):
        a = (i / puff_count) * math.pi * 2
        px = cx + math.cos(a) * radius * 0.92
        py = cy + math.sin(a) * radius * 0.92
        pr = radius * (0.22 + 0.06 * math.sin(i * 2.5))
        el(draw, px, py, pr, pr, puff_color)

    # Main body on top
    el(draw, cx, cy, radius * 0.88, radius * 0.88, fill)


def generate_mascot():
    img = Image.new("RGBA", (SIZE, SIZE), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    cx = SIZE * 0.42   # offset left for watering can space
    cy = SIZE * 0.50

    body_r = SIZE * 0.27

    # ──────────────────────────
    # EARS — drawn first (behind body)
    # ──────────────────────────
    ear_r = body_r * 0.32
    ear_y = cy - body_r * 0.82

    for side in [-1, 1]:
        ear_x = cx + side * body_r * 0.55
        # Outer ear with fluffy edge
        for i in range(10):
            a = (i / 10) * math.pi * 2
            px = ear_x + math.cos(a) * ear_r * 0.85
            py = ear_y + math.sin(a) * ear_r * 0.85
            el(draw, px, py, ear_r * 0.28, ear_r * 0.28, WHITE_FLUFF)
        el(draw, ear_x, ear_y, ear_r, ear_r, PINK_BODY)
        # Inner ear
        el(draw, ear_x, ear_y + ear_r * 0.08, ear_r * 0.58, ear_r * 0.58, PINK_DEEP)

    # ──────────────────────────
    # LEFT ARM — waving (behind body)
    # ──────────────────────────
    arm_w = body_r * 0.22
    arm_len = body_r * 0.5

    lax = cx - body_r * 0.92
    lay = cy - body_r * 0.05
    # Arm shape (tilted oval)
    el(draw, lax, lay, arm_w * 1.1, arm_len * 0.42, PINK_BODY)
    # Paw pad
    el(draw, lax, lay - arm_len * 0.28, arm_w * 0.55, arm_w * 0.55, PINK_DEEP)
    # Paw highlight
    el(draw, lax - arm_w * 0.15, lay - arm_len * 0.32, arm_w * 0.2, arm_w * 0.2, PINK_LIGHT)

    # ──────────────────────────
    # RIGHT ARM — reaching for can (behind body)
    # ──────────────────────────
    rax = cx + body_r * 0.82
    ray = cy + body_r * 0.05
    el(draw, rax, ray, arm_len * 0.45, arm_w * 1.1, PINK_BODY)
    # Paw
    el(draw, rax + arm_len * 0.32, ray, arm_w * 0.55, arm_w * 0.55, PINK_DEEP)

    # ──────────────────────────
    # BODY — fluffy circle
    # ──────────────────────────
    fluffy_circle(draw, cx, cy, body_r, PINK_BODY, WHITE_FLUFF, puff_count=20)

    # Body highlight — large soft sheen
    el(draw, cx - body_r * 0.2, cy - body_r * 0.28, body_r * 0.5, body_r * 0.35, PINK_LIGHT)
    # Small highlight dot
    el(draw, cx - body_r * 0.35, cy - body_r * 0.42, body_r * 0.12, body_r * 0.1, (255, 240, 248, 180))

    # ──────────────────────────
    # FACE
    # ──────────────────────────
    face_y = cy - body_r * 0.02

    # Eyes — big shiny
    eye_spacing = body_r * 0.34
    eye_r = body_r * 0.2
    for side in [-1, 1]:
        ex = cx + side * eye_spacing
        ey = face_y - body_r * 0.12

        # Eye white (slight)
        el(draw, ex, ey, eye_r * 1.08, eye_r * 1.12, (40, 30, 35))
        # Main eye
        el(draw, ex, ey, eye_r, eye_r * 1.05, BLACK_EYE)
        # Large highlight
        el(draw, ex - eye_r * 0.3, ey - eye_r * 0.3, eye_r * 0.4, eye_r * 0.4, WHITE)
        # Small highlight
        el(draw, ex + eye_r * 0.22, ey + eye_r * 0.18, eye_r * 0.18, eye_r * 0.18, WHITE)

    # Rosy cheeks
    for side in [-1, 1]:
        chx = cx + side * body_r * 0.5
        chy = face_y + body_r * 0.13
        el(draw, chx, chy, body_r * 0.13, body_r * 0.08, CHEEK_BLUSH)

    # Mouth — wide happy smile
    mouth_y = face_y + body_r * 0.2
    mouth_w = body_r * 0.32
    draw.arc(
        [cx - mouth_w, mouth_y - mouth_w * 0.4, cx + mouth_w, mouth_y + mouth_w * 0.7],
        10, 170,
        fill=MOUTH_PINK, width=max(4, int(body_r * 0.07)),
    )

    # Tiny tongue
    tongue_r = body_r * 0.06
    el(draw, cx, mouth_y + mouth_w * 0.15, tongue_r * 1.5, tongue_r, PINK_ACCENT)

    # Heart on cheek
    heart(draw, cx + body_r * 0.12, mouth_y + body_r * 0.06, body_r * 0.1, HEART_PINK)

    # ──────────────────────────
    # WATERING CAN — larger, clearly pink
    # ──────────────────────────
    can_x = cx + body_r * 1.22
    can_y = cy + body_r * 0.02
    can_w = body_r * 0.55
    can_h = body_r * 0.65

    # Can body (rounded rect)
    can_rad = int(can_w * 0.18)
    bbox = [can_x - can_w / 2, can_y - can_h / 2, can_x + can_w / 2, can_y + can_h / 2]
    draw.rounded_rectangle(bbox, radius=can_rad, fill=PINK_BODY, outline=PINK_DARKER, width=3)

    # Bottom accent band
    band_top = can_y + can_h * 0.15
    draw.rounded_rectangle(
        [can_x - can_w / 2, band_top, can_x + can_w / 2, can_y + can_h / 2],
        radius=can_rad, fill=PINK_DEEP,
    )
    # Re-draw outline on bottom so band doesn't break it
    draw.rounded_rectangle(bbox, radius=can_rad, outline=PINK_DARKER, width=3)

    # Kawaii shine on can body
    el(draw, can_x - can_w * 0.15, can_y - can_h * 0.15, can_w * 0.09, can_h * 0.15, (255, 240, 248, 180))

    # Handle — arc on left side
    handle_r = can_h * 0.28
    handle_cx = can_x - can_w / 2 - handle_r * 0.35
    draw.arc(
        [handle_cx - handle_r, can_y - handle_r * 0.9,
         handle_cx + handle_r, can_y + handle_r * 0.9],
        80, 280,
        fill=PINK_DARKER, width=max(4, int(can_w * 0.1)),
    )

    # Spout — thicker, angled up-right
    spout_sx = can_x + can_w * 0.28
    spout_sy = can_y - can_h * 0.38
    spout_ex = can_x + can_w * 0.72
    spout_ey = can_y - can_h * 0.72
    draw.line(
        [(spout_sx, spout_sy), (spout_ex, spout_ey)],
        fill=PINK_DEEPER if False else PINK_DEEP,
        width=max(5, int(can_w * 0.14)),
    )
    # Nozzle tip
    el(draw, spout_ex, spout_ey, can_w * 0.09, can_w * 0.09, PINK_ACCENT)

    # Water drops — larger, cascading
    drop_size = body_r * 0.12
    drops = [
        (spout_ex + 6, spout_ey + 14, drop_size),
        (spout_ex + 20, spout_ey + 30, drop_size * 0.9),
        (spout_ex + 3, spout_ey + 48, drop_size * 0.8),
        (spout_ex + 24, spout_ey + 62, drop_size * 0.7),
    ]
    for dx, dy, ds in drops:
        teardrop(draw, dx, dy, ds, BLUE_WATER)
        # Tiny highlight on each drop
        el(draw, dx - ds * 0.15, dy - ds * 0.1, ds * 0.12, ds * 0.12, BLUE_LIGHT)

    # ──────────────────────────
    # BUNNY SLIPPERS — bigger, cuter
    # ──────────────────────────
    slipper_y = cy + body_r * 0.78
    slipper_rx = body_r * 0.26
    slipper_ry = body_r * 0.17

    for side in [-1, 1]:
        sx = cx + side * body_r * 0.34
        # Slipper body
        el(draw, sx, slipper_y, slipper_rx, slipper_ry, SLIPPER_WHITE,
           outline=SLIPPER_INNER, width=2)
        # Bunny ears
        ear_size = slipper_rx * 0.28
        for es in [-1, 1]:
            esx = sx + es * slipper_rx * 0.38
            esy = slipper_y - slipper_ry * 1.0
            el(draw, esx, esy, ear_size, ear_size * 1.8, SLIPPER_WHITE)
            el(draw, esx, esy + ear_size * 0.25, ear_size * 0.5, ear_size * 1.2, SLIPPER_INNER)
        # Eyes
        dot_r = slipper_rx * 0.09
        for ds in [-1, 1]:
            el(draw, sx + ds * slipper_rx * 0.28, slipper_y - slipper_ry * 0.15, dot_r, dot_r, BLACK_EYE)
        # Nose
        el(draw, sx, slipper_y + slipper_ry * 0.08, dot_r * 1.3, dot_r * 0.9, PINK_DEEP)

    # ──────────────────────────
    # FLOATING HEARTS
    # ──────────────────────────
    hearts = [
        (cx - body_r * 0.95, cy - body_r * 0.98, body_r * 0.18),
        (cx + body_r * 0.4, cy - body_r * 1.08, body_r * 0.13),
        (cx + body_r * 1.5, cy - body_r * 0.5, body_r * 0.15),
    ]
    for hx, hy, hs in hearts:
        heart(draw, hx, hy, hs, HEART_PINK)

    # ──────────────────────────
    # SAVE
    # ──────────────────────────
    img.save(OUT, "PNG")
    print(f"Generated {OUT} ({SIZE}x{SIZE})")


if __name__ == "__main__":
    generate_mascot()
