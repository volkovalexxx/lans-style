import type { Context, NextFunction } from 'grammy';

export function isAdminChat(chatId: number | undefined): boolean {
  if (!chatId) return false;
  const raw = process.env.TELEGRAM_ADMIN_IDS || '';
  const ids = raw.split(',').map((s) => s.trim()).filter(Boolean);
  if (ids.length === 0) return true; // dev mode: no whitelist -> allow all
  return ids.includes(String(chatId));
}

export async function adminOnly(ctx: Context, next: NextFunction) {
  const chatId = ctx.chat?.id;
  if (!isAdminChat(chatId)) {
    await ctx.reply('⛔ Доступ запрещён. Обратитесь к администратору сайта.');
    return;
  }
  await next();
}
