import fs from 'fs';
import path from 'path';
import { InputFile, InputMediaBuilder, type Bot, type Context } from 'grammy';

const UPLOADS_DIR = path.join(__dirname, '..', '..', 'uploads');

/**
 * Download a photo from Telegram servers to the local uploads/ folder.
 * Returns the public URL (e.g. "/uploads/xxx.jpg") to store in product.images.
 */
export async function downloadTelegramPhoto(
  bot: Bot,
  fileId: string
): Promise<string> {
  const file = await bot.api.getFile(fileId);
  if (!file.file_path) throw new Error('No file_path from Telegram');

  const token = process.env.TELEGRAM_BOT_TOKEN!;
  const url = `https://api.telegram.org/file/bot${token}/${file.file_path}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Download failed: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());

  const ext = path.extname(file.file_path) || '.jpg';
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}${ext}`;
  if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  fs.writeFileSync(path.join(UPLOADS_DIR, filename), buf);

  return `/uploads/${filename}`;
}

export function resolveImagePath(url: string): string | null {
  if (!url) return null;
  const filename = url.startsWith('/uploads/') ? url.slice('/uploads/'.length) : url.replace(/^\/+/, '');
  const p = path.join(UPLOADS_DIR, filename);
  return fs.existsSync(p) ? p : null;
}

export function resolveImages(urls: string[] | null | undefined, max = 10): string[] {
  if (!urls?.length) return [];
  const out: string[] = [];
  for (const u of urls) {
    const p = resolveImagePath(u);
    if (p) out.push(p);
    if (out.length >= max) break;
  }
  return out;
}

/**
 * Send a product/order card with photos and info+keyboard.
 *   0 photos  →  single text message (info + keyboard)
 *   1 photo   →  single photo message (photo + caption + keyboard)
 *   2..10     →  media group (photos only, no captions) + text message (info + keyboard)
 *
 * Shows a "⏳ Загрузка…" placeholder while uploading, then deletes it.
 */
export async function sendPhotoCard(
  ctx: Context,
  paths: string[],
  caption: string,
  options: { keyboard?: any } = {}
) {
  const { keyboard } = options;

  if (paths.length === 0) {
    return ctx.reply(caption, { parse_mode: 'HTML', reply_markup: keyboard });
  }

  // Show loading placeholder for any upload
  const loading = await ctx.reply('⏳ Загрузка карточки…').catch(() => null);

  try {
    await ctx.replyWithChatAction('upload_photo').catch(() => {});

    if (paths.length === 1) {
      await ctx.replyWithPhoto(new InputFile(paths[0]), {
        caption, parse_mode: 'HTML', reply_markup: keyboard,
      });
    } else {
      const media = paths.map((p) => InputMediaBuilder.photo(new InputFile(p)));
      await ctx.replyWithMediaGroup(media);
      await ctx.reply(caption, { parse_mode: 'HTML', reply_markup: keyboard });
    }
  } finally {
    if (loading) await ctx.api.deleteMessage(loading.chat.id, loading.message_id).catch(() => {});
  }
}

/** Same but via bot.api for notifications (no ctx available). */
export async function sendPhotoCardTo(
  bot: Bot, chatId: string | number, paths: string[], caption: string,
  options: { keyboard?: any } = {}
) {
  const { keyboard } = options;

  if (paths.length === 0) {
    return bot.api.sendMessage(chatId, caption, { parse_mode: 'HTML', reply_markup: keyboard });
  }
  if (paths.length === 1) {
    return bot.api.sendPhoto(chatId, new InputFile(paths[0]), {
      caption, parse_mode: 'HTML', reply_markup: keyboard,
    });
  }
  const media = paths.map((p) => InputMediaBuilder.photo(new InputFile(p)));
  await bot.api.sendMediaGroup(chatId, media);
  await bot.api.sendMessage(chatId, caption, { parse_mode: 'HTML', reply_markup: keyboard });
}
