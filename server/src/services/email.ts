import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

export async function sendOrderNotification(order: {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  comment?: string | null;
  items: Array<{ product: { nameRu: string }; size?: string | null; color?: string | null; quantity: number }>;
}) {
  const formatColor = (raw?: string | null) => {
    if (!raw) return '-';
    try {
      const p = JSON.parse(raw);
      if (p.name) return p.name;
    } catch {}
    return raw;
  };

  const itemsList = order.items
    .map((item) => `- ${item.product.nameRu} (размер: ${item.size || '-'}, цвет: ${formatColor(item.color)}, кол-во: ${item.quantity})`)
    .join('\n');

  const text = `Новый заказ #${order.id}\n\nИмя: ${order.name}\nТелефон: ${order.phone}\nEmail: ${order.email || '-'}\nКомментарий: ${order.comment || '-'}\n\nТовары:\n${itemsList}`;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@lans-style.by',
      to: process.env.ORDER_EMAIL || 'orders@lans-style.by',
      subject: `Новый заказ #${order.id} — Lans Style`,
      text,
    });
  } catch (err) {
    console.error('Email send error:', err);
  }
}

export async function sendWholesaleNotification(request: {
  id: number;
  company: string;
  name: string;
  phone: string;
  email: string;
  city?: string | null;
  comment?: string | null;
}) {
  const text = `Новая оптовая заявка #${request.id}\n\nКомпания: ${request.company}\nИмя: ${request.name}\nТелефон: ${request.phone}\nEmail: ${request.email}\nГород: ${request.city || '-'}\nКомментарий: ${request.comment || '-'}`;

  try {
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'noreply@lans-style.by',
      to: 'Lansstil2007@gmail.com',
      subject: `Оптовая заявка #${request.id} — Lans Style`,
      text,
    });
  } catch (err) {
    console.error('Email send error:', err);
  }
}
