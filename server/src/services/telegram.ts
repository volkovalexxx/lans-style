import { Bot, InlineKeyboard } from 'grammy';
import { formatOrder, formatWholesale } from '../bot/format';
import { sendPhotoCardTo, resolveImages } from '../bot/media';
import { getBotSettings } from '../bot/settings';

let bot: Bot | null = null;

export function getBot(): Bot | null {
  if (!bot && process.env.TELEGRAM_BOT_TOKEN) {
    bot = new Bot(process.env.TELEGRAM_BOT_TOKEN);
  }
  return bot;
}

function getFallbackIds(): string[] {
  const raw = process.env.TELEGRAM_ADMIN_IDS || process.env.TELEGRAM_CHAT_ID || '';
  return raw.split(',').map((s) => s.trim()).filter(Boolean);
}

function getOrdersChatIds(): string[] {
  const settings = getBotSettings();
  if (settings.ordersChatId) return [settings.ordersChatId];
  return getFallbackIds();
}

function getWholesaleChatIds(): string[] {
  const settings = getBotSettings();
  if (settings.wholesaleChatId) return [settings.wholesaleChatId];
  return getFallbackIds();
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
  const ids = getOrdersChatIds();
  if (!b || !ids.length) return;

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
  const ids = getWholesaleChatIds();
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

export async function sendTelegramNotification(message: string) {
  const b = getBot();
  const ids = getFallbackIds();
  if (!b || !ids.length) return;
  for (const chatId of ids) {
    try {
      await b.api.sendMessage(chatId, message, { parse_mode: 'HTML' });
    } catch (err) {
      console.error(`Telegram send error to ${chatId}:`, err);
    }
  }
}
