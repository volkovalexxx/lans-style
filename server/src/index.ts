import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';

import productsRouter from './routes/products';
import categoriesRouter from './routes/categories';
import ordersRouter from './routes/orders';
import wholesaleRouter from './routes/wholesale';
import adminRouter from './routes/admin';
import uploadRouter from './routes/upload';
import pagesRouter from './routes/pages';
import settingsRouter from './routes/settings';
import homeCardsRouter from './routes/homeCards';
import reportsRouter, { sendReportToTelegram } from './routes/reports';
import exportRouter from './routes/export';
import shareRouter from './routes/share';
import { generateMonthlyReport } from './services/reports';
import { startBot } from './bot';

export const prisma = new PrismaClient();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// API Routes
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/wholesale', wholesaleRouter);
app.use('/api/admin', adminRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/pages', pagesRouter);
app.use('/api/settings', settingsRouter);
app.use('/api/home-cards', homeCardsRouter);
app.use('/api/reports', reportsRouter);
app.use('/api/export', exportRouter);
app.use('/api/share', shareRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);

  // Start Telegram bot if token is configured
  if (process.env.TELEGRAM_BOT_TOKEN) {
    startBot();
  }

  // Auto-generate monthly report on the 1st of each month at 00:00
  cron.schedule('0 0 1 * *', async () => {
    const now = new Date();
    const month = now.getMonth() === 0 ? 12 : now.getMonth();
    const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
    console.log(`[cron] Generating monthly report for ${year}/${month}`);
    try {
      const filePath = await generateMonthlyReport(year, month);
      await sendReportToTelegram(filePath, year, month);
      console.log(`[cron] Report for ${year}/${month} sent.`);
    } catch (err) {
      console.error('[cron] Report generation failed:', err);
    }
  });
});
