'use strict';
const zlib = require('zlib');
const fs   = require('fs');
const path = require('path');

// ── CRC32 ──────────────────────────────────────────────────────
const CRC_T = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
  CRC_T[i] = c >>> 0;
}
function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = CRC_T[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

// ── PNG chunk ──────────────────────────────────────────────────
function mkChunk(type, data) {
  const t   = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])), 0);
  return Buffer.concat([len, t, data, crc]);
}

// ── Build PNG (RGBA, 8-bit) ────────────────────────────────────
function buildPNG(size, pixelFn) {
  const SIG  = Buffer.from([137,80,78,71,13,10,26,10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; // 8-bit RGBA

  const rows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 4);
    row[0] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const [r,g,b,a] = pixelFn(x, y, size);
      row[1 + x*4 + 0] = r;
      row[1 + x*4 + 1] = g;
      row[1 + x*4 + 2] = b;
      row[1 + x*4 + 3] = a;
    }
    rows.push(row);
  }

  const compressed = zlib.deflateSync(Buffer.concat(rows), { level: 6 });
  return Buffer.concat([SIG, mkChunk('IHDR', ihdr), mkChunk('IDAT', compressed), mkChunk('IEND', Buffer.alloc(0))]);
}

// ── Icon pixel function ────────────────────────────────────────
function iconPixel(x, y, size) {
  const nx = (x + 0.5) / size;
  const ny = (y + 0.5) / size;

  // Rounded square background (corner radius ~22%)
  const cr  = 0.22;
  const rdx = Math.max(0, Math.abs(nx - 0.5) - (0.5 - cr));
  const rdy = Math.max(0, Math.abs(ny - 0.5) - (0.5 - cr));
  if (rdx*rdx + rdy*rdy > cr*cr) return [0, 0, 0, 0]; // transparent

  // Pink gradient: #FF69B4 (top) → #E8408F (bottom)
  const t   = ny;
  const bgR = Math.round(255 + t*(232-255));
  const bgG = Math.round(105 + t*( 64-105));
  const bgB = Math.round(180 + t*(143-180));

  // Brain shape centred at (0.5, 0.46)
  const bx = nx - 0.5;
  const by = ny - 0.46;

  function eld(cx, cy, rx, ry) {
    return Math.sqrt(((bx-cx)/rx)**2 + ((by-cy)/ry)**2);
  }

  const inLobes  = eld(-0.12, -0.06, 0.20, 0.16) < 1
                || eld( 0.12, -0.06, 0.20, 0.16) < 1;
  const inStem   = Math.abs(bx) < 0.09 && by > 0.09 && by < 0.20;
  const inCrease = Math.abs(bx) < 0.025 && by > -0.18 && by < 0.03;

  if (by > 0.20)                        return [bgR, bgG, bgB, 255];
  if ((inLobes || inStem) && !inCrease) return [255, 255, 255, 255];
  return [bgR, bgG, bgB, 255];
}

// ── Write all sizes ────────────────────────────────────────────
for (const size of [16, 32, 48, 128]) {
  const buf  = buildPNG(size, iconPixel);
  const file = path.join(__dirname, `icon-${size}.png`);
  fs.writeFileSync(file, buf);
  console.log(`✓ icon-${size}.png  (${buf.length} bytes)`);
}
console.log('\n✨ Done — reload the extension at chrome://extensions');
