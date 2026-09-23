import { Router } from 'express';
import ExcelJS from 'exceljs';
import { prisma } from '../index';
import { authMiddleware } from '../middleware/auth';

// Read-only catalog export (products + categories) for the admin panel and
// Google Merchant Center. This route never writes to the database.

const router = Router();

const SITE_URL = (process.env.SITE_URL || 'https://lans-style.by').replace(/\/$/, '');
const BRAND = process.env.EXPORT_BRAND || 'Lans Style';

function absUrl(url?: string | null): string {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  return `${SITE_URL}${url.startsWith('/') ? '' : '/'}${url}`;
}

function stripHtml(s?: string | null): string {
  if (!s) return '';
  return s
    .replace(/<br\s*\/?>/gi, ' ')
    .replace(/<\/(p|div|li|h\d)>/gi, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\s+/g, ' ')
    .trim();
}

function colorNames(colors: string[]): string[] {
  return colors
    .map((c) => {
      try {
        const p = JSON.parse(c);
        return String(p?.name || p?.hex || '').trim();
      } catch {
        return String(c).trim();
      }
    })
    .filter(Boolean);
}

function money(v: unknown): string {
  const n = Number(v);
  return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}

function tsvCell(v: unknown): string {
  return String(v ?? '').replace(/[\t\r\n]+/g, ' ').trim();
}

async function loadCatalog() {
  const [categories, products] = await Promise.all([
    prisma.category.findMany({
      orderBy: [{ order: 'asc' }, { id: 'asc' }],
      include: { _count: { select: { products: true } } },
    }),
    prisma.product.findMany({
      orderBy: { id: 'asc' },
      include: {
        category: { select: { id: true, nameRu: true, nameEn: true, slug: true } },
        additionalCategories: { include: { category: { select: { nameRu: true } } } },
      },
    }),
  ]);
  return { categories, products };
}

type Catalog = Awaited<ReturnType<typeof loadCatalog>>;
type P = Catalog['products'][number];

const GMC_HEADERS = [
  'id', 'title', 'description', 'link', 'image_link', 'additional_image_link',
  'availability', 'price', 'brand', 'condition', 'product_type', 'color', 'size',
  'mpn', 'identifier_exists',
];

function gmcRow(p: P): string[] {
  const colors = colorNames(p.colors);
  const title = (p.nameRu || p.nameEn || '').slice(0, 150);
  const description = (stripHtml(p.descRu) || stripHtml(p.descEn) || title).slice(0, 5000);
  return [
    p.sku || String(p.id),
    title,
    description,
    `${SITE_URL}/product/${p.slug}`,
    absUrl(p.images[0]),
    p.images.slice(1, 11).map(absUrl).join(','),
    p.inStock ? 'in_stock' : 'out_of_stock',
    `${money(p.priceByn)} BYN`,
    BRAND,
    'new',
    p.category?.nameRu || '',
    colors.slice(0, 3).join('/'),
    p.sizes.length === 1 ? p.sizes[0] : '',
    p.sku || '',
    'no',
  ].map(tsvCell);
}

async function buildXlsx({ categories, products }: Catalog): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  wb.creator = BRAND;
  wb.created = new Date();

  const bold = (ws: ExcelJS.Worksheet) => {
    ws.getRow(1).font = { bold: true };
    ws.views = [{ state: 'frozen', ySplit: 1 }];
  };

  // 1) Google Merchant Center feed (active products only)
  const gmc = wb.addWorksheet('Google Merchant');
  gmc.columns = GMC_HEADERS.map((h) => ({ header: h, key: h, width: 22 }));
  products.filter((p) => !p.isArchived).forEach((p) => gmc.addRow(gmcRow(p)));
  bold(gmc);

  // 2) Full product list
  const ws = wb.addWorksheet('Товары');
  ws.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Артикул', key: 'sku', width: 14 },
    { header: 'Название (RU)', key: 'nameRu', width: 36 },
    { header: 'Название (EN)', key: 'nameEn', width: 36 },
    { header: 'Описание (RU)', key: 'descRu', width: 50 },
    { header: 'Описание (EN)', key: 'descEn', width: 50 },
    { header: 'Категория', key: 'category', width: 22 },
    { header: 'Доп. категории', key: 'extraCats', width: 28 },
    { header: 'Цена BYN', key: 'priceByn', width: 11 },
    { header: 'Цена USD', key: 'priceUsd', width: 11 },
    { header: 'Цена RUB', key: 'priceRub', width: 11 },
    { header: 'Размеры', key: 'sizes', width: 18 },
    { header: 'Цвета', key: 'colors', width: 22 },
    { header: 'Метки', key: 'labels', width: 16 },
    { header: 'В наличии', key: 'inStock', width: 10 },
    { header: 'Новинка', key: 'isNew', width: 9 },
    { header: 'Костюм', key: 'isCostume', width: 9 },
    { header: 'В архиве', key: 'isArchived', width: 9 },
    { header: 'Ссылка', key: 'link', width: 45 },
    { header: 'Фото (главное)', key: 'image', width: 45 },
    { header: 'Все фото', key: 'images', width: 60 },
    { header: 'Slug', key: 'slug', width: 30 },
    { header: 'Создан', key: 'createdAt', width: 18 },
  ];
  const yes = (b: boolean) => (b ? 'да' : 'нет');
  for (const p of products) {
    ws.addRow({
      id: p.id,
      sku: p.sku || '',
      nameRu: p.nameRu,
      nameEn: p.nameEn,
      descRu: stripHtml(p.descRu),
      descEn: stripHtml(p.descEn),
      category: p.category?.nameRu || '',
      extraCats: p.additionalCategories.map((c) => c.category.nameRu).join(', '),
      priceByn: Number(p.priceByn),
      priceUsd: Number(p.priceUsd),
      priceRub: Number(p.priceRub),
      sizes: p.sizes.join(', '),
      colors: colorNames(p.colors).join(', '),
      labels: p.labels.join(', '),
      inStock: yes(p.inStock),
      isNew: yes(p.isNew),
      isCostume: yes(p.isCostume),
      isArchived: yes(p.isArchived),
      link: `${SITE_URL}/product/${p.slug}`,
      image: absUrl(p.images[0]),
      images: p.images.map(absUrl).join(', '),
      slug: p.slug,
      createdAt: p.createdAt,
    });
  }
  bold(ws);

  // 3) Categories
  const cs = wb.addWorksheet('Категории');
  cs.columns = [
    { header: 'ID', key: 'id', width: 8 },
    { header: 'Название (RU)', key: 'nameRu', width: 28 },
    { header: 'Название (EN)', key: 'nameEn', width: 28 },
    { header: 'Slug', key: 'slug', width: 24 },
    { header: 'Порядок', key: 'order', width: 9 },
    { header: 'Товаров', key: 'count', width: 9 },
    { header: 'Ссылка', key: 'link', width: 45 },
    { header: 'Картинка', key: 'image', width: 45 },
  ];
  for (const c of categories) {
    cs.addRow({
      id: c.id,
      nameRu: c.nameRu,
      nameEn: c.nameEn,
      slug: c.slug,
      order: c.order,
      count: c._count.products,
      link: `${SITE_URL}/catalog/${c.slug}`,
      image: absUrl(c.image),
    });
  }
  bold(cs);

  const out = await wb.xlsx.writeBuffer();
  return Buffer.from(out as ArrayBuffer);
}

function buildTsv({ products }: Catalog): string {
  const lines = [GMC_HEADERS.join('\t')];
  for (const p of products) {
    if (p.isArchived) continue;
    lines.push(gmcRow(p).map(tsvCell).join('\t'));
  }
  return lines.join('\n') + '\n';
}

// GET /api/export/catalog?format=xlsx|tsv
router.get('/catalog', authMiddleware, async (req, res) => {
  const format = String(req.query.format || 'xlsx').toLowerCase();
  const date = new Date().toISOString().slice(0, 10);
  try {
    const catalog = await loadCatalog();
    if (format === 'tsv') {
      res.setHeader('Content-Type', 'text/tab-separated-values; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="google-merchant-${date}.tsv"`);
      res.send(buildTsv(catalog));
      return;
    }
    const buf = await buildXlsx(catalog);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="catalog-${date}.xlsx"`);
    res.send(buf);
  } catch (err: any) {
    console.error('Catalog export error:', err);
    res.status(500).json({ error: 'Export failed' });
  }
});

export default router;
