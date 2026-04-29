import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function translit(str: string): string {
  const map: Record<string, string> = {
    а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',
    к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',
    х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
  };
  return str.toLowerCase().split('').map((c) => map[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// Helpers
const color = (hex: string, name: string) => JSON.stringify({ hex, name });
const img = (seed: string) => `https://picsum.photos/seed/${seed}/720/960`;
const threeImgs = (slug: string) => [img(`${slug}-a`), img(`${slug}-b`), img(`${slug}-c`)];

interface Demo {
  categorySlug: string;
  nameRu: string;
  nameEn: string;
  sku?: string;
  descRu: string;
  priceByn: number;
  priceUsd: number;
  priceRub: number;
  sizes: string[];
  colors: string[];
  labels: string[];
}

const demos: Demo[] = [
  // Платья (dresses)
  { categorySlug: 'dresses', nameRu: 'Платье «Милана»', nameEn: 'Milana Dress', sku: 'LS-D-001',
    descRu: 'Приталенное платье из вискозы длиной миди, мягкая драпировка и деликатный V-вырез.',
    priceByn: 249, priceUsd: 75, priceRub: 6900, sizes: ['S','M','L'],
    colors: [color('#1a1a2e','Тёмно-синий'), color('#8c1c2c','Бордо')], labels: ['NEW'] },
  { categorySlug: 'dresses', nameRu: 'Платье «Оливия»', nameEn: 'Olivia Dress', sku: 'LS-D-002',
    descRu: 'Летнее платье-рубашка с поясом, лён-хлопок, воздушный крой.',
    priceByn: 189, priceUsd: 59, priceRub: 5400, sizes: ['XS','S','M','L','XL'],
    colors: [color('#F5F0EB','Кремовый'), color('#C4A882','Бежевый')], labels: ['NEW','-20%'] },
  { categorySlug: 'dresses', nameRu: 'Платье «Нуар»', nameEn: 'Noir Dress', sku: 'LS-D-003',
    descRu: 'Чёрное коктейльное платье с открытой спиной, плотный трикотаж премиум-класса.',
    priceByn: 329, priceUsd: 99, priceRub: 9400, sizes: ['S','M','L'],
    colors: [color('#000000','Чёрный')], labels: ['HIT'] },

  // Блузки (blouses)
  { categorySlug: 'blouses', nameRu: 'Блузка «Айви»', nameEn: 'Ivy Blouse', sku: 'LS-B-001',
    descRu: 'Шёлковая блузка с бантом у горловины, классический крой, плотный шёлк.',
    priceByn: 169, priceUsd: 52, priceRub: 4800, sizes: ['S','M','L'],
    colors: [color('#FFFFFF','Белый'), color('#F5F0EB','Кремовый')], labels: ['NEW'] },
  { categorySlug: 'blouses', nameRu: 'Блузка «Софи»', nameEn: 'Sophie Blouse', sku: 'LS-B-002',
    descRu: 'Лёгкая вискозная блузка с объёмным рукавом-фонариком.',
    priceByn: 129, priceUsd: 39, priceRub: 3700, sizes: ['XS','S','M','L'],
    colors: [color('#C4A882','Бежевый'), color('#000000','Чёрный')], labels: ['SALE','-30%'] },
  { categorySlug: 'blouses', nameRu: 'Рубашка «Лен»', nameEn: 'Linen Shirt', sku: 'LS-B-003',
    descRu: '100% лён, свободный крой и прямой силуэт — идеально для лета.',
    priceByn: 149, priceUsd: 45, priceRub: 4200, sizes: ['S','M','L','XL'],
    colors: [color('#FFFFFF','Белый'), color('#6B6B6B','Серый')], labels: [] },

  // Юбки (skirts)
  { categorySlug: 'skirts', nameRu: 'Юбка «Селина»', nameEn: 'Selina Skirt', sku: 'LS-S-001',
    descRu: 'Плиссированная юбка-миди из сатина, высокая посадка.',
    priceByn: 159, priceUsd: 48, priceRub: 4500, sizes: ['XS','S','M','L'],
    colors: [color('#C4A882','Бежевый'), color('#000000','Чёрный'), color('#8c1c2c','Бордо')], labels: ['NEW'] },
  { categorySlug: 'skirts', nameRu: 'Юбка «Скай»', nameEn: 'Sky Skirt', sku: 'LS-S-002',
    descRu: 'Карандаш из костюмной ткани, строгий силуэт и потайная молния.',
    priceByn: 139, priceUsd: 42, priceRub: 3900, sizes: ['S','M','L'],
    colors: [color('#000000','Чёрный'), color('#1a1a2e','Тёмно-синий')], labels: [] },

  // Брюки (pants)
  { categorySlug: 'pants', nameRu: 'Брюки «Палаццо»', nameEn: 'Palazzo Pants', sku: 'LS-P-001',
    descRu: 'Широкие брюки-палаццо из струящейся ткани с защипами.',
    priceByn: 179, priceUsd: 55, priceRub: 5000, sizes: ['S','M','L','XL'],
    colors: [color('#C4A882','Бежевый'), color('#000000','Чёрный')], labels: ['HIT'] },
  { categorySlug: 'pants', nameRu: 'Брюки «Чино»', nameEn: 'Chino Pants', sku: 'LS-P-002',
    descRu: 'Классические чиносы с прямым кроем, хлопок стрейч.',
    priceByn: 149, priceUsd: 45, priceRub: 4200, sizes: ['XS','S','M','L','XL'],
    colors: [color('#C4A882','Бежевый'), color('#1a1a1a','Чёрный'), color('#6B6B6B','Серый')], labels: [] },

  // Верхняя одежда (outerwear)
  { categorySlug: 'outerwear', nameRu: 'Пальто «Аврора»', nameEn: 'Aurora Coat', sku: 'LS-O-001',
    descRu: 'Оверсайз-пальто из шерсти с поясом, длина миди.',
    priceByn: 519, priceUsd: 159, priceRub: 14500, sizes: ['S','M','L'],
    colors: [color('#C4A882','Бежевый'), color('#1a1a1a','Чёрный')], labels: ['NEW','HIT'] },
  { categorySlug: 'outerwear', nameRu: 'Тренч «Эмма»', nameEn: 'Emma Trench', sku: 'LS-O-002',
    descRu: 'Классический тренч с двубортной застёжкой и поясом, хлопок с пропиткой.',
    priceByn: 399, priceUsd: 119, priceRub: 11200, sizes: ['S','M','L','XL'],
    colors: [color('#C4A882','Бежевый')], labels: ['NEW'] },
];

async function main() {
  const cats = await prisma.category.findMany();
  const bySlug = new Map(cats.map((c) => [c.slug, c]));

  let created = 0;
  let skipped = 0;

  for (const d of demos) {
    const cat = bySlug.get(d.categorySlug);
    if (!cat) { console.warn(`Category not found: ${d.categorySlug}`); skipped++; continue; }

    const slug = translit(d.nameRu);
    const exists = await prisma.product.findUnique({ where: { slug } });
    if (exists) { skipped++; continue; }

    await prisma.product.create({
      data: {
        slug,
        sku: d.sku,
        nameRu: d.nameRu,
        nameEn: d.nameEn,
        descRu: d.descRu,
        descEn: d.descRu,
        priceByn: d.priceByn,
        priceUsd: d.priceUsd,
        priceRub: d.priceRub,
        sizes: d.sizes,
        colors: d.colors,
        labels: d.labels,
        inStock: true,
        isNew: d.labels.includes('NEW'),
        images: threeImgs(slug),
        categoryId: cat.id,
      },
    });
    created++;
  }

  const total = await prisma.product.count();
  console.log(`✅ Created ${created}, skipped ${skipped}. Total products in DB: ${total}`);
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
