import fs from 'node:fs';
import path from 'node:path';

import sharp from 'sharp';
import toIco from 'to-ico';

const logo_path = path.join('public/images/seo/corehouse_logo.png');
const seo_dir = path.join('public/images/seo');

async function square_png(size) {
  const pad = Math.round(size * 0.12);
  const inner = size - pad * 2;
  const resized = await sharp(logo_path)
    .resize({ width: inner, height: inner, fit: 'inside' })
    .png()
    .toBuffer();

  return sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 141, g: 133, b: 122, alpha: 1 },
    },
  })
    .composite([{ input: resized, gravity: 'centre' }])
    .png()
    .toBuffer();
}

async function main() {
  const sizes = [16, 32, 48, 192, 512];
  const png_buffers = {};

  for (const size of sizes) {
    png_buffers[size] = await square_png(size);
  }

  await fs.promises.writeFile(path.join(seo_dir, 'favicon-48.png'), png_buffers[48]);
  await fs.promises.writeFile(path.join(seo_dir, 'favicon-192.png'), png_buffers[192]);
  await fs.promises.writeFile(path.join(seo_dir, 'apple-icon.png'), await square_png(180));
  await fs.promises.writeFile(path.join(seo_dir, 'favicon-512.png'), png_buffers[512]);

  const ico = await toIco([png_buffers[16], png_buffers[32], png_buffers[48]]);
  await fs.promises.writeFile('public/favicon.ico', ico);
  await fs.promises.mkdir('src/app', { recursive: true });
  await fs.promises.writeFile('src/app/favicon.ico', ico);

  console.log('Generated favicon.ico and PNG icons from corehouse_logo.png');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
