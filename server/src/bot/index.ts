import { Bot, InlineKeyboard, Keyboard, type Context } from 'grammy';
import { prisma } from '../index';
import { adminOnly } from './auth';
import { getSession, setFlow, updateSession, clearSession } from './session';
import { formatOrder, formatWholesale, formatProduct, STATUS_LABELS } from './format';
import { sendPhotoCard, resolveImages, downloadTelegramPhoto } from './media';

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

  bot.use(adminOnly);
  bot.catch((err) => console.error('Bot error:', err));

  /* ---------- /start, help, main menu ---------- */

  bot.command('start', async (ctx) => {
    clearSession(ctx.chat!.id);
    await ctx.reply(
      '👗 <b>Lans Style — Админ-бот</b>\n\n' +
        'Через бота вы можете:\n' +
        '• просматривать заказы и оптовые заявки\n' +
        '• менять их статусы\n' +
        '• управлять товарами и категориями\n' +
        '• смотреть статистику\n\n' +
        'Используйте меню ниже ⬇️',
      { parse_mode: 'HTML', reply_markup: mainMenu() }
    );
  });

  bot.hears('❓ Помощь', (ctx) => ctx.reply(
    'Главное меню — кнопки внизу экрана.\n\n' +
    '<b>Заказы / Опт</b> — вкладки по статусу, смена статуса, удаление отменённых.\n' +
    '<b>Категории</b> — список, добавление, удаление.\n' +
    '<b>Товары</b> — поиск, просмотр, добавление с выбором цветов из уже созданных. Новый глобальный цвет нужно добавлять через админ-панель сайта.\n\n' +
    '/cancel — прервать текущее действие.',
    { parse_mode: 'HTML' }
  ));

  bot.command('cancel', async (ctx) => {
    clearSession(ctx.chat!.id);
    await ctx.reply('Действие отменено.', { reply_markup: mainMenu() });
  });

  /* ---------- STATS ---------- */

  bot.hears('📊 Статистика', async (ctx) => {
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

  bot.hears('🛒 Заказы', (ctx) => sendOrdersTabs(ctx));

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
    await ctx.answerCallbackQuery();
    await sendOrdersTabs(ctx, ctx.match![1]);
  });

  bot.callbackQuery(/^order:status:(\d+):(\w+)$/, async (ctx) => {
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
    await ctx.answerCallbackQuery({ text: `Статус → ${STATUS_LABELS[status]}` });
  });

  bot.callbackQuery(/^order:delete:(\d+)$/, async (ctx) => {
    const id = Number(ctx.match![1]);
    await prisma.orderItem.deleteMany({ where: { orderId: id } });
    await prisma.order.delete({ where: { id } });
    await ctx.editMessageText(`🗑 Заказ #${id} удалён`);
    await ctx.answerCallbackQuery({ text: 'Удалён' });
  });

  /* ============================================================
     WHOLESALE
     ============================================================ */

  bot.hears('🏢 Опт', (ctx) => sendWholesaleTabs(ctx));

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
    await ctx.answerCallbackQuery();
    await sendWholesaleTabs(ctx, ctx.match![1]);
  });

  bot.callbackQuery(/^ws:status:(\d+):(\w+)$/, async (ctx) => {
    const id = Number(ctx.match![1]);
    const status = ctx.match![2];
    await prisma.wholesaleRequest.update({ where: { id }, data: { status } });
    const updated = await prisma.wholesaleRequest.findUnique({ where: { id } });
    if (updated) {
      await ctx.editMessageText(formatWholesale(updated), {
        parse_mode: 'HTML', reply_markup: wsActionsKb(id, status),
      });
    }
    await ctx.answerCallbackQuery({ text: `Статус → ${STATUS_LABELS[status]}` });
  });

  bot.callbackQuery(/^ws:delete:(\d+)$/, async (ctx) => {
    const id = Number(ctx.match![1]);
    await prisma.wholesaleRequest.delete({ where: { id } });
    await ctx.editMessageText(`🗑 Заявка #${id} удалена`);
    await ctx.answerCallbackQuery({ text: 'Удалена' });
  });

  /* ============================================================
     CATEGORIES
     ============================================================ */

  bot.hears('📂 Категории', async (ctx) => {
    const cats = await prisma.category.findMany({
      orderBy: { id: 'asc' },
      include: { _count: { select: { products: true } } },
    });
    const text = cats.length
      ? `📂 <b>Категории (${cats.length})</b>\n\n` +
        cats.map((c) => `• <b>${c.nameRu}</b> · ${c._count.products} товаров`).join('\n')
      : '📂 Категорий пока нет';
    const kb = new InlineKeyboard().text('➕ Добавить категорию', 'cat:add');
    for (const c of cats) kb.row().text(`🗑 ${c.nameRu}`, `cat:del:${c.id}`);
    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: kb });
  });

  bot.callbackQuery('cat:add', async (ctx) => {
    setFlow(ctx.chat!.id, 'add_category');
    await ctx.answerCallbackQuery();
    await ctx.reply('📝 Введите название категории на <b>русском</b> (или /cancel):', { parse_mode: 'HTML' });
  });

  bot.callbackQuery(/^cat:del:(\d+)$/, async (ctx) => {
    const id = Number(ctx.match![1]);
    const cat = await prisma.category.findUnique({
      where: { id },
      include: { _count: { select: { products: true } } },
    });
    if (!cat) { await ctx.answerCallbackQuery({ text: 'Не найдено' }); return; }
    const kb = new InlineKeyboard()
      .text('🗑 Да, удалить', `cat:delconfirm:${id}`)
      .text('Отмена', 'noop');
    await ctx.answerCallbackQuery();
    await ctx.reply(
      `⚠️ Удалить категорию «${cat.nameRu}»?\nВместе с ней будут удалены ${cat._count.products} товаров и связанные позиции в заказах.`,
      { reply_markup: kb }
    );
  });

  bot.callbackQuery(/^cat:delconfirm:(\d+)$/, async (ctx) => {
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
    await ctx.editMessageText('🗑 Категория удалена');
  });

  bot.callbackQuery('noop', async (ctx) => {
    await ctx.answerCallbackQuery();
    await ctx.deleteMessage().catch(() => {});
  });

  /* ============================================================
     PRODUCTS
     ============================================================ */

  bot.hears('📦 Товары', async (ctx) => {
    const kb = new InlineKeyboard()
      .text('🔍 Поиск', 'prod:search').row()
      .text('📂 По категориям', 'prod:bycats').row()
      .text('📋 Последние', 'prod:list').row()
      .text('➕ Добавить товар', 'prod:add');
    await ctx.reply('📦 <b>Товары</b>\nВыберите действие:', { parse_mode: 'HTML', reply_markup: kb });
  });

  bot.callbackQuery('prod:list', async (ctx) => {
    await ctx.answerCallbackQuery();
    await listProductsAsButtons(ctx, {}, '📋 <b>Последние товары</b>');
  });

  bot.callbackQuery('prod:search', async (ctx) => {
    setFlow(ctx.chat!.id, 'search_products');
    await ctx.answerCallbackQuery();
    await ctx.reply('🔍 Введите название или артикул для поиска:');
  });

  // Categories → list categories as buttons → click sends product buttons for that category
  bot.callbackQuery('prod:bycats', async (ctx) => {
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
    await ctx.reply('📂 <b>Выберите категорию</b>', { parse_mode: 'HTML', reply_markup: kb });
  });

  bot.callbackQuery(/^prod:incat:(\d+)$/, async (ctx) => {
    const categoryId = Number(ctx.match![1]);
    const cat = await prisma.category.findUnique({ where: { id: categoryId } });
    await ctx.answerCallbackQuery();
    await listProductsAsButtons(ctx, { categoryId }, `📂 <b>${cat?.nameRu || 'Категория'}</b>`);
  });

  function productCardKb(p: { id: number; inStock: boolean }) {
    return new InlineKeyboard()
      .text('✏️ Редактировать', `prod:edit:${p.id}`).row()
      .text(p.inStock ? '❌ Нет в наличии' : '✅ В наличии', `prod:stock:${p.id}`)
      .text('🗑 Удалить', `prod:del:${p.id}`);
  }

  function productEditKb(id: number) {
    return new InlineKeyboard()
      .text('📝 Название RU', `pedit:field:${id}:nameRu`)
      .text('📝 Название EN', `pedit:field:${id}:nameEn`).row()
      .text('💰 Цены', `pedit:field:${id}:prices`)
      .text('📏 Размеры', `pedit:field:${id}:sizes`).row()
      .text('🏷 Артикул', `pedit:field:${id}:sku`)
      .text('📂 Категория', `pedit:cat:${id}`).row()
      .text('🎨 Цвета', `pedit:colors:${id}`)
      .text('🏷 Метки', `pedit:labels:${id}`).row()
      .text('◀️ Назад к карточке', `prod:view:${id}`);
  }

  async function sendProductCard(ctx: Context, id: number) {
    const p = await prisma.product.findUnique({
      where: { id },
      include: { category: true, costumeTop: true, costumeBottom: true },
    });
    if (!p) { await ctx.reply('Товар не найден'); return; }
    const paths = resolveImages(p.images, 10);
    await sendPhotoCard(ctx, paths, formatProduct(p), { keyboard: productCardKb(p) });
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
      // Telegram button text limit ~64 chars
      const safe = label.length > 60 ? label.slice(0, 57) + '…' : label;
      kb.text(safe, `prod:view:${p.id}`).row();
    }
    await ctx.reply(`${title}\n<i>${products.length} шт. Нажмите, чтобы открыть карточку.</i>`,
      { parse_mode: 'HTML', reply_markup: kb });
  }

  /* ---------- view / stock / delete ---------- */

  bot.callbackQuery(/^prod:view:(\d+)$/, async (ctx) => {
    const id = Number(ctx.match![1]);
    await ctx.answerCallbackQuery();
    await sendProductCard(ctx, id);
  });

  bot.callbackQuery(/^prod:stock:(\d+)$/, async (ctx) => {
    const id = Number(ctx.match![1]);
    const p = await prisma.product.findUnique({ where: { id } });
    if (!p) return ctx.answerCallbackQuery({ text: 'Не найден' });
    const updated = await prisma.product.update({
      where: { id }, data: { inStock: !p.inStock }, include: { category: true },
    });
    const caption = formatProduct(updated);
    const kb = productCardKb(updated);
    // Try to edit the photo caption (if the message is a photo) or text
    try {
      if (ctx.callbackQuery.message?.photo) {
        await ctx.editMessageCaption({ caption, parse_mode: 'HTML', reply_markup: kb });
      } else {
        await ctx.editMessageText(caption, { parse_mode: 'HTML', reply_markup: kb });
      }
    } catch {
      // Follow-up keyboard message (media group) — just update its text
      try { await ctx.editMessageText(caption, { parse_mode: 'HTML', reply_markup: kb }); }
      catch { await sendProductCard(ctx, id); }
    }
    await ctx.answerCallbackQuery({ text: updated.inStock ? 'В наличии' : 'Нет в наличии' });
  });

  bot.callbackQuery(/^prod:del:(\d+)$/, async (ctx) => {
    const id = Number(ctx.match![1]);
    const kb = new InlineKeyboard()
      .text('🗑 Да, удалить', `prod:delconfirm:${id}`)
      .text('Отмена', 'noop');
    await ctx.answerCallbackQuery();
    await ctx.reply('⚠️ Удалить этот товар?', { reply_markup: kb });
  });

  bot.callbackQuery(/^prod:delconfirm:(\d+)$/, async (ctx) => {
    const id = Number(ctx.match![1]);
    await prisma.orderItem.deleteMany({ where: { productId: id } });
    await prisma.product.delete({ where: { id } });
    await ctx.answerCallbackQuery({ text: 'Удалено' });
    await ctx.editMessageText('🗑 Товар удалён');
  });

  /* ---------- edit entry ---------- */

  bot.callbackQuery(/^prod:edit:(\d+)$/, async (ctx) => {
    const id = Number(ctx.match![1]);
    const p = await prisma.product.findUnique({ where: { id }, include: { category: true } });
    if (!p) return ctx.answerCallbackQuery({ text: 'Не найден' });
    await ctx.answerCallbackQuery();
    // Always send as a new TEXT message — the card above may be a photo/media group
    // which can't be converted to text via edit
    await ctx.reply(
      `✏️ <b>Редактирование товара</b>\n\n` + formatProduct(p) + `\n\nВыберите, что изменить:`,
      { parse_mode: 'HTML', reply_markup: productEditKb(id) }
    );
  });

  /* ---------- edit simple text fields ---------- */

  const fieldPrompts: Record<string, string> = {
    nameRu: '📝 Введите новое название на <b>русском</b>:',
    nameEn: '📝 Введите новое название на <b>английском</b>:',
    sku: '🏷 Введите артикул (или «-» чтобы очистить):',
    prices: '💰 Введите три цены через пробел: <code>BYN USD RUB</code>\nНапример: <code>289 89 8200</code>',
    sizes: '📏 Введите размеры через запятую (или «-» чтобы очистить):',
  };

  bot.callbackQuery(/^pedit:field:(\d+):(\w+)$/, async (ctx) => {
    const id = Number(ctx.match![1]);
    const field = ctx.match![2];
    if (!fieldPrompts[field]) return ctx.answerCallbackQuery({ text: 'Неизвестное поле' });
    setFlow(ctx.chat!.id, 'edit_product_field', { productId: id, field });
    await ctx.answerCallbackQuery();
    await ctx.reply(fieldPrompts[field], { parse_mode: 'HTML' });
  });

  /* ---------- edit category ---------- */

  bot.callbackQuery(/^pedit:cat:(\d+)$/, async (ctx) => {
    const id = Number(ctx.match![1]);
    const cats = await prisma.category.findMany({ orderBy: { id: 'asc' } });
    const kb = new InlineKeyboard();
    cats.forEach((c, i) => { kb.text(c.nameRu, `pedit:catset:${id}:${c.id}`); if ((i + 1) % 2 === 0) kb.row(); });
    kb.row().text('◀️ Отмена', `prod:edit:${id}`);
    await ctx.answerCallbackQuery();
    await ctx.reply('📂 Выберите новую категорию:', { reply_markup: kb });
  });

  bot.callbackQuery(/^pedit:catset:(\d+):(\d+)$/, async (ctx) => {
    const id = Number(ctx.match![1]);
    const categoryId = Number(ctx.match![2]);
    await prisma.product.update({ where: { id }, data: { categoryId } });
    await ctx.answerCallbackQuery({ text: 'Категория изменена' });
    await ctx.deleteMessage().catch(() => {});
    await sendProductCard(ctx, id);
  });

  /* ---------- edit colors (toggle from existing palette) ---------- */

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
      const msg = '🎨 В системе нет цветов с именами.\nДобавьте цвет через админ-панель сайта.';
      if (edit) await ctx.editMessageText(msg, { reply_markup: new InlineKeyboard().text('◀️ Назад', `prod:edit:${id}`) });
      else await ctx.reply(msg);
      return;
    }

    const kb = new InlineKeyboard();
    const arr = Array.from(palette.values());
    arr.forEach((c, i) => {
      const marked = selected.has(c.hex.toLowerCase());
      kb.text(`${marked ? '✅ ' : '○ '}${c.name}`, `pedit:colortoggle:${id}:${c.hex}`);
      if ((i + 1) % 2 === 0) kb.row();
    });
    kb.row().text('◀️ Готово', `prod:edit:${id}`);

    const text = '🎨 <b>Цвета товара</b>\nНажимайте, чтобы добавить или убрать.\n\n<i>Новый цвет — через админ-панель сайта.</i>';
    if (edit) await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
    else await ctx.reply(text, { parse_mode: 'HTML', reply_markup: kb });
  }

  bot.callbackQuery(/^pedit:colors:(\d+)$/, async (ctx) => {
    const id = Number(ctx.match![1]);
    await ctx.answerCallbackQuery();
    await renderColorsEditor(ctx, id, true);
  });

  bot.callbackQuery(/^pedit:colortoggle:(\d+):(.+)$/, async (ctx) => {
    const id = Number(ctx.match![1]);
    const hex = ctx.match![2].toLowerCase();
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) return ctx.answerCallbackQuery({ text: 'Не найден' });
    // Load palette to get name by hex
    const all = await prisma.product.findMany({ select: { colors: true } });
    const palette = new Map<string, { hex: string; name: string }>();
    for (const p of all) for (const c of p.colors) {
      try { const parsed = JSON.parse(c); if (parsed.hex) palette.set(parsed.hex.toLowerCase(), parsed); } catch {}
    }

    const current = new Map<string, string>(); // hex -> raw JSON
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
    // Combine presets with any custom labels the product already has
    const all = Array.from(new Set([...PRESET_LABELS, ...product.labels]));

    const kb = new InlineKeyboard();
    all.forEach((l, i) => {
      const marked = selected.has(l);
      kb.text(`${marked ? '✅ ' : '○ '}${l}`, `pedit:labeltoggle:${id}:${l}`);
      if ((i + 1) % 3 === 0) kb.row();
    });
    kb.row().text('◀️ Готово', `prod:edit:${id}`);

    const text = '🏷 <b>Метки товара</b>\nНажимайте, чтобы добавить или убрать.';
    if (edit) await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: kb });
    else await ctx.reply(text, { parse_mode: 'HTML', reply_markup: kb });
  }

  bot.callbackQuery(/^pedit:labels:(\d+)$/, async (ctx) => {
    const id = Number(ctx.match![1]);
    await ctx.answerCallbackQuery();
    await renderLabelsEditor(ctx, id, true);
  });

  bot.callbackQuery(/^pedit:labeltoggle:(\d+):(.+)$/, async (ctx) => {
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
    const cats = await prisma.category.findMany({ orderBy: { id: 'asc' } });
    if (!cats.length) {
      await ctx.answerCallbackQuery();
      await ctx.reply('⚠️ Сначала создайте хотя бы одну категорию.');
      return;
    }
    setFlow(ctx.chat!.id, 'add_product', { colors: [], labels: [], images: [] });
    await ctx.answerCallbackQuery();
    await ctx.reply('📝 <b>Шаг 1/8.</b> Введите название товара на <b>русском</b> (или /cancel):', { parse_mode: 'HTML' });
  });

  async function promptCategory(ctx: Context) {
    const cats = await prisma.category.findMany({ orderBy: { id: 'asc' } });
    const kb = new InlineKeyboard();
    cats.forEach((c, i) => { kb.text(c.nameRu, `wz:cat:${c.id}`); if ((i + 1) % 2 === 0) kb.row(); });
    await ctx.reply('📂 <b>Шаг 3/8.</b> Выберите категорию:', { parse_mode: 'HTML', reply_markup: kb });
  }

  bot.callbackQuery(/^wz:cat:(\d+)$/, async (ctx) => {
    const sess = getSession(ctx.chat!.id);
    if (sess.flow !== 'add_product') return ctx.answerCallbackQuery();
    updateSession(ctx.chat!.id, { step: 3, data: { categoryId: Number(ctx.match![1]) } });
    await ctx.answerCallbackQuery();
    await ctx.reply(
      '💰 <b>Шаг 4/8.</b> Введите цены через пробел: <code>BYN USD RUB</code>\nНапример: <code>289 89 8200</code>',
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
        '🎨 В системе пока нет цветов с именами.\n\n' +
        'Добавьте глобальный цвет через админ-панель сайта (страница «Товары» → палитра цветов). ' +
        'После этого цвета станут доступны в боте.\n\n' +
        'Пока пропускаем цвета. /skip',
      );
      updateSession(ctx.chat!.id, { step: 5, data: {} });
      return;
    }

    const kb = new InlineKeyboard();
    allColors.forEach((c, i) => {
      const marked = selected.includes(c.hex.toLowerCase());
      kb.text(`${marked ? '✅ ' : ''}${c.name}`, `wz:color:${c.hex}`);
      if ((i + 1) % 2 === 0) kb.row();
    });
    kb.row().text('✅ Готово', 'wz:colors:done').text('⏭ Пропустить', 'wz:colors:skip');

    await ctx.reply(
      '🎨 <b>Шаг 6/8.</b> Выберите цвета из палитры (можно несколько).\n\n' +
      '<i>Новый цвет нужно добавлять через админ-панель сайта.</i>',
      { parse_mode: 'HTML', reply_markup: kb }
    );
  }

  bot.callbackQuery(/^wz:color:(.+)$/, async (ctx) => {
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
      kb.text(`${marked ? '✅ ' : ''}${l}`, `wz:label:${l}`);
      if ((i + 1) % 3 === 0) kb.row();
    });
    kb.row().text('✅ Готово', 'wz:labels:done').text('⏭ Пропустить', 'wz:labels:done');
    updateSession(ctx.chat!.id, { step: 6 });
    await ctx.reply('🏷 <b>Шаг 7/8.</b> Выберите метки (можно несколько):', { parse_mode: 'HTML', reply_markup: kb });
  }

  bot.callbackQuery(/^wz:label:(.+)$/, async (ctx) => {
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
    const sess = getSession(ctx.chat!.id);
    if (sess.flow !== 'add_product') return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    await promptPhotos(ctx);
  });

  async function promptPhotos(ctx: Context) {
    updateSession(ctx.chat!.id, { step: 7 });
    const kb = new InlineKeyboard()
      .text('✅ Сохранить товар', 'wz:photos:done')
      .text('⏭ Без фото', 'wz:photos:done');
    await ctx.reply(
      '📷 <b>Шаг 8/8.</b> Пришлите фотографии товара.\n' +
      'Можно отправить несколько — по одной или альбомом. Отправленные фото будут добавлены к товару.\n\n' +
      'Когда закончите — нажмите <b>Сохранить</b>.',
      { parse_mode: 'HTML', reply_markup: kb }
    );
  }

  bot.callbackQuery('wz:photos:done', async (ctx) => {
    const sess = getSession(ctx.chat!.id);
    if (sess.flow !== 'add_product') return ctx.answerCallbackQuery();
    await ctx.answerCallbackQuery();
    await finalizeProduct(ctx);
  });

  /* ---------- Photo upload handler (wizard step 7) ---------- */
  bot.on('message:photo', async (ctx) => {
    const sess = getSession(ctx.chat!.id);
    if (sess.flow !== 'add_product' || sess.step !== 7) return;
    try {
      const photos = ctx.message.photo;
      const fileId = photos[photos.length - 1].file_id; // largest size
      const url = await downloadTelegramPhoto(bot, fileId);
      const images: string[] = sess.data?.images || [];
      images.push(url);
      updateSession(ctx.chat!.id, { data: { images } });
      await ctx.reply(`📸 Фото добавлено (всего: ${images.length})`);
    } catch (err: any) {
      await ctx.reply(`❌ Не удалось загрузить фото: ${err.message}`);
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
      const photoCount = (d.images || []).length;
      const footer = photoCount
        ? `\n\n<i>Загружено ${photoCount} ${photoCount === 1 ? 'фото' : 'фото'}. Описание можно добавить через админ-панель.</i>`
        : '\n\n<i>Фото и описание можно добавить через админ-панель сайта.</i>';
      await ctx.reply('✅ <b>Товар создан</b>\n\n' + formatProduct(product) + footer,
        { parse_mode: 'HTML', reply_markup: mainMenu() }
      );
    } catch (err: any) {
      await ctx.reply(`❌ Ошибка: ${err.message}`, { reply_markup: mainMenu() });
      clearSession(ctx.chat!.id);
    }
  }

  /* ============================================================
     Text handler — dispatches to active flow
     ============================================================ */

  bot.on('message:text', async (ctx) => {
    const text = ctx.message.text.trim();
    if (text.startsWith('/')) return; // command
    // reserved menu buttons already handled by .hears

    const sess = getSession(ctx.chat!.id);
    if (!sess.flow) return;

    /* --- add_category --- */
    if (sess.flow === 'add_category') {
      if (sess.step === 0) {
        updateSession(ctx.chat!.id, { step: 1, data: { nameRu: text } });
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
        clearSession(ctx.chat!.id);
        await ctx.reply(`✅ Категория «${cat.nameRu}» создана`, { reply_markup: mainMenu() });
        return;
      }
    }

    /* --- search_products --- */
    if (sess.flow === 'search_products') {
      clearSession(ctx.chat!.id);
      const where = {
        OR: [
          { nameRu: { contains: text, mode: 'insensitive' as const } },
          { nameEn: { contains: text, mode: 'insensitive' as const } },
          { sku: { contains: text, mode: 'insensitive' as const } },
        ],
      };
      await listProductsAsButtons(ctx, where, `🔍 <b>Поиск: «${text}»</b>`);
      return;
    }

    /* --- edit_product_field --- */
    if (sess.flow === 'edit_product_field') {
      const { productId, field } = sess.data || {};
      if (!productId || !field) { clearSession(ctx.chat!.id); return; }

      try {
        if (field === 'prices') {
          const parts = text.split(/\s+/).map(Number);
          if (parts.length < 2 || parts.some((n) => isNaN(n))) {
            await ctx.reply('❌ Нужно 2–3 числа через пробел, например: <code>289 89 8200</code>', { parse_mode: 'HTML' });
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
          await ctx.reply('Неизвестное поле');
          clearSession(ctx.chat!.id);
          return;
        }
        clearSession(ctx.chat!.id);
        await ctx.reply('✅ Сохранено');
        await sendProductCard(ctx, productId);
      } catch (err: any) {
        await ctx.reply(`❌ Ошибка: ${err.message}`);
        clearSession(ctx.chat!.id);
      }
      return;
    }

    /* --- add_product wizard --- */
    if (sess.flow === 'add_product') {
      const step = sess.step ?? 0;
      if (step === 0) {
        updateSession(ctx.chat!.id, { step: 1, data: { nameRu: text } });
        await ctx.reply('🌐 <b>Шаг 2/7.</b> Введите название на <b>английском</b> (или отправьте «-» чтобы пропустить):', { parse_mode: 'HTML' });
        return;
      }
      if (step === 1) {
        const nameEn = text === '-' ? '' : text;
        updateSession(ctx.chat!.id, { step: 2, data: { nameEn } });
        await promptCategory(ctx);
        return;
      }
      if (step === 3) {
        const parts = text.split(/\s+/).map(Number);
        if (parts.length < 2 || parts.some((n) => isNaN(n))) {
          await ctx.reply('❌ Введите 2–3 числа через пробел, например: <code>289 89 8200</code>', { parse_mode: 'HTML' });
          return;
        }
        const [priceByn, priceUsd, priceRub = 0] = parts;
        updateSession(ctx.chat!.id, { step: 4, data: { priceByn, priceUsd, priceRub } });
        await ctx.reply('📏 <b>Шаг 5/7.</b> Введите размеры через запятую (например: <code>S, M, L, XL</code>) или «-» чтобы пропустить:', { parse_mode: 'HTML' });
        return;
      }
      if (step === 4) {
        const sizes = text === '-' ? [] : text.split(',').map((s) => s.trim()).filter(Boolean);
        updateSession(ctx.chat!.id, { step: 5, data: { sizes } });
        await promptColors(ctx);
        return;
      }
    }
  });

  /* ============================================================
     /skip for wizards
     ============================================================ */

  bot.command('skip', async (ctx) => {
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
