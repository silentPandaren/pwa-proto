// Generate PWA icons from showcase_logo.png + "webshop" label
const sharp = require('sharp');
const path = require('path');

const src = path.join(__dirname, 'public', 'images', 'showcase_logo.png');
const out = path.join(__dirname, 'public', 'icons');
const bg = { r: 26, g: 26, b: 26, alpha: 1 };

async function makeIcon(size) {
  const pad = Math.round(size * 0.08);
  const logoSize = Math.round(size * 0.62);
  const labelHeight = Math.round(size * 0.22);
  const fontSize = Math.round(size * 0.14);

  const label = Buffer.from(`
    <svg width="${size}" height="${size}">
      <rect x="0" y="${size - labelHeight}" width="${size}" height="${labelHeight}"
            fill="#005aff" rx="0"/>
      <text
        x="${size / 2}" y="${size - labelHeight / 2 + fontSize * 0.36}"
        font-family="Inter, Arial, sans-serif"
        font-size="${fontSize}"
        font-weight="700"
        fill="white"
        text-anchor="middle"
        letter-spacing="${Math.round(size * 0.01)}">webshop</text>
    </svg>
  `);

  await sharp(src)
    .resize(logoSize, logoSize, { fit: 'contain', background: bg })
    .extend({
      top: pad,
      bottom: labelHeight + pad,
      left: Math.round((size - logoSize) / 2),
      right: Math.round((size - logoSize) / 2),
      background: bg
    })
    .resize(size, size)
    .composite([{ input: label, top: 0, left: 0 }])
    .png()
    .toFile(path.join(out, `icon-${size}.png`));

  console.log(`icon-${size}.png done`);
}

// Maskable icons: content within inner 80% (safe zone = 10% padding each side)
async function makeMaskableIcon(size) {
  const safeZone = Math.round(size * 0.10);
  const inner = size - safeZone * 2;
  const logoSize = Math.round(inner * 0.62);
  const labelHeight = Math.round(inner * 0.22);
  const fontSize = Math.round(inner * 0.14);

  const label = Buffer.from(`
    <svg width="${inner}" height="${inner}">
      <rect x="0" y="${inner - labelHeight}" width="${inner}" height="${labelHeight}"
            fill="#005aff" rx="0"/>
      <text
        x="${inner / 2}" y="${inner - labelHeight / 2 + fontSize * 0.36}"
        font-family="Inter, Arial, sans-serif"
        font-size="${fontSize}"
        font-weight="700"
        fill="white"
        text-anchor="middle"
        letter-spacing="${Math.round(inner * 0.01)}">webshop</text>
    </svg>
  `);

  const pad = Math.round(inner * 0.08);
  const innerIcon = await sharp(src)
    .resize(logoSize, logoSize, { fit: 'contain', background: bg })
    .extend({
      top: pad,
      bottom: labelHeight + pad,
      left: Math.round((inner - logoSize) / 2),
      right: Math.round((inner - logoSize) / 2),
      background: bg
    })
    .resize(inner, inner)
    .composite([{ input: label, top: 0, left: 0 }])
    .png()
    .toBuffer();

  await sharp(innerIcon)
    .extend({
      top: safeZone,
      bottom: safeZone,
      left: safeZone,
      right: safeZone,
      background: bg
    })
    .png()
    .toFile(path.join(out, `icon-${size}-maskable.png`));

  console.log(`icon-${size}-maskable.png done`);
}

(async () => {
  await makeIcon(192);
  await makeIcon(512);
  await makeMaskableIcon(192);
  await makeMaskableIcon(512);
})();
