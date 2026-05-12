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

async function generateSlug(name: string): Promise<string> {
  const base = transliterate(name);
  let slug = base;
  let counter = 1;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${base}-${counter++}`;
  }
  return slug;
}

async function syncAdditionalCategories(productId: number, ids: number[]) {
  await prisma.productCategory.deleteMany({ where: { productId } });
  if (ids.length) {
    await prisma.productCategory.createMany({
      data: ids.map((categoryId) => ({ productId, categoryId })),
      skipDuplicates: true,
    });
  }
}

router.get('/filters', async (req, res) => {
  const { categoryId } = req.query;

  const conditions: any[] = [{ isArchived: false }];
  if (categoryId) {
    conditions.push({
      OR: [
        { categoryId: Number(categoryId) },
        { additionalCategories: { some: { categoryId: Number(categoryId) } } },
      ],
    });
  }
  const where = { AND: conditions };

  const products = await prisma.product.findMany({
    where,
    select: { sizes: true, colors: true, labels: true, priceByn: true },
  });

  const sizesSet = new Set<string>();
  const colorsMap = new Map<string, { hex: string; name: string }>();
  const labelsSet = new Set<string>();
  let minPrice = Infinity;
  let maxPrice = 0;

  for (const p of products) {
    for (const s of p.sizes) sizesSet.add(s);
    for (const c of p.colors) {
      try {
        const parsed = JSON.parse(c);
        if (parsed.hex) colorsMap.set(parsed.hex, parsed);
      } catch {
        colorsMap.set(c, { hex: c, name: c });
      }
    }
    for (const l of p.labels) labelsSet.add(l);
    const price = Number(p.priceByn);
    if (price < minPrice) minPrice = price;
    if (price > maxPrice) maxPrice = price;
  }

  res.json({
    sizes: Array.from(sizesSet).sort(),
    colors: Array.from(colorsMap.values()),
    labels: Array.from(labelsSet),
    priceMin: minPrice === Infinity ? 0 : minPrice,
    priceMax: maxPrice,
  });
});

router.get('/', async (req, res) => {
  const { categoryId, isNew, inStock, search, sort, page = '1', limit = '12',
          size, color, priceMin, priceMax, label, archived } = req.query;

  const toArray = (v: any): string[] =>
    !v ? [] : Array.isArray(v) ? v.map(String) : [String(v)];
  const sizes = toArray(size);
  const colors = toArray(color);

  const conditions: any[] = [{ isArchived: archived === 'true' ? true : false }];

  if (categoryId) {
    conditions.push({
      OR: [
        { categoryId: Number(categoryId) },
        { additionalCategories: { some: { categoryId: Number(categoryId) } } },
      ],
    });
  }
  if (isNew === 'true') conditions.push({ isNew: true });
  if (inStock === 'true') conditions.push({ inStock: true });
  if (search) {
    conditions.push({
      OR: [
        { nameRu: { contains: String(search), mode: 'insensitive' } },
        { nameEn: { contains: String(search), mode: 'insensitive' } },
        { sku: { contains: String(search), mode: 'insensitive' } },
      ],
    });
  }
  if (sizes.length) conditions.push({ sizes: { hasSome: sizes } });
  if (colors.length) conditions.push({ colors: { hasSome: colors } });
  if (label) conditions.push({ labels: { has: String(label) } });
  if (priceMin || priceMax) {
    const priceCond: any = {};
    if (priceMin) priceCond.gte = Number(priceMin);
    if (priceMax) priceCond.lte = Number(priceMax);
    conditions.push({ priceByn: priceCond });
  }

  const where = { AND: conditions };

  let orderBy: any = { createdAt: 'desc' };
  if (sort === 'price_asc') orderBy = { priceByn: 'asc' };
  if (sort === 'price_desc') orderBy = { priceByn: 'desc' };
  if (sort === 'name') orderBy = { nameRu: 'asc' };

  const skip = (Number(page) - 1) * Number(limit);

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take: Number(limit),
      include: {
        category: true,
        additionalCategories: { select: { categoryId: true } },
      },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({ products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

router.get('/:slug', async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: {
      category: true,
      additionalCategories: { include: { category: true } },
      costumeTop: true,
      costumeBottom: true,
      costumeItem3: true,
      costumeItem4: true,
      costumeItem5: true,
    },
  });
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  prisma.pageVisit.create({
    data: { page: `/product/${req.params.slug}`, ip: req.ip, userAgent: req.headers['user-agent'] },
  }).catch(() => {});

  res.json(product);
});

router.post('/', authMiddleware, async (req, res) => {
  const { additionalCategoryIds, ...rest } = req.body;
  if (!rest.slug) {
    rest.slug = await generateSlug(rest.nameRu || rest.nameEn || 'product');
  }
  const product = await prisma.product.create({ data: rest, include: { category: true } });
  if (Array.isArray(additionalCategoryIds) && additionalCategoryIds.length) {
    await syncAdditionalCategories(product.id, additionalCategoryIds.map(Number));
  }
  res.status(201).json(product);
});

router.put('/:id', authMiddleware, async (req, res) => {
  const { additionalCategoryIds, ...rest } = req.body;
  const product = await prisma.product.update({
    where: { id: Number(req.params.id) },
    data: rest,
    include: { category: true },
  });
  await syncAdditionalCategories(product.id, Array.isArray(additionalCategoryIds) ? additionalCategoryIds.map(Number) : []);
  res.json(product);
});

// Bulk actions: archive / unarchive / delete
router.post('/bulk', authMiddleware, async (req, res) => {
  const { ids, action } = req.body as { ids: number[]; action: 'archive' | 'unarchive' | 'delete' };
  if (!Array.isArray(ids) || !ids.length) {
    res.status(400).json({ error: 'ids required' });
    return;
  }

  try {
    if (action === 'archive') {
      await prisma.product.updateMany({ where: { id: { in: ids } }, data: { isArchived: true } });
    } else if (action === 'unarchive') {
      await prisma.product.updateMany({ where: { id: { in: ids } }, data: { isArchived: false } });
    } else if (action === 'delete') {
      await prisma.$transaction(async (tx) => {
        await tx.orderItem.deleteMany({ where: { productId: { in: ids } } });
        await tx.product.deleteMany({ where: { id: { in: ids } } });
      });
    } else {
      res.status(400).json({ error: 'unknown action' });
      return;
    }
    res.json({ success: true });
  } catch (err: any) {
    console.error('Bulk action error:', err);
    res.status(500).json({ error: err.message || 'Bulk action failed' });
  }
});

router.delete('/:id', authMiddleware, async (req, res) => {
  const id = Number(req.params.id);
  try {
    await prisma.$transaction(async (tx) => {
      await tx.orderItem.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });
    });
    res.json({ success: true });
  } catch (err: any) {
    console.error('Delete product error:', err);
    res.status(500).json({ error: err.message || 'Delete failed' });
  }
});

export default router;
