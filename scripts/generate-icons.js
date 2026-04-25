#!/usr/bin/env node
// Generates placeholder PWA icons (solid amber-700 squares)
const zlib = require('zlib');
const fs = require('fs');
const path = require('path');

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) c = (CRC_TABLE[(c ^ buf[i]) & 0xFF] ^ (c >>> 8)) >>> 0;
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type, 'ascii');
  const len = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, crc]);
}

function makePNG(size, r, g, b) {
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const hdr = Buffer.alloc(13);
  hdr.writeUInt32BE(size, 0); hdr.writeUInt32BE(size, 4);
  hdr[8] = 8; hdr[9] = 2;

  const row = 1 + size * 3;
  const raw = Buffer.alloc(size * row);
  for (let y = 0; y < size; y++) {
    const o = y * row;
    raw[o] = 0;
    for (let x = 0; x < size; x++) {
      raw[o + 1 + x * 3] = r;
      raw[o + 2 + x * 3] = g;
      raw[o + 3 + x * 3] = b;
    }
  }

  return Buffer.concat([sig, chunk('IHDR', hdr), chunk('IDAT', zlib.deflateSync(raw, { level: 9 })), chunk('IEND', Buffer.alloc(0))]);
}

const pub = path.join(__dirname, '..', 'public');
// amber-700 = #b45309 = rgb(180, 83, 9)
fs.writeFileSync(path.join(pub, 'icon-192.png'), makePNG(192, 180, 83, 9));
fs.writeFileSync(path.join(pub, 'icon-512.png'), makePNG(512, 180, 83, 9));
console.log('✅ icon-192.png et icon-512.png générés dans public/');
