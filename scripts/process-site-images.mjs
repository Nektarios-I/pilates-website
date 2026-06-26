import { mkdir } from 'node:fs/promises';
import path from 'node:path';

import sharp from 'sharp';

const root = path.resolve('public/images');

const tasks = [
  {
    in: 'hero/corehouse-hero.png',
    out: 'home/hero.webp',
    width: 1200,
    height: 1500,
    format: 'webp',
  },
  {
    in: 'classes/Reformer.png',
    out: 'classes/reformer.webp',
    width: 1600,
    height: 900,
    format: 'webp',
  },
  {
    in: 'classes/Mats.png',
    out: 'classes/mat.webp',
    width: 1600,
    height: 900,
    format: 'webp',
  },
  {
    in: 'classes/Reformer.png',
    out: 'about/studio.webp',
    width: 1600,
    height: 1200,
    format: 'webp',
  },
  {
    in: 'classes/Reformer.png',
    out: 'seo/og-image.jpg',
    width: 1200,
    height: 630,
    format: 'jpeg',
  },
];

for (const task of tasks) {
  const input = path.join(root, task.in);
  const output = path.join(root, task.out);
  await mkdir(path.dirname(output), { recursive: true });

  let pipeline = sharp(input).resize(task.width, task.height, {
    fit: 'cover',
    position: 'centre',
  });

  if (task.format === 'webp') {
    pipeline = pipeline.webp({ quality: 85 });
  } else {
    pipeline = pipeline.jpeg({ quality: 85, mozjpeg: true });
  }

  await pipeline.toFile(output);
  console.log(`wrote ${task.out}`);
}
