import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getCookieConsent, setCookieConsent, onOpenCookieSettings, type CookieConsent } from '../utils/cookieConsent';

export default function CookieBanner() {
  const [open, setOpen] = useState(() => getCookieConsent() === null);

  useEffect(() => onOpenCookieSettings(() => setOpen(true)), []);

  if (!open) return null;

  const choose = (v: CookieConsent) => {
    setCookieConsent(v);
    setOpen(false);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[60] p-3 sm:p-4" role="dialog" aria-label="Настройки cookie">
      <div className="max-w-4xl mx-auto bg-white border border-[#E5E5E3] rounded-2xl shadow-lg p-4 sm:p-5 flex flex-col md:flex-row md:items-center gap-4">
        <p className="text-xs sm:text-sm text-[#4A4A4A] leading-relaxed flex-1">
          Мы используем необходимые cookie и локальное хранилище браузера для работы сайта (корзина, избранное,
          язык). С вашего согласия также используем аналитические и рекламные cookie (Meta Pixel). Подробнее — в{' '}
          <Link to="/privacy#cookie" className="underline hover:text-[#C4A882]">
            Политике обработки персональных данных и cookie
          </Link>
          .
        </p>
        <div className="flex flex-col sm:flex-row gap-2 shrink-0">
          <button
            type="button"
            onClick={() => choose('necessary')}
            className="px-4 py-2.5 rounded-xl text-sm border border-[#1A1A1A] text-[#1A1A1A] hover:bg-[#F5F0EB] transition-colors"
          >
            Только необходимые
          </button>
          <button
            type="button"
            onClick={() => choose('all')}
            className="px-4 py-2.5 rounded-xl text-sm bg-[#1A1A1A] text-white hover:bg-[#333] transition-colors"
          >
            Принять все
          </button>
        </div>
      </div>
    </div>
  );
}
