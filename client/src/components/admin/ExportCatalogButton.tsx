import { useEffect, useRef, useState } from 'react';
import { HiOutlineArrowDownTray, HiChevronDown } from 'react-icons/hi2';

type Format = 'xlsx' | 'tsv';

const OPTIONS: { format: Format; title: string; hint: string }[] = [
  { format: 'xlsx', title: 'Excel (.xlsx)', hint: 'Товары + категории + лист для Google Merchant' },
  { format: 'tsv', title: 'Google Merchant (.tsv)', hint: 'Файл фида для загрузки в Merchant Center' },
];

export default function ExportCatalogButton({ className = '' }: { className?: string }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState<Format | null>(null);
  const [error, setError] = useState('');
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [open]);

  const download = async (format: Format) => {
    setOpen(false);
    setError('');
    setLoading(format);
    try {
      const token = localStorage.getItem('admin_token');
      const res = await fetch(`/api/export/catalog?format=${format}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error(res.status === 401 ? 'Сессия истекла, войдите заново' : 'Не удалось выгрузить');
      const blob = await res.blob();
      const date = new Date().toISOString().slice(0, 10);
      const name = format === 'tsv' ? `google-merchant-${date}.tsv` : `catalog-${date}.xlsx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = name;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setError(e?.message || 'Ошибка выгрузки');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div ref={ref} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={!!loading}
        className="flex items-center gap-1.5 text-sm text-[#1A1A1A] border border-[#E5E5E3] bg-white px-3 py-2.5 rounded-xl hover:border-[#1A1A1A] transition-colors disabled:opacity-60"
        title="Скачать все товары и категории"
      >
        <HiOutlineArrowDownTray className={`w-4 h-4 ${loading ? 'animate-bounce' : ''}`} />
        <span className="hidden sm:inline">{loading ? 'Выгрузка…' : 'Скачать всё'}</span>
        <HiChevronDown className="w-3.5 h-3.5 text-[#6B6B6B]" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-72 bg-white border border-[#E5E5E3] rounded-xl shadow-lg z-30 overflow-hidden">
          {OPTIONS.map((o) => (
            <button
              key={o.format}
              type="button"
              onClick={() => download(o.format)}
              className="w-full text-left px-4 py-3 hover:bg-[#F5F5F3] transition-colors"
            >
              <div className="text-sm font-medium text-[#1A1A1A]">{o.title}</div>
              <div className="text-xs text-[#6B6B6B] mt-0.5">{o.hint}</div>
            </button>
          ))}
        </div>
      )}
      {error && <div className="absolute right-0 mt-1 text-xs text-red-600 whitespace-nowrap">{error}</div>}
    </div>
  );
}
