import { Bot, InlineKeyboard } from 'grammy';
import { formatOrder, formatWholesale } from '../bot/format';
import { sendPhotoCardTo, resolveImages } from '../bot/media';

let bot: Bot | null = null;

export function getBot(): Bot | null {
  if (!bot && process.env.TELEGRAM_BOT_TOKEN) {
    bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
  }
  return bot;
}

function getChatIds(): string[] {
  const raw = process.env.TELEGRAM_ADMIN_IDS || process.env.TELEGRAM_CHAT_ID || '';
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

export async function notifyNewOrder(order: {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  comment?: string | null;
  status: string;
  createdAt: Date | string;
  items: Array<{
    product: { nameRu: string; images?: string[] };
    size?: string | null;
    color?: string | null;
    quantity: number;
  }>;
}) {
  const b = getBot();
  const ids = getChatIds();
  if (!b || !ids.length) return;

  // 1 first photo per UNIQUE product in the order, up to 10 photos (Telegram limit)
  const seen = new Set<string>();
  const uniquePhotoUrls: string[] = [];
  for (const item of order.items) {
    const name = item.product.nameRu;
    if (seen.has(name)) continue;
    seen.add(name);
    const firstImg = item.product.images?.[0];
    if (firstImg) uniquePhotoUrls.push(firstImg);
  }
  const paths = resolveImages(uniquePhotoUrls, 10);

  const caption = '🔔 <b>НОВЫЙ ЗАКАЗ</b>\n\n' + formatOrder(order);
  const kb = new InlineKeyboard()
    .text('🔄 В работу', `order:status:${order.id}:processing`)
    .text('✅ Выполнен', `order:status:${order.id}:done`).row()
    .text('❌ Отменить', `order:status:${order.id}:cancelled`);

  for (const chatId of ids) {
    try {
      await sendPhotoCardTo(b, chatId, paths, caption, { keyboard: kb });
    } catch (err) {
      console.error(`Telegram send error to ${chatId}:`, err);
    }
  }
}

export async function notifyNewWholesale(req: {
  id: number;
  company: string;
  name: string;
  phone: string;
  email: string;
  city?: string | null;
  comment?: string | null;
  status: string;
  createdAt: Date | string;
}) {
  const b = getBot();
  const ids = getChatIds();
  if (!b || !ids.length) return;

  const text = '🔔 <b>НОВАЯ ОПТОВАЯ ЗАЯВКА</b>\n\n' + formatWholesale(req);
  const kb = new InlineKeyboard()
    .text('🔄 В работу', `ws:status:${req.id}:processing`)
    .text('✅ Выполнена', `ws:status:${req.id}:done`).row()
    .text('❌ Отменить', `ws:status:${req.id}:cancelled`);

  for (const chatId of ids) {
    try {
      await b.api.sendMessage(chatId, text, { parse_mode: 'HTML', reply_markup: kb });
    } catch (err) {
      console.error(`Telegram send error to ${chatId}:`, err);
    }
  }
}

// Legacy helper kept for any existing callers
export async function sendTelegramNotification(message: string) {
  const b = getBot();
  const ids = getChatIds();
  if (!b || !ids.length) return;
  for (const chatId of ids) {
    try {
      await b.api.sendMessage(chatId, message, { parse_mode: 'HTML' });
    } catch (err) {
      console.error(`Telegram send error to ${chatId}:`, err);
    }
  }
}
