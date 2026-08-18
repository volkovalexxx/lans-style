import 'dotenv/config';
import fs from 'fs';
import path from 'path';
import { PrismaClient } from '@prisma/client';
import { isR2Enabled, r2ObjectExists, uploadImageToR2 } from './services/r2';

const prisma = new PrismaClient();
const uploadsDir = path.join(__dirname, '..', 'uploads');
const publicBase = (process.env.R2_PUBLIC_BASE_URL || '').replace(/\/$/, '');
const cache = new Map<string, string>();

function isLocalUpload(url: string | null | undefined): url is string {
  return Boolean(url && url.startsWith('/uploads/'));
}

function localPath(url: string): string {
  return path.join(uploadsDir, url.replace(/^\/uploads\//, ''));
}

function stableKey(url: string): string {
  const filename = path.basename(url).replace(/\.[^.]+$/, '');
  return `products/migrated/${filename}.webp`;
}

async function migrateUrl(url: string): Promise<string> {
  if (!isLocalUpload(url)) return url;
  const hit = cache.get(url);
  if (hit) return hit;

  const filePath = localPath(url);
  if (!fs.existsSync(filePath)) {
    console.warn(`missing file, keep original: ${url}`);
    cache.set(url, url);
    return url;
  }

  const key = stableKey(url);
  const existingUrl = `${publicBase}/${key}`;
  if (await r2ObjectExists(key)) {
    cache.set(url, existingUrl);
    console.log(`[${cache.size}] exists ${url} -> ${existingUrl}`);
    return existingUrl;
  }

  const buf = fs.readFileSync(filePath);
  const cdnUrl = await uploadImageToR2(buf, path.basename(filePath), stableKey(url));
  cache.set(url, cdnUrl);
  console.log(`[${cache.size}] ${url} -> ${cdnUrl} (${(buf.length / 1024 / 1024).toFixed(2)} MB)`);
  return cdnUrl;
}

async function main() {
  if (!isR2Enabled()) {
    throw new Error('R2 env is not configured');
  }

  const dbRows = await prisma.$queryRawUnsafe<Array<{ current_database: string }>>(
    'SELECT current_database()'
  );
  const dbName = dbRows[0]?.current_database;
  const expected = process.env.MIGRATE_DB_EXPECT;
  console.log(`connected database: ${dbName}`);
  if (expected && dbName !== expected) {
    throw new Error(`Refusing to migrate: expected ${expected}, got ${dbName}`);
  }

  const products = await prisma.product.findMany({ select: { id: true, images: true } });
  let productsChanged = 0;
  for (const product of products) {
    const next: string[] = [];
    let changed = false;
    for (const image of product.images) {
      const migrated = await migrateUrl(image);
      next.push(migrated);
      if (migrated !== image) changed = true;
    }
    if (changed) {
      await prisma.product.update({ where: { id: product.id }, data: { images: next } });
      productsChanged += 1;
    }
  }

  const categories = await prisma.category.findMany({ select: { id: true, image: true } });
  let categoriesChanged = 0;
  for (const category of categories) {
    if (!isLocalUpload(category.image)) continue;
    const migrated = await migrateUrl(category.image);
    if (migrated !== category.image) {
      await prisma.category.update({ where: { id: category.id }, data: { image: migrated } });
      categoriesChanged += 1;
    }
  }

  const cards = await prisma.homeCategoryCard.findMany({ select: { id: true, imageUrl: true } });
  let cardsChanged = 0;
  for (const card of cards) {
    if (!isLocalUpload(card.imageUrl)) continue;
    const migrated = await migrateUrl(card.imageUrl);
    if (migrated !== card.imageUrl) {
      await prisma.homeCategoryCard.update({ where: { id: card.id }, data: { imageUrl: migrated } });
      cardsChanged += 1;
    }
  }

  console.log(JSON.stringify({
    publicBase,
    uniqueUploads: cache.size,
    productsChanged,
    categoriesChanged,
    cardsChanged,
  }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
