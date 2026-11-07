/**
 * Generates raster brand assets (PWA icons, Apple touch icon, Open Graph image) from the
 * SVG logo, and optimises route illustrations. Run with: npm run assets
 */
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const root = path.resolve(import.meta.dirname, '..');
const pub = path.join(root, 'public');
const mark = fs.readFileSync(path.join(pub, 'favicon.svg'));

for (const size of [192, 512]) {
  await sharp(mark, { density: 512 }).resize(size, size).png({ compressionLevel: 9 }).toFile(path.join(pub, 'icons', `icon-${size}.png`));
}
// Maskable icon: mark centred in the 80 % safe zone on brand background.
await sharp({ create: { width: 512, height: 512, channels: 4, background: '#0A0A0A' } })
  .composite([{ input: await sharp(mark, { density: 512 }).resize(380, 380).png().toBuffer(), gravity: 'center' }])
  .png()
  .toFile(path.join(pub, 'icons', 'maskable-512.png'));
await sharp(mark, { density: 512 }).resize(180, 180).png().toFile(path.join(pub, 'apple-touch-icon.png'));
await sharp(mark, { density: 256 }).resize(48, 48).png().toFile(path.join(pub, 'favicon-48.png'));

const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs><radialGradient id="g" cx="50%" cy="0%" r="80%"><stop offset="0" stop-color="#CCFF00" stop-opacity=".18"/><stop offset="1" stop-color="#0A0A0A" stop-opacity="0"/></radialGradient></defs>
  <rect width="1200" height="630" fill="#0A0A0A"/><rect width="1200" height="630" fill="url(#g)"/>
  <g transform="translate(96 150) scale(2.2)"><rect width="64" height="64" rx="14" fill="#111"/><rect x="1" y="1" width="62" height="62" rx="13" fill="none" stroke="#CCFF00" stroke-opacity=".35" stroke-width="2"/><path d="M17 44 29 32 17 20" fill="none" stroke="#CCFF00" stroke-opacity=".45" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/><path d="M33 44 45 32 33 20" fill="none" stroke="#CCFF00" stroke-width="7" stroke-linecap="round" stroke-linejoin="round"/></g>
  <text x="270" y="250" font-family="Arial, Helvetica, sans-serif" font-size="84" font-weight="700" fill="#fff" letter-spacing="-2">Thus<tspan fill="#CCFF00">Stride</tspan></text>
  <text x="96" y="400" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="700" fill="#fff">Progressez en course à pied</text>
  <text x="96" y="465" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="700" fill="#CCFF00">sans vous blesser.</text>
  <text x="96" y="550" font-family="Arial, Helvetica, sans-serif" font-size="28" fill="#ffffff" fill-opacity=".6">Plan personnalisé · Zones cardiaques · Coach IA · Suivi de la fatigue</text>
</svg>`;
await sharp(Buffer.from(og)).png({ compressionLevel: 9 }).toFile(path.join(pub, 'og-image.png'));

const imgDir = path.join(root, 'src', 'assets', 'images');
for (const f of fs.readdirSync(imgDir).filter((f) => f.endsWith('.png'))) {
  const out = path.join(imgDir, f.replace(/_\d+\.png$/, '.webp').replace(/\.png$/, '.webp'));
  await sharp(path.join(imgDir, f)).resize({ width: 960, withoutEnlargement: true }).webp({ quality: 72 }).toFile(out);
  fs.unlinkSync(path.join(imgDir, f));
}
console.log('Brand assets generated.');
