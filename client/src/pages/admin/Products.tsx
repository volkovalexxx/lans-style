import { useState, useEffect } from 'react';
import api from '../../api/client';
import { AdminLayout } from './Dashboard';
import ColorPalette, { type ColorItem } from '../../components/admin/ColorPalette';
import Dropdown from '../../components/admin/Dropdown';
import FileUpload from '../../components/admin/FileUpload';
import { HiOutlinePencil, HiOutlineTrash, HiOutlinePlus, HiXMark, HiOutlineMagnifyingGlass } from 'react-icons/hi2';

interface Product {
  id: number;
  slug: string;
  sku?: string | null;
  nameRu: string;
  nameEn: string;
  priceByn: string;
  priceUsd: string;
  priceRub: string;
  sizes: string[];
  colors: string[];
  labels: string[];
  images: string[];
  inStock: boolean;
  isNew: boolean;
  categoryId: number;
  category?: { nameRu: string };
}

interface Category {
  id: number;
  nameRu: string;
}

function parseColors(colors: string[]): ColorItem[] {
  return colors.map((c) => {
    try {
      const parsed = JSON.parse(c);
      if (parsed.hex && parsed.name) return parsed;
    } catch {}
    return { hex: c, name: c };
  });
}

function serializeColors(colors: ColorItem[]): string[] {
  return colors.map((c) => JSON.stringify(c));
}

const PRESET_LABELS = ['NEW', 'SALE', 'HIT', 'TOP', '-10%', '-20%', '-30%', '-50%'];

const labelStyles: Record<string, string> = {
  NEW: 'bg-[#1A1A1A] text-white',
  SALE: 'bg-red-500 text-white',
  HIT: 'bg-[#C4A882] text-white',
  TOP: 'bg-purple-500 text-white',
};

function getLabelStyle(label: string): string {
  if (label.startsWith('-') && label.endsWith('%')) return 'bg-red-500 text-white';
  return labelStyles[label] || 'bg-[#6B6B6B] text-white';
}

const emptyProduct = {
  sku: '',
  nameRu: '', nameEn: '', descRu: '', descEn: '',
  priceByn: '', priceUsd: '', priceRub: '', sizes: '',
  inStock: true, isNew: false, categoryId: 0,
  labels: [] as string[],
  images: [] as string[],
};

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<any>(null);
  const [search, setSearch] = useState('');
  const [editColors, setEditColors] = useState<ColorItem[]>([]);
  const [editLabels, setEditLabels] = useState<string[]>([]);
  const [customLabel, setCustomLabel] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [newCategoryRu, setNewCategoryRu] = useState('');
  const [newCategoryEn, setNewCategoryEn] = useState('');

  const load = () => {
    const params: any = { limit: 100 };
    if (search.trim()) params.search = search.trim();
    api.get('/products', { params }).then((r) => setProducts(r.data.products));
    api.get('/categories').then((r) => setCategories(r.data));
  };

  useEffect(() => {
    const t = setTimeout(() => load(), 250);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const startEdit = (product?: any) => {
    if (product) {
      setEditing({
        ...product,
        sizes: Array.isArray(product.sizes) ? product.sizes.join(', ') : product.sizes,
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
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditColors([]);
    setEditLabels([]);
    setImages([]);
    setCustomLabel('');
    setCreatingCategory(false);
    setNewCategoryRu('');
    setNewCategoryEn('');
  };

  const toggleLabel = (label: string) => {
    setEditLabels((prev) =>
      prev.includes(label) ? prev.filter((l) => l !== label) : [...prev, label]
    );
  };

  const addCustomLabel = () => {
    const label = customLabel.trim().toUpperCase();
    if (label && !editLabels.includes(label)) {
      setEditLabels([...editLabels, label]);
    }
    setCustomLabel('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    let categoryId = Number(editing.categoryId);

    // Create new category first if needed
    if (creatingCategory) {
      if (!newCategoryRu.trim() || !newCategoryEn.trim()) {
        alert('Заполните название новой категории на обоих языках');
        return;
      }
      const res = await api.post('/categories', {
        nameRu: newCategoryRu.trim(),
        nameEn: newCategoryEn.trim(),
      });
      categoryId = res.data.id;
      await api.get('/categories').then((r) => setCategories(r.data));
    }

    if (!categoryId) {
      alert('Выберите категорию');
      return;
    }

    const data: any = {
      sku: editing.sku?.trim() || null,
      nameRu: editing.nameRu,
      nameEn: editing.nameEn,
      descRu: editing.descRu,
      descEn: editing.descEn,
      priceByn: Number(editing.priceByn),
      priceUsd: Number(editing.priceUsd),
      priceRub: Number(editing.priceRub || 0),
      sizes: typeof editing.sizes === 'string'
        ? editing.sizes.split(',').map((s: string) => s.trim()).filter(Boolean)
        : editing.sizes,
      colors: serializeColors(editColors),
      labels: editLabels,
      inStock: editing.inStock,
      isNew: editLabels.includes('NEW'),
      categoryId,
      images: editing.images || [],
    };

    if (images.length > 0) {
      const formData = new FormData();
      images.forEach((f) => formData.append('images', f));
      const uploadRes = await api.post('/upload/multiple', formData);
      data.images = [...(data.images || []), ...uploadRes.data.urls];
    }

    if (editing.id) {
      await api.put(`/products/${editing.id}`, data);
    } else {
      await api.post('/products', data);
    }

    cancelEdit();
    load();
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить товар?')) return;
    await api.delete(`/products/${id}`);
    load();
  };

  const inputClass = "w-full border border-[#E5E5E3] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C4A882] transition-colors";

  return (
    <AdminLayout>
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold">Товары</h1>
        <div className="relative flex-1 min-w-[180px] max-w-md ml-auto">
          <HiOutlineMagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B6B6B]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по названию или артикулу..."
            className="w-full border border-[#E5E5E3] rounded-xl pl-9 pr-9 py-2.5 text-sm focus:outline-none focus:border-[#C4A882] transition-colors bg-white"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6B6B6B] hover:text-[#1A1A1A]"
            >
              <HiXMark className="w-4 h-4" />
            </button>
          )}
        </div>
        <button
          onClick={() => startEdit()}
          className="flex items-center gap-1.5 bg-[#1A1A1A] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#333] transition-colors"
        >
          <HiOutlinePlus className="w-4 h-4" />
          <span className="hidden sm:inline">Добавить</span>
        </button>
      </div>

      {/* Edit form */}
      {editing && (
        <form onSubmit={handleSave} className="bg-white p-4 sm:p-6 rounded-2xl mb-6 space-y-5 border border-[#E5E5E3]">
          <h3 className="font-medium text-lg">{editing.id ? 'Редактировать товар' : 'Новый товар'}</h3>

          {/* Basic info */}
          <div>
            <label className="text-xs text-[#6B6B6B] mb-1 block">Артикул</label>
            <input
              value={editing.sku || ''}
              onChange={(e) => setEditing({ ...editing, sku: e.target.value })}
              placeholder="Необязательно, например: LS-0042"
              className={`${inputClass} sm:max-w-xs`}
            />
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
              <input placeholder="S, M, L, XL" value={editing.sizes} onChange={(e) => setEditing({ ...editing, sizes: e.target.value })} className={inputClass} />
            </div>
          </div>

          {/* New category inputs */}
          {creatingCategory && (
            <div className="bg-gradient-to-br from-[#FAFAF8] to-[#F5F0EB] border border-[#E5E5E3] rounded-2xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <HiOutlinePlus className="w-4 h-4 text-[#C4A882]" />
                <p className="text-sm font-medium">Новая категория</p>
                <button
                  type="button"
                  onClick={() => { setCreatingCategory(false); setNewCategoryRu(''); setNewCategoryEn(''); }}
                  className="ml-auto text-xs text-[#6B6B6B] hover:text-[#1A1A1A]"
                >
                  <HiXMark className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-[#6B6B6B] mb-1 block">Название категории (RU) *</label>
                  <input
                    value={newCategoryRu}
                    onChange={(e) => setNewCategoryRu(e.target.value)}
                    placeholder="Например: Платья"
                    className={inputClass}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="text-xs text-[#6B6B6B] mb-1 block">Name (EN) *</label>
                  <input
                    value={newCategoryEn}
                    onChange={(e) => setNewCategoryEn(e.target.value)}
                    placeholder="E.g.: Dresses"
                    className={inputClass}
                  />
                </div>
              </div>
              <p className="text-xs text-[#6B6B6B]">Категория будет создана при сохранении товара.</p>
            </div>
          )}

          {/* Prices */}
          <div>
            <label className="text-xs text-[#6B6B6B] mb-2 block">Цены</label>
            <div className="grid grid-cols-3 gap-3">
              <div className="relative">
                <input type="number" step="0.01" placeholder="0.00" value={editing.priceByn} onChange={(e) => setEditing({ ...editing, priceByn: e.target.value })} className={`${inputClass} pr-12`} required />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#6B6B6B] font-medium">BYN</span>
              </div>
              <div className="relative">
                <input type="number" step="0.01" placeholder="0.00" value={editing.priceUsd} onChange={(e) => setEditing({ ...editing, priceUsd: e.target.value })} className={`${inputClass} pr-8`} required />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#6B6B6B] font-medium">$</span>
              </div>
              <div className="relative">
                <input type="number" step="1" placeholder="0" value={editing.priceRub || ''} onChange={(e) => setEditing({ ...editing, priceRub: e.target.value })} className={`${inputClass} pr-8`} />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs text-[#6B6B6B] font-medium">₽</span>
              </div>
            </div>
          </div>

          {/* Description */}
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

          {/* Color palette */}
          <ColorPalette colors={editColors} onChange={setEditColors} />

          {/* Labels */}
          <div>
            <p className="text-sm font-medium mb-2">Метки</p>
            <div className="flex flex-wrap gap-2 mb-3">
              {PRESET_LABELS.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => toggleLabel(label)}
                  className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all ${
                    editLabels.includes(label)
                      ? getLabelStyle(label)
                      : 'bg-gray-100 text-[#6B6B6B] hover:bg-gray-200'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            {/* Custom labels already added */}
            <div className="flex flex-wrap gap-1.5 mb-2">
              {editLabels.filter((l) => !PRESET_LABELS.includes(l)).map((label) => (
                <span key={label} className="inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full bg-[#6B6B6B] text-white font-medium">
                  {label}
                  <button type="button" onClick={() => toggleLabel(label)}>
                    <HiXMark className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
            {/* Add custom */}
            <div className="flex gap-2">
              <input
                type="text"
                value={customLabel}
                onChange={(e) => setCustomLabel(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCustomLabel(); } }}
                placeholder="Своя метка..."
                className="border border-[#E5E5E3] rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-[#C4A882] w-40"
              />
              <button
                type="button"
                onClick={addCustomLabel}
                disabled={!customLabel.trim()}
                className="text-xs px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors disabled:opacity-30"
              >
                Добавить
              </button>
            </div>
          </div>

          {/* Checkboxes */}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input type="checkbox" checked={editing.inStock} onChange={(e) => setEditing({ ...editing, inStock: e.target.checked })} className="rounded" />
            В наличии
          </label>

          {/* Images */}
          <div>
            <p className="text-sm font-medium mb-2">Фотографии</p>

            {/* Already uploaded images */}
            {editing.images?.length > 0 && (
              <div className="flex gap-2 flex-wrap mb-3">
                {editing.images.map((img: string, i: number) => (
                  <div key={i} className="relative group">
                    <img src={img} alt="" className="w-16 h-20 object-cover rounded-lg border border-[#E5E5E3]" />
                    <button
                      type="button"
                      onClick={() => setEditing({ ...editing, images: editing.images.filter((_: string, j: number) => j !== i) })}
                      className="absolute -top-1.5 -right-1.5 bg-red-500 text-white w-5 h-5 rounded-full text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                    >
                      <HiXMark className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            <FileUpload files={images} onChange={setImages} />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="submit" className="bg-[#1A1A1A] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-[#333] transition-colors">
              Сохранить
            </button>
            <button type="button" onClick={cancelEdit} className="border border-[#E5E5E3] px-6 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">
              Отмена
            </button>
          </div>
        </form>
      )}

      {/* Products list - card layout for mobile, table for desktop */}
      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {products.map((p) => {
          const colors = parseColors(p.colors || []);
          const labels = p.labels || (p.isNew ? ['NEW'] : []);
          return (
            <div key={p.id} className="bg-white rounded-2xl p-4 border border-[#E5E5E3]">
              <div className="flex gap-3">
                {p.images[0] ? (
                  <img src={p.images[0]} alt="" className="w-16 h-20 object-cover rounded-lg flex-shrink-0" />
                ) : (
                  <div className="w-16 h-20 bg-[#F5F0EB] rounded-lg flex items-center justify-center text-xs text-[#C4A882] flex-shrink-0">LS</div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{p.nameRu}</p>
                  <p className="text-xs text-[#6B6B6B]">
                    {p.category?.nameRu}
                    {p.sku && <span className="ml-1.5 font-mono">· {p.sku}</span>}
                  </p>
                  <p className="text-sm font-semibold mt-1">{p.priceByn} BYN</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {labels.map((label) => (
                      <span key={label} className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${getLabelStyle(label)}`}>{label}</span>
                    ))}
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${p.inStock ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                      {p.inStock ? 'В наличии' : 'Нет'}
                    </span>
                  </div>
                  {colors.length > 0 && (
                    <div className="flex gap-1 mt-1.5">
                      {colors.map((c, i) => (
                        <span key={i} className="w-4 h-4 rounded-full border border-[#E5E5E3]" style={{ backgroundColor: c.hex }} />
                      ))}
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
            {products.map((p) => {
              const colors = parseColors(p.colors || []);
              const labels = p.labels || (p.isNew ? ['NEW'] : []);
              return (
                <tr key={p.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    {p.images[0] ? (
                      <img src={p.images[0]} alt="" className="w-10 h-12 object-cover rounded-lg" />
                    ) : (
                      <div className="w-10 h-12 bg-[#F5F0EB] rounded-lg flex items-center justify-center text-xs text-[#C4A882]">LS</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {p.nameRu}
                    {p.sku && <div className="text-[11px] font-mono text-[#6B6B6B] font-normal">{p.sku}</div>}
                  </td>
                  <td className="px-4 py-3 text-[#6B6B6B]">{p.category?.nameRu}</td>
                  <td className="px-4 py-3">
                    <div>{p.priceByn} BYN</div>
                    <div className="text-xs text-[#6B6B6B]">${p.priceUsd} / {p.priceRub || 0} ₽</div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {colors.map((c, i) => (
                        <span key={i} className="w-5 h-5 rounded-full border border-[#E5E5E3]" style={{ backgroundColor: c.hex }} title={c.name} />
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {labels.map((label) => (
                        <span key={label} className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getLabelStyle(label)}`}>{label}</span>
                      ))}
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
            })}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
