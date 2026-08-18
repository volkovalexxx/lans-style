import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { isR2Enabled, putObjectToR2 } from './services/r2';

const dir = process.env.HERO_DIR || '/tmp/hero-encoded';

async function upload(name: string, key: string) {
  const filePath = path.join(dir, name);
  const buf = fs.readFileSync(filePath);
  const url = await putObjectToR2(key, buf, 'video/mp4');
  console.log(`${name} -> ${url} (${(buf.length / 1024 / 1024).toFixed(2)} MB)`);
}

async function main() {
  if (!isR2Enabled()) throw new Error('R2 env is not configured');
  await upload('hero-1080-hevc.mp4', 'static/hero-1080-hevc.mp4');
  await upload('hero-1080-avc.mp4', 'static/hero-1080-avc.mp4');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
