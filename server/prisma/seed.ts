import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  // Create admin
  const hashedPassword = await bcrypt.hash(process.env.ADMIN_PASSWORD || 'admin123', 10);
  await prisma.admin.upsert({
    where: { login: process.env.ADMIN_LOGIN || 'admin' },
    update: {},
    create: {
      login: process.env.ADMIN_LOGIN || 'admin',
      password: hashedPassword,
    },
  });

  // Create categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'dresses' },
      update: {},
      create: { slug: 'dresses', nameRu: 'Платья', nameEn: 'Dresses', order: 1 },
    }),
    prisma.category.upsert({
      where: { slug: 'blouses' },
      update: {},
      create: { slug: 'blouses', nameRu: 'Блузки', nameEn: 'Blouses', order: 2 },
    }),
    prisma.category.upsert({
      where: { slug: 'skirts' },
      update: {},
      create: { slug: 'skirts', nameRu: 'Юбки', nameEn: 'Skirts', order: 3 },
    }),
    prisma.category.upsert({
      where: { slug: 'pants' },
      update: {},
      create: { slug: 'pants', nameRu: 'Брюки', nameEn: 'Pants', order: 4 },
    }),
    prisma.category.upsert({
      where: { slug: 'outerwear' },
      update: {},
      create: { slug: 'outerwear', nameRu: 'Верхняя одежда', nameEn: 'Outerwear', order: 5 },
    }),
  ]);

  // Create sample products
  const products = [
    {
      slug: 'elegant-evening-dress',
      nameRu: 'Элегантное вечернее платье',
      nameEn: 'Elegant Evening Dress',
      descRu: 'Изысканное вечернее платье из шёлка с элегантным силуэтом',
      descEn: 'Exquisite silk evening dress with an elegant silhouette',
      priceByn: 289.0,
      priceUsd: 89.0,
      priceRub: 8200,
      sizes: ['S', 'M', 'L'],
      colors: [
        JSON.stringify({ hex: '#000000', name: 'Чёрный' }),
        JSON.stringify({ hex: '#1a1a2e', name: 'Тёмно-синий' }),
        JSON.stringify({ hex: '#c4a882', name: 'Бежевый' }),
      ],
      images: ['https://picsum.photos/seed/lans-dress-1/720/960', 'https://picsum.photos/seed/lans-dress-1b/720/960'],
      isNew: true,
      labels: ['NEW'],
      categoryId: categories[0].id,
    },
    {
      slug: 'silk-blouse-classic',
      nameRu: 'Шёлковая блузка классическая',
      nameEn: 'Classic Silk Blouse',
      descRu: 'Классическая блузка из натурального шёлка',
      descEn: 'Classic blouse made of natural silk',
      priceByn: 159.0,
      priceUsd: 49.0,
      priceRub: 4500,
      sizes: ['XS', 'S', 'M', 'L', 'XL'],
      colors: [
        JSON.stringify({ hex: '#FFFFFF', name: 'Белый' }),
        JSON.stringify({ hex: '#F5F0EB', name: 'Кремовый' }),
        JSON.stringify({ hex: '#000000', name: 'Чёрный' }),
      ],
      images: ['https://picsum.photos/seed/lans-blouse-1/720/960', 'https://picsum.photos/seed/lans-blouse-1b/720/960'],
      isNew: true,
      labels: ['NEW', 'SALE'],
      categoryId: categories[1].id,
    },
    {
      slug: 'midi-skirt-pleated',
      nameRu: 'Юбка миди плиссе',
      nameEn: 'Pleated Midi Skirt',
      descRu: 'Стильная юбка миди с плиссировкой',
      descEn: 'Stylish pleated midi skirt',
      priceByn: 129.0,
      priceUsd: 39.0,
      priceRub: 3600,
      sizes: ['S', 'M', 'L'],
      colors: [
        JSON.stringify({ hex: '#C4A882', name: 'Бежевый' }),
        JSON.stringify({ hex: '#000000', name: 'Чёрный' }),
        JSON.stringify({ hex: '#F5F0EB', name: 'Кремовый' }),
      ],
      images: ['https://picsum.photos/seed/lans-skirt-1/720/960', 'https://picsum.photos/seed/lans-skirt-1b/720/960'],
      isNew: false,
      labels: [],
      categoryId: categories[2].id,
    },
    {
      slug: 'classic-trousers',
      nameRu: 'Классические брюки',
      nameEn: 'Classic Trousers',
      descRu: 'Классические брюки прямого кроя',
      descEn: 'Classic straight-cut trousers',
      priceByn: 149.0,
      priceUsd: 45.0,
      priceRub: 4200,
      sizes: ['S', 'M', 'L', 'XL'],
      colors: [
        JSON.stringify({ hex: '#000000', name: 'Чёрный' }),
        JSON.stringify({ hex: '#6B6B6B', name: 'Серый' }),
      ],
      images: ['https://picsum.photos/seed/lans-pants-1/720/960', 'https://picsum.photos/seed/lans-pants-1b/720/960'],
      isNew: false,
      labels: ['HIT'],
      categoryId: categories[3].id,
    },
    {
      slug: 'wool-coat-beige',
      nameRu: 'Пальто из шерсти бежевое',
      nameEn: 'Beige Wool Coat',
      descRu: 'Тёплое пальто из натуральной шерсти',
      descEn: 'Warm coat made of natural wool',
      priceByn: 459.0,
      priceUsd: 139.0,
      priceRub: 12900,
      sizes: ['S', 'M', 'L'],
      colors: [
        JSON.stringify({ hex: '#C4A882', name: 'Бежевый' }),
        JSON.stringify({ hex: '#1a1a1a', name: 'Чёрный' }),
      ],
      images: ['https://picsum.photos/seed/lans-coat-1/720/960', 'https://picsum.photos/seed/lans-coat-1b/720/960'],
      isNew: true,
      labels: ['NEW'],
      categoryId: categories[4].id,
    },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: { colors: product.colors, labels: product.labels, images: product.images },
      create: product,
    });
  }

  // Create site pages
  const pages = [
    {
      slug: 'about',
      titleRu: 'О нас',
      titleEn: 'About Us',
      contentRu: 'Lans Style — белорусский бренд женской одежды. Мы создаём элегантную и современную одежду для уверенных в себе женщин.',
      contentEn: 'Lans Style is a Belarusian women\'s clothing brand. We create elegant and modern clothing for confident women.',
    },
    {
      slug: 'contacts',
      titleRu: 'Контакты',
      titleEn: 'Contacts',
      contentRu: 'г. Минск, ул. Примерная, 1\nТел: +375 29 123-45-67\nEmail: info@lans-style.by',
      contentEn: 'Minsk, Primernaya str., 1\nPhone: +375 29 123-45-67\nEmail: info@lans-style.by',
    },
  ];

  for (const page of pages) {
    await prisma.sitePage.upsert({
      where: { slug: page.slug },
      update: {},
      create: page,
    });
  }

  console.log('Seed completed successfully');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
