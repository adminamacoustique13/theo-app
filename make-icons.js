'use strict';
// Fabrique les icônes de l'appli (une lune sur fond nuit) sans aucune dépendance.
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const table = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  table[n] = c >>> 0;
}
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const td = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td), 0);
  return Buffer.concat([len, td, crc]);
}
function png(size) {
  const row = size * 4 + 1;
  const raw = Buffer.alloc(row * size);
  const c = size / 2;
  const R = size * 0.3;
  for (let y = 0; y < size; y++) {
    raw[y * row] = 0;
    for (let x = 0; x < size; x++) {
      const dx = x - c, dy = y - c;
      const d = Math.sqrt(dx * dx + dy * dy);
      let r = 8 + 16 * (y / size), g = 10 + 10 * (y / size), b = 20 + 40 * (y / size);
      if (d < R) {
        const hx = x - (c - R * 0.35), hy = y - (c - R * 0.35);
        const t = Math.min(1, Math.sqrt(hx * hx + hy * hy) / (R * 1.5));
        r = 191 + (28 - 191) * t; g = 234 + (74 - 234) * t; b = 255 + (115 - 255) * t;
      } else {
        const glow = Math.exp(-(d - R) / (R * 0.35)) * 0.55;
        r += (74 - r) * glow; g += (163 - g) * glow; b += (216 - b) * glow;
      }
      const i = y * row + 1 + x * 4;
      raw[i] = Math.round(r); raw[i + 1] = Math.round(g); raw[i + 2] = Math.round(b); raw[i + 3] = 255;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; // profondeur
  ihdr[9] = 6; // RGBA
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0))
  ]);
}
function ensure(pub) {
  const dir = path.join(pub, 'icons');
  fs.mkdirSync(dir, { recursive: true });
  for (const s of [180, 192, 512]) {
    const f = path.join(dir, 'icon-' + s + '.png');
    if (!fs.existsSync(f)) fs.writeFileSync(f, png(s));
  }
}
module.exports = { ensure };
if (require.main === module) {
  ensure(path.join(__dirname, 'public'));
  console.log('Icônes créées dans public/icons');
}
