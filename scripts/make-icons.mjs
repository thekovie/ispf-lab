// Generates the ISPF Lab icon set without any image dependency:
//   src/app/favicon.ico (16 + 32 + 48 px), src/app/icon.png (512), src/app/apple-icon.png (180),
//   public/icons/icon-192.png, public/icons/icon-512.png
// Design: dark CRT square, cyan panel rows, a green block cursor with a phosphor glow — the "unprotected field".
// Run: node scripts/make-icons.mjs   (see docs/06-design-direction.md §Icon)
import { deflateSync } from "node:zlib";
import { mkdirSync, writeFileSync } from "node:fs";

const BG = [6, 9, 13];
const BEZEL = [31, 43, 54];
const CYAN = [79, 209, 255];
const GREEN = [51, 255, 102];
const DIM = [92, 108, 122];

function lerp(a, b, t) {
  return a.map((v, i) => Math.round(v + (b[i] - v) * t));
}

/** Paint one pixel of an n×n icon. Coordinates are normalised to a 16-unit design grid. */
function pixel(x, y, n) {
  const u = (x / n) * 16;
  const v = (y / n) * 16;
  // rounded square mask
  const r = 2.4;
  const cx = Math.min(Math.max(u, r), 16 - r);
  const cy = Math.min(Math.max(v, r), 16 - r);
  if (Math.hypot(u - cx, v - cy) > r) return [0, 0, 0, 0];
  // bezel ring
  const edge = Math.min(u, v, 16 - u, 16 - v);
  if (edge < 0.9) return [...BEZEL, 255];
  // block cursor (green)
  if (u >= 3 && u < 6.6 && v >= 9.6 && v < 13.4) return [...GREEN, 255];
  // glow around the cursor
  const dx = Math.max(3 - u, 0, u - 6.6);
  const dy = Math.max(9.6 - v, 0, v - 13.4);
  const d = Math.hypot(dx, dy);
  if (d < 1.6) return [...lerp(BG, GREEN, 0.28 * (1 - d / 1.6)), 255];
  // panel rows: title (cyan, short), two protected lines (dim), field underline after the cursor
  const row = (y0, x0, x1, colour) => v >= y0 && v < y0 + 1.2 && u >= x0 && u < x1 && colour;
  const hit = row(3, 3, 9.5, CYAN) || row(5.6, 3, 12.5, DIM) || row(7.4, 3, 11, DIM) || row(12.2, 7.4, 13, lerp(BG, GREEN, 0.45));
  if (hit) return [...hit, 255];
  return [...BG, 255];
}

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf) {
  let crc = 0xffffffff;
  for (const b of buf) crc = CRC_TABLE[(crc ^ b) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}

function png(n) {
  const stride = n * 4 + 1;
  const raw = Buffer.alloc(stride * n);
  const offsets = [[0.25, 0.25], [0.75, 0.25], [0.25, 0.75], [0.75, 0.75]];
  for (let y = 0; y < n; y++) {
    raw[y * stride] = 0; // filter: none
    for (let x = 0; x < n; x++) {
      const acc = [0, 0, 0, 0]; // 2x2 supersampling for smooth edges
      for (const [ox, oy] of offsets) {
        const p = pixel(x + ox, y + oy, n);
        for (let i = 0; i < 4; i++) acc[i] += p[i];
      }
      const o = y * stride + 1 + x * 4;
      for (let i = 0; i < 4; i++) raw[o + i] = Math.round(acc[i] / 4);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(n, 0);
  ihdr.writeUInt32BE(n, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/** ICO container holding PNG-encoded images (supported by every modern browser). */
function ico(sizes) {
  const images = sizes.map((n) => png(n));
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const entries = [];
  let offset = 6 + 16 * images.length;
  images.forEach((img, i) => {
    const e = Buffer.alloc(16);
    const n = sizes[i];
    e[0] = n >= 256 ? 0 : n;
    e[1] = n >= 256 ? 0 : n;
    e.writeUInt16LE(1, 4); // colour planes
    e.writeUInt16LE(32, 6); // bits per pixel
    e.writeUInt32LE(img.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += img.length;
    entries.push(e);
  });
  return Buffer.concat([header, ...entries, ...images]);
}

mkdirSync("public/icons", { recursive: true });
writeFileSync("src/app/favicon.ico", ico([16, 32, 48]));
writeFileSync("src/app/icon.png", png(512));
writeFileSync("src/app/apple-icon.png", png(180));
writeFileSync("public/icons/icon-192.png", png(192));
writeFileSync("public/icons/icon-512.png", png(512));
console.log("icons written: favicon.ico (16/32/48), icon.png 512, apple-icon.png 180, public/icons 192/512");
