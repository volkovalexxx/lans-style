import { Bot, InlineKeyboard, InputFile, Keyboard, type Context } from 'grammy';
import { prisma } from '../index';
import { isAdminChat } from './auth';
import { getSession, setFlow, updateSession, clearSession } from './session';
import { formatOrder, formatWholesale, formatProduct, STATUS_LABELS } from './format';
import { sendPhotoCard, resolveImages, resolveImagePath, downloadTelegramPhoto } from './media';
import { getBotSettings, saveBotSettings } from './settings';

const PRESET_LABELS = ['NEW', 'SALE', 'HIT', 'TOP', '-10%', '-20%', '-30%', '-50%'];

function mainMenu() {
  return new Keyboard()
    .text('📦 Товары').text('📂 Категории').row()
    .text('🛒 Заказы').text('🏢 Опт').row()
    .text('📊 Статистика').text('❓ Помощь').row()
    .resized();
}

function transliterate(str: string): string {
  const map: Record<string, string> = {
    а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'yo',ж:'zh',з:'z',и:'i',й:'y',
    к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',
    х:'kh',ц:'ts',ч:'ch',ш:'sh',щ:'shch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya',
  };
  return str.toLowerCase().split('').map((c) => map[c] ?? c).join('')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function generateProductSlug(name: string): Promise<string> {
  const base = transliterate(name) || 'product';
  let slug = base;
  let counter = 1;
  while (await prisma.product.findUnique({ where: { slug } })) {
    slug = `${base}-${counter++}`;
  }
  return slug;
}

/* ============================================================
   BOT SETUP
   ============================================================ */

export function startBot() {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.log('TELEGRAM_BOT_TOKEN not set — bot disabled');
    return;
  }

  const bot = new Bot(token);

  bot.catch((err) => console.error('Bot error:', err));

  /* ---------- /start — public for all users ---------- */

  bot.command('start', async (ctx) => {
    clearSession(ctx.chat!.id);
    if (isAdminChat(ctx.chat?.id)) {
      await ctx.reply(
        '👗 <b>Lans Style — Панель управления</b>\n\n' +
          'Через бота вы можете:\n' +
          '• просматривать заказы и оптовые заявки\n' +
          '• менять их статусы\n' +
          '• управлять товарами и категориями\n' +
          '• смотреть статистику\n\n' +
          'Используйте меню ниже ⬇️',
        { parse_mode: 'HTML', reply_markup: mainMenu() }
      );
    } else {
      await ctx.reply(
        '👗 <b>Lans Style</b>\n\n' +
          'Привет! Это официальный бот магазина <b>Lans Style</b> — белорусский бренд женской одежды.\n\n' +
          '🌐 Наш сайт: lans-style.by\n' +
          '📞 По вопросам заказов и оптовых заявок пишите нам или оформляйте заказ на сайте.\n\n' +
          'Мы ответим в ближайшее время! ✨',
        { parse_mode: 'HTML' }
      );
    }
  });

  /* ---------- Admin-only: help ---------- */

  bot.hears('❓ Помощь', async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return;
    await ctx.reply(
      'Главное меню — кнопки внизу экрана.\n\n' +
      '<b>Заказы / Опт</b> — вкладки по статусу, смена статуса, удаление отменённых.\n' +
      '<b>Категории</b> — список, добавление, удаление.\n' +
      '<b>Товары</b> — поиск, просмотр, добавление с выбором цветов из уже созданных.\n\n' +
      '<b>Настройки уведомлений:</b>\n' +
      '/setorders — направить уведомления о заказах в этот чат\n' +
      '/setwholesale — направить уведомления об оптовых заявках в этот чат\n' +
      '/showsettings — показать текущие настройки\n\n' +
      '/cancel — прервать текущее действие.',
      { parse_mode: 'HTML' }
    );
  });

  bot.command('myid', async (ctx) => {
    await ctx.reply(`Ваш chat ID: <code>${ctx.chat!.id}</code>`, { parse_mode: 'HTML' });
  });

  bot.command('cancel', async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return;
    clearSession(ctx.chat!.id);
    await ctx.reply('Действие отменено.', { reply_markup: mainMenu() });
  });

  /* ---------- Notification routing settings ---------- */

  bot.command('setorders', async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return;
    const settings = getBotSettings();
    settings.ordersChatId = String(ctx.chat!.id);
    saveBotSettings(settings);
    await ctx.reply(
      `✅ Уведомления о <b>заказах</b> будут приходить в этот чат.\n<code>${ctx.chat!.id}</code>`,
      { parse_mode: 'HTML' }
    );
  });

  bot.command('setwholesale', async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return;
    const settings = getBotSettings();
    settings.wholesaleChatId = String(ctx.chat!.id);
    saveBotSettings(settings);
    await ctx.reply(
      `✅ Уведомления об <b>оптовых заявках</b> будут приходить в этот чат.\n<code>${ctx.chat!.id}</code>`,
      { parse_mode: 'HTML' }
    );
  });

  bot.command('showsettings', async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return;
    const settings = getBotSettings();
    const fallback = process.env.TELEGRAM_ADMIN_IDS || process.env.TELEGRAM_CHAT_ID || '(не задан)';
    await ctx.reply(
      `⚙️ <b>Настройки уведомлений</b>\n\n` +
      `🛒 Заказы: <code>${settings.ordersChatId || `${fallback} (из env)`}</code>\n` +
      `🏢 Опт: <code>${settings.wholesaleChatId || `${fallback} (из env)`}</code>\n\n` +
      `Текущий чат: <code>${ctx.chat!.id}</code>`,
      { parse_mode: 'HTML' }
    );
  });

  /* ---------- STATS ---------- */

  bot.hears('📊 Статистика', async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return;
    const [products, cats, ordersByStatus, wsByStatus, totalOrders, totalWs] = await Promise.all([
      prisma.product.count(),
      prisma.category.count(),
      prisma.order.groupBy({ by: ['status'], _count: true }),
      prisma.wholesaleRequest.groupBy({ by: ['status'], _count: true }),
      prisma.order.count(),
      prisma.wholesaleRequest.count(),
    ]);
    const oCount = (s: string) => ordersByStatus.find((x) => x.status === s)?._count ?? 0;
    const wCount = (s: string) => wsByStatus.find((x) => x.status === s)?._count ?? 0;
    await ctx.reply(
      `📊 <b>Статистика</b>\n\n` +
        `📦 Товаров: <b>${products}</b>\n` +
        `📂 Категорий: <b>${cats}</b>\n\n` +
        `🛒 <b>Заказы</b> (всего ${totalOrders}):\n` +
        `  🆕 Новых: ${oCount('new')}\n` +
        `  🔄 В работе: ${oCount('processing')}\n` +
        `  ✅ Выполнено: ${oCount('done')}\n` +
        `  ❌ Отменено: ${oCount('cancelled')}\n\n` +
        `🏢 <b>Оптовые заявки</b> (всего ${totalWs}):\n` +
        `  🆕 Новых: ${wCount('new')}\n` +
        `  🔄 В работе: ${wCount('processing')}\n` +
        `  ✅ Выполнено: ${wCount('done')}\n` +
        `  ❌ Отменено: ${wCount('cancelled')}`,
      { parse_mode: 'HTML' }
    );
  });

  /* ============================================================
     ORDERS
     ============================================================ */

  bot.hears('🛒 Заказы', (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return;
    return sendOrdersTabs(ctx);
  });

  async function sendOrdersTabs(ctx: Context, status = 'new') {
    const counts = await prisma.order.groupBy({ by: ['status'], _count: true });
    const c = (s: string) => counts.find((x) => x.status === s)?._count ?? 0;

    const kb = new InlineKeyboard()
      .text(`🆕 Новые (${c('new')})`, 'orders:list:new')
      .text(`🔄 В работе (${c('processing')})`, 'orders:list:processing').row()
      .text(`✅ Выполненные (${c('done')})`, 'orders:list:done')
      .text(`❌ Отменённые (${c('cancelled')})`, 'orders:list:cancelled');

    const list = await prisma.order.findMany({
      where: { status }, orderBy: { createdAt: 'desc' }, take: 10,
      include: { items: { include: { product: true } } },
    });

    if (!list.length) {
      await ctx.reply(`Заказов в категории «${STATUS_LABELS[status]}» нет`, { reply_markup: kb });
      return;
    }

    await ctx.reply(`🛒 <b>Заказы — ${STATUS_LABELS[status]}</b>`, { parse_mode: 'HTML', reply_markup: kb });
    for (const order of list) {
      await ctx.reply(formatOrder(order), {
        parse_mode: 'HTML',
        reply_markup: orderActionsKb(order.id, order.status),
      });
    }
  }

  function orderActionsKb(id: number, status: string) {
    const kb = new InlineKeyboard();
    if (status !== 'processing') kb.text('🔄 В работу', `order:status:${id}:processing`);
    if (status !== 'done') kb.text('✅ Выполнен', `order:status:${id}:done`);
    kb.row();
    if (status !== 'cancelled') kb.text('❌ Отменить', `order:status:${id}:cancelled`);
    if (status === 'cancelled') kb.text('🗑 Удалить', `order:delete:${id}`);
    return kb;
  }

  bot.callbackQuery(/^orders:list:(new|processing|done|cancelled)$/, async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return ctx.answerCallbackQuery({ text: 'Нет доступа' });
    await ctx.answerCallbackQuery();
    await sendOrdersTabs(ctx, ctx.match![1]);
  });

  bot.callbackQuery(/^order:status:(\d+):(\w+)$/, async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return ctx.answerCallbackQuery({ text: 'Нет доступа' });
    const id = Number(ctx.match![1]);
    const status = ctx.match![2];
    await prisma.order.update({ where: { id }, data: { status } });
    const updated = await prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: true } } },
    });
    if (updated) {
      await ctx.editMessageText(formatOrder(updated), {
        parse_mode: 'HTML', reply_markup: orderActionsKb(id, status),
      });
    }
    await ctx.answerCallbackQuery({ text: `Статус -> ${STATUS_LABELS[status]}` });
  });

  bot.callbackQuery(/^order:delete:(\d+)$/, async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return ctx.answerCallbackQuery({ text: 'Нет доступа' });
    const id = Number(ctx.match![1]);
    await prisma.orderItem.deleteMany({ where: { orderId: id } });
    await prisma.order.delete({ where: { id } });
    await ctx.editMessageText(`Заказ #${id} удалён`);
    await ctx.answerCallbackQuery({ text: 'Удалён' });
  });

  /* ============================================================
     WHOLESALE
     ============================================================ */

  bot.hears('🏢 Опт', (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return;
    return sendWholesaleTabs(ctx);
  });

  async function sendWholesaleTabs(ctx: Context, status = 'new') {
    const counts = await prisma.wholesaleRequest.groupBy({ by: ['status'], _count: true });
    const c = (s: string) => counts.find((x) => x.status === s)?._count ?? 0;

    const kb = new InlineKeyboard()
      .text(`🆕 Новые (${c('new')})`, 'ws:list:new')
      .text(`🔄 В работе (${c('processing')})`, 'ws:list:processing').row()
      .text(`✅ Выполненные (${c('done')})`, 'ws:list:done')
      .text(`❌ Отменённые (${c('cancelled')})`, 'ws:list:cancelled');

    const list = await prisma.wholesaleRequest.findMany({
      where: { status }, orderBy: { createdAt: 'desc' }, take: 10,
    });

    if (!list.length) {
      await ctx.reply(`Заявок в категории «${STATUS_LABELS[status]}» нет`, { reply_markup: kb });
      return;
    }

    await ctx.reply(`🏢 <b>Оптовые заявки — ${STATUS_LABELS[status]}</b>`, { parse_mode: 'HTML', reply_markup: kb });
    for (const r of list) {
      await ctx.reply(formatWholesale(r), {
        parse_mode: 'HTML', reply_markup: wsActionsKb(r.id, r.status),
      });
    }
  }

  function wsActionsKb(id: number, status: string) {
    const kb = new InlineKeyboard();
    if (status !== 'processing') kb.text('🔄 В работу', `ws:status:${id}:processing`);
    if (status !== 'done') kb.text('✅ Выполнен', `ws:status:${id}:done`);
    kb.row();
    if (status !== 'cancelled') kb.text('❌ Отменить', `ws:status:${id}:cancelled`);
    if (status === 'cancelled') kb.text('🗑 Удалить', `ws:delete:${id}`);
    return kb;
  }

  bot.callbackQuery(/^ws:list:(new|processing|done|cancelled)$/, async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return ctx.answerCallbackQuery({ text: 'Нет доступа' });
    await ctx.answerCallbackQuery();
    await sendWholesaleTabs(ctx, ctx.match![1]);
  });

  bot.callbackQuery(/^ws:status:(\d+):(\w+)$/, async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return ctx.answerCallbackQuery({ text: 'Нет доступа' });
    const id = Number(ctx.match![1]);
    const status = ctx.match![2];
    await prisma.wholesaleRequest.update({ where: { id }, data: { status } });
    const updated = await prisma.wholesaleRequest.findUnique({ where: { id } });
    if (updated) {
      await ctx.editMessageText(formatWholesale(updated), {
        parse_mode: 'HTML', reply_markup: wsActionsKb(id, status),
      });
    }
    await ctx.answerCallbackQuery({ text: `Статус -> ${STATUS_LABELS[status]}` });
  });

  bot.callbackQuery(/^ws:delete:(\d+)$/, async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return ctx.answerCallbackQuery({ text: 'Нет доступа' });
    const id = Number(ctx.match![1]);
    await prisma.wholesaleRequest.delete({ where: { id } });
    await ctx.editMessageText(`Заявка #${id} удалена`);
    await ctx.answerCallbackQuery({ text: 'Удалена' });
  });

  /* ============================================================
     CATEGORIES
     ============================================================ */

  bot.hears('📂 Категории', async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return;
    const cats = await prisma.category.findMany({
      orderBy: { id: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    const text = cats.length
      ? `📂 <b>Категории (${cats.length})</b>\n\n` +
        cats.map((c) => `• <b>${c.nameRu}</b> · ${c._count.products} товаров`).join('\n')
      : '📂 Категорий пока нет';
    const kb = new InlineKeyboard().text('Добавить категорию', 'cat:add');
    for (const c of cats) kb.row().text(`Удалить: ${c.nameRu}`, `cat:del:${c.id}`);
    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: kb });
  });

  bot.callbackQuery('cat:add', async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return ctx.answerCallbackQuery({ text: 'Нет доступа' });
    setFlow(ctx.chat!.id, 'add_category');
    await ctx.answerCallbackQuery();
    await ctx.reply('Введите название категории на <b>русском</b> (или /cancel):', { parse_mode: 'HTML' });
  });

  bot.callbackQuery(/^cat:del:(\d+)$/, async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return ctx.answerCallbackQuery({ text: 'Нет доступа' });
    const id = Number(ctx.match![1]);
    const cat = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!cat) { await ctx.answerCallbackQuery({ text: 'Не найдено' }); return; }
    const kb = new InlineKeyboard()
      .text('Да, удалить', `cat:delconfirm:${id}`)
      .text('Отмена', 'noop');
    await ctx.answerCallbackQuery();
    await ctx.reply(
      `Удалить категорию «${cat.nameRu}»?\nВместе с ней будут удалены ${cat._count.products} товаров.`,
      { reply_markup: kb }
    );
  });

  bot.callbackQuery(/^cat:delconfirm:(\d+)$/, async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return ctx.answerCallbackQuery({ text: 'Нет доступа' });
    const id = Number(ctx.match![1]);
    await prisma.$transaction(async (tx) => {
      const products = await tx.product.findMany({ where: { categoryId: id }, select: { id: true } });
      const ids = products.map((p) => p.id);
      if (ids.length) {
        await tx.orderItem.deleteMany({ where: { productId: { in: ids } } });
        await tx.product.deleteMany({ where: { id: { in: ids } } });
      }
      await tx.category.delete({ where: { id } });
    });
    await ctx.answerCallbackQuery({ text: 'Удалено' });
    await ctx.editMessageText('Категория удалена');
  });

  bot.callbackQuery('noop', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.deleteMessage().catch(() => {});
  });

  /* ============================================================
     PRODUCTS
     ============================================================ */

  bot.hears('📦 Товары', async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return;
    const kb = new InlineKeyboard()
      .text('Поиск', 'prod:search').row()
      .text('По категориям', 'prod:bycats').row()
      .text('Последние', 'prod:list').row()
      .text('Добавить товар', 'prod:add');
    await ctx.reply('📦 <b>Товары</b>\nВыберите действие:', { parse_mode: 'HTML', reply_markup: kb });
  });

  bot.callbackQuery('prod:list', async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return ctx.answerCallbackQuery({ text: 'Нет доступа' });
    await ctx.answerCallbackQuery();
    await listProductsAsButtons(ctx, {}, '📋 <b>Последние товары</b>');
  });

  bot.callbackQuery('prod:search', async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return ctx.answerCallbackQuery({ text: 'Нет доступа' });
    setFlow(ctx.chat!.id, 'search_products');
    await ctx.answerCallbackQuery();
    await ctx.reply('Введите название или артикул для поиска:');
  });

  bot.callbackQuery('prod:bycats', async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return ctx.answerCallbackQuery({ text: 'Нет доступа' });
    const cats = await prisma.category.findMany({
      orderBy: { id: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    if (!cats.length) {
      await ctx.answerCallbackQuery();
      await ctx.reply('Категорий пока нет');
      return;
    }
    const kb = new InlineKeyboard();
    for (const c of cats) {
      kb.text(`${c.nameRu} · ${c._count.products}`, `prod:incat:${c.id}`).row();
    }
    await ctx.answerCallbackQuery();
    await ctx.reply('Выберите категорию:', { reply_markup: kb });
  });

  bot.callbackQuery(/^prod:incat:(\d+)$/, async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return ctx.answerCallbackQuery({ text: 'Нет доступа' });
    const categoryId = Number(ctx.match![1]);
    const cat = await prisma.category.findUnique({ where: { id: categoryId } });
    await ctx.answerCallbackQuery();
    await listProductsAsButtons(ctx, { categoryId }, `📂 <b>${cat?.nameRu || 'Категория'}</b>`);
  });

  /* product card keyboard with photo navigation */
  function productCardKb(p: { id: number; inStock: boolean }, photoIndex: number, totalPhotos: number) {
    const kb = new InlineKeyboard()
      .text('Редактировать', `prod:edit:${p.id}`).row();

    if (totalPhotos > 1) {
      if (photoIndex > 0) kb.text('< Пред.', `prod:photo:${p.id}:${photoIndex - 1}`);
      kb.text(`${photoIndex + 1}/${totalPhotos}`, 'noop');
      if (photoIndex < totalPhotos - 1) kb.text('Следующее фото >', `prod:photo:${p.id}:${photoIndex + 1}`);
      kb.row();
    }

    kb.text(p.inStock ? 'Нет в наличии' : 'В наличии', `prod:stock:${p.id}`)
      .text('Удалить', `prod:del:${p.id}`);

    return kb;
  }

  function productEditKb(id: number) {
    return new InlineKeyboard()
      .text('Название RU', `pedit:field:${id}:nameRu`)
      .text('Название EN', `pedit:field:${id}:nameEn`).row()
      .text('Цены', `pedit:field:${id}:prices`)
      .text('Размеры', `pedit:field:${id}:sizes`).row()
      .text('Артикул', `pedit:field:${id}:sku`)
      .text('Категория', `pedit:cat:${id}`).row()
      .text('Цвета', `pedit:colors:${id}`)
      .text('Метки', `pedit:labels:${id}`).row()
      .text('Назад к карточке', `prod:view:${p => p}:${id}`);
  }

  async function sendProductCard(ctx: Context, id: number, photoIndex = 0) {
    const p = await prisma.product.findUnique({
      where: { id },
      include: { category: true, costumeTop: true, costumeBottom: true },
    });
    if (!p) { await ctx.reply('Товар не найден'); return; }

    const paths = resolveImages(p.images, 10);
    const caption = formatProduct(p);

    if (paths.length === 0) {
      await ctx.reply(caption, { parse_mode: 'HTML', reply_markup: productCardKb(p, 0, 0) });
      return;
    }

    const safeIndex = Math.min(photoIndex, paths.length - 1);
    const kb = productCardKb(p, safeIndex, paths.length);

    await ctx.replyWithChatAction('upload_photo').catch(() => {});
    await ctx.replyWithPhoto(new InputFile(paths[safeIndex]), {
      caption, parse_mode: 'HTML', reply_markup: kb,
    });
  }

  async function listProductsAsButtons(ctx: Context, where: any, title: string) {
    const products = await prisma.product.findMany({
      where, take: 50, orderBy: { createdAt: 'desc' },
    });
    if (!products.length) {
      await ctx.reply(title + '\n\nТоваров нет', { parse_mode: 'HTML' });
      return;
    }
    const kb = new InlineKeyboard();
    for (const p of products) {
      const label = p.sku ? `${p.nameRu} · ${p.sku}` : p.nameRu;
      const safe = label.length > 60 ? label.slice(0, 57) + '...' : label;
      kb.text(safe, `prod:view:${p.id}`).row();
    }
    await ctx.reply(`${title}\n<i>${products.length} шт.</i>`,
      { parse_mode: 'HTML', reply_markup: kb });
  }

  /* ---------- view / stock / delete / photo nav ---------- */

  bot.callbackQuery(/^prod:view:(\d+)$/, async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return ctx.answerCallbackQuery({ text: 'Нет доступа' });
    const id = Number(ctx.match![1]);
    await ctx.answerCallbackQuery();
    await sendProductCard(ctx, id, 0);
  });

  bot.callbackQuery(/^prod:photo:(\d+):(\d+)$/, async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return ctx.answerCallbackQuery({ text: 'Нет доступа' });
    const id = Number(ctx.match![1]);
    const photoIndex = Number(ctx.match![2]);
    await ctx.answerCallbackQuery();
    await sendProductCard(ctx, id, photoIndex);
  });

  bot.callbackQuery(/^prod:stock:(\d+)$/, async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return ctx.answerCallbackQuery({ text: 'Нет доступа' });
    const id = Number(ctx.match![1]);
    const p = await prisma.product.findUnique({ where: { id } });
    if (!p) return ctx.answerCallbackQuery({ text: 'Не найден' });
    const updated = await prisma.product.update({
      where: { id }, data: { inStock: !p.inStock },
      include: { category: true, costumeTop: true, costumeBottom: true },
    });
    const caption = formatProduct(updated);
    const paths = resolveImages(updated.images, 10);
    const kb = productCardKb(updated, 0, paths.length);
    try {
      if (ctx.callbackQuery.message?.photo) {
        await ctx.editMessageCaption({ caption, parse_mode: 'HTML', reply_markup: kb });
      } else {
        await ctx.editMessageText(caption, { parse_mode: 'HTML', reply_markup: kb });
      }
    } catch {
      await sendProductCard(ctx, id, 0);
    }
    await ctx.answerCallbackQuery({ text: updated.inStock ? 'В наличии' : 'Нет в наличии' });
  });

  bot.callbackQuery(/^prod:del:(\d+)$/, async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return ctx.answerCallbackQuery({ text: 'Нет доступа' });
    const id = Number(ctx.match![1]);
    const kb = new InlineKeyboard()
      .text('Да, удалить', `prod:delconfirm:${id}`)
      .text('Отмена', 'noop');
    await ctx.answerCallbackQuery();
    await ctx.reply('Удалить этот товар?', { reply_markup: kb });
  });

  bot.callbackQuery(/^prod:delconfirm:(\d+)$/, async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return ctx.answerCallbackQuery({ text: 'Нет доступа' });
    const id = Number(ctx.match![1]);
    await prisma.orderItem.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });
    await ctx.answerCallbackQuery({ text: 'Удалено' });
    await ctx.editMessageText('Товар удалён');
  });

  /* ---------- edit entry ---------- */

  bot.callbackQuery(/^prod:edit:(\d+)$/, async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return ctx.answerCallbackQuery({ text: 'Нет доступа' });
    const id = Number(ctx.match![1]);
    const p = await prisma.product.findUnique({ where: { id }, include: { category: true } });
    if (!p) return ctx.answerCallbackQuery({ text: 'Не найден' });
    await ctx.answerCallbackQuery();
    await ctx.reply(
      `Редактирование товара\n\n` + formatProduct(p) + `\n\nВыберите, что изменить:`,
      { parse_mode: 'HTML', reply_markup: new InlineKeyboard()
        .text('Название RU', `pedit:field:${id}:nameRu`)
        .text('Название EN', `pedit:field:${id}:nameEn`).row()
        .text('Цены', `pedit:field:${id}:prices`)
        .text('Размеры', `pedit:field:${id}:sizes`).row()
        .text('Артикул', `pedit:field:${id}:sku`)
        .text('Категория', `pedit:cat:${id}`).row()
        .text('Цвета', `pedit:colors:${id}`)
        .text('Метки', `pedit:labels:${id}`).row()
        .text('Назад к карточке', `prod:view:${id}`)
      }
    );
  });

  /* ---------- edit simple text fields ---------- */

  const fieldPrompts: Record<string, string> = {
    nameRu: 'Введите новое название на <b>русском</b>:',
    nameEn: 'Введите новое название на <b>английском</b>:',
    sku: 'Введите артикул (или «-» чтобы очистить):',
    prices: 'Введите три цены через пробел: <code>BYN USD RUB</code>\nНапример: <code>289 89 8200</code>',
    sizes: 'Введите размеры через запятую (или «-» чтобы очистить):',
  };

  bot.callbackQuery(/^pedit:field:(\d+):(\w+)$/, async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return ctx.answerCallbackQuery({ text: 'Нет доступа' });
    const id = Number(ctx.match![1]);
    const field = ctx.match![2];
    if (!fieldPrompts[field]) return ctx.answerCallbackQuery({ text: 'Неизвестное поле' });
    setFlow(ctx.chat!.id, 'edit_product_field', { productId: id, field });
    await ctx.answerCallbackQuery();
    await ctx.reply(fieldPrompts[field], { parse_mode: 'HTML' });
  });

  /* ---------- edit category ---------- */

  bot.callbackQuery(/^pedit:cat:(\d+)$/, async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return ctx.answerCallbackQuery({ text: 'Нет доступа' });
    const id = Number(ctx.match![1]);
    const cats = await prisma.category.findMany({ orderBy: { id: 'asc' } });
    const kb = new InlineKeyboard();
    cats.forEach((c, i) => { kb.text(c.nameRu, `pedit:catset:${id}:${c.id}`); if ((i + 1) % 2 === 0) kb.row(); });
    kb.row().text('Отмена', `prod:edit:${id}`);
    await ctx.answerCallbackQuery();
    await ctx.reply('Выберите новую категорию:', { reply_markup: kb });
  });

  bot.callbackQuery(/^pedit:catset:(\d+):(\d+)$/, async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return ctx.answerCallbackQuery({ text: 'Нет доступа' });
    const id = Number(ctx.match![1]);
    const categoryId = Number(ctx.match![2]);
    await prisma.product.update({ where: { id }, data: { categoryId } });
    await ctx.answerCallbackQuery({ text: 'Категория изменена' });
    await ctx.deleteMessage().catch(() => {});
    await sendProductCard(ctx, id, 0);
  });

  /* ---------- edit colors ---------- */

  async function renderColorsEditor(ctx: Context, id: number, edit = false) {
    const products = await prisma.product.findMany({ select: { colors: true } });
    const palette = new Map<string, { hex: string; name: string }>();
    for (const p of products) {
      for (const c of p.colors) {
        try { const parsed = JSON.parse(c); if (parsed.hex && parsed.name) palette.set(parsed.hex.toLowerCase(), parsed); } catch {}
      }
    }
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return;
    const selected = new Set(
      product.colors.map((c) => { try { return JSON.parse(c).hex?.toLowerCase(); } catch { return c.toLowerCase(); } })
    );

    if (!palette.size) {
      const msg = 'В системе нет цветов с именами.\nДобавьте цвет через админ-панель сайта.';
      if (edit) await ctx.editMessageText(msg, { reply_markup: new InlineKeyboard().text('Назад', `prod:edit:${id}`) });
      else await ctx.reply(msg);
      return;
    }

    const kb = new InlineKeyboard();
    const arr = Array.from(palette.values());
    arr.forEach((c, i) => {
      const marked = selected.has(c.hex.toLowerCase());
      kb.text(`${marked ? '[x] ' : '[ ] '}${c.name}`, `pedit:colortoggle:${id}:${c.hex}`);
      if ((i + 1) % 2 === 0) kb.row();
    });
    kb.row().text('Готово', `prod:edit:${id}`);

    const text = 'Цвета товара\nНажимайте, чтобы добавить или убрать.\n\n<i>Новый цвет — через админ-панель сайта.</i>';
    if (edit) await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
    else await ctx.reply(text, { parse_mode: 'HTML', reply_markup: kb });
  }

  bot.callbackQuery(/^pedit:colors:(\d+)$/, async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return ctx.answerCallbackQuery({ text: 'Нет доступа' });
    const id = Number(ctx.match![1]);
    await ctx.answerCallbackQuery();
    await renderColorsEditor(ctx, id, true);
  });

  bot.callbackQuery(/^pedit:colortoggle:(\d+):(.+)$/, async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return ctx.answerCallbackQuery({ text: 'Нет доступа' });
    const id = Number(ctx.match![1]);
    const hex = ctx.match![2].toLowerCase();
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return ctx.answerCallbackQuery({ text: 'Не найден' });
    const all = await prisma.product.findMany({ select: { colors: true } });
    const palette = new Map<string, { hex: string; name: string }>();
    for (const p of all) for (const c of p.colors) {
      try { const parsed = JSON.parse(c); if (parsed.hex) palette.set(parsed.hex.toLowerCase(), parsed); } catch {}
    }

    const current = new Map<string, string>();
    for (const raw of product.colors) {
      try { const parsed = JSON.parse(raw); if (parsed.hex) current.set(parsed.hex.toLowerCase(), raw); }
      catch { current.set(raw.toLowerCase(), raw); }
    }
    let added = false;
    if (current.has(hex)) current.delete(hex);
    else {
      const found = palette.get(hex);
      current.set(hex, JSON.stringify(found || { hex, name: hex }));
      added = true;
    }
    await prisma.product.update({ where: { id }, data: { colors: Array.from(current.values()) } });
    await ctx.answerCallbackQuery({ text: added ? 'Добавлен' : 'Убран' });
    await renderColorsEditor(ctx, id, true);
  });

  /* ---------- edit labels ---------- */

  async function renderLabelsEditor(ctx: Context, id: number, edit = false) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return;
    const selected = new Set(product.labels);
    const all = Array.from(new Set([...PRESET_LABELS, ...product.labels]));

    const kb = new InlineKeyboard();
    all.forEach((l, i) => {
      const marked = selected.has(l);
      kb.text(`${marked ? '[x] ' : ''}${l}`, `pedit:labeltoggle:${id}:${l}`);
      if ((i + 1) % 3 === 0) kb.row();
    });
    kb.row().text('Готово', `prod:edit:${id}`);

    const text = 'Метки товара\nНажимайте, чтобы добавить или убрать.';
    if (edit) await ctx.editMessageText(text, { reply_markup: kb });
    else await ctx.reply(text, { reply_markup: kb });
  }

  bot.callbackQuery(/^pedit:labels:(\d+)$/, async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return ctx.answerCallbackQuery({ text: 'Нет доступа' });
    const id = Number(ctx.match![1]);
    await ctx.answerCallbackQuery();
    await renderLabelsEditor(ctx, id, true);
  });

  bot.callbackQuery(/^pedit:labeltoggle:(\d+):(.+)$/, async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return ctx.answerCallbackQuery({ text: 'Нет доступа' });
    const id = Number(ctx.match![1]);
    const label = ctx.match![2];
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return ctx.answerCallbackQuery({ text: 'Не найден' });
    const labels = [...product.labels];
    const idx = labels.indexOf(label);
    if (idx >= 0) labels.splice(idx, 1); else labels.push(label);
    await prisma.product.update({
      where: { id },
      data: { labels, isNew: labels.includes('NEW') },
    });
    await ctx.answerCallbackQuery({ text: idx >= 0 ? 'Убрана' : 'Добавлена' });
    await renderLabelsEditor(ctx, id, true);
  });

  /* ---------- Add product wizard ---------- */

  bot.callbackQuery('prod:add', async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return ctx.answerCallbackQuery({ text: 'Нет доступа' });
    const cats = await prisma.category.findMany({ orderBy: { id: 'asc' } });
    if (!cats.length) {
      await ctx.answerCallbackQuery();
      await ctx.reply('Сначала создайте хотя бы одну категорию.');
      return;
    }
    setFlow(ctx.chat!.id, 'add_product', { colors: [], labels: [], images: [] });
    await ctx.answerCallbackQuery();
    await ctx.reply('Шаг 1/8. Введите название товара на <b>русском</b> (или /cancel):', { parse_mode: 'HTML' });
  });

  async function promptCategory(ctx: Context) {
    const cats = await prisma.category.findMany({ orderBy: { id: 'asc' } });
    const kb = new InlineKeyboard();
    cats.forEach((c, i) => { kb.text(c.nameRu, `wz:cat:${c.id}`); if ((i + 1) % 2 === 0) kb.row(); });
    await ctx.reply('Шаг 3/8. Выберите категорию:', { reply_markup: kb });
  }

  bot.callbackQuery(/^wz:cat:(\d+)$/, async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return ctx.answerCallbackQuery();
    const sess = getSession(ctx.chat!.id);
    if (sess.flow !== 'add_product') return ctx.answerCallbackQuery();
    updateSession(ctx.chat!.id, { step: 3, data: { categoryId: Number(ctx.match![1]) } });
    await ctx.answerCallbackQuery();
    await ctx.reply(
      'Шаг 4/8. Введите цены через пробел: <code>BYN USD RUB</code>\nНапример: <code>289 89 8200</code>',
      { parse_mode: 'HTML' }
    );
  });

  async function promptColors(ctx: Context) {
    const sess = getSession(ctx.chat!.id);
    const products = await prisma.product.findMany({ select: { colors: true } });
    const colorsMap = new Map<string, { hex: string; name: string }>();
    for (const p of products) {
      for (const c of p.colors) {
        try {
          const parsed = JSON.parse(c);
          if (parsed.hex && parsed.name) colorsMap.set(parsed.hex.toLowerCase(), parsed);
        } catch {}
      }
    }
    const allColors = Array.from(colorsMap.values());
    const selected: string[] = sess.data?.colors || [];

    if (!allColors.length) {
      await ctx.reply(
        'В системе пока нет цветов с именами.\n' +
        'Добавьте глобальный цвет через админ-панель сайта. /skip'
      );
      updateSession(ctx.chat!.id, { step: 5, data: {} });
      return;
    }

    const kb = new InlineKeyboard();
    allColors.forEach((c, i) => {
      const marked = selected.includes(c.hex.toLowerCase());
      kb.text(`${marked ? '[x] ' : ''}${c.name}`, `wz:color:${c.hex}`);
      if ((i + 1) % 2 === 0) kb.row();
    });
    kb.row().text('Готово', 'wz:colors:done').text('Пропустить', 'wz:colors:skip');

    await ctx.reply('Шаг 6/8. Выберите цвета из палитры:', { reply_markup: kb });
  }

  bot.callbackQuery(/^wz:color:(.+)$/, async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return ctx.answerCallbackQuery();
    const hex = ctx.match![1].toLowerCase();
    const sess = getSession(ctx.chat!.id);
    if (sess.flow !== 'add_product') return ctx.answerCallbackQuery();
    const colors: string[] = sess.data?.colors || [];
    const idx = colors.indexOf(hex);
    if (idx >= 0) colors.splice(idx, 1); else colors.push(hex);
    updateSession(ctx.chat!.id, { data: { colors } });
    await ctx.answerCallbackQuery({ text: idx >= 0 ? 'Убран' : 'Выбран' });
    await promptColors(ctx);
  });

  bot.callbackQuery(['wz:colors:done', 'wz:colors:skip'], async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return ctx.answerCallbackQuery();
    const sess = getSession(ctx.chat!.id);
    if (sess.flow !== 'add_product') return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    await promptLabels(ctx);
  });

  async function promptLabels(ctx: Context) {
    const sess = getSession(ctx.chat!.id);
    const selected: string[] = sess.data?.labels || [];
    const kb = new InlineKeyboard();
    PRESET_LABELS.forEach((l, i) => {
      const marked = selected.includes(l);
      kb.text(`${marked ? '[x] ' : ''}${l}`, `wz:label:${l}`);
      if ((i + 1) % 3 === 0) kb.row();
    });
    kb.row().text('Готово', 'wz:labels:done').text('Пропустить', 'wz:labels:done');
    updateSession(ctx.chat!.id, { step: 6 });
    await ctx.reply('Шаг 7/8. Выберите метки:', { reply_markup: kb });
  }

  bot.callbackQuery(/^wz:label:(.+)$/, async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return ctx.answerCallbackQuery();
    const label = ctx.match![1];
    const sess = getSession(ctx.chat!.id);
    if (sess.flow !== 'add_product') return ctx.answerCallbackQuery();
    const labels: string[] = sess.data?.labels || [];
    const idx = labels.indexOf(label);
    if (idx >= 0) labels.splice(idx, 1); else labels.push(label);
    updateSession(ctx.chat!.id, { data: { labels } });
    await ctx.answerCallbackQuery();
    await promptLabels(ctx);
  });

  bot.callbackQuery('wz:labels:done', async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return ctx.answerCallbackQuery();
    const sess = getSession(ctx.chat!.id);
    if (sess.flow !== 'add_product') return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    await promptPhotos(ctx);
  });

  async function promptPhotos(ctx: Context) {
    updateSession(ctx.chat!.id, { step: 7 });
    const kb = new InlineKeyboard()
      .text('Сохранить товар', 'wz:photos:done')
      .text('Без фото', 'wz:photos:done');
    await ctx.reply(
      'Шаг 8/8. Пришлите фотографии товара (по одной или альбомом).\nКогда закончите — нажмите <b>Сохранить</b>.',
      { parse_mode: 'HTML', reply_markup: kb }
    );
  }

  bot.callbackQuery('wz:photos:done', async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return ctx.answerCallbackQuery();
    const sess = getSession(ctx.chat!.id);
    if (sess.flow !== 'add_product') return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    await finalizeProduct(ctx);
  });

  /* ---------- Photo upload handler (wizard step 7) ---------- */
  bot.on('message:photo', async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return;
    const sess = getSession(ctx.chat!.id);
    if (sess.flow !== 'add_product' || sess.step !== 7) return;
    try {
      const photos = ctx.message.photo;
      const fileId = photos[photos.length - 1].file_id;
      const url = await downloadTelegramPhoto(bot, fileId);
      const images: string[] = sess.data?.images || [];
      images.push(url);
      updateSession(ctx.chat!.id, { data: { images } });
      await ctx.reply(`Фото добавлено (всего: ${images.length})`);
    } catch (err: any) {
      await ctx.reply(`Не удалось загрузить фото: ${err.message}`);
    }
  });

  async function finalizeProduct(ctx: Context) {
    const sess = getSession(ctx.chat!.id);
    const d = sess.data || {};
    try {
      const slug = await generateProductSlug(d.nameRu);
      const colorsMap = new Map<string, { hex: string; name: string }>();
      const allProducts = await prisma.product.findMany({ select: { colors: true } });
      for (const p of allProducts) {
        for (const c of p.colors) {
          try { const parsed = JSON.parse(c); if (parsed.hex) colorsMap.set(parsed.hex.toLowerCase(), parsed); } catch {}
        }
      }
      const colors = (d.colors || []).map((hex: string) => JSON.stringify(colorsMap.get(hex) || { hex, name: hex }));

      const product = await prisma.product.create({
        data: {
          slug,
          nameRu: d.nameRu, nameEn: d.nameEn || d.nameRu,
          priceByn: d.priceByn, priceUsd: d.priceUsd, priceRub: d.priceRub || 0,
          sizes: d.sizes || [], colors, labels: d.labels || [],
          inStock: true, isNew: (d.labels || []).includes('NEW'),
          categoryId: d.categoryId,
          images: d.images || [],
        },
        include: { category: true },
      });

      clearSession(ctx.chat!.id);
      await ctx.reply('Товар создан\n\n' + formatProduct(product),
        { parse_mode: 'HTML', reply_markup: mainMenu() }
      );
    } catch (err: any) {
      await ctx.reply(`Ошибка: ${err.message}`, { reply_markup: mainMenu() });
      clearSession(ctx.chat!.id);
    }
  }

  /* ============================================================
     Text handler — dispatches to active flow
     ============================================================ */

  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text.trim();
    if (text.startsWith('/')) return;

    const chatId = ctx.chat!.id;

    // Non-admin users: friendly response
    if (!isAdminChat(chatId)) {
      await ctx.reply(
        'Здравствуйте! По вопросам заказов и оптовых закупок, пожалуйста, свяжитесь с нами через сайт lans-style.by или позвоните нам. Мы будем рады помочь! 👗'
      );
      return;
    }

    const sess = getSession(chatId);
    if (!sess.flow) return;

    /* --- add_category --- */
    if (sess.flow === 'add_category') {
      if (sess.step === 0) {
        updateSession(chatId, { step: 1, data: { nameRu: text } });
        await ctx.reply('Теперь название на <b>английском</b>:', { parse_mode: 'HTML' });
        return;
      }
      if (sess.step === 1) {
        const nameEn = text;
        const nameRu: string = sess.data!.nameRu;
        let slug = transliterate(nameRu) || 'category';
        let counter = 1;
        while (await prisma.category.findUnique({ where: { slug } })) slug = `${transliterate(nameRu)}-${counter++}`;
        const cat = await prisma.category.create({ data: { nameRu, nameEn, slug } });
        clearSession(chatId);
        await ctx.reply(`Категория «${cat.nameRu}» создана`, { reply_markup: mainMenu() });
        return;
      }
    }

    /* --- search_products --- */
    if (sess.flow === 'search_products') {
      clearSession(chatId);
      const where = {
        OR: [
          { nameRu: { contains: text, mode: 'insensitive' as const } },
          { nameEn: { contains: text, mode: 'insensitive' as const } },
          { sku: { contains: text, mode: 'insensitive' as const } },
        ],
      };
      await listProductsAsButtons(ctx, where, `Поиск: «${text}»`);
      return;
    }

    /* --- edit_product_field --- */
    if (sess.flow === 'edit_product_field') {
      const { productId, field } = sess.data || {};
      if (!productId || !field) { clearSession(chatId); return; }

      try {
        if (field === 'prices') {
          const parts = text.split(/\s+/).map(Number);
          if (parts.length < 2 || parts.some((n) => isNaN(n))) {
            await ctx.reply('Нужно 2–3 числа через пробел, например: <code>289 89 8200</code>', { parse_mode: 'HTML' });
            return;
          }
          const [priceByn, priceUsd, priceRub = 0] = parts;
          await prisma.product.update({ where: { id: productId }, data: { priceByn, priceUsd, priceRub } });
        } else if (field === 'sizes') {
          const sizes = text === '-' ? [] : text.split(',').map((s) => s.trim()).filter(Boolean);
          await prisma.product.update({ where: { id: productId }, data: { sizes } });
        } else if (field === 'sku') {
          const sku = text === '-' ? null : text.trim();
          await prisma.product.update({ where: { id: productId }, data: { sku } });
        } else if (field === 'nameRu' || field === 'nameEn') {
          await prisma.product.update({ where: { id: productId }, data: { [field]: text.trim() } });
        } else {
          clearSession(chatId);
          return;
        }
        clearSession(chatId);
        await ctx.reply('Сохранено');
        await sendProductCard(ctx, productId, 0);
      } catch (err: any) {
        await ctx.reply(`Ошибка: ${err.message}`);
        clearSession(chatId);
      }
      return;
    }

    /* --- add_product wizard --- */
    if (sess.flow === 'add_product') {
      const step = sess.step ?? 0;
      if (step === 0) {
        updateSession(chatId, { step: 1, data: { nameRu: text } });
        await ctx.reply('Шаг 2/8. Введите название на <b>английском</b> (или «-» пропустить):', { parse_mode: 'HTML' });
        return;
      }
      if (step === 1) {
        const nameEn = text === '-' ? '' : text;
        updateSession(chatId, { step: 2, data: { nameEn } });
        await promptCategory(ctx);
        return;
      }
      if (step === 3) {
        const parts = text.split(/\s+/).map(Number);
        if (parts.length < 2 || parts.some((n) => isNaN(n))) {
          await ctx.reply('Введите 2–3 числа через пробел, например: <code>289 89 8200</code>', { parse_mode: 'HTML' });
          return;
        }
        const [priceByn, priceUsd, priceRub = 0] = parts;
        updateSession(chatId, { step: 4, data: { priceByn, priceUsd, priceRub } });
        await ctx.reply('Шаг 5/8. Введите размеры через запятую (например: <code>42, 44, 46, 48</code>) или «-» пропустить:', { parse_mode: 'HTML' });
        return;
      }
      if (step === 4) {
        const sizes = text === '-' ? [] : text.split(',').map((s) => s.trim()).filter(Boolean);
        updateSession(chatId, { step: 5, data: { sizes } });
        await promptColors(ctx);
        return;
      }
    }
  });

  /* ============================================================
     /skip for wizards
     ============================================================ */

  bot.command('skip', async (ctx) => {
    if (!isAdminChat(ctx.chat?.id)) return;
    const sess = getSession(ctx.chat!.id);
    if (sess.flow === 'add_product' && sess.step === 5) {
      await promptLabels(ctx);
    } else {
      await ctx.reply('Пропускать нечего.');
    }
  });

  /* ============================================================
     START
     ============================================================ */

  bot.start({ onStart: () => console.log('Telegram bot started') });
}
