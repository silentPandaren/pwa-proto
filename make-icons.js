// Generate PWA icons from showcase_logo.png + "webshop" label
const sharp = require('sharp');
const path = require('path');

const src = path.join(__dirname, 'public', 'images', 'showcase_logo.png');
const out = path.join(__dirname, 'public', 'icons');

async function makeIcon(size) {
  const pad = Math.round(size * 0.08);
  const logoSize = Math.round(size * 0.62);
  const labelHeight = Math.round(size * 0.22);
  const fontSize = Math.round(size * 0.14);

  // SVG label "webshop" at the bottom
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
    .resize(logoSize, logoSize, { fit: 'contain', background: { r: 26, g: 26, b: 26, alpha: 1 } })
    .extend({
      top: pad,
      bottom: labelHeight + pad,
      left: Math.round((size - logoSize) / 2),
      right: Math.round((size - logoSize) / 2),
      background: { r: 26, g: 26, b: 26, alpha: 1 }
    })
    .resize(size, size)
    .composite([{ input: label, top: 0, left: 0 }])
    .png()
    .toFile(path.join(out, `icon-${size}.png`));

  console.log(`icon-${size}.png done`);
}

(async () => {
  await makeIcon(192);
  await makeIcon(512);
})();
