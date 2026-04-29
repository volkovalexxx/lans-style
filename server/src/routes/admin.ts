import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../index';
import { authMiddleware, signToken } from '../middleware/auth';

const router = Router();

// Login
router.post('/login', async (req, res) => {
  const { login, password } = req.body;

  const admin = await prisma.admin.findUnique({ where: { login } });
  if (!admin) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const valid = await bcrypt.compare(password, admin.password);
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const token = signToken(admin.id);
  res.json({ token, admin: { id: admin.id, login: admin.login } });
});

// Verify token
router.get('/me', authMiddleware, async (req: any, res) => {
  const admin = await prisma.admin.findUnique({
    where: { id: req.adminId },
    select: { id: true, login: true },
  });
  if (!admin) {
    res.status(401).json({ error: 'Admin not found' });
    return;
  }
  res.json(admin);
});

// Stats
router.get('/stats', authMiddleware, async (_req, res) => {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalProducts,
    totalOrders,
    newOrders,
    totalWholesale,
    recentVisits,
    ordersByStatus,
  ] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.order.count({ where: { status: 'new' } }),
    prisma.wholesaleRequest.count({ where: { status: 'new' } }),
    prisma.pageVisit.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    prisma.order.groupBy({ by: ['status'], _count: true }),
  ]);

  res.json({
    totalProducts,
    totalOrders,
    newOrders,
    totalWholesale,
    recentVisits,
    ordersByStatus: ordersByStatus.map((s) => ({ status: s.status, count: s._count })),
  });
});

// Track page visit
router.post('/visit', async (req, res) => {
  await prisma.pageVisit.create({
    data: {
      page: req.body.page,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    },
  });
  res.json({ success: true });
});

export default router;
