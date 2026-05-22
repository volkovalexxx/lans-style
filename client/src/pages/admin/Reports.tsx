import { useState, useEffect } from 'react';
import { AdminLayout } from './Dashboard';
import api from '../../api/client';
import { HiOutlineDocumentArrowDown, HiArrowPath, HiOutlineDocumentText } from 'react-icons/hi2';

interface Month { year: number; month: number; label: string }
interface Report { id: number; year: number; month: number; filePath: string; createdAt: string }

const MONTHS_RU = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];

function monthLabel(year: number, month: number) {
  return `${MONTHS_RU[month - 1]} ${year}`;
}

export default function AdminReports() {
  const [months, setMonths] = useState<Month[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth() + 1);
  const [generating, setGenerating] = useState(false);
  const [notice, setNotice] = useState('');
  const [loadingReports, setLoadingReports] = useState(true);

  const now = new Date();
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;
  const prevMonth = curMonth === 1 ? 12 : curMonth - 1;
  const prevYear = curMonth === 1 ? curYear - 1 : curYear;

  useEffect(() => {
    api.get('/reports/months').then((r) => setMonths(r.data)).catch(() => {});
    loadReports();
  }, []);

  const loadReports = () => {
    setLoadingReports(true);
    api.get('/reports').then((r) => { setReports(r.data); setLoadingReports(false); }).catch(() => setLoadingReports(false));
  };

  const generate = async () => {
    setGenerating(true);
    setNotice('');
    try {
      const { data } = await api.post('/reports/generate', { year: selectedYear, month: selectedMonth });
      setNotice(`✅ Отчёт сформирован и отправлен в Telegram`);
      loadReports();
      // Auto-download
      downloadReport(data.id, selectedYear, selectedMonth);
    } catch {
      setNotice('❌ Ошибка при формировании отчёта');
    } finally {
      setGenerating(false);
    }
  };

  const downloadReport = (id: number, year: number, month: number) => {
    const token = localStorage.getItem('admin_token');
    const a = document.createElement('a');
    a.href = `/api/reports/${id}/download`;
    a.download = `Отчёт_${monthLabel(year, month)}.xlsx`;
    // Use fetch with auth header for download
    fetch(`/api/reports/${id}/download`, { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => res.blob())
      .then((blob) => {
        const url = URL.createObjectURL(blob);
        a.href = url;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
  };

  // Build month options: current + prev + months with done orders
  const options: Array<{ year: number; month: number; label: string }> = [];
  const addOption = (y: number, m: number) => {
    if (!options.find((o) => o.year === y && o.month === m)) {
      options.push({ year: y, month: m, label: monthLabel(y, m) });
    }
  };
  addOption(curYear, curMonth);
  addOption(prevYear, prevMonth);
  months.forEach((m) => addOption(m.year, m.month));

  return (
    <AdminLayout>
      <h1 className="text-xl sm:text-2xl font-semibold mb-6">Отчёты</h1>

      {/* Generate block */}
      <div className="bg-white border border-[#E5E5E3] rounded-2xl p-5 sm:p-6 mb-6">
        <h2 className="font-medium mb-4">Сформировать отчёт</h2>

        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="text-xs text-[#6B6B6B] mb-1 block">Период</label>
            <select
              value={`${selectedYear}:${selectedMonth}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split(':').map(Number);
                setSelectedYear(y); setSelectedMonth(m);
              }}
              className="border border-[#E5E5E3] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4A882] bg-white min-w-[200px]"
            >
              {options.map((o) => (
                <option key={`${o.year}:${o.month}`} value={`${o.year}:${o.month}`}>
                  {o.label}
                  {o.year === curYear && o.month === curMonth ? ' (текущий)' : ''}
                  {o.year === prevYear && o.month === prevMonth && !(o.year === curYear && o.month === curMonth) ? ' (прошлый)' : ''}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={generate}
            disabled={generating}
            className="flex items-center gap-2 bg-[#1A1A1A] text-white px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-[#333] disabled:opacity-50 transition-colors"
          >
            {generating
              ? <><HiArrowPath className="w-4 h-4 animate-spin" /> Формирую...</>
              : <><HiOutlineDocumentArrowDown className="w-4 h-4" /> Сформировать и скачать</>
            }
          </button>
        </div>

        {notice && (
          <p className={`mt-3 text-sm ${notice.startsWith('✅') ? 'text-green-600' : 'text-red-500'}`}>
            {notice}
          </p>
        )}

        <p className="text-xs text-[#6B6B6B] mt-3">
          Отчёт включает все заказы со статусом «Выполнен» за выбранный месяц.<br/>
          После формирования файл автоматически отправляется в Telegram и сохраняется на сервере.
        </p>
      </div>

      {/* Saved reports */}
      <div className="bg-white border border-[#E5E5E3] rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#E5E5E3]">
          <h2 className="font-medium">Сохранённые отчёты</h2>
        </div>

        {loadingReports ? (
          <div className="p-6 space-y-3">
            {[1,2,3].map((i) => <div key={i} className="h-10 bg-[#F5F0EB] rounded-xl animate-pulse" />)}
          </div>
        ) : reports.length === 0 ? (
          <div className="p-8 text-center text-[#6B6B6B] text-sm">
            <HiOutlineDocumentText className="w-10 h-10 mx-auto mb-3 opacity-30" />
            Отчётов пока нет
          </div>
        ) : (
          <div className="divide-y divide-[#E5E5E3]">
            {reports.map((r) => (
              <div key={r.id} className="flex items-center justify-between px-5 py-3.5 hover:bg-gray-50/50 transition-colors">
                <div>
                  <p className="font-medium text-sm">{monthLabel(r.year, r.month)}</p>
                  <p className="text-xs text-[#6B6B6B] mt-0.5">
                    Сформирован {new Date(r.createdAt).toLocaleString('ru-RU', { dateStyle: 'short', timeStyle: 'short' })}
                  </p>
                </div>
                <button
                  onClick={() => downloadReport(r.id, r.year, r.month)}
                  className="flex items-center gap-1.5 text-sm text-[#C4A882] hover:text-[#A68E6A] font-medium transition-colors"
                >
                  <HiOutlineDocumentArrowDown className="w-4 h-4" />
                  Скачать
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
