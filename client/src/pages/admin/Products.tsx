import { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client';
import { AdminLayout } from './Dashboard';
import ColorPalette, { type ColorItem } from '../../components/admin/ColorPalette';
import Dropdown from '../../components/admin/Dropdown';
import FileUpload from '../../components/admin/FileUpload';
import {
  HiOutlinePencil, HiOutlineTrash, HiOutlinePlus, HiXMark,
  HiOutlineMagnifyingGlass, HiChevronLeft, HiChevronRight,
  HiArrowsRightLeft, HiArrowPath, HiOutlineArchiveBox, HiOutlineSquare2Stack,
  HiStar,
} from 'react-icons/hi2';
import ProductPicker from '../../components/admin/ProductPicker';

interface NbrbRates { usd: number; rub100: number; fetchedAt: number }
let ratesCache: NbrbRates | null = null;

function lastScheduledMs(): number {
  const now = new Date();
  const t = (h: number, d = 0) => { const x = new Date(now); x.setDate(x.getDate() + d); x.setHours(h, 0, 0, 0); return x.getTime(); };
  if (now.getTime() >= t(20)) return t(20);
  if (now.getTime() >= t(8))  return t(8);
  return t(20, -1);
}

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
  inStock: boolean; isNew: boolean; categoryId: number; isArchived: boolean;
  category?: { nameRu: string };
  isCostume?: boolean;
  costumeTopId?: number | null; costumeBottomId?: number | null;
  costumeItem3Id?: number | null; costumeItem4Id?: number | null; costumeItem5Id?: number | null;
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
  isCostume: false,
  costumeTopId: null as number | null,
  costumeBottomId: null as number | null,
  costumeItem3Id: null as number | null,
  costumeItem4Id: null as number | null,
  costumeItem5Id: null as number | null,
  costumeLabel1: '' as string,
  costumeLabel2: '' as string,
  costumeLabel3: '' as string,
  costumeLabel4: '' as string,
  costumeLabel5: '' as string,
  additionalCategoryIds: [] as number[],
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
  const [uploadingImages, setUploadingImages] = useState(false);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryRu, setNewCategoryRu] = useState('');
  const [newCategoryEn, setNewCategoryEn] = useState('');
  const [rates, setRates] = useState<NbrbRates | null>(ratesCache);
  const [ratesLoading, setRatesLoading] = useState(false);

  // Multi-select state
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // Feature 1: drag-and-drop — ref to avoid stale closure
  const dragImgIdx = useRef<number | null>(null);
  const [dragOver, setDragOver] = useState<number | null>(null);

  // Feature 5: replace individual image
  const replaceRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Feature 2: extra costume slots (0 = only top+bottom, up to 3 more)
  const [extraCostumeSlots, setExtraCostumeSlots] = useState(0);

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

  const loadAll = useCallback(async () => {
    const r = await api.get('/products', { params: { limit: 999 } });
    setAllProducts(r.data.products);
  }, []);

  useEffect(() => {
    api.get('/categories').then((r) => setCategories(r.data));
    loadAll();
  }, [loadAll]);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const doFetch = () => { fetchNbrbRates().then(setRates).catch(() => {}); };
    const schedule = () => { const delay = msUntilNext(); timer = setTimeout(() => { doFetch(); schedule(); }, delay); };
    doFetch(); schedule();
    return () => clearTimeout(timer);
  }, []);

  const calcPrices = () => {
    if (!rates || !editing) return;
    const { usd: usdRate, rub100: rub100Rate } = rates;
    const bynPerRub = rub100Rate / 100;
    const hasByn = !!parseFloat(editing.priceByn);
    const hasUsd = !!parseFloat(editing.priceUsd);
    const hasRub = !!parseFloat(editing.priceRub);
    let byn = 0;
    if (hasByn) byn = parseFloat(editing.priceByn);
    else if (hasUsd) byn = parseFloat(editing.priceUsd) * usdRate;
    else return;
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
        costumeItem3Id: product.costumeItem3Id || null,
        costumeItem4Id: product.costumeItem4Id || null,
        costumeItem5Id: product.costumeItem5Id || null,
        additionalCategoryIds: (product.additionalCategories || []).map((ac: any) => ac.categoryId),
      });
      setEditColors(parseColors(product.colors || []));
      setEditLabels(product.labels || []);
      // Determine how many extra slots to show
      let extra = 0;
      if (product.costumeItem3Id) extra = 1;
      if (product.costumeItem4Id) extra = 2;
      if (product.costumeItem5Id) extra = 3;
      setExtraCostumeSlots(extra);
    } else {
      setEditing({ ...emptyProduct });
      setEditColors([]);
      setEditLabels([]);
      setExtraCostumeSlots(0);
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
    setExtraCostumeSlots(0);
  };

  const toggleLabel = (label: string) =>
    setEditLabels((prev) => prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]);

  const addCustomLabel = () => {
    const label = customLabel.trim().toUpperCase();
    if (label && !editLabels.includes(label)) setEditLabels([...editLabels, label]);
    setCustomLabel('');
  };

  // Feature 1: set image as main (move to index 0)
  const setMainImage = (idx: number) => {
    if (idx === 0) return;
    setEditing((prev: any) => {
      const imgs = [...prev.images];
      const [moved] = imgs.splice(idx, 1);
      imgs.unshift(moved);
      return { ...prev, images: imgs };
    });
  };

  // Feature 1: drag-and-drop reorder (ref-based — no stale closure)
  const onImgDragStart = (idx: number) => { dragImgIdx.current = idx; };
  const onImgDrop = (idx: number) => {
    const from = dragImgIdx.current;
    dragImgIdx.current = null;
    setDragOver(null);
    if (from === null || from === idx) return;
    setEditing((prev: any) => {
      const imgs = [...prev.images];
      const [moved] = imgs.splice(from, 1);
      imgs.splice(idx, 0, moved);
      return { ...prev, images: imgs };
    });
  };

  // Upload files immediately when selected → add URLs to editing.images
  const handleImageFilesChange = async (newFiles: File[]) => {
    const added = newFiles.slice(images.length);
    if (!added.length) { setImages(newFiles); return; }
    setImages(newFiles);
    setUploadingImages(true);
    try {
      const formData = new FormData();
      added.forEach((f) => formData.append('images', f));
      const res = await api.post('/upload/multiple', formData);
      setEditing((prev: any) => ({ ...prev, images: [...(prev.images || []), ...res.data.urls] }));
      setImages([]);
    } catch (e) {
      console.error('Upload error', e);
    } finally {
      setUploadingImages(false);
    }
  };

  // Feature 5: replace single image
  const replaceImage = async (idx: number, file: File) => {
    const formData = new FormData();
    formData.append('images', file);
    const res = await api.post('/upload/multiple', formData);
    const newUrl = res.data.urls[0];
    setEditing((prev: any) => {
      const imgs = [...prev.images];
      imgs[idx] = newUrl;
      return { ...prev, images: imgs };
    });
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
      costumeItem3Id: editing.isCostume && extraCostumeSlots >= 1 ? (editing.costumeItem3Id ? Number(editing.costumeItem3Id) : null) : null,
      costumeItem4Id: editing.isCostume && extraCostumeSlots >= 2 ? (editing.costumeItem4Id ? Number(editing.costumeItem4Id) : null) : null,
      costumeItem5Id: editing.isCostume && extraCostumeSlots >= 3 ? (editing.costumeItem5Id ? Number(editing.costumeItem5Id) : null) : null,
      additionalCategoryIds: (editing.additionalCategoryIds || []).filter((id: number) => id !== categoryId),
    };

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

  // Multi-select helpers
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

  const bulkAction = async (action: 'archive' | 'delete') => {
    if (!selectedIds.size) return;
    if (action === 'delete' && !confirm(`Удалить ${selectedIds.size} товар(ов)?`)) return;
    setBulkLoading(true);
    try {
      await api.post('/products/bulk', { ids: Array.from(selectedIds), action });
      clearSelection();
      load();
      loadAll();
    } finally {
      setBulkLoading(false);
    }
  };

  const inputClass = 'w-full border border-[#E5E5E3] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C4A882] transition-colors';

  const SkeletonRow = () => (
    <tr className="animate-pulse">
      <td className="px-4 py-3"><div className="w-4 h-4 bg-[#E8DDD0] rounded" /></td>
      <td className="px-4 py-3"><div className="w-10 h-12 bg-[#E8DDD0] rounded-lg" /></td>
      <td className="px-4 py-3"><div className="h-3 bg-[#E8DDD0] rounded w-40 mb-1" /><div className="h-2.5 bg-[#E8DDD0] rounded w-20" /></td>
      <td className="px-4 py-3"><div className="h-3 bg-[#E8DDD0] rounded w-24" /></td>
      <td className="px-4 py-3"><div className="h-3 bg-[#E8DDD0] rounded w-16" /></td>
      <td className="px-4 py-3"><div className="flex gap-1">{[0,1,2].map(i=><div key={i} className="w-5 h-5 rounded-full bg-[#E8DDD0]" />)}</div></td>
      <td className="px-4 py-3"><div className="h-3 bg-[#E8DDD0] rounded w-10" /></td>
      <td className="px-4 py-3 text-right"><div className="h-3 bg-[#E8DDD0] rounded w-20 ml-auto" /></td>
    </tr>
  );

  const costumeSlotLabels = ['Верх', 'Низ', 'Позиция 3', 'Позиция 4', 'Позиция 5'];
  const costumeSlotKeys = ['costumeTopId', 'costumeBottomId', 'costumeItem3Id', 'costumeItem4Id', 'costumeItem5Id'] as const;

  return (
    <AdminLayout>
      {/* Header row */}
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <h1 className="text-xl sm:text-2xl font-semibold">Товары</h1>
        <span className="text-sm text-[#6B6B6B]">{total > 0 && `${total} шт.`}</span>
        <Link
          to="/lansadmin/archive"
          className="flex items-center gap-1.5 text-sm text-[#6B6B6B] hover:text-[#1A1A1A] border border-[#E5E5E3] px-3 py-2 rounded-xl transition-colors"
        >
          <HiOutlineArchiveBox className="w-4 h-4" />
          Архив
        </Link>
        <button
          onClick={() => startEdit()}
          className="ml-auto flex items-center gap-1.5 bg-[#1A1A1A] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#333] transition-colors"
        >
          <HiOutlinePlus className="w-4 h-4" />
          <span className="hidden sm:inline">Добавить</span>
        </button>
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 mb-4 bg-[#F5F0EB] border border-[#E5E5E3] rounded-2xl px-4 py-3">
          <span className="text-sm font-medium text-[#1A1A1A]">Выбрано: {selectedIds.size}</span>
          <div className="flex gap-2 ml-auto">
            <button
              onClick={() => bulkAction('archive')}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-[#1A1A1A] text-white hover:bg-[#333] disabled:opacity-50 transition-colors"
            >
              <HiOutlineArchiveBox className="w-4 h-4" />
              В архив
            </button>
            <button
              onClick={() => bulkAction('delete')}
              disabled={bulkLoading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium bg-red-500 text-white hover:bg-red-600 disabled:opacity-50 transition-colors"
            >
              <HiOutlineTrash className="w-4 h-4" />
              Удалить
            </button>
            <button
              onClick={clearSelection}
              className="px-4 py-2 rounded-xl text-sm border border-[#E5E5E3] hover:bg-white transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}

      {/* Filters bar */}
      <div className="flex flex-wrap gap-3 mb-5">
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

        <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)}
          className="border border-[#E5E5E3] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4A882] bg-white">
          <option value="">Все категории</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.nameRu}</option>)}
        </select>

        <select value={filterStock} onChange={(e) => setFilterStock(e.target.value)}
          className="border border-[#E5E5E3] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4A882] bg-white">
          <option value="">Все</option>
          <option value="in">В наличии</option>
        </select>

        <select value={sort} onChange={(e) => setSort(e.target.value)}
          className="border border-[#E5E5E3] rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-[#C4A882] bg-white">
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

          {/* Additional categories */}
          {categories.length > 1 && (
            <div>
              <label className="text-xs text-[#6B6B6B] mb-2 block">Также показывать в категориях</label>
              <div className="flex flex-wrap gap-2">
                {categories
                  .filter((c) => c.id !== Number(editing.categoryId))
                  .map((c) => {
                    const selected = (editing.additionalCategoryIds || []).includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => {
                          const prev: number[] = editing.additionalCategoryIds || [];
                          setEditing({
                            ...editing,
                            additionalCategoryIds: selected
                              ? prev.filter((id: number) => id !== c.id)
                              : [...prev, c.id],
                          });
                        }}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
                          selected
                            ? 'bg-[#1A1A1A] text-white border-[#1A1A1A]'
                            : 'border-[#E5E5E3] text-[#6B6B6B] hover:border-[#C4A882] hover:text-[#1A1A1A]'
                        }`}
                      >
                        {c.nameRu}
                      </button>
                    );
                  })}
              </div>
            </div>
          )}

          {/* Costume checkbox */}
          {(editing.categoryId || creatingCategory) && (
            <div>
              <label className="inline-flex items-center gap-2.5 text-sm cursor-pointer select-none group">
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${editing.isCostume ? 'bg-[#7C5C9A] border-[#7C5C9A]' : 'border-[#E5E5E3] group-hover:border-[#7C5C9A]'}`}>
                  {editing.isCostume && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  )}
                </div>
                <input type="checkbox" className="sr-only" checked={editing.isCostume || false}
                  onChange={(e) => setEditing({
                    ...editing, isCostume: e.target.checked,
                    costumeTopId: null, costumeBottomId: null,
                    costumeItem3Id: null, costumeItem4Id: null, costumeItem5Id: null,
                  })}
                />
                <span className="font-medium">Это костюм / набор</span>
                <span className="text-[#6B6B6B] font-normal text-xs">(несколько товаров как комплект)</span>
              </label>
            </div>
          )}

          {/* Feature 2: costume items up to 5 */}
          {editing.isCostume && (
            <div className="bg-gradient-to-br from-[#F8F5FC] to-[#F0EBF8] border border-[#D4BFEF] rounded-2xl p-4 space-y-4">
              <p className="text-sm font-medium text-[#7C5C9A]">Состав костюма</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {Array.from({ length: 2 + extraCostumeSlots }).map((_, slotIdx) => {
                  const labelKey = `costumeLabel${slotIdx + 1}` as keyof typeof editing;
                  return (
                    <div key={slotIdx} className="relative space-y-1.5">
                      <div className="flex items-center justify-between">
                        <label className="text-xs text-[#6B6B6B]">Позиция {slotIdx + 1}</label>
                        {slotIdx >= 2 && slotIdx === 1 + extraCostumeSlots && (
                          <button
                            type="button"
                            onClick={() => {
                              setEditing({ ...editing, [costumeSlotKeys[slotIdx]]: null, [labelKey]: '' });
                              setExtraCostumeSlots(extraCostumeSlots - 1);
                            }}
                            className="text-[#6B6B6B] hover:text-red-500 transition-colors"
                          >
                            <HiXMark className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        placeholder={`Подпись (по умолчанию: Позиция ${slotIdx + 1})`}
                        value={(editing[labelKey] as string) || ''}
                        onChange={(e) => setEditing({ ...editing, [labelKey]: e.target.value })}
                        className="w-full border border-[#E5E5E3] rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-[#C4A882] transition-colors"
                      />
                      <ProductPicker
                        value={editing[costumeSlotKeys[slotIdx]]}
                        onChange={(id) => setEditing({ ...editing, [costumeSlotKeys[slotIdx]]: id })}
                        products={allProducts.filter((p) => p.id !== editing.id && !p.isCostume)}
                        placeholder="— выберите товар —"
                      />
                    </div>
                  );
                })}
              </div>
              {extraCostumeSlots < 3 && (
                <button
                  type="button"
                  onClick={() => setExtraCostumeSlots(extraCostumeSlots + 1)}
                  className="flex items-center gap-1.5 text-xs text-[#7C5C9A] hover:text-[#5C3A7A] transition-colors font-medium"
                >
                  <HiOutlinePlus className="w-3.5 h-3.5" />
                  Добавить ещё
                </button>
              )}
              <p className="text-xs text-[#6B6B6B]">Цена костюма ниже — за весь комплект.</p>
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
                <button type="button" onClick={refreshRates} title="Обновить курс НБ РБ"
                  className="flex items-center gap-1 text-[11px] text-[#C4A882] hover:text-[#A68E6A] transition-colors">
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
              <button type="button" onClick={calcPrices}
                disabled={!rates || (!editing.priceByn && !editing.priceUsd)}
                title={rates ? 'Рассчитать пустые поля по курсу НБ РБ' : 'Курс не загружен'}
                className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl border border-[#E5E5E3] text-sm hover:border-[#C4A882] hover:text-[#C4A882] transition-colors disabled:opacity-30 disabled:cursor-not-allowed whitespace-nowrap flex-shrink-0">
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

          {/* Feature 1 + 5: Images with drag, main star, replace */}
          <div>
            <p className="text-sm font-medium mb-2">Фотографии</p>
            {editing.images?.length > 0 && (
              <div className="flex gap-3 flex-wrap mb-3">
                {editing.images.map((img: string, i: number) => (
                  <div
                    key={i}
                    className={`flex flex-col items-center gap-1.5 cursor-grab active:cursor-grabbing select-none transition-opacity ${dragOver === i ? 'opacity-40 ring-2 ring-[#C4A882] rounded-xl' : ''}`}
                    draggable
                    onDragStart={() => onImgDragStart(i)}
                    onDragOver={(e) => { e.preventDefault(); setDragOver(i); }}
                    onDragLeave={() => setDragOver(null)}
                    onDrop={() => onImgDrop(i)}
                    onDragEnd={() => { dragImgIdx.current = null; setDragOver(null); }}
                  >
                    {/* Image + main badge */}
                    <div className="relative">
                      <ImgWithSkeleton src={img} className="w-16 h-20 rounded-lg border border-[#E5E5E3]" />
                      {i === 0 && (
                        <span className="absolute top-0.5 left-0.5 bg-[#C4A882] text-white text-[9px] px-1 py-0.5 rounded font-medium leading-none pointer-events-none">
                          Гл.
                        </span>
                      )}
                    </div>

                    {/* Always-visible controls */}
                    <div className="flex gap-1">
                      {i !== 0 && (
                        <button
                          type="button"
                          title="Сделать главной"
                          onClick={() => setMainImage(i)}
                          className="w-7 h-7 rounded-lg bg-[#F5F0EB] hover:bg-[#C4A882] hover:text-white text-[#C4A882] flex items-center justify-center transition-colors"
                        >
                          <HiStar className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        title="Заменить фото"
                        onClick={() => replaceRefs.current[i]?.click()}
                        className="w-7 h-7 rounded-lg bg-[#F5F0EB] hover:bg-[#1A1A1A] hover:text-white text-[#6B6B6B] flex items-center justify-center transition-colors"
                      >
                        <HiOutlinePencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        title="Удалить"
                        onClick={() => setEditing((prev: any) => ({ ...prev, images: prev.images.filter((_: string, j: number) => j !== i) }))}
                        className="w-7 h-7 rounded-lg bg-red-50 hover:bg-red-500 hover:text-white text-red-400 flex items-center justify-center transition-colors"
                      >
                        <HiXMark className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Hidden file input for replace */}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      ref={(el) => { replaceRefs.current[i] = el; }}
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) await replaceImage(i, file);
                        e.target.value = '';
                      }}
                    />
                  </div>
                ))}
              </div>
            )}
            {editing.images?.length > 1 && (
              <p className="text-[11px] text-[#6B6B6B] mb-2">⠿ Перетащите для изменения порядка · ⭐ главная · ✏ заменить</p>
            )}
            <div className="relative">
              <FileUpload files={images} onChange={handleImageFilesChange} />
              {uploadingImages && (
                <div className="absolute inset-0 bg-white/70 rounded-xl flex items-center justify-center">
                  <HiArrowPath className="w-5 h-5 text-[#C4A882] animate-spin" />
                </div>
              )}
            </div>
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
          const isSelected = selectedIds.has(p.id);
          return (
            <div
              key={p.id}
              className={`bg-white rounded-2xl p-4 border transition-colors ${isSelected ? 'border-[#C4A882] bg-[#FDFAF7]' : 'border-[#E5E5E3]'}`}
            >
              <div className="flex gap-3">
                {/* Checkbox */}
                <div className="flex-shrink-0 pt-1">
                  <button
                    type="button"
                    onClick={() => toggleSelect(p.id)}
                    className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-[#C4A882] border-[#C4A882]' : 'border-[#D1D5DB]'}`}
                  >
                    {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                  </button>
                </div>
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
              <th className="text-left px-4 py-3.5 font-medium text-[#6B6B6B] w-10">
                <button
                  type="button"
                  onClick={selectAll}
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${selectedIds.size === products.length && products.length > 0 ? 'bg-[#C4A882] border-[#C4A882]' : 'border-[#D1D5DB]'}`}
                >
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
                const isSelected = selectedIds.has(p.id);
                return (
                  <tr key={p.id} className={`transition-colors ${isSelected ? 'bg-[#FDFAF7]' : 'hover:bg-gray-50/50'}`}>
                    <td className="px-4 py-3">
                      <button
                        type="button"
                        onClick={() => toggleSelect(p.id)}
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? 'bg-[#C4A882] border-[#C4A882]' : 'border-[#D1D5DB]'}`}
                      >
                        {isSelected && <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </button>
                    </td>
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
                    <td className="px-4 py-3 text-right whitespace-nowrap">
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
