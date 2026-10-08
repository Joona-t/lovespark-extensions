#!/usr/bin/env python3
"""Generate pink digest/document icons at 16, 48, 128px using Pillow."""

from PIL import Image, ImageDraw
import os


HOT_PINK = (255, 105, 180, 255)
LIGHT_PINK = (255, 208, 232, 255)
GLOW_PINK = (255, 105, 180, 80)
WHITE = (255, 255, 255, 255)


def draw_document(draw, x, y, w, h, color):
    """Draw a document/page shape with folded corner."""
    fold = int(w * 0.28)
    # Main body
    draw.rectangle([x, y + fold, x + w, y + h], fill=color)
    draw.rectangle([x, y, x + w - fold, y + h], fill=color)
    # Folded corner triangle
    draw.polygon([
        (x + w - fold, y),
        (x + w, y + fold),
        (x + w - fold, y + fold),
    ], fill=color)


def draw_lines(draw, x, y, w, count, color, thickness=1):
    """Draw horizontal text-like lines on the document."""
    spacing = max(2, int(w * 0.18))
    for i in range(count):
        ly = y + i * spacing
        line_w = w * (0.7 if i % 3 == 0 else 0.9)
        draw.rectangle([x, ly, x + int(line_w), ly + thickness], fill=color)


def draw_sparkle(draw, cx, cy, size, color):
    """Draw a 4-point sparkle."""
    draw.line([(cx - size, cy), (cx + size, cy)], fill=color, width=1)
    draw.line([(cx, cy - size), (cx, cy + size)], fill=color, width=1)


def generate_icon(size):
    """Create a single RGBA icon at given pixel size."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    pad = max(1, int(size * 0.1))
    doc_w = int(size * 0.6)
    doc_h = int(size * 0.75)
    doc_x = pad + int(size * 0.05)
    doc_y = pad

    if size <= 16:
        # Simple: just the document
        draw_document(draw, doc_x, doc_y, doc_w, doc_h, HOT_PINK)
        # 2 tiny lines
        lx = doc_x + 2
        ly = doc_y + int(doc_h * 0.4)
        draw.rectangle([lx, ly, lx + int(doc_w * 0.5), ly], fill=WHITE)
        draw.rectangle([lx, ly + 2, lx + int(doc_w * 0.7), ly + 2], fill=WHITE)
    else:
        # Glow layer
        glow_img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
        glow_draw = ImageDraw.Draw(glow_img)
        gx = doc_x - 1
        gy = doc_y - 1
        draw_document(glow_draw, gx, gy, doc_w + 2, doc_h + 2, GLOW_PINK)
        img = Image.alpha_composite(img, glow_img)
        draw = ImageDraw.Draw(img)

        # Main document
        draw_document(draw, doc_x, doc_y, doc_w, doc_h, HOT_PINK)

        # Lines inside document
        line_x = doc_x + int(doc_w * 0.12)
        line_y = doc_y + int(doc_h * 0.35)
        line_w = int(doc_w * 0.76)
        thickness = max(1, size // 32)
        num_lines = 4 if size >= 48 else 3
        draw_lines(draw, line_x, line_y, line_w, num_lines, LIGHT_PINK, thickness)

        # Sparkles (48px+)
        if size >= 48:
            sp_size = max(2, size // 16)
            draw_sparkle(draw, size - pad - sp_size, pad + sp_size, sp_size, HOT_PINK)
            if size >= 128:
                draw_sparkle(draw, size - pad * 2, int(size * 0.4), sp_size - 1, LIGHT_PINK)
                draw_sparkle(draw, int(size * 0.15), size - pad * 2, sp_size - 1, HOT_PINK)

        # Magnifying glass / AI indicator (bottom-right)
        if size >= 48:
            mg_r = int(size * 0.16)
            mg_cx = int(size * 0.72)
            mg_cy = int(size * 0.72)
            # Circle
            draw.ellipse(
                [mg_cx - mg_r, mg_cy - mg_r, mg_cx + mg_r, mg_cy + mg_r],
                outline=LIGHT_PINK, width=max(2, size // 32)
            )
            # Handle
            hx = mg_cx + int(mg_r * 0.7)
            hy = mg_cy + int(mg_r * 0.7)
            draw.line(
                [(hx, hy), (hx + int(mg_r * 0.6), hy + int(mg_r * 0.6))],
                fill=LIGHT_PINK, width=max(2, size // 32)
            )

    return img


def main():
    out_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'icons')
    os.makedirs(out_dir, exist_ok=True)

    for size in [16, 48, 128]:
        img = generate_icon(size)
        path = os.path.join(out_dir, f'icon-{size}.png')
        img.save(path, 'PNG', optimize=True)
        print(f'Generated {path} ({size}x{size})')


if __name__ == '__main__':
    main()
