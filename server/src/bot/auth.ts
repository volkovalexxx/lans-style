import type { Context, NextFunction } from 'grammy';
import { getBotSettings } from './settings';

export const TECH_ADMIN = '7506120714';

export function isTechAdmin(chatId: number | undefined): boolean {
  return String(chatId) === TECH_ADMIN;
}

export function isAdminChat(chatId: number | undefined): boolean {
  if (!chatId) return false;
  const { adminChatIds } = getBotSettings();
  if (adminChatIds.length === 0) return true; // пока у всех доступ
  return adminChatIds.includes(String(chatId));
}

export async function adminOnly(ctx: Context, next: NextFunction) {
  if (!isAdminChat(ctx.chat?.id)) {
    await ctx.reply('⛔ Доступ запрещён.');
    return;
  }
  await next();
}
