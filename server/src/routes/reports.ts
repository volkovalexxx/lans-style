import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { InputFile } from 'grammy';
import { authMiddleware } from '../middleware/auth';
import { prisma } from '../index';
import { generateMonthlyReport, getAvailableMonths, monthName } from '../services/reports';
import { getBot } from '../services/telegram';
import { getBotSettings } from '../bot/settings';

const router = Router();

// List all saved reports
router.get('/', authMiddleware, async (_req, res) => {
  const reports = await (prisma as any).report.findMany({
    orderBy: [{ year: 'desc' }, { month: 'desc' }],
  });
  res.json(reports);
});

// Months that have done orders (for picker)
router.get('/months', authMiddleware, async (_req, res) => {
  const months = await getAvailableMonths();
  res.json(months);
});

// Generate report for year/month, send to Telegram, return file info
router.post('/generate', authMiddleware, async (req, res) => {
  const { year, month } = req.body as { year: number; month: number };
  if (!year || !month) {
    res.status(400).json({ error: 'year and month required' });
    return;
  }

  try {
    const filePath = await generateMonthlyReport(Number(year), Number(month));

    // Send to Telegram (non-blocking)
    sendReportToTelegram(filePath, Number(year), Number(month)).catch(console.error);

    const report = await (prisma as any).report.findUnique({
      where: { year_month: { year: Number(year), month: Number(month) } },
    });
    res.json(report);
  } catch (err: any) {
    console.error('Report generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate report' });
  }
});

// Download report file
router.get('/:id/download', authMiddleware, async (req, res) => {
  const report = await (prisma as any).report.findUnique({
    where: { id: Number(req.params.id) },
  });
  if (!report) {
    res.status(404).json({ error: 'Report not found' });
    return;
  }
  if (!fs.existsSync(report.filePath)) {
    res.status(404).json({ error: 'File not found on disk' });
    return;
  }
  const fileName = `Отчёт_${monthName(report.month)}_${report.year}.xlsx`;
  res.download(report.filePath, fileName);
});

export async function sendReportToTelegram(filePath: string, year: number, month: number) {
  const bot = getBot();
  if (!bot || !fs.existsSync(filePath)) return;

  const { retailChatIds } = getBotSettings();
  const ids = retailChatIds.length ? retailChatIds : ['7506120714'];
  const caption = `📊 Отчёт за ${monthName(month)} ${year}`;

  for (const chatId of ids) {
    try {
      await bot.api.sendDocument(chatId, new InputFile(filePath), { caption });
    } catch (err) {
      console.error(`Telegram report send error to ${chatId}:`, err);
    }
  }
}

export default router;
