#!/usr/bin/env python3
"""Generate pink shield PNG icons for LoveSpark AdBlock."""
import struct, zlib, math, os

def png_chunk(tag, data):
    c = struct.pack('>I', len(data)) + tag + data
    return c + struct.pack('>I', zlib.crc32(c[4:]) & 0xFFFFFFFF)

def write_png(path, w, h, pixels):
    """pixels: flat list of (r,g,b,a) for each pixel, row by row."""
    raw = b''
    for y in range(h):
        raw += b'\x00'  # filter type: None
        for x in range(w):
            r, g, b, a = pixels[y * w + x]
            raw += bytes([r, g, b, a])
    compressed = zlib.compress(raw, 9)
    sig   = b'\x89PNG\r\n\x1a\n'
    ihdr  = png_chunk(b'IHDR', struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0)
                      .replace(struct.pack('>IIBBBBB', w, h, 8, 2, 0, 0, 0),
                               struct.pack('>II', w, h) + bytes([8, 6, 0, 0, 0])))
    # Rebuild IHDR properly: width(4) height(4) bitdepth(1) colortype(1) compress(1) filter(1) interlace(1)
    ihdr_data = struct.pack('>II', w, h) + bytes([8, 6, 0, 0, 0])
    ihdr  = png_chunk(b'IHDR', ihdr_data)
    idat  = png_chunk(b'IDAT', compressed)
    iend  = png_chunk(b'IEND', b'')
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

def make_icon(size):
    s = size
    cx, cy = s / 2, s / 2
    m = s * 0.10  # margin

    # Shield polygon: rounded-top rectangle with pointed bottom
    # 7-point shield shape
    shield = [
        (m + s*0.08, m),              # top-left after rounding
        (s - m - s*0.08, m),          # top-right after rounding
        (s - m, m + s*0.10),          # right top
        (s - m, s * 0.58),            # right mid
        (s * 0.5, s - m),             # bottom point
        (m, s * 0.58),                # left mid
        (m, m + s*0.10),              # left top
    ]

    # Colors: hot pink top → deep pink bottom
    col_top = (255, 105, 180)   # #FF69B4
    col_bot = (220,  30, 120)   # deeper pink

    # White sparkle positions (relative to center)
    sparkle_arms = [
        (0, -1), (0, 1), (-1, 0), (1, 0),   # cardinal
        (-0.6, -0.6), (0.6, -0.6), (-0.6, 0.6), (0.6, 0.6),  # diagonal (shorter)
    ]
    sp_r = s * 0.14  # sparkle arm length
    sp_w = max(1, int(s * 0.025))  # line width

    pixels = [(0, 0, 0, 0)] * (s * s)

    for py in range(s):
        for px in range(s):
            in_shield = point_in_polygon(px + 0.5, py + 0.5, shield)
            if in_shield:
                # Vertical gradient
                t = (py - m) / (s - 2 * m)
                t = max(0.0, min(1.0, t))
                base = lerp_color(col_top, col_bot, t)

                # Soft highlight: top-left area slightly lighter
                hlx = (px - cx) / s
                hly = (py - cy) / s
                hl = max(0, 0.25 - hlx * 0.3 - hly * 0.5)
                r = min(255, int(base[0] + hl * 80))
                g = min(255, int(base[1] + hl * 40))
                b = min(255, int(base[2] + hl * 50))

                pixels[py * s + px] = (r, g, b, 255)

    # Draw thin dark border around shield
    border_col = (180, 20, 90, 255)
    for py in range(s):
        for px in range(s):
            in_s = point_in_polygon(px + 0.5, py + 0.5, shield)
            if not in_s:
                # Check if any neighbor is inside
                for dx, dy in [(-1,0),(1,0),(0,-1),(0,1)]:
                    nx, ny = px + dx, py + dy
                    if 0 <= nx < s and 0 <= ny < s:
                        if point_in_polygon(nx + 0.5, ny + 0.5, shield):
                            # This is a border pixel (outside next to inside)
                            pixels[py * s + px] = border_col
                            break

    # Draw sparkle (✨) in center-upper area
    spark_cx = cx
    spark_cy = cy * 0.85  # slightly above center
    for arm_dx, arm_dy in sparkle_arms:
        mag = math.hypot(arm_dx, arm_dy)
        ux, uy = arm_dx / mag, arm_dy / mag
        length = sp_r if mag == 1.0 else sp_r * 0.65

        steps = int(length * 2)
        for step in range(steps + 1):
            t = step / max(steps, 1)
            wx = spark_cx + ux * length * t
            wy = spark_cy + uy * length * t
            # Draw a small circle at this point
            for ddx in range(-sp_w, sp_w + 1):
                for ddy in range(-sp_w, sp_w + 1):
                    if ddx * ddx + ddy * ddy <= sp_w * sp_w:
                        ipx = int(wx + ddx)
                        ipy = int(wy + ddy)
                        if 0 <= ipx < s and 0 <= ipy < s:
                            if point_in_polygon(ipx + 0.5, ipy + 0.5, shield):
                                # White sparkle with alpha fade toward tips
                                alpha = int(255 * (1.0 - t * 0.4))
                                pixels[ipy * s + ipx] = (255, 255, 255, alpha)

    return pixels

# Generate icons
os.makedirs(os.path.dirname(os.path.abspath(__file__)), exist_ok=True)
script_dir = os.path.dirname(os.path.abspath(__file__))

for size, name in [(16, 'icon-16.png'), (48, 'icon-48.png'), (128, 'icon-128.png')]:
    print(f'Generating {name} ({size}×{size})...')
    pix = make_icon(size)
    out = os.path.join(script_dir, name)
    write_png(out, size, size, pix)
    print(f'  → {out}')

print('Done! 💕')
