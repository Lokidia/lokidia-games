import zlib from "zlib";
import fs from "fs";
import path from "path";

// CRC32 lookup table (PNG spec)
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = c & 1 ? (0xedb88320 ^ (c >>> 1)) : c >>> 1;
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(buf: Buffer): number {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++)
    c = (CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8)) >>> 0;
  return (c ^ 0xffffffff) >>> 0;
}

function pngChunk(type: string, data: Buffer): Buffer {
  const t = Buffer.from(type, "ascii");
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

function makePNG(size: number): Buffer {
  // IHDR: RGB 8-bit
  const hdr = Buffer.alloc(13);
  hdr.writeUInt32BE(size, 0);
  hdr.writeUInt32BE(size, 4);
  hdr[8] = 8; // bit depth
  hdr[9] = 2; // color type: RGB

  // Pixel buffer — start with amber-700 background #b45309
  const px = new Uint8Array(size * size * 3);
  for (let i = 0; i < size * size; i++) {
    px[i * 3] = 0xb4;     // R 180
    px[i * 3 + 1] = 0x53; // G 83
    px[i * 3 + 2] = 0x09; // B 9
  }

  // Draw white "L": vertical bar + horizontal bar at bottom
  const stroke = Math.round(size * 0.14);
  const x0 = Math.round(size * 0.27);   // left of vertical bar
  const y0 = Math.round(size * 0.20);   // top
  const y1 = Math.round(size * 0.80);   // bottom
  const x1 = Math.round(size * 0.73);   // right of horizontal bar

  function setWhite(px_: Uint8Array, y: number, x: number) {
    if (x < 0 || x >= size || y < 0 || y >= size) return;
    const i = (y * size + x) * 3;
    px_[i] = px_[i + 1] = px_[i + 2] = 255;
  }

  // Vertical bar
  for (let y = y0; y < y1; y++)
    for (let x = x0; x < x0 + stroke; x++)
      setWhite(px, y, x);

  // Horizontal bar (bottom)
  for (let y = y1 - stroke; y < y1; y++)
    for (let x = x0; x < x1; x++)
      setWhite(px, y, x);

  // Build PNG scanlines (1 filter byte per row)
  const rowLen = 1 + size * 3;
  const raw = Buffer.alloc(size * rowLen);
  for (let y = 0; y < size; y++) {
    raw[y * rowLen] = 0; // filter: None
    for (let x = 0; x < size; x++) {
      const src = (y * size + x) * 3;
      const dst = y * rowLen + 1 + x * 3;
      raw[dst] = px[src];
      raw[dst + 1] = px[src + 1];
      raw[dst + 2] = px[src + 2];
    }
  }

  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    pngChunk("IHDR", hdr),
    pngChunk("IDAT", zlib.deflateSync(raw, { level: 9 })),
    pngChunk("IEND", Buffer.alloc(0)),
  ]);
}

const pub = path.resolve(process.cwd(), "public");
fs.writeFileSync(path.join(pub, "icon-192.png"), makePNG(192));
fs.writeFileSync(path.join(pub, "icon-512.png"), makePNG(512));
console.log("✅ icon-192.png et icon-512.png générés dans public/");
