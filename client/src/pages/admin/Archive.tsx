import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { AdminLayout } from './Dashboard';
import {
  HiOutlineTrash, HiOutlineArrowUturnLeft, HiOutlineMagnifyingGlass,
  HiXMark, HiChevronLeft, HiChevronRight, HiOutlineArchiveBox,
} from 'react-icons/hi2';

interface Product {
  id: number; slug: string; sku?: string | null;
  nameRu: string; priceByn: string; images: string[];
  inStock: boolean; category?: { nameRu: string };
  isCostume?: boolean;
}

const PAGE_SIZE = 20;

function ImgWithSkeleton({ src, className }: { src: string; className: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={`relative bg-[#E8DDD0] overflow-hidden ${className}`}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-[#E8DDD0]" />}
      <img src={src} alt="" loading="lazy" decoding="async" onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  );
}

export default function AdminArchive() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const load = useCallback(async (resetPage = false) => {
    const p = resetPage ? 1 : page;
    if (resetPage) setPage(1);
    setLoading(true);
    const params: any = { limit: PAGE_SIZE, page: p, archived: 'true' };
    if (search.trim()) params.search = search.trim();
    const r = await api.get('/products', { params });
    setProducts(r.data.products);
    setTotal(r.data.total);
    setLoading(false);
  }, [page, search]);

  useEffect(() => {
    const t = setTimeout(() => load(true), 250);
    return () => clearTimeout(t);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const selectAll = () => {
    if (selectedIds.size === products.length) setSelectedIds(new Set());
    else setSelectedIds(new Set(products.map((p) => p.id)));
  };
  const clearSelection = () => setSelectedIds(new Set());

  const bulkAction = async (action: 'unarchive' | 'delete') => {
    if (!selectedIds.size) return;
    if (action === 'delete' && !confirm(`Удалить ${selectedIds.size} товар(ов) навсегда?`)) return;
    setBulkLoading(true);
    try {
      await api.post('/products/bulk', { ids: Array.from(selectedIds), action });
      clearSelection();
      load(true);
    } finally {
      setBulkLoading(false);
    }
  };

  const restoreOne = async (id: number) => {
    await api.post('/products/bulk', { ids: [id], action: 'unarchive' });
    load();
  };

  const deleteOne = async (id: number) => {
    if (!confirm('Удалить товар навсегда?')) return;
    await api.post('/products/bulk', { ids: [id], action: 'delete' });
    load();
  };

  return (
    <AdminLayout>
      {/* Header */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <HiOutlineArchiveBox className="w-6 h-6 text-[#6B6B6B]" />
        <h1 className="text-xl sm:text-2xl font-semibold">Архив</h1>
        <span className="text-sm text-[#6B6B6B]">{total > 0 && `${total} шт.`}</span>
        <Link
          to="/lansadmin/products"
          className="ml-auto text-sm text-[#6B6B6B] hover:text-[#1A1A1A] border border-[#E5E5E3] px-3 py-2 rounded-xl transition-colors"
        >
          ← Товары
        </Link>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4 bg-[#F5F0EB] border border-[#E5E5E3] rounded-2xl px-4 py-3">
          <span className="text-sm font-medium">Выбрано: {selectedIds.size}</span>
          <div className="flex gap-2 ml-auto">
            <button onClick={() => bulkAction('unarchive')} disabled={bulkLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-[#1A1A1A] text-white hover:bg-[#333] disabled:opacity-50 transition-colors">
              <HiOutlineArrowUturnLeft className="w-4 h-4" />
              Вернуть
            </button>
            <button onClick={() => bulkAction('delete')} disabled={bulkLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors">
              <HiOutlineTrash className="w-4 h-4" />
              Удалить
            </button>
            <button onClick={clearSelection} className="px-4 py-2 rounded-xl text-sm border border-[#E5E5E3] hover:bg-white transition-colors">Отмена</button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск в архиве..."
            className="w-full border border-[#E5E5E3] rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:border-[#C4A882] bg-white" />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#1A1A1A]">
              <HiXMark className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Empty state */}
      {!loading && products.length === 0 && (
        <div className="text-center py-16 text-[#6B6B6B]">
          <HiOutlineArchiveBox className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="text-sm">Архив пуст</p>
        </div>
      )}

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {loading
          ? Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="bg-white rounded-2xl p-4 border border-[#E5E5E3] animate-pulse">
                <div className="flex gap-3">
                  <div className="w-16 h-20 bg-[#E8DDD0] rounded-lg flex-shrink-0" />
                  <div className="flex-1 space-y-2 pt-1">
                    <div className="h-3 bg-[#E8DDD0] rounded w-3/4" />
                    <div className="h-2.5 bg-[#E8DDD0] rounded w-1/2" />
                  </div>
                </div>
              </div>
            ))
          : products.map((p) => {
              const isSelected = selectedIds.has(p.id);
              return (
                <div key={p.id} className={`bg-white rounded-2xl p-4 border transition-colors ${isSelected ? 'border-[#C4A882] bg-[#FDFAF7]' : 'border-[#E5E5E3]'}`}>
                  <div className="flex gap-3">
                    <div className="flex-shrink-0 pt-1">
                      <button type="button" onClick={() => toggleSelect(p.id)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-[#C4A882] border-[#C4A882]' : 'border-[#D1D5DB]'}`}>
                        {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </button>
                    </div>
                    {p.images[0]
                      ? <ImgWithSkeleton src={p.images[0]} className="w-16 h-20 rounded-lg flex-shrink-0 opacity-60" />
                      : <div className="w-16 h-20 bg-[#F5F0EB] rounded-lg flex items-center justify-center text-xs text-[#C4A882] flex-shrink-0">LS</div>
                    }
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate text-[#6B6B6B]">{p.nameRu}</p>
                      <p className="text-xs text-[#6B6B6B]">{p.category?.nameRu}{p.sku && <span className="ml-1.5 font-mono">· {p.sku}</span>}</p>
                      <p className="text-sm font-semibold mt-1">{p.priceByn} BYN</p>
                    </div>
                  </div>
                  <div className="flex gap-3 mt-3 pt-3 border-t border-[#E5E5E3]">
                    <button onClick={() => restoreOne(p.id)}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium text-[#1A1A1A] bg-[#F5F0EB] hover:bg-[#EDE5D8] transition-colors">
                      <HiOutlineArrowUturnLeft className="w-3.5 h-3.5" /> Вернуть
                    </button>
                    <button onClick={() => deleteOne(p.id)}
                      className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 transition-colors">
                      <HiOutlineTrash className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
        }
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-2xl overflow-hidden border border-[#E5E5E3]">
        <table className="w-full text-sm">
          <thead className="bg-gray-50/80">
            <tr>
              <th className="text-left px-4 py-3.5 font-medium text-[#6B6B6B] w-10">
                <button type="button" onClick={selectAll}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selectedIds.size === products.length && products.length > 0 ? 'bg-[#C4A882] border-[#C4A882]' : 'border-[#D1D5DB]'}`}>
                  {selectedIds.size === products.length && products.length > 0 && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  )}
                  {selectedIds.size > 0 && selectedIds.size < products.length && (
                    <div className="w-2 h-0.5 bg-[#C4A882]" />
                  )}
                </button>
              </th>
              <th className="text-left px-4 py-3.5 font-medium text-[#6B6B6B]">Фото</th>
              <th className="text-left px-4 py-3.5 font-medium text-[#6B6B6B]">Название</th>
              <th className="text-left px-4 py-3.5 font-medium text-[#6B6B6B]">Категория</th>
              <th className="text-left px-4 py-3.5 font-medium text-[#6B6B6B]">Цена</th>
              <th className="text-right px-4 py-3.5 font-medium text-[#6B6B6B]">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E3]">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-3"><div className="w-4 h-4 bg-[#E8DDD0] rounded" /></td>
                    <td className="px-4 py-3"><div className="w-10 h-12 bg-[#E8DDD0] rounded-lg" /></td>
                    <td className="px-4 py-3"><div className="h-3 bg-[#E8DDD0] rounded w-40" /></td>
                    <td className="px-4 py-3"><div className="h-3 bg-[#E8DDD0] rounded w-24" /></td>
                    <td className="px-4 py-3"><div className="h-3 bg-[#E8DDD0] rounded w-16" /></td>
                    <td className="px-4 py-3"><div className="h-3 bg-[#E8DDD0] rounded w-20 ml-auto" /></td>
                  </tr>
                ))
              : products.map((p) => {
                  const isSelected = selectedIds.has(p.id);
                  return (
                    <tr key={p.id} className={`transition-colors ${isSelected ? 'bg-[#FDFAF7]' : 'hover:bg-gray-50/50'}`}>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => toggleSelect(p.id)}
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-[#C4A882] border-[#C4A882]' : 'border-[#D1D5DB]'}`}>
                          {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        {p.images[0]
                          ? <ImgWithSkeleton src={p.images[0]} className="w-10 h-12 rounded-lg opacity-60" />
                          : <div className="w-10 h-12 bg-[#F5F0EB] rounded-lg flex items-center justify-center text-xs text-[#C4A882]">LS</div>
                        }
                      </td>
                      <td className="px-4 py-3 font-medium text-[#6B6B6B]">
                        {p.nameRu}
                        {p.sku && <div className="text-[11px] font-mono font-normal">{p.sku}</div>}
                      </td>
                      <td className="px-4 py-3 text-[#6B6B6B]">{p.category?.nameRu}</td>
                      <td className="px-4 py-3 text-[#6B6B6B]">{p.priceByn} BYN</td>
                      <td className="px-4 py-3 text-right whitespace-nowrap">
                        <button onClick={() => restoreOne(p.id)} className="text-[#1A1A1A] hover:underline mr-3">Вернуть</button>
                        <button onClick={() => deleteOne(p.id)} className="text-red-500 hover:underline">Удалить</button>
                      </td>
                    </tr>
                  );
                })
            }
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex flex-col items-center gap-2 mt-5">
          <p className="text-sm text-[#6B6B6B]">Стр. {page} из {totalPages}</p>
          <div className="flex items-center gap-1">
            <button disabled={page === 1} onClick={() => setPage(page - 1)}
              className="p-2 rounded-lg border border-[#E5E5E3] hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <HiChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let n: number;
              if (totalPages <= 5) n = i + 1;
              else if (page <= 3) n = i + 1;
              else if (page >= totalPages - 2) n = totalPages - 4 + i;
              else n = page - 2 + i;
              return (
                <button key={n} onClick={() => setPage(n)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${n === page ? 'bg-[#1A1A1A] text-white' : 'border border-[#E5E5E3] hover:bg-gray-50'}`}>
                  {n}
                </button>
              );
            })}
            <button disabled={page === totalPages} onClick={() => setPage(page + 1)}
              className="p-2 rounded-lg border border-[#E5E5E3] hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
              <HiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
