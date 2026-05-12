import { Router } from 'express';
import { prisma } from '../index';
import { authMiddleware } from '../middleware/auth';

const router = Router();

async function ensureCards() {
  for (let i = 0; i < 5; i++) {
    await prisma.homeCategoryCard.upsert({
      where: { position: i },
      create: { position: i, imageSource: 'latest' },
      update: {},
    });
  }
}

router.get('/', async (_req, res) => {
  await ensureCards();

  const cards = await prisma.homeCategoryCard.findMany({
    orderBy: { position: 'asc' },
    include: {
      category: {
        include: { _count: { select: { products: true } } },
      },
    },
  });

  const resolved = await Promise.all(
    cards.map(async (card) => {
      let resolvedImage: string | null = null;

      if (card.imageSource === 'custom' && card.imageUrl) {
        resolvedImage = card.imageUrl;
      } else if (card.categoryId) {
        const latest = await prisma.product.findFirst({
          where: { categoryId: card.categoryId, isArchived: false, images: { isEmpty: false } },
          orderBy: { createdAt: 'desc' },
          select: { images: true },
        });
        resolvedImage = latest?.images[0] ?? null;
      }

      return { ...card, resolvedImage };
    })
  );

  res.json(resolved);
});

router.put('/:position', authMiddleware, async (req, res) => {
  const position = Number(req.params.position);
  const { categoryId, imageUrl, imageSource } = req.body;

  const card = await prisma.homeCategoryCard.upsert({
    where: { position },
    create: {
      position,
      categoryId: categoryId ? Number(categoryId) : null,
      imageUrl: imageUrl || null,
      imageSource: imageSource || 'latest',
    },
    update: {
      categoryId: categoryId ? Number(categoryId) : null,
      imageUrl: imageUrl || null,
      imageSource: imageSource || 'latest',
    },
    include: {
      category: { include: { _count: { select: { products: true } } } },
    },
  });

  res.json(card);
});

export default router;
