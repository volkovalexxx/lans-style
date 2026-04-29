import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import api from '../api/client';
import { useCartStore } from '../store/cartStore';

export default function OrderForm() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { items, clearCart } = useCartStore();
  const [form, setForm] = useState({ name: '', phone: '', email: '', comment: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.phone) return;

    setStatus('loading');
    try {
      await api.post('/orders', {
        ...form,
        items: items.map((i) => ({
          productId: i.productId,
          size: i.size,
          color: i.color,
          quantity: i.quantity,
        })),
      });
      clearCart();
      navigate('/order-success');
    } catch {
      setStatus('error');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
      <h2 className="text-xl font-display font-semibold">{t('order.title')}</h2>

      <input
        type="text"
        placeholder={t('order.name')}
        required
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        className="w-full border border-[#E5E5E3] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C4A882] transition-colors"
      />

      <input
        type="tel"
        placeholder={t('order.phone')}
        required
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
        className="w-full border border-[#E5E5E3] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C4A882] transition-colors"
      />

      <input
        type="email"
        placeholder={t('order.email')}
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
        className="w-full border border-[#E5E5E3] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C4A882] transition-colors"
      />

      <textarea
        placeholder={t('order.comment')}
        value={form.comment}
        onChange={(e) => setForm({ ...form, comment: e.target.value })}
        rows={3}
        className="w-full border border-[#E5E5E3] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C4A882] transition-colors resize-none"
      />

      {status === 'error' && (
        <p className="text-red-500 text-sm">{t('order.error')}</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-[#1A1A1A] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#333] transition-colors disabled:opacity-50"
      >
        {status === 'loading' ? '...' : t('order.submit')}
      </button>
    </form>
  );
}
