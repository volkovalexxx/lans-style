import { useState, useEffect } from 'react';
import api from '../../api/client';
import { AdminLayout } from './Dashboard';
import { HiOutlinePencil, HiOutlineTrash, HiOutlinePlus } from 'react-icons/hi2';

interface Category {
  id: number;
  slug: string;
  nameRu: string;
  nameEn: string;
  image?: string;
  order: number;
  _count?: { products: number };
}

export default function AdminCategories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<any>(null);

  const load = () => api.get('/categories').then((r) => setCategories(r.data));
  useEffect(() => { load(); }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = { nameRu: editing.nameRu, nameEn: editing.nameEn, image: editing.image };
    if (editing.id) {
      await api.put(`/categories/${editing.id}`, data);
    } else {
      await api.post('/categories', data);
    }
    setEditing(null);
    load();
  };

  const handleDelete = async (cat: Category) => {
    const count = cat._count?.products ?? 0;
    const message = count > 0
      ? `Удалить категорию «${cat.nameRu}»?\n\nВнимание: вместе с ней будут удалены ${count} ${count === 1 ? 'товар' : count < 5 ? 'товара' : 'товаров'} и связанные с ними позиции в заказах. Это действие нельзя отменить.`
      : `Удалить категорию «${cat.nameRu}»?`;
    if (!confirm(message)) return;
    await api.delete(`/categories/${cat.id}`);
    load();
  };

  const inputClass = "w-full border border-[#E5E5E3] rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:border-[#C4A882] transition-colors";

  return (
    <AdminLayout>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-xl sm:text-2xl font-semibold">Категории</h1>
        <button
          onClick={() => setEditing({ nameRu: '', nameEn: '', image: '' })}
          className="flex items-center gap-1.5 bg-[#1A1A1A] text-white px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-[#333] transition-colors"
        >
          <HiOutlinePlus className="w-4 h-4" />
          <span className="hidden sm:inline">Добавить</span>
        </button>
      </div>

      {editing && (
        <form onSubmit={handleSave} className="bg-white p-4 sm:p-6 rounded-2xl mb-6 space-y-4 border border-[#E5E5E3]">
          <h3 className="font-medium text-lg">{editing.id ? 'Редактировать категорию' : 'Новая категория'}</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[#6B6B6B] mb-1 block">Название (RU) *</label>
              <input value={editing.nameRu} onChange={(e) => setEditing({ ...editing, nameRu: e.target.value })} className={inputClass} required />
            </div>
            <div>
              <label className="text-xs text-[#6B6B6B] mb-1 block">Name (EN) *</label>
              <input value={editing.nameEn} onChange={(e) => setEditing({ ...editing, nameEn: e.target.value })} className={inputClass} required />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="bg-[#1A1A1A] text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-[#333] transition-colors">Сохранить</button>
            <button type="button" onClick={() => setEditing(null)} className="border border-[#E5E5E3] px-6 py-2.5 rounded-xl text-sm hover:bg-gray-50 transition-colors">Отмена</button>
          </div>
        </form>
      )}

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {categories.map((c) => (
          <div key={c.id} className="bg-white rounded-2xl p-4 border border-[#E5E5E3]">
            <div className="flex items-center justify-between mb-2">
              <p className="font-medium">{c.nameRu}</p>
              <span className="text-xs text-[#6B6B6B] bg-gray-100 px-2 py-1 rounded-full">{c._count?.products ?? 0} товаров</span>
            </div>
            <p className="text-sm text-[#6B6B6B] mb-3">{c.nameEn}</p>
            <div className="flex gap-3 pt-3 border-t border-[#E5E5E3]">
              <button onClick={() => setEditing(c)} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium text-[#C4A882] bg-[#F5F0EB] hover:bg-[#EDE5D8] transition-colors">
                <HiOutlinePencil className="w-3.5 h-3.5" /> Редактировать
              </button>
              <button onClick={() => handleDelete(c)} className="flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-red-500 bg-red-50 hover:bg-red-100 transition-colors">
                <HiOutlineTrash className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-2xl overflow-hidden border border-[#E5E5E3]">
        <table className="w-full text-sm">
          <thead className="bg-gray-50/80">
            <tr>
              <th className="text-left px-4 py-3.5 font-medium text-[#6B6B6B]">Название</th>
              <th className="text-left px-4 py-3.5 font-medium text-[#6B6B6B]">Товаров</th>
              <th className="text-right px-4 py-3.5 font-medium text-[#6B6B6B]">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E5E3]">
            {categories.map((c) => (
              <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3 font-medium">{c.nameRu} <span className="text-[#6B6B6B] font-normal">/ {c.nameEn}</span></td>
                <td className="px-4 py-3">{c._count?.products ?? 0}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => setEditing(c)} className="text-[#C4A882] hover:underline mr-3">Ред.</button>
                  <button onClick={() => handleDelete(c)} className="text-red-500 hover:underline">Удалить</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </AdminLayout>
  );
}
