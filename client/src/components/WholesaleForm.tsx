import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../api/client';

export default function WholesaleForm() {
  const { t } = useTranslation();
  const [form, setForm] = useState({
    company: '', name: '', phone: '', email: '', city: '', comment: '',
  });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    try {
      await api.post('/wholesale', form);
      setStatus('success');
    } catch {
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="text-center py-8">
        <div className="text-4xl mb-4">✓</div>
        <p className="text-lg font-medium">{t('wholesale.success')}</p>
      </div>
    );
  }

  const inputClass = "w-full border border-[#E5E5E3] rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#C4A882] transition-colors";

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-lg">
      <input type="text" placeholder={t('wholesale.company')} required value={form.company}
        onChange={(e) => setForm({ ...form, company: e.target.value })} className={inputClass} />
      <input type="text" placeholder={t('wholesale.name')} required value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })} className={inputClass} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input type="tel" placeholder={t('wholesale.phone')} required value={form.phone}
          onChange={(e) => setForm({ ...form, phone: e.target.value })} className={inputClass} />
        <input type="email" placeholder={t('wholesale.email')} required value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass} />
      </div>
      <input type="text" placeholder={t('wholesale.city')} value={form.city}
        onChange={(e) => setForm({ ...form, city: e.target.value })} className={inputClass} />
      <textarea placeholder={t('wholesale.comment')} value={form.comment}
        onChange={(e) => setForm({ ...form, comment: e.target.value })} rows={3}
        className={`${inputClass} resize-none`} />

      {status === 'error' && <p className="text-red-500 text-sm">{t('wholesale.error')}</p>}

      <button type="submit" disabled={status === 'loading'}
        className="w-full bg-[#C4A882] text-white py-3 rounded-xl text-sm font-medium hover:bg-[#A68E6A] transition-colors disabled:opacity-50">
        {status === 'loading' ? '...' : t('wholesale.submit')}
      </button>
    </form>
  );
}
