import path from 'path';
import fs from 'fs';
import ExcelJS from 'exceljs';
import { prisma } from '../index';

const MONTHS_RU = [
  'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
  'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь',
];

export function monthName(month: number): string {
  return MONTHS_RU[month - 1] || String(month);
}

export async function generateMonthlyReport(year: number, month: number): Promise<string> {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 1);

  // Fetch all done orders in the month, with their items
  const orders = await prisma.order.findMany({
    where: {
      status: 'done',
      createdAt: { gte: start, lt: end },
    },
    include: {
      items: {
        include: { product: true },
      },
    },
    orderBy: { createdAt: 'asc' },
  });

  // Flatten to rows
  const rows: Array<{
    sku: string;
    nameRu: string;
    quantity: number;
    priceByn: number;
    date: string;
  }> = [];

  for (const order of orders) {
    const dateStr = order.createdAt.toLocaleDateString('ru-RU', {
      day: '2-digit', month: '2-digit', year: 'numeric',
    });
    for (const item of order.items) {
      // Use snapshot if product was deleted
      const sku = item.product?.sku ?? item.productSku ?? '—';
      const nameRu = item.product?.nameRu ?? item.productNameRu ?? 'Удалённый товар';
      const priceByn = Number(item.product?.priceByn ?? item.productPriceByn ?? 0);
      rows.push({
        sku,
        nameRu,
        quantity: item.quantity,
        priceByn,
        date: dateStr,
      });
    }
  }

  // Create Excel workbook
  const wb = new ExcelJS.Workbook();
  wb.creator = 'Lans Style';
  const ws = wb.addWorksheet(`${monthName(month)} ${year}`);

  // Header style
  ws.columns = [
    { header: 'Артикул', key: 'sku', width: 16 },
    { header: 'Название товара', key: 'nameRu', width: 36 },
    { header: 'Количество', key: 'quantity', width: 14 },
    { header: 'Цена BYN', key: 'priceByn', width: 14 },
    { header: 'Дата выполнения', key: 'date', width: 18 },
  ];

  const headerRow = ws.getRow(1);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1A1A1A' } };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      bottom: { style: 'thin', color: { argb: 'FFC4A882' } },
    };
  });
  headerRow.height = 22;

  rows.forEach((r, i) => {
    const row = ws.addRow(r);
    const fill = i % 2 === 0
      ? { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFAFAF8' } }
      : { type: 'pattern' as const, pattern: 'solid' as const, fgColor: { argb: 'FFFFFFFF' } };
    row.eachCell((cell) => { cell.fill = fill; });
  });

  // Total row
  if (rows.length > 0) {
    const totalQty = rows.reduce((s, r) => s + r.quantity, 0);
    const totalPrice = rows.reduce((s, r) => s + r.priceByn * r.quantity, 0);
    const totalRow = ws.addRow({ sku: '', nameRu: 'ИТОГО', quantity: totalQty, priceByn: totalPrice, date: '' });
    totalRow.eachCell((cell) => {
      cell.font = { bold: true };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F0EB' } };
    });
  }

  // Save file
  const reportsDir = path.join(__dirname, '..', '..', 'uploads', 'reports');
  if (!fs.existsSync(reportsDir)) fs.mkdirSync(reportsDir, { recursive: true });

  const fileName = `report_${year}_${String(month).padStart(2, '0')}.xlsx`;
  const filePath = path.join(reportsDir, fileName);
  await wb.xlsx.writeFile(filePath);

  // Upsert DB record
  await (prisma as any).report.upsert({
    where: { year_month: { year, month } },
    create: { year, month, filePath },
    update: { filePath, createdAt: new Date() },
  });

  return filePath;
}

export async function getAvailableMonths(): Promise<Array<{ year: number; month: number; label: string }>> {
  const results = await prisma.$queryRaw<Array<{ year: number; month: number }>>`
    SELECT EXTRACT(YEAR FROM o."createdAt")::int AS year,
           EXTRACT(MONTH FROM o."createdAt")::int AS month
    FROM "Order" o
    WHERE o.status = 'done'
    GROUP BY 1, 2
    ORDER BY 1 DESC, 2 DESC
  `;
  return results.map((r) => ({
    year: r.year,
    month: r.month,
    label: `${monthName(r.month)} ${r.year}`,
  }));
}
