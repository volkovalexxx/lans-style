import { Router } from 'express';
import { prisma } from '../index';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Public: get all active pages
router.get('/', async (_req, res) => {
  const pages = await prisma.sitePage.findMany({
    where: { isActive: true },
  });
  res.json(pages);
});

// Public: get page by slug
router.get('/:slug', async (req, res) => {
  const page = await prisma.sitePage.findUnique({
    where: { slug: req.params.slug },
  });
  if (!page) {
    res.status(404).json({ error: 'Page not found' });
    return;
  }
  res.json(page);
});

// Admin: create page
router.post('/', authMiddleware, async (req, res) => {
  const page = await prisma.sitePage.create({ data: req.body });
  res.status(201).json(page);
});

// Admin: update page
router.put('/:id', authMiddleware, async (req, res) => {
  const page = await prisma.sitePage.update({
    where: { id: Number(req.params.id) },
    data: req.body,
  });
  res.json(page);
});

// Admin: delete page
router.delete('/:id', authMiddleware, async (req, res) => {
  await prisma.sitePage.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
});

export default router;
