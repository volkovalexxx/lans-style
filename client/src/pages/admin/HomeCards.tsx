import { useState, useEffect, useRef } from 'react';
import api from '../../api/client';
import { AdminLayout } from './Dashboard';
import { HiOutlinePencil, HiOutlinePhoto, HiOutlineArrowPath, HiXMark, HiCheck } from 'react-icons/hi2';

interface Category { id: number; nameRu: string; nameEn: string; }

interface HomeCard {
  id: number;
  position: number;
  categoryId: number | null;
  imageUrl: string | null;
  imageSource: 'latest' | 'custom';
  resolvedImage: string | null;
  category: (Category & { _count: { products: number } }) | null;
}

export default function AdminHomeCards() {
  const [cards, setCards] = useState<HomeCard[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activePos, setActivePos] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [form, setForm] = useState<{ categoryId: string; imageSource: 'latest' | 'custom'; imageUrl: string }>({
    categoryId: '', imageSource: 'latest', imageUrl: '',
  });
  const fileRef = useRef<HTMLInputElement>(null);

  const load = () =>
    api.get('/home-cards').then((r) => setCards(r.data));

  useEffect(() => {
    load();
    api.get('/categories').then((r) => setCategories(r.data));
  }, []);

  const openCard = (card: HomeCard) => {
    setActivePos(card.position);
    setForm({
      categoryId: card.categoryId ? String(card.categoryId) : '',
      imageSource: card.imageSource as 'latest' | 'custom',
      imageUrl: card.imageUrl || '',
    });
  };

  const close = () => setActivePos(null);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await api.post('/upload', fd);
      setForm((f) => ({ ...f, imageUrl: res.data.url, imageSource: 'custom' }));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (activePos === null) return;
    setSaving(true);
    try {
      await api.put(`/home-cards/${activePos}`, {
        categoryId: form.categoryId ? Number(form.categoryId) : null,
        imageUrl: form.imageSource === 'custom' ? form.imageUrl : null,
        imageSource: form.imageSource,
      });
      await load();
      close();
    } finally {
      setSaving(false);
    }
  };

  const activeCard = activePos !== null ? cards.find((c) => c.position === activePos) : null;

  const cardPreviewImage = (card: HomeCard) => {
    if (activePos === card.position) {
      if (form.imageSource === 'custom' && form.imageUrl) return form.imageUrl;
      const cat = categories.find((c) => String(c.id) === form.categoryId);
      const cardData = cards.find((c) => c.position === card.position);
      return cardData?.resolvedImage || null;
    }
    return card.resolvedImage;
  };

  const cardCategoryName = (card: HomeCard) => {
    if (activePos === card.position && form.categoryId) {
      const cat = categories.find((c) => String(c.id) === form.categoryId);
      return cat?.nameRu || '—';
    }
    return card.category?.nameRu || '—';
  };

  const featured = cards[0];
  const rest = cards.slice(1, 5);

  return (
    <AdminLayout>
      <div className="mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold mb-1">Главная — блок категорий</h1>
        <p className="text-sm text-[#6B6B6B]">Нажмите на карточку, чтобы настроить категорию и фото</p>
      </div>

      {/* Bento preview — identical layout to home page */}
      <div className="grid grid-cols-2 md:grid-cols-4 auto-rows-[180px] md:auto-rows-[220px] gap-3 md:gap-4 mb-6">
        {/* Featured (large) */}
        {featured && (
          <BentoAdminCard
            card={featured}
            previewImage={cardPreviewImage(featured)}
            label={cardCategoryName(featured)}
            featured
            active={activePos === featured.position}
            onClick={() => activePos === featured.position ? close() : openCard(featured)}
            className="col-span-2 row-span-2"
          />
        )}

        {/* Small cards */}
        {rest.map((card) => (
          <BentoAdminCard
            key={card.position}
            card={card}
            previewImage={cardPreviewImage(card)}
            label={cardCategoryName(card)}
            active={activePos === card.position}
            onClick={() => activePos === card.position ? close() : openCard(card)}
            className="col-span-1 row-span-1"
          />
        ))}
      </div>

      {/* Settings panel */}
      {activePos !== null && (
        <div className="bg-white border border-[#E5E5E3] rounded-2xl p-5 sm:p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-lg">
              {activePos === 0 ? 'Большая карточка (позиция 1)' : `Малая карточка (позиция ${activePos + 1})`}
            </h2>
            <button onClick={close} className="text-[#6B6B6B] hover:text-[#1A1A1A]">
              <HiXMark className="w-5 h-5" />
            </button>
          </div>

          {/* Category select */}
          <div>
            <label className="text-xs text-[#6B6B6B] mb-1.5 block font-medium uppercase tracking-wide">Категория</label>
            <select
              value={form.categoryId}
              onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              className="w-full border border-[#E5E5E3] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C4A882] transition-colors"
            >
              <option value="">— не выбрана —</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.nameRu}</option>
              ))}
            </select>
          </div>

          {/* Image source */}
          <div>
            <label className="text-xs text-[#6B6B6B] mb-2 block font-medium uppercase tracking-wide">Изображение</label>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, imageSource: 'latest' }))}
                className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                  form.imageSource === 'latest'
                    ? 'border-[#C4A882] bg-[#F5F0EB] text-[#1A1A1A]'
                    : 'border-[#E5E5E3] hover:border-[#C4A882] text-[#6B6B6B]'
                }`}
              >
                <HiOutlineArrowPath className="w-4 h-4 flex-shrink-0" />
                <span>Последний товар категории</span>
                {form.imageSource === 'latest' && <HiCheck className="w-4 h-4 ml-auto text-[#C4A882]" />}
              </button>
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, imageSource: 'custom' }))}
                className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-xl border text-sm font-medium transition-colors ${
                  form.imageSource === 'custom'
                    ? 'border-[#C4A882] bg-[#F5F0EB] text-[#1A1A1A]'
                    : 'border-[#E5E5E3] hover:border-[#C4A882] text-[#6B6B6B]'
                }`}
              >
                <HiOutlinePhoto className="w-4 h-4 flex-shrink-0" />
                <span>Своё изображение</span>
                {form.imageSource === 'custom' && <HiCheck className="w-4 h-4 ml-auto text-[#C4A882]" />}
              </button>
            </div>
          </div>

          {/* Custom image upload/preview */}
          {form.imageSource === 'custom' && (
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }}
              />
              {form.imageUrl ? (
                <div className="relative w-40 h-48 rounded-xl overflow-hidden border border-[#E5E5E3]">
                  <img src={form.imageUrl} alt="" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileRef.current?.click()}
                      className="bg-white text-[#1A1A1A] text-xs px-3 py-1.5 rounded-lg font-medium"
                    >
                      Изменить
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, imageUrl: '' }))}
                      className="bg-red-500 text-white text-xs px-2 py-1.5 rounded-lg font-medium"
                    >
                      <HiXMark className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  disabled={uploading}
                  className="flex items-center gap-2 border-2 border-dashed border-[#E5E5E3] rounded-xl px-6 py-4 text-sm text-[#6B6B6B] hover:border-[#C4A882] hover:text-[#C4A882] transition-colors"
                >
                  <HiOutlinePhoto className="w-5 h-5" />
                  {uploading ? 'Загрузка...' : 'Загрузить изображение'}
                </button>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#1A1A1A] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-50"
            >
              {saving ? 'Сохранение...' : 'Сохранить'}
            </button>
            <button
              onClick={close}
              className="border border-[#E5E5E3] px-6 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors"
            >
              Отмена
            </button>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}

interface BentoAdminCardProps {
  card: HomeCard;
  previewImage: string | null | undefined;
  label: string;
  featured?: boolean;
  active?: boolean;
  onClick: () => void;
  className?: string;
}

function BentoAdminCard({ previewImage, label, featured, active, onClick, className = '' }: BentoAdminCardProps) {
  return (
    <div className={`relative cursor-pointer ${className}`} onClick={onClick}>
      <div
        className={`group relative w-full h-full overflow-hidden rounded-2xl md:rounded-3xl bg-[#F5F0EB] transition-all ${
          active ? 'ring-2 ring-[#C4A882] ring-offset-2' : 'hover:ring-2 hover:ring-[#C4A882]/50 hover:ring-offset-1'
        }`}
      >
        {previewImage ? (
          <img src={previewImage} alt={label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#F5F0EB] via-[#E8DDD0] to-[#D4BC9A]/50">
            <span className="font-display text-[#C4A882] text-6xl md:text-8xl opacity-40">
              {label[0] || '?'}
            </span>
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className={`absolute inset-0 flex flex-col justify-end ${featured ? 'p-5 md:p-7' : 'p-3 md:p-4'}`}>
          <p className={`text-white font-semibold font-display leading-tight ${featured ? 'text-xl md:text-3xl' : 'text-sm md:text-base'}`}>
            {label}
          </p>
        </div>

        {/* Edit badge */}
        <div className={`absolute top-2 right-2 md:top-3 md:right-3 flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
          active
            ? 'bg-[#C4A882] text-white'
            : 'bg-white/80 text-[#1A1A1A] opacity-0 group-hover:opacity-100'
        }`}>
          <HiOutlinePencil className="w-3 h-3" />
          {active ? 'Редактируется' : 'Изменить'}
        </div>
      </div>
    </div>
  );
}
