#!/usr/bin/env python3
"""Generate pink shield PNG icons with mute symbol for LoveSpark Twitch AdBlock."""
import struct, zlib, math, os

def png_chunk(tag, data):
    c = struct.pack('>I', len(data)) + tag + data
    return c + struct.pack('>I', zlib.crc32(c[4:]) & 0xFFFFFFFF)

def write_png(path, w, h, pixels):
    raw = b''
    for y in range(h):
        raw += b'\x00'
        for x in range(w):
            r, g, b, a = pixels[y * w + x]
            raw += bytes([r, g, b, a])
    compressed = zlib.compress(raw, 9)
    sig = b'\x89PNG\r\n\x1a\n'
    ihdr_data = struct.pack('>II', w, h) + bytes([8, 6, 0, 0, 0])
    ihdr = png_chunk(b'IHDR', ihdr_data)
    idat = png_chunk(b'IDAT', compressed)
    iend = png_chunk(b'IEND', b'')
    with open(path, 'wb') as f:
        f.write(sig + ihdr + idat + iend)

def point_in_polygon(x, y, poly):
    n = len(poly)
    inside = False
    j = n - 1
    for i in range(n):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / (yj - yi) + xi):
            inside = not inside
        j = i
    return inside

def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))

def dist(x1, y1, x2, y2):
    return math.hypot(x2 - x1, y2 - y1)

def make_icon(size):
    s = size
    cx, cy = s / 2, s / 2
    m = s * 0.10

    # Shield polygon
    shield = [
        (m + s * 0.08, m),
        (s - m - s * 0.08, m),
        (s - m, m + s * 0.10),
        (s - m, s * 0.58),
        (s * 0.5, s - m),
        (m, s * 0.58),
        (m, m + s * 0.10),
    ]

    col_top = (232, 69, 124)   # #E8457C
    col_bot = (214, 52, 102)   # #D63466

    pixels = [(0, 0, 0, 0)] * (s * s)

    # Fill shield with gradient
    for py in range(s):
        for px in range(s):
            if not point_in_polygon(px + 0.5, py + 0.5, shield):
                continue
            t = max(0.0, min(1.0, (py - m) / (s - 2 * m)))
            base = lerp_color(col_top, col_bot, t)
            # Soft highlight top-left
            hlx = (px - cx) / s
            hly = (py - cy) / s
            hl = max(0, 0.25 - hlx * 0.3 - hly * 0.5)
            r = min(255, int(base[0] + hl * 60))
            g = min(255, int(base[1] + hl * 30))
            b = min(255, int(base[2] + hl * 40))
            pixels[py * s + px] = (r, g, b, 255)

    # Border
    border_col = (180, 20, 90, 255)
    for py in range(s):
        for px in range(s):
            if point_in_polygon(px + 0.5, py + 0.5, shield):
                continue
            for dx, dy in [(-1, 0), (1, 0), (0, -1), (0, 1)]:
                nx, ny = px + dx, py + dy
                if 0 <= nx < s and 0 <= ny < s:
                    if point_in_polygon(nx + 0.5, ny + 0.5, shield):
                        pixels[py * s + px] = border_col
                        break

    # Draw mute speaker icon in center (white)
    # Speaker body: small rectangle + triangle cone
    # X lines for "mute"
    icon_cx = cx
    icon_cy = cy * 0.88
    icon_s = s * 0.18  # scale factor

    for py in range(s):
        for px in range(s):
            if not point_in_polygon(px + 0.5, py + 0.5, shield):
                continue

            rx = (px - icon_cx) / icon_s
            ry = (py - icon_cy) / icon_s

            drawn = False

            # Speaker body (rectangle -1.2 to -0.3, -0.5 to 0.5)
            if -1.2 <= rx <= -0.3 and -0.4 <= ry <= 0.4:
                drawn = True

            # Speaker cone (triangle from -0.3 to 0.8)
            if -0.3 <= rx <= 0.8:
                spread = 0.4 + (rx + 0.3) * 0.5
                if abs(ry) <= spread:
                    drawn = True

            # Mute X: two diagonal lines from (1.0, -0.7) to (2.0, 0.7) and back
            if size >= 32:  # Only draw X on larger icons
                lw = max(0.15, 0.25)
                # Line 1: top-left to bottom-right
                line_t = (rx - 1.0) / 1.0  # 0 at x=1.0, 1 at x=2.0
                if 0 <= line_t <= 1:
                    target_y = -0.7 + line_t * 1.4
                    if abs(ry - target_y) < lw:
                        drawn = True
                    # Line 2: bottom-left to top-right
                    target_y2 = 0.7 - line_t * 1.4
                    if abs(ry - target_y2) < lw:
                        drawn = True

            if drawn:
                pixels[py * s + px] = (255, 255, 255, 240)

    return pixels

# Generate icons
script_dir = os.path.dirname(os.path.abspath(__file__))
icons_dir = os.path.join(script_dir, 'icons')
os.makedirs(icons_dir, exist_ok=True)

for size, name in [(16, 'icon-16.png'), (48, 'icon-48.png'), (128, 'icon-128.png')]:
    print(f'Generating {name} ({size}x{size})...')
    pix = make_icon(size)
    out = os.path.join(icons_dir, name)
    write_png(out, size, size, pix)
    print(f'  -> {out}')

print('Done!')
