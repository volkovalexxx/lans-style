import { Router } from 'express';
import { prisma } from '../index';
import { authMiddleware } from '../middleware/auth';
import { sendOrderNotification } from '../services/email';
import { notifyNewOrder } from '../services/telegram';

const router = Router();

// Public: create order
router.post('/', async (req, res) => {
  const { name, phone, email, comment, items } = req.body;

  if (!name || !phone || !items?.length) {
    res.status(400).json({ error: 'Name, phone and items are required' });
    return;
  }

  const order = await prisma.order.create({
    data: {
      name,
      phone,
      email,
      comment,
      items: {
        create: items.map((item: any) => ({
          productId: item.productId,
          size: item.size,
          color: item.color,
          quantity: item.quantity || 1,
        })),
      },
    },
    include: {
      items: { include: { product: true } },
    },
  });

  // Send notifications (non-blocking)
  sendOrderNotification(order).catch(console.error);
  notifyNewOrder(order).catch(console.error);

  res.status(201).json(order);
});

// Admin: list orders
router.get('/', authMiddleware, async (req, res) => {
  const { status, page = '1', limit = '20' } = req.query;
  const where: any = {};
  if (status) where.status = String(status);

  const skip = (Number(page) - 1) * Number(limit);
  const [orders, total] = await Promise.all([
    prisma.order.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: Number(limit),
      include: { items: { include: { product: true } } },
    }),
    prisma.order.count({ where }),
  ]);

  res.json({ orders, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

// Admin: update order status
router.put('/:id', authMiddleware, async (req, res) => {
  const order = await prisma.order.update({
    where: { id: Number(req.params.id) },
    data: { status: req.body.status },
    include: { items: { include: { product: true } } },
  });
  res.json(order);
});

// Admin: delete order
router.delete('/:id', authMiddleware, async (req, res) => {
  await prisma.orderItem.deleteMany({ where: { orderId: Number(req.params.id) } });
  await prisma.order.delete({ where: { id: Number(req.params.id) } });
  res.json({ success: true });
});

export default router;
