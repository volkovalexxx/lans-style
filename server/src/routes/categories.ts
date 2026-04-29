import { Router } from 'express';
import { prisma } from '../index';
import { authMiddleware } from '../middleware/auth';

const router = Router();

function transliterate(str: string): string {
  const map: Record<string, string> = {
    а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',
    к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',
    х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
  };
  return str.toLowerCase()
    .split('')
    .map((c) => map[c] ?? c)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

async function generateCategorySlug(name: string): Promise<string> {
  const base = transliterate(name);
  let slug = base;
  let counter = 1;
  while (await prisma.category.findUnique({ where: { slug } })) {
    slug = `${base}-${counter++}`;
  }
  return slug;
}

// Public: get all categories with latest product preview
router.get('/', async (_req, res) => {
  const categories = await prisma.category.findMany({
    orderBy: { id: 'asc' },
    include: {
      _count: { select: { products: true } },
      products: {
        take: 1,
        orderBy: { createdAt: 'desc' },
        where: { images: { isEmpty: false } },
        select: { images: true },
      },
    },
  });

  // Flatten: extract first image as `previewImage`
  const withPreview = categories.map((c) => ({
    ...c,
    previewImage: c.products[0]?.images[0] || null,
    products: undefined, // don't leak the full products array
  }));

  res.json(withPreview);
});

// Public: get category by slug
router.get('/:slug', async (req, res) => {
  const category = await prisma.category.findUnique({
    where: { slug: req.params.slug },
    include: { products: true },
  });
  if (!category) {
    res.status(404).json({ error: 'Category not found' });
    return;
  }
  res.json(category);
});

// Admin: create category
router.post('/', authMiddleware, async (req, res) => {
  const { nameRu, nameEn, image } = req.body;
  const slug = req.body.slug || await generateCategorySlug(nameRu || nameEn || 'category');
  const category = await prisma.category.create({
    data: { slug, nameRu, nameEn, image },
  });
  res.status(201).json(category);
});

// Admin: update category
router.put('/:id', authMiddleware, async (req, res) => {
  const { slug, nameRu, nameEn, image } = req.body;
  const category = await prisma.category.update({
    where: { id: Number(req.params.id) },
    data: { slug, nameRu, nameEn, image },
  });
  res.json(category);
});

// Admin: delete category (cascade: removes products and their order items)
router.delete('/:id', authMiddleware, async (req, res) => {
  const categoryId = Number(req.params.id);

  await prisma.$transaction(async (tx) => {
    const products = await tx.product.findMany({
      where: { categoryId },
      select: { id: true },
    });
    const productIds = products.map((p) => p.id);

    if (productIds.length > 0) {
      await tx.orderItem.deleteMany({ where: { productId: { in: productIds } } });
      await tx.product.deleteMany({ where: { id: { in: productIds } } });
    }
    await tx.category.delete({ where: { id: categoryId } });
  });

  res.json({ success: true });
});

export default router;
