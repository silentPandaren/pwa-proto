// Generate simple PNG icons using raw PNG format (no dependencies)
// Creates a solid blue square with a white shopping cart icon

const fs = require('fs');
const path = require('path');

// Minimal PNG writer
function createPNG(size, bgColor, fgColor) {
  const zlib = require('zlib');

  // PNG signature
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  function ihdr(w, h) {
    const data = Buffer.alloc(13);
    data.writeUInt32BE(w, 0);
    data.writeUInt32BE(h, 4);
    data[8] = 8;  // bit depth
    data[9] = 2;  // color type: RGB
    data[10] = 0; data[11] = 0; data[12] = 0;
    return chunk('IHDR', data);
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeB = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.concat([typeB, data]);
    const crc = Buffer.alloc(4);
    crc.writeInt32BE(crc32(crcBuf), 0);
    return Buffer.concat([len, typeB, data, crc]);
  }

  // CRC32
  const crcTable = (() => {
    const t = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = (c & 1) ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      t[i] = c;
    }
    return t;
  })();

  function crc32(buf) {
    let c = 0xFFFFFFFF;
    for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xFF] ^ (c >>> 8);
    return (c ^ 0xFFFFFFFF) | 0;
  }

  // Draw pixels
  const [br, bg, bb] = bgColor;
  const [fr, fg, fb] = fgColor;

  const rawRows = [];
  for (let y = 0; y < size; y++) {
    const row = Buffer.alloc(1 + size * 3);
    row[0] = 0; // filter type: none
    for (let x = 0; x < size; x++) {
      // Draw a simple "S" shape (shop icon) in the center
      const cx = size / 2, cy = size / 2;
      const r = size * 0.35;
      const dx = x - cx, dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      // Rounded rectangle border
      const margin = size * 0.1;
      const inner = size * 0.15;
      const inShape =
        x > margin && x < size - margin &&
        y > margin && y < size - margin &&
        !(x > inner + margin && x < size - inner - margin &&
          y > inner + margin && y < size - inner - margin);

      // Simple cart lines
      const cartX = cx, cartY = cy - size * 0.05;
      const bodyW = size * 0.35, bodyH = size * 0.2;
      const inCart =
        (Math.abs(x - cartX) < bodyW && Math.abs(y - cartY) < bodyH) ||
        // wheels
        (Math.sqrt((x - (cartX - bodyW * 0.5)) ** 2 + (y - (cartY + bodyH + size * 0.07)) ** 2) < size * 0.05) ||
        (Math.sqrt((x - (cartX + bodyW * 0.5)) ** 2 + (y - (cartY + bodyH + size * 0.07)) ** 2) < size * 0.05) ||
        // handle
        (x > cartX - bodyW * 0.1 && x < cartX + bodyW && y > cartY - bodyH - size * 0.1 && y < cartY - bodyH + size * 0.04);

      let r_, g_, b_;
      if (inCart) { r_ = fr; g_ = fg; b_ = fb; }
      else { r_ = br; g_ = bg; b_ = bb; }

      row[1 + x * 3] = r_;
      row[2 + x * 3] = g_;
      row[3 + x * 3] = b_;
    }
    rawRows.push(row);
  }

  const raw = Buffer.concat(rawRows);
  const compressed = zlib.deflateSync(raw);
  const idat = chunk('IDAT', compressed);
  const iend = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([sig, ihdr(size, size), idat, iend]);
}

const blue = [37, 99, 235];
const white = [255, 255, 255];

const outDir = path.join(__dirname, 'public', 'icons');
fs.writeFileSync(path.join(outDir, 'icon-192.png'), createPNG(192, blue, white));
fs.writeFileSync(path.join(outDir, 'icon-512.png'), createPNG(512, blue, white));
console.log('Icons generated: icon-192.png, icon-512.png');
