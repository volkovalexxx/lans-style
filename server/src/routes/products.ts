import { Router } from 'express';
import { prisma } from '../index';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// Transliterate Russian to Latin for auto-slug
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

// Public: get filter options (all unique sizes, colors, price range)
router.get('/filters', async (req, res) => {
  const { categoryId } = req.query;
  const where: any = {};
  if (categoryId) where.categoryId = Number(categoryId);

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

// Public: list products with filtering
router.get('/', async (req, res) => {
  const { categoryId, isNew, inStock, search, sort, page = '1', limit = '12',
          size, color, priceMin, priceMax, label } = req.query;

  // Support both single value and array: ?size=42&size=44 or ?size=42
  const toArray = (v: any): string[] =>
    !v ? [] : Array.isArray(v) ? v.map(String) : [String(v)];
  const sizes = toArray(size);
  const colors = toArray(color);

  const where: any = {};
  if (categoryId) where.categoryId = Number(categoryId);
  if (isNew === 'true') where.isNew = true;
  if (inStock === 'true') where.inStock = true;
  if (search) {
    where.OR = [
      { nameRu: { contains: String(search), mode: 'insensitive' } },
      { nameEn: { contains: String(search), mode: 'insensitive' } },
      { sku: { contains: String(search), mode: 'insensitive' } },
    ];
  }
  if (sizes.length) where.sizes = { hasSome: sizes };
  if (colors.length) where.colors = { hasSome: colors };
  if (label) where.labels = { has: String(label) };
  if (priceMin || priceMax) {
    where.priceByn = {};
    if (priceMin) where.priceByn.gte = Number(priceMin);
    if (priceMax) where.priceByn.lte = Number(priceMax);
  }

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
      include: { category: true },
    }),
    prisma.product.count({ where }),
  ]);

  res.json({ products, total, page: Number(page), pages: Math.ceil(total / Number(limit)) });
});

// Public: get product by slug
router.get('/:slug', async (req, res) => {
  const product = await prisma.product.findUnique({
    where: { slug: req.params.slug },
    include: {
      category: true,
      costumeTop: true,
      costumeBottom: true,
    },
  });
  if (!product) {
    res.status(404).json({ error: 'Product not found' });
    return;
  }

  prisma.pageVisit.create({
    data: {
      page: `/product/${req.params.slug}`,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    },
  }).catch(() => {});

  res.json(product);
});

// Admin: create product (auto-generate slug if not provided)
router.post('/', authMiddleware, async (req, res) => {
  const data = { ...req.body };
  if (!data.slug) {
    data.slug = await generateSlug(data.nameRu || data.nameEn || 'product');
  }
  const product = await prisma.product.create({
    data,
    include: { category: true },
  });
  res.status(201).json(product);
});

// Admin: update product
router.put('/:id', authMiddleware, async (req, res) => {
  const product = await prisma.product.update({
    where: { id: Number(req.params.id) },
    data: req.body,
    include: { category: true },
  });
  res.json(product);
});

// Admin: delete product (cascade: also removes its order items)
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
