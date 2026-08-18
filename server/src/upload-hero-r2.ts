import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { isR2Enabled, putObjectToR2 } from './services/r2';

const dir = process.env.HERO_DIR || '/tmp/hero-upload';

async function main() {
  if (!isR2Enabled()) throw new Error('R2 env is not configured');

  const mp4Path = path.join(dir, 'hero.mp4');
  const jpgPath = path.join(dir, 'hero-new3.jpg');
  if (!fs.existsSync(mp4Path) || !fs.existsSync(jpgPath)) {
    throw new Error(`hero files missing in ${dir}`);
  }

  const mp4 = fs.readFileSync(mp4Path);
  const videoUrl = await putObjectToR2('static/hero.mp4', mp4, 'video/mp4');
  console.log(`video ${videoUrl} (${(mp4.length / 1024 / 1024).toFixed(2)} MB)`);

  const webp = await sharp(fs.readFileSync(jpgPath))
    .rotate()
    .resize({ width: 1920, withoutEnlargement: true })
    .webp({ quality: 72 })
    .toBuffer();
  const imageUrl = await putObjectToR2('static/hero-desktop.webp', webp, 'image/webp');
  console.log(`desktop ${imageUrl} (${(webp.length / 1024).toFixed(0)} KB, from ${(fs.statSync(jpgPath).size / 1024).toFixed(0)} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
