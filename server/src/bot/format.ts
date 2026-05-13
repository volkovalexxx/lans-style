// Formatters for messages shown in the bot and in incoming notifications.
// Keeping them in one place guarantees consistent labels ("🛒 ЗАКАЗ", "🏢 ОПТОВАЯ ЗАЯВКА" etc.).

export const STATUS_LABELS: Record<string, string> = {
  new: '🆕 Новый',
  processing: '🔄 В работе',
  done: '✅ Выполнен',
  cancelled: '❌ Отменён',
};

export function formatColor(raw?: string | null): string {
  if (!raw) return '';
  try {
    const p = JSON.parse(raw);
    if (p.name) return p.name;
  } catch {}
  return raw;
}

function esc(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

const SITE_URL = 'https://lans-style.by';

export function formatOrder(order: {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  comment?: string | null;
  status: string;
  createdAt: Date | string;
  items: Array<{
    product: { nameRu: string; slug?: string; priceByn?: any; priceUsd?: any };
    size?: string | null;
    color?: string | null;
    quantity: number;
  }>;
}, opts: { header?: boolean } = {}): string {
  const date = new Date(order.createdAt).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });

  let total = 0;
  const items = order.items
    .map((i) => {
      const name = esc(i.product.nameRu);
      const link = i.product.slug
        ? `<a href="${SITE_URL}/product/${i.product.slug}">🔗 ${name}</a>`
        : `🔗 ${name}`;
      const qty = i.quantity > 1 ? ` ×${i.quantity}` : '';
      const extras = [i.size, formatColor(i.color)].filter(Boolean).join(' · ');
      const priceByn = Number(i.product.priceByn || 0);
      const priceUsd = Number(i.product.priceUsd || 0);
      const lineTotal = priceByn * i.quantity;
      total += lineTotal;
      const priceStr = priceByn
        ? ` — ${lineTotal} BYN${priceUsd ? ` / ${(priceUsd * i.quantity).toFixed(2)} $` : ''}`
        : '';
      return `  • ${link}${qty}${extras ? ` (${esc(extras)})` : ''}${priceStr}`;
    })
    .join('\n');

  const totalStr = total > 0 ? `\n💵 <b>Итого: ${total} BYN</b>` : '';

  const header = opts.header === false ? '' : `🛒 <b>ЗАКАЗ #${order.id}</b>\n`;
  const lines = [
    header,
    `<i>${date}</i> · ${STATUS_LABELS[order.status] || order.status}`,
    '',
    `👤 ${esc(order.name)}`,
    `📞 ${esc(order.phone)}`,
  ];
  if (order.email) lines.push(`📧 ${esc(order.email)}`);
  if (order.comment) lines.push(`💬 ${esc(order.comment)}`);
  lines.push('', '📦 <b>Товары:</b>', items, totalStr);

  return lines.join('\n');
}

export function formatWholesale(req: {
  id: number;
  company: string;
  name: string;
  phone: string;
  email: string;
  city?: string | null;
  comment?: string | null;
  status: string;
  createdAt: Date | string;
}, opts: { header?: boolean } = {}): string {
  const date = new Date(req.createdAt).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' });
  const header = opts.header === false ? '' : `🏢 <b>ОПТОВАЯ ЗАЯВКА #${req.id}</b>\n`;
  const lines = [
    header,
    `<i>${date}</i> · ${STATUS_LABELS[req.status] || req.status}`,
    '',
    `🏪 ${esc(req.company)}`,
    `👤 ${esc(req.name)}`,
    `📞 ${esc(req.phone)}`,
    `📧 ${esc(req.email)}`,
  ];
  if (req.city) lines.push(`📍 ${esc(req.city)}`);
  if (req.comment) lines.push(`💬 ${esc(req.comment)}`);
  return lines.join('\n');
}

export function formatProduct(p: {
  id: number;
  sku?: string | null;
  nameRu: string;
  nameEn: string;
  priceByn: any;
  priceUsd: any;
  priceRub: any;
  sizes: string[];
  colors: string[];
  labels: string[];
  inStock: boolean;
  isCostume?: boolean;
  category?: { nameRu: string } | null;
  costumeTop?: { nameRu: string; priceByn: any } | null;
  costumeBottom?: { nameRu: string; priceByn: any } | null;
}): string {
  const lines = [
    p.sku ? `🔖 <b>Артикул:</b> <code>${esc(p.sku)}</code>` : '',
    p.isCostume ? `👗 <b>Тип:</b> Костюм / Комплект` : '',
    `🇷🇺 <b>Наименование:</b> ${esc(p.nameRu)}`,
    p.nameEn ? `🇺🇸 <b>Наименование:</b> ${esc(p.nameEn)}` : '',
    p.category ? `📂 <b>Категория:</b> ${esc(p.category.nameRu)}` : '',
    `💰 <b>Цена${p.isCostume ? ' (комплект)' : ''}:</b> ${p.priceByn} BYN · ${p.priceUsd} $ · ${p.priceRub || 0} ₽`,
    p.isCostume && p.costumeTop ? `👆 <b>Верх:</b> ${esc(p.costumeTop.nameRu)} — ${p.costumeTop.priceByn} BYN` : '',
    p.isCostume && p.costumeBottom ? `👇 <b>Низ:</b> ${esc(p.costumeBottom.nameRu)} — ${p.costumeBottom.priceByn} BYN` : '',
    !p.isCostume && p.sizes.length ? `📏 <b>Размеры:</b> ${p.sizes.join(', ')}` : '',
    !p.isCostume && p.colors.length ? `🎨 <b>Цвета:</b> ${p.colors.map(formatColor).join(', ')}` : '',
    p.labels.length ? `🏷 <b>Метки:</b> ${p.labels.join(', ')}` : '',
    p.inStock ? '✅ В наличии' : '❌ Нет в наличии',
  ].filter(Boolean);
  return lines.join('\n');
}
