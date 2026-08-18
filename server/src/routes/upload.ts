import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authMiddleware } from '../middleware/auth';
import { isR2Enabled, uploadImageToR2 } from '../services/r2';

const localDir = path.join(__dirname, '..', '..', 'uploads');

const diskStorage = multer.diskStorage({
  destination: localDir,
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  },
});

const upload = multer({
  storage: isR2Enabled() ? multer.memoryStorage() : diskStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(jpg|jpeg|png|webp|avif)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

async function storeFile(file: Express.Multer.File): Promise<string> {
  if (isR2Enabled()) {
    if (!file.buffer?.length) throw new Error('Empty upload');
    return uploadImageToR2(file.buffer, file.originalname);
  }
  if (!file.filename) throw new Error('Empty upload');
  if (!fs.existsSync(localDir)) fs.mkdirSync(localDir, { recursive: true });
  return `/uploads/${file.filename}`;
}

const router = Router();

router.post('/', authMiddleware, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No file uploaded' });
      return;
    }
    const url = await storeFile(req.file);
    res.json({ url });
  } catch (err: any) {
    console.error('upload failed', err);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

router.post('/multiple', authMiddleware, upload.array('images', 10), async (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files?.length) {
      res.status(400).json({ error: 'No files uploaded' });
      return;
    }
    const urls = [];
    for (const file of files) {
      urls.push(await storeFile(file));
    }
    res.json({ urls });
  } catch (err: any) {
    console.error('upload failed', err);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

export default router;
