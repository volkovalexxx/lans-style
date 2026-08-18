import { HeadObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import sharp from 'sharp';

const bucket = process.env.R2_BUCKET || '';
const publicBase = (process.env.R2_PUBLIC_BASE_URL || '').replace(/\/$/, '');
const endpoint = process.env.R2_ENDPOINT || '';
const accessKeyId = process.env.R2_ACCESS_KEY_ID || '';
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || '';

let client: S3Client | null = null;

export function isR2Enabled(): boolean {
  return Boolean(bucket && publicBase && endpoint && accessKeyId && secretAccessKey);
}

function getClient(): S3Client {
  if (!client) {
    client = new S3Client({
      region: 'auto',
      endpoint,
      credentials: { accessKeyId, secretAccessKey },
    });
  }
  return client;
}

export async function uploadImageToR2(
  buffer: Buffer,
  originalName: string,
  key?: string
): Promise<string> {
  const webp = await sharp(buffer)
    .rotate()
    .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 72 })
    .toBuffer();

  const objectKey = key || `products/${Date.now()}-${Math.round(Math.random() * 1e9)}.webp`;
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: objectKey,
      Body: webp,
      ContentType: 'image/webp',
      CacheControl: 'public, max-age=31536000, immutable',
      Metadata: { original: originalName.slice(0, 180) },
    })
  );
  return `${publicBase}/${objectKey}`;
}

export async function r2ObjectExists(key: string): Promise<boolean> {
  try {
    await getClient().send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return true;
  } catch {
    return false;
  }
}

export async function putObjectToR2(
  key: string,
  body: Buffer,
  contentType: string
): Promise<string> {
  await getClient().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
    })
  );
  return `${publicBase}/${key}`;
}
