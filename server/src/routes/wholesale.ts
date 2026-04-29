import { Router } from 'express';
import { prisma } from '../index';
import { authMiddleware } from '../middleware/auth';
import { sendWholesaleNotification } from '../services/email';
import { notifyNewWholesale } from '../services/telegram';

const router = Router();

// Public: create wholesale request
router.post('/', async (req, res) => {
  const { company, name, phone, email, city, comment } = req.body;

  if (!company || !name || !phone || !email) {
    res.status(400).json({ error: 'Company, name, phone and email are required' });
    return;
  }

  const request = await prisma.wholesaleRequest.create({
    data: { company, name, phone, email, city, comment },
  });

  sendWholesaleNotification(request).catch(console.error);
  notifyNewWholesale(request).catch(console.error);

  res.status(201).json(request);
});

// Admin: list wholesale requests
router.get('/', authMiddleware, async (req, res) => {
  const { status, page = '1', limit = '20' } = req.query;
  const where: any = {};
  if (status) where.status = String(status);

  const skip = (Number(page) - 1) * Number(limit);
  const [requests, total] = await Promise.all([
    prisma.wholesaleRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
    }),
    prisma.wholesaleRequest.count({ where }),
  ]);

  res.json({ requests, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

// Admin: update request status
router.put('/:id', authMiddleware, async (req, res) => {
  const request = await prisma.wholesaleRequest.update({
    where: { id: Number(req.params.id) },
    data: { status: req.body.status },
  });
  res.json(request);
});

// Admin: delete request
router.delete('/:id', authMiddleware, async (req, res) => {
  await prisma.wholesaleRequest.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
});

export default router;
