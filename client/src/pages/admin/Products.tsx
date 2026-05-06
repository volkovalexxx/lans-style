import { useState, useEffect, useCallback, useRef } from 'react';
import api from '../../api/client';
import { AdminLayout } from './Dashboard';
import ColorPalette, { type ColorItem } from '../../components/admin/ColorPalette';
import Dropdown from '../../components/admin/Dropdown';
import FileUpload from '../../components/admin/FileUpload';
import {
  HiOutlinePencil, HiOutlineTrash, HiOutlinePlus, HiXMark,
  HiOutlineMagnifyingGlass, HiChevronLeft, HiChevronRight,
  HiArrowsRightLeft, HiArrowPath,
} from 'react-icons/hi2';
import ProductPicker from '../../components/admin/ProductPicker';

interface NbrbRates { usd: number; rub100: number; fetchedAt: number }
let ratesCache: NbrbRates | null = null;

// Returns the most recent scheduled fetch time (8:00 or 20:00 today/yesterday)
function lastScheduledMs(): number {
  const now = new Date();
  const t = (h: number, d = 0) => { const x = new Date(now); x.setDate(x.getDate() + d); x.setHours(h, 0, 0, 0); return x.getTime(); };
  if (now.getTime() >= t(20)) return t(20);
  if (now.getTime() >= t(8))  return t(8);
  return t(20, -1);
}

// Returns ms until the next scheduled fetch (8:00 or 20:00)
function msUntilNext(): number {
  const now = new Date();
  const t = (h: number, d = 0) => { const x = new Date(now); x.setDate(x.getDate() + d); x.setHours(h, 0, 0, 0); return x.getTime(); };
  if (now.getTime() < t(8))  return t(8)  - now.getTime();
  if (now.getTime() < t(20)) return t(20) - now.getTime();
  return t(8, 1) - now.getTime();
}

async function fetchNbrbRates(force = false): Promise<NbrbRates> {
  if (!force && ratesCache && ratesCache.fetchedAt >= lastScheduledMs()) return ratesCache;
  const [usdRes, rubRes] = await Promise.all([
    fetch('https://api.nbrb.by/exrates/rates/USD?parammode=2'),
    fetch('https://api.nbrb.by/exrates/rates/RUB?parammode=2'),
  ]);
  const usdData = await usdRes.json();
  const rubData = await rubRes.json();
  ratesCache = { usd: usdData.Cur_OfficialRate, rub100: rubData.Cur_OfficialRate, fetchedAt: Date.now() };
  return ratesCache;
}

function fmtAmt(n: number): string {
  if (!isFinite(n) || n <= 0) return '';
  const r = Math.round(n * 100) / 100;
  return Number.isInteger(r) ? String(r) : r.toFixed(2);
}

interface Product {
  id: number; slug: string; sku?: string | null;
  nameRu: string; nameEn: string;
  priceByn: string; priceUsd: string; priceRub: string;
  sizes: string[]; colors: string[]; labels: string[]; images: string[];
  inStock: boolean; isNew: boolean; categoryId: number;
  category?: { nameRu: string };
  isCostume?: boolean; costumeTopId?: number | null; costumeBottomId?: number | null;
}

interface Category { id: number; nameRu: string; }

function parseColors(colors: string[]): ColorItem[] {
  return colors.map((c) => {
    try { const p = JSON.parse(c); if (p.hex && p.name) return p; } catch {}
    return { hex: c, name: c };
  });
}
function serializeColors(colors: ColorItem[]): string[] {
  return colors.map((c) => JSON.stringify(c));
}

const PRESET_LABELS = ['NEW', 'SALE', 'HIT', 'TOP', '-10%', '-20%', '-30%', '-50%'];
const labelStyles: Record<string, string> = {
  NEW: 'bg-[#1A1A1A] text-white', SALE: 'bg-red-500 text-white',
  HIT: 'bg-[#C4A882] text-white', TOP: 'bg-purple-500 text-white',
};
function getLabelStyle(label: string) {
  if (label.startsWith('-') && label.endsWith('%')) return 'bg-red-500 text-white';
  return labelStyles[label] || 'bg-[#6B6B6B] text-white';
}

const PAGE_SIZE = 20;

const emptyProduct = {
  sku: '', nameRu: '', nameEn: '', descRu: '', descEn: '',
  priceByn: '', priceUsd: '', priceRub: '', sizes: '',
  inStock: true, isNew: false, categoryId: 0,
  labels: [] as string[], images: [] as string[],
  isCostume: false, costumeTopId: null as number | null, costumeBottomId: null as number | null,
};

function ImgWithSkeleton({ src, className }: { src: string; className: string }) {
  const [loaded, setLoaded] = useState(false);
  return (
    <div className={`relative bg-[#E8DDD0] overflow-hidden ${className}`}>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-[#E8DDD0]" />}
      <img
        src={src} alt="" loading="lazy" decoding="async"
        onLoad={() => setLoaded(true)}
        className={`w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
}

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const editFormRef = useRef<HTMLFormElement>(null);

  // Filters / sort / pagination
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [filterStock, setFilterStock] = useState('');
  const [sort, setSort] = useState('new');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const [editColors, setEditColors] = useState<ColorItem[]>([]);
  const [editLabels, setEditLabels] = useState<string[]>([]);
  const [customLabel, setCustomLabel] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryRu, setNewCategoryRu] = useState('');
  const [rates, setRates] = useState<NbrbRates | null>(ratesCache);
  const [ratesLoading, setRatesLoading] = useState(false);
  const [newCategoryEn, setNewCategoryEn] = useState('');

  const load = useCallback(async (resetPage = false) => {
    const p = resetPage ? 1 : page;
    if (resetPage) setPage(1);
    setLoading(true);
    const params: any = { limit: PAGE_SIZE, page: p };
    if (search.trim()) params.search = search.trim();
    if (filterCat) params.categoryId = filterCat;
    if (filterStock === 'in') params.inStock = 'true';
    if (sort === 'price_asc') params.sort = 'price_asc';
    else if (sort === 'price_desc') params.sort = 'price_desc';
    else if (sort === 'name') params.sort = 'name';
    const r = await api.get('/products', { params });
    setProducts(r.data.products);
    setTotal(r.data.total);
    setLoading(false);
  }, [page, search, filterCat, filterStock, sort]);

  // For costume dropdowns: load all non-costume products
  const loadAll = useCallback(async () => {
    const r = await api.get('/products', { params: { limit: 999 } });
    setAllProducts(r.data.products);
  }, []);

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data));
    loadAll();
  }, [loadAll]);

  // Fetch rates on mount + schedule at 8:00 and 20:00
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const doFetch = () => {
      fetchNbrbRates().then(setRates).catch(() => {});
    };

    const schedule = () => {
      const delay = msUntilNext();
      timer = setTimeout(() => { doFetch(); schedule(); }, delay);
    };

    doFetch();
    schedule();
    return () => clearTimeout(timer);
  }, []);

  const calcPrices = () => {
    if (!rates || !editing) return;
    const { usd: usdRate, rub100: rub100Rate } = rates;
    const bynPerRub = rub100Rate / 100;
    const hasByn = !!parseFloat(editing.priceByn);
    const hasUsd = !!parseFloat(editing.priceUsd);
    const hasRub = !!parseFloat(editing.priceRub);
    // Determine base: BYN first, then USD
    let byn = 0;
    if (hasByn) {
      byn = parseFloat(editing.priceByn);
    } else if (hasUsd) {
      byn = parseFloat(editing.priceUsd) * usdRate;
    } else {
      return; // nothing to calculate from
    }
    const usd = byn / usdRate;
    const rub = byn / bynPerRub;
    setEditing((prev: any) => ({
      ...prev,
      ...(!hasByn ? { priceByn: fmtAmt(byn) } : {}),
      ...(!hasUsd ? { priceUsd: fmtAmt(usd) } : {}),
      ...(!hasRub ? { priceRub: fmtAmt(rub) } : {}),
    }));
  };

  const refreshRates = async () => {
    setRatesLoading(true);
    try { const r = await fetchNbrbRates(true); setRates(r); } catch {}
    setRatesLoading(false);
  };

  useEffect(() => {
    const t = setTimeout(() => load(true), 250);
    return () => clearTimeout(t);
  }, [search, filterCat, filterStock, sort]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { load(); }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const startEdit = (product?: any) => {
    if (product) {
      setEditing({
        ...product,
        sizes: Array.isArray(product.sizes) ? product.sizes.join(', ') : product.sizes,
        isCostume: product.isCostume || false,
        costumeTopId: product.costumeTopId || null,
        costumeBottomId: product.costumeBottomId || null,
      });
      setEditColors(parseColors(product.colors || []));
      setEditLabels(product.labels || []);
    } else {
      setEditing({ ...emptyProduct });
      setEditColors([]);
      setEditLabels([]);
    }
    setCreatingCategory(false);
    setNewCategoryRu('');
    setNewCategoryEn('');
    setTimeout(() => editFormRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 50);
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditColors([]);
    setEditLabels([]);
    setImages([]);
    setCustomLabel('');
    setCreatingCategory(false);
  };

  const toggleLabel = (label: string) =>
    setEditLabels((prev) => prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]);

  const addCustomLabel = () => {
    const label = customLabel.trim().toUpperCase();
    if (label && !editLabels.includes(label)) setEditLabels([...editLabels, label]);
    setCustomLabel('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    let categoryId = Number(editing.categoryId);
    if (creatingCategory) {
      if (!newCategoryRu.trim() || !newCategoryEn.trim()) { alert('Заполните название новой категории на обоих языках'); return; }
      const res = await api.post('/categories', { nameRu: newCategoryRu.trim(), nameEn: newCategoryEn.trim() });
      categoryId = res.data.id;
      api.get('/categories').then((r) => setCategories(r.data));
    }
    if (!categoryId) { alert('Выберите категорию'); return; }

    const data: any = {
      sku: editing.sku?.trim() || null,
      nameRu: editing.nameRu, nameEn: editing.nameEn,
      descRu: editing.descRu, descEn: editing.descEn,
      priceByn: Number(editing.priceByn), priceUsd: Number(editing.priceUsd), priceRub: Number(editing.priceRub || 0),
      sizes: typeof editing.sizes === 'string'
        ? editing.sizes.split(',').map((s: string) => s.trim()).filter(Boolean)
        : editing.sizes,
      colors: serializeColors(editColors),
      labels: editLabels,
      inStock: editing.inStock,
      isNew: editLabels.includes('NEW'),
      categoryId,
      images: editing.images || [],
      isCostume: editing.isCostume || false,
      costumeTopId: editing.isCostume ? (editing.costumeTopId ? Number(editing.costumeTopId) : null) : null,
      costumeBottomId: editing.isCostume ? (editing.costumeBottomId ? Number(editing.costumeBottomId) : null) : null,
    };

    if (images.length > 0) {
      const formData = new FormData();
      images.forEach((f) => formData.append('images', f));
      const uploadRes = await api.post('/upload/multiple', formData);
      data.images = [...(data.images || []), ...uploadRes.data.urls];
    }

    if (editing.id) await api.put(`/products/${editing.id}`, data);
    else await api.post('/products', data);

    cancelEdit();
    load();
    loadAll();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить товар?')) return;
    await api.delete(`/products/${id}`);
    load();
    loadAll();
  };

  const inputClass = 'w-full border border-[#E5E5E3] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C4A882] transition-colors';

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-4 py-3"><div className="w-10 h-12 bg-[#E8DDD0] rounded-lg" /></td>
      <td className="px-4 py-3"><div className="h-3 bg-[#E8DDD0] rounded w-40 mb-1" /><div className="h-2.5 bg-[#E8DDD0] rounded w-20" /></td>
      <td className="px-4 py-3"><div className="h-3 bg-[#E8DDD0] rounded w-24" /></td>
      <td className="px-4 py-3"><div className="h-3 bg-[#E8DDD0] rounded w-16" /></td>
      <td className="px-4 py-3"><div className="flex gap-1">{[0,1,2].map(i=><div key={i} className="w-5 h-5 rounded-full bg-[#E8DDD0]" />)}</div></td>
      <td className="px-4 py-3"><div className="h-3 bg-[#E8DDD0] rounded w-10" /></td>
      <td className="px-4 py-3 text-right"><div className="h-3 bg-[#E8DDD0] rounded w-20 ml-auto" /></td>
    </tr>
  );

  return (
    <AdminLayout>
      {/* Header row */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <h1 className="text-xl sm:text-2xl font-semibold">Товары</h1>
        <span className="text-sm text-[#6B6B6B]">{total > 0 && `${total} шт.`}</span>
        <button
          onClick={() => startEdit()}
          className="ml-auto flex items-center gap-1.5 bg-[#1A1A1A] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#333] transition-colors"
        >
          <HiOutlinePlus className="w-4 h-4" />
          <span className="hidden sm:inline">Добавить</span>
        </button>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap gap-3 mb-5">
        {/* Search */}
        <div className="relative flex-1 min-w-[180px] max-w-xs">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Название или артикул..."
            className="w-full border border-[#E5E5E3] rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:border-[#C4A882] bg-white"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#1A1A1A]">
              <HiXMark className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category filter */}
        <select
          value={filterCat}
          onChange={(e) => setFilterCat(e.target.value)}
          className="border border-[#E5E5E3] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4A882] bg-white"
        >
          <option value="">Все категории</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.nameRu}</option>)}
        </select>

        {/* Stock filter */}
        <select
          value={filterStock}
          onChange={(e) => setFilterStock(e.target.value)}
          className="border border-[#E5E5E3] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4A882] bg-white"
        >
          <option value="">Все</option>
          <option value="in">В наличии</option>
        </select>

        {/* Sort */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="border border-[#E5E5E3] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4A882] bg-white"
        >
          <option value="new">Сначала новые</option>
          <option value="name">По названию</option>
          <option value="price_asc">Дешевле</option>
          <option value="price_desc">Дороже</option>
        </select>
      </div>

      {/* Edit form */}
      {editing && (
        <form ref={editFormRef} onSubmit={handleSave} className="bg-white p-4 sm:p-6 rounded-2xl mb-6 space-y-5 border border-[#E5E5E3]">
          <h3 className="font-medium text-lg">{editing.id ? 'Редактировать товар' : 'Новый товар'}</h3>

          <div>
            <label className="text-xs text-[#6B6B6B] mb-1 block">Артикул</label>
            <input value={editing.sku || ''} onChange={(e) => setEditing({ ...editing, sku: e.target.value })}
              placeholder="Необязательно, например: LS-0042" className={`${inputClass} sm:max-w-xs`} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#6B6B6B] mb-1 block">Название (RU) *</label>
              <input value={editing.nameRu} onChange={(e) => setEditing({ ...editing, nameRu: e.target.value })} className={inputClass} required />
            </div>
            <div>
              <label className="text-xs text-[#6B6B6B] mb-1 block">Name (EN) *</label>
              <input value={editing.nameEn} onChange={(e) => setEditing({ ...editing, nameEn: e.target.value })} className={inputClass} required />
            </div>
            <div>
              <label className="text-xs text-[#6B6B6B] mb-1 block">Категория *</label>
              <Dropdown
                value={creatingCategory ? '' : editing.categoryId}
                onChange={(v) => { setEditing({ ...editing, categoryId: v }); setCreatingCategory(false); }}
                options={categories.map((c) => ({ value: c.id, label: c.nameRu }))}
                placeholder="Выберите категорию"
                required
                extraAction={{
                  label: 'Новая категория',
                  onClick: () => { setCreatingCategory(true); setEditing({ ...editing, categoryId: 0 }); },
                  isActive: creatingCategory,
                }}
              />
            </div>
            <div>
              <label className="text-xs text-[#6B6B6B] mb-1 block">Размеры (через запятую)</label>
              <input placeholder="42, 44, 46, 48, 50" value={editing.sizes} onChange={(e) => setEditing({ ...editing, sizes: e.target.value })} className={inputClass} />
            </div>
          </div>

          {/* Costume checkbox — only after category is chosen */}
          {(editing.categoryId || creatingCategory) && (
            <div>
              <label className="inline-flex items-center gap-2.5 text-sm cursor-pointer select-none group">
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${editing.isCostume ? 'bg-[#7C5C9A] border-[#7C5C9A]' : 'border-[#E5E5E3] group-hover:border-[#7C5C9A]'}`}>
                  {editing.isCostume && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  )}
                </div>
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={editing.isCostume || false}
                  onChange={(e) => setEditing({ ...editing, isCostume: e.target.checked, costumeTopId: null, costumeBottomId: null })}
                />
                <span className="font-medium">Это костюм / набор</span>
                <span className="text-[#6B6B6B] font-normal text-xs">(два товара продаются как комплект)</span>
              </label>
            </div>
          )}

          {editing.isCostume && (
            <div className="bg-gradient-to-br from-[#F8F5FC] to-[#F0EBF8] border border-[#D4BFEF] rounded-2xl p-4 space-y-4">
              <p className="text-sm font-medium text-[#7C5C9A]">Состав костюма</p>
              <p className="text-xs text-[#6B6B6B]">Укажите товары, которые входят в этот комплект. Покупатель сможет купить каждую позицию отдельно или весь костюм сразу.</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-[#6B6B6B] mb-1.5 block">Верх (товар)</label>
                  <ProductPicker
                    value={editing.costumeTopId}
                    onChange={(id) => setEditing({ ...editing, costumeTopId: id })}
                    products={allProducts.filter((p) => p.id !== editing.id && !p.isCostume)}
                    placeholder="— выберите товар —"
                  />
                </div>
                <div>
                  <label className="text-xs text-[#6B6B6B] mb-1.5 block">Низ (товар)</label>
                  <ProductPicker
                    value={editing.costumeBottomId}
                    onChange={(id) => setEditing({ ...editing, costumeBottomId: id })}
                    products={allProducts.filter((p) => p.id !== editing.id && !p.isCostume)}
                    placeholder="— выберите товар —"
                  />
                </div>
              </div>
              <p className="text-xs text-[#6B6B6B]">Цена костюма (поле «Цена» ниже) — это цена за весь комплект. Если меньше суммы отдельных позиций, покупатель увидит выгоду.</p>
            </div>
          )}

          {creatingCategory && (
            <div className="bg-gradient-to-br from-[#FAFAF8] to-[#F5F0EB] border border-[#E5E5E3] rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <HiOutlinePlus className="w-4 h-4 text-[#C4A882]" />
                <p className="text-sm font-medium">Новая категория</p>
                <button type="button" onClick={() => { setCreatingCategory(false); setNewCategoryRu(''); setNewCategoryEn(''); }} className="ml-auto text-xs text-[#6B6B6B] hover:text-[#1A1A1A]">
                  <HiXMark className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#6B6B6B] mb-1 block">Название (RU) *</label>
                  <input value={newCategoryRu} onChange={(e) => setNewCategoryRu(e.target.value)} placeholder="Например: Платья" className={inputClass} autoFocus />
                </div>
                <div>
                  <label className="text-xs text-[#6B6B6B] mb-1 block">Name (EN) *</label>
                  <input value={newCategoryEn} onChange={(e) => setNewCategoryEn(e.target.value)} placeholder="E.g.: Dresses" className={inputClass} />
                </div>
              </div>
              <p className="text-xs text-[#6B6B6B]">Категория будет создана при сохранении товара.</p>
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-[#6B6B6B]">Цены</label>
              <div className="flex items-center gap-2">
                {rates && (
                  <span className="text-[11px] text-[#6B6B6B]">
                    НБ РБ: 1$ = {rates.usd.toFixed(4)} BYN · 100₽ = {rates.rub100.toFixed(4)} BYN
                  </span>
                )}
                <button
                  type="button"
                  onClick={refreshRates}
                  title="Обновить курс НБ РБ"
                  className="flex items-center gap-1 text-[11px] text-[#C4A882] hover:text-[#A68E6A] transition-colors"
                >
                  <HiArrowPath className={`w-3.5 h-3.5 ${ratesLoading ? 'animate-spin' : ''}`} />
                  {rates ? 'Обновить' : 'Загрузить курс'}
                </button>
              </div>
            </div>
            <div className="flex gap-2 items-start">
              <div className="relative flex-1">
                <input type="number" step="0.01" placeholder="0.00" value={editing.priceByn}
                  onChange={(e) => setEditing({ ...editing, priceByn: e.target.value })}
                  className={`${inputClass} pr-12`} required />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#6B6B6B] font-medium">BYN</span>
              </div>
              <div className="relative flex-1">
                <input type="number" step="0.01" placeholder="0.00" value={editing.priceUsd}
                  onChange={(e) => setEditing({ ...editing, priceUsd: e.target.value })}
                  className={`${inputClass} pr-8`} required />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#6B6B6B] font-medium">$</span>
              </div>
              <div className="relative flex-1">
                <input type="number" step="0.01" placeholder="0" value={editing.priceRub || ''}
                  onChange={(e) => setEditing({ ...editing, priceRub: e.target.value })}
                  className={`${inputClass} pr-8`} />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#6B6B6B] font-medium">₽</span>
              </div>
              <button
                type="button"
                onClick={calcPrices}
                disabled={!rates || (!editing.priceByn && !editing.priceUsd)}
                title={rates ? 'Рассчитать пустые поля по курсу НБ РБ' : 'Курс не загружен'}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#E5E5E3] text-sm hover:border-[#C4A882] hover:text-[#C4A882] transition-colors disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0"
              >
                <HiArrowsRightLeft className="w-4 h-4" />
                Рассчитать
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#6B6B6B] mb-1 block">Описание (RU)</label>
              <textarea value={editing.descRu || ''} onChange={(e) => setEditing({ ...editing, descRu: e.target.value })} className={`${inputClass} resize-none`} rows={3} />
            </div>
            <div>
              <label className="text-xs text-[#6B6B6B] mb-1 block">Description (EN)</label>
              <textarea value={editing.descEn || ''} onChange={(e) => setEditing({ ...editing, descEn: e.target.value })} className={`${inputClass} resize-none`} rows={3} />
            </div>
          </div>

          <ColorPalette colors={editColors} onChange={setEditColors} />

          <div>
            <p className="text-sm font-medium mb-2">Метки</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_LABELS.map((label) => (
                <button key={label} type="button" onClick={() => toggleLabel(label)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${editLabels.includes(label) ? getLabelStyle(label) : 'bg-gray-100 text-[#6B6B6B] hover:bg-gray-200'}`}>
                  {label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {editLabels.filter((l) => !PRESET_LABELS.includes(l)).map((label) => (
                <span key={label} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[#6B6B6B] text-white font-medium">
                  {label}
                  <button type="button" onClick={() => toggleLabel(label)}><HiXMark className="w-3 h-3" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input type="text" value={customLabel} onChange={(e) => setCustomLabel(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomLabel(); } }}
                placeholder="Своя метка..." className="border border-[#E5E5E3] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#C4A882] w-40" />
              <button type="button" onClick={addCustomLabel} disabled={!customLabel.trim()}
                className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-30">
                Добавить
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={editing.inStock} onChange={(e) => setEditing({ ...editing, inStock: e.target.checked })} className="rounded" />
              В наличии
            </label>
          </div>

          <div>
            <p className="text-sm font-medium mb-2">Фотографии</p>
            {editing.images?.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3">
                {editing.images.map((img: string, i: number) => (
                  <div key={i} className="relative group">
                    <ImgWithSkeleton src={img} className="w-16 h-20 rounded-lg border border-[#E5E5E3]" />
                    <button type="button"
                      onClick={() => setEditing({ ...editing, images: editing.images.filter((_: string, j: number) => j !== i) })}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                      <HiXMark className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
            <FileUpload files={images} onChange={setImages} />
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" className="bg-[#1A1A1A] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-[#333] transition-colors">Сохранить</button>
            <button type="button" onClick={cancelEdit} className="border border-[#E5E5E3] px-6 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">Отмена</button>
          </div>
        </form>
      )}

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {loading ? (
          Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-4 border border-[#E5E5E3] animate-pulse">
              <div className="flex gap-3">
                <div className="w-16 h-20 bg-[#E8DDD0] rounded-lg flex-shrink-0" />
                <div className="flex-1 space-y-2 pt-1">
                  <div className="h-3 bg-[#E8DDD0] rounded w-3/4" />
                  <div className="h-2.5 bg-[#E8DDD0] rounded w-1/2" />
                  <div className="h-3 bg-[#E8DDD0] rounded w-1/3" />
                </div>
              </div>
            </div>
          ))
        ) : products.map((p) => {
          const colors = parseColors(p.colors || []);
          const labels = p.labels || (p.isNew ? ['NEW'] : []);
          return (
            <div key={p.id} className="bg-white rounded-2xl p-4 border border-[#E5E5E3]">
              <div className="flex gap-3">
                {p.images[0]
                  ? <ImgWithSkeleton src={p.images[0]} className="w-16 h-20 rounded-lg flex-shrink-0" />
                  : <div className="w-16 h-20 bg-[#F5F0EB] rounded-lg flex items-center justify-center text-xs text-[#C4A882] flex-shrink-0">LS</div>
                }
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-medium text-sm truncate">{p.nameRu}</p>
                    {p.isCostume && <span className="flex-shrink-0 text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-[#7C5C9A] text-white">КОСТЮМ</span>}
                  </div>
                  <p className="text-xs text-[#6B6B6B]">{p.category?.nameRu}{p.sku && <span className="ml-1.5 font-mono">· {p.sku}</span>}</p>
                  <p className="text-sm font-semibold mt-1">{p.priceByn} BYN</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {labels.map((label) => <span key={label} className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${getLabelStyle(label)}`}>{label}</span>)}
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${p.inStock ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>{p.inStock ? 'В наличии' : 'Нет'}</span>
                  </div>
                  {colors.length > 0 && (
                    <div className="flex gap-1 mt-1.5">
                      {colors.map((c, i) => <span key={i} className="w-4 h-4 rounded-full border border-[#E5E5E3]" style={{ backgroundColor: c.hex }} />)}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-3 mt-3 pt-3 border-t border-[#E5E5E3]">
                <button onClick={() => startEdit(p)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium text-[#C4A882] bg-[#F5F0EB] hover:bg-[#EDE5D8] transition-colors">
                  <HiOutlinePencil className="w-3.5 h-3.5" /> Редактировать
                </button>
                <button onClick={() => handleDelete(p.id)} className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 transition-colors">
                  <HiOutlineTrash className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-2xl overflow-hidden border border-[#E5E5E3]">
        <table className="w-full text-sm">
          <thead className="bg-gray-50/80">
            <tr>
              <th className="text-left px-4 py-3.5 font-medium text-[#6B6B6B]">Фото</th>
              <th className="text-left px-4 py-3.5 font-medium text-[#6B6B6B]">Название</th>
              <th className="text-left px-4 py-3.5 font-medium text-[#6B6B6B]">Категория</th>
              <th className="text-left px-4 py-3.5 font-medium text-[#6B6B6B]">Цена</th>
              <th className="text-left px-4 py-3.5 font-medium text-[#6B6B6B]">Цвета</th>
              <th className="text-left px-4 py-3.5 font-medium text-[#6B6B6B]">Метки</th>
              <th className="text-right px-4 py-3.5 font-medium text-[#6B6B6B]">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E3]">
            {loading
              ? Array.from({ length: 8 }).map((_, i) => <SkeletonRow key={i} />)
              : products.map((p) => {
                const colors = parseColors(p.colors || []);
                const labels = p.labels || (p.isNew ? ['NEW'] : []);
                return (
                  <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      {p.images[0]
                        ? <ImgWithSkeleton src={p.images[0]} className="w-10 h-12 rounded-lg" />
                        : <div className="w-10 h-12 bg-[#F5F0EB] rounded-lg flex items-center justify-center text-xs text-[#C4A882]">LS</div>
                      }
                    </td>
                    <td className="px-4 py-3 font-medium">
                      <div className="flex items-center gap-1.5">
                        {p.nameRu}
                        {p.isCostume && <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium bg-[#7C5C9A] text-white">КОСТЮМ</span>}
                      </div>
                      {p.sku && <div className="text-[11px] font-mono text-[#6B6B6B] font-normal">{p.sku}</div>}
                    </td>
                    <td className="px-4 py-3 text-[#6B6B6B]">{p.category?.nameRu}</td>
                    <td className="px-4 py-3">
                      <div>{p.priceByn} BYN</div>
                      <div className="text-xs text-[#6B6B6B]">${p.priceUsd} / {p.priceRub || 0} ₽</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        {colors.map((c, i) => <span key={i} className="w-5 h-5 rounded-full border border-[#E5E5E3]" style={{ backgroundColor: c.hex }} title={c.name} />)}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {labels.map((label) => <span key={label} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getLabelStyle(label)}`}>{label}</span>)}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${p.inStock ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                          {p.inStock ? 'В наличии' : 'Нет'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => startEdit(p)} className="text-[#C4A882] hover:underline mr-3">Ред.</button>
                      <button onClick={() => handleDelete(p.id)} className="text-red-500 hover:underline">Удалить</button>
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
        <div className="flex items-center justify-between mt-5">
          <p className="text-sm text-[#6B6B6B]">Стр. {page} из {totalPages}</p>
          <div className="flex items-center gap-1">
            <button
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
              className="p-2 rounded-lg border border-[#E5E5E3] hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <HiChevronLeft className="w-4 h-4" />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let n: number;
              if (totalPages <= 7) n = i + 1;
              else if (page <= 4) n = i + 1;
              else if (page >= totalPages - 3) n = totalPages - 6 + i;
              else n = page - 3 + i;
              return (
                <button
                  key={n}
                  onClick={() => setPage(n)}
                  className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${n === page ? 'bg-[#1A1A1A] text-white' : 'border border-[#E5E5E3] hover:bg-gray-50'}`}
                >
                  {n}
                </button>
              );
            })}
            <button
              disabled={page === totalPages}
              onClick={() => setPage(page + 1)}
              className="p-2 rounded-lg border border-[#E5E5E3] hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              <HiChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
