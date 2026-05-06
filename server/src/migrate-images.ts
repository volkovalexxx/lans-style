import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const prisma = new PrismaClient();
const UPLOADS_DIR = '/app/uploads';

function saveBase64(dataUrl: string): string | null {
  const match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/s);
  if (!match) return null;
  const ext = match[1] === 'jpeg' ? 'jpg' : match[1];
  const buf = Buffer.from(match[2], 'base64');
  const hash = crypto.createHash('md5').update(buf).digest('hex').slice(0, 12);
  const filename = `${Date.now()}-${hash}.${ext}`;
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buf);
  return `/uploads/${filename}`;
}

async function main() {
  // Get IDs only — no image data
  const rows = await prisma.$queryRaw<{ id: number }[]>`
    SELECT id FROM "Product"
    WHERE EXISTS (
      SELECT 1 FROM unnest(images) AS img WHERE img LIKE 'data:%'
    )
  `;
  console.log(`${rows.length} products to migrate`);

  let done = 0;
  for (const { id } of rows) {
    // Get image count for this product
    const countRows = await prisma.$queryRaw<{ cnt: number }[]>`
      SELECT array_length(images, 1) AS cnt FROM "Product" WHERE id = ${id}
    `;
    const cnt = Number(countRows[0]?.cnt ?? 0);
    const newImages: string[] = [];

    for (let i = 1; i <= cnt; i++) {
      const imgRows = await prisma.$queryRaw<{ img: string }[]>`
        SELECT images[${i}] AS img FROM "Product" WHERE id = ${id}
      `;
      const img = imgRows[0]?.img ?? '';
      if (img.startsWith('data:')) {
        const url = saveBase64(img);
        newImages.push(url ?? img);
      } else {
        newImages.push(img);
      }
    }

    await prisma.$executeRaw`
      UPDATE "Product" SET images = ${newImages}::text[] WHERE id = ${id}
    `;

    done++;
    if (done % 25 === 0 || done === rows.length) {
      console.log(`  ${done}/${rows.length}`);
    }
  }

  console.log('Done!');
  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
